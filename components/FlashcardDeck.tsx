
import React, { useState } from 'react';
import { Flashcard } from '../types';
import { Check, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { updateStats } from '../services/storageService';

interface Props {
  cards: Flashcard[];
  onUpdateCard: (card: Flashcard) => void;
}

const FlashcardDeck: React.FC<Props> = ({ cards, onUpdateCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = (difficulty: 'easy' | 'medium' | 'hard') => {
    const updatedCard = {
      ...currentCard,
      difficulty,
      status: 'review' as const,
      nextReview: Date.now() + (difficulty === 'easy' ? 86400000 * 3 : difficulty === 'medium' ? 86400000 : 600000)
    };
    onUpdateCard(updatedCard);
    updateStats('card');

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFinished(false);
    setIsFlipped(false);
  };

  if (cards.length === 0) return <div className="text-gray-400">No cards available.</div>;

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-6">
          <Check size={40} />
        </div>
        <h3 className="text-3xl font-bold mb-2">All Done!</h3>
        <p className="text-gray-500 mb-8">You've reviewed all cards.</p>
        <button
          onClick={restart}
          className="flex items-center gap-2 px-8 py-3 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition-colors font-medium"
        >
          <RotateCcw size={18} /> Review Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col h-full justify-center">
      <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">
        Card {currentIndex + 1} / {cards.length}
      </div>

      <div 
        className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden border border-gray-100 shadow-inner overflow-y-auto no-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 sticky top-0 bg-gray-50 pb-2 w-full">Question</span>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed text-gray-900">
              {currentCard.front}
            </p>
            <p className="absolute bottom-6 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to flip</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-black rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 text-white overflow-y-auto no-scrollbar">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 sticky top-0 bg-black pb-2 w-full">Answer</span>
            <p className="text-xl md:text-2xl leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex justify-center gap-4 mt-8 animate-slide-up">
          <button onClick={(e) => { e.stopPropagation(); handleNext('hard'); }} className="p-4 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><ThumbsDown size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleNext('medium'); }} className="px-8 py-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold transition-colors">Okay</button>
          <button onClick={(e) => { e.stopPropagation(); handleNext('easy'); }} className="p-4 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><ThumbsUp size={24} /></button>
        </div>
      )}
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardDeck;
