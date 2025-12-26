
import { StudyMaterial, Flashcard, QuizResult, StudyPlan, UserStats, ConceptMapNode, Task } from '../types';

const KEYS = {
  MATERIALS: 'sb_materials',
  FLASHCARDS: 'sb_flashcards',
  QUIZ_RESULTS: 'sb_quiz_results',
  STUDY_PLANS: 'sb_study_plans', 
  OVERVIEWS: 'sb_overviews',
  CONCEPT_MAPS: 'sb_concept_maps',
  STATS: 'sb_stats',
  TASKS: 'sb_tasks'
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

export const saveOverview = (materialId: string, overview: string) => {
    const data = getAllOverviews();
    const updated = { ...data, [materialId]: overview };
    localStorage.setItem(KEYS.OVERVIEWS, JSON.stringify(updated));
}

export const getOverview = (materialId: string): string => {
    const data = getAllOverviews();
    return data[materialId] || "";
}

const getAllOverviews = (): Record<string, string> => {
    const data = localStorage.getItem(KEYS.OVERVIEWS);
    return data ? JSON.parse(data) : {};
}

export const saveConceptMap = (materialId: string, map: ConceptMapNode) => {
    const data = getAllConceptMaps();
    const updated = { ...data, [materialId]: map };
    localStorage.setItem(KEYS.CONCEPT_MAPS, JSON.stringify(updated));
}

export const getConceptMap = (materialId: string): ConceptMapNode | null => {
    const data = getAllConceptMaps();
    return data[materialId] || null;
}

const getAllConceptMaps = (): Record<string, ConceptMapNode> => {
    const data = localStorage.getItem(KEYS.CONCEPT_MAPS);
    return data ? JSON.parse(data) : {};
}

// Tasks Logic
export const saveTask = (task: Task) => {
    const tasks = getTasks();
    tasks.push(task);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export const getTasks = (): Task[] => {
    const data = localStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
}

export const updateTask = (task: Task) => {
    const tasks = getTasks();
    const updated = tasks.map(t => t.id === task.id ? task : t);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(updated));
}

export const deleteTask = (id: string) => {
    const tasks = getTasks().filter(t => t.id !== id);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}


// Deprecated in UI but kept for storage integrity
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
