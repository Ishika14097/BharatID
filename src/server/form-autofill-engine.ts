/**
 * Form Autofill Engine
 * 
 * Core service for AI-powered government form autofill using:
 * - OCR extracted data from identity documents
 * - NLP-based field matching
 * - Confidence scoring
 * - Template management
 */

import crypto from "crypto";

export interface IdentityProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Basic Information
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  
  // Contact
  email?: string;
  phoneNumber?: string;
  mobile?: string;
  
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Government IDs
  aadhaarNumber?: string;
  panNumber?: string;
  passportNumber?: string;
  drivingLicense?: string;
  voterID?: string;
  
  // Personal Details
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string; // Male, Female, Other
  nationality?: string;
  religion?: string;
  caste?: string;
  
  // Education
  highestQualification?: string;
  schoolName?: string;
  collegeName?: string;
  graduationYear?: number;
  
  // Employment
  occupation?: string;
  employerName?: string;
  employmentStatus?: string; // Employed, Self-employed, Student, etc.
  annualIncome?: number;
  
  // Family
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  numberOfDependents?: number;
  
  // Additional
  metadata?: Record<string, any>;
  sourceDocuments?: string[]; // List of document IDs used to create profile
}

export interface FormField {
  id: string;
  name: string;
  label?: string;
  type: "text" | "email" | "phone" | "date" | "select" | "checkbox" | "textarea" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/radio/checkbox
  pattern?: string; // Regex pattern
  maxLength?: number;
  description?: string;
}

export interface FormStructure {
  id: string;
  name: string;
  type: "scholarship" | "passport" | "kyc" | "custom";
  fields: FormField[];
  sections?: FormSection[];
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // Field IDs in this section
}

export interface AutofillSuggestion {
  fieldId: string;
  fieldName: string;
  suggestedValue: string;
  confidence: number; // 0-100
  source: string; // Field name in identity profile
  sourceType: "exact" | "fuzzy" | "derived" | "contextual";
  alternatives?: string[];
  notes?: string;
}

export interface AutofillResult {
  formId: string;
  profileId: string;
  suggestions: AutofillSuggestion[];
  completionPercentage: number;
  highConfidenceFields: AutofillSuggestion[];
  lowConfidenceFields: AutofillSuggestion[];
  missingFields: string[];
  timestamp: Date;
}

export interface FormTemplate {
  id: string;
  name: string;
  formId: string;
  savedFields: Record<string, string>;
  savedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

/**
 * Field Matching Engine using NLP-like techniques
 */
export class FieldMatchingEngine {
  private similarityThreshold = 0.6;
  private fieldMappings: Map<string, string[]> = new Map();

  constructor() {
    this.initializeFieldMappings();
  }

