/**
 * Form Autofill API Handlers
 * 
 * Provides REST API endpoints for:
 * - Profile management
 * - Form autofill generation
 * - Template management
 * - PDF generation
 * - Batch operations
 */

import { Request, Response } from 'express';
import {
  autofillEngine,
  type IdentityProfile,
  type AutofillResult,
  type FormTemplate
} from '@/server/form-autofill-engine';
import { PDFGenerationService } from '@/lib/form-processing-utils';
import crypto from 'crypto';

// ============================================================================
// PROFILE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/autofill/profiles
 * Create a new identity profile
 */
export async function handleCreateProfile(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      addressLine1,
      city,
      state,
      postalCode,
      aadhaarNumber,
      panNumber,
      dateOfBirth,
      gender,
      nationality,
      collegeName,
      highestQualification,
      occupation,
      employerName,
      annualIncome
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    // Create profile
    const profile = autofillEngine.createIdentityProfile({
      firstName,
      lastName,
      email,
      phoneNumber,
      addressLine1,
      city,
      state,
      postalCode,
      aadhaarNumber,
      panNumber,
      dateOfBirth,
      gender,
      nationality,
      collegeName,
      highestQualification,
      occupation,
      employerName,
      annualIncome
    });

    res.json({
      success: true,
      profile,
      message: 'Profile created successfully'
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create profile'
    });
  }
}

/**
 * GET /api/autofill/profiles/:profileId
 * Get profile by ID
 */
export async function handleGetProfile(req: Request, res: Response) {
  try {
    const { profileId } = req.params;

    const profile = autofillEngine.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
}

/**
 * DELETE /api/autofill/profiles/:profileId
 * Delete a profile
 */
export async function handleDeleteProfile(req: Request, res: Response) {
  try {
    const { profileId } = req.params;

    const deleted = autofillEngine.deleteProfile(profileId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile'
    });
  }
}

/**
 * GET /api/autofill/profiles/:profileId/export
 * Export profile as JSON
 */
