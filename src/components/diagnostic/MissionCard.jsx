import React, { useEffect, useState, useMemo, useRef } from 'react';

/**
 * MissionCard: Step 12 & 13 Final Implementation
 * Fully handles LaTeX rendering, engagement framing, and hurdle tracking.
 * Detailed comments explain the logic flow for VS Code diffing.
 * Ensures the 'Bonus Mission' (Follow-Up) is visible and interactable 
 * after an incorrect answer is submitted.
 * Implements Auto-Advance, Success Animations, and Thinking-Time Tracking.
 */
function MissionCard({ question, onAnswer, onStartRecovery }) {
    // Local state to track the ninja's current selection before submission
    const [selectedOption, setSelectedOption] = useState(null);
    // Controls the visibility of the "Ninja Insight" feedback layer
    const [showFeedback, setShowFeedback] = useState(false);
    // Stores the specific distractor data for the selected wrong answer
    const [feedbackData, setFeedbackData] = useState(null);

    // Add a local loading state for typeset
    const [isTypesetting, setIsTypesetting] = useState(false);
    const [isCorrectPulse, setIsCorrectPulse] = useState(false);

    // Phase 2: High-precision timer for "Thinking Time"
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        // Reset timer when a new question loads
        startTimeRef.current = Date.now();
        setSelectedOption(null);
        setShowFeedback(false);
        setIsCorrectPulse(false);
    }, [question?.id]);

    /**
     * Effect to trigger MathJax typeset whenever the content changes.
     * This ensures formulas like $a^m \times a^n$ render correctly after every mission update.
     */
    useEffect(() => {
        if (window.MathJax) {
            setIsTypesetting(true);
            window.MathJax.typesetPromise().then(() => {
                setIsTypesetting(false);
            });
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
     * handleCheck - Logic to check the primary answer.
     * If correct: Triggers success animation and auto-advances after 1.2s.
     * If wrong: Shows Ninja Insight and starts recovery timer.
     */
    const handleCheck = () => {
        const timeSpent = Date.now() - startTimeRef.current;
        const isCorrect = selectedOption === question.correct_answer;

        if (isCorrect) {
            setIsCorrectPulse(true);
            // UX Decision: 1.2s pause for the "Success Beat" before auto-advancing
            setTimeout(() => {
                onAnswer(true, selectedOption, false, null, timeSpent);
            }, 1200);
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
            <div className={`mb-10 transition-opacity duration-300 ${isTypesetting ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                    {question.text}
                </h2>
            </div>

            {!showFeedback ? (
                <>
                    {/* Answer Selection Grid */}
                    <div className="grid grid-cols-1 gap-3">
                        {shuffledOptions.map((option, index) => {
                            const isSelected = selectedOption === option;
                            return (
                                <button
                                    key={index}
                                    onClick={() => !isCorrectPulse && setSelectedOption(option)}
                                    className={`p-5 rounded-2xl text-left font-bold transition-all border-2 relative overflow-hidden ${isSelected
                                        ? isCorrectPulse
                                            ? 'bg-green-500 border-green-500 text-white shadow-xl'
                                            : 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                        : 'bg-white border-blue-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                        } ${isCorrectPulse && isSelected ? 'animate-bounce' : ''}`}
                                >
                                    {option}
                                    {isCorrectPulse && isSelected && (
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">✨</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!isCorrectPulse && (
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
                    )}
                </>
            ) : (
                /* Engagement Framing UI (Ninja Insight) */
                /* The Recovery Flow */
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
                    {feedbackData?.follow_up ? (
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                            <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-3">Bonus Mission</h4>
                            <p className="font-bold text-blue-800 mb-4">{feedbackData.follow_up.text}</p>
                            <div className="grid grid-cols-1 gap-2">
                                {feedbackData.follow_up.options?.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const timeSpent = Date.now() - startTimeRef.current;
                                            const recoveryCorrect = opt === feedbackData.follow_up.correct;
                                            // Submits the outcome with the original choice and misconception tag
                                            onAnswer(false, selectedOption, recoveryCorrect, feedbackData.diagnostic_tag, timeSpent);
                                            setShowFeedback(false);
                                            setFeedbackData(null);
                                            setSelectedOption(null);
                                        }}
                                        className="p-4 bg-white border-2 border-blue-100 rounded-xl text-left font-bold text-blue-700 hover:border-blue-400 transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* If no follow-up is defined in the JSON, provide a way to continue */
                        <button
                            onClick={() => {
                                const timeSpent = Date.now() - startTimeRef.current;
                                onAnswer(false, selectedOption, false, feedbackData?.diagnostic_tag, timeSpent);
                                setShowFeedback(false);
                                setFeedbackData(null);
                                setSelectedOption(null);
                            }}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest"
                        >
                            Next Mission ➤
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default MissionCard;