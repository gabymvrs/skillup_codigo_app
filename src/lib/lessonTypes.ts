import type { LearningInputs } from "./guidedLearning";
import type { ExerciseAnswer } from "./types";
export interface LessonDynamic {
  kind:
    | "applied"
    | "case"
    | "creation"
    | "visual"
    | "podcast"
    | "simulation"
    | "trace";
  title: string;
  prompt: string;
  criteria: string[];
  minLength: number;
  audioUrl?: string;
  transcript?: string;
}
export interface LessonPlan {
  module_id: string;
  level: number;
  question_ids: string[];
  dynamic: LessonDynamic;
  resource_ids: string[];
}
export interface LessonResult {
  firstResponse?: ExerciseAnswer;
  response?: ExerciseAnswer;
  expected?: unknown;
  objective?: boolean;
  correct: boolean;
  firstCorrect: boolean;
  tries: number;
  explanation: string;
}
export interface LessonState {
  module_id: string;
  stage: "theory" | "practice" | "dynamic" | "completed";
  results: Record<string, LessonResult>;
  dynamic_response?: {
    text: string;
    checks: boolean[];
    interaction?: LearningInputs;
  };
  draft?: {
    answers?: Record<string, ExerciseAnswer>;
    text?: string;
    checks?: boolean[];
    index?: number;
    savedAt?: number;
    view?: string;
    theoryStep?: number;
    theoryInputs?: LearningInputs;
    interaction?: LearningInputs;
  };
  xp: number;
}
export interface LearningResource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: string;
  embedUrl?: string;
  allowEmbed?: boolean;
}
