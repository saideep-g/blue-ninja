import React, { useEffect, useState } from 'react';

export default function LevelUpAnimation({ level, show, onComplete }) {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none">
            {/* Background overlay with particles */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            {/* Confetti particles */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                        left: Math.random() * 100 + '%',
                        top: '-20px',
                        animation: `fall ${2 + Math.random() * 2}s ease-in forwards`,
                        delay: Math.random() * 0.2 + 's',
                        fontSize: '24px'
                    }}
                >
                    {['⭐', '✨', '🎉', '💫'][Math.floor(Math.random() * 4)]}
                </div>
            ))}

            {/* Main card */}
            <div className="relative z-10 animate-in zoom-in-50 duration-500">
                <div className="bg-white rounded-3xl shadow-2xl p-12 text-center space-y-4 max-w-lg">
                    <div className="text-7xl animate-bounce">🚀</div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        LEVEL UP!
                    </h1>
                    <p className="text-3xl font-black text-gray-900">Level {level}</p>
                    <p className="text-lg text-gray-600 font-bold">You're becoming an unstoppable ninja! 🥷</p>
                    <div className="pt-4">
                        <p className="text-sm text-gray-500">Keep the momentum going...</p>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
