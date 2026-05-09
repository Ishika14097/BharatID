'use client';

import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import { AutofillFormComponent } from '@/components/autofill-form';
import { FormSelectorComponent } from '@/components/form-selector';
import type { AutofillResult, FormField, FormSection, FormStructure, IdentityProfile } from '@/server/form-autofill-engine';
import { getAvailableForms, getAutofillSuggestions, saveFormTemplate } from '@/lib/autofill-server-fns';

interface AutofillPageState {
  stage: 'select' | 'autofill' | 'preview';
  selectedForm?: FormStructure;
  autofillResult?: AutofillResult;
  profile?: IdentityProfile;
  profileId: string;
  error?: string;
  isLoading: boolean;
}

export const Route = createFileRoute('/autofill')({
  component: AutofillPage,
});

// Mock functions removed. Backend server functions handle this now.

export function AutofillPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AutofillPageState>({
    stage: 'select',
    profileId: '',
    isLoading: true,
    error: undefined
  });

  const [forms, setForms] = useState<FormStructure[]>([]);

  // Load identity profile and forms on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const mockProfileId = localStorage.getItem('current_profile_id') || 'profile_001';
        
        // Fetch forms from backend
        const backendForms = await getAvailableForms();
        setForms(backendForms);

        setState(prev => ({
          ...prev,
          profileId: mockProfileId,
          isLoading: false
        }));

        localStorage.setItem('current_profile_id', mockProfileId);
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to load initial data',
          isLoading: false
        }));
      }
    };

    loadData();
  }, []);

  const handleFormSelected = async (formId: string, autofillResult?: AutofillResult) => {
    const form = forms.find((entry) => entry.id === formId);
    if (!form) {
      setState(prev => ({ ...prev, error: 'Form not found' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // If FormSelectorComponent didn't provide suggestions, fetch them from backend
      const result = autofillResult || await getAutofillSuggestions({ data: { formId, profileId: state.profileId } });
      
      setState(prev => ({
        ...prev,
        stage: 'autofill',
        selectedForm: form,
        autofillResult: result,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to generate suggestions from backend',
        isLoading: false
      }));
    }
  };

  const handleFormSubmit = async (data: Record<string, string>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      if (!state.selectedForm) throw new Error('Form not selected');

      const blob = new Blob([
        `Form: ${state.selectedForm.name}\n\n${JSON.stringify(data, null, 2)}`
      ], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.selectedForm.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Show success message
      setState(prev => ({
        ...prev,
        stage: 'select',
        selectedForm: undefined,
        autofillResult: undefined,
        isLoading: false
      }));

      // Show notification
      alert('Form submitted successfully! PDF has been downloaded.');
    } catch (error) {
      console.error('Error submitting form:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate PDF',
        isLoading: false
      }));
    }
  };

  const handleSaveTemplate = async (templateName: string) => {
    if (!state.selectedForm || !state.autofillResult) return;

    try {
      // Get current form data from DOM
      const formData: Record<string, string> = {};
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const fieldId = (input as any).name || (input as any).id;
        if (fieldId) {
          formData[fieldId] = (input as any).value;
        }
      });

      // Save using backend function
      await saveFormTemplate({
        data: {
          templateName,
          formId: state.selectedForm.id,
          formData
        }
      });

      // Also save locally for persistence
      localStorage.setItem(`autofill_template_${templateName}`, JSON.stringify({
        formId: state.selectedForm.id,
        formData,
        savedAt: new Date().toISOString()
      }));

      alert(`Template "${templateName}" saved successfully to backend!`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template to backend');
    }
  };

  if (state.isLoading && state.stage === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (state.error && state.stage === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (state.stage === 'autofill') {
                setState(prev => ({
                  ...prev,
                  stage: 'select',
                  selectedForm: undefined,
                  autofillResult: undefined
                }));
              } else {
                navigate({ to: '/dashboard' });
              }
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Government Form Autofill</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {state.stage === 'select' ? (
          <FormSelectorComponent
            availableForms={forms}
            profileId={state.profileId}
            onFormSelected={handleFormSelected}
            isLoading={state.isLoading}
          />
        ) : state.stage === 'autofill' && state.selectedForm && state.autofillResult ? (
          <AutofillFormComponent
            form={state.selectedForm}
            suggestions={state.autofillResult.suggestions}
            profileId={state.profileId}
            onSubmit={handleFormSubmit}
            onSaveTemplate={handleSaveTemplate}
            isLoading={state.isLoading}
          />
        ) : null}
      </div>
    </div>
  );
}
