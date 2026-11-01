export interface LessonDynamic {
  kind: "applied" | "case" | "creation" | "visual" | "podcast" | "simulation";
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
  correct: boolean;
  firstCorrect: boolean;
  tries: number;
  explanation: string;
}
export interface LessonState {
  module_id: string;
  stage: "theory" | "practice" | "dynamic" | "completed";
  results: Record<string, LessonResult>;
  dynamic_response?: { text: string; checks: boolean[] };
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
