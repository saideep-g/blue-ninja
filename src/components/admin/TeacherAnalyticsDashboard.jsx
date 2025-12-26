import React, { useState, useEffect } from 'react';
import { generateTeacherInsights } from '../../services/insightGenerator';
import { useNinja } from '../../context/NinjaContext';

export default function TeacherAnalyticsDashboard() {
    const { sessionHistory } = useNinja();
    const [insights, setInsights] = useState(null);

    useEffect(() => {
        if (sessionHistory && sessionHistory.length > 0) {
            const teacherInsights = generateTeacherInsights(
                sessionHistory,
                sessionHistory // In real app, this would be class-wide logs
            );
            setInsights(teacherInsights);
        }
    }, [sessionHistory]);

    if (!insights) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-blue-800 font-bold">Loading class analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <h1 className="text-4xl font-black text-blue-800 uppercase tracking-tighter">
                Teacher Analytics Dashboard
            </h1>

            {/* Top Hurdles */}
            <div className="ninja-card">
                <h2 className="text-2xl font-black text-blue-800 mb-6 uppercase">
                    📌 Class-Wide Top Hurdles
                </h2>
                <div className="space-y-3">
                    {insights.classAnalysis.topHurdles.map((hurdle, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-600">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-blue-900">{hurdle.tag}</span>
                                <span className="text-2xl font-black text-red-600">{hurdle.count}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Seen in {hurdle.count} mistakes across class
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommended Focus */}
            <div className="ninja-card bg-yellow-50 border-2 border-yellow-300">
                <h2 className="text-2xl font-black text-yellow-800 mb-4 uppercase">
                    ⭐ Recommended Class Focus
                </h2>
                <p className="text-lg text-yellow-900">
                    {insights.classAnalysis.recommendedFocus}
                </p>
                <p className="text-sm text-yellow-700 mt-3">
                    Focus your instruction here this week to have maximum impact.
                </p>
            </div>

            {/* Individual Student Insights */}
            <div className="ninja-card">
                <h2 className="text-2xl font-black text-blue-800 mb-6 uppercase">
                    👤 Student Insights
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-bold text-blue-900 mb-2">
                        Success Rate: {insights.studentInsights.performanceMetrics.successRate}
                    </p>
                    <p className="text-sm text-blue-700">
                        Top Hurdle: {insights.studentInsights.hurdles?.name || 'None identified'}
                    </p>
                </div>
            </div>
        </div>
    );
}
