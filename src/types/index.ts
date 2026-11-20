export type Role = "user" | "admin";
export type UserStatus = "active" | "disabled";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  theme: "light" | "dark";
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  intro: string;
  tips: string[];
  color: string;
  background: string;
  order: number;
}

export interface QuizQuestion {
  id: string;
  lessonSlug: string;
  sender: string;
  message: string;
  scam: boolean;
  explanation: string;
  order: number;
}

export type SimulationKind = "conversation" | "inspection";
export interface Simulation {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: SimulationKind;
  data: Record<string, unknown>;
  order: number;
}

export interface Progress {
  completed: string[];
  favorites: string[];
  lastLesson: string | null;
  quizAttempts: number;
  simulationAttempts: number;
  bestQuiz: { score: number; total: number } | null;
}

export interface ApiError { error: { code: string; message: string; fields?: Record<string, string[]> } }
