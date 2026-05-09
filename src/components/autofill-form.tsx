"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
  Loader,
  Percent,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  XCircle
} from 'lucide-react';
import type { AutofillSuggestion, FormField, FormStructure } from '@/server/form-autofill-engine';
import { fetchAISuggestions } from '@/lib/ai-autofill';

interface AutofillFormProps {
  form: FormStructure;
  suggestions: AutofillSuggestion[];
  profileId: string;
  onSubmit: (data: Record<string, string>) => void;
  onSaveTemplate?: (name: string) => void;
  isLoading?: boolean;
}

interface FormFieldState {
  value: string;
  confidence?: number;
  fromAutofill: boolean;
  edited: boolean;
  suggestion?: AutofillSuggestion;
}

export function AutofillFormComponent({
  form,
  suggestions,
  profileId,
  onSubmit,
  onSaveTemplate,
  isLoading = false
}: AutofillFormProps) {
  const [formData, setFormData] = useState<Record<string, FormFieldState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [localSuggestions, setLocalSuggestions] = useState<AutofillSuggestion[]>(suggestions);
  const [acceptAllSuggestions, setAcceptAllSuggestions] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [autoApplyThreshold, setAutoApplyThreshold] = useState<number>(85);

  // Initialize form with suggestions
  useEffect(() => {
    setLocalSuggestions(suggestions || []);
    const initialized: Record<string, FormFieldState> = {};

    form.fields.forEach(field => {
      const suggestion = (suggestions || []).find(s => s.fieldId === field.id);
      initialized[field.id] = {
        value: suggestion?.suggestedValue || '',
        confidence: suggestion?.confidence,
        fromAutofill: !!suggestion,
        edited: false,
        suggestion
      };
    });

    setFormData(initialized);
  }, [form, suggestions]);

  // Auto-accept high confidence suggestions
  useEffect(() => {
    if (acceptAllSuggestions) {
      const updated = { ...formData };
      localSuggestions.forEach(suggestion => {
        if (suggestion.confidence >= 80) {
          updated[suggestion.fieldId] = {
            ...updated[suggestion.fieldId],
            value: suggestion.suggestedValue,
            fromAutofill: true
          };
        }
      });
      setFormData(updated);
    }
  }, [acceptAllSuggestions]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
        edited: true
      }
    }));
  };

  const handleAcceptSuggestion = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
        fromAutofill: true,
        edited: false
      }
    }));
  };

  const handleRejectSuggestion = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value: '',
        fromAutofill: false,
        edited: true
      }
    }));
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-100';
    if (confidence >= 75) return 'bg-blue-100';
    if (confidence >= 60) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const getCurrentSection = () => {
    if (!form.sections || form.sections.length === 0) return form.fields;
    return form.fields.filter(f =>
      form.sections![currentSection].fields.includes(f.id)
    );
  };

  const currentSectionFields = getCurrentSection();
  const totalSections = form.sections?.length || 1;

  // Calculate statistics
  const filledCount = Object.values(formData).filter(f => f.value.trim()).length;
  const autofillCount = Object.values(formData).filter(f => f.fromAutofill).length;
  const completionPercentage = Math.round((filledCount / form.fields.length) * 100);
  const avgConfidence = Math.round(
    localSuggestions.reduce((sum, s) => sum + s.confidence, 0) / (localSuggestions.length || 1)
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      const fieldState = formData[field.id];
      if (field.required && !fieldState?.value?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data: Record<string, string> = {};
      Object.entries(formData).forEach(([fieldId, state]) => {
        data[fieldId] = state.value;
      });
      onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const data: Record<string, string> = {};
    Object.entries(formData).forEach(([fieldId, state]) => {
      if (state.value) {
        data[fieldId] = state.value;
      }
    });

    onSaveTemplate?.(templateName);
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const loadAiSuggestions = async () => {
    try {
      setAiLoading(true);
      const partialValues: Record<string, string> = {};
      Object.entries(formData).forEach(([k, v]) => {
        if (v.value) partialValues[k] = v.value;
      });

      const aiResults = await fetchAISuggestions({
        userId: profileId,
        formSchema: form,
        partialValues,
        language: 'en'
      });

      // Map AI results to AutofillSuggestion shape
      const mapped: AutofillSuggestion[] = aiResults.map(r => ({
        fieldId: r.fieldId,
        fieldName: r.fieldId,
        suggestedValue: r.value,
        confidence: Math.round(r.confidence),
        source: 'AI',
        sourceType: 'contextual',
        alternatives: [],
        notes: r.rationale
      }));

      setLocalSuggestions(prev => {
        const byId = new Map(prev.map(s => [s.fieldId, s]));
        mapped.forEach(m => byId.set(m.fieldId, m));
        return Array.from(byId.values());
      });

      // Merge suggestions into formData without overwriting edited values
      setFormData(prev => {
        const next = { ...prev };
        mapped.forEach(m => {
          const existing = next[m.fieldId];
          if (!existing) return;
          // If user hasn't edited, update suggestion and value (auto-apply if high confidence)
          if (!existing.edited) {
            const shouldAutoApply = m.confidence >= autoApplyThreshold;
            next[m.fieldId] = {
              ...existing,
              value: shouldAutoApply ? m.suggestedValue : existing.value || '',
              confidence: m.confidence,
              fromAutofill: shouldAutoApply ? true : existing.fromAutofill,
              suggestion: m
            };
          } else {
            next[m.fieldId] = {
              ...existing,
              suggestion: m,
              confidence: m.confidence
            };
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to load AI suggestions', error);
      alert('AI suggestion failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8" />
              {form.name}
            </h1>
            <p className="text-blue-100 mt-2">AI-Powered Form Autofill</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{completionPercentage}%</p>
            <p className="text-blue-100 text-sm">Complete</p>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Fields</p>
            <p className="font-bold">{filledCount}/{form.fields.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-xs text-gray-600">Autofilled</p>
            <p className="font-bold">{autofillCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-600">Avg Confidence</p>
            <p className="font-bold">{avgConfidence}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-xs text-gray-600">Suggestions</p>
            <p className="font-bold">{suggestions.length}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
        >
          {showSuggestions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showSuggestions ? 'Hide' : 'Show'} Suggestions
        </button>

        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 cursor-pointer transition">
          <input
            type="checkbox"
            checked={acceptAllSuggestions}
            onChange={e => setAcceptAllSuggestions(e.target.checked)}
            className="w-4 h-4"
          />
          Auto-accept suggestions
        </label>

        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
        >
          <Save className="h-4 w-4" />
          Save as Template
        </button>
        <button
          onClick={loadAiSuggestions}
          disabled={aiLoading}
          className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition"
        >
          {aiLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {aiLoading ? 'Fetching AI' : 'Refresh AI Suggestions'}
        </button>
      </div>

      {/* Section Navigation */}
      {form.sections && form.sections.length > 1 && (
        <div className="px-6 py-4 border-b border-gray-200 flex gap-2 overflow-x-auto">
          {form.sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(idx)}
              className={`px-4 py-2 rounded whitespace-nowrap transition ${
                currentSection === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      )}

      {/* Section Title */}
      {form.sections && form.sections[currentSection] && (
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {form.sections[currentSection].title}
          </h2>
          {form.sections[currentSection].description && (
            <p className="text-gray-600 mt-1">
              {form.sections[currentSection].description}
            </p>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="px-6 py-6 space-y-6">
        {currentSectionFields.map(field => {
          const fieldState = formData[field.id];
          const suggestion = fieldState?.suggestion;
          const hasError = errors[field.id];

          return (
            <div key={field.id} className="space-y-2">
              <label className="flex items-center gap-2 font-semibold text-gray-700">
                {field.label || field.name}
                {field.required && <span className="text-red-600">*</span>}
              </label>

              {/* Suggestion Card */}
              {showSuggestions && suggestion && suggestion.confidence < 100 && (
                <div
                  className={`p-3 rounded-lg border-l-4 border-blue-400 ${getConfidenceBgColor(
                    suggestion.confidence
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-semibold text-sm">AI Suggestion</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${getConfidenceColor(
                            suggestion.confidence
                          )}`}
                        >
                          {suggestion.confidence}% confident
                        </span>
                      </div>
                      <p className="text-sm mb-2">
                        <strong>Suggested value:</strong> {suggestion.suggestedValue}
                      </p>
                      {suggestion.notes && (
                        <p className="text-xs text-gray-600">
                          <strong>Source:</strong> {suggestion.source} ({suggestion.sourceType})
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleAcceptSuggestion(field.id, suggestion.suggestedValue)
                        }
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectSuggestion(field.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Field */}
              {field.type === 'textarea' ? (
                <textarea
                  value={fieldState?.value || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    hasError
                      ? 'border-red-600 bg-red-50'
                      : fieldState?.fromAutofill
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  rows={4}
                />
              ) : field.type === 'select' ? (
                <select
                  value={fieldState?.value || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    hasError
                      ? 'border-red-600 bg-red-50'
                      : fieldState?.fromAutofill
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select --</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={fieldState?.value || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    hasError
                      ? 'border-red-600 bg-red-50'
                      : fieldState?.fromAutofill
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300'
                  }`}
                />
              )}

              {/* Error Message */}
              {hasError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {hasError}
                </div>
              )}

              {/* Field Status */}
              {!hasError && fieldState?.value && (
                <div className="flex items-center gap-2 text-sm">
                  {fieldState.fromAutofill ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Autofilled (edited)</span>
                    </div>
                  ) : fieldState.edited ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Edit2 className="h-4 w-4" />
                      <span>Manually entered</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      {form.sections && form.sections.length > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setCurrentSection(Math.min(form.sections!.length - 1, currentSection + 1))
            }
            disabled={currentSection === form.sections.length - 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {submitting ? 'Processing...' : 'Generate PDF & Submit'}
        </button>
      </div>

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Save as Template</h2>
            <p className="text-gray-600 mb-4">
              Save the current form data as a reusable template for future forms.
            </p>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Enter template name (e.g., 'My Scholarship Template')"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
