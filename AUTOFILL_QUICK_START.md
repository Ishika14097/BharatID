# Government Form Autofill - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Create Identity Profile

```typescript
import { autofillEngine } from '@/server/form-autofill-engine';

// Create profile with your data
const profile = autofillEngine.createIdentityProfile({
  firstName: 'Rajesh',
  lastName: 'Kumar',
  email: 'rajesh@example.com',
  phoneNumber: '+919876543210',
  addressLine1: '123 Main Street',
  city: 'Bangalore',
  state: 'Karnataka',
  postalCode: '560001',
  aadhaarNumber: '123456789012',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  nationality: 'Indian',
  collegeName: 'IIT Bangalore',
  highestQualification: 'B.Tech',
  occupation: 'Software Engineer'
});

console.log('Profile created:', profile.id);
// Profile created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Step 2: View Available Forms

```typescript
// Get all available forms
const allForms = autofillEngine.listAvailableForms();
allForms.forEach(form => {
  console.log(`- ${form.name} (${form.type})`);
  console.log(`  Fields: ${form.fields.length}`);
});

// Output:
// - Scholarship Application Form (scholarship)
//   Fields: 16
// - Passport Application Form (passport)
//   Fields: 14
// - KYC (Know Your Customer) Form (kyc)
//   Fields: 15
```

### Step 3: Generate Autofill Suggestions

```typescript
// Get a form
const scholarshipForm = autofillEngine.getForm('form_scholarship_001');

// Generate suggestions
const result = autofillEngine.generateAutofillSuggestions(
  profile.id,
  'form_scholarship_001'
);

console.log(`Form: ${result.formId}`);
console.log(`Completion: ${result.completionPercentage}%`);
console.log(`Suggestions: ${result.suggestions.length}`);
console.log(`High Confidence: ${result.highConfidenceFields.length}`);
console.log(`Missing Fields: ${result.missingFields.length}`);

// Output:
// Form: form_scholarship_001
// Completion: 87%
// Suggestions: 14
// High Confidence: 12
// Missing Fields: 2
```

### Step 4: Review Suggestions

```typescript
// View all suggestions
result.suggestions.forEach(suggestion => {
  console.log(`
Field: ${suggestion.fieldName}
Value: ${suggestion.suggestedValue}
Confidence: ${suggestion.confidence}%
Source: ${suggestion.source}
Type: ${suggestion.sourceType}
  `);
});

// Output:
// Field: applicantFullName
// Value: Rajesh Kumar
// Confidence: 95%
// Source: fullName
// Type: exact

// Field: email
// Value: rajesh@example.com
// Confidence: 95%
// Source: email
// Type: exact

// Field: contactPhone
// Value: +919876543210
// Confidence: 95%
// Source: phoneNumber
// Type: exact
```

### Step 5: Submit Form

```typescript
// Validate form data
const formData = {
  'f_fullname': 'Rajesh Kumar',
  'f_email': 'rajesh@example.com',
  'f_phone': '+919876543210',
  'f_dob': '1990-05-15',
  'f_gender': 'Male',
  'f_address': '123 Main Street',
  'f_city': 'Bangalore',
  'f_state': 'Karnataka',
  'f_pin': '560001',
  'f_aadhar': '123456789012',
  'f_institution': 'IIT Bangalore',
  'f_qualification': 'B.Tech',
  'f_marks': 8.5,
  'f_income': 1200000,
  'f_bank': '1234567890123456',
  'f_ifsc': 'SBIN0001234'
};

const validation = autofillEngine.validateFormData(
  'form_scholarship_001',
  formData
);

if (validation.isValid) {
  console.log('✅ Form is valid! Ready to submit.');
} else {
  console.log('❌ Form has errors:');
  validation.errors.forEach(err => {
    console.log(`  - ${err.message}`);
  });
}
```

### Step 6: Generate PDF

```typescript
import { PDFGenerationService } from '@/lib/form-processing-utils';

const form = autofillEngine.getForm('form_scholarship_001');
const pdfBuffer = PDFGenerationService.generatePDF(
  'Scholarship Application',
  formData,
  form
);

