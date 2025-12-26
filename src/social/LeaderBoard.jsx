import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            // Get top 10 students by flow points
            const q = query(
                collection(db, 'users'),
                where('role', '==', 'STUDENT'),
                orderBy('powerPoints', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data()
            }));

            setLeaderboard(data);

            // Find current user's rank
            const currentUserId = auth.currentUser?.uid;
            const userRankIndex = data.findIndex(u => u.id === currentUserId);
            if (userRankIndex !== -1) {
                setUserRank(userRankIndex + 1);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading leaderboard...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-black text-purple-900 mb-6">🏆 Top Ninjas This Week</h2>

            <div className="space-y-3">
                {leaderboard.map((student, i) => (
                    <div
                        key={student.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${student.id === auth.currentUser?.uid
                                ? 'bg-purple-50 border-purple-500 shadow-md'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-black w-8 text-center">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{student.name}</p>
                                <p className="text-[10px] text-gray-600">Level {student.heroLevel || 1}</p>
                            </div>
                        </div>
                        <p className="font-black text-lg text-purple-600">{student.powerPoints || 0} ⚡</p>
                    </div>
                ))}
            </div>

            {userRank && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border-2 border-purple-200 text-center">
                    <p className="text-sm font-bold text-gray-900">Your Rank: <span className="text-2xl text-purple-600">#{userRank}</span></p>
                </div>
            )}
        </div>
    );
}
