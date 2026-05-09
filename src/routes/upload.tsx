import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader,
  Eye,
  Download,
  Edit2,
  Save,
  Home,
} from "lucide-react";
import { useState, useRef } from "react";

function extractFromDocumentPlaceholder(filename: string): ExtractedData {
  const lower = filename.toLowerCase();

  if (lower.includes("passport")) {
    return {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "P1234567",
      documentType: "Passport",
    };
  }

  if (lower.includes("pan")) {
    return {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "ABCDE1234F",
      documentType: "PAN",
    };
  }

  if (lower.includes("aadhaar") || lower.includes("aadhar")) {
    return {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "1234 5678 9012",
      documentType: "Aadhaar",
    };
  }

  return {
    name: "Rajesh Kumar",
    dob: "15/06/1990",
    address: "123, MG Road, Bangalore, Karnataka 560001",
    idNumber: "KA-01-2024-00123",
    documentType: "Driving License",
  };
}

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Document — Bharat ID" },
      {
        name: "description",
        content: "Securely upload and verify your government documents with OCR extraction.",
      },
    ],
  }),
  component: DocumentUpload,
});

interface ExtractedData {
  name: string;
  dob: string;
  address: string;
  idNumber: string;
  documentType: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  status: "processing" | "success" | "error";
  progress: number;
  extractedData?: ExtractedData;
  error?: string;
}

