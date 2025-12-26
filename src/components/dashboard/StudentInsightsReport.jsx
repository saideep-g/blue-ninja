import React from 'react';
import { generateStudentInsights } from '../../services/insightGenerator';

/**
 * STUDENT INSIGHTS REPORT
 * Beautiful display of actionable insights for the student
 * Shows performance, hurdles, and next steps
 */
export default function StudentInsightsReport({ logs, sessionHistory }) {
    const insights = generateStudentInsights(logs || sessionHistory || []);

    if (insights.status === 'NO_DATA') {
        return (
            <div className="ninja-card bg-blue-50 text-center py-12">
                <div className="text-4xl mb-4">🌊</div>
                <p className="text-blue-800 font-bold">{insights.message}</p>
            </div>
        );
    }

    const {
        performanceMetrics,
        hurdles,
        patterns,
        semanticScore,
        recommendations,
        nextActions,
    } = insights;


    // Add at top:
    if (!logs || logs.length === 0) {
        return (
            <div className="ninja-card">
                <h2 className="text-2xl font-black text-blue-800 mb-4">📊 Your Insights</h2>
                <div className="text-center py-10">
                    <div className="text-4xl mb-3">📈</div>
                    <p className="text-blue-600 font-bold">Complete more missions to see your insights</p>
                    <p className="text-xs text-gray-500 mt-2">Insights appear after 5+ questions</p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="ninja-card bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                            📊 Your Insights
                        </h2>
                        <p className="text-blue-100">Personalized analysis based on your practice</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black">{semanticScore}</div>
                        <div className="text-[10px] uppercase font-black text-blue-100">
                            Data Quality
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="ninja-card">
                <h3 className="text-lg font-black text-blue-800 mb-4 uppercase tracking-tight">
                    📈 Performance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <span className="block text-[10px] font-black text-blue-400 uppercase mb-2">
                            Success Rate
                        </span>
                        <span className="text-2xl font-black text-blue-800">
                            {performanceMetrics.successRate}
                        </span>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                        <span className="block text-[10px] font-black text-yellow-600 uppercase mb-2">
                            Confidence
                        </span>
                        <span className="text-2xl font-black text-yellow-800">
                            {performanceMetrics.averageConfidence}
                        </span>
                        <span className="text-[10px] text-yellow-600">
                            {performanceMetrics.confidenceTrend}
                        </span>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <span className="block text-[10px] font-black text-purple-600 uppercase mb-2">
                            Avg Response
                        </span>
                        <span className="text-2xl font-black text-purple-800">
                            {performanceMetrics.averageResponseTime}
                        </span>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <span className="block text-[10px] font-black text-green-600 uppercase mb-2">
                            Trend
                        </span>
                        <span className="text-lg font-black text-green-800">
                            {performanceMetrics.trend}
                        </span>
                    </div>
                </div>
                <p className="text-blue-700 font-semibold mt-4 text-sm">
                    {performanceMetrics.trendDescription}
                </p>
            </div>

            {/* Critical Hurdles */}
            {hurdles && hurdles.length > 0 && (
                <div className="ninja-card border-2 border-red-200 bg-red-50">
                    <h3 className="text-lg font-black text-red-800 mb-4 uppercase tracking-tight">
                        🚧 Critical Hurdles ({hurdles.length})
                    </h3>
                    <div className="space-y-4">
                        {hurdles.slice(0, 3).map((hurdle, idx) => (
                            <div
                                key={hurdle.tag}
                                className={`p-4 rounded-xl border-l-4 ${hurdle.severity === 'CRITICAL'
                                    ? 'border-l-red-600 bg-white'
                                    : hurdle.severity === 'HIGH'
                                        ? 'border-l-orange-600 bg-white'
                                        : 'border-l-yellow-600 bg-white'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-black text-blue-900 text-sm uppercase">
                                            {idx + 1}. {hurdle.name}
                                        </h4>
                                        <p className="text-[12px] text-gray-600 mt-1">{hurdle.description}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-[10px] font-black uppercase whitespace-nowrap ${hurdle.severity === 'CRITICAL'
                                            ? 'bg-red-600 text-white'
                                            : hurdle.severity === 'HIGH'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-yellow-600 text-white'
                                            }`}
                                    >
                                        {hurdle.severity}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[12px] my-2">
                                    <div>
                                        <span className="font-black text-gray-600">Mistakes:</span>{' '}
                                        <span className="text-red-600">{hurdle.count}</span>
                                    </div>
                                    <div>
                                        <span className="font-black text-gray-600">Recovery:</span>{' '}
                                        <span className="text-blue-600">{hurdle.recoveryVelocity}%</span>
                                    </div>
                                </div>
                                <div className="bg-blue-100 p-2 rounded text-[12px] text-blue-900 font-semibold">
                                    💡 {hurdle.recovery[0]}
                                </div>
                            </div>
                        ))}
                    </div>
                    {hurdles.length > 3 && (
                        <p className="text-[12px] text-red-700 font-semibold mt-4">
                            +{hurdles.length - 3} more hurdles below
                        </p>
                    )}
                </div>
            )}

            {/* Personalized Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <div className="ninja-card">
                    <h3 className="text-lg font-black text-blue-800 mb-4 uppercase tracking-tight">
                        💡 Personalized Recommendations
                    </h3>
                    <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <div className="font-black text-blue-900 text-sm mb-1">
                                            {rec.message}
                                        </div>
                                        <p className="text-[12px] text-blue-700 mb-2">{rec.action}</p>
                                        <div className="flex items-center gap-4 text-[11px]">
                                            <span className="font-semibold text-blue-600">
                                                ⏱️ {rec.timeEstimate}
                                            </span>
                                            <span className={`font-black px-2 py-1 rounded ${rec.urgency === 'HIGH'
                                                ? 'bg-red-600 text-white'
                                                : rec.urgency === 'MEDIUM'
                                                    ? 'bg-yellow-600 text-white'
                                                    : 'bg-gray-600 text-white'
                                                }`}>
                                                {rec.urgency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Actions - Step by Step */}
            <div className="ninja-card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <h3 className="text-lg font-black text-green-800 mb-4 uppercase tracking-tight">
                    ✅ Your Step-by-Step Path Forward
                </h3>
                <div className="space-y-3">
                    {nextActions.map((action, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-sm">
                                {action.step === 'TOTAL' ? '✓' : action.step}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-green-900">{action.action}</p>
                                <div className="flex items-center gap-4 text-[12px] text-green-700 mt-1">
                                    <span>⏱️ {action.time}</span>
                                    <span className="text-[11px]">{action.reason}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Quality Notice */}
            {semanticScore < 80 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-l-yellow-600 rounded-lg">
                    <p className="text-[12px] font-bold text-yellow-900">
                        ⚠️ Note: Some of your answers had unclear data. Try being more careful to
                        select your answer choice clearly.
                    </p>
                </div>
            )}
        </div>
    );
}