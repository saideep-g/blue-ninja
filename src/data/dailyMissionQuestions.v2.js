/**
 * Daily Mission Questions - 14+ layout
 * 14 questions per day, aligned to MathQuest atoms/templates
 */

export const DAILY_MISSION_QUESTIONS = {
  day1: {
    layout: "14+",
    totalQuestions: 14,
    slots: Array.from({ length: 14 }, (_, i) => ({ slot: i + 1 })),
  },
};

export function getDailyMissionQuestions(dayNumber) {
  const key = `day${dayNumber}`;
  const day = DAILY_MISSION_QUESTIONS[key];
  if (!day) return [];
  return day.slots;
}
