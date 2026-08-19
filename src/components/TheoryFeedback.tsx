import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Cohort, ClassroomSessionStatus } from '../types';

interface TheoryFeedbackProps {
  students: Student[];
  cohorts: Cohort[];
  activeCohortId: string;
  setActiveCohortId: (id: string) => void;
  onUpdateClassroomSession: (studentId: string, sessionNumber: number, status: ClassroomSessionStatus) => void;
}

export default function TheoryFeedback({
  students,
  cohorts,
  activeCohortId,
  setActiveCohortId,
  onUpdateClassroomSession
}: TheoryFeedbackProps) {
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

  const cohortStudents = students.filter(s => s.cohortId === activeCohortId);
  const currentCohort = cohorts.find(c => c.id === activeCohortId);

  const sessions = Array.from({ length: 12 }, (_, i) => i + 1);

  const toggleStatus = (studentId: string, sessionNumber: number, currentStatus?: ClassroomSessionStatus) => {
    const nextStatus: ClassroomSessionStatus = currentStatus === 'Complete' ? 'Needs to Complete' : 'Complete';
    onUpdateClassroomSession(studentId, sessionNumber, nextStatus);
  };

  const selectAllForSession = (sessionNumber: number) => {
    cohortStudents.forEach(student => {
      onUpdateClassroomSession(student.id, sessionNumber, 'Complete');
    });
  };

  const toggleExpandStudent = (id: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? true : !prev[id]
    }));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={20} />
            Classroom Theory Feedback
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage attendance and completion for the 12 theoretical classroom modules.</p>
        </div>

        {/* Custom Cohort Dropdown (matching Overview style) */}
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all duration-150 px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-pointer shadow-2xs text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Cohort:</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{currentCohort?.name || 'Select Cohort'}</span>
            </div>
            <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
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
                  className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
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

      {/* Mobile Card View (< sm) matching user screenshot */}
      <div className="sm:hidden space-y-3">
        {cohortStudents.map(student => {
          const completedCount = sessions.filter(num => student.classroomSessions?.[num] === 'Complete').length;
          const isExpanded = expandedStudentIds[student.id] ?? false;
          const initials = getInitials(student.name);
          const progressPercent = Math.round((completedCount / sessions.length) * 100);

          return (
            <div 
              key={student.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden border-l-4 border-l-indigo-600"
            >
              {/* Header */}
              <div 
                onClick={() => toggleExpandStudent(student.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/50 transition active:bg-slate-100/50"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100/80 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 h-1.5 bg-slate-200/80 rounded-full overflow-hidden shrink-0">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {completedCount}/{sessions.length} Mods
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-1 text-slate-400 hover:text-slate-600 transition shrink-0 ml-2">
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                </div>
              </div>

              {/* Modules Grid */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4"
                  >
                    <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
                      {sessions.map(num => {
                        const status = student.classroomSessions?.[num] || 'Needs to Complete';
                        const isComplete = status === 'Complete';

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(student.id, num, status);
                            }}
                            className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-100/80 active:scale-95 transition cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                              isComplete 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-white border-2 border-slate-300/90'
                            }`}>
                              {isComplete && <Check size={13} className="stroke-[3]" />}
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase tracking-tight mt-1.5 ${
                              isComplete ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              MOD {num}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {cohortStudents.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400">No students enrolled in this cohort.</p>
          </div>
        )}
      </div>

      {/* Desktop / Tablet Table View (sm:block) */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                <th className="p-4 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Student Name</th>
                {sessions.map(num => (
                  <th key={num} className="p-4 text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-2">
                      <span>Module {num}</span>
                      <button 
                        onClick={() => selectAllForSession(num)}
                        className="text-[9px] px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Select All
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohortStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{student.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{student.email}</p>
                  </td>
                  {sessions.map(num => {
                    const status = student.classroomSessions?.[num] || 'Needs to Complete';
                    const isComplete = status === 'Complete';
                    
                    return (
                      <td key={num} className="p-2 text-center">
                        <button
                          onClick={() => toggleStatus(student.id, num, status)}
                          className={`w-full py-2 px-1 rounded-xl transition-all duration-200 group flex flex-col items-center gap-1 border cursor-pointer ${
                            isComplete 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <Circle size={16} className="text-slate-300 group-hover:text-slate-400" />
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${isComplete ? 'text-emerald-700' : 'text-slate-50'}`}>
                            {isComplete ? 'Complete' : 'Pending'}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {cohortStudents.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                        <BookOpen size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No students enrolled in this cohort.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">Admin Instruction</h4>
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            Click on a module cell to toggle between <strong>Complete</strong> and <strong>Needs to Complete</strong>. 
            Students and parents will see these updates in their respective dashboards under the theory section.
          </p>
        </div>
      </div>
    </div>
  );
}
