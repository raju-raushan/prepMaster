import React from 'react';
import { FeedbackData } from '../types';
import { CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface FeedbackCardProps {
  data: FeedbackData;
  onRestart: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ data, onRestart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto w-full border border-slate-100">
      <div className="bg-slate-900 p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Session Analysis</h2>
        <p className="text-slate-400">Here is your comprehensive performance report.</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreBox title="Visual" score={data.visualScore} color="bg-blue-500" />
          <ScoreBox title="Verbal" score={data.verbalScore} color="bg-indigo-500" />
          <ScoreBox title="Content" score={data.contentScore} color="bg-emerald-500" />
        </div>

        {/* Summary */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            Executive Summary
          </h3>
          <p className="text-slate-700 leading-relaxed">{data.summary}</p>
        </div>

        {/* Improvements */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Key Improvements Needed
          </h3>
          <div className="grid gap-3">
            {data.keyImprovements.map((imp, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                 <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
                   {idx + 1}
                 </span>
                 <p className="text-slate-800 text-sm">{imp}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
};

const ScoreBox = ({ title, score, color }: { title: string; score: number; color: string }) => (
  <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
    <span className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{title}</span>
    <div className="relative w-24 h-24 flex items-center justify-center">
       {/* Ring Background */}
       <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
       {/* Progress Ring (Simulated) */}
       <div 
         className={`absolute inset-0 rounded-full border-4 ${color.replace('bg-', 'border-')} opacity-20`}
       ></div>
       <span className={`text-3xl font-bold ${color.replace('bg-', 'text-')}`}>
         {score}
       </span>
    </div>
  </div>
);
