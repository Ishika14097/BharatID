/**
 * REST API Handlers for Bharat ID AI Assistant Chat
 * 
 * Endpoints:
 * - POST /api/assistant/chat - Send message
 * - GET /api/assistant/history/:userId - Get conversation history
 * - POST /api/assistant/context - Update user context
 * - GET /api/assistant/context/:userId - Get user context
 * - DELETE /api/assistant/conversation/:userId - Clear conversation
 * - POST /api/assistant/explain-procedure - Explain government procedure
 * - POST /api/assistant/suggest-documents - Get document suggestions
 * - POST /api/assistant/explain-error - Explain verification error
 * - POST /api/assistant/export - Export conversation
 * - GET /api/assistant/languages - Get supported languages
 */

import { Request, Response } from 'express';
import { aiAssistant, AssistantContext, ChatMessage } from './ai-assistant';
import { languageManager, SupportedLanguage } from '@/lib/assistant-translations';

/**
 * Send message to AI assistant
 * POST /api/assistant/chat
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { userId, message, language = 'en', context } = req.body;

    if (!userId || !message) {
      res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
      return;
    }

    // Validate language
    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({
        success: false,
        error: `Language ${language} not supported`
      });
      return;
    }

    // Get response from assistant
    const response = await aiAssistant.chat(userId, message, {
      language: language as SupportedLanguage,
      ...context
    });

    res.json({
      success: true,
      message: response,
      metadata: {
        timestamp: response.timestamp,
        language: response.language,
        confidence: response.metadata?.confidence
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get conversation history
 * GET /api/assistant/history/:userId?limit=50
 */
