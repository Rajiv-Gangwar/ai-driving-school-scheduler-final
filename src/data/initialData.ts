import { Location, School, Trainer, Cohort, Student, TrainerAvailabilitySlot, ClassScheduled, ClassFeedback } from '../types';

export const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Downtown Core', active: true },
  { id: 'loc-2', name: 'North District', active: true },
  { id: 'loc-3', name: 'South Ward', active: true },
  { id: 'loc-4', name: 'East Side Heights', active: true },
  { id: 'loc-5', name: 'West End Valley', active: true },
  { id: 'loc-6', name: 'Midtown Plaza', active: true },
  { id: 'loc-7', name: 'Greenwood Suburbs', active: true },
  { id: 'loc-8', name: 'Riverdale Harbor', active: true },
  { id: 'loc-9', name: 'Lakeside Hills', active: true },
  { id: 'loc-10', name: 'Sutton Village', active: true },
  { id: 'loc-11', name: 'Pinecrest Forest', active: true },
  { id: 'loc-12', name: 'Oakridge Ridge', active: true },
  { id: 'loc-13', name: 'Beacon Beacon', active: true },
  { id: 'loc-14', name: 'Maplewood Flat', active: true },
  { id: 'loc-15', name: 'Summit Crest', active: true },
  { id: 'loc-16', name: 'Cedar Ridge', active: true },
  { id: 'loc-17', name: 'Sandalwood Park', active: true },
  { id: 'loc-18', name: 'Bridgewater Crossing', active: true },
  { id: 'loc-19', name: 'Silver Lake', active: true },
  { id: 'loc-20', name: 'Windy Ridge', active: true },
];

export const INITIAL_SCHOOLS: School[] = [
  { id: 'sch-1', name: 'Central High School', active: true },
  { id: 'sch-2', name: 'East Valley Academy', active: true },
  { id: 'sch-3', name: 'St. Jude Preparatory', active: true },
  { id: 'sch-4', name: 'Lakeside Charter School', active: true },
  { id: 'sch-5', name: 'Westfield Polytechnic', active: true },
  { id: 'sch-6', name: 'Lincoln Community High', active: true },
];

export const INITIAL_TRAINERS: Trainer[] = [
  {
    id: 'tr-1',
    name: 'John Miller',
    phone: '555-0192',
    email: 'john.miller@driveredu.com',
    active: true,
    notes: 'Handles nervous students beautifully. Excellent Saturday availability.',
  },
  {
    id: 'tr-2',
    name: 'Sarah Conner',
    phone: '555-0143',
    email: 'sarah.conner@driveredu.com',
    active: true,
    notes: 'Veteran highway driving specialist. High-demand instructor.',
  },
  {
    id: 'tr-3',
    name: 'Alex Rivera',
    phone: '555-0177',
    email: 'alex.rivera@driveredu.com',
    active: true,
    notes: 'Bilingual (English/Spanish). Perfect record with teen matched pairs.',
  },
  {
    id: 'tr-4',
    name: 'David Vance',
    phone: '555-0188',
    email: 'david.vance@driveredu.com',
    active: false,
    notes: 'On medical leave, currently inactive.',
  },
];

