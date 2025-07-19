import React, { useState, useEffect, useRef } from 'react';
import { BarChart, BookCopy, Users, Settings, ChevronDown, ChevronRight, Search, PlusCircle, Filter, FileDown, Edit, Trash2, Eye, X, UploadCloud, Wand2, FileText, CheckCircle, RefreshCw, AlertTriangle, LogIn, Save, User, UserCheck, Clock, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Firebase/Vercel Configuration ---
// This code is now adapted for Vercel deployment.
// It will read environment variables you set in your Vercel project dashboard.
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG) : {};
const appId = process.env.REACT_APP_ID || 'default-app-id';

// --- Initialize Firebase ---
let app;
let auth;
let db;

try {
    if (Object.keys(firebaseConfig).length > 0) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase config is missing. Please set REACT_APP_FIREBASE_CONFIG environment variable.");
    }
} catch (e) {
    console.error("Firebase initialization error:", e);
}


// Helper Components
const Icon = ({ name, className }) => {
  const icons = {
    BarChart, BookCopy, Users, Settings, ChevronDown, ChevronRight, Search, PlusCircle, Filter, FileDown, Edit, Trash2, Eye, X, UploadCloud, Wand2, FileText, CheckCircle, RefreshCw, AlertTriangle, LogIn, Save, User, UserCheck, Clock, ArrowLeft, ArrowRight, Send
  };
  const LucideIcon = icons[name];
  return LucideIcon ? <LucideIcon className={className || "w-5 h-5"} /> : null;
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-[100] ${colors[type]}`}>
            <Icon name={type === 'success' ? 'CheckCircle' : 'AlertTriangle'} className="mr-3" />
            {message}
            <button onClick={onClose} className="ml-4 font-bold">X</button>
        </div>
    );
};

// #region Professor Components
const Sidebar = ({ activeView, setActiveView, userData }) => {
  return (
    <aside className="w-64 bg-gray-800 text-gray-300 flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Sistema ENADE IA</h1>
        <p className="text-sm text-gray-400">Portal do Professor</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a key="dashboard" href="#" onClick={() => setActiveView('dashboard')} className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><Icon name="BarChart" className="mr-3" /><span>Dashboard</span></a>
        <a key="provas" href="#" onClick={() => setActiveView('provas')} className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${activeView === 'provas' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><Icon name="BookCopy" className="mr-3" /><span>Provas</span></a>
      </nav>
      <div className="p-4 border-t border-gray-700">
        {userData ? (
            <div className="flex items-center"><img src={userData.avatarUrl} alt="Avatar do usuário" className="w-10 h-10 rounded-full" /><div className="ml-3"><p className="font-semibold text-white">{userData.name}</p><p className="text-sm text-gray-400">{userData.role}</p></div></div>
        ) : (
            <div className="flex items-center text-gray-400"><Icon name="LogIn" className="mr-3"/><span>Autenticando...</span></div>
        )}
      </div>
    </aside>
  );
};

const Header = ({ title, onGenerateClick }) => {
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <button onClick={onGenerateClick} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"><Icon name="PlusCircle" className="mr-2" />Gerar Nova Prova</button>
    </header>
  );
};

const DashboardView = () => {
    const StatCard = ({ title, value, icon, color }) => (<div className="bg-white p-6 rounded-xl shadow-md flex items-center"><div className={`p-3 rounded-full mr-4 ${color}`}><Icon name={icon} className="text-white" /></div><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div>);
    return (<div className="p-6 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="Provas Criadas" value="12" icon="BookCopy" color="bg-blue-500" /><StatCard title="Média Geral da Turma" value="7.8" icon="Users" color="bg-green-500" /><StatCard title="Questões no Banco" value="457" icon="BarChart" color="bg-yellow-500" /><StatCard title="Provas Agendadas" value="3" icon="Settings" color="bg-red-500" /></div></div>);
};

const ProvasView = ({ provas, isLoading }) => {
    const getTypeBadge = (tipo) => ({'Disciplina': 'border-purple-500 text-purple-500', 'Integradora': 'border-indigo-500 text-indigo-500', 'ENADE': 'border-red-500 text-red-500'}[tipo] || 'border-gray-500 text-gray-500');
    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Prova</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data Criação</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (<tr><td colSpan="5" className="text-center py-10">Carregando provas...</td></tr>) : provas.length === 0 ? (<tr><td colSpan="5" className="text-center py-10 text-gray-500">Nenhuma prova encontrada.</td></tr>) : (provas.map((prova) => (<tr key={prova.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{prova.name}</div><div className="text-sm text-gray-500">{prova.discipline}</div></td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getTypeBadge(prova.type)}`}>{prova.type}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prova.createdAt ? new Date(prova.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Rascunho</span></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end space-x-4"><button className="text-blue-600 hover:text-blue-900"><Icon name="Eye" /></button><button className="text-yellow-600 hover:text-yellow-900"><Icon name="Edit" /></button><button className="text-red-600 hover:text-red-900"><Icon name="Trash2" /></button></div></td></tr>)))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GerarProvaModal = ({ isOpen, onClose, userId, showToast }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [error, setError] = useState(null);
    const [provaDetails, setProvaDetails] = useState({ name: '', type: 'Disciplina', discipline: 'Engenharia de Requisitos' });
    const [syllabusText, setSyllabusText] = useState('');
    const [difficulty, setDifficulty] = useState({ easy: 3, medium: 4, hard: 3 });
    const totalQuestions = difficulty.easy + difficulty.medium + difficulty.hard;
    const handleDetailChange = (e) => setProvaDetails({ ...provaDetails, [e.target.id]: e.target.value });
    const handleDifficultyChange = (e) => setDifficulty({ ...difficulty, [e.target.id]: parseInt(e.target.value, 10) || 0 });
    const buildPrompt = () => `**Persona:** Você é um examinador especialista... **Contexto:** ... ${syllabusText} ... **Tarefa:** Gere ${totalQuestions} questões...`;
    
    const handleGenerate = async () => {
        setIsGenerating(true); setError(null); setGeneratedQuestions([]);
        
        // This is where we use the Gemini API Key from the environment variables set in Vercel
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            showToast("Chave da API do Gemini não configurada.", "error");
            setIsGenerating(false);
            return;
        }

        const prompt = buildPrompt();
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { stem: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, correct_index: { type: "INTEGER" }, difficulty: { type: "STRING" }, bloom_level: { type: "STRING" }, topic: { type: "STRING" } }, required: ["stem", "options", "correct_index", "difficulty", "bloom_level", "topic"] } } } };
        
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) setGeneratedQuestions(JSON.parse(result.candidates[0].content.parts[0].text));
            else throw new Error("A resposta da IA não continha dados válidos.");
        } catch (err) { setError(err.message); showToast(`Erro na geração: ${err.message}`, 'error'); } finally { setIsGenerating(false); }
    };
    
    const handleSaveProva = async () => {
        if (!userId) { showToast("Erro: Usuário não autenticado.", "error"); return; }
        if (generatedQuestions.length === 0) { showToast("Gere as questões antes de salvar.", "error"); return; }
        setIsSaving(true);
        try {
            const provasCollectionPath = `/artifacts/${appId}/public/data/provas`;
            await addDoc(collection(db, provasCollectionPath), { ...provaDetails, questions: generatedQuestions, ownerId: userId, createdAt: serverTimestamp() });
            showToast("Prova salva com sucesso!", "success"); onClose();
        } catch (err) { console.error("Error saving document: ", err); showToast(`Erro ao salvar: ${err.message}`, "error"); } finally { setIsSaving(false); }
    };
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"><header className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">Gerador de Provas IA</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><Icon name="X" /></button></header><main className="p-8 flex-1">{currentStep === 1 ? "Step1" : currentStep === 2 ? "Step2" : "Step3"}</main><footer className="p-4 bg-gray-50 border-t rounded-b-2xl flex justify-between"><button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1} className="px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">Voltar</button><div>{currentStep < 3 && <button onClick={() => { if(currentStep === 2) handleGenerate(); setCurrentStep(s => s + 1); }} disabled={currentStep === 2 && !syllabusText.trim()} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">{currentStep === 1 ? 'Avançar' : 'Gerar Prova'}</button>}{currentStep === 3 && (<div className="flex space-x-3"><button onClick={handleGenerate} disabled={isGenerating} className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"><Icon name="RefreshCw" className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />Gerar Novamente</button><button onClick={handleSaveProva} disabled={isSaving || generatedQuestions.length === 0} className="flex items-center px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"><Icon name="Save" className={`mr-2 ${isSaving ? 'animate-spin' : ''}`} />Salvar Prova</button></div>)}</div></footer></div></div>);
};

