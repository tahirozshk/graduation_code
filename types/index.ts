export interface Lecture {
  id: string;
  title: string;
  topic: string;
  date: string;
  resources?: Resource[];
}

export interface Resource {
  id: string;
  lectureId: string;
  type: 'pdf' | 'slide' | 'video' | 'link';
  title: string;
  url: string;
}

export interface StudentMark {
  lectureId: string;
  score: number; // 0-100
  attempts: number;
}

export interface QuizQuestion {
  id: string;
  lectureId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExamRecord {
  id: string;
  title: string;
  date: string;
  marks: {
    lectureId: string;
    score: number;
  }[];
}

export interface PracticeSession {
  topic: string;
  lectureId: string;
  questions: QuizQuestion[];
  recommendationReason: string;
}
