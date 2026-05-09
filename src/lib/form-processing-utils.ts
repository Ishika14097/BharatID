/**
 * Form Processing Utilities
 * 
 * Utilities for:
 * - PDF generation from filled forms
 * - Form parsing and field extraction
 * - Data formatting and transformation
 * - Advanced field matching algorithms
 */

import type { FormField, FormStructure, IdentityProfile, AutofillSuggestion } from "./form-autofill-engine";

/**
 * PDF Generation Service
 * 
 * Generates completed PDF forms with filled data
 */
export class PDFGenerationService {
  /**
   * Generate PDF content (simplified mock implementation)
   * In production, use libraries like pdfkit, pdf-lib, or puppeteer
   */
  static generatePDF(
    formName: string,
    formData: Record<string, string>,
    formStructure: FormStructure
  ): Buffer {
    // Mock PDF generation
    // In production, this would use pdf-lib or similar
    const pdfContent = this.createPDFContent(formName, formData, formStructure);
    return Buffer.from(pdfContent, "utf-8");
  }

  private static createPDFContent(
    formName: string,
    data: Record<string, string>,
    form: FormStructure
  ): string {
    let content = "%PDF-1.4\n";
    content += "%Mock PDF Content\n";
    content += `%Form: ${formName}\n`;
    content += `%Generated: ${new Date().toISOString()}\n\n`;

    // Document structure
    content += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    content += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    content += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n";

    // Content stream with form data
    content += "4 0 obj\n<< /Length 500 >>\nstream\n";
    content += "BT\n/F1 12 Tf\n50 750 Td\n";
    content += `(${formName}) Tj\n`;
    content += "0 -20 Td\n";

    for (const field of form.fields) {
      const value = data[field.id] || "";
      if (value) {
        content += `(${field.label}: ${this.escapeString(value)}) Tj\n`;
        content += "0 -15 Td\n";
      }
    }

    content += "ET\nendstream\nendobj\n";
    content += "xref\n0 5\n0000000000 65535 f\n";
    content += "0000000009 00000 n\n";
    content += "0000000058 00000 n\n";
    content += "0000000115 00000 n\n";
    content += "0000000214 00000 n\n";
    content += "trailer\n<< /Size 5 /Root 1 0 R >>\n";
    content += "startxref\n715\n%%EOF\n";

    return content;
  }

  private static escapeString(str: string): string {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .substring(0, 100);
  }

  /**
   * Generate form completion report
   */
  static generateCompletionReport(
    formId: string,
    data: Record<string, string>,
    form: FormStructure
  ): {
    totalFields: number;
    filledFields: number;
    completionPercentage: number;
    requiredFieldsCompleted: boolean;
    timestamp: Date;
  } {
    const requiredFields = form.fields.filter(f => f.required);
    const filledCount = Object.keys(data).filter(k => data[k]?.trim()).length;
    const requiredFilled = requiredFields.filter(f => data[f.id]?.trim()).length;

    return {
      totalFields: form.fields.length,
      filledFields: filledCount,
      completionPercentage: Math.round((filledCount / form.fields.length) * 100),
      requiredFieldsCompleted: requiredFilled === requiredFields.length,
      timestamp: new Date()
    };
  }
}

/**
 * Form Field Parser
 * 
 * Extracts and validates field structures from various sources
 */
export class FormFieldParser {
  /**
   * Parse HTML form and extract field structure
   */
  static parseHTMLForm(htmlContent: string): FormField[] {
    const fields: FormField[] = [];
    
    // Simple regex-based HTML parsing
    // In production, use a proper HTML parser like cheerio or jsdom
    const inputRegex = /<input[^>]*>/g;
    const selectRegex = /<select[^>]*>[\s\S]*?<\/select>/g;
    const textareaRegex = /<textarea[^>]*>[\s\S]*?<\/textarea>/g;

    // Parse input elements
    let match;
    let counter = 0;

    while ((match = inputRegex.exec(htmlContent)) !== null) {
      const fieldHtml = match[0];
      const field = this.parseInputElement(fieldHtml, counter++);
      if (field) fields.push(field);
    }

    // Parse select elements
    while ((match = selectRegex.exec(htmlContent)) !== null) {
      const fieldHtml = match[0];
      const field = this.parseSelectElement(fieldHtml, counter++);
      if (field) fields.push(field);
    }

    // Parse textarea elements
    while ((match = textareaRegex.exec(htmlContent)) !== null) {
      const fieldHtml = match[0];
      const field = this.parseTextareaElement(fieldHtml, counter++);
      if (field) fields.push(field);
    }

    return fields;
  }

  private static parseInputElement(html: string, index: number): FormField | null {
    const nameMatch = html.match(/name=["']([^"']+)["']/);
    const typeMatch = html.match(/type=["']([^"']+)["']/);
    const labelMatch = html.match(/placeholder=["']([^"']+)["']/);
    const requiredMatch = html.match(/required/);

    if (!nameMatch) return null;

    const type = typeMatch?.[1] || "text";
    const validTypes = ["text", "email", "phone", "date", "number", "checkbox"];

    return {
      id: `field_${index}`,
      name: nameMatch[1],
      type: validTypes.includes(type) ? (type as any) : "text",
      required: !!requiredMatch,
      placeholder: labelMatch?.[1],
      label: labelMatch?.[1] || nameMatch[1]
    };
  }

