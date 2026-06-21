import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Upload, ArrowRight, AlertCircle, CheckCircle2, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportRow {
  [key: string]: string;
}

interface ValidationResult {
  rowIndex: number;
  email?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'executing' | 'complete';

const BulkImportPage: React.FC = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('upload');

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<ImportRow[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [importSettings, setImportSettings] = useState({
    targetOrganization: '',
    defaultRole: 'employee',
    skipDuplicates: true,
    requirePhoneValidation: false,
    autoGenerateUsernames: false,
    sendWelcomeEmails: false,
  });

  // Validation state
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validRowCount, setValidRowCount] = useState(0);
  const [errorRowCount, setErrorRowCount] = useState(0);
  const [warningRowCount, setWarningRowCount] = useState(0);

  // Job execution state
  const [jobId, setJobId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState({
    processed: 0,
    success: 0,
    error: 0,
    warning: 0,
    total: 0,
  });

  // Standard field options for mapping
  const standardFields = [
    { label: 'First Name', value: 'first_name' },
    { label: 'Last Name', value: 'last_name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Position', value: 'position' },
    { label: 'Department', value: 'department' },
    { label: 'Team', value: 'team' },
    { label: 'Address', value: 'address' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    const fileType = file.name.endsWith('.xlsx') ? 'xlsx' : 'csv';
    if (!['csv', 'xlsx'].includes(fileType)) {
      toast.error('Only CSV and Excel files are supported');
      return;
    }

    setUploadedFile(file);
    toast.success(`File "${file.name}" loaded`);

    // Read file and get preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        if (fileType === 'csv') {
          // Simple CSV parsing (for preview)
          const lines = content.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          setSourceColumns(headers);

          // Parse first few rows for preview
          const rows = [];
          for (let i = 1; i < Math.min(11, lines.length); i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: ImportRow = {};
            headers.forEach((header, idx) => {
              row[header] = values[idx] || '';
            });
            rows.push(row);
          }
          setFilePreview(rows);

          // Auto-map columns
          const autoMapping: Record<string, string> = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('first')) autoMapping[header] = 'first_name';
            else if (lowerHeader.includes('last')) autoMapping[header] = 'last_name';
            else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
            else if (lowerHeader.includes('phone')) autoMapping[header] = 'phone';
            else if (lowerHeader.includes('position')) autoMapping[header] = 'position';
            else if (lowerHeader.includes('department')) autoMapping[header] = 'department';
            else if (lowerHeader.includes('team')) autoMapping[header] = 'team';
            else if (lowerHeader.includes('address')) autoMapping[header] = 'address';
          });
          setColumnMapping(autoMapping);
        }

        setCurrentStep('mapping');
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Error processing file');
      }
    };

    reader.readAsText(file);
  };

  const handleMappingChange = (sourceCol: string, targetField: string) => {
    setColumnMapping({
      ...columnMapping,
      [sourceCol]: targetField,
    });
  };

  const handleValidate = async () => {
    if (!token || !uploadedFile) return;

    try {
      toast.loading('Validating data...');

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('mapping', JSON.stringify(columnMapping));
      formData.append('settings', JSON.stringify(importSettings));

      const response = await fetch(`${apiUrl}/bulk-import/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data = await response.json();
      setValidationResults(data.validationResults || []);
      setValidRowCount(data.validCount || 0);
      setErrorRowCount(data.errorCount || 0);
      setWarningRowCount(data.warningCount || 0);

      toast.dismiss();
      toast.success('Validation complete');
      setCurrentStep('preview');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed');
    }
  };

  const handleExecuteImport = async () => {
    if (!token || !uploadedFile) return;

    try {
      toast.loading('Initiating import...');

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('mapping', JSON.stringify(columnMapping));
      formData.append('settings', JSON.stringify(importSettings));

      const response = await fetch(`${apiUrl}/bulk-import/execute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed to start');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setExecutionProgress({
        processed: 0,
        success: 0,
        error: 0,
        warning: 0,
        total: filePreview.length,
      });

      toast.dismiss();
      toast.success('Import started');
      setCurrentStep('executing');

      // Poll for progress
      pollProgress(data.jobId);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to start import');
    }
  };

  const pollProgress = (jId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/bulk-import/${jId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          clearInterval(pollInterval);
          return;
        }

        const data = await response.json();
        setExecutionProgress(data.progress);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
          setCurrentStep('complete');
        }
      } catch (error) {
        console.error('Progress poll error:', error);
        clearInterval(pollInterval);
      }
    }, 1000);
  };

  const handleDownloadReport = async () => {
    if (!jobId || !token) return;

    try {
      const response = await fetch(`${apiUrl}/bulk-import/${jobId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-report-${jobId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setFilePreview([]);
    setColumnMapping({});
    setSourceColumns([]);
    setValidationResults([]);
    setJobId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bulk User Import</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload CSV or Excel file to import multiple users at once
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['upload', 'mapping', 'preview', 'executing', 'complete'] as const).map((step, idx) => (
            <div
              key={step}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : ['upload', 'mapping', 'preview', 'executing', 'complete'].indexOf(currentStep) > idx
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                  : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {['upload', 'mapping', 'preview', 'executing', 'complete'].indexOf(currentStep) > idx ? (
                <CheckCircle2 size={16} />
              ) : null}
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {currentStep === 'upload' && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
            <div
              className="border-4 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-12 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Drag and drop your file
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">or click to browse</p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                  Select File
                </button>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Max 10MB | Supported: CSV, Excel (.xlsx)
              </p>
            </div>
            {uploadedFile && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-600" />
                  <span className="text-green-800 dark:text-green-100 font-medium">{uploadedFile.name}</span>
                </div>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Mapping */}
        {currentStep === 'mapping' && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Map Columns</h2>
              <div className="space-y-3">
                {sourceColumns.map((col) => (
                  <div key={col} className="flex items-center gap-4">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-300 truncate">{col}</span>
                    <ArrowRight size={20} className="text-gray-400" />
                    <select
                      value={columnMapping[col] || ''}
                      onChange={(e) => handleMappingChange(col, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white"
                    >
                      <option value="">-- Skip --</option>
                      {standardFields.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-neutral-600 pt-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Import Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importSettings.skipDuplicates}
                    onChange={(e) =>
                      setImportSettings({ ...importSettings, skipDuplicates: e.target.checked })
                    }
                  />
                  <span className="text-gray-700 dark:text-gray-300">Skip duplicate emails</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importSettings.requirePhoneValidation}
                    onChange={(e) =>
                      setImportSettings({ ...importSettings, requirePhoneValidation: e.target.checked })
                    }
                  />
                  <span className="text-gray-700 dark:text-gray-300">Require phone number validation</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                Validate & Preview
              </button>
              <button
                onClick={() => setCurrentStep('upload')}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-white px-4 py-3 rounded-lg font-medium"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {currentStep === 'preview' && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-100 text-sm font-medium">Valid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validRowCount}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-100 text-sm font-medium">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningRowCount}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-red-800 dark:text-red-100 text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{errorRowCount}</p>
              </div>
            </div>

            {validationResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-neutral-700">
                    <tr>
                      <th className="px-4 py-2 text-left">Row</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.slice(0, 10).map((result) => (
                      <tr key={result.rowIndex} className="border-t dark:border-neutral-700">
                        <td className="px-4 py-2">{result.rowIndex}</td>
                        <td className="px-4 py-2">{result.email || '—'}</td>
                        <td className="px-4 py-2">
                          {result.isValid ? (
                            <span className="text-green-600 font-medium">✓</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {result.errors.length > 0 && (
                            <div className="text-red-600">{result.errors[0]}</div>
                          )}
                          {result.warnings.length > 0 && (
                            <div className="text-yellow-600">{result.warnings[0]}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleExecuteImport}
                disabled={validRowCount === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium"
              >
                Execute Import
              </button>
              <button
                onClick={() => setCurrentStep('mapping')}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-white px-4 py-3 rounded-lg font-medium"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 & 5: Executing & Complete */}
        {(currentStep === 'executing' || currentStep === 'complete') && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Import Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {executionProgress.processed} / {executionProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{
                        width: `${
                          (executionProgress.processed / executionProgress.total) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-100">Processed</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {executionProgress.processed}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-100">Success</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {executionProgress.success}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-100">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {executionProgress.warning}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-xs text-red-800 dark:text-red-100">Errors</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{executionProgress.error}</p>
                  </div>
                </div>
              </div>
            </div>

            {currentStep === 'complete' && (
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium"
                >
                  <Download size={20} />
                  Download Report
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
                >
                  Import Another File
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
