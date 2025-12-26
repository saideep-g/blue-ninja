import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';

<<<<<<< HEAD
function AdminAnalyticsDashboard() {
    const [logs, setLogs] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [diagnostics, setDiagnostics] = useState({
        studentsCount: 0,
        logsCount: 0,
        studentErrors: [],
        logsErrors: [],
        firebaseUser: null,
        collectionsFound: []
    });

    // ========== FETCH STUDENTS ==========
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                console.log('📍 Starting student fetch...');

                const q = query(
                    collection(db, 'students'),
                    // where('role', '!=', 'TEACHER')
                );

                console.log('📍 Query created, executing...');
                const snapshot = await getDocs(q);

                console.log(`✅ Fetched ${snapshot.size} students`);

                const studentList = snapshot.docs.map(doc => {
                    console.log(`  - Student: ${doc.data().name} (${doc.id})`);
                    return {
                        id: doc.id,
                        name: doc.data().name || 'Unknown',
                        email: doc.data().email || '',
                        powerPoints: doc.data().powerPoints || 0,
                        heroLevel: doc.data().heroLevel || 1,
                        role: doc.data().role || 'STUDENT'
                    };
                });

                setStudents(studentList.sort((a, b) => a.name.localeCompare(b.name)));
                setDiagnostics(prev => ({
                    ...prev,
                    studentsCount: snapshot.size,
                    studentErrors: []
                }));
            } catch (error) {
                console.error('❌ Student fetch error:', error);
                setDiagnostics(prev => ({
                    ...prev,
                    studentErrors: [error.message]
                }));
            }
        };

        fetchStudents();
    }, []);

    // ========== FETCH LOGS WITH REAL-TIME UPDATES ==========
    useEffect(() => {
        setLoading(true);
        let unsubscribe = null;

        try {
            console.log(`📍 Fetching logs for student: ${selectedStudent}`);

            let q;

            if (selectedStudent === 'ALL') {
                console.log('📍 Querying ALL logs from session_logs collection...');
                const logsRef = collection(db, 'session_logs');
                q = query(logsRef, orderBy('timestamp', 'desc'), limit(200));
            } else {
                console.log(`📍 Querying logs for student: ${selectedStudent}`);
                const logsRef = collection(db, 'students', selectedStudent, 'session_logs');
                q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
            }

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    console.log(`✅ Received ${snapshot.size} logs`);

                    const logData = snapshot.docs.map((doc, idx) => {
                        const data = doc.data();
                        console.log(`  Log ${idx + 1}:`, {
                            id: doc.id,
                            studentId: data.studentId,
                            questionId: data.questionId,
                            timestamp: data.timestamp,
                            fields: Object.keys(data).length
                        });

                        return {
                            id: doc.id,
                            studentId: selectedStudent === 'ALL' ? data.studentId : selectedStudent,
                            ...data,
                            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
                        };
                    });

                    setLogs(logData);
                    setDiagnostics(prev => ({
                        ...prev,
                        logsCount: snapshot.size,
                        logsErrors: []
                    }));
                    setLoading(false);
                },
                (error) => {
                    console.error('❌ Logs fetch error:', error);
                    setDiagnostics(prev => ({
                        ...prev,
                        logsErrors: [error.message, error.code]
                    }));
                    setLoading(false);
                }
            );

            return () => {
                if (unsubscribe) unsubscribe();
            };
        } catch (error) {
            console.error('❌ Setup error:', error);
            setDiagnostics(prev => ({
                ...prev,
                logsErrors: [error.message]
            }));
            setLoading(false);
        }
    }, [selectedStudent]);

    // ========== CHECK CURRENT USER ==========
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Current user:', {
                    uid: user.uid,
                    email: user.email
                });
                setDiagnostics(prev => ({
                    ...prev,
                    firebaseUser: {
                        uid: user.uid,
                        email: user.email
                    }
                }));
            }
        });
        return () => unsubscribe();
    }, []);

    // ========== RENDER ==========
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            <header className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-slate-900 mb-2">🔍 Analytics Dashboard - Diagnostic Mode</h1>
                <p className="text-slate-600 font-medium">Checking data connections and troubleshooting...</p>
            </header>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* FIREBASE USER INFO */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
                    <h2 className="text-lg font-black text-blue-900 mb-4">👤 Firebase User</h2>
                    {diagnostics.firebaseUser ? (
                        <div className="bg-green-50 p-4 rounded border border-green-300">
                            <p className="text-green-800"><strong>✅ User is authenticated</strong></p>
                            <p className="text-sm text-green-700 mt-2">
                                UID: <code className="bg-white px-2 py-1 rounded">{diagnostics.firebaseUser.uid}</code>
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                Email: <code className="bg-white px-2 py-1 rounded">{diagnostics.firebaseUser.email}</code>
                            </p>
                        </div>
                    ) : (
                        <div className="bg-red-50 p-4 rounded border border-red-300">
                            <p className="text-red-800"><strong>❌ User is NOT authenticated</strong></p>
                        </div>
                    )}
                </div>

                {/* STUDENTS COUNT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200">
                        <h2 className="text-lg font-black text-purple-900 mb-4">👥 Students Query</h2>
                        {diagnostics.studentErrors.length > 0 ? (
                            <div className="bg-red-50 p-4 rounded border border-red-300">
                                <p className="text-red-800 font-bold">❌ Error:</p>
                                {diagnostics.studentErrors.map((error, idx) => (
                                    <p key={idx} className="text-red-700 text-sm mt-2">{error}</p>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-green-50 p-4 rounded border border-green-300">
                                <p className="text-green-800">
                                    <strong>✅ Found {diagnostics.studentsCount} students</strong>
                                </p>
                                <p className="text-sm text-green-700 mt-2">
                                    Query: <code className="bg-white px-2 py-1 rounded text-xs">collection('students') where role != 'TEACHER'</code>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
                        <h2 className="text-lg font-black text-orange-900 mb-4">📋 Logs Query</h2>
                        {diagnostics.logsErrors.length > 0 ? (
                            <div className="bg-red-50 p-4 rounded border border-red-300">
                                <p className="text-red-800 font-bold">❌ Error:</p>
                                {diagnostics.logsErrors.map((error, idx) => (
                                    <p key={idx} className="text-red-700 text-sm mt-2">{error}</p>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-green-50 p-4 rounded border border-green-300">
                                <p className="text-green-800">
                                    <strong>✅ Found {diagnostics.logsCount} logs</strong>
                                </p>
                                <p className="text-sm text-green-700 mt-2">
                                    Query: <code className="bg-white px-2 py-1 rounded text-xs">session_logs (or students/{selectedStudent}/session_logs)</code>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* STUDENT SELECTOR */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 mb-4">📚 Select Student to Debug</h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            onClick={() => setSelectedStudent('ALL')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedStudent === 'ALL'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            👥 All Students ({students.length})
                        </button>
                        {students.slice(0, 10).map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student.id)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${selectedStudent === student.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                title={student.name}
                            >
                                {student.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-slate-600">
                        Total students: <strong>{students.length}</strong> | Selected: <strong>{selectedStudent === 'ALL' ? 'ALL' : selectedStudent}</strong>
                    </p>
                </div>

                {/* LOGS TABLE */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                        <h2 className="text-lg font-black text-slate-900">
                            📋 Logs ({logs.length} found)
=======
/**
 * AdminAnalyticsDashboard
 * 
 * Comprehensive admin interface for viewing, filtering, and analyzing session logs.
 * Monitors data quality, validates completeness of analytics fields, and provides
 * actionable insights into learning patterns.
 * 
 * Features:
 * - Real-time log viewing with Firebase listeners
 * - Smart filtering by student, date, status, question, speed
 * - Full-text search across logs
 * - Data quality metrics and alerts
 * - Expandable field inspector
 * - Validation status tracking
 */
function AdminAnalyticsDashboard() {
    // ========== STATE ==========
    const [logs, setLogs] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('ALL');
    const [selectedLogId, setSelectedLogId] = useState(null); // For expand/collapse
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLogs: 0,
        completeLogsCount: 0,
        incompleteLogsCount: 0,
        completenessPercentage: 0,
        studentCount: 0,
        avgLogsPerStudent: 0,
        missingFieldsFrequency: {},
        totalUnique Students: 0
    });

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETE, INCOMPLETE
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
    const [speedFilter, setSpeedFilter] = useState('ALL'); // ALL, SPRINT, STEADY, DEEP
    const [correctnessFilter, setCorrectnessFilter] = useState('ALL'); // ALL, CORRECT, WRONG, RECOVERED

    // All required fields for analytics (from analyticsSchema.js)
    const REQUIRED_FIELDS = [
        'questionId',
        'studentAnswer',
        'correctAnswer',
        'isCorrect',
        'timeSpent',
        'speedRating',
        'masteryBefore',
        'masteryAfter',
        'diagnosticTag',
        'isRecovered',
        'recoveryVelocity',
        'atomId',
        'timestamp'
    ];

    // ========== EFFECTS ==========

    // Fetch all students on mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const q = query(
                    collection(db, 'students'),
                    where('role', '!=', 'TEACHER')
                );
                const snapshot = await getDocs(q);
                const studentList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || 'Unknown',
                    email: doc.data().email || '',
                    powerPoints: doc.data().powerPoints || 0,
                    heroLevel: doc.data().heroLevel || 1,
                    role: doc.data().role || 'STUDENT'
                }));
                setStudents(studentList.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (error) {
                console.error('Failed to fetch students:', error);
            }
        };
        fetchStudents();
    }, []);

    // Fetch logs with real-time updates
    useEffect(() => {
        setLoading(true);
        let logsRef, q;

        if (selectedStudent === 'ALL') {
            // Get logs from all students
            logsRef = collection(db, 'session_logs');
            q = query(logsRef, orderBy('timestamp', 'desc'), limit(200));
        } else {
            // Get logs from specific student
            logsRef = collection(db, 'students', selectedStudent, 'session_logs');
            q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logData = snapshot.docs.map(doc => ({
                id: doc.id,
                studentId: selectedStudent === 'ALL' ? doc.data().studentId : selectedStudent,
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

    // ========== HELPER FUNCTIONS ==========

    const calculateStats = (logData) => {
        const total = logData.length;
        let complete = 0;
        const missingFields = {};
        const uniqueStudents = new Set();

        REQUIRED_FIELDS.forEach(field => {
            missingFields[field] = 0;
        });

        logData.forEach(log => {
            if (log.studentId) uniqueStudents.add(log.studentId);
            
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
            avgLogsPerStudent: students.length > 0 ? (total / students.length).toFixed(1) : 0,
            missingFieldsFrequency: missingFields,
            uniqueStudentsInLogs: uniqueStudents.size
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

    const getDateRange = (date) => {
        const now = new Date();
        const logDate = new Date(date);
        const diffMs = now - logDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
            case 'today':
                return diffDays < 1;
            case 'week':
                return diffDays < 7;
            case 'month':
                return diffDays < 30;
            case 'all':
                return true;
            default:
                return true;
        }
    };

    const matchesFilters = (log) => {
        // Date filter
        if (!getDateRange(log.timestamp)) return false;

        // Status filter
        if (statusFilter === 'COMPLETE' && !isLogComplete(log)) return false;
        if (statusFilter === 'INCOMPLETE' && isLogComplete(log)) return false;

        // Speed filter
        if (speedFilter !== 'ALL' && log.speedRating !== speedFilter) return false;

        // Correctness filter
        if (correctnessFilter === 'CORRECT' && !log.isCorrect) return false;
        if (correctnessFilter === 'WRONG' && (log.isCorrect || log.isRecovered)) return false;
        if (correctnessFilter === 'RECOVERED' && !log.isRecovered) return false;

        // Search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const studentName = students.find(s => s.id === log.studentId)?.name.toLowerCase() || '';
            const questionMatch = log.questionId?.toLowerCase().includes(search);
            const answerMatch = log.studentAnswer?.toLowerCase().includes(search);
            const studentMatch = studentName.includes(search);

            if (!questionMatch && !answerMatch && !studentMatch) return false;
        }

        return true;
    };

    const getStudentName = (studentId) => {
        return students.find(s => s.id === studentId)?.name || 'Unknown Student';
    };

    const formatTime = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatValue = (value, field) => {
        if (value === undefined || value === null) return '❌ MISSING';
        if (value === '') return '⚠️ EMPTY';
        if (field === 'recoveryVelocity' || field === 'masteryBefore' || field === 'masteryAfter') {
            return typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value;
        }
        if (field === 'timeSpent') {
            return `${(value / 1000).toFixed(1)}s`;
        }
        if (typeof value === 'boolean') {
            return value ? '✓ TRUE' : '✗ FALSE';
        }
        return String(value).substring(0, 40);
    };

    const getStatusColor = (log) => {
        if (isLogComplete(log)) return 'bg-green-50 border-green-200';
        if (getMissingFields(log).length <= 2) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getStatusBadge = (log) => {
        if (isLogComplete(log)) {
            return <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ COMPLETE</span>;
        }
        const missing = getMissingFields(log).length;
        const badge = missing > 5 ? '❌ CRITICAL' : missing > 2 ? '⚠️ INCOMPLETE' : '⚠️ MINOR';
        return <span className={`inline-block px-3 py-1 ${missing > 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} text-xs font-bold rounded-full`}>{badge}</span>;
    };

    const getMasteryColor = (before, after) => {
        const change = after - before;
        if (change > 0.05) return 'text-green-700 font-bold';
        if (change < -0.05) return 'text-red-700';
        return 'text-slate-600';
    };

    // Filtered logs
    const filteredLogs = logs.filter(matchesFilters);

    // ========== RENDER ==========

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">📊 Analytics Dashboard</h1>
                        <p className="text-slate-600 font-medium">Real-time log monitoring & data quality analysis</p>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Sign Out 🚪
                    </button>
                </div>

                {/* Data Quality Indicator */}
                <div className={`rounded-lg p-4 font-bold text-lg ${
                    stats.completenessPercentage >= 95 ? 'bg-green-100 text-green-900' :
                    stats.completenessPercentage >= 80 ? 'bg-yellow-100 text-yellow-900' :
                    'bg-red-100 text-red-900'
                }`}>
                    📈 Data Quality: <span className="font-black">{stats.completenessPercentage}%</span>
                    <span className={`text-sm ml-2 ${
                        stats.completenessPercentage >= 95 ? 'text-green-700' :
                        stats.completenessPercentage >= 80 ? 'text-yellow-700' :
                        'text-red-700'
                    }`}>
                        ({stats.completeLogsCount} of {stats.totalLogs} logs complete)
                    </span>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Total Logs</p>
                        <p className="text-3xl font-black text-slate-900">{stats.totalLogs}</p>
                        <p className="text-xs text-slate-500 mt-2">session attempts</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200">
                        <p className="text-xs font-black text-green-700 uppercase tracking-wider mb-2">✓ Complete</p>
                        <p className="text-3xl font-black text-green-700">{stats.completeLogsCount}</p>
                        <p className="text-xs text-green-600 mt-2">{stats.completenessPercentage}% all 14 fields present</p>
                    </div>

                    <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
                        <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-2">❌ Incomplete</p>
                        <p className="text-3xl font-black text-red-700">{stats.incompleteLogsCount}</p>
                        <p className="text-xs text-red-600 mt-2">{100 - stats.completenessPercentage}% missing fields</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200">
                        <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2">📚 Students</p>
                        <p className="text-3xl font-black text-blue-700">{stats.studentCount}</p>
                        <p className="text-xs text-blue-600 mt-2">{stats.avgLogsPerStudent} avg logs each</p>
                    </div>
                </div>

                {/* Data Quality Alert */}
                {stats.completenessPercentage < 100 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm">
                        <h3 className="font-bold text-amber-900 mb-3 text-lg">⚠️ Data Quality Issues Detected</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                            {Object.entries(stats.missingFieldsFrequency)
                                .filter(([_, count]) => count > 0)
                                .sort(([_, a], [__, b]) => b - a)
                                .slice(0, 5)
                                .map(([field, count]) => (
                                    <div key={field} className="bg-white p-3 rounded border border-amber-200">
                                        <p className="font-bold text-amber-900 text-xs uppercase">{field}</p>
                                        <p className="text-amber-700 font-black mt-1">{count} logs</p>
                                        <p className="text-amber-600 text-xs mt-1">missing this field</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Student Selector */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">📚 Select Student</h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedStudent('ALL')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                selectedStudent === 'ALL'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            👥 All Students ({students.length})
                        </button>
                        {students.slice(0, 8).map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student.id)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                                    selectedStudent === student.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title={student.name}
                            >
                                {student.name.split(' ')[0]} L{student.heroLevel}
                            </button>
                        ))}
                        {students.length > 8 && (
                            <div className="text-xs text-slate-500 py-2">+{students.length - 8} more...</div>
                        )}
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">🔍 Filters & Search</h2>

                    {/* Search Box */}
                    <div>
                        <input
                            type="text"
                            placeholder="🔎 Search by student name, question ID, or answer text..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Date Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase block mb-2">📅 Date Range</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                            >
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase block mb-2">📊 Completeness</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                            >
                                <option value="ALL">All</option>
                                <option value="COMPLETE">Complete Only</option>
                                <option value="INCOMPLETE">Incomplete Only</option>
                            </select>
                        </div>

                        {/* Speed Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase block mb-2">⚡ Speed</label>
                            <select
                                value={speedFilter}
                                onChange={(e) => setSpeedFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                            >
                                <option value="ALL">All Speeds</option>
                                <option value="SPRINT">Sprint (&lt;2s)</option>
                                <option value="STEADY">Steady (2-15s)</option>
                                <option value="DEEP">Deep (&gt;15s)</option>
                            </select>
                        </div>

                        {/* Correctness Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase block mb-2">✓ Correctness</label>
                            <select
                                value={correctnessFilter}
                                onChange={(e) => setCorrectnessFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                            >
                                <option value="ALL">All</option>
                                <option value="CORRECT">Correct Only</option>
                                <option value="WRONG">Wrong Only</option>
                                <option value="RECOVERED">Recovered</option>
                            </select>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">Showing <span className="font-bold text-slate-700">{filteredLogs.length}</span> logs matching filters</p>
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                            📋 Recent Logs ({filteredLogs.length} results)
>>>>>>> 6e52585da20dad3a8217d0bb7afce3184debc1d4
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">
<<<<<<< HEAD
                            <div className="text-5xl animate-bounce mb-4">🔄</div>
                            <p className="text-slate-600 font-medium">Loading logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center bg-yellow-50">
                            <div className="text-5xl mb-4">⚠️</div>
                            <p className="text-yellow-800 font-bold text-lg">No logs found!</p>
                            <p className="text-yellow-700 text-sm mt-4 max-w-md mx-auto">
                                This could mean:
                            </p>
                            <ul className="text-yellow-700 text-sm mt-4 text-left max-w-md mx-auto space-y-2">
                                <li>• No student has completed a mission yet</li>
                                <li>• Logs are being saved to wrong collection path</li>
                                <li>• Firestore security rules are blocking reads</li>
                                <li>• Check browser console for errors (F12)</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Student</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Question ID</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Is Correct</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Fields</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                {students.find(s => s.id === log.studentId)?.name || log.studentId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {log.questionId || '❌ MISSING'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {log.isCorrect === true ? (
                                                    <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-bold">✓ Correct</span>
                                                ) : log.isCorrect === false ? (
                                                    <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-bold">✗ Wrong</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-bold">? Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-mono">
                                                {log.timestamp ? log.timestamp.toLocaleString() : '❌ MISSING'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-bold">
                                                {Object.keys(log).length}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => {
                                                        console.log('Full log data:', log);
                                                        alert(`Log printed to console. Check F12 → Console tab`);
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-bold text-xs"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
=======
                            <div className="text-5xl animate-bounce mb-4">🌊</div>
                            <p className="text-slate-600 font-medium">Loading analytics logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="text-5xl mb-4">📭</div>
                            <p className="text-slate-600 font-medium">No logs found</p>
                            <p className="text-slate-500 text-sm mt-2">Try adjusting filters or selecting a different student</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredLogs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className={`${getStatusColor(log)} p-6 border-l-4 ${
                                        isLogComplete(log) ? 'border-green-400' :
                                        getMissingFields(log).length <= 2 ? 'border-yellow-400' :
                                        'border-red-400'
                                    } hover:bg-opacity-75 transition-colors`}
                                >
                                    {/* Log Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                                {getStudentName(log.studentId)} • Q: {log.questionId || 'N/A'}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-1 font-mono">{formatTime(log.timestamp)}</p>
                                        </div>

                                        <div className="text-right space-y-2">
                                            {getStatusBadge(log)}
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    log.isCorrect ? 'bg-green-200 text-green-800' :
                                                    log.isRecovered ? 'bg-blue-200 text-blue-800' :
                                                    'bg-red-200 text-red-800'
                                                }`}>
                                                    {log.isCorrect ? '✓ Correct' : log.isRecovered ? '🔄 Recovered' : '✗ Wrong'}
                                                </span>
                                                {log.speedRating && (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        log.speedRating === 'SPRINT' ? 'bg-blue-200 text-blue-800' :
                                                        log.speedRating === 'DEEP' ? 'bg-purple-200 text-purple-800' :
                                                        'bg-gray-200 text-gray-800'
                                                    }`}>
                                                        {log.speedRating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick View - Most Important Fields */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                                        <div className="bg-white bg-opacity-70 p-3 rounded border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase">Time Spent</p>
                                            <p className="font-mono font-bold text-slate-800">{formatValue(log.timeSpent, 'timeSpent')}</p>
                                        </div>
                                        <div className="bg-white bg-opacity-70 p-3 rounded border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase">Mastery Δ</p>
                                            <p className={`font-mono font-bold ${getMasteryColor(log.masteryBefore, log.masteryAfter)}`}>
                                                {log.masteryBefore ? formatValue(log.masteryBefore, 'masteryBefore') : '?'} →
                                                {log.masteryAfter ? ' ' + formatValue(log.masteryAfter, 'masteryAfter') : ' ?'}
                                            </p>
                                        </div>
                                        <div className="bg-white bg-opacity-70 p-3 rounded border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase">Atom ID</p>
                                            <p className="font-mono font-bold text-slate-800">{log.atomId || '?'}</p>
                                        </div>
                                        <div className="bg-white bg-opacity-70 p-3 rounded border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase">Diagnostic</p>
                                            <p className="font-mono font-bold text-slate-800 truncate">{log.diagnosticTag || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Missing Fields Alert */}
                                    {!isLogComplete(log) && (
                                        <div className="bg-red-100 border border-red-300 p-3 rounded text-sm mb-4">
                                            <p className="font-bold text-red-800">⚠️ Missing {getMissingFields(log).length} field(s):</p>
                                            <p className="text-red-700 text-xs font-mono mt-1">
                                                {getMissingFields(log).join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Expand Button */}
                                    <button
                                        onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                                        className="text-blue-600 hover:text-blue-700 font-bold text-sm mt-3 flex items-center gap-1"
                                    >
                                        {selectedLogId === log.id ? '▼' : '▶'} {selectedLogId === log.id ? 'Hide' : 'View'} All Fields
                                    </button>

                                    {/* Expanded Details */}
                                    {selectedLogId === log.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-300">
                                            <h4 className="font-bold text-slate-700 mb-3">📋 Field Inspector</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {REQUIRED_FIELDS.map(field => {
                                                    const value = log[field];
                                                    const isMissing = value === undefined || value === null || value === '';
                                                    return (
                                                        <div
                                                            key={field}
                                                            className={`p-3 rounded border-l-4 ${
                                                                isMissing
                                                                    ? 'bg-red-50 border-red-400'
                                                                    : 'bg-green-50 border-green-400'
                                                            }`}
                                                        >
                                                            <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-1">
                                                                {field}
                                                            </p>
                                                            <p className={`text-sm font-mono break-words ${
                                                                isMissing ? 'text-red-700 font-bold' : 'text-green-700'
                                                            }`}>
                                                                {formatValue(value, field)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
>>>>>>> 6e52585da20dad3a8217d0bb7afce3184debc1d4
                        </div>
                    )}
                </div>

<<<<<<< HEAD
                {/* TROUBLESHOOTING GUIDE */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                    <h3 className="text-lg font-black text-blue-900 mb-4">🛠️ Troubleshooting Checklist</h3>
                    <div className="space-y-3 text-sm text-blue-800">
                        <div className="flex gap-3">
                            <input type="checkbox" id="check1" className="mt-1" />
                            <label htmlFor="check1"><strong>Step 1:</strong> Open browser console (F12 or Cmd+Option+I)</label>
                        </div>
                        <div className="flex gap-3">
                            <input type="checkbox" id="check2" className="mt-1" />
                            <label htmlFor="check2"><strong>Step 2:</strong> You should see logs starting with 📍 (blue dot emoji)</label>
                        </div>
                        <div className="flex gap-3">
                            <input type="checkbox" id="check3" className="mt-1" />
                            <label htmlFor="check3"><strong>Step 3:</strong> If you see ❌ errors, note them down</label>
                        </div>
                        <div className="flex gap-3">
                            <input type="checkbox" id="check4" className="mt-1" />
                            <label htmlFor="check4"><strong>Step 4:</strong> Check above if students are found ✅</label>
                        </div>
                        <div className="flex gap-3">
                            <input type="checkbox" id="check5" className="mt-1" />
                            <label htmlFor="check5"><strong>Step 5:</strong> If no logs, have a student complete a mission</label>
                        </div>
                    </div>
                </div>

                {/* COMMON ISSUES */}
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                    <h3 className="text-lg font-black text-red-900 mb-4">⚠️ If You See These Errors:</h3>
                    <div className="space-y-4 text-sm text-red-800">
                        <div>
                            <p className="font-bold">Error: "permission-denied"</p>
                            <p className="text-red-700 mt-1">→ Check Firestore security rules. Admin must have read access to students and session_logs</p>
                        </div>
                        <div>
                            <p className="font-bold">Error: "not-found"</p>
                            <p className="text-red-700 mt-1">→ The collection doesn't exist. Have a student complete a mission first</p>
                        </div>
                        <div>
                            <p className="font-bold">No data but no errors</p>
                            <p className="text-red-700 mt-1">→ Logs might be saved to wrong path. Check your logging code (useDailyMission.js)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600">
                    <p>🔍 Check browser console (F12) for detailed logs to understand what's happening</p>
=======
                {/* Schema Reference Card */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-3 text-lg">📚 Required Analytics Fields</h3>
                    <p className="text-blue-800 text-sm mb-4">These 13 fields must be present and valid in every log for complete analytics:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {REQUIRED_FIELDS.map(field => (
                            <div key={field} className="bg-white p-3 rounded border border-blue-200 flex items-start gap-2">
                                <span className="text-blue-600 font-black mt-0.5 flex-shrink-0">✓</span>
                                <div>
                                    <p className="font-bold text-blue-900">{field}</p>
                                    <p className="text-blue-700 text-xs mt-0.5 leading-tight">
                                        {
                                            field === 'questionId' ? 'Unique question identifier' :
                                            field === 'studentAnswer' ? 'Student\'s response' :
                                            field === 'correctAnswer' ? 'Ground truth answer' :
                                            field === 'isCorrect' ? 'Answer correctness' :
                                            field === 'timeSpent' ? 'Time in milliseconds' :
                                            field === 'speedRating' ? 'SPRINT/STEADY/DEEP' :
                                            field === 'masteryBefore' ? 'Confidence before (0-1)' :
                                            field === 'masteryAfter' ? 'Confidence after (0-1)' :
                                            field === 'diagnosticTag' ? 'Misconception type' :
                                            field === 'isRecovered' ? 'Recovery attempt' :
                                            field === 'recoveryVelocity' ? 'Speed improvement' :
                                            field === 'atomId' ? 'Curriculum unit' :
                                            field === 'timestamp' ? 'When recorded' :
                                            'Field description'
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600">
                    <p>Dashboard updates in real-time. Last refreshed: <span className="font-mono font-bold">{new Date().toLocaleTimeString()}</span></p>
>>>>>>> 6e52585da20dad3a8217d0bb7afce3184debc1d4
                </div>
            </div>
        </div>
    );
}

export default AdminAnalyticsDashboard;
