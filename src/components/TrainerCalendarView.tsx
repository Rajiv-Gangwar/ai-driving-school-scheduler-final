import React, { useState } from 'react';
import { Mail, Phone, Calendar as CalendarIcon, Clock, Users, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Trainer, ClassScheduled, Student, Location, School, Cohort } from '../types';
import { getDriveColorClass } from '../utils/driveStyles';

interface TrainerCalendarViewProps {
  trainers: Trainer[];
  classes: ClassScheduled[];
  students: Student[];
  locations: Location[];
  schools: School[];
  activeCohortId: string;
  setActiveCohortId?: (id: string) => void;
  cohorts?: Cohort[];
}

export default function TrainerCalendarView({
  trainers,
  classes,
  students,
  locations,
  schools,
  activeCohortId,
  setActiveCohortId,
  cohorts = []
}: TrainerCalendarViewProps) {
  const activeTrainers = trainers.filter(t => t.active);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(activeTrainers[0]?.id || '');

  // Calendar States
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('List');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-01'));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-06-15');

  const trainer = trainers.find(t => t.id === selectedTrainerId);

  // Filter assigned confirmed or proposed classes for this specific trainer in this active cohort
  const assignedClasses = classes.filter(
    cls => cls.cohortId === activeCohortId && cls.trainerId === selectedTrainerId
  );

  // Sort chronological
  const sortedClasses = [...assignedClasses].sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return a.startTime.localeCompare(b.startTime);
  });

  // Sync selectedCalendarDate and currentDate
  React.useEffect(() => {
    if (assignedClasses.length > 0) {
      setSelectedCalendarDate(assignedClasses[0].date);
      const d = new Date(assignedClasses[0].date);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    } else {
      setSelectedCalendarDate('2026-06-15');
      setCurrentDate(new Date('2026-06-01'));
    }
  }, [selectedTrainerId, activeCohortId]);

  return (
    <div className="space-y-6">
      {/* Selector banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Instructor Driving Schedule Portal</h2>
          <p className="text-xs text-[#6B7280]">Simple, focused schedule view for driving instructors.</p>
          {setActiveCohortId && cohorts.length > 0 && (
            <div className="flex items-center gap-2 mt-2 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-150 w-fit">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF]">Cohort:</span>
              <select
                value={activeCohortId}
                onChange={(e) => setActiveCohortId(e.target.value)}
                className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs font-bold text-[#111827] focus:outline-hidden"
              >
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['List', 'Calendar'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${viewMode === mode ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'}`}
              >
                {mode === 'List' ? 'List View' : 'Calendar View'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Instructor:</span>
            <select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-bold text-[#111827] focus:outline-hidden"
            >
              {activeTrainers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {trainer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trainer Brief Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs h-fit space-y-4">
            <div className="border-b pb-3 border-gray-150 space-y-1">
              <span className="bg-[#F9FAFB] text-[#111827] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#E5E7EB]">Certified Driving Instructor</span>
              <h3 className="text-base font-bold text-[#111827] pt-1">{trainer.name}</h3>
              <p className="text-xs text-[#6B7280]">Batch Cohort Instructor Assignment</p>
            </div>

            <div className="space-y-2 text-xs text-[#111827]">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#6B7280] shrink-0" />
                <span>{trainer.phone || 'No Phone provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#6B7280] shrink-0" />
                <span>{trainer.email || 'No email registered'}</span>
              </div>
            </div>

            {trainer.notes && (
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Administrative Notes</span>
                <p className="text-[11px] text-[#6B7280] italic">"{trainer.notes}"</p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-[#6B7280]">Active Schedule Classes:</span>
              <span className="font-extrabold text-[#111827] bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-0.5 rounded-full">{assignedClasses.length} Booked</span>
            </div>
          </div>

          {/* Calendar or Chronological assigned list */}
          {viewMode === 'Calendar' ? (
            <div className="lg:col-span-2 bg-white p-3 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 sm:space-y-6">
              
              {/* Calendar controller */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl sm:bg-transparent sm:p-0 sm:text-[#111827]">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                      {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold sm:hidden mt-0.5">
                      Tap any date below to view driving sessions
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

                            {hasClasses && (
                              <div className="flex flex-col items-center gap-0.5 w-full mt-0.5 overflow-hidden">
                                {dayClasses.slice(0, 2).map((cl, cidx) => (
                                  <div 
                                    key={cl.id || cidx} 
                                    className={`text-[7.5px] font-black px-1 rounded-[3px] py-0.2 text-center w-full truncate border leading-none ${getDriveColorClass(cl.classNumber, cl.isSpecialDrive)}`}
                                  >
                                    {cl.isSpecialDrive ? 'Special' : `#${cl.classNumber}`}
                                  </div>
                                ))}
                                {dayClasses.length > 2 && (
                                  <span className="text-[7px] font-extrabold text-slate-400">+{dayClasses.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Desktop Layout (>= sm) */}
                          <div className="hidden sm:flex flex-col justify-between h-full min-h-[75px] w-full">
                            <span className={`text-[11px] font-bold ${cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {cell.dayNum}
                            </span>

                            {hasClasses && (
                              <div className="space-y-0.5 mt-1">
                                {dayClasses.map((cl, cidx) => (
                                  <div 
                                    key={cl.id || cidx} 
                                    className={`text-[8px] font-extrabold px-1 rounded-sm py-0.5 truncate border ${getDriveColorClass(cl.classNumber, cl.isSpecialDrive)}`}
                                    title={`${cl.studentNames} (Class #${cl.classNumber}${cl.isSpecialDrive ? ' - Special' : ''})`}
                                  >
                                    {cl.isSpecialDrive ? 'S' : `#${cl.classNumber}`} {cl.studentNames.split('&')[0]}
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

              {/* Selected Day Classes Detail */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock size={14} className="text-gray-500" />
                  Scheduled Session on <span className="text-[#111827] font-extrabold">{selectedCalendarDate || 'Please click a calendar day cell'}</span>
                </h4>

                {(() => {
                  const dateClassesList = sortedClasses.filter(c => c.date === selectedCalendarDate);
                  if (dateClassesList.length === 0) {
                    return (
                      <p className="text-xs text-[#6B7280] italic py-4 text-center">
                        No driving classes assigned to instructor on {selectedCalendarDate || 'this date'}.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {dateClassesList.map((cls) => (
                        <div key={cls.id} className="p-4 bg-white rounded-xl border border-gray-250 flex flex-col gap-3 shadow-xs animate-fade-in text-xs animate-fade-in">
                          <div className="flex justify-between items-center font-bold">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-[#111827] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Class #{cls.classNumber}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                cls.status === 'Confirmed' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : cls.status === 'Needs Review' 
                                  ? 'bg-red-50 text-red-800' 
                                  : 'bg-amber-50 text-amber-850'
                              }`}>
                                {cls.status}
                              </span>
                            </div>
                            <span className="text-[11px] font-extrabold text-[#111827] flex items-center gap-1 bg-[#F9FAFB] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                              <Clock size={11} className="text-gray-400" />
                              {cls.startTime} - {cls.endTime}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide block mb-0.5">Students Assigned</span>
                            <h4 className="text-sm font-bold text-[#111827]">{cls.studentNames}</h4>
                          </div>

                          {/* Client lists with parent contact for teens */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-[11px]">
                            {(() => {
                              const grpClassStudents = students.filter(s => cls.studentNames.includes(s.name));
                              return grpClassStudents.length === 0 ? (
                                <p className="text-gray-400 italic text-[10px]">No contact profiles found</p>
                              ) : grpClassStudents.map(st => (
                                <div key={st.id} className="p-1.5 bg-white rounded-lg border border-[#E5E7EB] space-y-0.5 animate-fade-in">
                                  <p className="font-bold text-[#111827]">{st.name} {st.under18 && '(Teen)'}</p>
                                  <p className="text-[10px] text-[#6B7280]">DOB: {st.dateOfBirth} • Age: {st.age}</p>
                                  {st.locationId && (
                                    <p className="text-[10px] text-[#6B7280] flex items-center gap-0.5">
                                      <MapPin size={10} /> {locations.find(l => l.id === st.locationId)?.name}
                                    </p>
                                  )}
                                  {st.under18 && (
                                    <div className="text-[9px] text-[#111827] font-semibold bg-[#F9FAFB] border border-[#E5E7EB] px-1 rounded-sm mt-0.5 space-y-0.5">
                                      {st.parentName && <p>P1: {st.parentName} ({st.parentPhone})</p>}
                                      {st.parent2Name && <p>P2: {st.parent2Name} ({st.parent2Phone})</p>}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          ) : (
            /* Chronological assigned list */
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Instructor Assigned Classes ({assignedClasses.length})</h3>
                </div>

                <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                  {sortedClasses.map(cls => (
                    <div key={cls.id} className="p-4 space-y-3 hover:bg-gray-50/20 transition">
                      <div className="flex justify-between items-start gap-4">
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-gray-100 text-[#111827] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Class #{cls.classNumber}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              cls.status === 'Confirmed' 
                                ? 'bg-emerald-50 text-emerald-800' 
                                : cls.status === 'Needs Review' 
                                ? 'bg-red-50 text-red-800' 
                                : 'bg-amber-50 text-amber-850'
                            }`}>
                              {cls.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#111827]">{cls.studentNames}</h4>
                        </div>

                      </div>

                      {/* Schedule block */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#6B7280] bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB] pointer-events-none">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={12} className="text-[#111827]" />
                          Date: <strong className="text-[#111827]">{cls.date}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          Time slot: <strong className="text-[#111827]">{cls.startTime} - {cls.endTime} (2 hrs)</strong>
                        </span>
                      </div>

                      {/* Client lists with parent contact for teens */}
                      <div className="space-y-1 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Candidate Contact and Location Briefing</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {(() => {
                             const grpClassStudents = students.filter(s => cls.studentNames.includes(s.name));
                             return grpClassStudents.map(st => (
                              <div key={st.id} className="p-1.5 bg-white rounded-lg border border-[#E5E7EB] space-y-0.5">
                                <p className="font-bold text-[#111827]">{st.name} {st.under18 && '(Teen)'}</p>
                                <p className="text-[10px] text-[#6B7280]">DOB: {st.dateOfBirth} • Age: {st.age}</p>
                                {st.locationId && (
                                  <p className="text-[10px] text-[#6B7280] flex items-center gap-0.5">
                                    <MapPin size={10} /> {locations.find(l => l.id === st.locationId)?.name}
                                  </p>
                                )}
                                {st.under18 && (
                                  <div className="text-[9px] text-[#111827] font-semibold bg-[#F9FAFB] border border-[#E5E7EB] px-1 rounded-sm mt-0.5 space-y-0.5">
                                    {st.parentName && <p>P1: {st.parentName} ({st.parentPhone})</p>}
                                    {st.parent2Name && <p>P2: {st.parent2Name} ({st.parent2Phone})</p>}
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                    </div>
                  ))}

                  {assignedClasses.length === 0 && (
                    <p className="p-8 text-center text-[#6B7280] text-xs italic">No driving sessions scheduled for {trainer.name} in this batch yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <p className="text-center text-[#6B7280] py-10">No active trainers registered to see assigned classes.</p>
      )}

    </div>
  );
}