  /**
   * Initialize common field mappings for government forms
   */
  private initializeFieldMappings() {
    // Name variations
    this.fieldMappings.set("fullName", [
      "full_name",
      "full-name",
      "name",
      "applicant_name",
      "first_name_last_name",
      "firstName lastName",
      "given_name_family_name"
    ]);

    this.fieldMappings.set("firstName", [
      "first_name",
      "first-name",
      "given_name",
      "forename",
      "name_first"
    ]);

    this.fieldMappings.set("lastName", [
      "last_name",
      "last-name",
      "family_name",
      "surname",
      "name_last"
    ]);

    // Contact
    this.fieldMappings.set("email", [
      "email_address",
      "e_mail",
      "contact_email",
      "mail",
      "electronic_mail"
    ]);

    this.fieldMappings.set("phoneNumber", [
      "phone",
      "phone_number",
      "mobile",
      "contact_number",
      "telephone",
      "tel"
    ]);

    // Address
    this.fieldMappings.set("addressLine1", [
      "address",
      "address_line_1",
      "address_1",
      "street_address",
      "residential_address"
    ]);

    this.fieldMappings.set("city", [
      "city_town",
      "city",
      "town",
      "municipality"
    ]);

    this.fieldMappings.set("state", [
      "state_province",
      "state",
      "province",
      "region"
    ]);

    this.fieldMappings.set("postalCode", [
      "postal_code",
      "zip_code",
      "pin_code",
      "zipcode",
      "pin"
    ]);

    // Government IDs
    this.fieldMappings.set("aadhaarNumber", [
      "aadhaar",
      "aadhaar_number",
      "uid",
      "unique_identification_number"
    ]);

    this.fieldMappings.set("panNumber", [
      "pan",
      "pan_number",
      "permanent_account_number"
    ]);

    this.fieldMappings.set("passportNumber", [
      "passport",
      "passport_number",
      "passport_no"
    ]);

    // Personal Details
    this.fieldMappings.set("dateOfBirth", [
      "date_of_birth",
      "dob",
      "birth_date",
      "date_birth",
      "birthday"
    ]);

    this.fieldMappings.set("gender", [
      "sex",
      "gender",
      "gender_sex"
    ]);

    // Education
    this.fieldMappings.set("collegeName", [
      "college",
      "college_name",
      "university_name",
      "institution_name"
    ]);

    this.fieldMappings.set("highestQualification", [
      "qualification",
      "educational_qualification",
      "degree",
      "qualification_highest"
    ]);

    // Employment
    this.fieldMappings.set("occupation", [
      "profession",
      "job_title",
      "position",
      "occupation_type"
    ]);

    this.fieldMappings.set("employerName", [
      "employer",
      "company_name",
      "organization_name",
      "employer_organization"
    ]);
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Match a form field name to identity profile fields
   */
  matchField(
    formFieldName: string,
    formFieldLabel?: string
  ): {
    profileField: string;
    confidence: number;
    matchType: "exact" | "fuzzy" | "semantic";
  } | null {
    const fieldNameLower = formFieldName.toLowerCase().trim();
    const fieldLabelLower = formFieldLabel?.toLowerCase().trim() || "";

    // Try exact matches in mappings
    for (const [profileField, aliases] of this.fieldMappings.entries()) {
      if (
        aliases.some((alias) => alias.toLowerCase() === fieldNameLower) ||
        aliases.some((alias) => alias.toLowerCase() === fieldLabelLower)
      ) {
        return { profileField, confidence: 95, matchType: "exact" };
      }
    }

    // Try fuzzy matching on field mappings
    let bestMatch: {
      profileField: string;
      confidence: number;
      matchType: "fuzzy";
    } | null = null;

    for (const [profileField, aliases] of this.fieldMappings.entries()) {
      for (const alias of aliases) {
        const similarity = this.levenshteinDistance(fieldNameLower, alias.toLowerCase());
        if (similarity > this.similarityThreshold) {
          if (!bestMatch || similarity > bestMatch.confidence) {
            bestMatch = { profileField, confidence: Math.round(similarity * 100), matchType: "fuzzy" };
          }
        }
      }

      // Also try matching against profile field name itself
      const profileSimilarity = this.levenshteinDistance(fieldNameLower, profileField.toLowerCase());
      if (profileSimilarity > this.similarityThreshold) {
        if (!bestMatch || profileSimilarity > bestMatch.confidence) {
          bestMatch = {
            profileField,
            confidence: Math.round(profileSimilarity * 100),
            matchType: "fuzzy"
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extract contextual value from profile based on field type
   */
  extractContextualValue(
    profileField: string,
    fieldType: string,
    profile: IdentityProfile
  ): string | null {
    const value = (profile as any)[profileField];

    if (!value) return null;

    // Format based on field type
    switch (fieldType) {
      case "date":
        return this.formatDate(String(value));
      case "phone":
      case "number":
        return String(value).replace(/\D/g, "").substring(0, 10);
      case "email":
        return String(value).toLowerCase();
      default:
        return String(value);
    }
  }

  /**
   * Format date to various formats
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    } catch {
      return dateStr;
    }
  }
}

/**
 * Main Form Autofill Engine
 */
export class FormAutofillEngine {
  private fieldMatcher: FieldMatchingEngine;
  private profiles: Map<string, IdentityProfile> = new Map();
  private templates: Map<string, FormTemplate> = new Map();
  private forms: Map<string, FormStructure> = new Map();

  constructor() {
    this.fieldMatcher = new FieldMatchingEngine();
    this.initializeCommonForms();
  }

  /**
   * Initialize common government forms
   */
  private initializeCommonForms() {
    // Scholarship Form
    const scholarshipForm: FormStructure = {
      id: "form_scholarship_001",
      name: "Scholarship Application Form",
      type: "scholarship",
      fields: [
        { id: "f_fullname", name: "applicantFullName", label: "Full Name", type: "text", required: true },
        { id: "f_email", name: "email", label: "Email Address", type: "email", required: true },
        { id: "f_phone", name: "contactPhone", label: "Contact Number", type: "phone", required: true },
        { id: "f_dob", name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        { id: "f_gender", name: "gender", label: "Gender", type: "select", required: true, options: ["Male", "Female", "Other"] },
        { id: "f_address", name: "permanentAddress", label: "Permanent Address", type: "textarea", required: true },
        { id: "f_city", name: "city", label: "City", type: "text", required: true },
        { id: "f_state", name: "state", label: "State", type: "text", required: true },
        { id: "f_pin", name: "postalCode", label: "PIN Code", type: "text", required: true },
        { id: "f_aadhar", name: "aadhaarId", label: "Aadhaar ID", type: "text", required: false },
        { id: "f_institution", name: "institutionName", label: "Institution Name", type: "text", required: true },
        { id: "f_qualification", name: "qualification", label: "Qualification", type: "text", required: true },
        { id: "f_marks", name: "aggregateMarks", label: "Aggregate Marks/GPA", type: "number", required: true },
        { id: "f_income", name: "familyIncome", label: "Family Income (Annual)", type: "number", required: true },
        { id: "f_bank", name: "bankAccount", label: "Bank Account Number", type: "text", required: true },
        { id: "f_ifsc", name: "ifscCode", label: "IFSC Code", type: "text", required: true }
      ],
      sections: [
        { id: "sec_personal", title: "Personal Information", fields: ["f_fullname", "f_email", "f_phone", "f_dob", "f_gender"] },
        { id: "sec_address", title: "Address", fields: ["f_address", "f_city", "f_state", "f_pin"] },
        { id: "sec_id", title: "Identification", fields: ["f_aadhar"] },
        { id: "sec_education", title: "Education", fields: ["f_institution", "f_qualification", "f_marks"] },
        { id: "sec_financial", title: "Financial Information", fields: ["f_income", "f_bank", "f_ifsc"] }
      ]
    };

    // Passport Form
    const passportForm: FormStructure = {
      id: "form_passport_001",
      name: "Passport Application Form",
      type: "passport",
      fields: [
        { id: "p_fullname", name: "fullName", label: "Full Name", type: "text", required: true },
        { id: "p_fname", name: "fatherName", label: "Father's Name", type: "text", required: true },
        { id: "p_mname", name: "motherName", label: "Mother's Name", type: "text", required: true },
        { id: "p_dob", name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        { id: "p_gender", name: "gender", label: "Gender", type: "select", required: true, options: ["Male", "Female"] },
        { id: "p_nationality", name: "nationality", label: "Nationality", type: "text", required: true },
        { id: "p_email", name: "email", label: "Email", type: "email", required: true },
        { id: "p_phone", name: "phoneNumber", label: "Phone Number", type: "phone", required: true },
        { id: "p_address", name: "permanentAddress", label: "Permanent Address", type: "textarea", required: true },
        { id: "p_city", name: "city", label: "City/Town", type: "text", required: true },
        { id: "p_state", name: "state", label: "State", type: "text", required: true },
        { id: "p_country", name: "country", label: "Country", type: "text", required: true },
        { id: "p_pin", name: "postalCode", label: "PIN Code", type: "text", required: true },
        { id: "p_aadhar", name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true }
      ],
      sections: [
        { id: "sec_personal", title: "Personal Details", fields: ["p_fullname", "p_fname", "p_mname", "p_dob", "p_gender", "p_nationality"] },
        { id: "sec_contact", title: "Contact Information", fields: ["p_email", "p_phone"] },
        { id: "sec_address", title: "Address Details", fields: ["p_address", "p_city", "p_state", "p_country", "p_pin"] },
        { id: "sec_id", title: "Identification", fields: ["p_aadhar"] }
      ]
    };

    // KYC Form
    const kycForm: FormStructure = {
      id: "form_kyc_001",
      name: "KYC (Know Your Customer) Form",
      type: "kyc",
      fields: [
        { id: "k_fullname", name: "fullName", label: "Full Name", type: "text", required: true },
        { id: "k_dob", name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        { id: "k_gender", name: "gender", label: "Gender", type: "select", required: true, options: ["Male", "Female", "Other"] },
        { id: "k_nationality", name: "nationality", label: "Nationality", type: "text", required: true },
        { id: "k_pan", name: "panNumber", label: "PAN Number", type: "text", required: true },
        { id: "k_aadhar", name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
        { id: "k_address", name: "permanentAddress", label: "Permanent Address", type: "textarea", required: true },
        { id: "k_city", name: "city", label: "City", type: "text", required: true },
        { id: "k_state", name: "state", label: "State", type: "text", required: true },
        { id: "k_pin", name: "postalCode", label: "PIN Code", type: "text", required: true },
        { id: "k_occupation", name: "occupation", label: "Occupation", type: "text", required: false },
        { id: "k_email", name: "email", label: "Email Address", type: "email", required: true },
        { id: "k_phone", name: "phoneNumber", label: "Phone Number", type: "phone", required: true },
        { id: "k_bank", name: "bankAccountNumber", label: "Bank Account Number", type: "text", required: false },
        { id: "k_ifsc", name: "ifscCode", label: "IFSC Code", type: "text", required: false }
      ],
      sections: [
        { id: "sec_personal", title: "Personal Information", fields: ["k_fullname", "k_dob", "k_gender", "k_nationality"] },
        { id: "sec_id", title: "Identity Documents", fields: ["k_pan", "k_aadhar"] },
        { id: "sec_address", title: "Address", fields: ["k_address", "k_city", "k_state", "k_pin"] },
        { id: "sec_contact", title: "Contact Details", fields: ["k_occupation", "k_email", "k_phone"] },
        { id: "sec_bank", title: "Bank Details", fields: ["k_bank", "k_ifsc"] }
      ]
    };

    this.forms.set(scholarshipForm.id, scholarshipForm);
    this.forms.set(passportForm.id, passportForm);
    this.forms.set(kycForm.id, kycForm);
  }

  /**
   * Create or update an identity profile from extracted document data
   */
  createIdentityProfile(data: Partial<IdentityProfile>, documentIds?: string[]): IdentityProfile {
    const profileId = crypto.randomUUID();
    const now = new Date();

    const profile: IdentityProfile = {
      id: profileId,
      createdAt: now,
      updatedAt: now,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      fullName: data.fullName || data.firstName + " " + data.lastName || "",
      email: data.email,
      phoneNumber: data.phoneNumber,
      mobile: data.mobile,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country || "India",
      postalCode: data.postalCode,
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber,
      passportNumber: data.passportNumber,
      drivingLicense: data.drivingLicense,
      voterID: data.voterID,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality || "Indian",
      religion: data.religion,
      caste: data.caste,
      highestQualification: data.highestQualification,
      schoolName: data.schoolName,
      collegeName: data.collegeName,
      graduationYear: data.graduationYear,
      occupation: data.occupation,
      employerName: data.employerName,
      employmentStatus: data.employmentStatus,
      annualIncome: data.annualIncome,
      fatherName: data.fatherName,
      motherName: data.motherName,
      spouseName: data.spouseName,
      numberOfDependents: data.numberOfDependents,
      metadata: data.metadata,
      sourceDocuments: documentIds || []
    };

    this.profiles.set(profileId, profile);
    return profile;
  }

  /**
   * Get identity profile by ID
   */
  getProfile(profileId: string): IdentityProfile | null {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Get form structure by ID
   */
  getForm(formId: string): FormStructure | null {
    return this.forms.get(formId) || null;
  }

  /**
   * List all available forms
   */
  listAvailableForms(): FormStructure[] {
    return Array.from(this.forms.values());
  }

  /**
   * Get all available form types
   */
  getFormsByType(type: "scholarship" | "passport" | "kyc" | "custom"): FormStructure[] {
    return Array.from(this.forms.values()).filter(f => f.type === type);
  }

  /**
   * Generate autofill suggestions for a form using a profile
   */
  generateAutofillSuggestions(
    profileId: string,
    formId: string
  ): AutofillResult {
    const profile = this.getProfile(profileId);
    const form = this.getForm(formId);

    if (!profile || !form) {
      throw new Error("Profile or form not found");
    }

    const suggestions: AutofillSuggestion[] = [];
    const missingFields: string[] = [];
    const timestamp = new Date();

    for (const field of form.fields) {
      // Try to match form field to profile field
      const match = this.fieldMatcher.matchField(field.name, field.label);

      if (match) {
        const value = this.fieldMatcher.extractContextualValue(match.profileField, field.type, profile);

        if (value) {
          suggestions.push({
            fieldId: field.id,
            fieldName: field.name,
            suggestedValue: value,
            confidence: match.confidence,
            source: match.profileField,
            sourceType: match.matchType === "exact" ? "exact" : match.matchType === "fuzzy" ? "fuzzy" : "derived"
          });
        } else if (field.required) {
          missingFields.push(field.id);
        }
      } else if (field.required) {
        missingFields.push(field.id);
      }
    }

    // Separate high and low confidence suggestions
    const highConfidenceFields = suggestions.filter(s => s.confidence >= 80);
    const lowConfidenceFields = suggestions.filter(s => s.confidence < 80);

    const completionPercentage = Math.round(
      (suggestions.length / form.fields.length) * 100
    );

    return {
      formId,
      profileId,
      suggestions,
      completionPercentage,
      highConfidenceFields,
      lowConfidenceFields,
      missingFields,
      timestamp
    };
  }

  /**
   * Save a form template for reuse
   */
  saveFormTemplate(
    templateName: string,
    formId: string,
    filledData: Record<string, string>
  ): FormTemplate {
    const templateId = crypto.randomUUID();
    const now = new Date();

    const template: FormTemplate = {
      id: templateId,
      name: templateName,
      formId,
      savedFields: filledData,
      savedAt: now,
      usageCount: 0
    };

    this.templates.set(templateId, template);
    return template;
  }

  /**
   * Get saved template
   */
  getTemplate(templateId: string): FormTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * List all templates for a specific form
   */
  listTemplatesForForm(formId: string): FormTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.formId === formId);
  }

  /**
   * Apply template to form
   */
  applyTemplate(templateId: string): Record<string, string> | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    // Update usage stats
    template.usageCount += 1;
    template.lastUsedAt = new Date();
    this.templates.set(templateId, template);

    return template.savedFields;
  }

  /**
   * Calculate field importance score for a form
   */
  calculateFieldImportance(formId: string): Record<string, number> {
    const form = this.getForm(formId);
    if (!form) return {};

    const importance: Record<string, number> = {};

    form.fields.forEach(field => {
      let score = 0;

      // Required fields get higher score
      if (field.required) score += 40;

      // Earlier fields get slightly higher score
      const position = form.fields.indexOf(field);
      score += (form.fields.length - position) * 0.5;

      // Sensitive fields (IDs, financial) get higher score
      if (["aadhaarNumber", "panNumber", "bankAccount", "income"].some(s =>
        field.name.toLowerCase().includes(s.toLowerCase())
      )) {
        score += 20;
      }

      importance[field.id] = Math.min(100, score);
    });

    return importance;
  }

  /**
   * Get form fill progress
   */
  getFormFillProgress(
    formId: string,
    filledData: Record<string, string>
  ): {
    totalFields: number;
    filledFields: number;
    requiredFilled: number;
    totalRequired: number;
    progressPercentage: number;
  } {
    const form = this.getForm(formId);
    if (!form) throw new Error("Form not found");

    const filledCount = Object.keys(filledData).length;
    const requiredFields = form.fields.filter(f => f.required);
    const requiredFilled = requiredFields.filter(f => filledData[f.id]).length;

    return {
      totalFields: form.fields.length,
      filledFields: filledCount,
      requiredFilled,
      totalRequired: requiredFields.length,
      progressPercentage: Math.round((filledCount / form.fields.length) * 100)
    };
  }

  /**
   * Validate form data before submission
   */
  validateFormData(
    formId: string,
    data: Record<string, string>
  ): {
    isValid: boolean;
    errors: Array<{ fieldId: string; message: string }>;
    warnings: Array<{ fieldId: string; message: string }>;
  } {
    const form = this.getForm(formId);
    if (!form) throw new Error("Form not found");

    const errors: Array<{ fieldId: string; message: string }> = [];
    const warnings: Array<{ fieldId: string; message: string }> = [];

    form.fields.forEach(field => {
      const value = data[field.id]?.trim() || "";

      // Check required
      if (field.required && !value) {
        errors.push({ fieldId: field.id, message: `${field.label} is required` });
        return;
      }

      if (!value) return;

      // Type validations
      if (field.type === "email" && !this.isValidEmail(value)) {
        errors.push({ fieldId: field.id, message: "Invalid email format" });
      }

      if (field.type === "phone" && !this.isValidPhoneNumber(value)) {
        errors.push({ fieldId: field.id, message: "Invalid phone number" });
      }

      if (field.type === "date" && !this.isValidDate(value)) {
        errors.push({ fieldId: field.id, message: "Invalid date format" });
      }

      if (field.type === "number" && isNaN(Number(value))) {
        errors.push({ fieldId: field.id, message: "Must be a valid number" });
      }

      // Pattern validation
      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        warnings.push({ fieldId: field.id, message: "Format may be incorrect" });
      }

      // Length validation
      if (field.maxLength && value.length > field.maxLength) {
        warnings.push({
          fieldId: field.id,
          message: `Exceeds maximum length of ${field.maxLength}`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10;
  }

  private isValidDate(dateStr: string): boolean {
    try {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Export profile data for backup
   */
  exportProfile(profileId: string): string {
    const profile = this.getProfile(profileId);
    if (!profile) throw new Error("Profile not found");
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile data from backup
   */
  importProfile(profileData: string): IdentityProfile {
    try {
      const data = JSON.parse(profileData) as Partial<IdentityProfile>;
      return this.createIdentityProfile(data);
    } catch (error) {
      throw new Error("Invalid profile data format");
    }
  }

  /**
   * Delete profile
   */
  deleteProfile(profileId: string): boolean {
    return this.profiles.delete(profileId);
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }
}

// Export singleton instance
export const autofillEngine = new FormAutofillEngine();
