import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
// Added getDoc and doc to the imports as they are used in fetchStudentStats logic
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

export default function ParentDashboard() {
    const [linkedStudents, setLinkedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentStats, setStudentStats] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLinkedStudents();
    }, []);

    const fetchLinkedStudents = async () => {
        try {
            const parentId = auth.currentUser?.uid;
            const q = query(
                collection(db, 'parentStudent'),
                where('parentId', '==', parentId)
            );
            const snapshot = await getDocs(q);
            const students = snapshot.docs.map(doc => doc.data());
            setLinkedStudents(students);

            /**
             * BUG FIX: Initial Student Selection
             * Previously, the code passed the entire 'students' array into setSelectedStudent 
             * and tried to access '.studentId' on the array itself.
             * Now we correctly target the first student in the list for initial hydration.
             */
            if (students.length > 0) {
                const firstStudent = students[0];
                setSelectedStudent(firstStudent);
                await fetchStudentStats(firstStudent.studentId);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            setLoading(false);
        }
    };

    const fetchStudentStats = async (studentId) => {
        try {
            // Logic: Retrieves the full student profile from the 'users' collection 
            // to display specific stats like accuracy, hero level, and hurdles.
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists()) {
                setStudentStats(userDoc.data());
            }
        } catch (error) {
            console.error('Error fetching student stats:', error);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-purple-900 mb-2">Parent Dashboard</h1>
                <p className="text-purple-600 font-medium">Monitor your child's learning progress</p>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Students List Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="font-black text-purple-900 mb-4">Your Students</h2>

                        {linkedStudents.map(student => (
                            <button
                                key={student.studentId}
                                onClick={() => {
                                    setSelectedStudent(student);
                                    fetchStudentStats(student.studentId);
                                }}
                                className={`w-full text-left p-4 rounded-xl mb-3 transition-all ${selectedStudent?.studentId === student.studentId
                                    ? 'bg-purple-100 border-2 border-purple-500'
                                    : 'bg-gray-50 border-2 border-gray-200 hover:border-purple-200'
                                    }`}
                            >
                                <p className="font-bold text-gray-900">{student.studentName}</p>
                                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Grade {student.grade}</p>
                            </button>
                        ))}

                        <button
                            onClick={() => setInviteCode(Math.random().toString(36).substr(2, 9).toUpperCase())}
                            className="w-full mt-4 p-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600"
                        >
                            + Add Student
                        </button>
                    </div>
                </div>

                {/* Main Stats Panel */}
                {selectedStudent && studentStats && (
                    <div className="lg:col-span-3 space-y-6">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-2">This Week</p>
                                <p className="text-4xl font-black text-purple-900">{studentStats.thisWeekMissions || 0}</p>
                                <p className="text-sm text-gray-600 mt-2">Missions Completed</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-wider mb-2">Accuracy</p>
                                <p className="text-4xl font-black text-pink-600">{studentStats.overallAccuracy || 0}%</p>
                                <p className="text-sm text-gray-600 mt-2">Overall Performance</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Growth</p>
                                <p className="text-4xl font-black text-blue-600">📈</p>
                                <p className="text-sm text-gray-600 mt-2">Level {studentStats.heroLevel || 1}</p>
                            </div>
                        </div>

                        {/* Challenges & Strengths */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="font-black text-purple-900 mb-4">Top Challenges</h3>
                                <div className="space-y-3">
                                    {(studentStats.topHurdles || []).map((hurdle, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                                            <span className="font-bold text-gray-900">{hurdle.name}</span>
                                            <span className="text-[10px] font-black text-red-600">{hurdle.count} errors</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="font-black text-purple-900 mb-4">Strengths</h3>
                                <div className="space-y-3">
                                    {(studentStats.strengths || []).map((strength, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                            <span className="font-bold text-gray-900">{strength.name}</span>
                                            <span className="text-[10px] font-black text-green-600">⭐ Mastered</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Items for Parent */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-md p-6 text-white">
                            <h3 className="font-black text-lg mb-3">💡 Recommendations for You</h3>
                            <ul className="space-y-2 text-sm">
                                <li>✓ Encourage 10-15 min daily practice (set a reminder)</li>
                                /**
                                * SYNTAX FIX: Double Optional Chaining Error
                                * Error was: ?.?. which is invalid syntax.
                                * Logic: Since topHurdles is an array, we access the first element [0]
                                * and then safely access '.name' using standard optional chaining.
                                */
                                <li>✓ Help with "{studentStats.topHurdles?.[0]?.name || 'math'}" - offer real-world examples</li>
                                <li>✓ Celebrate wins! Your child is improving 📚</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}