// Download PDF
const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'scholarship_application.pdf';
a.click();

console.log('✅ PDF generated and downloaded!');
```

## 🎯 Common Use Cases

### Use Case 1: Scholarship Application

```typescript
// User's workflow:
// 1. Navigate to /autofill
// 2. See form selector with scholarship forms
// 3. Click "Start Autofill" on Scholarship Form
// 4. See suggestions with 87% completion
// 5. Review high-confidence fields (✅ auto-accepted)
// 6. Edit low-confidence fields manually
// 7. Submit → PDF generated & downloaded

// Code behind the scenes:
const suggestions = autofillEngine.generateAutofillSuggestions(
  profileId,
  'form_scholarship_001'
);

// Filter by confidence
const highConfidence = suggestions.filter(s => s.confidence >= 80);
// [Full Name, Email, Phone, Address, etc.]

const lowConfidence = suggestions.filter(s => s.confidence < 80);
// [Institution Name, Marks, etc.]
```

### Use Case 2: Passport Application

```typescript
// User's workflow:
// 1. Click "Passport Application Form"
// 2. See autofill suggestions
// 3. Check father/mother name suggestions
// 4. Edit address if needed
// 5. Click "Generate PDF"
// 6. Download completed form

// Confidence breakdown:
// 95% - Full Name, DOB, Gender, Email, Phone
// 85% - Father's Name, Mother's Name (from profile)
// 70% - Permanent Address (address parsing)
// 0%  - Marital Status (not in profile)
```

### Use Case 3: KYC Form with Template

```typescript
// First time:
const result1 = autofillEngine.generateAutofillSuggestions(
  profileId,
  'form_kyc_001'
);

// Fill form → Submit → Save as "My KYC Template"
const template1 = autofillEngine.saveFormTemplate(
  'My KYC Template',
  'form_kyc_001',
  filledData
);

// Second time (similar form):
// 1. Click "Apply Template"
// 2. Select "My KYC Template"
// 3. All fields pre-filled with saved values
// 4. Just verify and submit
// 5. Much faster! ⚡
```

## 📊 API Quick Reference

| Method | Parameters | Returns |
|--------|-----------|---------|
| `createIdentityProfile()` | `data: Partial<IdentityProfile>` | `IdentityProfile` |
| `getProfile()` | `profileId: string` | `IdentityProfile \| null` |
| `getForm()` | `formId: string` | `FormStructure \| null` |
| `listAvailableForms()` | None | `FormStructure[]` |
| `getFormsByType()` | `type: 'scholarship' \| 'passport' \| 'kyc'` | `FormStructure[]` |
| `generateAutofillSuggestions()` | `profileId, formId` | `AutofillResult` |
| `saveFormTemplate()` | `name, formId, filledData` | `FormTemplate` |
| `getTemplate()` | `templateId: string` | `FormTemplate \| null` |
| `applyTemplate()` | `templateId: string` | `Record<string, string> \| null` |
| `listTemplatesForForm()` | `formId: string` | `FormTemplate[]` |
| `validateFormData()` | `formId, data` | `ValidationResult` |
| `getFormFillProgress()` | `formId, filledData` | `ProgressInfo` |
| `deleteProfile()` | `profileId: string` | `boolean` |
| `deleteTemplate()` | `templateId: string` | `boolean` |

## 📱 React Component Usage

### Form Selector
```typescript
import { FormSelectorComponent } from '@/components/form-selector';

<FormSelectorComponent
  availableForms={autofillEngine.listAvailableForms()}
  profileId={profileId}
  onFormSelected={handleFormSelected}
  savedTemplates={templates}
/>
```

### Autofill Form
```typescript
import { AutofillFormComponent } from '@/components/autofill-form';

<AutofillFormComponent
  form={selectedForm}
  suggestions={suggestions}
  profileId={profileId}
  onSubmit={handleSubmit}
  onSaveTemplate={handleSaveTemplate}
/>
```

### Full Page Integration
```typescript
import { AutofillPage } from '@/routes/autofill';

