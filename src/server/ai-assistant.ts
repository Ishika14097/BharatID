/**
 * AI Assistant Service for Bharat ID Platform
 * 
 * Capabilities:
 * - Explain government procedures
 * - Help users fill forms
 * - Suggest missing documents
 * - Explain verification issues
 * - Context-aware responses
 * 
 * Supported LLM Providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Local LLMs (Ollama, etc.)
 * - Azure OpenAI
 */

import crypto from 'crypto';

/**
 * Represents a chat message in the conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language: string;
  metadata?: {
    documentIds?: string[];
    formType?: string;
    procedureType?: string;
    confidence?: number;
  };
}

/**
 * Assistant context for personalized responses
 */
export interface AssistantContext {
  userId: string;
  conversationId: string;
  language: string;
  documents: Array<{
    documentId: string;
    type: string;
    status: 'pending' | 'submitted' | 'verified' | 'expired';
    expiryDate?: Date;
  }>;
  currentForm?: {
    formType: string;
    filledFields: string[];
    emptyFields: string[];
    errors?: string[];
  };
  verificationStatus?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    lastError?: string;
    attemptCount?: number;
  };
  conversationHistory: ChatMessage[];
  preferences?: {
    detailedExplanations: boolean;
    includeExamples: boolean;
    preferredLanguage: string;
  };
}

/**
 * LLM Response from provider
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

/**
 * Assistant Configuration
 */
export interface AssistantConfig {
  provider: 'openai' | 'azure' | 'local' | 'mock';
  model: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens: number;
  temperature: number;
  systemPromptTemplate: string;
}

/**
 * Knowledge base entry for government procedures
 */
export interface KnowledgeEntry {
  id: string;
  type: 'procedure' | 'document' | 'form' | 'verification' | 'error';
  title: string;
  description: string;
  relatedDocuments?: string[];
  steps?: string[];
  commonIssues?: Array<{
    issue: string;
    solution: string;
  }>;
  keywords: string[];
  language: 'en' | 'hi' | 'ta' | 'te' | 'ka' | 'ml';
}

/**
 * Main AI Assistant Service
 * 
 * Handles conversation management, context awareness, and LLM interactions
 */
export class AIAssistant {
  private config: AssistantConfig;
  private contexts: Map<string, AssistantContext> = new Map();
  private knowledgeBase: Map<string, KnowledgeEntry[]> = new Map();
  private systemPrompts: Map<string, string> = new Map();

  constructor(config: Partial<AssistantConfig> = {}) {
    this.config = {
      provider: config.provider || 'mock',
      model: config.model || 'gpt-4',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      endpoint: config.endpoint || process.env.OPENAI_ENDPOINT,
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      systemPromptTemplate: config.systemPromptTemplate || this.getDefaultSystemPrompt()
    };

    this.initializeKnowledgeBase();
    this.initializeSystemPrompts();
  }

  /**
   * Initialize or get context for a user
   */
  public getOrCreateContext(userId: string, options?: Partial<AssistantContext>): AssistantContext {
    if (!this.contexts.has(userId)) {
      const conversationId = crypto.randomUUID();
      const context: AssistantContext = {
        userId,
        conversationId,
        language: options?.language || 'en',
        documents: options?.documents || [],
        conversationHistory: [],
        preferences: {
          detailedExplanations: true,
          includeExamples: true,
          preferredLanguage: options?.language || 'en'
        },
        ...options
      };
      this.contexts.set(userId, context);
    }
    return this.contexts.get(userId)!;
  }