  private static parseSelectElement(html: string, index: number): FormField | null {
    const nameMatch = html.match(/name=["']([^"']+)["']/);
    const requiredMatch = html.match(/required/);
    const optionsRegex = /<option[^>]*>([^<]+)<\/option>/g;

    if (!nameMatch) return null;

    const options: string[] = [];
    let match;

    while ((match = optionsRegex.exec(html)) !== null) {
      options.push(match[1]);
    }

    return {
      id: `field_${index}`,
      name: nameMatch[1],
      type: "select",
      required: !!requiredMatch,
      options,
      label: nameMatch[1]
    };
  }

  private static parseTextareaElement(html: string, index: number): FormField | null {
    const nameMatch = html.match(/name=["']([^"']+)["']/);
    const requiredMatch = html.match(/required/);

    if (!nameMatch) return null;

    return {
      id: `field_${index}`,
      name: nameMatch[1],
      type: "textarea",
      required: !!requiredMatch,
      label: nameMatch[1]
    };
  }

  /**
   * Normalize field names to match pattern
   */
  static normalizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[\s_-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .trim();
  }

  /**
   * Extract field type from various indicators
   */
  static inferFieldType(
    name: string,
    label?: string,
    value?: string
  ): FormField["type"] {
    const fullText = (name + " " + label + " " + value).toLowerCase();

    if (fullText.includes("email") || fullText.includes("mail")) return "email";
    if (fullText.includes("phone") || fullText.includes("mobile") || fullText.includes("tel"))
      return "phone";
    if (fullText.includes("date") || fullText.includes("dob") || fullText.includes("birth"))
      return "date";
    if (fullText.includes("amount") || fullText.includes("income") || fullText.includes("price"))
      return "number";
    if (fullText.includes("agree") || fullText.includes("confirm") || fullText.includes("check"))
      return "checkbox";
    if (fullText.includes("address") || fullText.includes("description") || fullText.includes("comment"))
      return "textarea";

    return "text";
  }
}

/**
 * Advanced Field Matching with Multiple Strategies
 */
export class AdvancedFieldMatcher {
  /**
   * Token-based matching (word-by-word comparison)
   */
  static tokenBasedMatch(formField: string, profileField: string): number {
    const formTokens = this.tokenize(formField);
    const profileTokens = this.tokenize(profileField);

    let matchCount = 0;
    for (const token of formTokens) {
      if (profileTokens.includes(token)) {
        matchCount++;
      }
    }

    return formTokens.length > 0 ? matchCount / formTokens.length : 0;
  }

