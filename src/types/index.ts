export type Role = 'participant' | 'instructor' | 'rater' | 'supervisor' | 'admin'

export interface User {
  id: string
  nip?: string
  email: string
  password: string
  name: string
  role: Role
}

// ── Question / Test Engine ──
export type QuestionType = 'mcq' | 'essay' | 'fillBlank' | 'dragDrop'

export interface MCQOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface DragDropItem {
  id: string
  text: string
  correctOrder: number
}

export interface Question {
  id: string
  type: QuestionType
  text: string
  points: number
  options?: MCQOption[]
  correctAnswer?: string
  items?: DragDropItem[]
}

export interface Test {
  id: string
  title: string
  description: string
  questions: Question[]
  timeLimit: number
  randomize: boolean
  pickCount?: number
  createdBy: string
  createdAt: string
}

// ── Materi Library ──
export type MateriType = 'pdf' | 'slide' | 'video' | 'h5p'

export interface Materi {
  id: string
  title: string
  type: MateriType
  embedUrl: string
  description?: string
  createdBy: string
  createdAt: string
}

// ── In-Class ──
export interface MateriCategory {
  id: string
  name: string
  weight: number
  inClassId: string
  preTestId: string
  postTestId: string
  materiIds: string[]
}

export interface InClass {
  id: string
  title: string
  description: string
  categories: MateriCategory[]
  createdBy: string
  createdAt: string
}

// ── Training Method Entities (each with its own categories) ──
export interface MethodCategory {
  id: string
  name: string
  weight: number
  formAssessmentId: string
}

export interface MultiraterMethod {
  id: string
  title: string
  description: string
  categories: MethodCategory[]
  assessorTypes: string[]
  createdBy: string
  createdAt: string
}

export interface PresentationMethod {
  id: string
  title: string
  description: string
  categories: MethodCategory[]
  createdBy: string
  createdAt: string
}

export interface ValidationMethod {
  id: string
  title: string
  description: string
  categories: MethodCategory[]
  createdBy: string
  createdAt: string
}

export interface SkillTestMethod {
  id: string
  title: string
  description: string
  categories: MethodCategory[]
  minAttempts: number
  createdBy: string
  createdAt: string
}

export interface VerifyMethod {
  id: string
  title: string
  description: string
  categories: MethodCategory[]
  createdBy: string
  createdAt: string
}

export interface AccountingCategory {
  id: string
  name: string
  weight: number
  testId: string
}

export interface AccountingMethod {
  id: string
  title: string
  description: string
  categories: AccountingCategory[]
  createdBy: string
  createdAt: string
}

// ── Form Builder (Google Forms-style) ──
export type FormFieldType = 'mcq' | 'essay' | 'trueFalse' | 'rating'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  required: boolean
  points: number
  options?: string[]
  ratingMin?: number
  ratingMax?: number
}

export interface FormAssessment {
  id: string
  title: string
  description: string
  fields: FormField[]
  createdBy: string
  createdAt: string
  clonedFrom?: string
}

// ── Training Method ──
export type TrainingMethodType =
  | 'knowledgeTest'
  | 'inClass'
  | 'multirater'
  | 'presentation'
  | 'validation'
  | 'skillTest'
  | 'verify'
  | 'accounting'
  | 'technicalTest'

export type FormBasedMethodType = Extract<TrainingMethodType, 'multirater' | 'presentation' | 'validation' | 'skillTest' | 'verify'>

export interface TechnicalTestItem {
  id: string
  order: number
  trainingMethodType: FormBasedMethodType
  contentId: string
  weight: number
  passingScore: number
}

export interface TechnicalTestCategory {
  id: string
  name: string
  weight: number
  items: TechnicalTestItem[]
}

export interface TechnicalTestMethod {
  id: string
  title: string
  description: string
  categories: TechnicalTestCategory[]
  createdBy: string
  createdAt: string
}

// ── Curriculum ──
export interface CurriculumItem {
  id: string
  order: number
  trainingMethodType: TrainingMethodType
  contentId: string
  weight: number
  passingScore: number
}

export interface Curriculum {
  id: string
  title: string
  description: string
  programCategory: string
  passingThreshold: number
  immutable: boolean
  items: CurriculumItem[]
  createdBy: string
  createdAt: string
}

// ── Class ──
export type ClassStatus = 'pending' | 'active' | 'completed'

export interface InClassMateriInstructorAssignment {
  trainingMethodId: string
  inClassId: string
  categoryId: string
  materiId: string
  instructorId: string
}

export interface ParticipantAssessorAssignment {
  trainingMethodId: string
  participantId: string
  raterIds: string[]
}

export interface Class {
  id: string
  name: string
  curriculumId: string
  knowledgeTestClassId?: string
  instructorId: string
  startDate: string
  endDate: string
  status: ClassStatus
  participants: string[]
  raters: string[]
  inClassInstructorAssignments?: InClassMateriInstructorAssignment[]
  assessmentAssessorAssignments?: ParticipantAssessorAssignment[]
  createdBy: string
  createdAt: string
}

// ── Knowledge Test (screening entity) ──
export interface KnowledgeTestClass {
  id: string
  name: string
  testId: string
  passingScore: number
  maxParticipants: number
  participants: string[]
  createdBy: string
  createdAt: string
}

// ── Test Attempt ──
export interface Answer {
  questionId: string
  value: string | string[]
}

export interface TestAttempt {
  id: string
  testId: string
  participantId: string
  classId: string
  answers: Answer[]
  score: number
  totalPoints: number
  normalizedScore: number
  startedAt: string
  completedAt?: string
  status: 'inProgress' | 'completed' | 'expired'
}

// ── Scoring Contract ──
export interface ScoreMetadata {
  rawScore: any
  calculation: string
  evaluatedAt: string
  evaluator: string
}

export interface ScoreOutput {
  trainingMethodId: string
  participantScore: number
  passStatus: 'pass' | 'fail' | 'pending'
  metadata: ScoreMetadata
}

// ── Multirater / Form-based Assessments ──
export interface FormScoreEntry {
  fieldId: string
  value: string | number
}

export interface Assessment {
  id: string
  classId: string
  trainingMethodId: string
  methodEntityId?: string
  categoryId?: string
  raterId: string
  participantId: string
  formAssessmentId: string
  testId?: string
  scores: FormScoreEntry[]
  notes: string
  normalizedScore: number
  createdAt: string
  completedAt?: string
}

// ── Progress ──
export interface LGI {
  participantId: string
  inClassId: string
  preTestScore: number
  postTestScore: number
  lgiValue: number
}

export interface ParticipantProgress {
  participantId: string
  classId: string
  methodId: string
  methodType: TrainingMethodType
  status: 'pending' | 'inProgress' | 'completed' | 'passed' | 'failed' | 'remedial'
  score?: number
}

// ── Transcript ──
export interface TranscriptEntry {
  methodTitle: string
  methodType: TrainingMethodType
  weight: number
  score: number
  weightedScore: number
  passStatus: string
}

export interface Transcript {
  participantId: string
  classId: string
  entries: TranscriptEntry[]
  totalWeightedScore: number
  overallPassStatus: 'pass' | 'fail'
}

// ── Remedial ──
export interface Remedial {
  id: string
  participantId: string
  classId: string
  trainingMethodId: string
  methodType: TrainingMethodType
  status: 'assigned' | 'inProgress' | 'completed'
  score?: number
  assignedAt: string
  completedAt?: string
}

// ── Audit Log ──
export interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  userRole: Role
  action: string
  resource: string
  resourceId: string
  details: string
  timestamp: string
}
