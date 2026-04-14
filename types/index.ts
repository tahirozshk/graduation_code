export interface Course {
  id: string;
  title: string;
  name?: string;
  code?: string;
  courseCode?: string;
  language?: string;
  image?: string;
  description?: string;
  lectures?: Lecture[];
}

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
  lectureId?: string;
  text?: string;
  questionText?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visual?: {
    type: 'formula' | 'graph' | 'image' | 'text';
    value: string;
    label?: string;
  };
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
  courseName?: string;
  courseCode?: string;
  courseLanguage?: string;
  questions: QuizQuestion[];
  recommendationReason: string;
  analysisMetadata?: {
    lectureTitle: string;
    resources: string[];
    studentScore: number;
    lastQuizzes: string[];
  };
  _regenerateContext?: any;
}
