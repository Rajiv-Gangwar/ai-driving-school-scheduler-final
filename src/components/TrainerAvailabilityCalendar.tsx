import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Settings, 
  Sparkles, 
  Grid, 
  Clock, 
  Filter, 
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Save,
  X,
  RefreshCw,
  Trash,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { Trainer, Cohort, TrainerAvailabilitySlot, ClassScheduled, RescheduleRequest, UserProfile } from '../types';
import { generateSlotsFromRule } from '../utils/scheduler';
import { getDriveColorClass } from '../utils/driveStyles';

interface TrainerAvailabilityCalendarProps {
  slots: TrainerAvailabilitySlot[];
  classes: ClassScheduled[];
  trainers: Trainer[];
  cohorts: Cohort[];
  activeCohortId: string;
  setActiveCohortId?: (id: string) => void;
  onAddSlots: (newSlots: TrainerAvailabilitySlot[]) => void;
  onUpdateSlotStatus: (slotId: string, status: 'Open' | 'Booked' | 'Unavailable') => void;
  onDeleteSlot: (slotId: string) => void;
  onUpdateClass: (updated: ClassScheduled) => void;
  onDeleteClass: (id: string) => void;
  onRequestReschedule: (req: Omit<RescheduleRequest, 'id' | 'createdAt' | 'status'>) => void;
  userProfile: UserProfile;
  setActiveTab?: (tab: string) => void;
}

