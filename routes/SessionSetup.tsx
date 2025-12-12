import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SessionMode, SessionConfig } from '../types';
import { ArrowLeft, Briefcase, Building, MessageCircle, Scale, Globe } from 'lucide-react';

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Portuguese',
  'Mandarin Chinese',
  'Japanese',
  'Korean'
];

export const SessionSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as { mode: SessionMode })?.mode || 'interview';
  
  const [config, setConfig] = useState<SessionConfig['details']>({
    role: '',
    company: '',
    topic: '',
    stance: 'Pro',
    language: 'English',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionConfig: SessionConfig = {
      mode,
      details: config,
    };
    navigate('/live', { state: { config: sessionConfig } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">
            Configure {mode === 'interview' ? 'Interview' : 'Debate'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Language Selector - Common for both modes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> Language
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900"
              value={config.language}
              onChange={e => setConfig({ ...config, language: e.target.value })}
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {mode === 'interview' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" /> Target Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Product Manager"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={config.role}
                  onChange={e => setConfig({ ...config, role: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" /> Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Startup Inc."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={config.company}
                  onChange={e => setConfig({ ...config, company: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500" /> Debate Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial General Intelligence risks"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  value={config.topic}
                  onChange={e => setConfig({ ...config, topic: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-500" /> Your Stance
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, stance: 'Pro' })}
                    className={`flex-1 py-3 rounded-lg font-medium border transition ${
                      config.stance === 'Pro' 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Pro (For)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, stance: 'Con' })}
                    className={`flex-1 py-3 rounded-lg font-medium border transition ${
                      config.stance === 'Con' 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Con (Against)
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition shadow-lg"
            >
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};