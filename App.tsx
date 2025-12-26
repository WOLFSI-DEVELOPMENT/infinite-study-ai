import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  BookOpen,
  Brain,
  Calendar,
  X,
  ChevronRight,
  Trash2
} from 'lucide-react';

import { StudyMaterial, Flashcard, QuizQuestion, StudyPlan } from './types';
import { 
  saveMaterial, 
  getMaterials, 
  deleteMaterial,
  saveFlashcards,
  getFlashcards,
  getQuizResults,
  getStats,
  updateStats,
  getStudyPlan,
  saveStudyPlan
} from './services/storageService';
import { generateSummary, generateFlashcards, generateQuiz, generateStudyPlan } from './services/geminiService';
import FlashcardDeck from './components/FlashcardDeck';
import QuizRunner from './components/QuizRunner';

// --- Components ---

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 pb-4 bg-gradient-to-b from-white to-transparent">
      <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 mr-2 cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles size={16} className="text-black" />
            <span className="font-bold text-sm tracking-tight text-black">Infinite Study AI</span>
        </div>
        <div className="w-px h-4 bg-gray-200 hidden md:block"></div>
        
        <button 
          onClick={() => navigate('/')} 
          className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Home
        </button>
        <button 
          onClick={() => navigate('/library')} 
          className={`text-sm font-medium transition-colors ${isActive('/library') ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Library
        </button>
        <button 
          className="text-sm font-medium text-gray-400 hover:text-gray-600 cursor-not-allowed"
        >
          Settings
        </button>
      </div>
    </nav>
  );
};

// --- 3D Carousel Component ---
interface CarouselProps {
  items: React.ReactNode[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  loading?: boolean;
}

const Carousel3D: React.FC<CarouselProps> = ({ items, activeIndex, onNavigate, loading }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden perspective-1000">
      {/* Navigation Arrows */}
      {!loading && (
        <>
          <button 
            onClick={() => onNavigate(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="absolute left-4 md:left-12 z-40 p-3 rounded-full bg-white/90 shadow-lg hover:bg-white disabled:opacity-30 transition-all text-black"
          >
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={() => onNavigate(Math.min(items.length - 1, activeIndex + 1))}
            disabled={activeIndex === items.length - 1}
            className="absolute right-4 md:right-12 z-40 p-3 rounded-full bg-white/90 shadow-lg hover:bg-white disabled:opacity-30 transition-all text-black"
          >
            <ArrowRight size={24} />
          </button>
        </>
      )}

      {/* Cards */}
      <div className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center">
        {items.map((item, index) => {
          const offset = index - activeIndex;
          const isActive = index === activeIndex;
          
          // Calculate styles based on distance from center
          const translateX = offset * 60; // Spread distance %
          const scale = isActive ? 1 : 0.85;
          const opacity = isActive ? 1 : 0.4;
          const zIndex = isActive ? 20 : 10 - Math.abs(offset);
          const rotateY = offset * -5; // Subtle rotation

          // We hide items that are too far away to improve performance and look
          if (Math.abs(offset) > 2) return null;

          return (
            <div
              key={index}
              className="absolute w-full md:w-[85%] h-full transition-all duration-500 ease-out flex items-center justify-center"
              style={{
                transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex,
                opacity: Math.abs(offset) > 1 ? 0 : opacity, // Fade out distant cards
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="w-full h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative">
                {/* Glass sheen effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Home / Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const handleCreate = () => {
    if (!prompt.trim()) return;
    // Pass the text to the loading/generation route
    navigate('/generating', { state: { content: prompt, title: "New Study Set" } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setPrompt(e.target.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor (Subtle) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-100 rounded-full blur-3xl opacity-60" />

      <div className="max-w-3xl w-full text-center z-10 space-y-12">
        
        {/* Branding Badge */}
        <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                <Sparkles size={14} className="text-gray-900" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900">Infinite Study AI</span>
            </div>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent pb-2">
            The only study tool
            <br />
            you need.
          </span>
        </h1>

        {/* Input Card */}
        <div 
          className={`
            relative bg-white rounded-3xl shadow-2xl transition-all duration-300
            ${isDragging ? 'scale-105 ring-2 ring-black' : 'hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = (ev) => { if (ev.target?.result) setPrompt(ev.target.result as string); };
                reader.readAsText(file);
            }
          }}
        >
          <div className="p-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste your notes, essay, or topic here..."
              className="w-full h-48 md:h-64 p-6 text-lg md:text-xl text-gray-800 placeholder-gray-300 bg-transparent border-none resize-none focus:ring-0 rounded-2xl"
            />
          </div>
          
          <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t border-gray-50">
            <div className="flex gap-4">
              <label className="cursor-pointer text-gray-400 hover:text-black transition-colors flex items-center gap-2 text-sm font-medium">
                <Upload size={18} />
                <span className="hidden md:inline">Upload Document (.txt)</span>
                <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
              </label>
            </div>
            
            <button
              onClick={handleCreate}
              disabled={!prompt.trim()}
              className="px-8 py-3 bg-black text-white rounded-full font-semibold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              <Sparkles size={18} /> Create
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-sm font-medium">
          Powered by Gemini 3.0 Flash • Instant Flashcards, Quizzes & Summaries
        </p>
      </div>
    </div>
  );
};

