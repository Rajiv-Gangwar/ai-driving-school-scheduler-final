import { 
  Student, 
  Trainer, 
  Cohort, 
  TrainerAvailabilityRule, 
  TrainerAvailabilitySlot, 
  StudentGroup, 
  ClassScheduled, 
  ClassStatus, 
  SuggestionMatch,
  Location,
  School
} from '../types';

const DAYS_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

const DAYS_REVERSE_MAP: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

/**
 * Helper to parse "HH:MM" string to minutes of the day
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Helper to convert 12h representation for student preferences to HH:MM ranges
 */
export function mapPreferenceToTimes(pref: string): { start: string, end: string }[] {
  switch (pref) {
    case '4 PM to 6 PM':
      return [{ start: '16:00', end: '18:00' }];
    case '6 PM to 8 PM':
      return [{ start: '18:00', end: '20:00' }];
    case 'Saturday morning':
      return [
        { start: '08:00', end: '10:00' },
        { start: '10:00', end: '12:00' }
      ];
    case 'Saturday afternoon':
      return [
        { start: '12:00', end: '14:00' },
        { start: '14:00', end: '16:00' },
        { start: '16:00', end: '18:00' },
        { start: '18:00', end: '20:00' }
      ];
    default:
      // Fallback
      return [{ start: '08:00', end: '20:00' }];
  }
}

/**
 * Checks if two time intervals overlap
 */
export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const mS1 = parseTimeToMinutes(s1);
  const mE1 = parseTimeToMinutes(e1);
  const mS2 = parseTimeToMinutes(s2);
  const mE2 = parseTimeToMinutes(e2);
  return mS1 < mE2 && mS2 < mE1;
}

/**
 * Generate dates of specific days within a range safely
 */