  private static tokenize(str: string): string[] {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  /**
   * Semantic similarity using word relationships
   */
  static semanticMatch(formField: string, profileField: string): number {
    const synonyms = this.getSynonymMap();
    const formTokens = this.tokenize(formField);
    const profileTokens = this.tokenize(profileField);

    let score = 0;

    for (const formToken of formTokens) {
      for (const profileToken of profileTokens) {
        if (formToken === profileToken) {
          score += 1.0;
        } else if (this.areSynonyms(formToken, profileToken, synonyms)) {
          score += 0.8;
        }
      }
    }

    const maxPossible = Math.max(formTokens.length, profileTokens.length);
    return maxPossible > 0 ? score / maxPossible : 0;
  }

  private static getSynonymMap(): Map<string, string[]> {
    return new Map([
      ["first", ["given", "forename", "firstname"]],
      ["last", ["family", "surname", "lastname"]],
      ["name", ["full", "fullname"]],
      ["email", ["mail", "electronic"]],
      ["phone", ["mobile", "contact", "telephone", "tel"]],
      ["address", ["residential", "street", "location"]],
      ["city", ["town", "municipality"]],
      ["state", ["province", "region"]],
      ["pin", ["postal", "zip", "zipcode"]],
      ["date", ["birth", "dob"]],
      ["gender", ["sex"]],
      ["income", ["salary", "earnings"]],
      ["occupation", ["profession", "job", "career"]]
    ]);
  }

  private static areSynonyms(
    word1: string,
    word2: string,
    synonymMap: Map<string, string[]>
  ): boolean {
    // Direct mapping
    if (synonymMap.has(word1) && synonymMap.get(word1)?.includes(word2)) {
      return true;
    }
    if (synonymMap.has(word2) && synonymMap.get(word2)?.includes(word1)) {
      return true;
    }

    // Reverse mapping
    for (const [key, values] of synonymMap) {
      if (values.includes(word1) && values.includes(word2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Phonetic similarity (Soundex-like)
   */
  static phoneticMatch(formField: string, profileField: string): number {
    const formCode = this.soundexCode(formField);
    const profileCode = this.soundexCode(profileField);
    return formCode === profileCode ? 0.9 : 0;
  }

  private static soundexCode(str: string): string {
    const code = str
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 1);
    if (!code) return "";

    const digits = str
      .toUpperCase()
      .replace(/[AEIOUYHW]/g, "")
      .replace(/[BFPV]/g, "1")
      .replace(/[CGJKQSXZ]/g, "2")
      .replace(/[DT]/g, "3")
      .replace(/[L]/g, "4")
      .replace(/[MN]/g, "5")
      .replace(/[R]/g, "6")
      .substring(1, 4)
      .replace(/(\d)\1+/g, "$1")
      .replace(/[0]/g, "");

    return code + (digits + "000").substring(0, 3);
  }

  /**
   * Combined matching score (ensemble approach)
   */
  static combinedMatch(formField: string, profileField: string): number {
    const tokenScore = this.tokenBasedMatch(formField, profileField);
    const semanticScore = this.semanticMatch(formField, profileField);
    const phoneticScore = this.phoneticMatch(formField, profileField);

    // Weighted average
    return tokenScore * 0.5 + semanticScore * 0.3 + phoneticScore * 0.2;
  }
}

/**
 * Data Formatter and Transformer
 */
export class DataFormatter {
  /**
   * Format address for form
   */
  static formatAddress(
    line1?: string,
    line2?: string,
    city?: string,
    state?: string,
    pin?: string
  ): string {
    const parts = [line1, line2, city, state, pin].filter(Boolean);
    return parts.join(", ");
  }

  /**
   * Format name with proper casing
   */
  static formatName(firstName?: string, middleName?: string, lastName?: string): string {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    return parts
      .map(p => p?.charAt(0).toUpperCase() + p?.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Format phone number to standard format
   */
  static formatPhoneNumber(phone: string, format: "standard" | "international" = "standard"): string {
    const digits = phone.replace(/\D/g, "");

    if (format === "international") {
      if (digits.length === 10) return "+91" + digits;
      if (digits.length === 12 && digits.startsWith("91")) return "+" + digits;
      return "+" + digits;
    }

    // Standard format
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith("91")) return digits.substring(2);
    return digits;
  }

  /**
   * Format date to various formats
   */
  static formatDate(dateStr: string, format: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" = "DD/MM/YYYY"): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      if (format === "YYYY-MM-DD") return `${year}-${month}-${day}`;
      if (format === "MM/DD/YYYY") return `${month}/${day}/${year}`;
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Format amount with currency
   */
  static formatAmount(amount: number, currency: string = "INR"): string {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency
    }).format(amount);
    return formatted;
  }

  /**
   * Mask sensitive data
   */
  static maskData(value: string, type: "aadhaar" | "pan" | "phone" | "email"): string {
    switch (type) {
      case "aadhaar":
        return value.replace(/\d(?=\d{4})/g, "*");
      case "pan":
        return value.substring(0, 3) + "*****" + value.substring(8);
      case "phone":
        return "*****" + value.slice(-4);
      case "email":
        const [local, domain] = value.split("@");
        return local.substring(0, 2) + "*****" + (domain ? "@" + domain : "");
      default:
        return value;
    }
  }

  /**
   * Validate and clean data
   */
  static cleanData(data: Record<string, any>): Record<string, string> {
    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      cleaned[key] = String(value).trim();
    }

    return cleaned;
  }
}

/**
 * Field Dependency Manager
 * 
 * Handles field dependencies and conditional field display
 */
export class FieldDependencyManager {
  private dependencies: Map<string, FieldDependency> = new Map();

  /**
   * Define field dependency
   */
  addDependency(
    fieldId: string,
    dependsOn: string,
    condition: (value: string) => boolean
  ) {
    if (!this.dependencies.has(fieldId)) {
      this.dependencies.set(fieldId, { fieldId, dependsOn: [], conditions: [] });
    }

    const dep = this.dependencies.get(fieldId)!;
    dep.dependsOn.push(dependsOn);
    dep.conditions.push(condition);
  }

  /**
   * Check if field should be visible
   */
  isFieldVisible(fieldId: string, formData: Record<string, string>): boolean {
    const dependency = this.dependencies.get(fieldId);
    if (!dependency) return true;

    for (let i = 0; i < dependency.dependsOn.length; i++) {
      const parentFieldId = dependency.dependsOn[i];
      const condition = dependency.conditions[i];
      const parentValue = formData[parentFieldId] || "";

      if (!condition(parentValue)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get visible fields for current form state
   */
  getVisibleFields(
    fields: FormField[],
    formData: Record<string, string>
  ): FormField[] {
    return fields.filter(f => this.isFieldVisible(f.id, formData));
  }
}

interface FieldDependency {
  fieldId: string;
  dependsOn: string[];
  conditions: Array<(value: string) => boolean>;
}

export const pdfService = new PDFGenerationService();
export const fieldParser = new FormFieldParser();
export const dataFormatter = new DataFormatter();
export const advancedMatcher = new AdvancedFieldMatcher();
export const dependencyManager = new FieldDependencyManager();
