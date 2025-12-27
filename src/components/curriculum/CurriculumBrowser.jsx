import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  BookOpen,
  Target,
  Zap,
  Lock,
  CheckCircle,
  AlertCircle,
  Grid,
  List,
  Layers,
  BarChart3,
} from 'lucide-react';
import curriculumV2Service from '../../services/curriculumV2Service';

/**
 * CurriculumBrowser v2.0
 * 
 * Unified curriculum browser using all 4 v2 files:
 * - Doc0: Manifest (version lock & index)
 * - Doc1: Core Curriculum (learning map)
 * - Doc2: Template Library (UI contracts)
 * - Doc3: Assessment Guide (mastery & analytics)
 * 
 * Displays: modules → atoms → templates → outcomes/misconceptions
 */
export function CurriculumBrowser({ onSelectQuestion }) {
  // UI State
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedAtom, setExpandedAtom] = useState(null);
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [curriculum, setCurriculum] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load curriculum on mount
  useEffect(() => {
    const initCurriculum = async () => {
      try {
        setLoading(true);
        const loaded = await curriculumV2Service.loadCurriculumV2();
        const curriculumStats = await curriculumV2Service.getCurriculumStats();
        
        setCurriculum(loaded);
        setStats(curriculumStats);
        setError(null);
      } catch (err) {
        console.error('Failed to load curriculum:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initCurriculum();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Curriculum v2...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Curriculum</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!curriculum) return null;

  const { modules = [] } = curriculum;
  const filteredModules = modules.filter(mod =>
    mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mod.atoms || []).some(atom =>
      atom.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
    setExpandedAtom(null);
  };

  const toggleAtom = (atomId) => {
    setExpandedAtom(expandedAtom === atomId ? null : atomId);
  };

  const handleAtomSelect = async (module, atom) => {
    setSelectedAtom({ ...atom, moduleName: module.title });
  };

  const getTemplateColor = (templateId) => {
    const colors = {
      MCQ_CONCEPT: 'from-blue-400 to-blue-600',
      MCQ_SKILL: 'from-blue-400 to-blue-600',
      NUMERIC_INPUT: 'from-purple-400 to-purple-600',
      BALANCE_OPS: 'from-pink-400 to-pink-600',
      BALANCE_SLIDER: 'from-pink-400 to-pink-600',
      NUMBER_LINE_PLACE: 'from-green-400 to-green-600',
      CLASSIFY_SORT: 'from-yellow-400 to-yellow-600',
      MATCHING: 'from-red-400 to-red-600',
      GEOMETRY_TAP: 'from-cyan-400 to-cyan-600',
      ERROR_ANALYSIS: 'from-orange-400 to-orange-600',
      WORKED_EXAMPLE_COMPLETE: 'from-indigo-400 to-indigo-600',
      STEP_BUILDER: 'from-rose-400 to-rose-600',
      EXPRESSION_INPUT: 'from-teal-400 to-teal-600',
      MULTI_STEP_WORD: 'from-lime-400 to-lime-600',
      SIMULATION: 'from-fuchsia-400 to-fuchsia-600',
      SHORT_EXPLAIN: 'from-slate-400 to-slate-600',
      TRANSFER_MINI: 'from-violet-400 to-violet-600',
      DRAG_DROP_MATCH: 'from-emerald-400 to-emerald-600',
      GRAPH_PLOT: 'from-amber-400 to-amber-600',
    };
    return colors[templateId] || 'from-gray-400 to-gray-600';
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

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 space-y-4">
          {/* Title & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Curriculum Browser v2</h1>
                <p className="text-sm text-gray-600">Bundle: {curriculum.bundleId}</p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="flex gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 font-semibold">Modules</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalModules}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-purple-600 font-semibold">Atoms</div>
                  <div className="text-2xl font-bold text-purple-900">{stats.totalAtoms}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-semibold">Templates</div>
                  <div className="text-2xl font-bold text-green-900">{stats.totalTemplates}</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search modules or atoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1 ${
                  viewMode === 'hierarchy'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">Hierarchy</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Curriculum Tree */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredModules.map((module) => (
              <div key={module.module_id} className="space-y-1">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.module_id)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-all text-left group"
                >
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      expandedModule === module.module_id ? 'rotate-90' : ''
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                      {module.title}
                    </h3>
                    <p className="text-xs text-gray-500">{(module.atoms || []).length} topics</p>
                  </div>
                </button>

                {/* Atoms (sub-items) */}
                {expandedModule === module.module_id && (
                  <div className="pl-4 space-y-1">
                    {(module.atoms || []).map((atom) => (
                      <button
                        key={atom.atom_id}
                        onClick={() => handleAtomSelect(module, atom)}
                        className={`w-full text-left p-2 rounded-lg transition-all text-sm group ${
                          selectedAtom?.atom_id === atom.atom_id
                            ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{atom.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {atom.description}
                            </p>
                          </div>
                          {(atom.template_ids || []).length > 0 && (
                            <Layers className="w-3 h-3 flex-shrink-0 text-purple-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Selected Atom Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedAtom ? (
            <div className="p-6 space-y-6">
              {/* Atom Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {selectedAtom.atom_id}
                      </span>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {selectedAtom.moduleName}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAtom.title}</h2>
                    <p className="text-gray-600 mb-4">{selectedAtom.description}</p>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes Section */}
              {selectedAtom.outcomes && selectedAtom.outcomes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Learning Outcomes
                  </h3>
                  <div className="space-y-2">
                    {selectedAtom.outcomes.map((outcome, idx) => {
                      const typeColors = {
                        CONCEPTUAL: 'bg-blue-100 text-blue-800',
                        PROCEDURAL: 'bg-green-100 text-green-800',
                        LOGICAL: 'bg-purple-100 text-purple-800',
                        TRANSFER: 'bg-orange-100 text-orange-800',
                      };
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold flex-shrink-0 mt-0.5 ${typeColors[outcome.type] || typeColors.CONCEPTUAL}`}>
                            {outcome.type}
                          </span>
                          <p className="text-gray-700 flex-1">{outcome.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Misconceptions Section */}
              {selectedAtom.misconception_ids && selectedAtom.misconception_ids.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Common Misconceptions ({selectedAtom.misconception_ids.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedAtom.misconception_ids.map((miscId, idx) => (
                      <div key={idx} className="bg-amber-50 rounded p-3 border border-amber-200">
                        <p className="text-sm font-mono text-amber-700">{miscId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supported Templates Section */}
              {selectedAtom.template_ids && selectedAtom.template_ids.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    Supported Question Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAtom.template_ids.map((templateId) => {
                      const template = curriculum.templates[templateId];
                      return (
                        <div
                          key={templateId}
                          className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getTemplateColor(templateId)} mb-2`}>
                            {templateId.replace(/_/g, ' ')}
                          </div>
                          {template && (
                            <div className="text-sm text-gray-600 mt-2">
                              <p className="font-medium text-gray-900">{template.display_name}</p>
                              {template.description && (
                                <p className="text-xs mt-1 line-clamp-2">{template.description}</p>
                              )}
                              {template.scoring_model && (
                                <div className="text-xs text-gray-500 mt-1">
                                  📊 Scoring: {template.scoring_model.type}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mastery Profile Section */}
              {selectedAtom.mastery_profile_id && (
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Mastery Profile
                  </h3>
                  <div className="bg-green-50 rounded p-4 border border-green-200">
                    <p className="text-sm font-mono text-green-700">{selectedAtom.mastery_profile_id}</p>
                  </div>
                </div>
              )}

              {/* Prerequisites Section */}
              {selectedAtom.prerequisites && selectedAtom.prerequisites.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prerequisites</h3>
                  <div className="space-y-2">
                    {selectedAtom.prerequisites.map((prereq, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        {prereq}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a topic to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CurriculumBrowser;
