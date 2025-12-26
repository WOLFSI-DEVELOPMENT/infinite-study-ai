import { StudyMaterial, Flashcard, QuizResult, StudyPlan, UserStats } from '../types';

const KEYS = {
  MATERIALS: 'sb_materials',
  FLASHCARDS: 'sb_flashcards',
  QUIZ_RESULTS: 'sb_quiz_results',
  STUDY_PLANS: 'sb_study_plans',
  STATS: 'sb_stats',
};

export const saveMaterial = (material: StudyMaterial) => {
  const materials = getMaterials();
  materials.push(material);
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
};

export const getMaterials = (): StudyMaterial[] => {
  const data = localStorage.getItem(KEYS.MATERIALS);
  return data ? JSON.parse(data) : [];
};

export const deleteMaterial = (id: string) => {
  const materials = getMaterials().filter(m => m.id !== id);
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
};

export const saveFlashcards = (materialId: string, cards: Flashcard[]) => {
  const allCards = getAllFlashcards();
  // Remove existing cards for this material if overwriting or just append? 
  // Let's store by material ID map for simplicity in this demo
  const updated = { ...allCards, [materialId]: cards };
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(updated));
};

export const getFlashcards = (materialId: string): Flashcard[] => {
  const allCards = getAllFlashcards();
  return allCards[materialId] || [];
};

const getAllFlashcards = (): Record<string, Flashcard[]> => {
  const data = localStorage.getItem(KEYS.FLASHCARDS);
  return data ? JSON.parse(data) : {};
};

export const saveQuizResult = (result: QuizResult) => {
  const results = getQuizResults();
  results.push(result);
  localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(results));
  updateStats('quiz', result.score);
};

export const getQuizResults = (): QuizResult[] => {
  const data = localStorage.getItem(KEYS.QUIZ_RESULTS);
  return data ? JSON.parse(data) : [];
};

export const saveStudyPlan = (plan: StudyPlan) => {
  const plans = getAllStudyPlans();
  const updated = { ...plans, [plan.materialId]: plan };
  localStorage.setItem(KEYS.STUDY_PLANS, JSON.stringify(updated));
};

export const getStudyPlan = (materialId: string): StudyPlan | null => {
  const plans = getAllStudyPlans();
  return plans[materialId] || null;
};

const getAllStudyPlans = (): Record<string, StudyPlan> => {
  const data = localStorage.getItem(KEYS.STUDY_PLANS);
  return data ? JSON.parse(data) : {};
};

export const getStats = (): UserStats => {
  const defaultStats: UserStats = {
    streakDays: 0,
    lastStudyDate: '',
    totalCardsLearned: 0,
    totalQuizzesTaken: 0,
    averageQuizScore: 0,
  };
  const data = localStorage.getItem(KEYS.STATS);
  return data ? JSON.parse(data) : defaultStats;
};

export const updateStats = (type: 'quiz' | 'card' | 'login', value?: number) => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];

  if (type === 'login') {
    if (stats.lastStudyDate !== today) {
        const lastDate = new Date(stats.lastStudyDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (stats.lastStudyDate && lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
            stats.streakDays += 1;
        } else if (stats.lastStudyDate !== today) {
            stats.streakDays = 1; 
        }
        stats.lastStudyDate = today;
    }
  } else if (type === 'quiz' && typeof value === 'number') {
    const totalScore = (stats.averageQuizScore * stats.totalQuizzesTaken) + value;
    stats.totalQuizzesTaken += 1;
    stats.averageQuizScore = totalScore / stats.totalQuizzesTaken;
  } else if (type === 'card') {
    stats.totalCardsLearned += 1;
  }

  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  return stats;
};

export const clearAllData = () => {
    localStorage.clear();
}