// --- Generation / Loading Screen ---
const LoadingScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { content: string, title: string };
  const [step, setStep] = useState(0);

  const steps = [
    { title: "Analyzing Content", desc: "Reading your document..." },
    { title: "Extracting Concepts", desc: "Identifying key terms and definitions..." },
    { title: "Drafting Summary", desc: "Condensing information into bullet points..." },
    { title: "Generating Flashcards", desc: "Creating active recall questions..." },
    { title: "Building Quiz", desc: "Formulating test questions to check understanding..." },
    { title: "Finalizing", desc: "Putting it all together..." }
  ];

  useEffect(() => {
    if (!state?.content) {
      navigate('/');
      return;
    }

    const process = async () => {
      try {
        // 1. Save Material
        const newMaterial = {
          id: `mat-${Date.now()}`,
          title: state.title || "Untitled Study Set",
          content: state.content,
          type: 'text' as const,
          createdAt: Date.now()
        };
        saveMaterial(newMaterial);
        
        // Simulate step progression alongside real API calls
        const stepInterval = setInterval(() => {
          setStep(prev => Math.min(prev + 1, steps.length - 1));
        }, 1500);

        // 2. Parallel Generation (in a real app, maybe sequential for better error handling)
        await Promise.all([
             generateSummary(state.content, 'medium'), // Warm up cache? We actually need to store these.
             generateFlashcards(state.content),
             generateQuiz(state.content),
             generateStudyPlan(state.content, new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], 45)
        ]).then(([summary, cards, quiz, plan]) => {
             // We don't have a specific "saveSummary" in storageService for this demo, 
             // we usually generate on fly in the view, but let's pretend we pre-cached it 
             // or just let the view generate it. 
             // To make the transition fast, we SHOULD save them now.
             saveFlashcards(newMaterial.id, cards);
             // We need to save the plan too
             plan.materialId = newMaterial.id;
             saveStudyPlan(plan);
             // For summary and quiz, the view usually generates them. 
             // Let's modify the view to accept passed state to avoid re-generation if possible,
             // or just rely on the mock service caching/speed.
             
             clearInterval(stepInterval);
             setStep(steps.length - 1);
             setTimeout(() => {
                navigate(`/study/${newMaterial.id}`, { state: { 
                    preloadedSummary: summary,
                    preloadedQuiz: quiz
                }});
             }, 800);
        });

      } catch (error) {
        console.error(error);
        alert("Something went wrong with AI generation.");
        navigate('/');
      }
    };

    process();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
        <Carousel3D 
            activeIndex={0} 
            onNavigate={() => {}} 
            loading={true}
            items={[
                <div key="loader" className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-white">
                    <div className="w-24 h-24 mb-8 relative">
                         <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin"></div>
                         <Sparkles className="absolute inset-0 m-auto text-black animate-pulse" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{steps[step].title}</h2>
                    <p className="text-gray-400 text-lg">{steps[step].desc}</p>
                    
                    <div className="mt-12 w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-black transition-all duration-500 ease-out"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>
            ]} 
        />
    </div>
  );
};

// --- Library View ---
const Library = () => {
    const materials = getMaterials();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white pt-24 px-6 pb-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Your Library</h1>
                
                {materials.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-6">You haven't created any study sets yet.</p>
                        <button onClick={() => navigate('/')} className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium">Create New</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {materials.map(m => (
                            <div key={m.id} onClick={() => navigate(`/study/${m.id}`)} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteMaterial(m.id); window.location.reload(); }}
                                        className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 line-clamp-1">{m.title}</h3>
                                <p className="text-gray-400 text-sm mb-4">{new Date(m.createdAt).toLocaleDateString()}</p>
                                <div className="flex items-center text-sm font-medium text-gray-900 group-hover:translate-x-2 transition-transform">
                                    Study Now <ChevronRight size={16} className="ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Study Detail (Main Carousel View) ---
