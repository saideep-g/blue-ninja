export const motivationalMessages = {
    start: [
        "You've got this! 🔥",
        "Time to shine, ninja! ✨",
        "Let's make today count 💪",
        "Ready to level up? 🚀",
        "Watch me work! 😎"
    ],

    midSession: [
        "You're on fire! 🔥",
        "Keep that momentum! 💫",
        "Almost there! 🏃‍♀️",
        "Crushing it! 💎",
        "This is what power looks like ⚡"
    ],

    struggle: [
        "That's a learning moment! 💡",
        "Mistakes help us grow 🌱",
        "Let's figure this out together 🤝",
        "You're getting closer 📈",
        "This will make you stronger 💪"
    ],

    success: [
        "ABSOLUTELY CRUSHING IT! 🎉",
        "You're a LEGEND! 👑",
        "That's what I'm talking about! 🔥",
        "You make it look easy! ✨",
        "PERFECT! You're unstoppable! 🚀"
    ],

    completion: [
        "Today you were AMAZING! 💖",
        "You're getting stronger every day ⭐",
        "Come back tomorrow to keep the streak alive 🔥",
        "You left it all on the field! 👏",
        "You're inspiring us all! 🌟"
    ]
};

export const getTip = (topic) => {
    const tips = {
        fractions: "💡 Think of fractions like pizza slices! If you have 3/4 pizza, you have 3 out of 4 slices.",
        negativenumbers: "❄️ Negative numbers are like walking backwards on a number line. Start at 0, face left (negative), then walk!",
        algebra: "🧩 Algebra is like a puzzle. Both sides of the equals sign must balance.",
        geometry: "📐 Geometry is everywhere! Look for shapes in buildings, nature, and everyday objects.",
        decimals: "💰 Decimals are like money! 0.5 is like 50 cents (half a dollar).",
    };
    return tips[topic] || "You're doing great! Keep practicing!";
};
