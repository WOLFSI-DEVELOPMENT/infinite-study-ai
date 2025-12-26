
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp,
  Upload,
  FileText,
  Loader2,
  BookOpen,
  Brain,
  Calendar as CalendarIcon,
  X,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Zap,
  Layout,
  Plus,
  Image as ImageIcon,
  Paperclip,
  AtSign,
  Network,
  Home,
  ListTodo,
  CalendarDays,
  Plane,
  Menu,
  Check,
  Mic,
  Send,
  MoreVertical,
  Bot,
  Bell,
  Globe,
  Search,
  PenTool
} from 'lucide-react';

import { StudyMaterial, Flashcard, QuizQuestion, StudyPlan, ConceptMapNode, Task } from './types';
import { 
  saveMaterial, 
  getMaterials, 
  deleteMaterial,
  saveFlashcards,
  getFlashcards,
  getQuizResults,
  getStats,
  updateStats,
  saveOverview,
  getOverview,
  saveConceptMap,
  getConceptMap,
  saveTask,
  getTasks,
  updateTask,
  deleteTask
} from './services/storageService';
import { generateSummary, generateFlashcards, generateQuiz, generateShortOverview, generateConceptMap } from './services/geminiService';
import FlashcardDeck from './components/FlashcardDeck';
import QuizRunner from './components/QuizRunner';

// --- Shared Liquid Glass Component ---
interface LiquidGlassProps {
    children?: React.ReactNode;
    className?: string;
    innerClassName?: string;
}

const LiquidGlass: React.FC<LiquidGlassProps> = ({ children, className = "", innerClassName = "p-4 flex items-center" }) => (
    <div className={`glass-container ${className}`}>
        <div className="glass-filter"></div>
        <div className="glass-overlay"></div>
        <div className="glass-specular"></div>
        <div className={`relative z-10 w-full h-full ${innerClassName}`}>
            {children}
        </div>
    </div>
);

// --- Workspace Component ---

