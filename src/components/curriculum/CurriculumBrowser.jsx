import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, Target, Zap, Lock, CheckCircle } from 'lucide-react';
import curriculumData from '../../data/cbse7_mathquest_curriculum_v1_1.json';

/**
 * CurriculumBrowser Component
 * Hierarchical curriculum navigation UI
 * Displays modules → atoms → questions structure
 */
export function CurriculumBrowser({ onSelectQuestion }) {
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedAtom, setExpandedAtom] = useState(null);
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const curriculum = curriculumData;
  const modules = curriculum.modules || [];

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
    setExpandedAtom(null);
  };

  const toggleAtom = (atomId) => {
    setExpandedAtom(expandedAtom === atomId ? null : atomId);
  };

  const handleAtomSelect = async (module, atom) => {
    setSelectedAtom(atom);
    setLoading(true);
    // Simulate loading questions from database
    setTimeout(() => {
      // Mock questions - in production, fetch from Firestore
      const mockQuestions = [
        {
          id: `Q1-${atom.atomid}`,
          templateId: 'MCQ_CONCEPT',
          prompt: `Question 1 for ${atom.title}`,
          difficulty: 1,
          status: 'PUBLISHED',
        },
        {
          id: `Q2-${atom.atomid}`,
          templateId: 'NUMERIC_INPUT',
          prompt: `Question 2 for ${atom.title}`,
          difficulty: 2,
          status: 'PUBLISHED',
        },
        {
          id: `Q3-${atom.atomid}`,
          templateId: 'BALANCE_OPS',
          prompt: `Question 3 for ${atom.title}`,
          difficulty: 2,
          status: 'PUBLISHED',
        },
      ];
      setQuestions(mockQuestions);
      setLoading(false);
    }, 500);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'DRAFT':
        return <Lock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTemplateColor = (templateId) => {
    const colors = {
      MCQ_CONCEPT: 'from-blue-400 to-blue-600',
      NUMERIC_INPUT: 'from-purple-400 to-purple-600',
      BALANCE_OPS: 'from-pink-400 to-pink-600',
      NUMBER_LINE_PLACE: 'from-green-400 to-green-600',
      CLASSIFY_SORT: 'from-yellow-400 to-yellow-600',
      MATCHING: 'from-red-400 to-red-600',
      GEOMETRY_TAP: 'from-cyan-400 to-cyan-600',
      ERROR_ANALYSIS: 'from-orange-400 to-orange-600',
      WORKED_EXAMPLE_COMPLETE: 'from-indigo-400 to-indigo-600',
      STEP_ORDER: 'from-rose-400 to-rose-600',
      EXPRESSION_INPUT: 'from-teal-400 to-teal-600',
      MULTI_STEP_WORD: 'from-lime-400 to-lime-600',
      SIMULATION: 'from-fuchsia-400 to-fuchsia-600',
      SHORT_EXPLAIN: 'from-slate-400 to-slate-600',
      TWO_TIER: 'from-violet-400 to-violet-600',
    };
    return colors[templateId] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{curriculum.title}</h1>
            <p className="text-sm text-gray-600">Grade {curriculum.gradeLevel} · {curriculum.modules?.length} modules</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Curriculum Tree */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-2">
            {modules.map((module) => (
              <div key={module.moduleid} className="space-y-1">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.moduleid)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-all text-left group"
                >
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedModule === module.moduleid ? 'rotate-90' : ''
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {module.title}
                    </h3>
                    <p className="text-xs text-gray-500">{module.atoms?.length} topics</p>
                  </div>
                </button>

                {/* Atoms (sub-items) */}
                {expandedModule === module.moduleid && (
                  <div className="pl-4 space-y-1">
                    {module.atoms?.map((atom) => (
                      <button
                        key={atom.atomid}
                        onClick={() => handleAtomSelect(module, atom)}
                        className={`w-full text-left p-2 rounded-lg transition-all text-sm ${
                          selectedAtom?.atomid === atom.atomid
                            ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{atom.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{atom.coreidea}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Selected Atom Details & Questions */}
        <div className="flex-1 overflow-y-auto">
          {selectedAtom ? (
            <div className="p-6 space-y-6">
              {/* Atom Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAtom.title}</h2>
                <p className="text-gray-600 mt-2">{selectedAtom.coreidea}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {selectedAtom.commonmisconceptions?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                      <Zap className="w-4 h-4" />
                      {selectedAtom.commonmisconceptions.length} Misconceptions
                    </div>
                  )}
                  {selectedAtom.bloomlevels && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                      <BookOpen className="w-4 h-4" />
                      {selectedAtom.bloomlevels.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Practice Questions ({questions.length})
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : questions.length > 0 ? (
                  <div className="grid gap-3">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => onSelectQuestion?.(q)}
                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(q.status)}
                              <span className="text-sm font-mono text-gray-500">{q.id}</span>
                            </div>
                            <p className="text-gray-900 font-medium group-hover:text-blue-600 truncate">
                              {q.prompt}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                getDifficultyColor(q.difficulty)
                              }`}
                            >
                              L{q.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Template Badge */}
                        <div className="mt-3">
                          <div
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
                              getTemplateColor(q.templateId)
                            }`}
                          >
                            {q.templateId.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No questions available for this topic</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a topic to view questions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
