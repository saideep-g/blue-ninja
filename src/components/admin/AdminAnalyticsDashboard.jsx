import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';

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
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="text-5xl animate-bounce mb-4">🔄</div>
                            <p className="text-slate-600 font-medium">Loading logs...</p>
                        </div >
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
                        </div>
                    )
                    }
                </div >

                {/* TROUBLESHOOTING GUIDE */}
                < div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6" >
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
                </div >

                {/* COMMON ISSUES */}
                < div className="bg-red-50 border-2 border-red-300 rounded-xl p-6" >
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
                </div >

                <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600">
                    <p>🔍 Check browser console (F12) for detailed logs to understand what's happening</p>
                </div>
            </div>
        </div >
    );
}

export default AdminAnalyticsDashboard;