export async function getConversationHistory(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    const history = aiAssistant.getConversationHistory(userId, limit);

    res.json({
      success: true,
      history,
      count: history.length,
      limit
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get or update user context
 * GET /api/assistant/context/:userId
 */
export async function getContext(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    const context = aiAssistant.getOrCreateContext(userId);

    res.json({
      success: true,
      context: {
        userId: context.userId,
        conversationId: context.conversationId,
        language: context.language,
        documents: context.documents,
        currentForm: context.currentForm,
        verificationStatus: context.verificationStatus,
        preferences: context.preferences
      }
    });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Update user context
 * POST /api/assistant/context
 */
export async function updateContext(req: Request, res: Response): Promise<void> {
  try {
    const { userId, context } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    const updatedContext = aiAssistant.getOrCreateContext(userId, context);

    res.json({
      success: true,
      message: 'Context updated successfully',
      context: updatedContext
    });
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Update document status
 * PUT /api/assistant/documents/:userId/:documentId
 */
export async function updateDocumentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { userId, documentId } = req.params;
    const { status } = req.body;

    if (!userId || !documentId || !status) {
      res.status(400).json({
        success: false,
        error: 'userId, documentId, and status are required'
      });
      return;
    }

    if (!['pending', 'submitted', 'verified', 'expired'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    aiAssistant.updateDocumentStatus(userId, documentId, status);

    res.json({
      success: true,
      message: 'Document status updated'
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Clear conversation
 * DELETE /api/assistant/conversation/:userId
 */
export async function clearConversation(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    aiAssistant.clearConversation(userId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Explain government procedure
 * POST /api/assistant/explain-procedure
 */
export async function explainProcedure(req: Request, res: Response): Promise<void> {
  try {
    const { userId, procedureType, language = 'en' } = req.body;

    if (!userId || !procedureType) {
      res.status(400).json({
        success: false,
        error: 'userId and procedureType are required'
      });
      return;
    }

    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({
        success: false,
        error: `Language ${language} not supported`
      });
      return;
    }

    const explanation = await aiAssistant.explainProcedure(
      userId,
      procedureType,
      language as SupportedLanguage
    );

    res.json({
      success: true,
      explanation,
      language,
      procedureType
    });
  } catch (error) {
    console.error('Error explaining procedure:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Suggest missing documents
 * POST /api/assistant/suggest-documents
 */
export async function suggestMissingDocuments(req: Request, res: Response): Promise<void> {
  try {
    const { userId, formType, submittedDocuments = [], language = 'en' } = req.body;

    if (!userId || !formType) {
      res.status(400).json({
        success: false,
        error: 'userId and formType are required'
      });
      return;
    }

    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({
        success: false,
        error: `Language ${language} not supported`
      });
      return;
    }

    const suggestions = await aiAssistant.suggestMissingDocuments(
      userId,
      formType,
      submittedDocuments,
      language as SupportedLanguage
    );

    res.json({
      success: true,
      suggestions,
      language,
      formType
    });
  } catch (error) {
    console.error('Error suggesting documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Explain verification issue
 * POST /api/assistant/explain-error
 */
export async function explainVerificationError(req: Request, res: Response): Promise<void> {
  try {
    const { userId, errorCode, errorMessage, language = 'en' } = req.body;

    if (!userId || !errorCode) {
      res.status(400).json({
        success: false,
        error: 'userId and errorCode are required'
      });
      return;
    }

    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({
        success: false,
        error: `Language ${language} not supported`
      });
      return;
    }

    const errorExplanation = await aiAssistant.explainVerificationIssue(
      userId,
      errorCode,
      errorMessage || '',
      language as SupportedLanguage
    );

    res.json({
      success: true,
      errorExplanation,
      language,
      errorCode
    });
  } catch (error) {
    console.error('Error explaining verification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Export conversation
 * POST /api/assistant/export
 */
export async function exportConversation(req: Request, res: Response): Promise<void> {
  try {
    const { userId, format = 'json' } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    const conversation = aiAssistant.exportConversation(userId);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        ['Timestamp', 'Role', 'Content', 'Language'].join(','),
        ...conversation.map(msg =>
          [
            msg.timestamp.toISOString(),
            msg.role,
            `"${msg.content.replace(/"/g, '""')}"`,
            msg.language
          ].join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${userId}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        userId,
        exportedAt: new Date(),
        conversation,
        messageCount: conversation.length
      });
    }
  } catch (error) {
    console.error('Error exporting conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get supported languages
 * GET /api/assistant/languages
 */
export async function getSupportedLanguages(req: Request, res: Response): Promise<void> {
  try {
    const languages = languageManager.getSupportedLanguages();

    res.json({
      success: true,
      languages,
      count: languages.length
    });
  } catch (error) {
    console.error('Error getting supported languages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get translated strings
 * GET /api/assistant/translations/:language
 */
export async function getTranslations(req: Request, res: Response): Promise<void> {
  try {
    const { language } = req.params;

    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({
        success: false,
        error: `Language ${language} not supported`
      });
      return;
    }

    const translations = languageManager.getAllTranslations(language as SupportedLanguage);

    res.json({
      success: true,
      language,
      translations
    });
  } catch (error) {
    console.error('Error getting translations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Batch send messages to multiple users
 * POST /api/assistant/batch-messages
 */
export async function batchSendMessages(req: Request, res: Response): Promise<void> {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'messages array is required'
      });
      return;
    }

    const results = [];

    for (const msg of messages) {
      try {
        const response = await aiAssistant.chat(msg.userId, msg.message, {
          language: msg.language || 'en',
          ...(msg.context || {})
        });
        results.push({
          userId: msg.userId,
          success: true,
          message: response
        });
      } catch (error) {
        results.push({
          userId: msg.userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error in batch send:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get assistant statistics
 * GET /api/assistant/stats
 */
export async function getAssistantStats(req: Request, res: Response): Promise<void> {
  try {
    // Placeholder for stats endpoint
    res.json({
      success: true,
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        supportedLanguages: languageManager.getSupportedLanguages().length,
        averageResponseTime: 0
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * POST /api/ai/suggest
 * Lightweight autofill suggestion endpoint that accepts a form schema and partial values
 * and returns structured suggestions from the assistant.
 */
export async function aiSuggest(req: Request, res: Response): Promise<void> {
  try {
    const { userId, formSchema, partialValues = {}, language = 'en' } = req.body || {};

    if (!userId || !formSchema) {
      res.status(400).json({ success: false, error: 'userId and formSchema are required' });
      return;
    }

    if (!languageManager.isLanguageSupported(language)) {
      res.status(400).json({ success: false, error: `Language ${language} not supported` });
      return;
    }

    // Build a concise prompt requesting JSON output for suggestions
    const prompt = `
You are an autofill assistant. Given the following form schema and the user's partially filled values,
return a JSON object mapping field IDs to suggested values and a confidence score (0-100) and short rationale.

Form Schema: ${JSON.stringify(formSchema)}

Partial Values: ${JSON.stringify(partialValues)}

Respond only with a JSON object with the shape:
{
  "suggestions": [{ "fieldId": "...", "value": "...", "confidence": 87, "rationale": "..." }, ...]
}

Respond in ${language}.
`.trim();

    const assistantResponse = await aiAssistant.chat(userId, prompt, { language });

    // Try to parse JSON from assistant content
    let parsed: any = null;
    try {
      parsed = JSON.parse(assistantResponse.content);
    } catch (e) {
      // If assistant returned non-JSON, wrap as explanation
      parsed = { suggestions: [], explanation: assistantResponse.content };
    }

    res.json({ success: true, userId, suggestions: parsed.suggestions || [], raw: assistantResponse.content });
  } catch (error) {
    console.error('Error in /api/ai/suggest:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
}