  /**
   * Send a message and get AI response
   */
  public async chat(
    userId: string,
    userMessage: string,
    context?: Partial<AssistantContext>
  ): Promise<ChatMessage> {
    try {
      // Get or create context
      const assistantContext = this.getOrCreateContext(userId, context);

      // Add user message to history
      const userMsgObj: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        language: assistantContext.language
      };
      assistantContext.conversationHistory.push(userMsgObj);

      // Detect intent and extract metadata
      const intent = this.detectIntent(userMessage, assistantContext);
      userMsgObj.metadata = intent;

      // Enhance context with relevant knowledge
      const enhancedPrompt = this.buildEnhancedPrompt(userMessage, assistantContext);

      // Get LLM response
      const llmResponse = await this.callLLM(enhancedPrompt, assistantContext);

      // Create assistant message
      const assistantMsgObj: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: llmResponse.content,
        timestamp: new Date(),
        language: assistantContext.language,
        metadata: {
          confidence: this.calculateConfidence(llmResponse),
          documentIds: intent.documentIds,
          formType: intent.formType,
          procedureType: intent.procedureType
        }
      };
      assistantContext.conversationHistory.push(assistantMsgObj);

      // Update context if conversation history grows too large
      if (assistantContext.conversationHistory.length > 20) {
        this.trimConversationHistory(assistantContext);
      }

      return assistantMsgObj;
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error(`Assistant error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Explain a government procedure
   */
  public async explainProcedure(
    userId: string,
    procedureType: string,
    language: string = 'en'
  ): Promise<string> {
    const context = this.getOrCreateContext(userId, { language });
    
    // Find relevant knowledge
    const knowledge = this.findKnowledgeEntry(procedureType, 'procedure', language);
    
    if (!knowledge) {
      return `I don't have detailed information about ${procedureType}. Please ask me a specific question.`;
    }

    const prompt = `
      Explain the following government procedure in ${language}:
      
      Procedure: ${knowledge.title}
      Description: ${knowledge.description}
      ${knowledge.steps ? `Steps:\n${knowledge.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}
      
      Provide a clear, step-by-step explanation that's easy to understand.
    `;

    const response = await this.callLLM(prompt, context);
    return response.content;
  }

  /**
   * Suggest missing documents based on form type
   */
  public async suggestMissingDocuments(
    userId: string,
    formType: string,
    submittedDocuments: string[] = [],
    language: string = 'en'
  ): Promise<{
    missingDocuments: string[];
    recommendations: string[];
    explanation: string;
  }> {
    const context = this.getOrCreateContext(userId, { language });

    // Get knowledge about required documents
    const knowledge = this.findKnowledgeEntry(formType, 'form', language);
    const requiredDocs = knowledge?.relatedDocuments || [];

    const missing = requiredDocs.filter(doc => !submittedDocuments.includes(doc));

    const prompt = `
      For the form type "${formType}", the following documents are missing: ${missing.join(', ')}
      
      Provide recommendations for:
      1. Why these documents are needed
      2. Where to obtain them
      3. Timeline for submission
      
      Respond in ${language}.
    `;

    const response = await this.callLLM(prompt, context);

    return {
      missingDocuments: missing,
      recommendations: this.parseRecommendations(response.content),
      explanation: response.content
    };
  }

  /**
   * Explain verification issue
   */
  public async explainVerificationIssue(
    userId: string,
    errorCode: string,
    errorMessage: string,
    language: string = 'en'
  ): Promise<{
    explanation: string;
    solutions: string[];
    nextSteps: string;
  }> {
    const context = this.getOrCreateContext(userId, { language });

    // Find knowledge about error
    const knowledge = this.findKnowledgeEntry(errorCode, 'error', language);

    const prompt = `
      A user encountered the following verification error:
      Error Code: ${errorCode}
      Error Message: ${errorMessage}
      ${knowledge ? `Known Issue: ${knowledge.description}` : ''}
      
      Provide:
      1. A clear explanation of what went wrong
      2. Step-by-step solutions to fix it
      3. Next steps if the issue persists
      
