import React, { useEffect, useState, useMemo } from 'react';

/**
 * MissionCard: Step 12 & 13 Final Implementation
 * Fully handles LaTeX rendering, engagement framing, and hurdle tracking.
 * Detailed comments explain the logic flow for VS Code diffing.
 */
function MissionCard({ question, onAnswer, onStartRecovery }) {
    // Local state to track the ninja's current selection before submission
    const [selectedOption, setSelectedOption] = useState(null);
    // Controls the visibility of the "Ninja Insight" feedback layer
    const [showFeedback, setShowFeedback] = useState(false);
    // Stores the specific distractor data for the selected wrong answer
    const [feedbackData, setFeedbackData] = useState(null);

    /**
     * Effect to trigger MathJax typeset whenever the content changes.
     * This ensures formulas like $a^m \times a^n$ render correctly after every mission update.
     */
    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }, [question, showFeedback]);

    /**
     * Memoized shuffle to ensure options appear in a different order every time.
     * Prevents pattern memorization based on option position.
     */
    const shuffledOptions = useMemo(() => {
        if (!question) return [];
        const options = [
            question.correct_answer,
            ...question.distractors.map(d => d.option)
        ];
        return options.sort(() => Math.random() - 0.5);
    }, [question]);

    /**
     * Logic to check the primary answer.
     * If correct: Proceeds immediately to next mission.
     * If wrong: Displays "Ninja Insight" and triggers the recovery timer.
     */
    const handleCheck = () => {
        const isCorrect = selectedOption === question.correct_answer;

        if (isCorrect) {
            // Pass null for tag as it's a correct answer
            onAnswer(true, selectedOption, false, null);
            setSelectedOption(null);
        } else {
            // Step 12: Extract the diagnostic_tag to track misconceptions (Hurdles)
            const distractor = question.distractors.find(d => d.option === selectedOption);
            setFeedbackData(distractor);
            setShowFeedback(true);

            // Step 10: Signal the high-precision recovery timer to start
            if (onStartRecovery) onStartRecovery();
        }
    };

    if (!question) return null;

    return (
        <div className="ninja-card animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Module & Atom Badge */}
            <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-blue-50 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    {question.module} • {question.atom}
                </span>
            </div>

            {/* Main Question Text */}
            <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                    {question.text}
                </h2>
            </div>

            {!showFeedback ? (
                <>
                    {/* Answer Selection Grid */}
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
                        className={`w-full mt-8 py-5 rounded-2xl font-black text-lg transition-all ${selectedOption
                            ? 'bg-[var(--color-accent)] text-blue-900 shadow-xl cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Check Answer ➤
                    </button>
                </>
            ) : (
                /* Engagement Framing UI (Ninja Insight) */
                <div className="space-y-6 animate-in zoom-in duration-300">
                    <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-3xl">
                        <h3 className="text-xl font-black text-yellow-700 uppercase italic mb-2">
                            Ninja Insight! 💡
                        </h3>
                        <p className="text-lg text-yellow-900 font-medium">
                            {feedbackData?.engagement_framing || "You're getting warmer! Let's try to look at this differently."}
                        </p>
                    </div>

                    {/* Follow-up Bonus Mission for Recovery Velocity Tracking */}
                    {feedbackData?.follow_up && (
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                            <p className="font-bold text-blue-800 mb-4">{feedbackData.follow_up.text}</p>
                            <div className="grid grid-cols-1 gap-2">
                                {feedbackData.follow_up.options?.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const recoveryCorrect = opt === feedbackData.follow_up.correct;
                                            // Submits the outcome with the original choice and misconception tag
                                            onAnswer(false, selectedOption, recoveryCorrect, feedbackData.diagnostic_tag);
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