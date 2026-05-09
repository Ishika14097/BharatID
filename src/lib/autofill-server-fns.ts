import { createServerFn } from "@tanstack/react-start";
import { FormAutofillEngine, IdentityProfile } from "../server/form-autofill-engine";

// Create a singleton instance of the engine
const engine = new FormAutofillEngine();

// Mock an existing user profile for demonstration purposes
const mockProfileData: Partial<IdentityProfile> = {
  firstName: "Rajesh",
  lastName: "Kumar",
  email: "rajesh.kumar@email.com",
  phoneNumber: "+919876543210",
  addressLine1: "123 Main Street",
  city: "Bangalore",
  state: "Karnataka",
  postalCode: "560001",
  aadhaarNumber: "123456789012",
  panNumber: "ABCDE1234F",
  dateOfBirth: "1990-05-15",
  annualIncome: 1200000,
};
const defaultProfile = engine.createIdentityProfile(mockProfileData);

export const getAvailableForms = createServerFn({ method: "GET" }).handler(async () => {
  // Add an artificial delay to simulate backend loading
  await new Promise((resolve) => setTimeout(resolve, 600));
  return engine.listAvailableForms();
});

export const getAutofillSuggestions = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { formId: string; profileId?: string } }) => {
    // Add an artificial delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // In a real app, profileId would come from session/auth. Here we use our default mock profile.
    const pId = data.profileId || defaultProfile.id;
    return engine.generateAutofillSuggestions(pId, data.formId);
  }
);

export const saveFormTemplate = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { templateName: string; formId: string; formData: Record<string, string> } }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return engine.saveFormTemplate(data.templateName, data.formId, data.formData);
  }
);