function ProfessorApp({ user, userData, showToast }) {
    const [activeView, setActiveView] = useState('provas');
    const [showGerarProvaModal, setShowGerarProvaModal] = useState(false);
    const [provas, setProvas] = useState([]);
    const [isLoadingProvas, setIsLoadingProvas] = useState(true);

    useEffect(() => {
        if (!user || !db) return;
        setIsLoadingProvas(true);
        const provasCollectionPath = `/artifacts/${appId}/public/data/provas`;
        const q = query(collection(db, provasCollectionPath), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const provasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProvas(provasData);
            setIsLoadingProvas(false);
        }, (error) => {
            console.error("Error fetching professor's provas: ", error);
            showToast("Erro ao carregar provas.", "error");
            setIsLoadingProvas(false);
        });
        return () => unsubscribe();
    }, [user, showToast]);

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView />;
            case 'provas': return <ProvasView provas={provas} isLoading={isLoadingProvas} />;
            default: return <div className="p-6">Conteúdo para {activeView}</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} userData={userData} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={activeView.charAt(0).toUpperCase() + activeView.slice(1)} onGenerateClick={() => setShowGerarProvaModal(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">{renderView()}</main>
            </div>
            {showGerarProvaModal && <GerarProvaModal isOpen={showGerarProvaModal} onClose={() => setShowGerarProvaModal(false)} userId={user?.uid} showToast={showToast} />}
        </div>
    );
}
// #endregion

