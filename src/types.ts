/**
 * Types & Interfaces for the Driving School Scheduling Module
 */

export interface Location {
  id: string;
  name: string;
  active: boolean;
}

export interface School {
  id: string;
  name: string;
  active: boolean;
}

export interface Trainer {
  id: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  notes: string;
}

export type CohortStatus = 'Draft' | 'Active' | 'Completed';

export interface Cohort {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  selectedDays: string[]; // ['Monday', 'Wednesday', 'Saturday']
  assignedTrainers: string[]; // Trainer IDs
  status: CohortStatus;
  notes: string;
}

export type UserRole = 'Admin' | 'Instructor' | 'Student' | 'Parent';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  associatedId?: string; // Instructor ID if Instructor, Student ID if Student/Parent
}

export type ClassroomSessionStatus = 'Complete' | 'Needs to Complete';

export interface Student {
  id: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  under18: boolean;
  phone: string;
  email: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parent2Name?: string;
  parent2Phone?: string;
  parent2Email?: string;
  cohortId: string;
  schoolId: string; // From School Master
  locationId: string; // From Location Master
  existingPartnerId?: string; // Confirmed choice
  partnerRequired: boolean;
  availabilityDays: string[]; // e.g. ['Monday', 'Wednesday']
  availabilityTimeRanges: string[]; // ["4 PM to 6 PM", "6 PM to 8 PM", "Saturday morning", "Saturday afternoon"]
  blockedDates: string[]; // Array of YYYY-MM-DD
  blockedTimes: string[]; // Array of "HH:MM-HH:MM" e.g. "16:00-18:00"
  notes: string;
  permitId?: string;
  paidStatus: boolean;
  classroomSessions?: Record<number, ClassroomSessionStatus>;
  completedDrives?: Record<number, boolean>;
}

export interface RescheduleRequest {
  id: string;
  classId: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'Student' | 'Instructor' | 'Parent' | 'Admin';
  message?: string;
  suggestedSlots?: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  status: 'Pending' | 'Resolved' | 'Declined';
  createdAt: string;
}

export interface ClassFeedback {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  skills?: {
    instruments?: number;
    starts?: number;
    stops?: number;
    leftTurns?: number;
    rightTurns?: number;
    signs?: number;
    lanePositioning?: number;
    intersections?: number;
    awareness?: number;
    space?: number;
    speed?: number;
    rules?: number;
    parking?: number;
    laneChanging?: number;
  };
  intervention?: number; // 1: Constant, 2: Minimal, 3: No Interventions
  interventionMetric?: string;
  rating: number; // overall average or summary rating
  comment: string;
  createdAt: string;
}

export interface TrainerAvailabilityRule {
  id: string;
  trainerId: string;
  cohortId: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string[]; // ['Monday', 'Wednesday', 'Saturday']
  startTime: string; // e.g. "16:00"
  endTime: string; // e.g. "20:00"
  slotDurationMinutes: number; // usually 120
}

export interface TrainerAvailabilitySlot {
  id: string;
  trainerId: string;
  cohortId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'Open' | 'Booked' | 'Unavailable';
  isException?: boolean;
  notes?: string;
  studentId?: string; // Add this to track who booked if single solo
}

export type GroupType = 'Pair' | 'Solo' | 'Pending';

export interface StudentGroup {
  id: string;
  cohortId: string;
  type: GroupType;
  studentIds: string[];
}

export type ClassStatus = 'Proposed' | 'Confirmed' | 'Needs Review' | 'Cancelled' | 'Completed';

export interface ClassScheduled {
  id: string;
  cohortId: string;
  groupId: string;
  studentNames: string; // cache for easy display
  classNumber: number; // 1 to 6
  isSpecialDrive?: boolean;
  trainerId: string;
  tagAlongTrainerId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00" or "16:00"
  endTime: string; // "16:00" or "18:00"
  status: ClassStatus;
  notes?: string;
}

export interface MatchScoreReason {
  points: number;
  reason: string;
}

export interface SuggestionMatch {
  studentId: string;
  partnerId: string;
  score: number;
  reasons: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  read: boolean;
  createdAt: string;
}
