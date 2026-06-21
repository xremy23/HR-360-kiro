/**
 * Bulk User Upload Component
 * HR Admin interface for bulk user import from CSV/Excel
 */

import React, { useState } from 'react';

interface ValidationError {
  row: number;
  field: string;
  error: string;
  value?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ValidationError[];
  warnings: string[];
}

interface PreviewRow {
  fullName: string;
  email: string;
  phone: string;
  team?: string;
  department?: string;
}

export const BulkUserUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm' | 'complete'>('upload');
  const [preview, setPreview] = useState<{ preview: PreviewRow[]; totalRows: number; hasErrors: boolean; errorCount: number } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      setErrors(['Failed to read file']);
    };
    reader.readAsText(selectedFile);
  };

  /**
   * Generate CSV template download
   */
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/bulk-import/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setErrors(['Failed to download template']);
    }
  };

  /**
   * Preview uploaded file
   */
  const previewFile = async () => {
    if (!fileContent) {
      setErrors(['Please select a file first']);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bulk-import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          fileContent,
          fileName: file?.name,
        }),
      });

      if (!response.ok) throw new Error('Preview failed');

      const { data } = await response.json();
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setErrors([`Preview error: ${(err as any).message}`]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate file before import
   */
  const validateFile = async () => {
    if (!fileContent) {
      setErrors(['Please select a file first']);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bulk-import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          fileContent,
          fileName: file?.name,
        }),
      });

      if (!response.ok) throw new Error('Validation failed');

      const { data } = await response.json();
      
      if (data.errors.length > 0) {
        setErrors(data.errors.map((err: any) => `Row ${err.row}, ${err.field}: ${err.error}`));
      }

      if (data.imported > 0) {
        setStep('confirm');
      }
    } catch (err) {
      setErrors([`Validation error: ${(err as any).message}`]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute bulk import
   */
  const executeImport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bulk-import/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          fileContent,
          fileName: file?.name,
          sendWelcomeEmails: sendEmails,
        }),
      });

      if (!response.ok) throw new Error('Import failed');

      const { data } = await response.json();
      setResult(data);
      setStep('complete');
    } catch (err) {
      setErrors([`Import error: ${(err as any).message}`]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset and start over
   */
  const reset = () => {
    setFile(null);
    setFileContent('');
    setStep('upload');
    setPreview(null);
    setResult(null);
    setErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Bulk User Import</h1>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              <strong>Instructions:</strong> Upload a CSV file with user data. Download the template below to see the required format.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              📥 Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-600">
                {file ? `Selected: ${file.name}` : 'Click to select CSV file or drag and drop'}
              </p>
            </label>
          </div>

          {file && (
            <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
              <p className="text-sm text-green-700">
                ✓ File selected: <strong>{file.name}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              onClick={previewFile}
              disabled={!file || loading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Next: Preview'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              <strong>Preview:</strong> Showing first {preview.preview.length} of {preview.totalRows} rows
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Full Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Department</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{row.fullName}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.phone}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.team || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.department || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.hasErrors && (
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-700">
                ⚠️ File has <strong>{preview.errorCount} validation errors</strong>. Review them before importing.
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Back
            </button>
            <button
              onClick={validateFile}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Next: Validate'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
            <p className="text-sm text-green-700">
              ✓ <strong>Ready to import!</strong> Click the Import button to start.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Send welcome emails to new users</span>
            </label>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Back
            </button>
            <button
              onClick={executeImport}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Importing...' : '🚀 Import Users'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && result && (
        <div className="space-y-6">
          {result.success ? (
            <div className="bg-green-50 p-6 rounded border-l-4 border-green-400">
              <p className="text-2xl font-bold text-green-700">✓ Import Completed!</p>
              <p className="text-sm text-green-600 mt-2">
                Successfully imported <strong>{result.imported}</strong> users.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 p-6 rounded border-l-4 border-red-400">
              <p className="text-2xl font-bold text-red-700">✗ Import Failed</p>
              <p className="text-sm text-red-600 mt-2">
                {result.failed} rows had errors. Please review and try again.
              </p>
            </div>
          )}

          {result.imported > 0 && (
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">Imported Users:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {result.importedUsers?.slice(0, 5).map((user: any) => (
                  <li key={user.id}>• {user.fullName} ({user.email})</li>
                ))}
                {(result.importedUsers?.length || 0) > 5 && (
                  <li>... and {(result.importedUsers?.length || 0) - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Errors ({result.errors.length}):</p>
              <div className="text-sm text-yellow-700 max-h-48 overflow-y-auto space-y-1">
                {result.errors.slice(0, 10).map((err, idx) => (
                  <div key={idx}>• Row {err.row}, {err.field}: {err.error}</div>
                ))}
                {result.errors.length > 10 && <div>... and {result.errors.length - 10} more errors</div>}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              onClick={reset}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 p-4 rounded border-l-4 border-red-400">
          <p className="text-sm font-semibold text-red-900 mb-2">Errors:</p>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>• {err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
