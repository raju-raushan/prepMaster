export type SessionMode = 'interview' | 'debate';

export interface SessionConfig {
  mode: SessionMode;
  details: {
    role?: string;
    company?: string;
    topic?: string;
    stance?: 'Pro' | 'Con';
    language?: string;
  };
}

export interface FeedbackData {
  visualScore: number;
  verbalScore: number;
  contentScore: number;
  keyImprovements: string[];
  summary: string;
}

export interface TranscriptionItem {
  role: 'user' | 'model';
  text: string;
}