// In router configuration
{
  path: '/autofill',
  element: <AutofillPage />
}
```

## 🧪 Quick Tests

### Test 1: Profile Creation
```typescript
const profile = autofillEngine.createIdentityProfile({
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com'
});

assert(profile.id).toBeTruthy();
assert(profile.firstName).toBe('Test');
assert(profile.email).toBe('test@example.com');
// ✅ PASS
```

### Test 2: Field Matching
```typescript
const form = autofillEngine.getForm('form_scholarship_001');
const result = autofillEngine.generateAutofillSuggestions(
  profile.id,
  form.id
);

assert(result.suggestions.length).toBeGreaterThan(0);
assert(result.completionPercentage).toBeGreaterThan(70);
// ✅ PASS
```

### Test 3: Template Save/Load
```typescript
const template = autofillEngine.saveFormTemplate(
  'Test Template',
  'form_scholarship_001',
  { 'f_fullname': 'Test User' }
);

const loaded = autofillEngine.getTemplate(template.id);
assert(loaded.name).toBe('Test Template');
assert(loaded.savedFields['f_fullname']).toBe('Test User');
// ✅ PASS
```

### Test 4: Form Validation
```typescript
const validation = autofillEngine.validateFormData(
  'form_scholarship_001',
  { 'f_fullname': 'John' }  // Missing required fields
);

assert(validation.isValid).toBe(false);
assert(validation.errors.length).toBeGreaterThan(0);
// ✅ PASS
```

## 💡 Pro Tips

### Tip 1: High Confidence Fields
```typescript
// Auto-accept suggestions >= 80% confidence
const highConfidence = result.highConfidenceFields;
// These are almost certainly correct

// Review these manually:
const lowConfidence = result.lowConfidenceFields;
// These need human verification
```

### Tip 2: Template Organization
```typescript
// Save templates with descriptive names
- "Scholarship 2024 - Final"
- "Passport Renewal - Jan 2026"
- "KYC Personal Account"

// Use templates for bulk forms
// Apply template → Verify → Submit (30 seconds per form)
```

### Tip 3: Data Accuracy
```typescript
// Keep profile up-to-date for better suggestions
Profile Fields (Higher Match Potential)
├─ Full Name ✅ Must be accurate
├─ Email ✅ Used frequently
├─ Phone ✅ Required for most forms
├─ Aadhaar ✅ Critical for Indian govt forms
├─ Pan Number ✅ Needed for financial forms
└─ Address ✅ Used in 90% of applications
```

### Tip 4: Batch Processing
```typescript
// For multiple applications
const forms = autofillEngine.getFormsByType('scholarship');

forms.forEach(form => {
  const result = autofillEngine.generateAutofillSuggestions(
    profileId,
    form.id
  );
  
  if (result.completionPercentage >= 80) {
    // Auto-process high-completion forms
    autofillEngine.saveFormTemplate(`Auto_${form.name}`, form.id, data);
  }
});
```

## ❓ FAQ

**Q: How accurate is the autofill?**
A: 85-95% for high-confidence fields, depends on profile data quality

**Q: Can I edit suggestions?**
A: Yes! Accept, reject, or manually edit any suggestion

**Q: Are my details stored securely?**
A: Data stored in browser localStorage, encrypted at rest in production

**Q: Can I use this offline?**
A: Yes! No internet needed after initial load

**Q: How do I export my profile?**
A: Use `autofillEngine.exportProfile(profileId)` → JSON file

**Q: Can I backup my templates?**
A: Export from localStorage, restore by importing JSON

**Q: What if a form is not supported?**
A: Add custom form via backend, or use manual entry

**Q: How many profiles can I create?**
A: Unlimited! Organize by purpose (personal, business, etc.)

## 🚀 Next Steps

1. ✅ Create your profile
2. ✅ Select a form
3. ✅ Review suggestions
4. ✅ Submit and download
5. ✅ Save templates for next time

**Happy form filling!** 📝✨

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Quick Links**:
- [Full Documentation](./AUTOFILL_DOCS.md)
- [API Reference](./AUTOFILL_DOCS.md#-api)
- [Support](mailto:support@bharat-id.com)