export function getDatesInRange(startStr: string, endStr: string, daysOfWeek: string[]): string[] {
  const dates: string[] = [];
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  const targetDays = daysOfWeek.map(d => DAYS_MAP[d]);
  
  const curr = new Date(start);
  while (curr <= end) {
    if (targetDays.includes(curr.getUTCDay())) {
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Generate 2-hour slots for a given time range
 */
export function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number = 120): { start: string, end: string }[] {
  const slots: { start: string, end: string }[] = [];
  const startM = parseTimeToMinutes(startTime);
  const endM = parseTimeToMinutes(endTime);
  
  let current = startM;
  while (current + durationMinutes <= endM) {
    const sH = Math.floor(current / 60);
    const sM = current % 60;
    const eH = Math.floor((current + durationMinutes) / 60);
    const eM = (current + durationMinutes) % 60;
    
    slots.push({
      start: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
      end: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`
    });
    current += durationMinutes;
  }
  return slots;
}

/**
 * Generate slots for a trainer bulk availability rule
 */
export function generateSlotsFromRule(rule: TrainerAvailabilityRule): TrainerAvailabilitySlot[] {
  const dates = getDatesInRange(rule.startDate, rule.endDate, rule.daysOfWeek);
  const times = generateTimeSlots(rule.startTime, rule.endTime, rule.slotDurationMinutes);
  
  const slots: TrainerAvailabilitySlot[] = [];
  dates.forEach(date => {
    times.forEach(time => {
      slots.push({
        id: `slot-${rule.trainerId}-${date}-${time.start.replace(':', '')}`,
        trainerId: rule.trainerId,
        cohortId: rule.cohortId,
        date,
        startTime: time.start,
        endTime: time.end,
        status: 'Open'
      });
    });
  });
  
  return slots;
}

/**
 * Calculation of Student Match Scores based on precise criteria list:
 * Same school: 30
 * Same location: 30
 * Similar age group: 15
 * Strong availability overlap: 20
 * Same preferred days: 10
 * Same preferred time range: 10
 */
export function calculateMatchScore(student: Student, potential: Student, locations: Location[], schools: School[]): { score: number, reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Same Cohort constraint check (Prerequisite)
  if (student.cohortId !== potential.cohortId) {
    return { score: 0, reasons: ['Different cohorts'] };
  }
  // 2. Age under-18 constraint check
  if (!student.under18 || !potential.under18) {
    return { score: 0, reasons: ['Both must be under 18 years old'] };
  }

  // 3. Same School (30 points)
  if (student.schoolId && student.schoolId === potential.schoolId) {
    score += 30;
    const schoolName = schools.find(s => s.id === student.schoolId)?.name || 'school';
    reasons.push(`Same school (${schoolName}) [+30 pts]`);
  }

  // 4. Same Location (30 points)
  if (student.locationId && student.locationId === potential.locationId) {
    score += 30;
    const locName = locations.find(l => l.id === student.locationId)?.name || 'area';
    reasons.push(`Same location (${locName}) [+30 pts]`);
  }

  // 5. Similar Age Group (15 points)
  const ageDiff = Math.abs(student.age - potential.age);
  if (ageDiff <= 1) {
    score += 15;
    reasons.push(`Similar age group (diff: ${ageDiff} year${ageDiff === 1 ? '' : 's'}) [+15 pts]`);
  } else if (ageDiff <= 2) {
    score += 5;
    reasons.push(`Acceptable age gap (diff: 2 years) [+5 pts]`);
  }

  // 6. Preferred Days Overlap (10 points)
  const daysOverlap = student.availabilityDays.filter(day => potential.availabilityDays.includes(day));
  if (daysOverlap.length > 0) {
    score += 10;
    reasons.push(`Preferred days overlap: ${daysOverlap.join(', ')} [+10 pts]`);
  }

  // 7. Preferred Time Range Overlap (10 points)
  const timesOverlapList = student.availabilityTimeRanges.filter(t => potential.availabilityTimeRanges.includes(t));
  if (timesOverlapList.length > 0) {
    score += 10;
    reasons.push(`Preferred times overlap: ${timesOverlapList.join(', ')} [+10 pts]`);
  }

  // 8. Strong Availability Overlap (20 points)
  // Deemed strong if they share at least 3 days and at least 2 preferred ranges OR overlapping combos
  if (daysOverlap.length >= 3 && timesOverlapList.length >= 2) {
    score += 20;
    reasons.push(`Strong availability overlap (3+ days, 2+ slots) [+20 pts]`);
  } else if (daysOverlap.length >= 2 && timesOverlapList.length >= 1) {
    score += 10;
    reasons.push(`Partial availability match [+10 pts]`);
  }

  return { score, reasons };
}

/**
 * Build dynamic groups based on students
 */
export function buildStudentGroups(students: Student[]): StudentGroup[] {
  const groups: StudentGroup[] = [];
  const processed = new Set<string>();

  // 1. Process paired students (explicit bidirectional or student.partnerId matched)
  students.forEach(student => {
    if (processed.has(student.id)) return;
    
    // Check if under 18 with a partner
    if (student.under18 && student.existingPartnerId) {
      const partner = students.find(s => s.id === student.existingPartnerId);
      if (partner && partner.under18) {
        groups.push({
          id: `G-PAIR-${student.id}-${partner.id}`,
          cohortId: student.cohortId,
          type: 'Pair',
          studentIds: [student.id, partner.id]
        });
        processed.add(student.id);
        processed.add(partner.id);
      }
    }
  });

  // 2. Process non-paired under-18 students (either missing partner, or outstanding)
  students.forEach(student => {
    if (processed.has(student.id)) return;
    
    if (student.under18) {
      groups.push({
        id: `G-PEND-${student.id}`,
        cohortId: student.cohortId,
        type: 'Pending',
        studentIds: [student.id]
      });
      processed.add(student.id);
    } else {
      // 3. Process 18+ solo students
      groups.push({
        id: `G-SOLO-${student.id}`,
        cohortId: student.cohortId,
        type: 'Solo',
        studentIds: [student.id]
      });
      processed.add(student.id);
    }
  });

  return groups;
}

/**
 * Scheduler Checker & Algorithm (Section 9 & 10)
 */
export function generateProposedScheduler(
  cohort: Cohort,
  students: Student[],
  trainers: Trainer[],
  allSlots: TrainerAvailabilitySlot[],
  existingClasses: ClassScheduled[]
): {
  classes: ClassScheduled[];
  slotsUpdated: TrainerAvailabilitySlot[];
  failedGroups: { groupId: string; studentNames: string; reason: string }[];
} {
  // Find current active group setups
  const cohortStudents = students.filter(s => s.cohortId === cohort.id);
  const groups = buildStudentGroups(cohortStudents);

  // We ignore 'Pending' groups
  const readyGroups = groups.filter(g => g.type !== 'Pending');

  // Clone slots so we can keep track of booked ones
  let workingSlots = allSlots.map(s => ({ ...s }));

  // Preserve existing confirmed/cancelled schedules from other cohorts or manual overrides
  const schedulerOutput: ClassScheduled[] = [];
  const failedGroups: { groupId: string; studentNames: string; reason: string }[] = [];

  // Filter existing classes that are already confirmed to mark those slots as booked
  existingClasses.forEach(cls => {
    if (cls.status === 'Confirmed') {
      const matchingSlot = workingSlots.find(
        s => s.trainerId === cls.trainerId && s.date === cls.date && s.startTime === cls.startTime
      );
      if (matchingSlot) {
        matchingSlot.status = 'Booked';
      }
    }
  });

  // Active bookings tracker for student dates to ensure: 1 class per student group per day
  // Structure: Record<studentId, Set<DateString>>
  const studentBookedDates: Record<string, Set<string>> = {};
  cohortStudents.forEach(s => {
    studentBookedDates[s.id] = new Set<string>();
  });

  // Also pre-seed any pre-existing Confirmed classes into booked dates
  existingClasses.forEach(cls => {
    if (cls.status === 'Confirmed') {
      // Find students in this class
      const grp = groups.find(g => g.id === cls.groupId);
      if (grp) {
        grp.studentIds.forEach(sId => {
          if (studentBookedDates[sId]) {
            studentBookedDates[sId].add(cls.date);
          }
        });
      }
    }
  });

  // Loop through ready groups to schedule 6 classes for each
  readyGroups.forEach(grp => {
    const grID = grp.id;
    const grStudents = cohortStudents.filter(s => grp.studentIds.includes(s.id));
    const studentNames = grStudents.map(s => s.name).join(' & ');

    // Filter available slots that belong to this cohort and are open
    const availableCohortSlots = workingSlots.filter(s => s.cohortId === cohort.id && s.status === 'Open');

    // We need to schedule sessions based on group type: Solo (3 x 2h = 6h) or Pair (6 x 2h = 12h)
    const targetSessionCount = grp.type === 'Solo' ? 3 : 6;
    const scheduledSessions: ClassScheduled[] = [];
    
    // Sort slots by date and trainer preference to schedule evenly
    const sortedSlots = [...availableCohortSlots].sort((a, b) => {
      // 1. Prioritize times matching student preferences
      const aPref = grStudents.some(s => 
        s.availabilityDays.includes(DAYS_REVERSE_MAP[new Date(a.date + 'T00:00:00Z').getUTCDay()]) &&
        s.availabilityTimeRanges.some(t => {
          const times = mapPreferenceToTimes(t);
          return times.some(tm => timesOverlap(tm.start, tm.end, a.startTime, a.endTime));
        })
      );
      const bPref = grStudents.some(s => 
        s.availabilityDays.includes(DAYS_REVERSE_MAP[new Date(b.date + 'T00:00:00Z').getUTCDay()]) &&
        s.availabilityTimeRanges.some(t => {
          const times = mapPreferenceToTimes(t);
          return times.some(tm => timesOverlap(tm.start, tm.end, b.startTime, b.endTime));
        })
      );

      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;

      // 2. Sort by date chronological
      return a.date.localeCompare(b.date);
    });

    let foundCount = 0;
    
    for (let i = 0; i < sortedSlots.length && foundCount < targetSessionCount; i++) {
      const slot = sortedSlots[i];

      // Check date and time conflicts for the group
      let hasConflict = false;

      // Rule: Check if trainer is already booked in this scheduler cycle
      const trainerBusy = scheduledSessions.some(ss => ss.date === slot.date && ss.startTime === slot.startTime && ss.trainerId === slot.trainerId);
      if (trainerBusy) continue;

      // Rule: A student can only attend 1 class on a given date (Section 9.2: 1-class-per-day stagger limit)
      const dateAlreadyBooked = grp.studentIds.some(sId => studentBookedDates[sId]?.has(slot.date));
      if (dateAlreadyBooked) continue;

      // Rule: Check student preferences and blocked dates/times
      for (const student of grStudents) {
        // Blocked dates
        if (student.blockedDates.includes(slot.date)) {
          hasConflict = true;
          break;
        }

        // Blocked times
        const hasBlockedTime = student.blockedTimes.some(bt => {
          const [bStart, bEnd] = bt.split('-');
          return timesOverlap(slot.startTime, slot.endTime, bStart, bEnd);
        });
        if (hasBlockedTime) {
          hasConflict = true;
          break;
        }

        // Must be available on that day of week set
        const dayOfWeek = DAYS_REVERSE_MAP[new Date(slot.date + 'T00:00:00Z').getUTCDay()];
        if (!student.availabilityDays.includes(dayOfWeek)) {
          // If student is strictly not available, check if date range exceptions or if preferred
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) continue;

      // If clear, reserve it!
      foundCount++;
      scheduledSessions.push({
        id: `class-${grID}-${foundCount}`,
        cohortId: cohort.id,
        groupId: grID,
        studentNames,
        classNumber: foundCount,
        trainerId: slot.trainerId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'Proposed'
      });
    }

    if (foundCount === targetSessionCount) {
      // Success! Book these slots, add to output
      scheduledSessions.forEach(session => {
        schedulerOutput.push(session);
        
        // Mark working slots as Booked
        const matchingSlot = workingSlots.find(
          s => s.trainerId === session.trainerId && s.date === session.date && s.startTime === session.startTime
        );
        if (matchingSlot) {
          matchingSlot.status = 'Booked';
        }

        // Add dates to booked tracking
        grp.studentIds.forEach(sId => {
          studentBookedDates[sId]?.add(session.date);
        });
      });
    } else {
      // Failed to find target classes - Needs manual review
      // Keep whatever classes were partially matching to assist manual matching, but mark status as Needs Review
      failedGroups.push({
        groupId: grID,
        studentNames,
        reason: `Only found ${foundCount} of ${targetSessionCount} non-conflicting slots. Check student block lists or expand trainer availability.`
      });

      // Still output the partial ones so the admin sees the tentative block and can adjust
      scheduledSessions.forEach(session => {
        session.status = 'Needs Review';
        schedulerOutput.push(session);

        const matchingSlot = workingSlots.find(
          s => s.trainerId === session.trainerId && s.date === session.date && s.startTime === session.startTime
        );
        if (matchingSlot) {
          matchingSlot.status = 'Booked'; // temporarily occupy to reflect conflict
        }
      });
    }
  });

  return {
    classes: schedulerOutput,
    slotsUpdated: workingSlots,
    failedGroups
  };
}
