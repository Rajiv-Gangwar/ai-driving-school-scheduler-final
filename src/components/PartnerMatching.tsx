import React, { useState } from 'react';
import { Sparkles, Check, X, ShieldAlert, Heart, RefreshCw, Smile, Users, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Location, School, Cohort } from '../types';
import { calculateMatchScore } from '../utils/scheduler';

interface PartnerMatchingProps {
  students: Student[];
  locations: Location[];
  schools: School[];
  activeCohortId: string;
  setActiveCohortId?: (id: string) => void;
  cohorts?: Cohort[];
  onApproveMatch: (studentId: string, partnerId: string) => void;
  onBreakMatch: (studentId: string) => void;
}

export default function PartnerMatching({
  students,
  locations,
  schools,
  activeCohortId,
  setActiveCohortId,
  cohorts = [],
  onApproveMatch,
  onBreakMatch
}: PartnerMatchingProps) {
  // Manual Assignment selection states
  const [manualStudentId, setManualStudentId] = useState<string | null>(null);
  const [manualPartnerId, setManualPartnerId] = useState<string>('');
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);

  const currentCohort = cohorts.find(c => c.id === activeCohortId);

  // Under-18 students in this active cohort
  const cohortStudents = students.filter(s => s.cohortId === activeCohortId && s.under18);
  
  // Split into paired and unpaired teen categories
  const unpairedTeens = cohortStudents.filter(s => !s.existingPartnerId);
  const pairedTeens = cohortStudents.filter(s => s.existingPartnerId);

  // Generate suggested matches dynamically for all unpaired teens
  const getSuggestionsForStudent = (student: Student) => {
    const prospects = unpairedTeens.filter(s => s.id !== student.id);
    const scoredProspects = prospects.map(p => {
      const calculation = calculateMatchScore(student, p, locations, schools);
      return {
        prospect: p,
        score: calculation.score,
        reasons: calculation.reasons
      };
    });

    // Sort by Match Score descending
    return scoredProspects.sort((a, b) => b.score - a.score);
  };

  const handleManualPair = (studentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (manualPartnerId) {
      onApproveMatch(studentId, manualPartnerId);
      setManualStudentId(null);
      setManualPartnerId('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper header */}
      <div className="bg-gradient-to-br from-white via-indigo-50/20 to-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto text-center sm:text-left">
          <h2 className="text-base sm:text-lg font-black text-slate-900 font-display">Teens Partner Matching Hub</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">Under-18 driving students require buddy dual-driving pairs. Suggest, review, or manually couple partners.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {cohorts.length > 0 && setActiveCohortId && (
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
          )}
          <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-extrabold text-indigo-700 w-full sm:w-auto">
            <Smile size={14} className="sm:w-[15px]" />
            <span>{unpairedTeens.length} teens need matches</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unpaired Teens column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-55 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Unpaired Teens</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {unpairedTeens.map(student => {
                const suggestions = getSuggestionsForStudent(student);
                const firstPick = suggestions[0];

                return (
                  <div key={student.id} className="p-5 space-y-4 hover:bg-slate-50/40 transition duration-150">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{student.name}</h4>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1">
                          High School: <span className="font-extrabold text-slate-700">{schools.find(s => s.id === student.schoolId)?.name || 'N/A'}</span> • Region: <span className="font-extrabold text-slate-700">{locations.find(l => l.id === student.locationId)?.name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Manual Assignment toggle */}
                      {manualStudentId === student.id ? (
                        <form onSubmit={(e) => handleManualPair(student.id, e)} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                          <select
                            value={manualPartnerId}
                            onChange={(e) => setManualPartnerId(e.target.value)}
                            className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:ring-0 focus:outline-hidden cursor-pointer"
                            required
                          >
                            <option value="">Pair with...</option>
                            {unpairedTeens.filter(s => s.id !== student.id).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 transition cursor-pointer shadow-xs shadow-indigo-600/10">
                            <Check size={12} />
                          </button>
                          <button type="button" onClick={() => setManualStudentId(null)} className="text-slate-500 hover:text-slate-800 rounded-lg p-2 cursor-pointer">
                            <X size={12} />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setManualStudentId(student.id);
                            setManualPartnerId('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer"
                        >
                          Assign Manually
                        </button>
                      )}
                    </div>

                    {/* Best Suggested Option Card */}
                    {firstPick && firstPick.score > 0 ? (
                      <div className="p-4 bg-gradient-to-br from-indigo-50/30 via-slate-50/50 to-white rounded-xl border border-indigo-100/60 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-0.5 rounded-md font-black">
                              Best Match Suggestion
                            </span>
                            <span className={`text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-md font-black border ${firstPick.score >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                              Score: {firstPick.score}%
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-800 font-extrabold pt-1">
                            Recommended Buddy: <span className="text-indigo-950 font-black">{firstPick.prospect.name}</span>
                          </p>

                          {/* Dynamic detailed breakdowns */}
                          <div className="space-y-1 pl-2 mt-1.5 border-l-2 border-indigo-100">
                            {firstPick.reasons.map((reason, rIdx) => (
                              <div key={rIdx} className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 leading-snug">
                                <Info size={10} className="text-indigo-400 shrink-0" />
                                {reason}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => onApproveMatch(student.id, firstPick.prospect.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 self-end sm:self-center cursor-pointer shadow-xs shadow-indigo-600/10 active:scale-95"
                        >
                          Accept Suggestion
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 font-semibold">
                        No highly compatible match suggestions found in this cohort cohort. Establish manual pairs or expand location profiles.
                      </div>
                    )}
                  </div>
                );
              })}

              {unpairedTeens.length === 0 && (
                <div className="p-12 text-center bg-white rounded-xl">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Heart className="opacity-80" size={20} />
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">All teen candidates successfully paired up!</p>
                  <p className="text-xs mt-1 text-slate-500 font-semibold">Your scheduling groups are structured and primed to schedule.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Existing Paired Teen Buddies list */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <Users className="text-indigo-500" size={17} />
              Confirmed Groups ({pairedTeens.length / 2} pairs)
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {(() => {
                const pairsRendered = new Set<string>();
                return pairedTeens.map(student => {
                  if (pairsRendered.has(student.id)) return null;

                  const partner = students.find(s => s.id === student.existingPartnerId);
                  if (!partner) return null;

                  pairsRendered.add(student.id);
                  pairsRendered.add(partner.id);

                  return (
                    <div key={student.id} className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-indigo-100 transition duration-150">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {student.name} & {partner.name}
                        </p>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          Teen Cohort Driving Group
                        </span>
                      </div>

                      <button
                        onClick={() => onBreakMatch(student.id)}
                        className="text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                        title="Decouple Driving Partners"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                });
              })()}

              {pairedTeens.length === 0 && (
                <p className="text-xs text-slate-400 font-bold text-center py-8 italic bg-slate-50/30 rounded-xl border border-dashed border-slate-200">No driving couples confirmed yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