export const INITIAL_COHORTS: Cohort[] = [
  {
    id: 'coh-june-2026',
    name: 'June 2026 Cohort',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    selectedDays: ['Monday', 'Wednesday', 'Saturday'],
    assignedTrainers: ['tr-1', 'tr-2', 'tr-3'],
    status: 'Active',
    notes: 'Core Summer Kick-Off cohort.',
  },
  {
    id: 'coh-july-2026',
    name: 'July 2026 Cohort',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    selectedDays: ['Tuesday', 'Thursday', 'Saturday'],
    assignedTrainers: ['tr-1', 'tr-3'],
    status: 'Active',
    notes: 'Mid-summer acceleration program.',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  // Pair 1: Pre-matched under-18s (Ryan and Mark)
  {
    id: 'std-1',
    name: 'Ryan Patel',
    dateOfBirth: '2010-04-12',
    age: 16,
    under18: true,
    phone: '555-0211',
    email: 'ryan.patel@example.com',
    parentName: 'Anita Patel',
    parentPhone: '555-0212',
    parentEmail: 'parent@steersafe.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-1', // Central High
    locationId: 'loc-3', // South Ward
    existingPartnerId: 'std-2',
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM', 'Saturday morning'],
    blockedDates: ['2026-06-15'],
    blockedTimes: [],
    notes: 'Nervous helper requested.',
    paidStatus: true,
    completedDrives: {}
  },
  {
    id: 'std-2',
    name: 'Mark Davis',
    dateOfBirth: '2010-09-05',
    age: 15,
    under18: true,
    phone: '555-0231',
    email: 'mark.davis@example.com',
    parentName: 'George Davis',
    parentPhone: '555-0232',
    parentEmail: 'parent@steersafe.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-1', // Central High
    locationId: 'loc-3', // South Ward
    existingPartnerId: 'std-1',
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM', 'Saturday morning'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Best friends with Ryan.',
    paidStatus: true,
    completedDrives: {}
  },

  // Pair 1.5: Ideal pairing candidates (John Doe & Alex J)
  {
    id: 'std-3',
    name: 'John Doe',
    dateOfBirth: '2009-11-22',
    age: 16,
    under18: true,
    phone: '555-0010',
    email: 'john.doe@gmail.com',
    parentName: 'Mary Smith',
    parentPhone: '555-0011',
    parentEmail: 'parent@steersafe.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-3', // St. Jude Preparatory
    locationId: 'loc-2', // North District
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM', 'Saturday morning'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Prefers compact sedan.',
    paidStatus: true,
    completedDrives: {}
  },
  {
    id: 'std-4',
    name: 'Alex Jones',
    dateOfBirth: '2009-12-19',
    age: 16,
    under18: true,
    phone: '555-0202',
    email: 'alexj@gmail.com',
    parentName: 'David Jones',
    parentPhone: '555-0203',
    parentEmail: 'jonesy@gmail.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-3', // St. Jude Preparatory
    locationId: 'loc-2', // North District
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM', 'Saturday morning'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Overlapping school and location with John.',
    paidStatus: true,
    completedDrives: {}
  },

  // Pair 2: Close match candidates (Emily Clark & Kevin Harris)
  {
    id: 'std-5',
    name: 'Emily Clark',
    dateOfBirth: '2010-01-14',
    age: 16,
    under18: true,
    phone: '555-0309',
    email: 'emily.clark@outlook.com',
    parentName: 'Robert Clark',
    parentPhone: '555-0310',
    parentEmail: 'robert.clark@example.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-2', // East Valley Academy
    locationId: 'loc-4', // East Side Heights
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['6 PM to 8 PM', 'Saturday afternoon'],
    blockedDates: ['2026-06-20'],
    blockedTimes: [],
    notes: 'Prefers female trainer if possible.',
    paidStatus: true,
    completedDrives: {}
  },
  {
    id: 'std-6',
    name: 'Kevin Harris',
    dateOfBirth: '2009-10-30',
    age: 16,
    under18: true,
    phone: '555-0453',
    email: 'kevin.harris@gmail.com',
    parentName: 'Patricia Harris',
    parentPhone: '555-0454',
    parentEmail: 'patricia.harris@example.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-2', // East Valley Academy
    locationId: 'loc-4', // East Side Heights
    partnerRequired: true,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['6 PM to 8 PM', 'Saturday afternoon'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Needs summer driver hours ASAP.',
    paidStatus: true,
    completedDrives: {}
  },

  // Solo adults over 18 (Samantha and Michael)
  {
    id: 'std-7',
    name: 'Samantha Wood',
    dateOfBirth: '2005-02-14',
    age: 21,
    under18: false,
    phone: '555-0671',
    email: 'sam.wood@statecollege.edu',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-5',
    locationId: 'loc-1',
    partnerRequired: false,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM', '6 PM to 8 PM'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Adult learn-to-drive fast track.',
    paidStatus: true,
    completedDrives: {}
  },
  {
    id: 'std-8',
    name: 'Michael Chang',
    dateOfBirth: '2002-08-30',
    age: 23,
    under18: false,
    phone: '555-0711',
    email: 'mchang@techcorp.com',
    cohortId: 'coh-june-2026',
    schoolId: 'sch-6',
    locationId: 'loc-6',
    partnerRequired: false,
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'],
    availabilityTimeRanges: ['6 PM to 8 PM', 'Saturday afternoon'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'Already has learner permit.',
    paidStatus: true,
    completedDrives: {}
  },
  {
    id: 'std-9',
    name: 'Emily Watson',
    dateOfBirth: '2010-02-15',
    age: 16,
    under18: true,
    phone: '555-0888',
    email: 'emily.watson@example.com',
    parentName: 'Sarah Watson',
    parentPhone: '555-0889',
    parentEmail: 'parent@steersafe.com',
    cohortId: 'coh-july-2026',
    schoolId: 'sch-1',
    locationId: 'loc-1',
    partnerRequired: false,
    availabilityDays: ['Tuesday', 'Thursday', 'Saturday'],
    availabilityTimeRanges: ['4 PM to 6 PM'],
    blockedDates: [],
    blockedTimes: [],
    notes: 'New student for July cohort.',
    paidStatus: false,
    completedDrives: {}
  }
];

// Preloaded simple slots for June Cohort to make the schedule instantly ready to produce!
export const INITIAL_SLOTS: TrainerAvailabilitySlot[] = [
  // John Miller (tr-1) availability slots in June (Mondays: June 1, 8, 15, 22, 29)
  // 16:00-18:00 and 18:00-20:00
  { id: 'slot-tr-1-june-1-a', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-01', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-1-june-1-b', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-01', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-1-june-8-a', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-08', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-1-june-8-b', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-08', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-1-june-15-a', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-15', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-1-june-15-b', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-15', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-1-june-22-a', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-22', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-1-june-22-b', trainerId: 'tr-1', cohortId: 'coh-june-2026', date: '2026-06-22', startTime: '18:00', endTime: '20:00', status: 'Open' },
  
  // Sarah Conner (tr-2) availability slots in June (Wednesdays: June 3, 10, 17, 24)
  { id: 'slot-tr-2-june-3-a', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-03', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-2-june-3-b', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-03', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-2-june-10-a', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-10', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-2-june-10-b', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-10', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-2-june-17-a', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-17', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-2-june-17-b', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-17', startTime: '18:00', endTime: '20:00', status: 'Open' },
  { id: 'slot-tr-2-june-24-a', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-24', startTime: '16:00', endTime: '18:00', status: 'Open' },
  { id: 'slot-tr-2-june-24-b', trainerId: 'tr-2', cohortId: 'coh-june-2026', date: '2026-06-24', startTime: '18:00', endTime: '20:00', status: 'Open' },

  // Alex Rivera (tr-3) availability slots in June (Saturdays: June 6, 13, 20, 27)
  // Morning slots 08:00-10:00, 10:00-12:00, and afternoon slots 14:00-16:00
  { id: 'slot-tr-3-june-6-a', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-06', startTime: '08:00', endTime: '10:00', status: 'Open' },
  { id: 'slot-tr-3-june-6-b', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-06', startTime: '10:00', endTime: '12:00', status: 'Open' },
  { id: 'slot-tr-3-june-6-c', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-06', startTime: '14:00', endTime: '16:00', status: 'Open' },
  { id: 'slot-tr-3-june-13-a', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-13', startTime: '08:00', endTime: '10:00', status: 'Open' },
  { id: 'slot-tr-3-june-13-b', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-13', startTime: '10:00', endTime: '12:00', status: 'Open' },
  { id: 'slot-tr-3-june-13-c', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-13', startTime: '14:00', endTime: '16:00', status: 'Open' },
  { id: 'slot-tr-3-june-20-a', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-20', startTime: '08:00', endTime: '10:00', status: 'Open' },
  { id: 'slot-tr-3-june-20-b', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-20', startTime: '10:00', endTime: '12:00', status: 'Open' },
  { id: 'slot-tr-3-june-20-c', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-20', startTime: '14:00', endTime: '16:00', status: 'Open' },
  { id: 'slot-tr-3-june-27-a', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-27', startTime: '08:00', endTime: '10:00', status: 'Open' },
  { id: 'slot-tr-3-june-27-b', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-27', startTime: '10:00', endTime: '12:00', status: 'Open' },
  { id: 'slot-tr-3-june-27-c', trainerId: 'tr-3', cohortId: 'coh-june-2026', date: '2026-06-27', startTime: '14:00', endTime: '16:00', status: 'Open' },
];

export const INITIAL_CLASSES: ClassScheduled[] = [
  {
    id: 'cls-1',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 1,
    trainerId: 'tr-1',
    date: '2026-07-02',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-2',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 2,
    trainerId: 'tr-1',
    date: '2026-07-09',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-3',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 3,
    trainerId: 'tr-1',
    date: '2026-07-16',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-4',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 4,
    trainerId: 'tr-1',
    date: '2026-07-23',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-5',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 5,
    trainerId: 'tr-1',
    date: '2026-07-30', 
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-6',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 6,
    trainerId: 'tr-1',
    date: '2026-08-01',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-7',
    cohortId: 'coh-june-2026',
    groupId: 'grp-2',
    studentNames: 'Liam Wilson',
    classNumber: 1,
    trainerId: 'tr-2',
    date: '2026-06-28', // Today
    startTime: '18:00', // Evening
    endTime: '20:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-8',
    cohortId: 'coh-june-2026',
    groupId: 'grp-3',
    studentNames: 'Sophia Garcia & Noah Brown',
    classNumber: 1,
    trainerId: 'tr-3',
    date: '2026-06-30',
    startTime: '14:00',
    endTime: '16:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-9',
    cohortId: 'coh-june-2026',
    groupId: 'grp-2',
    studentNames: 'Liam Wilson',
    classNumber: 2,
    trainerId: 'tr-2',
    date: '2026-07-05',
    startTime: '10:00',
    endTime: '12:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-future-1',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 7,
    trainerId: 'tr-1',
    date: '2026-07-15',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-future-2',
    cohortId: 'coh-june-2026',
    groupId: 'grp-1',
    studentNames: 'Ryan Patel & Mark Davis',
    classNumber: 8,
    trainerId: 'tr-1',
    date: '2026-07-20',
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-july-session-1',
    cohortId: 'coh-july-2026',
    groupId: 'grp-july-1',
    studentNames: 'Emily Watson',
    classNumber: 1,
    trainerId: 'tr-1',
    date: '2026-07-20',
    startTime: '14:00',
    endTime: '16:00',
    status: 'Confirmed'
  },
  {
    id: 'cls-july-session-2',
    cohortId: 'coh-july-2026',
    groupId: 'grp-july-1',
    studentNames: 'Emily Watson',
    classNumber: 2,
    trainerId: 'tr-1',
    date: '2026-07-07',
    startTime: '10:00',
    endTime: '12:00',
    status: 'Confirmed'
  }
];

export const INITIAL_FEEDBACKS: ClassFeedback[] = [
  { 
    id: 'f-1', 
    classId: 'cls-7', 
    studentId: 'std-7', 
    studentName: 'Samantha Wood', 
    rating: 4, 
    comment: 'Great control during left turns, needs work on mirror checking.', 
    createdAt: '2026-06-15T10:00:00Z',
    skills: {
      leftTurns: 3,
      signs: 3,
      awareness: 2,
      lanePositioning: 3,
      speed: 3
    },
    intervention: 1
  },
  { 
    id: 'f-2', 
    classId: 'cls-8', 
    studentId: 'std-1', 
    studentName: 'Ryan Patel', 
    rating: 5, 
    comment: 'Excellent awareness and smooth braking.', 
    createdAt: '2026-06-15T10:05:00Z',
    skills: {
      awareness: 3,
      stops: 3,
      starts: 3,
      signs: 3,
      rules: 3
    },
    intervention: 1
  },
  { 
    id: 'f-3', 
    classId: 'cls-9', 
    studentId: 'std-8', 
    studentName: 'Michael Chang', 
    rating: 5, 
    comment: 'Improved mirror usage significantly. Very confident.', 
    createdAt: '2026-06-16T11:00:00Z',
    skills: {
      awareness: 3,
      laneChanging: 3,
      speed: 3,
      lanePositioning: 3,
      signs: 3
    },
    intervention: 1
  },
  { 
    id: 'f-4', 
    classId: 'cls-1', 
    studentId: 'std-1', 
    studentName: 'Ryan Patel', 
    rating: 3, 
    comment: 'Hesitant at intersections. Needs more practice with right-of-way.', 
    createdAt: '2026-06-17T09:00:00Z',
    skills: {
      intersections: 1,
      awareness: 2,
      stops: 3,
      starts: 2,
      rules: 2
    },
    intervention: 2
  },
  { 
    id: 'f-5', 
    classId: 'cls-1', 
    studentId: 'std-2', 
    studentName: 'Mark Davis', 
    rating: 4, 
    comment: 'Solid parking skills, but speed control in school zones was inconsistent.', 
    createdAt: '2026-06-18T14:00:00Z',
    skills: {
      parking: 3,
      speed: 2,
      signs: 3,
      starts: 3,
      stops: 3
    },
    intervention: 1
  },
  { 
    id: 'f-6', 
    classId: 'cls-2', 
    studentId: 'std-2', 
    studentName: 'Mark Davis', 
    rating: 4, 
    comment: 'Smooth highway merging, though followed a bit too closely once.', 
    createdAt: '2026-06-19T10:00:00Z',
    skills: {
      awareness: 2,
      space: 2,
      speed: 3,
      laneChanging: 3,
      lanePositioning: 3
    },
    intervention: 1
  }
];
