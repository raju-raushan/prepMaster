import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageSquare, ArrowRight, ShieldCheck, Video } from 'lucide-react';
import { SessionMode } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = (mode: SessionMode) => {
    navigate('/setup', { state: { mode } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              PrepMaster
            </span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition">Features</a>
            <a href="#" className="hover:text-blue-600 transition">About</a>
            <a href="#" className="hover:text-blue-600 transition">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Master Your Next <span className="text-blue-600">Big Moment</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent AI coach that sees, hears, and challenges you. 
            Practice real-time interviews and debates with an opponent who analyzes your 
            verbal and non-verbal performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
              <Video className="w-4 h-4" /> Real-time Video Analysis
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-800 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> Professional Coaching
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Interview Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Mic className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">Interview Practice</h3>
                <p className="text-slate-500 mb-6">
                  Simulate high-pressure job interviews. Specify the company and role, 
                  and get grilled by a strict recruiter persona.
                </p>
                <button 
                  onClick={() => handleStart('interview')}
                  className="inline-flex items-center gap-2 font-semibold text-blue-600 group-hover:gap-3 transition-all"
                >
                  Start Session <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Debate Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group text-left relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">Debate Mode</h3>
                <p className="text-slate-500 mb-6">
                  Sharpen your argumentation skills. Pick a controversial topic and a stance, 
                  and face off against a master logician.
                </p>
                <button 
                  onClick={() => handleStart('debate')}
                  className="inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3 transition-all"
                >
                  Start Session <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} PrepMaster. Powered by Gemini Live API.
        </div>
      </footer>
    </div>
  );
};
