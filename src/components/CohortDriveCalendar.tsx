import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Check,
  RefreshCw,
  Trash2,
  Users,
  Search,
  Filter,
  Info,
  X
} from 'lucide-react';
import { 
  Trainer, 
  Cohort, 
  Student, 
  ClassScheduled, 
  TrainerAvailabilitySlot,
  Location
} from '../types';
import { getDriveColorClass } from '../utils/driveStyles';

interface CohortDriveCalendarProps {
  cohorts: Cohort[];
  students: Student[];
  trainers: Trainer[];
  classes: ClassScheduled[];
  slots: TrainerAvailabilitySlot[];
  locations: Location[];
  activeCohortId: string;
  setActiveCohortId: (id: string) => void;
  onUpdateClass: (updated: ClassScheduled) => void;
  onDeleteClass: (id: string) => void;
  onAddClasses: (newClasses: ClassScheduled[]) => void;
  onUpdateSlots: (updatedSlots: TrainerAvailabilitySlot[]) => void;
}

export default function CohortDriveCalendar({
  cohorts,
  students,
  trainers,
  classes,
  slots,
  locations,
  activeCohortId,
  setActiveCohortId,
  onUpdateClass,
  onDeleteClass,
  onAddClasses,
  onUpdateSlots
}: CohortDriveCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-01'));
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-15');
  const [filterInstructor, setFilterInstructor] = useState<string>('all');
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const [isInstructorDropdownOpen, setIsInstructorDropdownOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ trainerId: '', date: '', startTime: '', endTime: '' });
  const [isSchedulingNew, setIsSchedulingNew] = useState(false);
  const [newData, setNewData] = useState({ trainerId: '', tagAlongTrainerId: '', date: '', startTime: '09:00', endTime: '11:00', studentIds: [] as string[], classNumber: 1 });

  const [openStudent1Dropdown, setOpenStudent1Dropdown] = useState(false);
  const [openStudent2Dropdown, setOpenStudent2Dropdown] = useState(false);
  const [openLeadTrainerDropdown, setOpenLeadTrainerDropdown] = useState(false);
  const [openTagAlongDropdown, setOpenTagAlongDropdown] = useState(false);
  const [openRescheduleTrainerDropdown, setOpenRescheduleTrainerDropdown] = useState(false);

  const handleStartReschedule = (cls: ClassScheduled) => {
    setIsRescheduling(cls.id);
    setRescheduleData({
      trainerId: cls.trainerId,
      date: cls.date,
      startTime: cls.startTime,
      endTime: cls.endTime
    });
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewData({ ...newData, date: dateStr });
    setIsSchedulingNew(true);
  };

  const handleDayDoubleClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewData({ ...newData, date: dateStr });
    setIsSchedulingNew(true);
  };

  const handleSaveReschedule = () => {
    if (!isRescheduling) return;
    const cls = classes.find(c => c.id === isRescheduling);
    if (cls) {
      onUpdateClass({
        ...cls,
        trainerId: rescheduleData.trainerId,
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime
      });
    }
    setIsRescheduling(null);
  };

  const handleSaveNew = () => {
    const selectedStudents = students.filter(s => newData.studentIds.includes(s.id));
    const studentNames = selectedStudents.map(s => s.name).join(' & ');

    const newClass: ClassScheduled = {
      id: `manual-${Date.now()}`,
      cohortId: activeCohortId,
      trainerId: newData.trainerId || (trainers[0]?.id || ''),
      tagAlongTrainerId: newData.tagAlongTrainerId || undefined,
      studentNames: studentNames || 'Manual Drive',
      date: newData.date || selectedDate,
      startTime: newData.startTime,
      endTime: newData.endTime,
      status: 'Confirmed',
      classNumber: newData.classNumber,
      groupId: 'manual'
    };
    onAddClasses([newClass]);
    setIsSchedulingNew(false);
    setNewData({ trainerId: '', tagAlongTrainerId: '', date: '', startTime: '09:00', endTime: '11:00', studentIds: [], classNumber: 1 });
  };

  // Filter classes for the active cohort
  const cohortClasses = classes.filter(c => c.cohortId === activeCohortId && c.status !== 'Cancelled');
  
  // Apply instructor filter
  const filteredClasses = cohortClasses.filter(c => 
    filterInstructor === 'all' || c.trainerId === filterInstructor
  );

  const activeCohort = cohorts.find(c => c.id === activeCohortId);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevMonthDaysToShow = firstDay;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const today = new Date('2026-06-15');
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate('2026-06-15');
  };

  const dayClasses = filteredClasses.filter(c => c.date === selectedDate);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-1">Cohort Drive Calendar</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Manage all drives for {activeCohort?.name || 'Active Cohort'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          {/* On mobile screens (< sm): 1 row with 2 select tags side-by-side using grid grid-cols-2 */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
            {/* Cohort Dropdown */}
            <div className="relative z-40 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsCohortDropdownOpen(!isCohortDropdownOpen);
                  setIsInstructorDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                  <Filter size={13} className="text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {activeCohort?.name || 'Select Cohort'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
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
                      className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Select Cohort</span>
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

            {/* Instructor Dropdown */}
            <div className="relative z-40 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsInstructorDropdownOpen(!isInstructorDropdownOpen);
                  setIsCohortDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                  <User size={13} className="text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {filterInstructor === 'all' 
                      ? 'All Instructors' 
                      : (trainers.find(t => t.id === filterInstructor)?.name || 'Instructor')}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isInstructorDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              <AnimatePresence>
                {isInstructorDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsInstructorDropdownOpen(false)} 
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Filter Instructor</span>
                        <span className="text-indigo-600 font-bold">{trainers.filter(t => t.active).length + 1} options</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterInstructor('all');
                            setIsInstructorDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                            filterInstructor === 'all'
                              ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                          }`}
                        >
                          <span className="truncate">All Instructors</span>
                          {filterInstructor === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                        </button>

                        {trainers.filter(t => t.active).map(t => {
                          const isActive = t.id === filterInstructor;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setFilterInstructor(t.id);
                                setIsInstructorDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                              }`}
                            >
                              <span className="truncate">{t.name}</span>
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

          <button 
            type="button"
            onClick={() => setIsSchedulingNew(true)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition shadow-md shadow-indigo-200 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus size={14} /> Schedule New Drive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-8">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">
                {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white active:scale-95 rounded-lg transition text-slate-600 cursor-pointer" aria-label="Previous month">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={handleToday} className="px-2.5 sm:px-3 py-1.5 hover:bg-white active:scale-95 rounded-lg transition text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
                  Today
                </button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-white active:scale-95 rounded-lg transition text-slate-600 cursor-pointer" aria-label="Next month">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <div className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Confirmed
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Proposed
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  Needs Review
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="w-full sm:min-w-[700px]">
              <div className="grid grid-cols-7 mb-2 sm:mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest py-1 sm:py-2">
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {/* Prev month days */}
                {Array.from({ length: prevMonthDaysToShow }).map((_, i) => {
                  const day = prevMonthDays - prevMonthDaysToShow + i + 1;
                  return (
                    <div key={`prev-${i}`} className="bg-slate-50/50 p-1 sm:p-3 min-h-[50px] sm:min-h-[120px] opacity-40">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{day}</span>
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dateStr === '2026-06-15';
                  const isSelected = selectedDate === dateStr;
                  
                  const dayClasses = filteredClasses.filter(c => c.date === dateStr);
                  
                  return (
                    <button
                      key={dayNum}
                      onClick={() => handleDayClick(dateStr)}
                      onDoubleClick={() => handleDayDoubleClick(dateStr)}
                      className={`bg-white p-1 sm:p-3 min-h-[52px] sm:min-h-[120px] flex flex-col gap-0.5 sm:gap-1 transition-all hover:bg-slate-50 relative group text-left ${isSelected ? 'ring-2 ring-indigo-600 ring-inset z-10 shadow-lg' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                        <span className={`text-[9px] sm:text-[10px] font-black ${isToday ? 'bg-indigo-600 text-white w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full text-[8px] sm:text-[10px]' : 'text-slate-400'}`}>
                          {dayNum}
                        </span>
                        {dayClasses.length > 0 && (
                          <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 sm:text-indigo-400 uppercase">
                            {dayClasses.length}<span className="hidden sm:inline"> Drives</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Mobile View (< sm): Compact initial badges */}
                      <div className="sm:hidden flex flex-col gap-0.5 overflow-hidden w-full">
                        {dayClasses.slice(0, 2).map((cls) => {
                          const trainer = trainers.find(t => t.id === cls.trainerId);
                          const initials = trainer?.name.split(' ').map(n => n[0]).join('') || '??';
                          
                          return (
                            <div 
                              key={cls.id}
                              className={`text-[7px] font-extrabold px-1 py-0.5 rounded ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)} border-opacity-20 flex items-center justify-between gap-0.5 leading-none truncate`}
                            >
                              <span className="truncate">{initials}</span>
                            </div>
                          );
                        })}
                        {dayClasses.length > 2 && (
                          <div className="text-[6.5px] font-black text-slate-400 text-center leading-none">+ {dayClasses.length - 2}</div>
                        )}
                      </div>

                      {/* Desktop / Tablet View (sm:block) */}
                      <div className="hidden sm:block space-y-1 overflow-y-auto custom-scrollbar flex-1 pb-2">
                        {dayClasses.slice(0, 3).map((cls) => {
                          const trainer = trainers.find(t => t.id === cls.trainerId);
                          const initials = trainer?.name.split(' ').map(n => n[0]).join('') || '??';
                          
                          return (
                            <div 
                              key={cls.id}
                              className={`text-[8px] font-black px-1.5 py-1 rounded-md border truncate ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)} border-opacity-20 flex items-center gap-1`}
                            >
                              <span className="opacity-60">{initials}</span>
                              <span className="truncate">{cls.studentNames}</span>
                            </div>
                          );
                        })}
                        {dayClasses.length > 3 && (
                          <div className="text-[8px] font-black text-slate-400 text-center">+ {dayClasses.length - 3} more</div>
                        )}
                      </div>

                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                          <Plus size={10} />
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Next month days filler */}
                {Array.from({ length: 42 - (prevMonthDaysToShow + daysInMonth) }).map((_, i) => (
                  <div key={`next-${i}`} className="bg-slate-50/50 p-1 sm:p-3 min-h-[50px] sm:min-h-[120px] opacity-40">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Side Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Selected Date</h4>
                  <p className="text-sm font-black text-indigo-600 mt-0.5">
                    {new Date(selectedDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {dayClasses.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Clock size={32} />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    No drives scheduled<br/>for this date
                  </p>
                  <button 
                    onClick={() => setIsSchedulingNew(true)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition"
                  >
                    + Add first drive
                  </button>
                </div>
              ) : (
                dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((cls) => {
                  const trainer = trainers.find(t => t.id === cls.trainerId);
                  const tagAlong = trainers.find(t => t.id === cls.tagAlongTrainerId);
                  
                  return (
                    <div key={cls.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 group hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)}`}>
                            Session {cls.classNumber}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {cls.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStartReschedule(cls)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 active:scale-95 transition-colors cursor-pointer"
                            title="Reschedule"
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button 
                            onClick={() => {
                              onDeleteClass(cls.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-[11px] font-black text-slate-900 leading-tight">{cls.studentNames}</h5>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              <Clock size={10} className="text-slate-300" />
                              {cls.startTime} - {cls.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={10} className="text-slate-300" />
                              {trainer?.name || 'Unknown'}
                            </div>
                          </div>
                          {tagAlong && (
                            <div className="flex items-center gap-1 text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                              <Users size={10} className="text-indigo-300" />
                              Coach: {tagAlong.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {dayClasses.length > 0 && (
              <button 
                onClick={() => setIsSchedulingNew(true)}
                className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Another Drive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Rescheduling */}
      {isRescheduling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsRescheduling(null)} />
          <div className="relative bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-lg p-5 sm:p-8 shadow-2xl animate-in fade-in sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto mx-auto border border-slate-100">
            <div className="flex items-center justify-between mb-5 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">Quick Reschedule</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Adjust drive details manually</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduling(null)}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-full transition cursor-pointer shrink-0 ml-2 border border-slate-200/80 shadow-2xs"
                aria-label="Close modal"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 z-20">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructor</label>
                  <div className="relative w-full z-20">
                    <button
                      type="button"
                      onClick={() => setOpenRescheduleTrainerDropdown(!openRescheduleTrainerDropdown)}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="truncate">
                        {rescheduleData.trainerId 
                          ? (trainers.find(t => t.id === rescheduleData.trainerId)?.name || 'Select Instructor') 
                          : 'Select Instructor'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openRescheduleTrainerDropdown ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openRescheduleTrainerDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenRescheduleTrainerDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 max-h-52 overflow-y-auto"
                          >
                            {trainers.map(t => {
                              const isSelected = rescheduleData.trainerId === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setRescheduleData({ ...rescheduleData, trainerId: t.id });
                                    setOpenRescheduleTrainerDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                      : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
                                  }`}
                                >
                                  <span className="truncate">{t.name}</span>
                                  {isSelected && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                  <input 
                    type="text"
                    value={rescheduleData.startTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                  <input 
                    type="text"
                    value={rescheduleData.endTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-4 sm:pb-0">
              <button 
                type="button"
                onClick={() => setIsRescheduling(null)}
                className="flex-1 py-3.5 sm:py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveReschedule}
                className="flex-1 py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition shadow-lg shadow-indigo-200 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for New Drive */}
      {isSchedulingNew && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSchedulingNew(false)} />
          <div className="relative bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-lg p-5 sm:p-8 shadow-2xl animate-in fade-in sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto mx-auto border border-slate-100">
            <div className="flex items-center justify-between mb-5 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Plus size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">Manual Drive Entry</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Add a drive directly to the calendar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSchedulingNew(false)}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-full transition cursor-pointer shrink-0 ml-2 border border-slate-200/80 shadow-2xs"
                aria-label="Close modal"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Students (Select up to 2)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Student 1 */}
                  <div className="relative w-full z-40">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStudent1Dropdown(!openStudent1Dropdown);
                        setOpenStudent2Dropdown(false);
                        setOpenLeadTrainerDropdown(false);
                        setOpenTagAlongDropdown(false);
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="truncate">
                        {newData.studentIds[0] 
                          ? (students.find(s => s.id === newData.studentIds[0])?.name || 'Select Student 1')
                          : 'Select Student 1'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openStudent1Dropdown ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openStudent1Dropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setOpenStudent1Dropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 max-h-52 overflow-y-auto"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const newIds = [...newData.studentIds];
                                newIds.splice(0, 1);
                                setNewData({ ...newData, studentIds: newIds.filter(Boolean) });
                                setOpenStudent1Dropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer"
                            >
                              <span>None / Clear</span>
                            </button>
                            {students
                              .filter(s => s.cohortId === activeCohortId)
                              .map(s => {
                                const isSelected = newData.studentIds[0] === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      const newIds = [...newData.studentIds];
                                      newIds[0] = s.id;
                                      setNewData({ ...newData, studentIds: Array.from(new Set(newIds.filter(Boolean))) });
                                      setOpenStudent1Dropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                        : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
                                    }`}
                                  >
                                    <span className="truncate">{s.name}</span>
                                    {isSelected && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                  </button>
                                );
                              })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Student 2 */}
                  <div className="relative w-full z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStudent2Dropdown(!openStudent2Dropdown);
                        setOpenStudent1Dropdown(false);
                        setOpenLeadTrainerDropdown(false);
                        setOpenTagAlongDropdown(false);
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="truncate">
                        {newData.studentIds[1] 
                          ? (students.find(s => s.id === newData.studentIds[1])?.name || 'Select Student 2')
                          : 'Select Student 2'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openStudent2Dropdown ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openStudent2Dropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setOpenStudent2Dropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 max-h-52 overflow-y-auto"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const newIds = [...newData.studentIds];
                                if (newIds.length > 1) {
                                  newIds.splice(1, 1);
                                }
                                setNewData({ ...newData, studentIds: newIds.filter(Boolean) });
                                setOpenStudent2Dropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer"
                            >
                              <span>None / Clear</span>
                            </button>
                            {students
                              .filter(s => s.cohortId === activeCohortId)
                              .map(s => {
                                const isSelected = newData.studentIds[1] === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      const newIds = [...newData.studentIds];
                                      newIds[1] = s.id;
                                      setNewData({ ...newData, studentIds: Array.from(new Set(newIds.filter(Boolean))) });
                                      setOpenStudent2Dropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                        : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
                                    }`}
                                  >
                                    <span className="truncate">{s.name}</span>
                                    {isSelected && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                  </button>
                                );
                              })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 z-20">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Instructor</label>
                  <div className="relative w-full z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenLeadTrainerDropdown(!openLeadTrainerDropdown);
                        setOpenStudent1Dropdown(false);
                        setOpenStudent2Dropdown(false);
                        setOpenTagAlongDropdown(false);
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="truncate">
                        {newData.trainerId 
                          ? (trainers.find(t => t.id === newData.trainerId)?.name || 'Select Lead') 
                          : 'Select Lead'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openLeadTrainerDropdown ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openLeadTrainerDropdown && (
                        <>
                          <div className="fixed inset-0 z-25" onClick={() => setOpenLeadTrainerDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 max-h-52 overflow-y-auto"
                          >
                            {trainers.filter(t => t.active).map(t => {
                              const isSelected = newData.trainerId === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setNewData({ ...newData, trainerId: t.id });
                                    setOpenLeadTrainerDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                      : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
                                  }`}
                                >
                                  <span className="truncate">{t.name}</span>
                                  {isSelected && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-1.5 z-10">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tag Along Coach</label>
                  <div className="relative w-full z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenTagAlongDropdown(!openTagAlongDropdown);
                        setOpenStudent1Dropdown(false);
                        setOpenStudent2Dropdown(false);
                        setOpenLeadTrainerDropdown(false);
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <span className="truncate">
                        {newData.tagAlongTrainerId 
                          ? (trainers.find(t => t.id === newData.tagAlongTrainerId)?.name || 'None') 
                          : 'None'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openTagAlongDropdown ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openTagAlongDropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setOpenTagAlongDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 z-50 max-h-52 overflow-y-auto"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setNewData({ ...newData, tagAlongTrainerId: '' });
                                setOpenTagAlongDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer"
                            >
                              <span>None</span>
                            </button>
                            {trainers.filter(t => t.active && t.id !== newData.trainerId).map(t => {
                              const isSelected = newData.tagAlongTrainerId === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setNewData({ ...newData, tagAlongTrainerId: t.id });
                                    setOpenTagAlongDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                      : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
                                  }`}
                                >
                                  <span className="truncate">{t.name}</span>
                                  {isSelected && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date"
                    value={newData.date || selectedDate}
                    onChange={(e) => setNewData({ ...newData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session #</label>
                  <input 
                    type="number"
                    value={newData.classNumber}
                    onChange={(e) => setNewData({ ...newData, classNumber: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                  <input 
                    type="text"
                    value={newData.startTime}
                    onChange={(e) => setNewData({ ...newData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                  <input 
                    type="text"
                    value={newData.endTime}
                    onChange={(e) => setNewData({ ...newData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-xs font-black text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-4 sm:pb-0">
              <button 
                type="button"
                onClick={() => setIsSchedulingNew(false)}
                className="flex-1 py-3.5 sm:py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveNew}
                className="flex-1 py-3.5 sm:py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-200 cursor-pointer"
              >
                Schedule Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
