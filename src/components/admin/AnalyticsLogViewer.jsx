import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * AnalyticsLogViewer - Insightful Edition
 * 
 * This dashboard transforms raw analytics logs into STORIES.
 * Instead of showing JSON blobs, it reveals:
 * - What the student is struggling with (misconceptions)
 * - How fast they're learning (recovery velocity trends)
 * - What we should do next (actionable recommendations)
 * - Whether the logging system is working (data quality health)
 */
function AnalyticsLogViewer() {
    const [logs, setLogs] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudentData, setSelectedStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [viewMode, setViewMode] = useState('insights'); // 'insights' or 'raw'
    const [stats, setStats] = useState({
        totalLogs: 0,
        completeLogsCount: 0,
        incompleteLogsCount: 0,
        completenessPercentage: 0,
        studentCount: 0,
        avgLogsPerStudent: 0,
        missingFieldsFrequency: {}
    });

    const REQUIRED_FIELDS = [
        'questionId',
        'studentAnswer',
        'isCorrect',
        'isRecovered',
        'recoveryVelocity',
        'diagnosticTag',
        'timeSpent',
        'cappedThinkingTime',
        'speedRating',
        'masteryBefore',
        'masteryAfter',
        'atomId',
        'mode',
        'timestamp'
    ];

    // Fetch all students on mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const q = query(collection(db, 'students'), where('role', '!=', 'TEACHER'));
                const snapshot = await getDocs(q);
                const studentList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || 'Unknown',
                    email: doc.data().email || '',
                    powerPoints: doc.data().powerPoints || 0,
                    heroLevel: doc.data().heroLevel || 1
                }));
                setStudents(studentList);
                if (studentList.length > 0) {
                    setSelectedStudent(studentList[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            }
        };
        fetchStudents();
    }, []);

    // Fetch logs for selected student with real-time updates
    useEffect(() => {
        if (!selectedStudent) return;

        setLoading(true);
        const logsRef = collection(db, 'students', selectedStudent, 'session_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const logData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
            }));

            setLogs(logData);
            calculateStats(logData);
            setLoading(false);

            // Also fetch student details
            const studentDoc = await getDoc(doc(db, 'students', selectedStudent));
            if (studentDoc.exists()) {
                setSelectedStudentData(studentDoc.data());
            }
        }, (error) => {
            console.error('Failed to fetch logs:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedStudent]);

    const calculateStats = (logData) => {
        const total = logData.length;
        let complete = 0;
        const missingFields = {};

        REQUIRED_FIELDS.forEach(field => {
            missingFields[field] = 0;
        });

        logData.forEach(log => {
            let isComplete = true;
            REQUIRED_FIELDS.forEach(field => {
                const hasField = log[field] !== undefined && log[field] !== null && log[field] !== '';
                if (!hasField) {
                    isComplete = false;
                    missingFields[field]++;
                }
            });
            if (isComplete) complete++;
        });

        setStats({
            totalLogs: total,
            completeLogsCount: complete,
            incompleteLogsCount: total - complete,
            completenessPercentage: total > 0 ? Math.round((complete / total) * 100) : 0,
            studentCount: students.length,
            avgLogsPerStudent: total > 0 ? (total / students.length).toFixed(1) : 0,
            missingFieldsFrequency: missingFields
        });
    };

    const isLogComplete = (log) => {
        return REQUIRED_FIELDS.every(field => 
            log[field] !== undefined && log[field] !== null && log[field] !== ''
        );
    };

    const getMissingFields = (log) => {
        return REQUIRED_FIELDS.filter(field => 
            log[field] === undefined || log[field] === null || log[field] === ''
        );
    };

    // ============ INSIGHT GENERATORS ============
    
    /**
     * Generate human-readable insights from a log
     * Tells the STORY of what happened
     */
    const generateLogInsight = (log, index, totalLogs) => {
        const insights = [];

        // Story Part 1: What happened?
        if (log.isCorrect) {
            insights.push({
                type: 'success',
                icon: '✨',
                title: 'Correct Answer',
                message: `Student got it right! Mastery improved from ${(log.masteryBefore || 0).toFixed(2)} → ${(log.masteryAfter || 0).toFixed(2)}`
            });
        } else if (log.isRecovered) {
            insights.push({
                type: 'recovery',
                icon: '🔄',
                title: 'Recovery Success!',
                message: `After getting it wrong, they recovered! Recovery velocity: ${(log.recoveryVelocity || 0).toFixed(2)} (0.0-1.0 scale)`
            });
        } else {
            insights.push({
                type: 'struggle',
                icon: '❌',
                title: 'Wrong Answer',
                message: `Student selected incorrect answer. Mastery changed from ${(log.masteryBefore || 0).toFixed(2)} → ${(log.masteryAfter || 0).toFixed(2)}`
            });
        }

        // Story Part 2: How fast were they thinking?
        if (log.speedRating === 'SPRINT') {
            insights.push({
                type: 'speed',
                icon: '⚡',
                title: 'Sprint Mode',
                message: `Answered in ${log.timeSpent || 0}s - showing confidence and flow! 🚀`
            });
        } else if (log.speedRating === 'NORMAL') {
            insights.push({
                type: 'speed',
                icon: '🎯',
                title: 'Normal Pace',
                message: `Took ${log.timeSpent || 0}s to think - good balance of speed and care`
            });
        } else if (log.speedRating === 'SLOW') {
            insights.push({
                type: 'speed',
                icon: '🤔',
                title: 'Deep Thinking',
                message: `Spent ${log.timeSpent || 0}s thinking - student is being thoughtful (might indicate struggle)`
            });
        }

        // Story Part 3: What misconception are we tracking?
        if (log.diagnosticTag) {
            insights.push({
                type: 'concept',
                icon: '🎓',
                title: 'Concept Being Taught',
                message: `This question targets: "${log.diagnosticTag}" - a key learning hurdle`
            });
        }

        // Story Part 4: Mode context
        if (log.mode === 'DIAGNOSTIC') {
            insights.push({
                type: 'context',
                icon: '🔍',
                title: 'Diagnostic Mode',
                message: 'This was a diagnostic question to assess understanding'
            });
        } else if (log.mode === 'DAILY') {
            insights.push({
                type: 'context',
                icon: '📅',
                title: 'Daily Practice',
                message: 'This was part of daily practice missions'
            });
        }

        // Story Part 5: What should we do next?
        const nextActions = [];
        if (!log.isCorrect && !log.isRecovered) {
            nextActions.push('🎯 Offer targeted hint on this concept');
            nextActions.push('📚 Schedule related practice questions');
        }
        if (log.isRecovered && log.recoveryVelocity < 0.3) {
            nextActions.push('⚠️ Student struggled to recover - may need more scaffolding');
        }
        if (log.speedRating === 'SLOW' && !log.isCorrect) {
            nextActions.push('💡 Slow thinking + wrong answer = misconception likely');
        }
        if (log.speedRating === 'SPRINT' && log.isCorrect) {
            nextActions.push('🚀 Fast + correct = build on this momentum!');
        }

        if (nextActions.length > 0) {
            insights.push({
                type: 'action',
                icon: '🎬',
                title: 'What to Do Next',
                message: nextActions.join('\n')
            });
        }

        return insights;
    };

    /**
     * Generate session-level insights (across all logs)
     */
    const generateSessionInsights = () => {
        if (logs.length === 0) return [];

        const insights = [];
        
        const correctCount = logs.filter(l => l.isCorrect).length;
        const recoveredCount = logs.filter(l => l.isRecovered).length;
        const incorrectCount = logs.length - correctCount - recoveredCount;
        const avgMasteryGain = logs.reduce((sum, l) => sum + ((l.masteryAfter || 0) - (l.masteryBefore || 0)), 0) / logs.length;
        const avgTime = logs.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / logs.length;
        const sprintCount = logs.filter(l => l.speedRating === 'SPRINT').length;

        insights.push({
            type: 'summary',
            icon: '📊',
            title: `Session Performance: ${correctCount}/${logs.length} Correct`,
            message: `Success rate: ${Math.round((correctCount / logs.length) * 100)}% ✓ | Recovered: ${recoveredCount} | Still Struggling: ${incorrectCount}`
        });

        insights.push({
            type: 'learning',
            icon: '📈',
            title: `Average Mastery Gain: ${avgMasteryGain.toFixed(3)}`,
            message: `Each question improved understanding by ~${Math.abs(avgMasteryGain).toFixed(2)} points (can be negative if struggling)`
        });

        insights.push({
            type: 'pace',
            icon: '⏱️',
            title: `Average Thinking Time: ${avgTime.toFixed(0)}s`,
            message: `Student takes ~${avgTime.toFixed(0)} seconds per question (slower = more thoughtful, faster = more confident)`
        });

        if (sprintCount > logs.length * 0.5) {
            insights.push({
                type: 'momentum',
                icon: '🔥',
                title: 'Sprint Momentum Building',
                message: `${sprintCount} questions answered in SPRINT mode - student is on a roll! 🎉`
            });
        }

        // Identify struggling concepts
        const conceptCounts = {};
        logs.filter(l => !l.isCorrect).forEach(l => {
            if (l.diagnosticTag) {
                conceptCounts[l.diagnosticTag] = (conceptCounts[l.diagnosticTag] || 0) + 1;
            }
        });

        const strugglingConcepts = Object.entries(conceptCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        if (strugglingConcepts.length > 0) {
            insights.push({
                type: 'struggle',
                icon: '⚠️',
                title: 'Concepts Need More Practice',
                message: strugglingConcepts.map(([concept, count]) => `• "${concept}" (${count} errors)`).join('\n')
            });
        }

        return insights;
    };

    const formatTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };

    const formatValue = (value, field) => {
        if (value === undefined || value === null) return '❌ MISSING';
        if (value === '') return '⚠️ EMPTY';
        if (field === 'recoveryVelocity' || field === 'masteryBefore' || field === 'masteryAfter') {
            return typeof value === 'number' ? value.toFixed(2) : value;
        }
        if (field === 'timeSpent' || field === 'cappedThinkingTime') {
            return `${value}s`;
        }
        if (typeof value === 'boolean') {
            return value ? '✓ TRUE' : '✗ FALSE';
        }
        return String(value).substring(0, 30);
    };

    const getStatusBadge = (log) => {
        if (isLogComplete(log)) return <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ COMPLETE</span>;
        const missing = getMissingFields(log).length;
        return <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{missing} MISSING</span>;
    };

    // ============ RENDER ============

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">📊 Analytics Dashboard</h1>
                        <p className="text-slate-600 font-medium">Understanding student learning patterns in real-time</p>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                        Sign Out 🚪
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Total Logs</p>
                        <p className="text-3xl font-black text-slate-900">{stats.totalLogs}</p>
                        <p className="text-xs text-slate-500 mt-2">events tracked</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200">
                        <p className="text-xs font-black text-green-700 uppercase tracking-wider mb-2">✓ Complete</p>
                        <p className="text-3xl font-black text-green-700">{stats.completenessPercentage}%</p>
                        <p className="text-xs text-green-600 mt-2">data quality score</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200">
                        <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2">🧑‍🎓 Students</p>
                        <p className="text-3xl font-black text-blue-700">{stats.studentCount}</p>
                        <p className="text-xs text-blue-600 mt-2">being tracked</p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-6 shadow-sm border border-purple-200">
                        <p className="text-xs font-black text-purple-700 uppercase tracking-wider mb-2">Avg Activity</p>
                        <p className="text-3xl font-black text-purple-700">{stats.avgLogsPerStudent}</p>
                        <p className="text-xs text-purple-600 mt-2">logs per student</p>
                    </div>
                </div>

                {/* Student Selector */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">👤 Select Student</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                        {students.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student.id)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                    selectedStudent === student.id
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
                                }`}
                            >
                                <p className="font-bold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500 mt-1">⭐ L{student.heroLevel} • {student.powerPoints}⚡</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session-Level Insights */}
                {!loading && logs.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider px-6">📈 Session Insights</h2>
                        {generateSessionInsights().map((insight, idx) => (
                            <div
                                key={idx}
                                className={`rounded-lg p-4 border-l-4 ${
                                    insight.type === 'summary' ? 'bg-blue-50 border-blue-500' :
                                    insight.type === 'momentum' ? 'bg-yellow-50 border-yellow-500' :
                                    insight.type === 'struggle' ? 'bg-red-50 border-red-500' :
                                    insight.type === 'learning' ? 'bg-green-50 border-green-500' :
                                    'bg-purple-50 border-purple-500'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{insight.icon}</span>
                                    <div>
                                        <p className="font-bold text-slate-900">{insight.title}</p>
                                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Data Quality Alert */}
                {stats.completenessPercentage < 100 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                        <h3 className="font-bold text-amber-900 mb-3">⚠️ Data Quality Alert</h3>
                        <p className="text-amber-800 text-sm mb-3">Some logs are missing data. Check these fields:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {Object.entries(stats.missingFieldsFrequency)
                                .filter(([_, count]) => count > 0)
                                .sort(([_, a], [__, b]) => b - a)
                                .slice(0, 6)
                                .map(([field, count]) => (
                                    <div key={field} className="bg-white p-3 rounded border border-amber-200">
                                        <p className="font-bold text-amber-900 text-xs">{field}</p>
                                        <p className="text-amber-700 text-xs mt-1">Missing in {count} logs</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setViewMode('insights')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${
                            viewMode === 'insights'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                    >
                        💡 Story View (Insightful)
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${
                            viewMode === 'raw'
                                ? 'bg-slate-600 text-white shadow-lg'
                                : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        📋 Raw Data (Technical)
                    </button>
                </div>

                {/* Logs Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                            {viewMode === 'insights' ? '📖 Log Stories' : '📋 Raw Logs'}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="text-4xl animate-spin mb-4">🌊</div>
                            <p className="text-slate-600 font-medium">Loading student story...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-slate-600 font-medium">No logs yet</p>
                            <p className="text-slate-500 text-sm mt-2">When this student completes missions, their learning journey will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {logs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    {viewMode === 'insights' ? (
                                        // STORY VIEW
                                        <div
                                            className="p-6 cursor-pointer"
                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                        >
                                            {/* Log Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Question #{logs.length - idx}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{formatTime(log.timestamp)}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    {getStatusBadge(log)}
                                                    <div className="text-xs">
                                                        <p className={`font-bold ${
                                                            log.isCorrect ? 'text-green-700' : log.isRecovered ? 'text-yellow-700' : 'text-red-700'
                                                        }`}>
                                                            {log.isCorrect ? '✓ CORRECT' : log.isRecovered ? '🔄 RECOVERED' : '✗ INCORRECT'}
                                                        </p>
                                                        {log.speedRating && (
                                                            <p className={`font-bold ${
                                                                log.speedRating === 'SPRINT' ? 'text-blue-700' : 'text-slate-600'
                                                            }`}>
                                                                {log.speedRating}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Insights */}
                                            <div className="space-y-2">
                                                {generateLogInsight(log, idx, logs.length).map((insight, insightIdx) => (
                                                    <div
                                                        key={insightIdx}
                                                        className={`rounded p-3 border-l-4 ${
                                                            insight.type === 'success' ? 'bg-green-50 border-green-500' :
                                                            insight.type === 'recovery' ? 'bg-yellow-50 border-yellow-500' :
                                                            insight.type === 'struggle' ? 'bg-red-50 border-red-500' :
                                                            insight.type === 'speed' ? 'bg-blue-50 border-blue-500' :
                                                            insight.type === 'concept' ? 'bg-purple-50 border-purple-500' :
                                                            insight.type === 'action' ? 'bg-orange-50 border-orange-500' :
                                                            'bg-slate-50 border-slate-300'
                                                        }`}
                                                    >
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {insight.icon} {insight.title}
                                                        </p>
                                                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{insight.message}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Expand Button */}
                                            <button
                                                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
                                                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                            >
                                                {expandedLogId === log.id ? '▼ Hide Raw Data' : '▶ Show Raw Data'}
                                            </button>

                                            {/* Raw Data (Expandable) */}
                                            {expandedLogId === log.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {REQUIRED_FIELDS.map(field => {
                                                        const value = log[field];
                                                        const isMissing = value === undefined || value === null || value === '';
                                                        return (
                                                            <div
                                                                key={field}
                                                                className={`p-2 rounded text-xs border ${
                                                                    isMissing
                                                                        ? 'bg-red-50 border-red-200'
                                                                        : 'bg-green-50 border-green-200'
                                                                }`}
                                                            >
                                                                <p className="font-bold text-slate-600 uppercase text-xs mb-1">{field}</p>
                                                                <p className={`font-mono text-xs ${
                                                                    isMissing ? 'text-red-700' : 'text-green-700'
                                                                }`}>
                                                                    {formatValue(value, field)}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // RAW DATA VIEW
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Log #{logs.length - idx}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{formatTime(log.timestamp)}</p>
                                                </div>
                                                <div className="text-right">
                                                    {getStatusBadge(log)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {REQUIRED_FIELDS.map(field => {
                                                    const value = log[field];
                                                    const isMissing = value === undefined || value === null || value === '';
                                                    return (
                                                        <div
                                                            key={field}
                                                            className={`p-3 rounded border ${
                                                                isMissing
                                                                    ? 'bg-red-50 border-red-200'
                                                                    : 'bg-green-50 border-green-200'
                                                            }`}
                                                        >
                                                            <p className="text-xs font-bold text-slate-600 uppercase mb-1">
                                                                {field}
                                                            </p>
                                                            <p className={`text-sm font-mono ${
                                                                isMissing ? 'text-red-700' : 'text-green-700'
                                                            }`}>
                                                                {formatValue(value, field)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {!isLogComplete(log) && (
                                                <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded text-sm">
                                                    <p className="font-bold text-red-700 mb-1">⚠️ Missing Fields:</p>
                                                    <p className="text-red-600 text-xs font-mono">
                                                        {getMissingFields(log).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-slate-900 mb-4">🔍 Understanding the Dashboard</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-bold text-slate-900 mb-2">✓ COMPLETE</p>
                            <p className="text-slate-700">Log has all 14 required fields</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 mb-2">⚡ SPRINT</p>
                            <p className="text-slate-700">Student answered quickly with confidence</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 mb-2">🔄 RECOVERED</p>
                            <p className="text-slate-700">Got it wrong first, but learned from hint</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 mb-2">📈 Mastery Gain</p>
                            <p className="text-slate-700">Shows how much understanding improved</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsLogViewer;
