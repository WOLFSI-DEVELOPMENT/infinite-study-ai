import React, { useState } from 'react';
import { QuizQuestion, QuizResult } from '../types';
import { CheckCircle, XCircle, Award, ArrowRight } from 'lucide-react';
import { saveQuizResult } from '../services/storageService';

interface Props {
  questions: QuizQuestion[];
  materialId: string;
  onComplete: () => void;
}

const QuizRunner: React.FC<Props> = ({ questions, materialId, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answers, setAnswers] = useState<{questionId: string, correct: boolean}[]>([]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);

    const isCorrect = index === currentQuestion.correctAnswer;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, correct: isCorrect }]);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      const result: QuizResult = {
        id: `res-${Date.now()}`,
        materialId,
        score: score + (selectedOption === currentQuestion.correctAnswer ? 0 : 0), // Already added in handleSelect
        totalQuestions: questions.length,
        date: Date.now()
      };
      saveQuizResult(result);
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="mb-6 p-6 rounded-full bg-yellow-50 text-yellow-600">
          <Award size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete</h2>
        <div className="text-6xl font-bold text-black mb-8">
          {percentage}%
        </div>
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-black text-white rounded-full font-medium hover:scale-105 transition-transform"
        >
          Finish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-between text-xs font-medium uppercase tracking-widest text-gray-400">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
        {currentQuestion.question}
      </h3>

      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          let stateClass = "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700";
          if (showResult) {
            if (idx === currentQuestion.correctAnswer) {
              stateClass = "bg-green-100 text-green-800 border-green-200";
            } else if (idx === selectedOption) {
              stateClass = "bg-red-100 text-red-800 border-red-200";
            } else {
              stateClass = "bg-gray-50 opacity-50";
            }
          } else if (selectedOption === idx) {
            stateClass = "bg-black text-white";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between group text-lg ${stateClass}`}
            >
              <span className="font-medium">{option}</span>
              {showResult && idx === currentQuestion.correctAnswer && <CheckCircle size={24} />}
              {showResult && idx === selectedOption && idx !== currentQuestion.correctAnswer && <XCircle size={24} />}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-8 animate-fade-in pb-8">
          {currentQuestion.explanation && (
              <div className="p-4 rounded-xl bg-blue-50 text-blue-900 text-sm mb-6 leading-relaxed">
                  <span className="font-bold block mb-1">Why?</span>
                  {currentQuestion.explanation}
              </div>
          )}
          <button
            onClick={nextQuestion}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-colors flex justify-center items-center gap-2"
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'Finish'} <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizRunner;