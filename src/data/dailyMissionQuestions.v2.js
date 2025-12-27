/**
 * Daily Mission Questions - 14+ layout
 * 14 questions per day, aligned to MathQuest atoms/templates
 */

export const DAILY_MISSION_QUESTIONS_V2 = {
  day1: {
    layout: "14+",
    totalQuestions: 14,
    slots: Array.from({ length: 14 }, (_, i) => ({ slot: i + 1 })),
  },
};

export function getDailyMissionQuestionsV2(dayNumber) {
  const key = `day${dayNumber}`;
  const day = DAILY_MISSION_QUESTIONS_V2[key];
  if (!day) return [];
  return day.slots;
}