const Workspace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'tasks' | 'agenda' | 'pilot'>('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Tasks
  useEffect(() => {
    setTasks(getTasks());
  }, [activeTab]); // Refresh when changing tabs

  const handleCreateTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        date: new Date().toISOString().split('T')[0],
        completed: false
    };
    saveTask(newTask);
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const toggleTaskStatus = (task: Task) => {
      const updated = { ...task, completed: !task.completed };
      updateTask(updated);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  const removeTask = (id: string) => {
      deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const SidebarIcon = ({ icon: Icon, tab, label }: { icon: any, tab: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(tab as any)}
      className={`
        p-3 rounded-xl transition-all duration-300 group relative
        ${activeTab === tab ? 'bg-white/20 text-white shadow-lg backdrop-blur-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}
      `}
    >
      <Icon strokeWidth={1.5} size={24} />
      <span className="absolute left-full ml-4 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
      </span>
    </button>
  );

  const WorkspaceHome = () => {
      const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 4);
      
      return (
        <div className="flex flex-col items-center justify-center h-full relative">
            <div className="absolute top-[20%] flex flex-col items-center animate-float">
                <h1 className="font-chewy text-[8rem] md:text-[10rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl filter backdrop-blur-sm">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/\s[AP]M/, '')}
                </h1>
                <p className="text-white/90 text-2xl md:text-3xl font-light tracking-wide mt-2">
                    {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="absolute bottom-[15%] w-full max-w-md px-6">
                <h3 className="text-white/80 text-lg font-medium mb-4 text-center tracking-wider uppercase text-xs">Upcoming Tasks</h3>
                <div className="flex flex-col gap-3">
                    {upcomingTasks.length === 0 ? (
                        <div className="glass-panel rounded-2xl p-4 text-center text-white/60 text-sm">
                            No tasks for today. Enjoy the waves! 🌊
                        </div>
                    ) : (
                        upcomingTasks.map(task => (
                            <LiquidGlass key={task.id} className="rounded-2xl !p-0 group hover:scale-[1.02] transition-transform" innerClassName="flex items-center justify-between px-4 py-3">
                                <span className="text-white font-medium truncate">{task.title}</span>
                                <button onClick={() => toggleTaskStatus(task)} className="text-white/50 hover:text-green-400 transition-colors">
                                    <CheckCircle2 size={18} />
                                </button>
                            </LiquidGlass>
                        ))
                    )}
                </div>
            </div>
        </div>
      );
  };

  const WorkspaceCalendar = () => {
      const [currentMonth, setCurrentMonth] = useState(new Date());
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sun

      const changeMonth = (offset: number) => {
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
      };

      return (
          <div className="h-full flex flex-col items-center justify-center p-4 z-10 relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 text-white w-full max-w-3xl px-4">
                  <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white/20 rounded-full transition-all border border-white/30 backdrop-blur-md group">
                    <ArrowLeft strokeWidth={2.5} size={20} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <h2 className="text-5xl font-chewy tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                    {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </h2>
                  <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white/20 rounded-full transition-all border border-white/30 backdrop-blur-md group">
                    <ArrowRight strokeWidth={2.5} size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
              
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-3 text-center mb-4 w-full max-w-3xl px-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-white/90 text-lg font-chewy tracking-widest uppercase drop-shadow-md">{d}</div>
                  ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-3 w-full max-w-3xl px-2 perspective-1000">
                  {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const hasTask = tasks.some(t => t.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;

                      return (
                          <div key={day} className={`
                              aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                              border 
                              ${isToday 
                                ? 'border-white bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10' 
                                : 'border-white/20 bg-transparent hover:border-white/60 hover:bg-white/5 hover:scale-105 hover:rotate-1'
                              }
                          `}>
                              <span className={`text-2xl font-chewy ${isToday ? 'text-white drop-shadow-lg' : 'text-white/70'}`}>{day}</span>
                              
                              {/* Task Indicator */}
                              {hasTask && (
                                  <div className={`
                                    absolute bottom-2 w-1.5 h-1.5 rounded-full 
                                    ${isToday ? 'bg-white animate-pulse' : 'bg-white/60'}
                                    shadow-[0_0_5px_rgba(255,255,255,0.8)]
                                  `}></div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const WorkspaceTasks = () => {
      return (
          <div className="h-full flex flex-col items-center pt-24 px-6">
              <h2 className="text-white text-4xl font-light mb-10 tracking-widest">Tasks & Goals</h2>
              
              <div className="w-full max-w-2xl">
                  {/* Thinner Input with Reminder & Floating Plus */}
                  <div className="mb-10 w-full flex items-center gap-4">
                     <div className="flex-1 h-12">
                        <LiquidGlass className="rounded-full !p-0 h-full" innerClassName="flex items-center px-4">
                            <form onSubmit={handleCreateTask} className="w-full h-full relative flex items-center">
                                <input 
                                    type="text" 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-base h-full"
                                />
                                <button type="button" className="text-white/40 hover:text-white transition-colors ml-2">
                                    <Bell size={16} />
                                </button>
                            </form>
                        </LiquidGlass>
                     </div>
                     <button 
                        onClick={handleCreateTask}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform"
                     >
                        <Plus size={22} />
                     </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                      {tasks.length === 0 && <div className="text-white/50 text-center py-10">All clear! Relax and float on.</div>}
                      {tasks.map(task => (
                          <div key={task.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 group hover:translate-x-1 transition-transform">
                              <button onClick={() => toggleTaskStatus(task)} className={`
                                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                  ${task.completed ? 'bg-green-400 border-green-400' : 'border-white/50 hover:border-white'}
                              `}>
                                  {task.completed && <Check size={14} className="text-blue-900" />}
                              </button>
                              <div className="flex-1">
                                  <p className={`text-lg text-white transition-all ${task.completed ? 'line-through opacity-50' : ''}`}>
                                      {task.title}
                                  </p>
                                  <p className="text-white/40 text-xs">{task.date}</p>
                              </div>
                              <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-300 transition-all">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const WorkspaceAgenda = () => {
    const agendaItems = [
        { time: '08:00', title: 'Morning Review', type: 'routine' },
        { time: '10:00', title: 'Deep Work: Physics', type: 'focus' },
        { time: '14:00', title: 'Quiz Prep', type: 'study' },
        ...tasks.filter(t => !t.completed).map(t => ({ time: 'To Do', title: t.title, type: 'task' }))
    ];

    return (
        <div className="h-full flex flex-col items-center pt-24 px-6">
            <h2 className="text-white text-4xl font-light mb-10 tracking-widest">Daily Agenda</h2>
            <div className="w-full max-w-2xl relative pl-8 border-l border-white/10 space-y-6 pb-20 overflow-y-auto no-scrollbar max-h-[70vh]">
                {agendaItems.map((item, i) => (
                    <div key={i} className="relative group">
                        <div className="absolute -left-[39px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0f172a] border-4 border-white/20 group-hover:border-white group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                        <LiquidGlass className="rounded-2xl group-hover:translate-x-2 transition-transform" innerClassName="p-5 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-white/50 font-mono mb-1">{item.time}</div>
                                <div className="text-white text-lg font-medium">{item.title}</div>
                            </div>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-white/60 uppercase tracking-wider font-bold">{item.type}</span>
                        </LiquidGlass>
                    </div>
                ))}
                <div className="relative group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border-2 border-dashed border-white/30"></div>
                    <div className="ml-0 p-4 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white/50 hover:bg-white/5 transition-colors">
                        <Plus size={16} /> Add Event
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const WorkspacePilot = () => {
      const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, preview?: any}[]>([
          { role: 'ai', text: "Hey! I'm your Study Pilot. What can I do for you today?" }
      ]);
      const [inputText, setInputText] = useState('');
      const [isDropdownOpen, setIsDropdownOpen] = useState(false);
      const [isKitModalOpen, setIsKitModalOpen] = useState(false);
      const [selectedKitForEdit, setSelectedKitForEdit] = useState<StudyMaterial | null>(null);
      const [editPrompt, setEditPrompt] = useState('');
      
      const materials = getMaterials();
      const messagesEndRef = useRef<HTMLDivElement>(null);

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      useEffect(() => {
        scrollToBottom();
      }, [messages]);

      const handleSendMessage = async () => {
          if (!inputText.trim()) return;
          
          const userMsg = inputText;
          setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
          setInputText('');
          
          // Simulate AI Response
          setTimeout(() => {
              let aiReply = '';
              const lowerMsg = userMsg.toLowerCase();
              
              if (lowerMsg.includes('task') || lowerMsg.includes('remind')) {
                  const newTask: Task = {
                      id: `task-${Date.now()}`,
                      title: userMsg.replace(/create task|add task|remind me to/i, '').trim() || "New Task",
                      date: new Date().toISOString().split('T')[0],
                      completed: false
                  };
                  saveTask(newTask);
                  // Force refresh tasks in other tabs
                  setTasks(getTasks()); 
                  aiReply = `I've added "${newTask.title}" to your tasks.`;
              } else if (lowerMsg.includes('agenda')) {
                   aiReply = "I've updated your agenda based on your recent activity.";
              } else {
                  aiReply = "I'm here to help. You can ask me to create tasks, check your agenda, or edit a study kit.";
              }
              
              setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
          }, 800);
      };

      const handleEditKit = () => {
          if (!selectedKitForEdit || !editPrompt) return;
          setIsKitModalOpen(false);
          setMessages(prev => [...prev, { role: 'user', text: `Edit kit "${selectedKitForEdit.title}": ${editPrompt}` }]);
          
          setTimeout(() => {
              setMessages(prev => [...prev, { 
                  role: 'ai', 
                  text: `I've updated "${selectedKitForEdit.title}" based on your request. Here is a preview:`,
                  preview: {
                      title: selectedKitForEdit.title,
                      summary: "Updated summary based on new context...",
                      tags: ["AI Edited", "Refined"]
                  }
              }]);
              setEditPrompt('');
              setSelectedKitForEdit(null);
          }, 1500);
      };

      return (
          <div className="h-full w-full relative overflow-hidden pilot-bg flex flex-col items-center justify-end pb-8">
              {/* Chat Area */}
              <div className="w-full max-w-4xl flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-6 mb-4">
                  {messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <LiquidGlass 
                            className={`
                                !p-0 max-w-[85%] rounded-2xl
                                ${msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}
                            `}
                            innerClassName="p-4"
                          >
                             <div className="text-white text-sm md:text-base leading-relaxed">
                                {msg.text}
                             </div>
                          </LiquidGlass>
                          
                          {/* Preview Card for Study Kit Edits */}
                          {msg.preview && (
                              <div className="mt-2 w-64 glass-panel p-3 rounded-xl border border-white/30 animate-fade-in cursor-pointer hover:bg-white/10 transition-colors ml-2">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="p-1.5 bg-white/20 rounded-lg"><BookOpen size={14} className="text-white"/></div>
                                      <span className="text-white font-bold text-sm truncate">{msg.preview.title}</span>
                                  </div>
                                  <p className="text-white/60 text-xs mb-2">{msg.preview.summary}</p>
                                  <div className="flex gap-1">
                                      {msg.preview.tags.map((t: string, i: number) => (
                                          <span key={i} className="text-[10px] bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded">{t}</span>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* Big Box Input Area */}
              <div className="w-[95%] md:w-[750px] z-50 relative">
                  {/* Dropdown for extra options moved outside LiquidGlass to prevent clipping */}
                   {isDropdownOpen && (
                        <div className="absolute bottom-full left-6 mb-3 w-56 glass-panel rounded-2xl overflow-hidden flex flex-col animate-fade-in z-[60] shadow-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10">
                            <button 
                              onClick={() => { setIsKitModalOpen(true); setIsDropdownOpen(false); }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-yellow-300 text-sm transition-colors text-left font-medium"
                            >
                                <Sparkles size={16} /> Edit Study Kit
                            </button>
                            <div className="h-px bg-white/10 mx-2"></div>
                            <button className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors text-left">
                                <FileText size={16} /> Upload Document
                            </button>
                        </div>
                    )}

                  <LiquidGlass 
                      className="!rounded-[2rem] !p-0 min-h-[160px] flex flex-col" 
                      innerClassName="flex flex-col p-6"
                  >
                        <textarea 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask anything..."
                            className="w-full bg-transparent border-none outline-none text-white placeholder-white/50 text-xl font-light resize-none flex-1 mb-4 z-20 relative"
                        />
                        
                        {/* Toolbar */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4 text-white/70">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="hover:text-white transition-colors p-1"
                                >
                                    <Plus size={24} strokeWidth={1.5} />
                                </button>
                                <div className="w-px h-5 bg-white/20"></div>
                                
                                <button className="hover:text-white transition-colors p-1" title="Search">
                                    <Search size={20} strokeWidth={1.5} />
                                </button>
                                <button className="hover:text-white transition-colors p-1" title="Image">
                                    <ImageIcon size={20} strokeWidth={1.5} />
                                </button>
                                <button className="hover:text-white transition-colors p-1" title="File">
                                    <FileText size={20} strokeWidth={1.5} />
                                </button>
                                <button className="hover:text-white transition-colors p-1" title="Draw">
                                    <PenTool size={20} strokeWidth={1.5} />
                                </button>
                                <button className="hover:text-white transition-colors p-1" title="Web">
                                    <Globe size={20} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="p-2 text-white/70 hover:text-white transition-colors">
                                    <Mic size={24} strokeWidth={1.5} />
                                </button>
                                <button 
                                    onClick={handleSendMessage}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                >
                                    <ArrowUp size={24} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                  </LiquidGlass>
              </div>

              {/* Edit Kit Modal */}
              {isKitModalOpen && (
                  <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md glass-panel rounded-3xl p-6 relative animate-fade-in border border-white/30 shadow-2xl bg-black/20">
                          <button 
                              onClick={() => { setIsKitModalOpen(false); setSelectedKitForEdit(null); }}
                              className="absolute top-4 right-4 text-white/50 hover:text-white"
                          >
                              <X size={20} />
                          </button>
                          
                          <h3 className="text-xl font-bold text-white mb-1">Edit Study Kit</h3>
                          <p className="text-white/60 text-sm mb-6">Select a kit and tell AI how to improve it.</p>

                          {!selectedKitForEdit ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar mb-4">
                                  {materials.map(m => (
                                      <button 
                                          key={m.id}
                                          onClick={() => setSelectedKitForEdit(m)}
                                          className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-colors group"
                                      >
                                          <div className="p-2 bg-white/10 rounded-lg text-white group-hover:bg-white group-hover:text-black transition-colors">
                                              <BookOpen size={16} />
                                          </div>
                                          <div className="flex-1 truncate text-white text-sm font-medium">{m.title}</div>
                                      </button>
                                  ))}
                                  {materials.length === 0 && <div className="text-white/40 text-center py-4">No kits found.</div>}
                              </div>
                          ) : (
                              <div className="mb-4">
                                  <div className="p-3 bg-white/10 rounded-xl flex items-center gap-3 mb-4 border border-white/20">
                                      <BookOpen size={18} className="text-white"/>
                                      <span className="text-white font-medium">{selectedKitForEdit.title}</span>
                                      <button onClick={() => setSelectedKitForEdit(null)} className="ml-auto text-xs text-white/50 hover:text-white underline">Change</button>
                                  </div>
                                  <textarea 
                                      value={editPrompt}
                                      onChange={(e) => setEditPrompt(e.target.value)}
                                      placeholder="Ex: Make the flashcards harder, add more details about..."
                                      className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/40 text-sm focus:outline-none focus:bg-white/10 resize-none"
                                  />
                              </div>
                          )}

                          <button 
                              onClick={handleEditKit}
                              disabled={!selectedKitForEdit || !editPrompt}
                              className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                          >
                              <div className="flex items-center justify-center gap-2">
                                  <Sparkles size={16} /> Update Kit
                              </div>
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-cover bg-center transition-all duration-1000"
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop")' }}>
        
        {/* Overlay for tint and blur only if needed, mostly handled by components */}
        <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px]"></div>

        {/* Sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center py-6 z-50 border-r border-white/20 bg-transparent">
            <button onClick={() => navigate('/')} className="mb-8 text-white/80 hover:text-white transition-colors">
                <X strokeWidth={1.5} size={28} />
            </button>
            
            <div className="flex flex-col gap-6 flex-1 justify-center">
                <SidebarIcon icon={Home} tab="home" label="Home" />
                <SidebarIcon icon={CalendarDays} tab="calendar" label="Calendar" />
                <SidebarIcon icon={ListTodo} tab="tasks" label="Tasks" />
                <SidebarIcon icon={Menu} tab="agenda" label="Agenda" />
                <SidebarIcon icon={Bot} tab="pilot" label="Study Pilot" />
            </div>
        </div>

        {/* Header Branding */}
        <div className="absolute top-8 right-8 z-40 text-white/80 font-light text-xl tracking-[0.2em] uppercase">
            Workspace
        </div>

        {/* Main Content Area */}
        <div className="absolute inset-0 pl-16 z-30">
            {activeTab === 'home' && <WorkspaceHome />}
            {activeTab === 'calendar' && <WorkspaceCalendar />}
            {activeTab === 'tasks' && <WorkspaceTasks />}
            {activeTab === 'agenda' && <WorkspaceAgenda />}
            {activeTab === 'pilot' && <WorkspacePilot />}
        </div>
    </div>
  );
};


// --- Components ---

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Do not render navbar if in workspace
  if (location.pathname === '/workspace') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 pb-4 pointer-events-none">
      <div className={`
        px-6 py-2 rounded-full flex items-center gap-6 transition-colors duration-300 pointer-events-auto
        bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm
        text-black
      `}>
        <div className="hidden md:flex items-center gap-2 mr-2 cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles size={16} className="text-black" />
            <span className="font-bold text-sm tracking-tight">Infinite Study AI</span>
        </div>
        <div className="w-px h-4 hidden md:block bg-gray-300/50"></div>
        
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
        
        <div className="w-px h-4 bg-gray-300/50"></div>

        <button 
          onClick={() => navigate('/workspace')} 
          className="text-sm font-medium px-3 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
           <Layout size={14} /> Workspace
        </button>
      </div>
    </nav>
  );
};

// --- Concept Map Visualization ---
const MindMapNode = ({ node, level = 0 }: { node: ConceptMapNode; level?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    
    // Colors based on depth
    const colors = ['bg-black', 'bg-gray-700', 'bg-gray-500', 'bg-gray-400'];
    const bgColor = colors[Math.min(level, colors.length - 1)];

    return (
        <div className="flex flex-col items-center">
            <div 
                onClick={() => setExpanded(!expanded)}
                className={`
                    relative z-10 px-6 py-3 rounded-full shadow-md text-white font-medium cursor-pointer transition-all hover:scale-105
                    ${bgColor} border-2 border-white
                `}
            >
                {node.label}
                {node.details && <div className="text-[10px] opacity-80 font-light max-w-[150px] truncate">{node.details}</div>}
            </div>
            
            {hasChildren && expanded && (
                <div className="flex flex-col items-center mt-4 w-full">
                    {/* Connection Line */}
                    <div className="w-px h-4 bg-gray-300 mb-4"></div>
                    
                    <div className="flex gap-4 md:gap-8 justify-center flex-wrap">
                        {node.children!.map((child, idx) => (
                            <div key={idx} className="flex flex-col items-center relative">
                                {/* Top Connector for child */}
                                <div className="absolute -top-4 w-px h-4 bg-gray-300"></div>
                                {/* Horizontal Connector if multiple siblings - simplified via CSS mostly, 
                                    but for a pure recursive flex, we just stack them. 
                                    A true tree needs absolute lines, but this works for "Card" layout. */}
                                <MindMapNode node={child} level={level + 1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
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
            className="absolute left-4 md:left-12 z-50 p-4 rounded-full bg-white border border-gray-100 text-black shadow-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={() => onNavigate(Math.min(items.length - 1, activeIndex + 1))}
            disabled={activeIndex === items.length - 1}
            className="absolute right-4 md:right-12 z-50 p-4 rounded-full bg-white border border-gray-100 text-black shadow-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
          >
            <ArrowRight size={24} />
          </button>
        </>
      )}

      {/* Cards */}
      <div className="relative w-full h-[80vh] flex items-center justify-center transform-style-3d">
        {items.map((item, index) => {
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);
          
          if (absOffset > 2) return null;

          const isActive = offset === 0;
          
          const translateX = offset * 55; 
          const scale = isActive ? 1 : 0.85;
          const rotateY = offset * -25;
          const translateZ = isActive ? 0 : -200;
          const opacity = isActive ? 1 : 0.6;
          const blur = isActive ? 0 : 4;
          const zIndex = 50 - absOffset;

          return (
            <div
              key={index}
              className="absolute w-[95%] md:w-[75%] max-w-4xl h-full transition-all duration-700 ease-out flex items-center justify-center"
              style={{
                transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
                zIndex,
                opacity,
                filter: `blur(${blur}px)`,
              }}
            >
              {/* Card Container - Clean White Look */}
              <div 
                className={`
                    w-full h-full rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col
                    bg-white border border-gray-100
                    transition-all duration-500
                `}
                style={{
                    boxShadow: isActive ? '0 30px 60px -10px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                <div className="w-full h-full relative z-10 overflow-hidden">
                    {item}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

// --- Home / Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  
  // Context & Uploads
  const [contextText, setContextText] = useState<string>('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!prompt.trim() && attachedImages.length === 0) return;
    navigate('/generating', { 
        state: { 
            content: prompt, 
            title: "New Study Kit", 
            context: contextText,
            images: attachedImages
        } 
    });
  };

  const handleFileRead = (file: File, type: 'context' | 'image' | 'text') => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'context') {
            setContextText(prev => prev + "\n\n" + result);
        } else if (type === 'text') {
            setPrompt(result);
        } else if (type === 'image') {
            setAttachedImages(prev => [...prev, result]);
        }
    };
    if (type === 'image') {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
          <div className="absolute -bottom-48 left-1/3 w-96 h-96 bg-purple-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
      </div>

      <div className="max-w-2xl w-full text-center z-10 space-y-8 relative">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-8">
           What do you want to learn?
        </h1>

        <div 
          className={`
            relative bg-white rounded-[2rem] border border-gray-200 shadow-lg transition-all duration-300
            hover:shadow-xl hover:border-gray-300
            flex flex-col min-h-[160px] text-left
          `}
        >
          {/* Main Input Area */}
          <div className="flex-1 p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything..."
              className="w-full h-full bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400 resize-none"
              style={{ minHeight: '80px' }}
            />
          </div>
          
           {/* Context Chips Positioned Above Toolbar */}
             {(contextText || attachedImages.length > 0) && (
                 <div className="px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                     {contextText && (
                         <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium shrink-0">
                             <AtSign size={12} /> Context Added
                             <button onClick={() => setContextText('')} className="ml-1 hover:text-purple-900"><X size={10}/></button>
                         </div>
                     )}
                     {attachedImages.map((_, i) => (
                         <div key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium shrink-0">
                             <ImageIcon size={12} /> Image {i+1}
                             <button onClick={() => setAttachedImages(prev => prev.filter((__, idx) => idx !== i))} className="ml-1 hover:text-blue-900"><X size={10}/></button>
                         </div>
                     ))}
                 </div>
             )}

          {/* Action Toolbar */}
          <div className="px-4 pb-4 flex items-center justify-between">
            
            {/* Left Tools */}
            <div className="flex items-center gap-2">
                {/* Hidden Inputs */}
                <input type="file" ref={fileInputRef} accept=".txt,.md,.js,.py,.html,.css,.json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], 'text')} />
                <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], 'image')} />
                <input type="file" ref={contextInputRef} accept=".txt,.md" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], 'context')} />

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Upload File"
                >
                    <Paperclip size={20} strokeWidth={1.5} />
                </button>
                
                 <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" 
                    title="Image"
                >
                     <ImageIcon size={20} strokeWidth={1.5} />
                 </button>

                 <button 
                    onClick={() => contextInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" 
                    title="Context"
                >
                     <AtSign size={20} strokeWidth={1.5} />
                 </button>
            </div>
            
             {/* Right Tools */}
            <div className="flex items-center gap-3">
               <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                  <Mic size={22} strokeWidth={1.5} />
               </button>

                <button
                onClick={handleCreate}
                disabled={!prompt.trim() && attachedImages.length === 0}
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${(!prompt.trim() && attachedImages.length === 0) ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:scale-105 shadow-md'}
                `}
                >
                <ArrowUp size={20} strokeWidth={2.5} />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Generation / Loading Screen ---
const LoadingScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { content: string, title: string, context?: string, images?: string[] };
  const [step, setStep] = useState(0);

  const steps = [
    { title: "Analyzing Content", desc: "Processing your inputs...", icon: <FileText size={40} /> },
    { title: "Building Concepts", desc: "Mapping out the knowledge tree...", icon: <Network size={40} /> },
    { title: "Drafting Guide", desc: "Summarizing key points...", icon: <Layout size={40} /> },
    { title: "Creating Flashcards", desc: "Generating active recall cards...", icon: <BookOpen size={40} /> },
    { title: "Finalizing Quiz", desc: "Preparing your assessment...", icon: <Brain size={40} /> },
    { title: "Ready", desc: "Your study kit is ready!", icon: <CheckCircle2 size={40} /> }
  ];

  useEffect(() => {
    if (!state?.content && (!state?.images || state.images.length === 0)) {
      navigate('/');
      return;
    }

    const process = async () => {
      try {
        const newMaterial = {
          id: `mat-${Date.now()}`,
          title: state.title || "Untitled Study Kit",
          content: state.content,
          context: state.context,
          images: state.images,
          type: 'text' as const,
          createdAt: Date.now()
        };
        saveMaterial(newMaterial);
        
        const stepInterval = setInterval(() => {
          setStep(prev => Math.min(prev + 1, steps.length - 1));
        }, 1200);

        // Parallel execution for speed
        const [summary, cards, quiz, conceptMap] = await Promise.all([
             generateSummary(state.content, state.context, state.images),
             generateFlashcards(state.content, state.context, state.images),
             generateQuiz(state.content, state.context, state.images),
             generateConceptMap(state.content, state.context, state.images)
        ]);

        saveFlashcards(newMaterial.id, cards);
        saveConceptMap(newMaterial.id, conceptMap);
             
        clearInterval(stepInterval);
        setStep(steps.length - 1);
        
        setTimeout(() => {
           navigate(`/study/${newMaterial.id}`, { state: { 
               preloadedSummary: summary,
               preloadedQuiz: quiz,
               preloadedMap: conceptMap
           }});
        }, 800);

      } catch (error) {
        console.error(error);
        alert("Something went wrong with AI generation.");
        navigate('/');
      }
    };

    process();
  }, []);

  const stepCards = steps.map((s, index) => (
      <div key={index} className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-transparent">
          <div className={`
            w-24 h-24 mb-8 rounded-full flex items-center justify-center
            ${index === step ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}
            transition-colors duration-500 shadow-xl
          `}>
                {index === step ? <div className="animate-pulse">{s.icon}</div> : s.icon}
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">{s.title}</h2>
          <p className="text-gray-600 text-lg">{s.desc}</p>
          
          <div className="mt-12 w-64 h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
              <div 
                  className={`h-full bg-black transition-all duration-1000 ease-out`}
                  style={{ width: index < step ? '100%' : index === step ? '60%' : '0%' }}
              />
          </div>
      </div>
  ));

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Decor (Matching Landing) */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none">
            <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
            <div className="absolute -bottom-48 left-1/3 w-96 h-96 bg-purple-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
            <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-200 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
        </div>

        <Carousel3D 
            activeIndex={step} 
            onNavigate={() => {}} 
            loading={true}
            items={stepCards} 
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
                        <p className="text-gray-500 mb-6">You haven't created any study kits yet.</p>
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
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Data Containers
  const [summary, setSummary] = useState(location.state?.preloadedSummary || '');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(location.state?.preloadedQuiz || []);
  const [conceptMap, setConceptMap] = useState<ConceptMapNode | null>(location.state?.preloadedMap || null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    const mats = getMaterials();
    const found = mats.find(m => m.id === id);
    if (found) {
      setMaterial(found);
      
      const savedCards = getFlashcards(found.id);
      if (savedCards.length > 0) setFlashcards(savedCards);
      
      const savedMap = getConceptMap(found.id);
      if (savedMap) setConceptMap(savedMap);

      if (!summary && !loadingSummary) {
          setLoadingSummary(true);
          generateSummary(found.content, found.context, found.images).then(res => {
              setSummary(res);
              setLoadingSummary(false);
          });
      }
      if (!conceptMap && !savedMap) {
          generateConceptMap(found.content, found.context, found.images).then(res => {
              setConceptMap(res);
              saveConceptMap(found.id, res);
          });
      }
    } else {
        const timer = setTimeout(() => {
            const retryMats = getMaterials();
            const retryFound = retryMats.find(m => m.id === id);
            if (retryFound) {
                setMaterial(retryFound);
            } else {
                navigate('/');
            }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [id]);

  if (!material) {
    return (
        <div className="h-screen w-screen bg-white flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-gray-300 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Loading Study Kit...</p>
        </div>
    );
  }

  const slides = [
    // Slide 1: Concept Map (Big Picture)
    <div key="map" className="w-full h-full flex flex-col p-8 md:p-10 overflow-hidden">
        <div className="flex items-center gap-4 mb-4 shrink-0 justify-center">
            <div className="p-3 bg-gray-100 rounded-full text-black"><Network size={24} /></div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">Concept Map</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Visual Knowledge Hierarchy</p>
        
        <div className="flex-1 overflow-auto no-scrollbar flex items-start justify-center pt-10">
            {conceptMap ? (
                <MindMapNode node={conceptMap} />
            ) : (
                <div className="text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Mapping concepts...</div>
            )}
        </div>
    </div>,

    // Slide 2: Summary (Study Guide)
    <div key="summary" className="w-full h-full flex flex-col p-8 md:p-10 overflow-hidden">
        <div className="flex items-center gap-4 mb-4 shrink-0 justify-center">
            <div className="p-3 bg-gray-100 rounded-full text-black"><FileText size={24} /></div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">Study Guide</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Key concepts & details</p>
        
        <div className="flex-1 overflow-y-auto no-scrollbar pr-4 mask-fade-bottom">
            {loadingSummary ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                    <Loader2 className="animate-spin" size={32} /> Analyzing text...
                </div>
            ) : (
                <div className="prose prose-lg md:prose-xl prose-headings:font-extrabold prose-p:text-gray-600 max-w-none text-gray-800 prose-mark:bg-yellow-100 prose-mark:text-yellow-900 prose-mark:px-1 prose-mark:rounded-md prose-strong:font-extrabold prose-strong:text-black">
                    <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
                </div>
            )}
        </div>
    </div>,

    // Slide 3: Flashcards
    <div key="cards" className="w-full h-full flex flex-col p-8 md:p-10">
        <div className="flex items-center gap-4 mb-4 shrink-0 justify-center">
             <div className="p-3 bg-gray-100 rounded-full text-black"><BookOpen size={24} /></div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">Flashcards</h2>
        <p className="text-gray-400 text-sm text-center mb-6">{flashcards.length} cards</p>

        <div className="flex-1 flex items-center justify-center relative">
             <FlashcardDeck cards={flashcards} onUpdateCard={(updated) => {
                const newCards = flashcards.map(c => c.id === updated.id ? updated : c);
                setFlashcards(newCards);
                saveFlashcards(material.id, newCards);
            }} />
        </div>
    </div>,

    // Slide 4: Quiz
    <div key="quiz" className="w-full h-full flex flex-col p-8 md:p-10">
         <div className="flex items-center gap-4 mb-4 shrink-0 justify-center">
            <div className="p-3 bg-gray-100 rounded-full text-black"><Brain size={24} /></div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">10-Min Quiz</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Test your knowledge</p>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
             {quizQuestions.length > 0 ? (
                 <QuizRunner questions={quizQuestions} materialId={material.id} onComplete={() => {}} />
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">Loading Quiz...</div>
             )}
        </div>
    </div>
  ];

  return (
    <div className="h-screen w-screen bg-white flex flex-col pt-20 overflow-hidden relative">
        <div className="px-6 pb-2 text-center relative z-10">
            <h1 className="text-xl font-bold text-gray-900">{material.title}</h1>
        </div>
        <div className="flex-1 relative z-10">
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
           <Route path="/workspace" element={<Workspace />} />
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
