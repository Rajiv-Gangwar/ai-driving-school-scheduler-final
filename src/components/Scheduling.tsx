import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Clock, 
  User, 
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Edit2,
  X,
  ChevronDown,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Cohort, Student, Trainer, TrainerAvailabilitySlot, ClassScheduled, ClassStatus } from '../types';
import { generateProposedScheduler, buildStudentGroups } from '../utils/scheduler';
import { getDriveColorClass } from '../utils/driveStyles';

interface SchedulingProps {
  cohorts: Cohort[];
  students: Student[];
  trainers: Trainer[];
  slots: TrainerAvailabilitySlot[];
  classes: ClassScheduled[];
  activeCohortId: string;
  setActiveCohortId?: (id: string) => void;
  onUpdateClasses: (updatedClasses: ClassScheduled[]) => void;
  onUpdateSlots: (updatedSlots: TrainerAvailabilitySlot[]) => void;
  onAddClasses: (newClasses: ClassScheduled[]) => void;
  onConfirmAllProposed: () => void;
}

export default function Scheduling({
  cohorts,
  students,
  trainers,
  slots,
  classes,
  activeCohortId,
  setActiveCohortId,
  onUpdateClasses,
  onUpdateSlots,
  onAddClasses,
  onConfirmAllProposed
}: SchedulingProps) {
  const [filterMode, setFilterMode] = useState<'All' | 'Proposed' | 'Confirmed' | 'Needs Review'>('All');
  const [viewGroup, setViewGroup] = useState<string>('all');
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  
  // Calendar States
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('Calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-01'));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-06-15');
  
  // Reassignment inline states
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editTrainerId, setEditTrainerId] = useState<string>('');
  const [editSlotId, setEditSlotId] = useState<string>('');

  const activeCohort = cohorts.find(c => c.id === activeCohortId) || cohorts[0];

  const handleGenerate = () => {
    if (!activeCohort) return;
    
    // Call scheduler logic
    const { classes: generated, slotsUpdated, failedGroups } = generateProposedScheduler(
      activeCohort,
      students,
      trainers,
      slots,
      classes // preserve other cohort states
    );

    // Merge or save classes of current active cohort
    // Keep other cohort classes untouched:
    const otherCohortClasses = classes.filter(cls => cls.cohortId !== activeCohortId);
    
    onUpdateClasses([...otherCohortClasses, ...generated]);
    onUpdateSlots(slotsUpdated);
  };

  const handleSingleSave = (clsId: string) => {
    // Save trainer or slot change
    const matchedClass = classes.find(c => c.id === clsId);
    if (!matchedClass) return;

    let updatedClasses = classes.map(cls => {
      if (cls.id === clsId) {
        let updated = { ...cls };
        if (editTrainerId) updated.trainerId = editTrainerId;

        // If slot is specified, update date & times
        if (editSlotId) {
          const matchedSlot = slots.find(s => s.id === editSlotId);
          if (matchedSlot) {
            updated.date = matchedSlot.date;
            updated.startTime = matchedSlot.startTime;
            updated.endTime = matchedSlot.endTime;
            // Also mark previous slot as Open and new slot as Booked
            const previousSlot = slots.find(
              s => s.trainerId === cls.trainerId && s.date === cls.date && s.startTime === cls.startTime
            );
            if (previousSlot) previousSlot.status = 'Open';
            matchedSlot.status = 'Booked';
          }
        }
        
        // Mark status as proposed instead of Needs Review since it's manually adjusted now
        updated.status = 'Proposed';
        return updated;
      }
      return cls;
    });

    onUpdateClasses(updatedClasses);
    setEditingClassId(null);
  };

  const toggleConfirmClass = (clsId: string, confirm: boolean) => {
    const updated = classes.map(cls => {
      if (cls.id === clsId) {
        return {
          ...cls,
          status: confirm ? ('Confirmed' as ClassStatus) : ('Proposed' as ClassStatus)
        };
      }
      return cls;
    });
    onUpdateClasses(updated);
  };

  const handleCancelClass = (clsId: string) => {
    const classDetail = classes.find(c => c.id === clsId);
    if (!classDetail) return;

    // Free slot in availability list
    const updatedSlots = slots.map(sl => {
      if (sl.trainerId === classDetail.trainerId && sl.date === classDetail.date && sl?.startTime === classDetail.startTime) {
        return { ...sl, status: 'Open' as const };
      }
      return sl;
    });
    onUpdateSlots(updatedSlots);

    // Mark class as cancelled
    const updatedClasses = classes.map(cls => {
      if (cls.id === clsId) {
        return { ...cls, status: 'Cancelled' as ClassStatus };
      }
      return cls;
    });
    onUpdateClasses(updatedClasses);
  };

  // Filter current active cohort classes
  const cohortClasses = classes.filter(cls => cls.cohortId === activeCohortId);

  // Sync selectedCalendarDate and currentDate when active cohort or classes change
  React.useEffect(() => {
    if (cohortClasses.length > 0) {
      setSelectedCalendarDate(cohortClasses[0].date);
      const d = new Date(cohortClasses[0].date);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    } else {
      setSelectedCalendarDate('2026-06-15');
      setCurrentDate(new Date('2026-06-01'));
    }
  }, [activeCohortId]);

  // Group filter list
  const cohortStudents = students.filter(s => s.cohortId === activeCohortId);
  const groupsList = buildStudentGroups(cohortStudents).filter(g => g.type !== 'Pending');

  // Filter by Group & Status Filters
  const filteredClasses = cohortClasses.filter(cls => {
    if (viewGroup !== 'all' && cls.groupId !== viewGroup) return false;
    if (filterMode === 'All') return true;
    return cls.status === filterMode;
  });

  // Open Slots available for rebooking
  const availableSlots = slots.filter(s => s.cohortId === activeCohortId && s.status === 'Open');

  // Sort chronological
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const dt = a.date.localeCompare(b.date);
    if (dt !== 0) return dt;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div id="scheduling-tab" className="space-y-6 animate-fade-in">
      
      {/* Header and Generate Button with premium active dashboard gradient branding */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-lg relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full xl:w-auto text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Automated Class Scheduling Wizard</h2>
          <p className="text-[10px] sm:text-xs text-indigo-200 mt-0.5 font-medium max-w-xl">Auto-generate 6 two-hour classes matching student preferences, open instructor slots, and blockout calendars.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto relative z-10">
          {cohorts.length > 0 && setActiveCohortId && (
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 bg-white/10 hover:bg-white/15 active:scale-98 transition-all duration-150 px-3.5 py-2.5 rounded-xl border border-white/15 cursor-pointer shadow-2xs text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest shrink-0">Cohort:</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">{activeCohort?.name || 'Select Cohort'}</span>
                </div>
                <ChevronDown size={15} className={`text-indigo-300 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <AnimatePresence>
                {isCohortDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsCohortDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-64 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 border-b border-slate-800 flex items-center justify-between">
                        <span>Select Program Cohort</span>
                        <span className="text-indigo-400 font-bold">{cohorts.length} available</span>
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
                                  ? 'bg-indigo-600 text-white font-extrabold border border-indigo-500 shadow-2xs'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              {isActive && <Check size={14} className="text-white shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleGenerate}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              <Sparkles size={14} className="text-purple-200" />
              Generate Schedule
            </button>
            
            {cohortClasses.filter(c => c.status === 'Proposed').length > 0 && (
              <button
                onClick={onConfirmAllProposed}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-emerald-600/40 hover:-translate-y-0.5"
              >
                <CheckCircle size={14} />
                Confirm Proposed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of group completion summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Statistics list with luxurious sidebars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs md:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Group Lesson Progress</h3>
          
          <div className="space-y-3">
            {groupsList.map(grp => {
              const count = cohortClasses.filter(cls => cls.groupId === grp.id && cls.status !== 'Cancelled').length;
              const hasAlert = cohortClasses.some(cls => cls.groupId === grp.id && cls.status === 'Needs Review');
              const names = cohortStudents.filter(s => grp.studentIds.includes(s.id)).map(s => s.name).join(' & ');
              const targetCount = grp.type === 'Solo' ? 3 : 6; // 3 sessions for solo (6h), 6 sessions for pairs (12h)
              const isMatchFinished = count >= targetCount;

              return (
                <div key={grp.id} className={`p-3 rounded-xl border transition-all ${isMatchFinished ? 'bg-emerald-50/20 border-emerald-100/80' : 'bg-slate-50/50 border-slate-200/60'} flex items-center justify-between gap-1`}>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate" title={names}>{names}</p>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono">{grp.type} Group</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAlert && (
                      <span className="p-1 text-rose-500 animate-pulse" title="Review exceptions inside slots">
                        <AlertTriangle size={13} />
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${isMatchFinished ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' : 'bg-amber-50 text-amber-800 border-amber-200/60'}`}>
                      {count} / {targetCount} drives
                    </span>
                  </div>
                </div>
              );
            })}

            {groupsList.length === 0 && (
              <p className="text-xs text-slate-400 font-semibold text-center py-10 leading-relaxed">No driving groups formatted yet. Pair up student profiles inside partner tab.</p>
            )}
          </div>
        </div>

        {/* Dynamic proposed schedule table column */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          
          {/* Table Filters with glass-pills look */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-slate-200/80 cursor-pointer shadow-2xs text-left"
                >
                  <Filter size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-800 font-extrabold truncate max-w-[120px] sm:max-w-[200px]">
                    {viewGroup === 'all' 
                      ? 'All Groups' 
                      : (groupsList.find(g => g.id === viewGroup)
                          ? cohortStudents.filter(s => groupsList.find(g => g.id === viewGroup)?.studentIds.includes(s.id)).map(s => s.name).join(' & ')
                          : 'All Groups')}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isGroupDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>

                <AnimatePresence>
                  {isGroupDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsGroupDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                          <span>Filter Driving Group</span>
                          <span className="text-indigo-600 font-bold">{groupsList.length + 1} options</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewGroup('all');
                              setIsGroupDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                              viewGroup === 'all'
                                ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                            }`}
                          >
                            <span>All Groups</span>
                            {viewGroup === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                          </button>
                          {groupsList.map(g => {
                            const names = cohortStudents.filter(s => g.studentIds.includes(s.id)).map(s => s.name).join(' & ');
                            const isActive = viewGroup === g.id;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setViewGroup(g.id);
                                  setIsGroupDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="truncate">{names}</span>
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

              {/* View Selector Toggle between List and Calendar inside ios layout wrapper */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('List')}
                  title="List View"
                  className={`text-[10px] font-black px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'List' 
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List size={15} className="sm:hidden" />
                  <span className="hidden sm:inline">List View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('Calendar')}
                  title="Calendar View"
                  className={`text-[10px] font-black px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'Calendar' 
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon size={15} className="sm:hidden" />
                  <span className="hidden sm:inline">Calendar View</span>
                </button>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
              {(['All', 'Proposed', 'Confirmed', 'Needs Review'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`text-[9.5px] sm:text-[10px] font-black px-1.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-1 sm:flex-none text-center whitespace-nowrap ${filterMode === mode ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5' : 'text-slate-500 hover:text-[#111827]'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Slots card rows or Calendar View */}
          {viewMode === 'Calendar' ? (
            <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
              {/* Calendar controls */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <CalendarIcon size={16} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest font-display">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                      setCurrentDate(prev);
                    }}
                    aria-label="Previous Month"
                    className="bg-white hover:bg-slate-50 text-slate-700 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer border border-slate-200 transition flex items-center justify-center gap-1 active:scale-95"
                  >
                    <ChevronLeft size={16} className="sm:hidden" />
                    <span className="hidden sm:inline">&larr; Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                      setCurrentDate(next);
                    }}
                    aria-label="Next Month"
                    className="bg-white hover:bg-slate-50 text-slate-700 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer border border-slate-200 transition flex items-center justify-center gap-1 active:scale-95"
                  >
                    <ChevronRight size={16} className="sm:hidden" />
                    <span className="hidden sm:inline">Next &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Grid representation */}
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <div className="w-full sm:min-w-[600px] grid grid-cols-7 gap-1 sm:gap-1.5 border-b border-slate-100 pb-3 sm:pb-5">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase py-1 sm:py-1.5 bg-slate-50/50 rounded-lg">
                      <span className="sm:hidden">{day.slice(0, 1)}</span>
                      <span className="hidden sm:inline">{day}</span>
                    </div>
                  ))}

                  {(() => {
                    const year = currentDate.getFullYear();
                    const monthIndex = currentDate.getMonth();

                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

                    const calendarCells: { dateString: string; dayNum: number; isCurrentMonth: boolean }[] = [];

                    // Prev month overflow
                    const prevYear = monthIndex === 0 ? year - 1 : year;
                    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
                    const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();

                    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                      const dayNum = daysInPrev - i;
                      const mm = String(prevMonth + 1).padStart(2, '0');
                      const dd = String(dayNum).padStart(2, '0');
                      calendarCells.push({
                        dateString: `${prevYear}-${mm}-${dd}`,
                        dayNum,
                        isCurrentMonth: false
                      });
                    }

                    // Current month
                    for (let d = 1; d <= daysInMonth; d++) {
                      const mm = String(monthIndex + 1).padStart(2, '0');
                      const dd = String(d).padStart(2, '0');
                      calendarCells.push({
                        dateString: `${year}-${mm}-${dd}`,
                        dayNum: d,
                        isCurrentMonth: true
                      });
                    }

                    // Next month overflow
                    const nextYear = monthIndex === 11 ? year + 1 : year;
                    const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
                    let nextD = 1;
                    const gridLength = calendarCells.length <= 35 ? 35 : 42;
                    while (calendarCells.length < gridLength) {
                      const mm = String(nextMonth + 1).padStart(2, '0');
                      const dd = String(nextD).padStart(2, '0');
                      calendarCells.push({
                        dateString: `${nextYear}-${mm}-${dd}`,
                        dayNum: nextD,
                        isCurrentMonth: false
                      });
                      nextD++;
                    }

                    return calendarCells.map((cell, idx) => {
                      const dayClasses = sortedClasses.filter(c => c.date === cell.dateString);
                      const isSelected = selectedCalendarDate === cell.dateString;
                      const hasClasses = dayClasses.length > 0;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCalendarDate(cell.dateString)}
                          className={`min-h-[52px] sm:min-h-[80px] p-1 sm:p-2 border hover:bg-indigo-50/20 rounded-lg sm:rounded-xl flex flex-col justify-between items-stretch text-left transition relative cursor-pointer ${
                            !cell.isCurrentMonth ? 'text-slate-300 border-slate-100 bg-slate-50/20' : 'text-slate-800 border-slate-200 bg-white'
                          } ${isSelected ? 'ring-2 ring-indigo-600 border-transparent z-10 shadow-xs' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[8.5px] sm:text-[10px] font-black ${cell.isCurrentMonth ? 'text-slate-900 font-extrabold' : 'text-slate-400 font-medium'}`}>
                              {cell.dayNum}
                            </span>
                            {hasClasses && (
                              <span className="sm:hidden text-[7px] font-extrabold text-indigo-700 bg-indigo-50 px-1 rounded-sm leading-tight">
                                {dayClasses.length}
                              </span>
                            )}
                          </div>

                          {hasClasses && (
                            <>
                              {/* Mobile View (< sm) */}
                              <div className="sm:hidden space-y-0.5 mt-0.5 overflow-hidden">
                                {dayClasses.slice(0, 2).map((cl, cidx) => (
                                  <div
                                    key={cl.id || cidx}
                                    className={`text-[7px] font-black px-0.5 rounded py-0.5 truncate leading-none border ${getDriveColorClass(cl.classNumber, cl.isSpecialDrive)}`}
                                  >
                                    {cl.isSpecialDrive ? 'S' : `#${cl.classNumber}`}
                                  </div>
                                ))}
                                {dayClasses.length > 2 && (
                                  <div className="text-[6.5px] font-extrabold text-slate-400 text-center leading-none">
                                    +{dayClasses.length - 2}
                                  </div>
                                )}
                              </div>

                              {/* Desktop View (sm:block) */}
                              <div className="hidden sm:block space-y-1 mt-1.5 overflow-hidden">
                                {dayClasses.map((cl, cidx) => (
                                  <div 
                                    key={cl.id || cidx} 
                                    className={`text-[8px] font-black px-1.5 rounded-md py-0.5 truncate border ${getDriveColorClass(cl.classNumber, cl.isSpecialDrive)} ${
                                      cl.status === 'Needs Review' ? 'ring-1 ring-rose-500 ring-offset-0' : ''
                                    }`}
                                    title={`${cl.studentNames} (Class #${cl.classNumber}${cl.isSpecialDrive ? ' - Special' : ''})`}
                                  >
                                    {cl.isSpecialDrive ? 'S' : `#${cl.classNumber}`} {cl.studentNames.split('&')[0]}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Day focus breakdown list */}
              <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <h4 className="text-[10px] sm:text-xs font-black text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock size={13} className="text-indigo-500 shrink-0" />
                    <span>Selected Day lessons:</span>
                    <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">{selectedCalendarDate}</span>
                  </h4>
                  <span className="self-start sm:self-auto text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                    {sortedClasses.filter(c => c.date === selectedCalendarDate).length} class(es)
                  </span>
                </div>

                {(() => {
                  const dayClassesList = sortedClasses.filter(c => c.date === selectedCalendarDate);
                  if (dayClassesList.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-500 italic py-6 text-center">
                        No driving sessions scheduled on {selectedCalendarDate} matching your filters. Click any calendar cell day above.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {dayClassesList.map((cls) => {
                        const trainer = trainers.find(t => t.id === cls.trainerId);
                        const isEditing = editingClassId === cls.id;

                        return (
                          <div key={cls.id} className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/90 space-y-3 shadow-2xs text-xs">
                            
                            {/* Card Top Header: Badges, Student Names & Action Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
                              <div className="space-y-1 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-slate-100 text-slate-800 text-[9.5px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200/60">
                                    Drive {cls.classNumber} of {groupsList.find(g => g.id === cls.groupId)?.type === 'Solo' ? 3 : 6}
                                  </span>
                                  <span className={`text-[9px] sm:text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border ${
                                    cls.status === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                      : cls.status === 'Needs Review'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200/60 flex items-center gap-0.5'
                                      : cls.status === 'Cancelled'
                                      ? 'bg-slate-100 text-slate-600 border-slate-200/60'
                                      : 'bg-amber-50 text-amber-800 border-amber-200/60'
                                  }`}>
                                    {cls.status === 'Needs Review' && <AlertTriangle size={10} />}
                                    {cls.status}
                                  </span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{cls.studentNames}</h4>
                              </div>

                              {/* Action Controls */}
                              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                {cls.status === 'Proposed' && (
                                  <button
                                    onClick={() => toggleConfirmClass(cls.id, true)}
                                    className="flex-1 sm:flex-none justify-center bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-[10px] font-bold px-3 py-1.5 sm:py-1 rounded-lg flex items-center gap-1 transition cursor-pointer border border-emerald-200/60"
                                  >
                                    <Check size={12} /> Confirm Drive
                                  </button>
                                )}

                                {cls.status === 'Confirmed' && (
                                  <button
                                    onClick={() => toggleConfirmClass(cls.id, false)}
                                    className="flex-1 sm:flex-none justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[10px] font-bold px-3 py-1.5 sm:py-1 rounded-lg transition cursor-pointer border border-slate-200/60"
                                  >
                                    Revert to Proposed
                                  </button>
                                )}

                                {!isEditing && cls.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => {
                                      setEditingClassId(cls.id);
                                      setEditTrainerId(cls.trainerId);
                                      setEditSlotId('');
                                    }}
                                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 p-2 sm:p-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center justify-center min-w-[32px] sm:min-w-0"
                                    title="Reschedule / Reassign Trainer"
                                    aria-label="Edit lesson"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}

                                {cls.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleCancelClass(cls.id)}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 p-2 sm:p-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center justify-center min-w-[32px] sm:min-w-0"
                                    title="Cancel Class"
                                    aria-label="Cancel lesson"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Info Box */}
                            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-1.5 sm:gap-x-5 text-[11px] sm:text-xs text-slate-600 font-semibold bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-200/70">
                              <span className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400 shrink-0" />
                                Instructor: <strong className="text-slate-900 font-extrabold">{trainer?.name || 'Unset instructor'}</strong>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon size={13} className="text-slate-400 shrink-0" />
                                Date: <strong className="text-slate-900 font-extrabold">{cls.date}</strong>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-slate-400 shrink-0" />
                                Time block: <strong className="text-slate-900 font-extrabold">{cls.startTime} - {cls.endTime} (2h)</strong>
                              </span>
                            </div>

                            {/* Inline Edit Form */}
                            {isEditing && (
                              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                                <h5 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Reschedule / Change Slot Settings</h5>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                  <div className="bg-white p-2.5 sm:p-2 rounded-lg border border-slate-200">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Change Instructor</label>
                                    <select
                                      value={editTrainerId}
                                      onChange={(e) => setEditTrainerId(e.target.value)}
                                      className="w-full text-xs font-semibold text-slate-900 bg-transparent cursor-pointer focus:outline-hidden"
                                    >
                                      {trainers.filter(t => t.active).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="bg-white p-2.5 sm:p-2 rounded-lg border border-slate-200">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Available Open Slots</label>
                                    <select
                                      value={editSlotId}
                                      onChange={(e) => setEditSlotId(e.target.value)}
                                      className="w-full text-xs font-semibold text-slate-900 bg-transparent cursor-pointer focus:outline-hidden"
                                    >
                                      <option value="">Keep current date/time...</option>
                                      {availableSlots.map(sl => {
                                        const slotsTrainer = trainers.find(t => t.id === sl.trainerId)?.name || 'Instructor';
                                        return (
                                          <option key={sl.id} value={sl.id}>
                                            {sl.date} @ {sl.startTime}-{sl.endTime} ({slotsTrainer})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={() => handleSingleSave(cls.id)}
                                    className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
                                  >
                                    Confirm Change
                                  </button>
                                  <button
                                    onClick={() => setEditingClassId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                                  >
                                    Discard
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Warnings */}
                            {cls.status === 'Needs Review' && (
                              <div className="p-2.5 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-lg text-[10px] font-bold animate-fade-in flex items-start gap-1.5">
                                <AlertTriangle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                                <span>{cls.notes || 'Conflict warning: This class doesn\'t completely fit any of the instructor open slots or overlaps with blockout limits.'}</span>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {sortedClasses.map(cls => {
                const trainer = trainers.find(t => t.id === cls.trainerId);
                const isEditing = editingClassId === cls.id;

                return (
                  <div key={cls.id} className="p-4 space-y-3 hover:bg-gray-50/20 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      
                      {/* Class metadata */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-gray-100 text-[#111827] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                            Drive {cls.classNumber} of {groupsList.find(g => g.id === cls.groupId)?.type === 'Solo' ? 3 : 6}
                          </span>
                          
                          {/* Status badges */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            cls.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-800'
                              : cls.status === 'Needs Review'
                              ? 'bg-red-50 text-red-800 flex items-center gap-0.5'
                              : cls.status === 'Cancelled'
                              ? 'bg-gray-100 text-[#4B5563]'
                              : 'bg-amber-50 text-amber-805'
                          }`}>
                            {cls.status === 'Needs Review' && <AlertTriangle size={10} />}
                            {cls.status}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-[#111827]">{cls.studentNames}</h4>
                      </div>

                      {/* Operational controls */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {cls.status === 'Proposed' && (
                          <button
                            onClick={() => toggleConfirmClass(cls.id, true)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-0.5 transition cursor-pointer"
                          >
                            <Check size={12} /> Confirm Drive
                          </button>
                        )}

                        {cls.status === 'Confirmed' && (
                          <button
                            onClick={() => toggleConfirmClass(cls.id, false)}
                            className="bg-gray-100 hover:bg-gray-150 text-[#4B5563] text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Revert to Proposed
                          </button>
                        )}

                        {!isEditing && cls.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setEditingClassId(cls.id);
                              setEditTrainerId(cls.trainerId);
                              setEditSlotId('');
                            }}
                            className="text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 p-1.5 rounded-lg border border-[#E5E7EB] transition cursor-pointer"
                            title="Reschedule / Reassign Trainer"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}

                        {cls.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelClass(cls.id)}
                            className="text-gray-400 hover:text-red-650 hover:bg-gray-50 p-1.5 rounded-lg border border-[#E5E7EB] transition cursor-pointer"
                            title="Cancel Class"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Core details row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#6B7280] font-semibold bg-gray-55 p-2.5 rounded-xl border border-[#E5E7EB]">
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-gray-400" />
                        Instructor: <strong className="text-[#111827] font-extrabold">{trainer?.name || 'Unset instructor'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={13} className="text-[#111827]" />
                        Date: <strong className="text-[#111827] font-extrabold">{cls.date}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-405" />
                        Time block: <strong className="text-[#111827] font-extrabold">{cls.startTime} - {cls.endTime} (2h)</strong>
                      </span>
                    </div>

                    {/* Inline Reassignment Editor form */}
                    {isEditing && (
                      <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-3 shadow-xs">
                        <h5 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider">Reschedule / Change Slot Settings</h5>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                            <label className="block text-[9px] font-bold text-[#6B7280] uppercase">Change Instructor</label>
                            <select
                              value={editTrainerId}
                              onChange={(e) => setEditTrainerId(e.target.value)}
                              className="w-full text-xs font-semibold text-[#111827] mt-1"
                            >
                              {trainers.filter(t => t.active).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                            <label className="block text-[9px] font-bold text-[#6B7280] uppercase">Available Open Slots</label>
                            <select
                              value={editSlotId}
                              onChange={(e) => setEditSlotId(e.target.value)}
                              className="w-full text-xs font-semibold text-[#111827] mt-1"
                            >
                              <option value="">Keep current date/time...</option>
                              {availableSlots.map(sl => {
                                const slotsTrainer = trainers.find(t => t.id === sl.trainerId)?.name || 'Trainer';
                                return (
                                  <option key={sl.id} value={sl.id}>
                                    {sl.date} @ {sl.startTime}-{sl.endTime} ({slotsTrainer})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSingleSave(cls.id)}
                            className="bg-[#111827] hover:bg-gray-800 text-white rounded-md px-3.5 py-1 text-xs font-bold transition cursor-pointer"
                          >
                            Confirm Change
                          </button>
                          <button
                            onClick={() => setEditingClassId(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-[#4B5563] rounded-md px-3.5 py-1 text-xs font-semibold transition cursor-pointer"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Needs review warnings detail info */}
                    {cls.status === 'Needs Review' && (
                      <div className="p-2.5 bg-red-50 border border-red-100 text-red-000 text-red-800 rounded-lg text-[10px] font-bold">
                        {cls.notes || 'Conflict warning: This class doesn\'t completely fit any of the instructor open slots or overlaps with blockout limits.'}
                      </div>
                    )}

                  </div>
                );
              })}

              {sortedClasses.length === 0 && (
                <p className="text-center text-[#6B7280] py-10 px-4">No generating schedules found matching the filter options. Click "Generate Automated Schedule" to initiate the calendar mapping.</p>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