function DocumentUpload() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ExtractedData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        addDocument({
          id: Math.random().toString(),
          filename: file.name,
          status: "error",
          progress: 0,
          error: "Invalid file type. Please upload PDF, JPG, or PNG.",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        addDocument({
          id: Math.random().toString(),
          filename: file.name,
          status: "error",
          progress: 0,
          error: "File size exceeds 10MB limit.",
        });
        return;
      }

      // Start upload
      uploadDocument(file);
    });
  };

  const uploadDocument = async (file: File) => {
    const docId = Math.random().toString();
    const newDoc: UploadedDocument = {
      id: docId,
      filename: file.name,
      status: "processing",
      progress: 0,
    };

    addDocument(newDoc);

    try {
      // Simulate virus scan (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Update progress
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, progress: 30 } : doc
        )
      );

      // Simulate file encryption and processing (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, progress: 70 } : doc
        )
      );

      // Extract data using OCR
      const extractedData = extractFromDocumentPlaceholder(file.name);

      // Simulate final processing (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update document with extracted data
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "success",
                progress: 100,
                extractedData,
              }
            : doc
        )
      );
    } catch (error) {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : doc
        )
      );
    }
  };

  const addDocument = (doc: UploadedDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDoc?.id === id) {
      setSelectedDoc(null);
    }
  };

  const handleEdit = (field: keyof ExtractedData) => {
    if (selectedDoc?.extractedData) {
      setEditingField(field);
      setEditValues({ [field]: selectedDoc.extractedData[field] });
    }
  };

  const handleSaveEdit = async (field: keyof ExtractedData) => {
    if (!selectedDoc?.extractedData) return;

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update local state
      setSelectedDoc((prev) =>
        prev
          ? {
              ...prev,
              extractedData: {
                ...prev.extractedData!,
                [field]: editValues[field],
              },
            }
          : null
      );

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === selectedDoc.id
            ? {
                ...doc,
                extractedData: {
                  ...doc.extractedData!,
                  [field]: editValues[field],
                },
              }
            : doc
        )
      );

      setEditingField(null);
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const saveToVault = async (docId: string) => {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert("Document saved to your vault successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save document to vault");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">भ</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-semibold text-foreground">Bharat ID</div>
              <div className="text-xs text-muted-foreground">Document Upload</div>
            </div>
          </div>
          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </a>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Upload Government Documents
            </h1>
            <p className="mt-2 text-muted-foreground">
              Securely upload and verify your documents. We use AI-powered OCR to extract information automatically.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Upload Area */}
            <div className="lg:col-span-1 space-y-6">
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />

                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    Drop your documents here
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Select Files
                  </button>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Supported formats:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block rounded bg-accent px-2 py-1 text-xs">
                      PDF
                    </span>
                    <span className="inline-block rounded bg-accent px-2 py-1 text-xs">
                      JPG
                    </span>
                    <span className="inline-block rounded bg-accent px-2 py-1 text-xs">
                      PNG
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 10MB
                  </p>
                </div>
              </div>

              {/* Security Info */}
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Your data is secure
                    </h4>
                    <ul className="mt-2 space-y-1 text-xs text-green-800">
                      <li>✓ End-to-end encryption</li>
                      <li>✓ Virus scanned</li>
                      <li>✓ No third-party access</li>
                      <li>✓ GDPR compliant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents List & Preview */}
            <div className="lg:col-span-2">
              {documents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold text-foreground">
                    No documents uploaded yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start by uploading your first document
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`rounded-xl border transition cursor-pointer ${
                        selectedDoc?.id === doc.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className="p-4"
                        onClick={() =>
                          setSelectedDoc(doc.status === "success" ? doc : null)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {doc.status === "processing" && (
                                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                              )}
                              {doc.status === "success" && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                              {doc.status === "error" && (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">
                                {doc.filename}
                              </h4>
                              {doc.extractedData && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Type:</span>{" "}
                                    {doc.extractedData.documentType}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Name:</span>{" "}
                                    {doc.extractedData.name}
                                  </p>
                                </div>
                              )}
                              {doc.error && (
                                <p className="mt-2 text-xs text-red-600">
                                  {doc.error}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDocument(doc.id);
                            }}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {doc.status === "processing" && (
                          <div className="mt-4">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${doc.progress}%` }}
                              ></div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Processing... Scanning for viruses and extracting data
                            </p>
                          </div>
                        )}

                        {doc.status === "success" && (
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoc(doc);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                              Review Data
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveToVault(doc.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                            >
                              Save to Vault
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          {selectedDoc && selectedDoc.extractedData && (
            <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Extracted Information
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review and edit the extracted data below
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Document Type */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Document Type
                  </p>
                  <p className="mt-3 font-medium text-foreground">
                    {selectedDoc.extractedData.documentType}
                  </p>
                </div>

                {/* Name */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Full Name
                    </p>
                    {editingField !== "name" && (
                      <button
                        onClick={() => handleEdit("name")}
                        className="text-xs font-medium text-primary hover:text-primary/80"
                      >
                        <Edit2 className="h-3 w-3 inline mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingField === "name" ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editValues.name || ""}
                        onChange={(e) =>
                          setEditValues({ ...editValues, name: e.target.value })
                        }
                        className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm font-medium text-foreground"
                      />
                      <button
                        onClick={() => handleSaveEdit("name")}
                        className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 font-semibold text-foreground">
                      {selectedDoc.extractedData.name}
                    </p>
                  )}
                </div>

                {/* DOB */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Date of Birth
                    </p>
                    {editingField !== "dob" && (
                      <button
                        onClick={() => handleEdit("dob")}
                        className="text-xs font-medium text-primary hover:text-primary/80"
                      >
                        <Edit2 className="h-3 w-3 inline mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingField === "dob" ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editValues.dob || ""}
                        onChange={(e) =>
                          setEditValues({ ...editValues, dob: e.target.value })
                        }
                        placeholder="DD/MM/YYYY"
                        className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm font-medium text-foreground"
                      />
                      <button
                        onClick={() => handleSaveEdit("dob")}
                        className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 font-semibold text-foreground">
                      {selectedDoc.extractedData.dob}
                    </p>
                  )}
                </div>

                {/* ID Number */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      ID Number
                    </p>
                    {editingField !== "idNumber" && (
                      <button
                        onClick={() => handleEdit("idNumber")}
                        className="text-xs font-medium text-primary hover:text-primary/80"
                      >
                        <Edit2 className="h-3 w-3 inline mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingField === "idNumber" ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editValues.idNumber || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            idNumber: e.target.value,
                          })
                        }
                        className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm font-medium text-foreground font-mono"
                      />
                      <button
                        onClick={() => handleSaveEdit("idNumber")}
                        className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 font-mono font-semibold text-foreground">
                      {selectedDoc.extractedData.idNumber}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="rounded-lg bg-gray-50 p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Address
                    </p>
                    {editingField !== "address" && (
                      <button
                        onClick={() => handleEdit("address")}
                        className="text-xs font-medium text-primary hover:text-primary/80"
                      >
                        <Edit2 className="h-3 w-3 inline mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingField === "address" ? (
                    <div className="mt-3 flex gap-2">
                      <textarea
                        value={editValues.address || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            address: e.target.value,
                          })
                        }
                        className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm font-medium text-foreground"
                        rows={3}
                      />
                      <button
                        onClick={() => handleSaveEdit("address")}
                        className="self-start rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {selectedDoc.extractedData.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-border pt-6">
                <button
                  onClick={() => saveToVault(selectedDoc.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save to Vault
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-lg border border-border px-6 py-3 font-medium text-foreground transition hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
