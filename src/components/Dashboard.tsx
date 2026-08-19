import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  MapPin,
  GraduationCap,
  MessageSquare,
  Star,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Trainer, Cohort, TrainerAvailabilitySlot, ClassScheduled, StudentGroup, RescheduleRequest, ClassFeedback } from '../types';
import { buildStudentGroups } from '../utils/scheduler';

interface DashboardProps {
  students: Student[];
  trainers: Trainer[];
  cohorts: Cohort[];
  slots: TrainerAvailabilitySlot[];
  classes: ClassScheduled[];
  rescheduleRequests: RescheduleRequest[];
  classFeedbacks: ClassFeedback[];
  activeCohortId: string;
  setActiveCohortId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  onApproveMatch: (studentId: string, partnerId: string) => void;
  onResolveReschedule: (id: string, status: 'Resolved' | 'Declined', chosenSlot?: {date: string, startTime: string, endTime: string}) => void;
}

export default function Dashboard({
  students,
  trainers,
  cohorts,
  slots,
  classes,
  rescheduleRequests,
  classFeedbacks,
  activeCohortId,
  setActiveCohortId,
  setActiveTab,
  onApproveMatch,
  onResolveReschedule
}: DashboardProps) {
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const currentCohort = cohorts.find(c => c.id === activeCohortId) || cohorts[0];

  const pendingRequests = rescheduleRequests.filter(r => r.status === 'Pending');
  const recentFeedback = [...classFeedbacks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  // Calculations filtered by active cohort
  const cohortStudents = students.filter(s => s.cohortId === activeCohortId);
  const totalStudentsCount = cohortStudents.length;

  const under18Count = cohortStudents.filter(s => s.under18).length;
  const adultCount = cohortStudents.filter(s => !s.under18).length;

  // Partner status
  const studentsWhoNeedPartner = cohortStudents.filter(s => s.under18 && !s.existingPartnerId);
  const studentsWithConfirmedPartner = cohortStudents.filter(s => s.under18 && s.existingPartnerId);

  // Groups
  const groups = buildStudentGroups(cohortStudents);
  const readyGroups = groups.filter(g => g.type !== 'Pending');
  const pendingGroups = groups.filter(g => g.type === 'Pending');

  // Scheduling Stats
  const groupClassesMap: Record<string, number> = {};
  groups.forEach(g => {
    groupClassesMap[g.id] = 0;
  });

  const cohortClasses = classes.filter(cls => cls.cohortId === activeCohortId);
  cohortClasses.forEach(cls => {
    if (cls.status !== 'Cancelled') {
      groupClassesMap[cls.groupId] = (groupClassesMap[cls.groupId] || 0) + 1;
    }
  });

  const fullyScheduledGroups = readyGroups.filter(g => {
    const target = g.type === 'Solo' ? 3 : 6;
    return (groupClassesMap[g.id] || 0) >= target;
  });
  const partiallyScheduledGroups = readyGroups.filter(g => {
    const target = g.type === 'Solo' ? 3 : 6;
    const count = groupClassesMap[g.id] || 0;
    return count > 0 && count < target;
  });
  const unscheduledGroups = readyGroups.filter(g => (groupClassesMap[g.id] || 0) === 0);
  const failedReviewGroups = cohortClasses.filter(cls => cls.status === 'Needs Review');

  // Suggested matches waiting (simple dynamic scan matching school / location)
  const suggestedMatches: { s1: Student, s2: Student, score: number, reason: string }[] = [];
  const processed = new Set<string>();

  studentsWhoNeedPartner.forEach(s1 => {
    if (processed.has(s1.id)) return;
    const bestMatch = studentsWhoNeedPartner.find(s2 => {
      if (s2.id === s1.id || processed.has(s2.id)) return false;
      return s2.schoolId === s1.schoolId || s2.locationId === s1.locationId;
    });

    if (bestMatch) {
      processed.add(s1.id);
      processed.add(bestMatch.id);
      const isSameSchool = s1.schoolId === bestMatch.schoolId;
      suggestedMatches.push({
        s1,
        s2: bestMatch,
        score: isSameSchool ? 85 : 70,
        reason: isSameSchool 
          ? 'Same high school & overlapping location.' 
          : 'Same district preference & overlapping weekday slots.'
      });
    }
  });

  return (
    <div id="dashboard-tab" className="space-y-6 animate-fade-in">
      {/* Upper Area: Cohort Switcher with luxurious slate-indigo active styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg relative z-30 gap-3 sm:gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none rounded-2xl overflow-hidden"></div>
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none rounded-2xl overflow-hidden"></div>
        <div className="relative z-10">
          <h2 className="text-base sm:text-xl font-extrabold tracking-tight">Driving School Scheduler</h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-0.5 font-medium">Program Room: <span className="font-extrabold text-[#F5F3FF] underline decoration-pink-500 decoration-2 underline-offset-4">{currentCohort?.name || 'None'}</span></p>
        </div>

        {/* Custom NavTab-style Dropdown for Cohort selection */}
        <div className="relative z-50 w-full sm:w-auto">
          <button
            type="button"
            id="cohort-select-button"
            onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
            className="flex items-center justify-between sm:justify-start gap-2.5 bg-white/10 hover:bg-white/15 active:scale-98 transition-all duration-150 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 w-full sm:w-auto cursor-pointer shadow-xs text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest shrink-0">Cohort:</span>
              <span className="text-xs sm:text-sm font-extrabold text-white truncate">{currentCohort?.name || 'Select Cohort'}</span>
            </div>
            <ChevronDown size={15} className={`text-indigo-200 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180 text-white' : ''}`} />
          </button>

          <AnimatePresence>
            {isCohortDropdownOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div 
                  className="fixed inset-0 z-50" 
                  onClick={() => setIsCohortDropdownOpen(false)} 
                />

                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-[60] overflow-hidden"
                >
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                    <span>Select Program Cohort</span>
                    <span className="text-indigo-600 font-bold">{cohorts.length} available</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                    {cohorts.map(c => {
                      const isActive = c.id === activeCohortId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setActiveCohortId(c.id);
                            setIsCohortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {isActive && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grid of Key Stats Indicators: 2 Columns on Mobile, 4 on Desktop with zero text cutoff */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Students */}
        <div id="stat-students" className="card-fancy p-3 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
          <div>
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1.5">
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider font-display leading-tight break-words">
                Active Students
              </span>
              <div className="p-1 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shrink-0">
                <Users size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-slate-950 font-display leading-none">{totalStudentsCount}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold leading-tight">students</span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 text-[9px] sm:text-[11px] text-slate-600 flex flex-col xs:flex-row justify-between font-semibold gap-0.5 sm:gap-2 leading-tight">
            <span>Teens: <strong className="text-indigo-600 font-extrabold">{under18Count}</strong></span>
            <span>Adults: <strong className="text-slate-800 font-extrabold">{adultCount}</strong></span>
          </div>
        </div>

        {/* Partner Matching Needs */}
        <div id="stat-partners" className="card-fancy p-3 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
          <div>
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1.5">
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider font-display leading-tight break-words">
                Partner Status
              </span>
              <div className={`p-1 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${studentsWhoNeedPartner.length > 0 ? 'bg-pink-50 text-pink-600' : 'bg-emerald-50 text-emerald-700'}`}>
                <Sparkles size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-[#111827] font-display leading-none">{studentsWhoNeedPartner.length}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold leading-tight">need pairing</span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4 pt-1.5">
            <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-50/90 border border-emerald-100/90 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg block leading-tight break-words text-left">
              {studentsWithConfirmedPartner.length} under-18s already paired
            </span>
          </div>
        </div>

        {/* Ready Groups */}
        <div id="stat-groups" className="card-fancy p-3 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div>
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1.5">
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider font-display leading-tight break-words">
                Scheduling Groups
              </span>
              <div className="p-1 sm:p-2 bg-purple-50 text-purple-600 rounded-lg sm:rounded-xl shrink-0">
                <CheckCircle size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-[#111827] font-display leading-none">{readyGroups.length}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold leading-tight">operating</span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 text-[9px] sm:text-[11px] text-slate-500 flex flex-col xs:flex-row justify-between font-bold gap-0.5 sm:gap-2 leading-tight">
            <span>Pairs ({readyGroups.filter(g => g.type === 'Pair').length})</span>
            <span>Solo ({readyGroups.filter(g => g.type === 'Solo').length})</span>
          </div>
        </div>

        {/* Conflicts or Needs Review */}
        <div id="stat-conflicts" className="card-fancy p-3 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-rose-50/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse"></div>
          <div>
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1.5">
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider font-display leading-tight break-words">
                Attention Areas
              </span>
              <div className={`p-1 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${failedReviewGroups.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-xl sm:text-3xl font-black font-display leading-none ${failedReviewGroups.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{failedReviewGroups.length}</span>
              <span className="text-[10px] sm:text-xs text-rose-600 font-bold leading-tight">session conflicts</span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100/90 text-[9px] sm:text-[11px] text-slate-500 font-bold block leading-tight break-words">
            <span>Slots scheduled: <strong className="text-slate-800">{cohortClasses.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Panel grid: Left Stats, Right Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Process Track */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/85 shadow-xs">
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-4 flex items-start gap-2.5">
              <Calendar size={20} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>Cohort Scheduling Health (6 Drives per Group)</span>
            </h3>

            {/* Visual breakdown progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Fully Scheduled ({fullyScheduledGroups.length} / {readyGroups.length} groups)</span>
                <span className="text-indigo-600 font-black">
                  {readyGroups.length > 0 ? Math.round((fullyScheduledGroups.length / readyGroups.length) * 100) : 0}% Complete
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/40">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-xs" 
                  style={{ width: `${readyGroups.length > 0 ? (fullyScheduledGroups.length / readyGroups.length) * 100 : 0}%` }}
                />
              </div>

              {/* Grid of groups and their class progress checkmarks */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
                {readyGroups.map(grp => {
                  const grpClassesCount = groupClassesMap[grp.id] || 0;
                  const targetCount = grp.type === 'Solo' ? 3 : 6;
                  const grStuds = cohortStudents.filter(s => grp.studentIds.includes(s.id));
                  const grNames = grStuds.map(s => s.name).join(' & ');
                  const isDone = grpClassesCount >= targetCount;
                  
                  return (
                    <div key={grp.id} className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-250 ${isDone ? 'bg-emerald-50/40 border-emerald-200/50 hover:bg-emerald-50/70' : 'bg-slate-50/60 border-slate-200/60 hover:bg-slate-50'} flex items-center justify-between`}>
                      <div className="min-w-0 pr-2">
                        <p className="text-[11px] sm:text-xs font-extrabold text-slate-950 truncate" title={grNames}>
                          {grNames}
                        </p>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold font-mono">
                          {grp.type === 'Pair' ? 'Teens' : 'Solo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 rounded-lg font-black border ${isDone ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60 shadow-xs' : 'bg-amber-50 text-amber-800 border-amber-200/60 shadow-xs'}`}>
                          {grpClassesCount}/{targetCount}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {readyGroups.length === 0 && (
                  <div className="col-span-full py-10 text-center text-slate-400 text-xs font-semibold">
                    No active student groups compiled yet. Add students or verify partner matching.
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/70 p-2.5 sm:p-3 rounded-xl">
              <span className="text-[10px] sm:text-xs text-slate-600 font-bold leading-tight">
                Ready: <span className="text-slate-900 font-extrabold">{readyGroups.length}</span> | Pending: <span className="text-slate-900 font-extrabold">{pendingGroups.length}</span>
              </span>
              <button 
                id="btn-goto-scheduler"
                onClick={() => setActiveTab('scheduling')}
                className="btn-primary text-[11px] sm:text-xs px-2.5 sm:px-4.5 py-2 sm:py-2.5 rounded-xl font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                Open Scheduling Wizard →
              </button>
            </div>
          </div>

          {/* Quick-start workflow assistant box with a beautiful modern visual roadmap layout */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/30 p-4 sm:p-6 rounded-2xl border border-indigo-100/90 relative overflow-hidden shadow-xs">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-300/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm sm:text-base font-black text-indigo-950 font-display flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0 mt-1 sm:mt-1.5"></span>
                <span>Driving School Automated Roadmap</span>
              </h4>
              <span className="text-[10px] font-extrabold bg-indigo-100/80 text-indigo-800 px-2.5 py-0.5 rounded-full shrink-0 border border-indigo-200/60 mt-0.5">
                6 Step Flow
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-xl mb-4 font-semibold">
              Prepare courses and schedules step-by-step:
            </p>

            {/* Mobile View: Vertical Roadmap Timeline */}
            <div className="sm:hidden relative border-l-2 border-indigo-200/90 ml-3.5 space-y-3 my-2 pl-4 py-1">
              {[
                { step: 1, title: 'Cohort', tab: 'cohorts', desc: 'Create or select active student group', icon: Users },
                { step: 2, title: 'Set Instructors', tab: 'trainers', desc: 'Assign trainers & vehicles', icon: UserCheck },
                { step: 3, title: 'Instructor Availability', tab: 'availability', desc: 'Configure trainer time slots', icon: Clock },
                { step: 4, title: 'Partner Match', tab: 'matching', desc: 'Pair under-18 students together', icon: Sparkles },
                { step: 5, title: 'Trigger Engine', tab: 'scheduling', desc: 'Run automated drive scheduler', icon: Calendar },
                { step: 6, title: 'Confirm Drives', tab: 'scheduling', desc: 'Review & publish final sessions', icon: CheckCircle }
              ].map((item) => {
                const IconComp = item.icon;
                const isFinal = item.step === 6;
                return (
                  <div key={item.step} className="relative">
                    {/* Node Dot / Badge on Timeline (aligned to start) */}
                    <div className={`absolute -left-[27px] top-3.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                      isFinal ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {item.step}
                    </div>

                    {/* Entire Step Card converted to Interactive Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.tab as any)}
                      className={`w-full text-left bg-white/95 backdrop-blur-xs p-3 rounded-xl border shadow-2xs flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                        isFinal
                          ? 'border-emerald-200/90 hover:border-emerald-400 hover:bg-emerald-50/30'
                          : 'border-indigo-100/90 hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 ${isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          <IconComp size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-slate-900 truncate leading-tight flex items-center gap-1.5">
                            <span>{item.title}</span>
                          </h5>
                          <p className="text-[10px] text-slate-500 font-semibold leading-tight truncate mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className={`p-1 rounded-md shrink-0 ${isFinal ? 'text-emerald-600 bg-emerald-50' : 'text-indigo-600 bg-indigo-50'}`}>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Horizontal Workflow Pipeline */}
            <div className="hidden sm:flex flex-wrap gap-2 items-center">
              <button onClick={() => setActiveTab('cohorts')} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">1</span>
                Cohort
              </button>
              <button onClick={() => setActiveTab('trainers')} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">2</span>
                Set Instructors
              </button>
              <button onClick={() => setActiveTab('availability')} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">3</span>
                Instructor Availability
              </button>
              <button onClick={() => setActiveTab('matching')} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">4</span>
                Partner Match
              </button>
              <button onClick={() => setActiveTab('scheduling')} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">5</span>
                Trigger Engine
              </button>
              <button onClick={() => setActiveTab('scheduling')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white font-black text-[10px] flex items-center justify-center">6</span>
                Confirm Drives
              </button>
            </div>
          </div>
        </div>

        {/* Right Tab: Attention / Notifications Area */}
        <div className="space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 font-display">Attention Alerts</h3>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100/60 text-indigo-700 font-black px-2.5 py-0.5 rounded-lg">
                {suggestedMatches.length + failedReviewGroups.length + studentsWhoNeedPartner.length} items
              </span>
            </div>

            {/* List of actions dynamically generated */}
            <div id="alerts-container" className="space-y-3">
              
              {/* 0. Reschedule Requests */}
              {pendingRequests.map((req) => {
                const cls = classes.find(c => c.id === req.classId);
                return (
                  <div key={req.id} className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex flex-col gap-2.5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                        <MessageSquare size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-mono">Reschedule Request</span>
                          <span className="text-[9px] text-amber-500 font-bold">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-950 font-extrabold mt-1">
                          {req.requesterName} ({req.requesterRole})
                        </p>
                        {req.message && <p className="text-[11px] text-amber-900 font-medium mt-1 italic">"{req.message}"</p>}
                        {cls && (
                          <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase tracking-tight">
                            Target: {cls.isSpecialDrive ? 'Special Drive' : `Lesson ${cls.classNumber}`} • {cls.date}
                          </p>
                        )}
                        
                        {req.suggestedSlots && req.suggestedSlots.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Suggested Slots:</p>
                            <div className="grid grid-cols-1 gap-1">
                              {req.suggestedSlots.map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => onResolveReschedule(req.id, 'Resolved', slot)}
                                  className="text-left p-1.5 bg-white border border-amber-100 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group/slot"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-800">{slot.date}</span>
                                    <span className="text-[8px] font-bold text-slate-400">{slot.startTime} - {slot.endTime}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 justify-end mt-1">
                      <button 
                        onClick={() => onResolveReschedule(req.id, 'Resolved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition cursor-pointer shadow-xs"
                        title="Mark as Resolved"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => onResolveReschedule(req.id, 'Declined')}
                        className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg transition cursor-pointer shadow-xs"
                        title="Decline Request"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        onClick={() => setActiveTab('reschedule')}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        View Requests
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 1. Suggested partner matches */}
              {suggestedMatches.map((match, idx) => (
                <div key={idx} className="p-3.5 bg-gradient-to-tr from-indigo-50/40 via-purple-50/30 to-white rounded-xl border border-indigo-100/80 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest font-mono">Suggested Match ({match.score}%)</span>
                      <p className="text-xs text-slate-950 font-extrabold mt-1">
                        {match.s1.name} & {match.s2.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{match.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end mt-1">
                    <button 
                      onClick={() => onApproveMatch(match.s1.id, match.s2.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95 flex items-center gap-1"
                    >
                      Approve Match
                    </button>
                    <button 
                      onClick={() => setActiveTab('matching')}
                      className="text-slate-500 hover:text-slate-800 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                    >
                      Manual Match
                    </button>
                  </div>
                </div>
              ))}

              {/* 2. Students who still lack partners */}
              {studentsWhoNeedPartner.length > suggestedMatches.length * 2 && (
                <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-100 flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-mono">Teens Need Partners</span>
                    <p className="text-xs text-amber-900 font-bold mt-1 leading-snug">
                      {studentsWhoNeedPartner.length - suggestedMatches.length * 2} teens still completely unmatched.
                    </p>
                    <button 
                      onClick={() => setActiveTab('matching')}
                      className="mt-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                    >
                      Open matching dashboard &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Scheduling Needs Review alerts */}
              {failedReviewGroups.length > 0 && (
                <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-150 flex items-start gap-2.5">
                  <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest font-mono">Conflicts Detected</span>
                    <p className="text-xs text-rose-900 font-bold mt-1 leading-snug font-semibold">
                      {failedReviewGroups.length} driving classes out of compliance with instructor slots.
                    </p>
                    <button 
                      onClick={() => setActiveTab('scheduling')}
                      className="mt-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                    >
                      Review conflicts list &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Clean slate state */}
              {suggestedMatches.length === 0 && failedReviewGroups.length === 0 && studentsWhoNeedPartner.length === 0 && (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200/60">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner animate-bounce">
                    <CheckCircle size={20} />
                  </div>
                  <p className="text-xs font-black text-slate-1000">Platform Synchronized!</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">No pending warnings or suggestions requiring review.</p>
                </div>
              )}

            </div>
          </div>

          {/* Quick Active Instructors list & status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">
                Instructors Duty Status
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {trainers.length} total
              </span>
            </div>

            {/* Mobile View: Striped Table Style */}
            <div className="sm:hidden rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
              {trainers.map((tr, idx) => (
                <div 
                  key={tr.id} 
                  className={`flex items-center justify-between p-2.5 transition-colors duration-150 ${
                    idx % 2 === 0 ? 'bg-slate-50/80 hover:bg-indigo-50/40' : 'bg-white hover:bg-indigo-50/40'
                  }`}
                >
                  <div className="min-w-0 font-sans pr-2">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">{tr.name}</p>
                    <span className="text-[10px] text-slate-500 font-medium truncate block mt-0.5">{tr.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-white/80 border border-slate-200/60 shadow-2xs">
                    <span className={`w-2 h-2 rounded-full ${tr.active ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-bold ${tr.active ? 'text-emerald-700' : 'text-slate-500'}`}>{tr.active ? 'Duty On' : 'Off'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Original Base Style */}
            <div className="hidden sm:block space-y-2.5">
              {trainers.map(tr => (
                <div key={tr.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition duration-150">
                  <div className="min-w-0 font-sans">
                    <p className="text-xs font-bold text-slate-900 leading-none">{tr.name}</p>
                    <span className="text-[10px] text-slate-500 font-semibold">{tr.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${tr.active ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] text-slate-600 font-bold">{tr.active ? 'Duty On' : 'Off'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Feedback Feed */}
          {recentFeedback.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">
                  Student Feedback
                </h3>
                <Star size={14} className="text-amber-400 fill-amber-400" />
              </div>
              <div className="space-y-4">
                {recentFeedback.map((fb) => (
                  <div key={fb.id} className="space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900">{fb.studentName}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={10} className={`${fb.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    {fb.comment && (
                      <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                        "{fb.comment}"
                      </p>
                    )}
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
