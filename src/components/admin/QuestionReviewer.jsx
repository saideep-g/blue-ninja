/**
 * src/components/admin/QuestionReviewer.jsx
 * Interactive question review interface with inline editing
 * Features: side-by-side preview, error details, batch operations
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';

const QuestionReviewer = ({
  questions,
  validationResults,
  selectedQuestionIds,
  onSelectionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, VALID, ERRORS, WARNINGS
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    questions.length > 0 ? questions[0].id : null
  );
  const [editMode, setEditMode] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(null);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const selectedValidation = selectedQuestion
    ? validationResults?.questionResults.find(r => r.questionId === selectedQuestion.id)
    : null;

  // Filter questions based on search and status
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const validation = validationResults?.questionResults.find(r => r.questionId === q.id);

      // Search filter
      if (searchTerm && !q.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filterStatus === 'VALID' && !validation?.isValid) return false;
      if (filterStatus === 'ERRORS' && validation?.errors.length === 0) return false;
      if (filterStatus === 'WARNINGS' && validation?.warnings.length === 0) return false;

      return true;
    });
  }, [questions, searchTerm, filterStatus, validationResults]);

  const getStatusIcon = (validation) => {
    if (!validation) return null;
    if (validation.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (validation.errors.length > 0) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusColor = (validation) => {
    if (!validation) return 'bg-slate-100';
    if (validation.isValid) return 'bg-green-50 border-l-4 border-green-600';
    if (validation.errors.length > 0) return 'bg-red-50 border-l-4 border-red-600';
    return 'bg-yellow-50 border-l-4 border-yellow-600';
  };

  const handleToggleSelection = (qId) => {
    const newSelection = new Set(selectedQuestionIds);
    if (newSelection.has(qId)) {
      newSelection.delete(qId);
    } else {
      newSelection.add(qId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.size === filteredQuestions.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleSaveEdit = () => {
    if (editedQuestion && selectedQuestionId) {
      // Merge edited data with original
      const originalQuestion = questions.find(q => q.id === selectedQuestionId);
      const updatedQuestion = { ...originalQuestion, ...editedQuestion };
      // TODO: Update in database and questions array
      setEditMode(false);
      setEditedQuestion(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel: Question List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {['ALL', 'VALID', 'ERRORS', 'WARNINGS'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                Select All ({filteredQuestions.length})
              </label>
            </div>
          </div>

          {/* Question List */}
          <div className="border-t border-slate-200 max-h-[600px] overflow-y-auto">
            {filteredQuestions.map(question => {
              const validation = validationResults?.questionResults.find(
                r => r.questionId === question.id
              );
              const isSelected = selectedQuestionIds.has(question.id);
              const isCurrentlySelected = selectedQuestionId === question.id;

              return (
                <div
                  key={question.id}
                  className={`p-3 border-b border-slate-100 transition cursor-pointer ${
                    isCurrentlySelected
                      ? 'bg-blue-100 border-l-4 border-l-blue-600'
                      : 'hover:bg-slate-50'
                  } ${getStatusColor(validation)}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelection(question.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded mt-1 cursor-pointer"
                    />
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => {
                        setSelectedQuestionId(question.id);
                        setEditMode(false);
                        setEditedQuestion(null);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(validation)}
                        <span className="font-medium text-sm text-slate-900 truncate">
                          {question.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {question.content?.question || question.question || 'No question text'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="bg-slate-200 px-2 py-0.5 rounded">
                          {question.type}
                        </span>
                        {validation && (
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            validation.qualityGrade === 'A' ? 'bg-green-200 text-green-900' :
                            validation.qualityGrade === 'B' ? 'bg-blue-200 text-blue-900' :
                            validation.qualityGrade === 'C' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-red-200 text-red-900'
                          }`}>
                            {validation.qualityGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel: Details and Editor */}
      <div className="lg:col-span-8 space-y-4">
        {selectedQuestion ? (
          <>
            {/* Preview Section */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Question Preview
                </h3>
                <button
                  onClick={() => {
                    if (editMode) {
                      setEditedQuestion(null);
                    } else {
                      setEditedQuestion(JSON.parse(JSON.stringify(selectedQuestion)));
                    }
                    setEditMode(!editMode);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    editMode
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {editMode ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Question Text */}
                {editMode && editedQuestion ? (
                  <textarea
                    value={editedQuestion.content?.question || editedQuestion.question || ''}
                    onChange={(e) =>
                      setEditedQuestion({
                        ...editedQuestion,
                        content: {
                          ...editedQuestion.content,
                          question: e.target.value
                        }
                      })
                    }
                    className="w-full p-3 border border-slate-300 rounded-lg resize-none text-sm font-medium"
                    rows="4"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-900 font-medium">
                      {selectedQuestion.content?.question || selectedQuestion.question}
                    </p>
                  </div>
                )}

                {/* Options */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Options</h4>
                  {editMode && editedQuestion ? (
                    <div className="space-y-2">
                      {(editedQuestion.options || []).map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={option.text === (editedQuestion.correctAnswer || selectedQuestion.correctAnswer)}
                            onChange={() =>
                              setEditedQuestion({
                                ...editedQuestion,
                                correctAnswer: option.text
                              })
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = [...editedQuestion.options];
                              newOptions[idx].text = e.target.value;
                              setEditedQuestion({
                                ...editedQuestion,
                                options: newOptions
                              });
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const newOptions = editedQuestion.options.filter((_, i) => i !== idx);
                              setEditedQuestion({
                                ...editedQuestion,
                                options: newOptions
                              });
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setEditedQuestion({
                            ...editedQuestion,
                            options: [
                              ...editedQuestion.options,
                              { text: '' }
                            ]
                          })
                        }
                        className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(selectedQuestion.options || []).map((option, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${selectedQuestion.id}`}
                            checked={option.text === selectedQuestion.correctAnswer}
                            readOnly
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-slate-700 text-sm">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <div>
                    <p className="text-slate-600">Atom</p>
                    <p className="font-semibold text-slate-900">{selectedQuestion.atom}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Difficulty</p>
                    <p className="font-semibold text-slate-900">{selectedQuestion.difficulty || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditedQuestion(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Validation Results */}
            {selectedValidation && (
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                  {selectedValidation.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="font-semibold text-slate-900">
                    {selectedValidation.isValid ? 'Validation Passed' : 'Validation Issues'}
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Errors */}
                  {selectedValidation.errors && selectedValidation.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Errors ({selectedValidation.errors.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedValidation.errors.map((error, idx) => (
                          <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm font-semibold text-red-900">{error.code}</p>
                            <p className="text-sm text-red-800">{error.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {selectedValidation.warnings && selectedValidation.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-900 text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warnings ({selectedValidation.warnings.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedValidation.warnings.map((warning, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm font-semibold text-yellow-900">{warning.code}</p>
                            <p className="text-sm text-yellow-800">{warning.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quality Info */}
                  {selectedValidation.isValid && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900">
                        <span className="font-semibold">Quality Grade:</span> {selectedValidation.qualityGrade}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-600">
            <p>Select a question to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionReviewer;
