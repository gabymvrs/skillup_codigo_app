export type Role = "estudante" | "docente" | "recrutador" | "instituicao";
export const roleLabels: Record<Role, string> = {
  estudante: "Estudante",
  docente: "Docente",
  recrutador: "Recrutador",
  instituicao: "Instituição",
};
export interface Profile {
  id: string;
  full_name: string;
  avatar_path?: string | null;
  avatar_demo?: string | null;
  headline: string;
  bio: string;
  skills: string[];
  website: string;
  public_profile: boolean;
  preferences: Record<string, boolean | number | string>;
}
export interface UserRole {
  user_id: string;
  role: Role;
  organization_id: string | null;
}
export interface Organization {
  id: string;
  name: string;
  website: string;
}
export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: Role;
  organization_name: string;
  registration_number: string;
  cnae: string;
  status: "pending" | "approved" | "rejected";
  document_paths: string[];
  created_at: string;
}
export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}
export interface Material {
  id: string;
  subject_id: string;
  title: string;
  summary: string;
  body: string;
  kind: "artigo" | "arquivo" | "video" | "slides";
  file_path: string | null;
  allow_offline: boolean;
  published: boolean;
  owner_id: string | null;
  organization_id: string | null;
}
export interface Track {
  difficulty?: string;
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  duration_hours: number;
  owner_id: string | null;
  organization_id: string | null;
  published: boolean;
}
export interface Module {
  question_id?: string | null;
  id: string;
  track_id: string;
  title: string;
  body: string;
  position: number;
  prerequisite_id: string | null;
  xp: number;
}
export interface Progress {
  id: string;
  user_id: string;
  module_id: string;
  completed_at: string;
}
export type ExerciseAnswer =
  number | string | boolean[] | number[] | { text: string; checks: boolean[] };
export type ExerciseKind =
  "choice" | "true_false" | "blank" | "matching" | "ordering" | "challenge";
export interface Question {
  kind?: ExerciseKind;
  subject_id?: string | null;
  payload?: {
    statements?: string[];
    labels?: string[];
    criteria?: string[];
    minLength?: number;
  };
  id: string;
  title: string;
  prompt: string;
  options: string[];
  explanation: string;
  category: string;
  xp: number;
}
export interface Attempt {
  response?: ExerciseAnswer;
  id: string;
  user_id: string;
  question_id: string;
  selected_index: number;
  correct: boolean;
  xp: number;
  created_at: string;
}
export interface Classroom {
  id: string;
  organization_id: string;
  teacher_id: string;
  title: string;
  subject: string;
}
export interface Enrollment {
  id: string;
  class_id: string;
  user_id: string;
  created_at: string;
}
export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  instructions: string;
  due_at: string;
}
export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  body: string;
  grade: number | null;
  feedback: string | null;
  status: "submitted" | "reviewed";
  created_at: string;
}
export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  kind: "feed" | "forum" | "story" | "announcement";
  category: string;
  title: string;
  body: string;
  image: string | null;
  created_at: string;
}
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}
export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
}
export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  status: "open" | "review" | "completed" | "archived";
  image: string | null;
}
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
}
export interface Job {
  id: string;
  owner_id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  description: string;
  skills: string[];
  status: "open" | "paused" | "closed";
  application_url: string | null;
  created_at: string;
}
export interface Application {
  id: string;
  job_id: string;
  student_id: string;
  cover_letter: string;
  status:
    | "submitted"
    | "reviewing"
    | "interview"
    | "accepted"
    | "rejected"
    | "withdrawn";
  created_at: string;
}
export interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
}
export interface Experience {
  id: string;
  user_id: string;
  title: string;
  organization: string;
  kind: "projeto" | "estagio" | "emprego" | "voluntariado";
  description: string;
  started_on: string;
  ended_on: string | null;
}
export interface StudyEvent {
  id: string;
  user_id: string;
  class_id: string | null;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
}
export interface Certificate {
  id: string;
  user_id: string;
  track_id: string;
  issued_by: string;
  issued_at: string;
  verification_code: string;
}
export interface SupportTicket {
  id: string;
  user_id: string;
  topic: string;
  urgency: string;
  summary: string;
  assigned_to: string | null;
  response: string | null;
  status: "open" | "answered" | "closed";
  created_at: string;
}
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
export interface RewardEvent {
  id: string;
  user_id: string;
  source: string;
  xp: number;
  label: string;
  created_at: string;
}
export interface StudyDay {
  id: string;
  user_id: string;
  day: string;
}
export interface LearningSettings {
  id: string;
  timezone: string;
}
export interface TrackEnrollment {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
}
export interface MaterialRead {
  id: string;
  user_id: string;
  material_id: string;
  last_opened_at: string;
  completed_at: string | null;
}
export interface TableMap {
  reward_events: RewardEvent;
  study_days: StudyDay;
  learning_settings: LearningSettings;
  track_enrollments: TrackEnrollment;
  material_reads: MaterialRead;
  profiles: Profile;
  user_roles: UserRole;
  organizations: Organization;
  role_requests: RoleRequest;
  subjects: Subject;
  materials: Material;
  tracks: Track;
  modules: Module;
  progress: Progress;
  questions: Question;
  attempts: Attempt;
  classes: Classroom;
  enrollments: Enrollment;
  assignments: Assignment;
  submissions: Submission;
  posts: Post;
  comments: Comment;
  reactions: Reaction;
  projects: Project;
  project_members: ProjectMember;
  jobs: Job;
  applications: Application;
  saved_jobs: SavedJob;
  study_events: StudyEvent;
  certificates: Certificate;
  support_tickets: SupportTicket;
  messages: Message;
  notifications: Notification;
  experiences: Experience;
}
export type TableName = keyof TableMap;
export type Dataset = { [K in TableName]: TableMap[K][] };
export const tableNames: TableName[] = [
  "reward_events",
  "study_days",
  "learning_settings",
  "track_enrollments",
  "material_reads",
  "profiles",
  "user_roles",
  "organizations",
  "role_requests",
  "subjects",
  "materials",
  "tracks",
  "modules",
  "progress",
  "questions",
  "attempts",
  "classes",
  "enrollments",
  "assignments",
  "submissions",
  "posts",
  "comments",
  "reactions",
  "projects",
  "project_members",
  "jobs",
  "applications",
  "saved_jobs",
  "study_events",
  "certificates",
  "support_tickets",
  "messages",
  "notifications",
  "experiences",
];
export const emptyDataset = (): Dataset =>
  Object.fromEntries(tableNames.map((k) => [k, []])) as unknown as Dataset;
