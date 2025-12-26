import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * AnalyticsLogViewer
 * Admin Dashboard for viewing recent session logs and validating analytics data quality.
 * Shows all critical fields that must be present for downstream analytics.
 * Leverages existing NinjaContext logQuestionResult structure.
 */
function AnalyticsLogViewer() {
    const [logs, setLogs] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLogs: 0,
        completeLogsCount: 0,
        incompleteLogsCount: 0,
        completenessPercentage: 0,
        studentCount: 0,
        avgLogsPerStudent: 0,
        missingFieldsFrequency: {}
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [timeRange, setTimeRange] = useState('today'); // 'today', 'week', 'month'

    // All required fields for analytics
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

        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
            }));

            setLogs(logData);
            calculateStats(logData);
            setLoading(false);
        }, (error) => {
            console.error('Failed to fetch logs:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedStudent]);

    // Calculate data quality statistics
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

    // Check if a log has all required fields
    const isLogComplete = (log) => {
        return REQUIRED_FIELDS.every(field => 
            log[field] !== undefined && log[field] !== null && log[field] !== ''
        );
    };

    // Get missing fields for a log
    const getMissingFields = (log) => {
        return REQUIRED_FIELDS.filter(field => 
            log[field] === undefined || log[field] === null || log[field] === ''
        );
    };

    // Format timestamp
    const formatTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };

    // Format field value for display
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

    // Get status color
    const getStatusColor = (log) => {
        if (isLogComplete(log)) return 'bg-green-50 border-green-200';
        if (getMissingFields(log).length <= 2) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getStatusBadge = (log) => {
        if (isLogComplete(log)) return <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">✓ COMPLETE</span>;
        const missing = getMissingFields(log).length;
        return <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">{missing} MISSING</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">📊 Analytics Log Viewer</h1>
                        <p className="text-slate-600 font-medium">Real-time monitoring of session logs and data completeness</p>
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
                        <p className="text-xs text-slate-500 mt-2">from all students</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200">
                        <p className="text-xs font-black text-green-700 uppercase tracking-wider mb-2">✓ Complete</p>
                        <p className="text-3xl font-black text-green-700">{stats.completeLogsCount}</p>
                        <p className="text-xs text-green-600 mt-2">{stats.completenessPercentage}% of all logs</p>
                    </div>

                    <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
                        <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-2">❌ Incomplete</p>
                        <p className="text-3xl font-black text-red-700">{stats.incompleteLogsCount}</p>
                        <p className="text-xs text-red-600 mt-2">{100 - stats.completenessPercentage}% with issues</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200">
                        <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2">Avg Logs/Student</p>
                        <p className="text-3xl font-black text-blue-700">{stats.avgLogsPerStudent}</p>
                        <p className="text-xs text-blue-600 mt-2">across {stats.studentCount} students</p>
                    </div>
                </div>

                {/* Student Selector */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">📚 Select Student</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {students.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student.id)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    selectedStudent === student.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                }`}
                            >
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">{student.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">L{student.heroLevel} • {student.powerPoints}⚡</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Field Completeness Warning */}
                {stats.completenessPercentage < 100 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                        <h3 className="font-bold text-amber-900 mb-3">⚠️ Data Quality Alert</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {Object.entries(stats.missingFieldsFrequency)
                                .filter(([_, count]) => count > 0)
                                .sort(([_, a], [__, b]) => b - a)
                                .slice(0, 6)
                                .map(([field, count]) => (
                                    <div key={field} className="bg-white p-3 rounded border border-amber-200">
                                        <p className="font-bold text-amber-900">{field}</p>
                                        <p className="text-amber-700 text-xs mt-1">{count} logs missing</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Recent Logs</h2>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="text-4xl animate-spin mb-4">🌊</div>
                            <p className="text-slate-600 font-medium">Loading logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-slate-600 font-medium">No logs found for selected student</p>
                            <p className="text-slate-500 text-sm mt-2">Logs will appear here after the student completes missions</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {logs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className={`border-b border-slate-100 p-6 hover:bg-slate-50 transition-colors ${
                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                    }`}
                                >
                                    {/* Log Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Log #{logs.length - idx}</p>
                                            <p className="text-sm text-slate-600 mt-1">{formatTime(log.timestamp)}</p>
                                        </div>
                                        <div className="text-right">
                                            {getStatusBadge(log)}
                                            <div className="mt-2 space-y-1 text-xs">
                                                <p className={`font-bold ${
                                                    log.isCorrect ? 'text-green-700' : log.isRecovered ? 'text-yellow-700' : 'text-red-700'
                                                }`}>
                                                    {log.isCorrect ? '✓ CORRECT' : log.isRecovered ? '🔄 RECOVERED' : '✗ INCORRECT'}
                                                </p>
                                                {log.speedRating && (
                                                    <p className={`${
                                                        log.speedRating === 'SPRINT' ? 'text-blue-700 font-bold' : 'text-slate-600'
                                                    }`}>
                                                        ⚡ {log.speedRating}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Log Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
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
                                                    <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-1">
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

                                    {/* Missing Fields Alert */}
                                    {!isLogComplete(log) && (
                                        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                                            <p className="font-bold text-red-700 mb-2">Missing Fields:</p>
                                            <p className="text-red-600 text-xs font-mono">
                                                {getMissingFields(log).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Field Requirements Legend */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-4">📋 Required Fields for Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {REQUIRED_FIELDS.map(field => (
                            <div key={field} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                                <div>
                                    <p className="font-bold text-blue-900">{field}</p>
                                    <p className="text-blue-700 text-xs mt-0.5">Must be non-null and non-empty</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsLogViewer;