// #region Aluno Components
const ExamTaker = ({ prova, studentName, onFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(prova.questions.length).fill(null));
    const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutos em segundos

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSelectAnswer = (optionIndex) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        let score = 0;
        prova.questions.forEach((q, index) => {
            if (answers[index] === q.correct_index) {
                score++;
            }
        });
        onFinish(score, prova.questions.length, answers);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const currentQuestion = prova.questions[currentQuestionIndex];

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col p-4 md:p-8">
            <header className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">{prova.name}</h1>
                    <p className="text-sm text-gray-500">{prova.discipline}</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center text-lg font-semibold text-blue-600">
                        <Icon name="Clock" className="mr-2" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 mr-3">
                            {studentName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700 hidden md:block">{studentName}</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 bg-white rounded-xl shadow-md p-6 md:p-8 flex flex-col">
                <div className="mb-4">
                    <p className="text-sm font-semibold text-blue-600">QUESTÃO {currentQuestionIndex + 1} DE {prova.questions.length}</p>
                    <h2 className="text-lg md:text-xl mt-2 text-gray-800 leading-relaxed">{currentQuestion.stem}</h2>
                </div>
                <div className="flex-1 space-y-4 mt-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelectAnswer(index)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center
                                ${answers[currentQuestionIndex] === index
                                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full mr-4 flex-shrink-0 flex items-center justify-center font-bold text-sm
                                ${answers[currentQuestionIndex] === index
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-300 text-gray-600'
                                }`}>
                                {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-gray-700">{option}</span>
                        </button>
                    ))}
                </div>
                <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <button onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0} className="flex items-center px-6 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="ArrowLeft" className="mr-2"/>Anterior</button>
                    {currentQuestionIndex === prova.questions.length - 1 ? (
                        <button onClick={handleSubmit} className="flex items-center px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-lg"><Icon name="Send" className="mr-2"/>Finalizar Prova</button>
                    ) : (
                        <button onClick={() => setCurrentQuestionIndex(i => i + 1)} className="flex items-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"><Icon name="ArrowRight" className="mr-2"/>Próxima</button>
                    )}
                </footer>
            </main>
        </div>
    );
};

const ResultsView = ({ score, total, provaName, onBackToDashboard }) => {
    const percentage = Math.round((score / total) * 100);
    const isApproved = percentage >= 60;

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 text-center">
                <Icon name={isApproved ? "CheckCircle" : "AlertTriangle"} className={`mx-auto h-20 w-20 ${isApproved ? 'text-green-500' : 'text-red-500'}`} />
                <h1 className="text-3xl font-bold text-gray-800 mt-6">Prova Finalizada!</h1>
                <p className="text-gray-500 mt-2">Confira seu desempenho em "{provaName}"</p>
                <div className="my-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <p className="text-lg text-gray-600">Sua Pontuação</p>
                    <p className={`text-6xl font-bold my-2 ${isApproved ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</p>
                    <p className="text-lg text-gray-600">Você acertou {score} de {total} questões.</p>
                </div>
                <button onClick={onBackToDashboard} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Voltar para o Painel
                </button>
            </div>
        </div>
    );
};


function StudentApp({ user, userData, showToast }) {
    const [provas, setProvas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentProva, setCurrentProva] = useState(null);
    const [results, setResults] = useState(null);

    useEffect(() => {
        if (!user || !db) return;
        const provasCollectionPath = `/artifacts/${appId}/public/data/provas`;
        const q = query(collection(db, provasCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const provasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProvas(provasData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching provas for student: ", error);
            showToast("Erro ao carregar provas.", "error");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, showToast]);
    
    const handleFinishExam = (score, total, answers) => {
        setResults({ score, total, provaName: currentProva.name });
        setCurrentProva(null);
    };
    
    if (currentProva) {
        return <ExamTaker prova={currentProva} studentName={userData.name} onFinish={handleFinishExam} />;
    }

    if (results) {
        return <ResultsView {...results} onBackToDashboard={() => setResults(null)} />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Portal do Aluno</h1>
                    {userData && <div className="font-semibold">{userData.name}</div>}
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Minhas Provas</h2>
                    {isLoading ? (
                        <p>Carregando provas...</p>
                    ) : (
                        <div className="space-y-4">
                            {provas.map(prova => (
                                <div key={prova.id} className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{prova.name}</h3>
                                        <p className="text-sm text-gray-500">{prova.discipline}</p>
                                    </div>
                                    <button onClick={() => setCurrentProva(prova)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                                        Iniciar Prova
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
// #endregion

export default function App() {
  const [userRole, setUserRole] = useState(null); // 'professor' or 'aluno'
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => setToast({ message, type, id: Date.now() });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const userDocRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}`);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                const defaultName = userRole === 'professor' ? 'Prof. Ricardo Almeida' : 'Aluno Exemplo';
                const defaultRole = userRole === 'professor' ? 'Professor' : 'Aluno';
                const newUser = { name: defaultName, role: defaultRole, avatarUrl: `https://placehold.co/100x100/E2E8F0/4A5568?text=${defaultName.split(' ').map(n=>n[0]).join('')}` };
                await setDoc(userDocRef, newUser);
                setUserData(newUser);
            } else {
                setUserData(userDocSnap.data());
            }
        } else {
             // In a real Vercel deployment, you would handle login differently.
             // For this demo, we'll continue with anonymous sign-in.
             signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed", err));
        }
    });
    return () => unsubscribe();
  }, [userRole]);

  if (!userRole) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center bg-white p-12 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-gray-800">Bem-vindo ao Sistema ENADE IA</h1>
                <p className="text-gray-500 mt-2 mb-8">Por favor, selecione seu perfil para continuar.</p>
                <div className="flex justify-center space-x-6">
                    <button onClick={() => setUserRole('professor')} className="flex flex-col items-center p-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-2 border-transparent hover:border-blue-500 transition-all w-48">
                        <Icon name="UserCheck" className="w-16 h-16 text-blue-600 mb-4" />
                        <span className="text-xl font-semibold text-blue-800">Professor</span>
                    </button>
                    <button onClick={() => setUserRole('aluno')} className="flex flex-col items-center p-8 rounded-lg bg-green-50 hover:bg-green-100 border-2 border-transparent hover:border-green-500 transition-all w-48">
                        <Icon name="User" className="w-16 h-16 text-green-600 mb-4" />
                        <span className="text-xl font-semibold text-green-800">Aluno</span>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <>
        {userRole === 'professor' && <ProfessorApp user={user} userData={userData} showToast={showToast} />}
        {userRole === 'aluno' && <StudentApp user={user} userData={userData} showToast={showToast} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