      Respond in ${language}.
    `;

    const response = await this.callLLM(prompt, context);
    const solutions = this.parseSolutions(response.content);

    return {
      explanation: response.content.split('\n\n')[0],
      solutions,
      nextSteps: 'Contact support if the issue persists.'
    };
  }

  /**
   * Get conversation history
   */
  public getConversationHistory(userId: string, limit: number = 50): ChatMessage[] {
    const context = this.contexts.get(userId);
    if (!context) return [];
    return context.conversationHistory.slice(-limit);
  }

  /**
   * Update context with document status
   */
  public updateDocumentStatus(
    userId: string,
    documentId: string,
    status: 'pending' | 'submitted' | 'verified' | 'expired'
  ): void {
    const context = this.contexts.get(userId);
    if (!context) return;

    const doc = context.documents.find(d => d.documentId === documentId);
    if (doc) {
      doc.status = status;
    }
  }

  /**
   * Clear conversation
   */
  public clearConversation(userId: string): void {
    const context = this.contexts.get(userId);
    if (context) {
      context.conversationHistory = [];
    }
  }

  /**
   * Export conversation
   */
  public exportConversation(userId: string): ChatMessage[] {
    return this.getConversationHistory(userId, 1000);
  }

  /**
   * Detect intent from user message
   */
  private detectIntent(message: string, context: AssistantContext): Record<string, any> {
    const lowerMsg = message.toLowerCase();
    const metadata: Record<string, any> = {};

    // Detect document-related queries
    if (lowerMsg.includes('passport') || lowerMsg.includes('verify passport')) {
      metadata.documentIds = ['passport'];
    }
    if (lowerMsg.includes('driving license') || lowerMsg.includes('dl')) {
      metadata.documentIds = ['driving_license'];
    }
    if (lowerMsg.includes('kyc')) {
      metadata.documentIds = ['kyc'];
    }
    if (lowerMsg.includes('aadhaar')) {
      metadata.documentIds = ['aadhaar'];
    }
    if (lowerMsg.includes('pan')) {
      metadata.documentIds = ['pan'];
    }

    // Detect form-related queries
    if (lowerMsg.includes('form') || lowerMsg.includes('fill')) {
      metadata.formType = 'generic_form';
    }
    if (lowerMsg.includes('passport form')) {
      metadata.formType = 'passport_form';
    }
    if (lowerMsg.includes('kyc form')) {
      metadata.formType = 'kyc_form';
    }

    // Detect procedure-related queries
    if (lowerMsg.includes('procedure') || lowerMsg.includes('how to')) {
      metadata.procedureType = 'general_procedure';
    }
    if (lowerMsg.includes('renew') || lowerMsg.includes('renewal')) {
      metadata.procedureType = 'renewal_procedure';
    }
    if (lowerMsg.includes('error') || lowerMsg.includes('issue') || lowerMsg.includes('problem')) {
      metadata.procedureType = 'troubleshooting';
    }

    return metadata;
  }

  /**
   * Build enhanced prompt with context
   */
  private buildEnhancedPrompt(userMessage: string, context: AssistantContext): string {
    const systemPrompt = this.systemPrompts.get(context.language) || this.config.systemPromptTemplate;
    
    const contextStr = this.buildContextString(context);
    const recentHistory = this.getRecentConversationSummary(context);

    return `
${systemPrompt}

Current Context:
${contextStr}

Recent Conversation:
${recentHistory}

User Message: ${userMessage}

Provide a helpful, accurate response tailored to the user's context and in ${context.language}.
    `.trim();
  }

  /**
   * Build context string for LLM
   */
  private buildContextString(context: AssistantContext): string {
    let str = `User ID: ${context.userId}\n`;
    str += `Language: ${context.language}\n`;
    
    if (context.documents.length > 0) {
      str += `Documents:\n`;
      context.documents.forEach(doc => {
        str += `  - ${doc.type}: ${doc.status}`;
        if (doc.expiryDate) {
          str += ` (Expires: ${new Date(doc.expiryDate).toLocaleDateString()})`;
        }
        str += '\n';
      });
    }

    if (context.currentForm) {
      str += `Current Form: ${context.currentForm.formType}\n`;
      str += `Filled Fields: ${context.currentForm.filledFields.join(', ') || 'None'}\n`;
      if (context.currentForm.emptyFields.length > 0) {
        str += `Empty Fields: ${context.currentForm.emptyFields.join(', ')}\n`;
      }
    }

    if (context.verificationStatus) {
      str += `Verification Status: ${context.verificationStatus.status}\n`;
      if (context.verificationStatus.lastError) {
        str += `Last Error: ${context.verificationStatus.lastError}\n`;
      }
    }

    return str;
  }

  /**
   * Get summary of recent conversation
   */
  private getRecentConversationSummary(context: AssistantContext): string {
    const recent = context.conversationHistory.slice(-4);
    return recent
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 100)}...`)
      .join('\n');
  }

  /**
   * Call LLM provider
   */
  private async callLLM(prompt: string, context: AssistantContext): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'azure':
        return this.callAzureOpenAI(prompt);
      case 'local':
        return this.callLocalLLM(prompt);
      case 'mock':
      default:
        return this.callMockLLM(prompt);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<LLMResponse> {
    // Minimal OpenAI Chat Completions integration using fetch.
    // Requires `OPENAI_API_KEY` in env or this.config.apiKey to be set.
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fall back to mock if no key available
      return this.callMockLLM(prompt);
    }

    try {
      const url = (this.config.endpoint || 'https://api.openai.com') + '/v1/chat/completions';
      const body = {
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: this.getDefaultSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        max_tokens: Math.min(this.config.maxTokens || 2000, 2000),
        temperature: this.config.temperature ?? 0.7
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('OpenAI API error', res.status, text);
        return this.callMockLLM(prompt);
      }

      const data = await res.json();
      const choice = data?.choices && data.choices[0];
      const content = choice?.message?.content ?? (choice?.text ?? '');
      const finishReason = choice?.finish_reason || 'stop';

      return {
        content: typeof content === 'string' ? content : JSON.stringify(content),
        usage: data?.usage,
        model: data?.model || this.config.model,
        finishReason
      };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return this.callMockLLM(prompt);
    }
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(prompt: string): Promise<LLMResponse> {
    // Mock implementation - replace with actual API call
    return {
      content: `Azure OpenAI Response: This is a helpful answer about government procedures and documentation.`,
      model: this.config.model,
      finishReason: 'stop'
    };
  }

  /**
   * Call local LLM (Ollama, etc.)
   */
  private async callLocalLLM(prompt: string): Promise<LLMResponse> {
    // Mock implementation - replace with actual local LLM call
    return {
      content: `Local LLM Response: Here's information about your government documentation question.`,
      model: this.config.model,
      finishReason: 'stop'
    };
  }

  /**
   * Call mock LLM for testing
   */
  private async callMockLLM(prompt: string): Promise<LLMResponse> {
    // Simulate LLM response
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responses = [
      'I can help you with passport renewal. You\'ll need to fill Form 2B, provide your current passport, two identity proofs, and address proofs. The process usually takes 7-10 days.',
      'To verify your KYC, please ensure all your documents are clear and properly scanned. Common issues include poor image quality or incorrect document format.',
      'The Driving License renewal process is straightforward. Your DL is valid until the expiry date mentioned on it. You can renew it 6 months before expiry.',
      'For Aadhaar-related queries, you can update your information at the nearest UIDAI enrollment center. Bring your ID proof and address proof.',
      'Regarding missing documents, typically you need an identity proof, address proof, and document-specific requirements depending on the form type.'
    ];
    
    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      model: 'mock-assistant',
      finishReason: 'stop'
    };
  }

  /**
   * Initialize knowledge base
   */
  private initializeKnowledgeBase(): void {
    const entries: KnowledgeEntry[] = [
      {
        id: 'passport_renewal',
        type: 'procedure',
        title: 'Passport Renewal Process',
        description: 'Complete guide to renewing your Indian passport',
        relatedDocuments: ['current_passport', 'identity_proof', 'address_proof'],
        steps: [
          'Download and fill Form 2B from passport.gov.in',
          'Collect required documents (current passport, 2 proofs)',
          'Book appointment at nearest PSK',
          'Attend appointment with original documents',
          'Complete verification process',
          'Receive renewed passport within 7-10 days'
        ],
        commonIssues: [
          {
            issue: 'Document quality poor',
            solution: 'Ensure documents are scanned in clear, bright conditions'
          },
          {
            issue: 'Address mismatch',
            solution: 'Update address with latest proof of residence'
          }
        ],
        keywords: ['passport', 'renew', 'psk', 'form 2b'],
        language: 'en'
      },
      {
        id: 'kyc_verification',
        type: 'procedure',
        title: 'KYC Verification Process',
        description: 'Know Your Customer verification requirements',
        relatedDocuments: ['aadhaar', 'pan', 'address_proof'],
        steps: [
          'Provide Aadhaar number',
          'Provide PAN card details',
          'Submit address proof (recent utility bill or bank statement)',
          'Verification completed within 2-3 working days'
        ],
        commonIssues: [
          {
            issue: 'Aadhaar not linked',
            solution: 'Link your Aadhaar at nearest UIDAI center'
          }
        ],
        keywords: ['kyc', 'verification', 'aadhaar', 'pan'],
        language: 'en'
      }
    ];

    entries.forEach(entry => {
      if (!this.knowledgeBase.has(entry.type)) {
        this.knowledgeBase.set(entry.type, []);
      }
      this.knowledgeBase.get(entry.type)!.push(entry);
    });
  }

  /**
   * Initialize system prompts for different languages
   */
  private initializeSystemPrompts(): void {
    this.systemPrompts.set('en', `You are a helpful AI assistant for the Bharat ID platform.
Your role is to help users understand government procedures, fill forms, and resolve verification issues.
Be clear, concise, and provide step-by-step guidance.
Always be accurate about official procedures and requirements.`);

    this.systemPrompts.set('hi', `आप भारत आईडी प्लेटफॉर्म के लिए एक सहायक AI सहायक हैं।
आपकी भूमिका उपयोगकर्ताओं को सरकारी प्रक्रियाओं को समझने, फॉर्म भरने और सत्यापन समस्याओं को हल करने में मदद करना है।
स्पष्ट, संक्षिप्त बनें और चरण-दर-चरण मार्गदर्शन प्रदान करें।`);
  }

  /**
   * Find knowledge entry
   */
  private findKnowledgeEntry(
    query: string,
    type: string,
    language: string
  ): KnowledgeEntry | undefined {
    const entries = this.knowledgeBase.get(type) || [];
    const queryLower = query.toLowerCase();
    
    return entries.find(entry =>
      entry.language === language &&
      (entry.title.toLowerCase().includes(queryLower) ||
       entry.keywords.some(kw => kw.includes(queryLower)))
    );
  }

  /**
   * Parse recommendations from response
   */
  private parseRecommendations(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.match(/^\d+\.|^-|^•/))
      .map(line => line.replace(/^\d+\.|^-|^•/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Parse solutions from response
   */
  private parseSolutions(response: string): string[] {
    return response
      .split('\n\n')
      .filter(section => section.toLowerCase().includes('solution') || section.toLowerCase().includes('fix'))
      .flatMap(section =>
        section
          .split('\n')
          .filter(line => line.match(/^\d+\.|^-|^•/))
          .map(line => line.replace(/^\d+\.|^-|^•/, '').trim())
      )
      .filter(line => line.length > 0);
  }

  /**
   * Trim conversation history
   */
  private trimConversationHistory(context: AssistantContext): void {
    // Keep only last 10 messages + system context
    context.conversationHistory = context.conversationHistory.slice(-10);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(response: LLMResponse): number {
    // Simple heuristic based on finish reason
    if (response.finishReason === 'stop') return 0.95;
    if (response.finishReason === 'length') return 0.7;
    return 0.5;
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI assistant for the Bharat ID platform.
Your role is to help users understand government procedures, fill forms, and resolve verification issues.
Be clear, concise, and provide step-by-step guidance.
Always be accurate about official procedures and requirements.
Respond in the user's preferred language.`;
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistant({
  provider: (process.env.ASSISTANT_PROVIDER as any) || 'mock',
  model: process.env.ASSISTANT_MODEL || 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  endpoint: process.env.OPENAI_ENDPOINT,
  maxTokens: parseInt(process.env.ASSISTANT_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.ASSISTANT_TEMPERATURE || '0.7')
});
