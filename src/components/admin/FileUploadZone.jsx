/**
 * src/components/admin/FileUploadZone.jsx
 * File upload component with drag-and-drop support
 * Handles JSON file selection and basic validation
 */

import React, { useRef, useState } from 'react';
import { Upload, File } from 'lucide-react';

const FileUploadZone = ({ onUpload }) => {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file) => {
    if (!file) {
      setError('No file selected');
      return false;
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file (.json)');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than 10MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConfirmUpload = () => {
    if (selectedFile && validateFile(selectedFile)) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="p-8">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {!selectedFile ? (
            <>
              <Upload className="w-12 h-12 text-slate-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {isDragActive ? 'Drop your file here' : 'Upload Questions File'}
                </h3>
                <p className="text-slate-600 text-sm">
                  Drag and drop your JSON file here or click to browse
                </p>
              </div>

              <button
                onClick={handleClickUpload}
                className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Choose File
              </button>

              <p className="text-xs text-slate-500 mt-2">
                Supports: JSON files up to 10MB
              </p>
            </>
          ) : (
            <>
              <File className="w-12 h-12 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {selectedFile.name}
                </h3>
                <p className="text-slate-600 text-sm">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Upload and Validate
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Example section */}
      <div className="mt-8 p-6 bg-slate-100 rounded-lg">
        <h4 className="font-semibold text-slate-900 mb-3">Example JSON Format</h4>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-auto">
{`[
  {
    "id": "Q001",
    "atom": "ALGEBRA_BASICS",
    "type": "MULTIPLE_CHOICE",
    "content": {
      "question": "What is 2 + 2?"
    },
    "options": [
      { "text": "3" },
      { "text": "4" },
      { "text": "5" }
    ],
    "correctAnswer": "4",
    "diagnosticTags": ["ARITHMETIC_BASIC"],
    "difficulty": "EASY",
    "bloomLevel": "REMEMBER"
  }
]`}
        </pre>
      </div>
    </div>
  );
};

export default FileUploadZone;