export default function TrainerAvailabilityCalendar({
  slots,
  classes,
  trainers,
  cohorts,
  activeCohortId,
  setActiveCohortId,
  onAddSlots,
  onUpdateSlotStatus,
  onDeleteSlot,
  onUpdateClass,
  onDeleteClass,
  onRequestReschedule,
  userProfile,
  setActiveTab
}: TrainerAvailabilityCalendarProps) {
  // Bulk Setup State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkTrainerId, setBulkTrainerId] = useState(trainers[0]?.id || '');
  const [startDate, setStartDate] = useState(cohorts[0]?.startDate || '2026-06-01');
  const [endDate, setEndDate] = useState(cohorts[0]?.endDate || '2026-06-30');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(['Monday', 'Wednesday', 'Saturday']);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('20:00');
  const [bulkMessage, setBulkMessage] = useState('');

  // Single Exception Slot State
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [singleTrainerId, setSingleTrainerId] = useState(trainers[0]?.id || '');
  const [singleDate, setSingleDate] = useState('2026-06-12');
  const [singleStart, setSingleStart] = useState('16:00');
  const [singleEnd, setSingleEnd] = useState('18:00');

  React.useEffect(() => {
    if (trainers.length > 0) {
      setBulkTrainerId(trainers[0].id);
      setSingleTrainerId(trainers[0].id);
    }
  }, [trainers]);

  // Filter View State
  const [filterTrainer, setFilterTrainer] = useState<string>('all');
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const [isFilterTrainerDropdownOpen, setIsFilterTrainerDropdownOpen] = useState(false);
  const [isBulkTrainerDropdownOpen, setIsBulkTrainerDropdownOpen] = useState(false);
  const [isSingleTrainerDropdownOpen, setIsSingleTrainerDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Trainer-wise' | 'Calendar'>(
    trainers.length === 1 ? 'Calendar' : 'Trainer-wise'
  );

  const isSingleInstructor = trainers.length === 1;

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const currentCohort = cohorts.find(c => c.id === activeCohortId);
    if (currentCohort?.startDate) {
      const d = new Date(currentCohort.startDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date('2026-06-01');
  });

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

  // Reschedule State
  const [rescheduleClass, setRescheduleClass] = useState<ClassScheduled | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{date: string, startTime: string, endTime: string}[]>([
    { date: '', startTime: '09:00', endTime: '11:00' }
  ]);

  React.useEffect(() => {
    const currentCohort = cohorts.find(c => c.id === activeCohortId);
    if (currentCohort?.startDate) {
      const d = new Date(currentCohort.startDate);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
        setSelectedCalendarDate(currentCohort.startDate);
      }
    }
  }, [activeCohortId, cohorts]);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleWeekday = (day: string) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleBulkGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTrainerId) {
      setBulkMessage('Please select a trainer first.');
      return;
    }
    if (selectedWeekdays.length === 0) {
      setBulkMessage('Please select at least one weekday.');
      return;
    }

    const newSlots = generateSlotsFromRule({
      id: `rule-${Date.now()}`,
      trainerId: bulkTrainerId,
      cohortId: activeCohortId,
      startDate,
      endDate,
      daysOfWeek: selectedWeekdays,
      startTime,
      endTime,
      slotDurationMinutes: 120 // 2-hours sessions
    });

    onAddSlots(newSlots);
    setBulkMessage(`Successfully generated ${newSlots.length} open instructor slots!`);
    setTimeout(() => {
      setBulkMessage('');
      setIsBulkOpen(false);
    }, 2500);
  };

  const handleSingleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTrainerId) return;

    const slotId = `slot-${singleTrainerId}-${singleDate}-${singleStart.replace(':', '')}`;
    const newSlot: TrainerAvailabilitySlot = {
      id: slotId,
      trainerId: singleTrainerId,
      cohortId: activeCohortId,
      date: singleDate,
      startTime: singleStart,
      endTime: singleEnd,
      status: 'Open',
      isException: true
    };

    onAddSlots([newSlot]);
    setIsSingleOpen(false);
  };

  // Filter slots of current active cohort
  const cohortSlots = slots.filter(s => s.cohortId === activeCohortId);

  // Filtered by Trainer selection
  const filteredSlots = cohortSlots.filter(s => {
    if (filterTrainer === 'all') return true;
    return s.trainerId === filterTrainer;
  });

  // Sorting
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  // Group slots for the views
  // Trainer-wise grouping:
  const trainerGroups: Record<string, TrainerAvailabilitySlot[]> = {};
  trainers.forEach(t => {
    trainerGroups[t.id] = [];
  });
  sortedSlots.forEach(s => {
    if (trainerGroups[s.trainerId]) {
      trainerGroups[s.trainerId].push(s);
    }
  });

  // Dates grouping:
  const dateGroups: Record<string, TrainerAvailabilitySlot[]> = {};
  sortedSlots.forEach(s => {
    if (!dateGroups[s.date]) {
      dateGroups[s.date] = [];
    }
    dateGroups[s.date].push(s);
  });

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-lg font-bold text-[#111827]">Instructor Availability Calendar</h2>
          <p className="text-xs text-[#6B7280]">Configure open slot schedules in bulk and handle single date exceptions.</p>
          {setActiveCohortId && (
            <div className="relative z-40 mt-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full sm:w-auto cursor-pointer shadow-xs text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] shrink-0">Current Cohort:</span>
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {cohorts.find(c => c.id === activeCohortId)?.name || 'Select Cohort'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCohortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCohortDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-40 overflow-hidden"
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
                                if (setActiveCohortId) {
                                  setActiveCohortId(c.id);
                                }
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
          )}
        </div>

        {/* Action Buttons: Desktop inline row vs Mobile 2x1 grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="col-span-1 sm:col-span-auto bg-[#111827] hover:bg-gray-800 active:scale-95 text-white px-2.5 sm:px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs w-full sm:w-auto"
          >
            <Settings size={14} className="shrink-0" />
            <span>Bulk Create slots</span>
          </button>
          <button
            onClick={() => setIsSingleOpen(!isSingleOpen)}
            className="col-span-1 sm:col-span-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 sm:px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs w-full sm:w-auto"
          >
            <Plus size={14} className="shrink-0" />
            <span>Add Custom Slot</span>
          </button>
          <button
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('scheduling');
              } else {
                const schedulingTab = document.getElementById('scheduling-tab');
                if (schedulingTab) {
                  schedulingTab.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            className="col-span-2 sm:col-span-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 sm:px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs w-full sm:w-auto"
          >
            <CalendarIcon size={14} className="shrink-0" />
            <span>Manually Assign Drives</span>
          </button>
        </div>
      </div>

      {/* Bulk Generation Form */}
      {isBulkOpen && (
        <div className="bg-[#F9FAFB] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] space-y-4 shadow-sm relative">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                <Sparkles size={16} className="fill-amber-400/30" />
              </span>
              <span>Bulk Setup Driving Instructor Availability</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer shrink-0 block sm:hidden"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>

          {bulkMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-850 text-xs rounded-xl font-semibold border border-emerald-100">
              {bulkMessage}
            </div>
          )}
          <form onSubmit={handleBulkGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            
            {/* Trainer Choice */}
            {!isSingleInstructor && (
              <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl relative z-40 shadow-2xs">
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">Assigned Instructor</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBulkTrainerDropdownOpen(!isBulkTrainerDropdownOpen)}
                    className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 active:scale-98 transition px-2.5 py-1.5 rounded-lg border border-slate-200 w-full text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {trainers.find(t => t.id === bulkTrainerId)?.name || 'Select instructor...'}
                    </span>
                    <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isBulkTrainerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isBulkTrainerDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsBulkTrainerDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-40 max-h-52 overflow-y-auto"
                        >
                          {trainers.filter(t => t.active).map(t => {
                            const isSelected = t.id === bulkTrainerId;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setBulkTrainerId(t.id);
                                  setIsBulkTrainerDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                                  isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span className="truncate">{t.name}</span>
                                {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Date Range Option */}
            <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl shadow-2xs">
              <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">Date Limits</label>
              <div className="flex flex-row items-center gap-1.5 sm:gap-1 text-[#111827]">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-bold sm:font-normal bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1.5 sm:p-0 flex-1 sm:flex-none sm:w-28 focus:outline-hidden min-w-0 cursor-pointer"
                />
                <span className="text-[#6B7280] text-xs text-center shrink-0">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-bold sm:font-normal bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1.5 sm:p-0 flex-1 sm:flex-none sm:w-28 focus:outline-hidden min-w-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Start/End Time Options */}
            <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl shadow-2xs">
              <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">Daily Time blocks (2h slots)</label>
              <div className="flex flex-row items-center gap-1.5 sm:gap-1 text-[#111827]">
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="16:00"
                  className="text-xs font-bold bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1.5 sm:p-0 flex-1 sm:flex-none sm:w-16 text-center focus:outline-hidden min-w-0"
                />
                <span className="text-[#6B7280] text-xs text-center shrink-0">-</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="20:00"
                  className="text-xs font-bold bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1.5 sm:p-0 flex-1 sm:flex-none sm:w-16 text-center focus:outline-hidden min-w-0"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#111827] hover:bg-gray-850 active:scale-98 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-xs cursor-pointer h-10 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span>Generate Bulk Slots</span>
              </button>
            </div>

            {/* Weekdays checkboxes */}
            <div className="col-span-1 md:col-span-4 bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2 sm:items-center shadow-2xs">
              <span className="block text-xs font-bold text-[#111827] sm:mr-2 uppercase tracking-wide">Weekly Schedule:</span>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                {weekdays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`text-[11px] font-bold py-1.5 sm:py-1 px-2.5 sm:px-3 rounded-lg transition cursor-pointer text-center active:scale-95 ${selectedWeekdays.includes(day) ? 'bg-[#111827] text-white shadow-2xs' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Exception Custom Single Selector */}
      {isSingleOpen && (
        <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-900 flex items-center gap-2">
              <span className="p-1 bg-emerald-200/80 text-emerald-800 rounded-lg shrink-0">
                <Plus size={15} className="stroke-[2.5]" />
              </span>
              <span>Add Alternate Exception Availability Slot</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsSingleOpen(false)}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-xl transition cursor-pointer shrink-0"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSingleSave} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            
            {!isSingleInstructor && (
              <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl relative z-40 shadow-2xs">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">INSTRUCTOR</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSingleTrainerDropdownOpen(!isSingleTrainerDropdownOpen)}
                    className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 active:scale-98 transition px-2.5 py-1.5 rounded-lg border border-slate-200 w-full text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {trainers.find(t => t.id === singleTrainerId)?.name || 'Select instructor...'}
                    </span>
                    <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isSingleTrainerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isSingleTrainerDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSingleTrainerDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-40 max-h-52 overflow-y-auto"
                        >
                          {trainers.filter(t => t.active).map(t => {
                            const isSelected = t.id === singleTrainerId;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSingleTrainerId(t.id);
                                  setIsSingleTrainerDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                                  isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span className="truncate">{t.name}</span>
                                {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl shadow-2xs">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">DATE</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full text-xs font-bold text-[#111827] bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1 sm:p-0 cursor-pointer"
              />
            </div>

            <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl shadow-2xs">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">START TIME</label>
              <input
                type="text"
                value={singleStart}
                onChange={(e) => setSingleStart(e.target.value)}
                placeholder="16:00"
                className="w-full text-xs font-bold text-[#111827] bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1 sm:p-0"
              />
            </div>

            <div className="bg-white p-2.5 border border-[#E5E7EB] rounded-xl shadow-2xs">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">END TIME</label>
              <input
                type="text"
                value={singleEnd}
                onChange={(e) => setSingleEnd(e.target.value)}
                placeholder="18:00"
                className="w-full text-xs font-bold text-[#111827] bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-lg sm:rounded-none px-2 py-1 sm:p-0"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer h-10 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} className="shrink-0" />
                <span>Add Exception Slot</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Main Filter & View Controllers */}
      <div className={`bg-white p-3 sm:p-4 rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 ${isSingleInstructor ? 'sm:justify-end' : ''}`}>
        
        {/* Filters */}
        {!isSingleInstructor && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter size={16} className="text-[#6B7280] shrink-0" />
            <span className="text-xs font-semibold text-[#6B7280] shrink-0">Instructor:</span>
            
            <div className="relative z-40 w-full sm:w-60">
              <button
                type="button"
                onClick={() => setIsFilterTrainerDropdownOpen(!isFilterTrainerDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full sm:w-60 cursor-pointer shadow-xs text-left"
              >
                <span className="text-xs font-extrabold text-slate-800 truncate">
                  {filterTrainer === 'all'
                    ? 'All Instructors'
                    : (trainers.find(t => t.id === filterTrainer)?.name || 'Select Instructor')
                  }
                </span>
                <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isFilterTrainerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterTrainerDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsFilterTrainerDropdownOpen(false)} 
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-full sm:w-60 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-40 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Select Instructor</span>
                        <span className="text-indigo-600 font-bold">{trainers.length} active</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterTrainer('all');
                            setIsFilterTrainerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                            filterTrainer === 'all'
                              ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                          }`}
                        >
                          <span className="truncate">All Instructors</span>
                          {filterTrainer === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                        </button>

                        {trainers.map(t => {
                          const isActive = t.id === filterTrainer;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setFilterTrainer(t.id);
                                setIsFilterTrainerDropdownOpen(false);
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
        )}

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-center overflow-x-auto">
          {(['Daily', 'Trainer-wise', 'Calendar'] as const)
            .filter(mode => !isSingleInstructor || mode !== 'Trainer-wise')
            .map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`text-[11px] font-bold px-3 sm:px-3.5 py-1.5 sm:py-1 rounded-lg transition cursor-pointer active:scale-95 whitespace-nowrap flex-1 sm:flex-none text-center ${viewMode === mode ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              {mode === 'Trainer-wise' ? 'By Instructor' : mode === 'Daily' ? 'By Date' : 'Interactive Calendar'}
            </button>
          ))}
        </div>

      </div>

      {/* Slots Display Grid depending on View Mode */}
      <div className="space-y-4">
        {viewMode === 'Calendar' ? (
          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 sm:space-y-6">
            
            {/* Calendar controller */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl sm:bg-transparent sm:p-0 sm:text-[#111827]">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#111827] leading-tight">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold sm:hidden mt-0.5">
                    Tap any date below to inspect & manage
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                    setCurrentDate(prev);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-[#111827] px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 border border-gray-200/60 shadow-2xs"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                    setCurrentDate(next);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-[#111827] px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 border border-gray-200/60 shadow-2xs"
                  aria-label="Next Month"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="w-full">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 border-b border-gray-100 pb-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center text-[10px] font-black text-gray-500 uppercase py-1 bg-gray-50/80 rounded-lg sm:hidden">
                    {day}
                  </div>
                ))}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-extrabold text-[#6B7280] uppercase py-1 bg-gray-50 rounded-sm hidden sm:block">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {(() => {
                  const year = currentDate.getFullYear();
                  const monthIndex = currentDate.getMonth(); // 0-indexed

                  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sun

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
                    const daySlots = sortedSlots.filter(s => s.date === cell.dateString);
                    const isSelected = selectedCalendarDate === cell.dateString;
                    const hasSlots = daySlots.length > 0;

                    const openCount = daySlots.filter(s => s.status === 'Open').length;
                    const bookedCount = daySlots.filter(s => s.status === 'Booked').length;

                    // Group slots by instructor to show initials
                    const trainerStats: Record<string, { initials: string, open: number, booked: number }> = {};
                    daySlots.forEach(s => {
                      if (!trainerStats[s.trainerId]) {
                        const trainer = trainers.find(t => t.id === s.trainerId);
                        const initials = trainer?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                        trainerStats[s.trainerId] = { initials, open: 0, booked: 0 };
                      }
                      if (s.status === 'Open') trainerStats[s.trainerId].open++;
                      if (s.status === 'Booked') trainerStats[s.trainerId].booked++;
                    });
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCalendarDate(cell.dateString)}
                        className={`p-1 sm:p-2 border rounded-xl sm:rounded-lg flex flex-col justify-between items-center sm:items-stretch text-center sm:text-left transition relative cursor-pointer active:scale-95 min-h-[50px] sm:min-h-[85px] ${
                          !cell.isCurrentMonth ? 'text-gray-300 border-gray-100 bg-gray-50/20' : 'text-gray-800 border-gray-155 bg-white'
                        } ${isSelected ? 'ring-2 ring-indigo-600 border-transparent bg-indigo-50/70 sm:bg-white sm:ring-[#111827]' : 'hover:bg-gray-50'}`}
                      >
                        {/* Mobile Layout (< sm) */}
                        <div className="flex flex-col items-center justify-between w-full h-full py-0.5 sm:hidden min-h-[58px]">
                          <span className={`text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-2xs scale-105' 
                              : cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                          }`}>
                            {cell.dayNum}
                          </span>

                          {hasSlots && (
                            <div className="flex flex-col items-center gap-0.5 w-full mt-0.5 overflow-hidden">
                              {Object.values(trainerStats).slice(0, 2).map((stat, sidx) => (
                                <div key={sidx} className="text-[7.5px] font-extrabold flex items-center justify-center gap-0.5 w-full truncate leading-none">
                                  <span className="text-slate-600 font-bold">{stat.initials}</span>
                                  {stat.open > 0 && (
                                    <span className="text-emerald-700 bg-emerald-100/90 px-0.5 rounded-[3px] font-black">{stat.open}O</span>
                                  )}
                                  {stat.booked > 0 && (
                                    <span className="text-blue-700 bg-blue-100/90 px-0.5 rounded-[3px] font-black">{stat.booked}B</span>
                                  )}
                                </div>
                              ))}
                              {Object.values(trainerStats).length > 2 && (
                                <span className="text-[7px] font-extrabold text-slate-400">+{Object.values(trainerStats).length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout (>= sm) */}
                        <div className="hidden sm:flex flex-col justify-between h-full min-h-[75px] w-full">
                          <span className={`text-[11px] font-bold ${cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                            {cell.dayNum}
                          </span>

                          {hasSlots && (
                            <div className="space-y-0.5 mt-1 overflow-hidden">
                              {Object.values(trainerStats).map((stat, sidx) => (
                                <div key={sidx} className="text-[8px] font-extrabold flex items-center justify-between gap-1">
                                  <span className="text-slate-500">{stat.initials}</span>
                                  <div className="flex gap-0.5">
                                    {stat.booked > 0 && (
                                      <span className="text-blue-600 bg-blue-50 px-0.5 rounded-sm">{stat.booked}B</span>
                                    )}
                                    {stat.open > 0 && (
                                      <span className="text-emerald-600 bg-emerald-50 px-0.5 rounded-sm">{stat.open}O</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Selected Date slots listing */}
            <div className="p-3.5 sm:p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
                <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock size={14} className="text-indigo-600 shrink-0" />
                  <span>Slots Schedule on <span className="text-indigo-600 font-black">{selectedCalendarDate || 'Select Date'}</span></span>
                </h4>
                {selectedCalendarDate && (
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 w-fit">
                    {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>

              {(() => {
                const dateSlotsList = slots.filter(s => s.date === selectedCalendarDate);
                if (dateSlotsList.length === 0) {
                  return (
                    <p className="text-xs text-[#6B7280] italic py-4 text-center">
                      No availability slots created for {selectedCalendarDate || 'this date'}. Tap "Add Custom Slot" or "Bulk Create slots" to add.
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {dateSlotsList.map((slot) => {
                      const trName = trainers.find(t => t.id === slot.trainerId)?.name || 'Instructor';
                      const bookedClass = classes.find(c => 
                        c.trainerId === slot.trainerId && 
                        c.date === slot.date && 
                        c.startTime === slot.startTime &&
                        c.status !== 'Cancelled'
                      );
                      
                      return (
                        <div key={slot.id} className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-2 shadow-xs animate-fade-in ${bookedClass ? `${getDriveColorClass(bookedClass.classNumber, bookedClass.isSpecialDrive)} border-opacity-50` : 'border-gray-250'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#111827] truncate">{trName}</p>
                            <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">
                              {slot.startTime} - {slot.endTime} (2 hrs)
                            </p>
                            {bookedClass && (
                              <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 border border-current border-opacity-20`}>
                                  {bookedClass.isSpecialDrive ? 'Special' : `Sess #${bookedClass.classNumber}`}
                                </span>
                                <span className="text-[9px] font-black truncate">
                                  {bookedClass.studentNames}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <select
                              value={slot.status}
                              onChange={(e) => onUpdateSlotStatus(slot.id, e.target.value as any)}
                              className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border border-transparent cursor-pointer active:scale-95 transition ${
                                slot.status === 'Open' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : slot.status === 'Booked' 
                                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}
                            >
                              <option value="Open">Open</option>
                              <option value="Booked">Booked</option>
                              <option value="Unavailable">Unavailable</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => onDeleteSlot(slot.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 active:scale-95 transition cursor-pointer rounded-lg hover:bg-red-50"
                              title="Delete Slot"
                              aria-label="Delete Slot"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide mt-5 border-t border-gray-200/80 pt-3.5">
                <CalendarIcon size={14} className="text-indigo-500 shrink-0" />
                Scheduled Drives on <span className="text-indigo-900 font-extrabold">{selectedCalendarDate}</span>
              </h4>

              {(() => {
                const dateClasses = classes.filter(c => c.date === selectedCalendarDate);
                if (dateClasses.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-3 text-center">
                      No scheduled drives on this date.
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dateClasses.map((cls) => (
                      <div key={cls.id} className="p-3.5 bg-white rounded-2xl border border-indigo-100 shadow-2xs flex flex-col gap-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)} border border-current border-opacity-20`}>
                                {cls.isSpecialDrive ? 'Special Drive' : `Session ${cls.classNumber}`}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cls.startTime} - {cls.endTime}</span>
                            </div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900 truncate">{cls.studentNames}</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{cohorts.find(c => c.id === cls.cohortId)?.name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 ${
                            cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {cls.status}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleClass(cls);
                              setRescheduleReason('');
                              setRescheduleSlots([{ date: cls.date, startTime: cls.startTime, endTime: cls.endTime }]);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 active:scale-95 transition cursor-pointer"
                          >
                            <RefreshCw size={13} /> Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteClass(cls.id);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                          >
                            <Trash size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        ) : viewMode === 'Trainer-wise' ? (
          /* View Mode: Grouped by Trainer */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {trainers.filter(t => filterTrainer === 'all' || t.id === filterTrainer).map(tr => {
              const trainerSlotsList = trainerGroups[tr.id] || [];
              const initials = tr.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={tr.id} className="bg-white p-4 rounded-2xl border border-slate-200 sm:border-[#E5E7EB] space-y-3.5 shadow-xs">
                  {/* Desktop Header */}
                  <div className="hidden sm:flex items-center justify-between border-b pb-2.5 border-gray-100">
                    <div>
                      <h4 className="text-base font-bold text-[#111827]">{tr.name}</h4>
                      <span className="text-xs text-[#6B7280]">Total generated hours: {trainerSlotsList.length * 2} hrs</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${tr.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>

                  {/* Mobile Header */}
                  <div className="flex sm:hidden bg-gradient-to-r from-indigo-50/90 via-slate-50 to-purple-50/60 p-3 rounded-xl border border-indigo-100/90 items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{tr.name}</h4>
                        <span className="text-[10px] text-slate-500 font-bold">Total hours: {trainerSlotsList.length * 2} hrs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black bg-indigo-100/80 text-indigo-800 border border-indigo-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {trainerSlotsList.length} slots
                      </span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${tr.active ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'}`} />
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {trainerSlotsList.map((slot) => (
                      <div key={slot.id} className="p-2.5 sm:p-3.5 bg-gray-50 sm:bg-[#F9FAFB] hover:bg-slate-100/80 transition rounded-xl sm:rounded-2xl border border-[#E5E7EB] flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#111827]">
                            <CalendarIcon size={14} className="text-[#111827] shrink-0" />
                            <span className="truncate">{slot.date}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-[#6B7280] font-semibold flex items-center gap-1.5 mt-0.5">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                          {/* Mobile Status Select */}
                          <select
                            value={slot.status}
                            onChange={(e) => onUpdateSlotStatus(slot.id, e.target.value as any)}
                            className={`sm:hidden text-[9px] font-bold px-1.5 py-0.5 rounded-md border-0 cursor-pointer focus:outline-hidden transition shadow-2xs ${
                              slot.status === 'Open' 
                                ? 'bg-emerald-50 text-emerald-800' 
                                : slot.status === 'Booked' 
                                ? 'bg-blue-50 text-blue-800' 
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="Booked">Booked</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>

                          {/* Desktop Status Select */}
                          <div className="hidden sm:relative sm:inline-flex items-center">
                            <select
                              value={slot.status}
                              onChange={(e) => onUpdateSlotStatus(slot.id, e.target.value as any)}
                              className={`appearance-none bg-transparent pr-5 py-1 text-xs font-bold cursor-pointer focus:outline-hidden ${
                                slot.status === 'Open' ? 'text-emerald-700' : slot.status === 'Booked' ? 'text-blue-700' : 'text-red-700'
                              }`}
                            >
                              <option value="Open">Open</option>
                              <option value="Booked">Booked</option>
                              <option value="Unavailable">Unavailable</option>
                            </select>
                            <ChevronDown size={14} className={`absolute right-0 pointer-events-none ${
                              slot.status === 'Open' ? 'text-emerald-700' : slot.status === 'Booked' ? 'text-blue-700' : 'text-red-700'
                            }`} />
                          </div>

                          {/* Delete Slot Action */}
                          <button
                            onClick={() => onDeleteSlot(slot.id)}
                            className="p-1 sm:p-1.5 text-gray-400 sm:text-[#111827] hover:text-red-600 rounded-md sm:rounded-lg transition cursor-pointer active:scale-95"
                            title="Remove Slot Time"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {trainerSlotsList.length === 0 && (
                      <p className="text-xs text-[#6B7280] italic text-center py-6">No slots created for {tr.name}.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode: Grouped by Date (Daily Chronological) */
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4 sm:space-y-5 shadow-xs">
            {Object.keys(dateGroups).sort().map(dateString => {
              const dateSlots = dateGroups[dateString] || [];
              return (
                <div key={dateString} className="border-b last:border-b-0 pb-4 sm:pb-5 last:pb-0 border-gray-100 space-y-2.5">
                  {/* Desktop Date Header */}
                  <div className="hidden sm:block">
                    <h4 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider bg-gray-100 p-2 rounded-lg inline-block">{dateString}</h4>
                  </div>

                  {/* Mobile Date Header */}
                  <div className="flex sm:hidden items-center gap-2">
                    <span className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 border border-slate-800 shadow-2xs">
                      <CalendarIcon size={13} className="text-indigo-400 shrink-0" />
                      <span>{dateString}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      ({dateSlots.length} {dateSlots.length === 1 ? 'Slot' : 'Slots'})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {dateSlots.map(slot => {
                      const trainerName = trainers.find(t => t.id === slot.trainerId)?.name || 'Trainer';
                      const initials = trainerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                      return (
                        <div key={slot.id} className="p-3 bg-[#F9FAFB] sm:bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col justify-between gap-2.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 sm:hidden rounded-md bg-indigo-100 text-indigo-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <span className="text-xs font-bold text-[#111827] truncate">{trainerName}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                slot.status === 'Open' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                  : slot.status === 'Booked' 
                                  ? 'bg-blue-50 text-blue-800 border border-blue-100' 
                                  : 'bg-red-50 text-red-800 border border-red-100'
                              }`}>
                                {slot.status}
                              </span>

                              <button
                                onClick={() => onDeleteSlot(slot.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md transition cursor-pointer active:scale-95"
                                title="Delete Slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] text-[#6B7280] font-semibold flex items-center gap-1 border-t border-gray-200 pt-2">
                            <Clock size={12} className="text-gray-400 shrink-0" />
                            <span>{slot.startTime} - {slot.endTime} (2 hrs)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {sortedSlots.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-8">No trainer availability slots created for this cohort yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRescheduleClass(null)} />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black mb-1">Request Reschedule</h3>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Propose up to 3 alternative dates for session {rescheduleClass.classNumber}</p>
              </div>
              <button onClick={() => setRescheduleClass(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposed Options</h4>
                  {rescheduleSlots.length < 3 && (
                    <button 
                      onClick={() => setRescheduleSlots([...rescheduleSlots, { date: '', startTime: '09:00', endTime: '11:00' }])}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition cursor-pointer"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  )}
                </div>
                
                {rescheduleSlots.map((slot, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    {rescheduleSlots.length > 1 && (
                      <button 
                        onClick={() => setRescheduleSlots(rescheduleSlots.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</span>
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Option {index + 1}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date</label>
                        <input 
                          type="date" 
                          value={slot.date}
                          onChange={(e) => {
                            const newSlots = [...rescheduleSlots];
                            newSlots[index].date = e.target.value;
                            setRescheduleSlots(newSlots);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Start</label>
                        <input 
                          type="time" 
                          value={slot.startTime}
                          onChange={(e) => {
                            const newSlots = [...rescheduleSlots];
                            newSlots[index].startTime = e.target.value;
                            setRescheduleSlots(newSlots);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">End</label>
                        <input 
                          type="time" 
                          value={slot.endTime}
                          onChange={(e) => {
                            const newSlots = [...rescheduleSlots];
                            newSlots[index].endTime = e.target.value;
                            setRescheduleSlots(newSlots);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason for Rescheduling (Optional)</label>
                <textarea 
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Explain why you need to move this drive..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRescheduleClass(null)}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (rescheduleClass) {
                      const validSlots = rescheduleSlots.filter(s => s.date && s.startTime && s.endTime);
                      if (validSlots.length === 0) {
                        return;
                      }

                      onRequestReschedule({
                        classId: rescheduleClass.id,
                        requesterId: userProfile.associatedId || userProfile.uid,
                        requesterName: userProfile.displayName,
                        requesterRole: userProfile.role as any,
                        message: rescheduleReason,
                        suggestedSlots: validSlots
                      });
                      setRescheduleClass(null);
                    }
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
