import React, { useEffect, useState, useMemo } from 'react';

/**
 * MissionCard: Step 8 Implementation
 * Now handles engagement framing for incorrect answers.
 */
function MissionCard({ question, onAnswer, onStartRecovery }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState(null);

    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }, [question, showFeedback]);

    const shuffledOptions = useMemo(() => {
        if (!question) return [];
        const options = [
            question.correct_answer,
            ...question.distractors.map(d => d.option)
        ];
        return options.sort(() => Math.random() - 0.5);
    }, [question]);

    const handleCheck = () => {
        const isCorrect = selectedOption === question.correct_answer;

        if (isCorrect) {
            onAnswer(true, selectedOption);
            setSelectedOption(null);
        } else {
            // Find the specific distractor feedback for engagement framing
            const distractor = question.distractors.find(d => d.option === selectedOption);
            setFeedbackData(distractor);
            setShowFeedback(true);

            // Step 10: Signal the hook that the student is now in the "Recovery Branch"
            if (onStartRecovery) onStartRecovery();
        }
    };

    if (!question) return null;

    return (
        <div className="ninja-card animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-blue-50 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    {question.module} • {question.atom}
                </span>
            </div>

            <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                    {question.text}
                </h2>
            </div>

            {!showFeedback ? (
                <>
                    <div className="grid grid-cols-1 gap-3">
                        {shuffledOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedOption(option)}
                                className={`p-5 rounded-2xl text-left font-bold transition-all border-2 ${selectedOption === option
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                    : 'bg-white border-blue-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={!selectedOption}
                        onClick={handleCheck}
                        className={`w-full mt-8 py-5 rounded-2xl font-black text-lg transition-all ${selectedOption ? 'bg-[var(--color-accent)] text-blue-900 shadow-xl' : 'bg-slate-100 text-slate-400'
                            }`}
                    >
                        Check Answer ➤
                    </button>
                </>
            ) : (
                /* Step 8: Engagement Framing UI */
                <div className="space-y-6 animate-in zoom-in duration-300">
                    <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-3xl">
                        <h3 className="text-xl font-black text-yellow-700 uppercase italic mb-2">
                            Ninja Insight! 💡
                        </h3>
                        <p className="text-lg text-yellow-900 font-medium">
                            {feedbackData?.engagement_framing || "You're getting warmer! Let's try to look at this differently."}
                        </p>
                    </div>

                    {/* Step 9 Preview: Follow-up question */}
                    {feedbackData?.follow_up && (
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                            <p className="font-bold text-blue-800 mb-4">{feedbackData.follow_up.text}</p>
                            <div className="grid grid-cols-1 gap-2">
                                {feedbackData.follow_up.options?.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const recoveryCorrect = opt === feedbackData.follow_up.correct;
                                            onAnswer(false, selectedOption, recoveryCorrect); // Pass recovery status to engine
                                            setShowFeedback(false);
                                            setFeedbackData(null);
                                            setSelectedOption(null);
                                        }}
                                        className="p-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-700 hover:bg-blue-100 transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MissionCard;