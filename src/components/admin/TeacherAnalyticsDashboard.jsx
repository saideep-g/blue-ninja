import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function TeacherAnalyticsDashboard() {
    const [students, setStudents] = useState([]);
    const [classStats, setClassStats] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classId, setClassId] = useState(null);

    useEffect(() => {
        fetchTeacherClass();
    }, []);

    const fetchTeacherClass = async () => {
        try {
            const teacherId = auth.currentUser?.uid;

            // Get teacher's class
            const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
            if (teacherDoc.exists()) {
                setClassId(teacherDoc.data().classId);

                // Get all students in class
                const q = query(
                    collection(db, 'users'),
                    where('classId', '==', teacherDoc.data().classId),
                    where('role', '==', 'STUDENT')
                );

                const snapshot = await getDocs(q);
                const studentData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setStudents(studentData);

                // Calculate class-wide statistics
                const stats = calculateClassStats(studentData);
                setClassStats(stats);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching class data:', error);
            setLoading(false);
        }
    };

    const calculateClassStats = (studentList) => {
        const totalStudents = studentList.length;
        if (totalStudents === 0) return null; // Handle empty class case

        const avgAccuracy = Math.round(
            studentList.reduce((sum, s) => sum + (s.overallAccuracy || 0), 0) / totalStudents
        );

        // Top hurdles across class
        const allHurdles = {};
        studentList.forEach(student => {
            (student.topHurdles || []).forEach(hurdle => {
                allHurdles[hurdle.name] = (allHurdles[hurdle.name] || 0) + 1;
            });
        });

        const topHurdles = Object.entries(allHurdles)
            .sort((a, b) => b[1] - a[1]) // Corrected sorting logic to use values
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalStudents) * 100)
            }));

        return {
            totalStudents,
            avgAccuracy,
            topHurdles,
            activeToday: studentList.filter(s => s.lastActiveDate === new Date().toDateString()).length
        };
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-indigo-900 mb-2">Teacher Analytics</h1>
                <p className="text-indigo-600 font-medium">Class Performance & Student Insights</p>
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Class Overview Cards */}
                {classStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-2">Total Students</p>
                            <p className="text-4xl font-black text-indigo-900">{classStats.totalStudents}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Class Avg Accuracy</p>
                            <p className="text-4xl font-black text-blue-600">{classStats.avgAccuracy}%</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-wider mb-2">Active Today</p>
                            <p className="text-4xl font-black text-green-600">{classStats.activeToday}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-2">Avg Level</p>
                            <p className="text-4xl font-black text-purple-600">
                                {students.length > 0
                                    ? Math.round(students.reduce((sum, s) => sum + (s.heroLevel || 1), 0) / students.length)
                                    : 1
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Top Hurdles Across Class */}
                {classStats && classStats.topHurdles.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                        <h2 className="text-2xl font-black text-indigo-900 mb-6">🚧 Class-Wide Top Challenges</h2>
                        <div className="space-y-4">
                            {classStats.topHurdles.map((hurdle, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-900">{hurdle.name}</span>
                                        <span className="text-[10px] font-black text-gray-600">{hurdle.percentage}% of class</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all"
                                            style={{ width: `${hurdle.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Student List with Performance */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-2xl font-black text-indigo-900 mb-6">Student Performance</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-gray-600 uppercase">Student</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-gray-600 uppercase">Level</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-gray-600 uppercase">Accuracy</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-gray-600 uppercase">This Week</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors"
                                    >
                                        <td className="py-3 px-4 font-bold text-gray-900">{student.name}</td>
                                        <td className="py-3 px-4"><span className="font-bold text-indigo-600">L{student.heroLevel || 1}</span></td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500"
                                                        style={{ width: `${student.overallAccuracy || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold">{student.overallAccuracy || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900">{student.thisWeekMissions || 0} missions</td>
                                        <td className="py-3 px-4">
                                            {student.overallAccuracy >= 80 ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full">✓ On Track</span>
                                            ) : student.overallAccuracy >= 60 ? (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full">⚠ Needs Help</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">🚨 Struggling</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Student Detail Panel */}
                {selectedStudent && (
                    <div className="fixed right-0 top-0 w-full md:w-96 h-screen bg-white shadow-2xl overflow-y-auto p-6 z-50">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="text-2xl text-gray-400 hover:text-gray-600 mb-4"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-black text-indigo-900 mb-4">{selectedStudent.name}</h3>

                        <div className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Top Challenge</p>
                                {/* Fixed double optional chaining ?.?. and added array index access */}
                                <p className="font-bold text-gray-900">{selectedStudent.topHurdles?.[0]?.name || 'None'}</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-green-600 uppercase mb-2">Strength</p>
                                {/* Fixed double optional chaining ?.?. and added array index access */}
                                <p className="font-bold text-gray-900">{selectedStudent.strengths?.[0]?.name || 'All-rounder'}</p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Recommended Action</p>
                                <p className="text-sm text-gray-900">
                                    {selectedStudent.overallAccuracy < 60
                                        ? 'Schedule 1-on-1 help session'
                                        : 'Continue current pace and offer advanced challenges'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}