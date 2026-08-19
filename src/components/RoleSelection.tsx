import React, { useState } from 'react';
import { UserRole, Student, Trainer } from '../types';
import { Users, GraduationCap, Shield, Heart, ArrowRight, Check, Car } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: UserRole, associatedId?: string) => void;
  students: Student[];
  trainers: Trainer[];
}

export default function RoleSelection({ onSelect, students, trainers }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [associatedId, setAssociatedId] = useState<string>('');

  const roles = [
    { 
      id: 'Admin' as UserRole, 
      label: 'Administrator', 
      icon: Shield, 
      desc: 'Manage school, cohorts & system.',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    },
    { 
      id: 'Instructor' as UserRole, 
      label: 'Instructor', 
      icon: GraduationCap, 
      desc: 'Manage drives & availability.',
      color: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    { 
      id: 'Student' as UserRole, 
      label: 'Student', 
      icon: Users, 
      desc: 'View drives & partner details.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    { 
      id: 'Parent' as UserRole, 
      label: 'Parent', 
      icon: Heart, 
      desc: 'Monitor student progress.',
      color: 'bg-rose-50 text-rose-600 border-rose-100'
    },
  ];

  const handleConfirm = () => {
    if (selectedRole) {
      onSelect(selectedRole, associatedId);
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-50 flex flex-col justify-center items-center p-3 sm:p-6 overflow-hidden relative">
      <div className="max-w-sm sm:max-w-md w-full my-auto flex flex-col gap-2.5 sm:gap-3.5">
        {/* Header */}
        <div className="text-center flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-brand rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center shrink-0">
            <Car className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display leading-none">Select Your Role</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">Choose your workspace experience</p>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  setAssociatedId('');
                }}
                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border flex flex-col text-left transition-all cursor-pointer relative touch-press ${
                  isSelected 
                    ? 'border-indigo-600 bg-white shadow-md shadow-indigo-100 ring-2 ring-indigo-600 text-slate-900' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${r.color}`}>
                    <Icon size={14} className="sm:w-4 sm:h-4" />
                  </div>
                  {isSelected && (
                    <div className="bg-indigo-600 text-white p-0.5 rounded-full">
                      <Check size={9} strokeWidth={4} />
                    </div>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-black mb-0.5">{r.label}</h3>
                <p className="text-[10px] sm:text-[11px] leading-tight font-medium text-slate-500">
                  {r.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Profile Associate Picker */}
        {selectedRole && selectedRole !== 'Admin' && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              {selectedRole === 'Instructor' ? 'Select Instructor Profile' : 'Select Student Profile'}
            </label>
            <select
              value={associatedId}
              onChange={(e) => setAssociatedId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 min-h-[40px]"
            >
              <option value="">-- Select Profile --</option>
              {selectedRole === 'Instructor' ? (
                trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
              ) : (
                students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              )}
            </select>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedRole || (selectedRole !== 'Admin' && !associatedId)}
          className={`w-full min-h-[42px] sm:min-h-[46px] flex items-center justify-center gap-2 font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all cursor-pointer touch-press ${
            selectedRole && (selectedRole === 'Admin' || associatedId)
              ? 'gradient-brand text-white shadow-md shadow-indigo-200 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to Dashboard</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