const StudyDetail = () => {
  const { id } = React.useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const materialId = location.pathname.split('/').pop() || '';
  
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Data Containers
  const [summary, setSummary] = useState(location.state?.preloadedSummary || '');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(location.state?.preloadedQuiz || []);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  
  // Loading States for individual sections if not preloaded
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  useEffect(() => {
    const mats = getMaterials();
    const found = mats.find(m => m.id === materialId);
    if (found) {
      setMaterial(found);
      
      // Load saved cards/plan
      const savedCards = getFlashcards(found.id);
      if (savedCards.length > 0) setFlashcards(savedCards);
      
      const savedPlan = getStudyPlan(found.id);
      if (savedPlan) setStudyPlan(savedPlan);

      // If summary wasn't passed, generate it
      if (!summary && !loadingSummary) {
          setLoadingSummary(true);
          generateSummary(found.content, 'medium').then(res => {
              setSummary(res);
              setLoadingSummary(false);
          });
      }
    } else {
        navigate('/');
    }
  }, [materialId]);

  if (!material) return null;

  const slides = [
    // Slide 1: Summary
    <div className="w-full h-full flex flex-col p-8 md:p-12 overflow-hidden">
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-3 bg-gray-50 rounded-xl text-black"><FileText size={24} /></div>
            <div>
                <h2 className="text-2xl font-bold">Summary</h2>
                <p className="text-gray-400 text-sm">Key concepts extracted by AI</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar pr-4">
            {loadingSummary ? (
                <div className="h-full flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" /> Analyzing text...
                </div>
            ) : (
                <div className="prose prose-lg prose-headings:font-bold prose-p:text-gray-600 max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
                </div>
            )}
        </div>
    </div>,

    // Slide 2: Flashcards
    <div className="w-full h-full flex flex-col p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-3 bg-gray-50 rounded-xl text-black"><BookOpen size={24} /></div>
            <div>
                <h2 className="text-2xl font-bold">Flashcards</h2>
                <p className="text-gray-400 text-sm">Master definitions and terms</p>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
             <FlashcardDeck cards={flashcards} onUpdateCard={(updated) => {
                const newCards = flashcards.map(c => c.id === updated.id ? updated : c);
                setFlashcards(newCards);
                saveFlashcards(material.id, newCards);
            }} />
        </div>
    </div>,

    // Slide 3: Quiz
    <div className="w-full h-full flex flex-col p-8 md:p-12 overflow-y-auto no-scrollbar">
         <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-3 bg-gray-50 rounded-xl text-black"><Brain size={24} /></div>
            <div>
                <h2 className="text-2xl font-bold">Quiz</h2>
                <p className="text-gray-400 text-sm">Test your knowledge</p>
            </div>
        </div>
        <div className="flex-1">
             {quizQuestions.length > 0 ? (
                 <QuizRunner questions={quizQuestions} materialId={material.id} onComplete={() => {}} />
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">Loading Quiz...</div>
             )}
        </div>
    </div>,

    // Slide 4: Plan
    <div className="w-full h-full flex flex-col p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-3 bg-gray-50 rounded-xl text-black"><Calendar size={24} /></div>
            <div>
                <h2 className="text-2xl font-bold">Study Plan</h2>
                <p className="text-gray-400 text-sm">Your roadmap to success</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {!studyPlan ? (
                <div className="flex items-center justify-center h-full text-gray-400">Generating Plan...</div>
            ) : (
                <div className="space-y-6">
                    {studyPlan.schedule.map((day) => (
                        <div key={day.day} className="flex gap-4">
                             <div className="flex flex-col items-center">
                                 <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                                     {day.day}
                                 </div>
                                 <div className="w-0.5 flex-1 bg-gray-100 my-2"></div>
                             </div>
                             <div className="pb-8">
                                 <h4 className="font-bold text-lg mb-2">{new Date(day.date).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</h4>
                                 <div className="flex flex-wrap gap-2 mb-3">
                                     {day.topics.map((t, i) => (
                                         <span key={i} className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">{t}</span>
                                     ))}
                                 </div>
                                 <ul className="space-y-2">
                                     {day.activities.map((act, i) => (
                                         <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                             {act}
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  ];

  return (
    <div className="h-screen bg-white flex flex-col pt-20 overflow-hidden">
        <div className="px-6 pb-2 text-center md:text-left md:pl-12">
            <h1 className="text-xl font-bold text-gray-900">{material.title}</h1>
            <p className="text-sm text-gray-400">Swipe or use arrows to navigate</p>
        </div>
        <div className="flex-1 relative">
            <Carousel3D 
                items={slides} 
                activeIndex={activeSlide} 
                onNavigate={setActiveSlide} 
            />
        </div>
    </div>
  );
};


// --- Main App Entry ---
const App = () => {
  return (
    <Router>
      <div className="font-sans text-gray-900 selection:bg-black selection:text-white">
        <Navbar />
        <Routes>
           <Route path="/" element={<LandingPage />} />
           <Route path="/generating" element={<LoadingScreen />} />
           <Route path="/library" element={<Library />} />
           <Route path="/study/:id" element={<StudyDetail />} />
           <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;