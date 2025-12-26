export interface StudyMaterial {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  type: 'text' | 'file';
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  difficulty?: 'easy' | 'medium' | 'hard';
  nextReview?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation?: string;
}

export interface QuizResult {
  id: string;
  materialId: string;
  score: number;
  totalQuestions: number;
  date: number;
}

export interface StudyPlanDay {
  day: number;
  date: string; // ISO string
  topics: string[];
  activities: string[];
  durationMinutes: number;
}

export interface StudyPlan {
  id: string;
  materialId: string;
  examDate: string;
  dailyMinutes: number;
  schedule: StudyPlanDay[];
  createdAt: number;
}

export interface UserStats {
  streakDays: number;
  lastStudyDate: string; // ISO date string
  totalCardsLearned: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  MATERIAL = 'MATERIAL',
  FLASHCARDS = 'FLASHCARDS',
  QUIZ = 'QUIZ',
  PLAN = 'PLAN',
}