export async function handleExportProfile(req: Request, res: Response) {
  try {
    const { profileId } = req.params;

    const profileData = autofillEngine.exportProfile(profileId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="profile_${profileId}.json"`
    );
    res.send(profileData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export profile'
    });
  }
}

/**
 * POST /api/autofill/profiles/import
 * Import profile from JSON
 */
export async function handleImportProfile(req: Request, res: Response) {
  try {
    const { profileData } = req.body;

    if (!profileData) {
      return res.status(400).json({
        success: false,
        error: 'Profile data is required'
      });
    }

    const imported = autofillEngine.importProfile(profileData);

    res.json({
      success: true,
      profile: imported,
      message: 'Profile imported successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to import profile'
    });
  }
}

// ============================================================================
// FORM MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/autofill/forms
 * List all available forms
 */
export async function handleListForms(req: Request, res: Response) {
  try {
    const forms = autofillEngine.listAvailableForms();

    res.json({
      success: true,
      forms,
      total: forms.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list forms'
    });
  }
}

/**
 * GET /api/autofill/forms/:formId
 * Get specific form
 */
export async function handleGetForm(req: Request, res: Response) {
  try {
    const { formId } = req.params;

    const form = autofillEngine.getForm(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found'
      });
    }

    res.json({
      success: true,
      form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get form'
    });
  }
}

/**
 * GET /api/autofill/forms/type/:type
 * Get forms by type
 */
export async function handleGetFormsByType(req: Request, res: Response) {
  try {
    const { type } = req.params;

    if (!['scholarship', 'passport', 'kyc', 'custom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid form type'
      });
    }

    const forms = autofillEngine.getFormsByType(type as any);

    res.json({
      success: true,
      forms,
      total: forms.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get forms'
    });
  }
}

// ============================================================================
// AUTOFILL ENDPOINTS
// ============================================================================

/**
 * POST /api/autofill/generate
 * Generate autofill suggestions for a form
 */
export async function handleGenerateAutofill(req: Request, res: Response) {
  try {
    const { profileId, formId } = req.body;

    if (!profileId || !formId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID and Form ID are required'
      });
    }

    // Verify profile exists
    const profile = autofillEngine.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Generate suggestions
    const result = autofillEngine.generateAutofillSuggestions(profileId, formId);

    // Separate by confidence
    const statistics = {
      totalSuggestions: result.suggestions.length,
      highConfidence: result.highConfidenceFields.length,
      mediumConfidence: result.suggestions.filter(s => s.confidence >= 60 && s.confidence < 80).length,
      lowConfidence: result.suggestions.filter(s => s.confidence < 60).length,
      avgConfidence: Math.round(
        result.suggestions.reduce((sum, s) => sum + s.confidence, 0) / (result.suggestions.length || 1)
      ),
      completionPercentage: result.completionPercentage,
      missingCount: result.missingFields.length
    };

    res.json({
      success: true,
      result,
      statistics
    });
  } catch (error) {
    console.error('Error generating autofill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate autofill suggestions'
    });
  }
}

/**
 * POST /api/autofill/validate
 * Validate form data
 */
export async function handleValidateForm(req: Request, res: Response) {
  try {
    const { formId, data } = req.body;

    if (!formId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Form ID and data are required'
      });
    }

    const validation = autofillEngine.validateFormData(formId, data);

    res.json({
      success: validation.isValid,
      validation,
      message: validation.isValid ? 'Form is valid' : 'Form has errors'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
}

/**
 * POST /api/autofill/progress
 * Get form fill progress
 */
export async function handleGetProgress(req: Request, res: Response) {
  try {
    const { formId, filledData } = req.body;

    if (!formId) {
      return res.status(400).json({
        success: false,
        error: 'Form ID is required'
      });
    }

    const progress = autofillEngine.getFormFillProgress(formId, filledData || {});

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get progress'
    });
  }
}

// ============================================================================
// PDF GENERATION ENDPOINTS
// ============================================================================

/**
 * POST /api/autofill/generate-pdf
 * Generate PDF from filled form
 */
export async function handleGeneratePDF(req: Request, res: Response) {
  try {
    const { formId, formData } = req.body;

    if (!formId || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Form ID and form data are required'
      });
    }

    const form = autofillEngine.getForm(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found'
      });
    }

    // Generate PDF
    const pdfBuffer = PDFGenerationService.generatePDF(
      form.name,
      formData,
      form
    );

    // Generate report
    const report = PDFGenerationService.generateCompletionReport(
      formId,
      formData,
      form
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${form.name.replace(/\s+/g, '_')}_${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF'
    });
  }
}

/**
 * POST /api/autofill/completion-report
 * Get form completion report
 */
export async function handleCompletionReport(req: Request, res: Response) {
  try {
    const { formId, formData } = req.body;

    if (!formId) {
      return res.status(400).json({
        success: false,
        error: 'Form ID is required'
      });
    }

    const form = autofillEngine.getForm(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found'
      });
    }

    const report = PDFGenerationService.generateCompletionReport(
      formId,
      formData || {},
      form
    );

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
}

// ============================================================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/autofill/templates
 * Save a form template
 */
export async function handleSaveTemplate(req: Request, res: Response) {
  try {
    const { templateName, formId, filledData } = req.body;

    if (!templateName || !formId || !filledData) {
      return res.status(400).json({
        success: false,
        error: 'Template name, form ID, and filled data are required'
      });
    }

    const template = autofillEngine.saveFormTemplate(
      templateName,
      formId,
      filledData
    );

    res.status(201).json({
      success: true,
      template,
      message: 'Template saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save template'
    });
  }
}

/**
 * GET /api/autofill/templates/:templateId
 * Get template by ID
 */
export async function handleGetTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.params;

    const template = autofillEngine.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
}

/**
 * GET /api/autofill/templates/form/:formId
 * List templates for a specific form
 */
export async function handleListTemplatesForForm(req: Request, res: Response) {
  try {
    const { formId } = req.params;

    const templates = autofillEngine.listTemplatesForForm(formId);

    res.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list templates'
    });
  }
}

/**
 * POST /api/autofill/templates/:templateId/apply
 * Apply a template
 */
export async function handleApplyTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.params;

    const templateData = autofillEngine.applyTemplate(templateId);
    if (!templateData) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: templateData,
      message: 'Template applied successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to apply template'
    });
  }
}

/**
 * DELETE /api/autofill/templates/:templateId
 * Delete a template
 */
export async function handleDeleteTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.params;

    const deleted = autofillEngine.deleteTemplate(templateId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
}

// ============================================================================
// BATCH OPERATIONS ENDPOINTS
// ============================================================================

/**
 * POST /api/autofill/batch/generate
 * Generate autofill for multiple forms
 */
export async function handleBatchGenerateAutofill(req: Request, res: Response) {
  try {
    const { profileId, formIds } = req.body;

    if (!profileId || !Array.isArray(formIds) || formIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID and form IDs array are required'
      });
    }

    const results = formIds.map(formId => {
      try {
        return autofillEngine.generateAutofillSuggestions(profileId, formId);
      } catch (error) {
        return { error: 'Failed to generate autofill', formId };
      }
    });

    const stats = {
      total: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      avgCompletion: Math.round(
        results
          .filter(r => !r.error && 'completionPercentage' in r)
          .reduce((sum, r) => sum + (r as any).completionPercentage, 0) /
        (results.filter(r => !r.error).length || 1)
      )
    };

    res.json({
      success: true,
      results,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch processing failed'
    });
  }
}

/**
 * POST /api/autofill/batch/validate
 * Validate multiple form data
 */
export async function handleBatchValidate(req: Request, res: Response) {
  try {
    const { formValidations } = req.body;

    if (!Array.isArray(formValidations)) {
      return res.status(400).json({
        success: false,
        error: 'Form validations array is required'
      });
    }

    const results = formValidations.map(({ formId, data }) => {
      try {
        const validation = autofillEngine.validateFormData(formId, data);
        return { formId, ...validation };
      } catch (error) {
        return { formId, error: 'Validation failed' };
      }
    });

    const stats = {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid && !r.error).length
    };

    res.json({
      success: true,
      results,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch validation failed'
    });
  }
}

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/autofill/analytics/forms
 * Get analytics for forms
 */
export async function handleFormAnalytics(req: Request, res: Response) {
  try {
    const forms = autofillEngine.listAvailableForms();

    const analytics = {
      totalForms: forms.length,
      byType: {
        scholarship: forms.filter(f => f.type === 'scholarship').length,
        passport: forms.filter(f => f.type === 'passport').length,
        kyc: forms.filter(f => f.type === 'kyc').length,
        custom: forms.filter(f => f.type === 'custom').length
      },
      avgFieldsPerForm: Math.round(
        forms.reduce((sum, f) => sum + f.fields.length, 0) / forms.length
      ),
      formDetails: forms.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        fieldCount: f.fields.length,
        sectionCount: f.sections?.length || 1
      }))
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
}

/**
 * Export all handlers
 */
export const autofillHandlers = {
  // Profiles
  handleCreateProfile,
  handleGetProfile,
  handleDeleteProfile,
  handleExportProfile,
  handleImportProfile,
  
  // Forms
  handleListForms,
  handleGetForm,
  handleGetFormsByType,
  
  // Autofill
  handleGenerateAutofill,
  handleValidateForm,
  handleGetProgress,
  
  // PDF
  handleGeneratePDF,
  handleCompletionReport,
  
  // Templates
  handleSaveTemplate,
  handleGetTemplate,
  handleListTemplatesForForm,
  handleApplyTemplate,
  handleDeleteTemplate,
  
  // Batch
  handleBatchGenerateAutofill,
  handleBatchValidate,
  
  // Analytics
  handleFormAnalytics
};
