import React, { useState } from 'react';
import { Plus, Check, Trash2, Calendar, ClipboardList, X } from 'lucide-react';
import { Cohort, Trainer, Student, CohortStatus } from '../types';

interface CohortManagementProps {
  cohorts: Cohort[];
  trainers: Trainer[];
  students: Student[];
  onAddCohort: (cohort: Omit<Cohort, 'id'>) => void;
  onEditCohortStatus: (id: string, status: CohortStatus) => void;
  onDeleteCohort: (id: string) => void;
}

export default function CohortManagement({
  cohorts,
  trainers,
  students,
  onAddCohort,
  onEditCohortStatus,
  onDeleteCohort
}: CohortManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Saturday']);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTrainer = (tId: string) => {
    if (selectedTrainers.includes(tId)) {
      setSelectedTrainers(selectedTrainers.filter(id => id !== tId));
    } else {
      setSelectedTrainers([...selectedTrainers, tId]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Cohort name is required.');
      return;
    }
    if (selectedDays.length === 0) {
      setFormError('Please select at least one training weekday.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start Date cannot be after End Date.');
      return;
    }

    onAddCohort({
      name,
      startDate,
      endDate,
      selectedDays,
      assignedTrainers: selectedTrainers,
      status: 'Draft',
      notes
    });

    setIsAdding(false);
    setName('');
    setSelectedDays(['Monday', 'Wednesday', 'Saturday']);
    setSelectedTrainers([]);
    setNotes('');
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Cohort Management</h2>
          <p className="text-xs text-[#6B7280]">Group program cohorts, start & end dates, training weekdays, and assigned instructors.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#111827] hover:bg-gray-800 text-white p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95 min-w-[38px] sm:min-w-0"
          title={isAdding ? 'Close Panel' : 'New Cohort'}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{isAdding ? 'Close Panel' : 'New Cohort'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create Cohort Block */}
        {isAdding && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <ClipboardList className="text-[#111827]" size={16} />
                Compile New Cohort
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="bg-slate-100 text-slate-700 border border-slate-200/80 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer active:scale-95 block sm:hidden"
                aria-label="Close form"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">COHORT NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. October 2026 Batch"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">START DATE</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] cursor-pointer focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">END DATE</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] cursor-pointer focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Day Selector checkboxes */}
              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">ALLOWED TRAINING DAYS</label>
                <div className="flex flex-wrap gap-1.5">
                  {weekdays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer ${selectedDays.includes(day) ? 'bg-[#111827] text-white' : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'}`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trainer Assignment Checkboxes */}
              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">ASSIGN CERTIFIED INSTRUCTORS</label>
                <div className="space-y-1 bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB] max-h-36 overflow-y-auto">
                   {trainers.filter(tr => tr.active).map(tr => (
                    <label key={tr.id} className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] cursor-pointer p-1 rounded-md hover:bg-gray-100 transition">
                      <input
                        type="checkbox"
                        checked={selectedTrainers.includes(tr.id)}
                        onChange={() => toggleTrainer(tr.id)}
                        className="rounded border-[#E5E7EB] text-[#111827] focus:ring-[#111827]"
                      />
                      <span>{tr.name}</span>
                    </label>
                  ))}
                  {trainers.filter(tr => tr.active).length === 0 && (
                    <span className="text-[10px] text-[#6B7280]">No active instructors registered.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">PROGRAM REMARKS / NOTES</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Accelerated weekend emphasis"
                  rows={2}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#111827]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
              >
                Compile Cohort Program
              </button>
            </form>
          </div>
        )}

        {/* Existing Cohort List */}
        <div className={`${isAdding ? 'lg:col-span-2' : 'col-span-full'} space-y-4`}>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Configured Driving Cohorts ({cohorts.length})</h3>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {cohorts.map(coh => {
                const enrolledCount = students.filter(s => s.cohortId === coh.id).length;
                const instructorNames = coh.assignedTrainers.map(tId => trainers.find(t => t.id === tId)?.name).filter(Boolean).join(', ');

                return (
                  <div key={coh.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#F9FAFB]/30 transition">
                    <div className="space-y-1 w-full sm:w-auto">
                      <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#111827]">{coh.name}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={coh.status}
                            onChange={(e) => onEditCohortStatus(coh.id, e.target.value as CohortStatus)}
                            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 focus:ring-1 focus:ring-[#111827] cursor-pointer ${
                              coh.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-800' 
                                : coh.status === 'Completed' 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-amber-50 text-amber-850'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                          </select>

                          {/* Delete Icon right next to active dropdown on mobile screens */}
                          <button
                            type="button"
                            onClick={() => onDeleteCohort(coh.id)}
                            className="sm:hidden p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200/80 transition cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Delete Cohort"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar size={11} className="text-gray-400" />
                          {coh.startDate} to {coh.endDate}
                        </span>
                        <span className="font-bold text-[#111827]">
                          {enrolledCount} Enrolled
                        </span>
                      </div>

                      <div className="text-[10px] sm:text-[11px] text-[#6B7280] mt-1">
                        <span className="font-semibold text-gray-500">Days: </span>
                        {coh.selectedDays.join(', ')}
                      </div>

                      <div className="text-[10px] sm:text-[11px] text-[#6B7280]">
                        <span className="font-semibold text-gray-500">Instructors: </span>
                        {instructorNames || 'No instructors assigned'}
                      </div>
                      
                      {coh.notes && (
                        <p className="text-[10px] sm:text-[11px] text-[#6B7280] italic">"{coh.notes}"</p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 self-center shrink-0">
                      <button
                        onClick={() => onDeleteCohort(coh.id)}
                        className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition cursor-pointer touch-press min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200"
                        title="Delete Cohort"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {cohorts.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No driving student cohorts created yet. Tap "New Cohort" to build one!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
