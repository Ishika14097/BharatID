'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Badge,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Loader,
  Sparkles,
  Tag,
  TrendingUp
} from 'lucide-react';
import type { FormStructure, AutofillResult } from '@/server/form-autofill-engine';

interface FormSelectorProps {
  availableForms: FormStructure[];
  profileId: string;
  onFormSelected: (formId: string, autofillResult: AutofillResult) => void;
  savedTemplates?: Record<string, { name: string; formId: string; savedAt: Date }>;
  isLoading?: boolean;
}

interface FormPreview {
  form: FormStructure;
  autofillResult?: AutofillResult;
  loading: boolean;
  error?: string;
}

export function FormSelectorComponent({
  availableForms,
  profileId,
  onFormSelected,
  savedTemplates,
  isLoading = false
}: FormSelectorProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Map<string, FormPreview>>(new Map());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'scholarship' | 'passport' | 'kyc'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load form previews
  useEffect(() => {
    availableForms.forEach(form => {
      if (!previews.has(form.id)) {
        generatePreview(form);
      }
    });
  }, [availableForms]);

  const generatePreview = async (form: FormStructure) => {
    setPreviews(prev => new Map(prev).set(form.id, { form, loading: true }));

    try {
      // Mock autofill result generation
      // In production, this would call the backend autofill engine
      const mockResult: AutofillResult = {
        formId: form.id,
        profileId,
        suggestions: [],
        completionPercentage: Math.floor(Math.random() * 100),
        highConfidenceFields: [],
        lowConfidenceFields: [],
        missingFields: [],
        timestamp: new Date()
      };

      setPreviews(prev =>
        new Map(prev).set(form.id, {
          form,
          autofillResult: mockResult,
          loading: false
        })
      );
    } catch (error) {
      setPreviews(prev =>
        new Map(prev).set(form.id, {
          form,
          loading: false,
          error: 'Failed to load preview'
        })
      );
    }
  };

  const filteredForms = availableForms.filter(form => {
    if (filterType !== 'all' && form.type !== filterType) return false;
    if (
      searchQuery &&
      !form.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getFormIcon = (type: string) => {
    switch (type) {
      case 'scholarship':
        return '🎓';
      case 'passport':
        return '📕';
      case 'kyc':
        return '🆔';
      default:
        return '📋';
    }
  };

  const getFormTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Sparkles className="h-10 w-10 text-blue-600" />
            Select Form to Autofill
          </h1>
          <p className="text-gray-600 text-lg">
            Choose a government form and we'll autofill it with your saved identity data
          </p>
        </div>

        {/* Saved Templates Section */}
        {savedTemplates && Object.keys(savedTemplates).length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Saved Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(savedTemplates).map(([templateId, template]) => (
                <button
                  key={templateId}
                  onClick={() => setSelectedTemplate(templateId)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedTemplate === templateId
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-400 bg-white'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{template.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    For: {getFormTypeLabel(template.formId)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Saved: {new Date(template.savedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'scholarship', 'passport', 'kyc'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type === 'all' ? 'All Forms' : getFormTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No forms found</p>
            </div>
          ) : (
            filteredForms.map(form => {
              const preview = previews.get(form.id);
              const result = preview?.autofillResult;

              return (
                <div
                  key={form.id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-xl transition border-2 cursor-pointer overflow-hidden ${
                    selectedFormId === form.id
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedFormId(form.id)}
                >
                  {/* Card Header */}
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{getFormIcon(form.type)}</span>
                      <span className="text-xs font-bold bg-white text-blue-600 px-3 py-1 rounded-full">
                        {getFormTypeLabel(form.type)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">{form.name}</h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Form Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{form.fields.length} fields</span>
                      </div>
                      {form.sections && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Tag className="h-4 w-4" />
                          <span>{form.sections.length} sections</span>
                        </div>
                      )}
                    </div>

                    {/* Autofill Preview */}
                    {preview?.loading ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading preview...</span>
                      </div>
                    ) : result ? (
                      <div className="space-y-3 border-t pt-4">
                        {/* Completion Percentage */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Autofill Coverage</span>
                          <div className="flex items-center gap-2">
                            <div className={`text-lg font-bold ${getCompletionColor(result.completionPercentage)}`}>
                              {result.completionPercentage}%
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${result.completionPercentage}%` }}
                          />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Lightbulb className="h-3 w-3" />
                            <span>{result.suggestions.length} suggestions</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-3 w-3" />
                            <span>{result.missingFields.length} missing</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Instructions */}
                    {form.instructions && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                        <strong>Note:</strong> {form.instructions}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => {
                        if (result) {
                          onFormSelected(form.id, result);
                        }
                      }}
                      disabled={preview?.loading || isLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {preview?.loading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Start Autofill
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="h-8 w-8 text-blue-600" />
              <h3 className="font-bold text-gray-900">Smart Suggestions</h3>
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered field matching suggests the right information with confidence scores.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <h3 className="font-bold text-gray-900">Quick Verification</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Review and edit autofilled data before generating your completed PDF.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <h3 className="font-bold text-gray-900">Save Templates</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Create reusable templates to fill similar forms faster next time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
