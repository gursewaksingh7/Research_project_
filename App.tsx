import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RoleSelector } from './components/RoleSelector';
import { TranscriptList } from './components/TranscriptList';
import { StudentLiveCaption } from './components/StudentLiveCaption';
import { MicIcon, MicOffIcon, UsersIcon, DownloadIcon, TranslateIcon } from './components/Icons';
import { Role, User, TranscriptItem } from './types';
import { SpeechRecognitionService } from './services/speechService';
import { translateText } from './services/geminiService';

function App() {
  const [role, setRole] = useState<Role>(Role.NONE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLang, setSourceLang] = useState<'en' | 'hi'>('en');
  const [studentViewMode, setStudentViewMode] = useState<'original' | 'translated' | 'both'>('both');

  // References for services
  const speechService = useRef<SpeechRecognitionService | null>(null);

  // Mock initial participants for demo feel
  useEffect(() => {
    if (role === Role.TEACHER) {
        setParticipants([
            { id: '2', name: 'Rahul Sharma', role: Role.STUDENT, isOnline: true, isSpeaking: false },
            { id: '3', name: 'Priya Patel', role: Role.STUDENT, isOnline: true, isSpeaking: false },
            { id: '4', name: 'Amit Kumar', role: Role.STUDENT, isOnline: true, isSpeaking: false },
        ]);
    }
  }, [role]);

  // Handle Speech Result
  const handleSpeechResult = useCallback(async (text: string, isFinal: boolean) => {
    if (!currentUser) return;

    // Create a temp ID for interim results or use new ID for final
    const currentId = isFinal ? Date.now().toString() : 'temp-current';

    setTranscripts(prev => {
      // Remove previous temp result if exists
      const cleanPrev = prev.filter(t => t.id !== 'temp-current');
      
      const newItem: TranscriptItem = {
        id: currentId,
        speakerId: currentUser.id,
        speakerName: currentUser.name,
        timestamp: Date.now(),
        originalText: text,
        translatedText: '', // Filled later
        originalLang: sourceLang,
        isFinal: isFinal
      };
      
      return [...cleanPrev, newItem];
    });

    if (isFinal) {
       // Trigger translation
       const translation = await translateText(text, sourceLang);
       setTranscripts(prev => prev.map(t => 
          t.id === currentId ? { ...t, translatedText: translation } : t
       ));
    }
  }, [currentUser, sourceLang]);

  // Initialize Speech Service
  useEffect(() => {
    speechService.current = new SpeechRecognitionService(
        handleSpeechResult,
        () => setIsRecording(false),
        sourceLang
    );
    return () => {
        speechService.current?.stop();
    };
  }, [handleSpeechResult, sourceLang]);

  const toggleRecording = () => {
    if (isRecording) {
        speechService.current?.stop();
        setIsRecording(false);
    } else {
        speechService.current?.start();
        setIsRecording(true);
    }
  };

  const handleRoleSelect = (selectedRole: Role, name: string) => {
    setRole(selectedRole);
    setCurrentUser({
        id: '1',
        name: name,
        role: selectedRole,
        isOnline: true,
        isSpeaking: false
    });
  };

  const downloadTranscript = () => {
    const content = transcripts
        .filter(t => t.isFinal)
        .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speakerName}: ${t.originalText} \n(Trans: ${t.translatedText})\n`)
        .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClassSync_Transcript_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const changeLanguage = (lang: 'en' | 'hi') => {
      setSourceLang(lang);
      speechService.current?.updateLang(lang);
  };

  // --- Views ---

  if (role === Role.NONE) {
    return <RoleSelector onSelect={handleRoleSelect} />;
  }

  // Common Header
  const Header = () => (
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <h1 className="font-bold text-slate-800 text-lg">ClassSync <span className="text-slate-400 font-normal">| {role === Role.TEACHER ? 'Teacher View' : 'Student View'}</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
               {/* Language Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${sourceLang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      ENG
                  </button>
                  <button 
                    onClick={() => changeLanguage('hi')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${sourceLang === 'hi' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      HIN
                  </button>
              </div>

              {/* Mic Control */}
              <button 
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isRecording ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
              >
                  {isRecording ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
                  {isRecording ? 'Stop Mic' : 'Start Mic'}
              </button>
          </div>
      </header>
  );

  // TEACHER LAYOUT
  if (role === Role.TEACHER) {
      return (
          <div className="flex flex-col h-screen bg-slate-50">
              <Header />
              <div className="flex flex-1 overflow-hidden">
                  {/* Sidebar */}
                  <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                      <div className="p-4 border-b border-slate-100">
                          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <UsersIcon className="w-4 h-4" /> Participants ({participants.length + 1})
                          </h2>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                          <div className="p-2 flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-100 mb-2">
                             <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold">YOU</div>
                             <div>
                                 <p className="text-sm font-medium text-slate-900">{currentUser?.name}</p>
                                 <p className="text-xs text-indigo-600">Broadcasting</p>
                             </div>
                          </div>
                          {participants.map(p => (
                              <div key={p.id} className="p-2 flex items-center gap-3 rounded-lg hover:bg-slate-50">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">{p.name.charAt(0)}</div>
                                  <div>
                                      <p className="text-sm font-medium text-slate-700">{p.name}</p>
                                      <p className="text-xs text-slate-400">{p.isOnline ? 'Online' : 'Offline'}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="p-4 border-t border-slate-100">
                          <button 
                            onClick={downloadTranscript}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                              <DownloadIcon className="w-4 h-4" /> Download
                          </button>
                      </div>
                  </div>

                  {/* Main Transcript Area */}
                  <div className="flex-1 flex flex-col bg-slate-50 relative">
                      <div className="absolute top-4 left-0 right-0 z-0 flex justify-center pointer-events-none opacity-5">
                          <TranslateIcon className="w-64 h-64 text-slate-900" />
                      </div>
                      <TranscriptList transcripts={transcripts} viewMode="split" />
                  </div>
              </div>
          </div>
      );
  }

  // STUDENT LAYOUT
  return (
      <div className="flex flex-col h-screen bg-slate-50">
          <Header />
          <div className="flex-1 flex flex-col relative overflow-hidden">
              {/* Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl p-1 flex gap-1">
                  <button 
                    onClick={() => setStudentViewMode('original')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${studentViewMode === 'original' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                      Original
                  </button>
                  <button 
                    onClick={() => setStudentViewMode('both')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${studentViewMode === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                      Split
                  </button>
                  <button 
                    onClick={() => setStudentViewMode('translated')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${studentViewMode === 'translated' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                      Translated
                  </button>
              </div>

              {/* Live Caption Display */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <StudentLiveCaption lastItem={transcripts.length > 0 ? transcripts[transcripts.length - 1] : null} mode={studentViewMode} />
              </div>
              
              {/* History Teaser (Mobile Friendly) */}
              <div className="h-1/3 border-t border-slate-200 bg-white overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transcript History</span>
                      <button onClick={downloadTranscript} className="text-indigo-600 hover:text-indigo-800">
                          <DownloadIcon className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <TranscriptList transcripts={transcripts} viewMode="translated" />
                  </div>
              </div>
          </div>
      </div>
  );
}

export default App;