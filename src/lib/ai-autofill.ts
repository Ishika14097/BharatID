/**
 * Client helper to call backend AI autofill endpoint
 */
export interface AISuggestRequest {
  userId: string;
  formSchema: any;
  partialValues?: Record<string, string>;
  language?: string;
}

export interface AISuggestResponseItem {
  fieldId: string;
  value: string;
  confidence: number;
  rationale?: string;
}

export async function fetchAISuggestions(
  req: AISuggestRequest
): Promise<AISuggestResponseItem[]> {
  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI suggest request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Expect shape { success: true, suggestions: [{ fieldId, value, confidence, rationale }], raw }
  return (data.suggestions || []).map((s: any) => ({
    fieldId: s.fieldId,
    value: s.value ?? s.suggestedValue ?? '',
    confidence: s.confidence ?? s.confidenceScore ?? 50,
    rationale: s.rationale || s.notes || ''
  }));
}
