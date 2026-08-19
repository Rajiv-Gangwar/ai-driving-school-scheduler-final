import React, { useState } from 'react';
import { Plus, Edit2, ShieldAlert, CheckCircle, Mail, Phone, BookOpen, Trash2, X, UserCheck } from 'lucide-react';
import { Trainer, ClassScheduled } from '../types';

interface TrainerManagementProps {
  trainers: Trainer[];
  classes: ClassScheduled[];
  onAddTrainer: (trainer: Omit<Trainer, 'id'>) => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (id: string) => void;
}

export default function TrainerManagement({
  trainers,
  classes,
  onAddTrainer,
  onEditTrainer,
  onDeleteTrainer
}: TrainerManagementProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');

  const handleOpenNew = () => {
    setIsEditing(true);
    setCurrentId(null);
    setName('');
    setPhone('');
    setEmail('');
    setActive(true);
    setNotes('');
    setFormError('');
  };

  const handleOpenEdit = (tr: Trainer) => {
    setIsEditing(true);
    setCurrentId(tr.id);
    setName(tr.name);
    setPhone(tr.phone);
    setEmail(tr.email);
    setActive(tr.active);
    setNotes(tr.notes);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Trainer Name is required.');
      return;
    }
    
    if (currentId) {
      onEditTrainer({
        id: currentId,
        name,
        phone,
        email,
        active,
        notes
      });
    } else {
      onAddTrainer({
        name,
        phone,
        email,
        active,
        notes
      });
    }
    setIsEditing(false);
  };

  // Calculate booked classes per trainer
  const getBookedCount = (trainerId: string) => {
    return classes.filter(cls => cls.trainerId === trainerId).length;
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Instructor Management</h2>
          <p className="text-xs text-[#6B7280]">Configure driving school certified instructors, details, and active statuses.</p>
        </div>
        <button
          id="btn-add-trainer"
          onClick={handleOpenNew}
          className="bg-[#111827] hover:bg-gray-800 text-white p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95 min-w-[38px] sm:min-w-0"
          title="Add Instructor"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Instructor</span>
        </button>
      </div>

      {/* Main Grid: Left editor (when open), Right listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trainer Form (Modal-like Sidepanel) */}
        {isEditing ? (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <UserCheck className="text-[#111827]" size={16} />
                {currentId ? 'Edit Instructor Details' : 'Register New Instructor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-100 text-slate-700 border border-slate-200/80 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer active:scale-95 block sm:hidden"
                aria-label="Close form"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">INSTRUCTOR NAME *</label>
                <input
                  id="trainer-form-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:ring-1 focus:ring-[#111827] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">PHONE</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 555-0199"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:ring-1 focus:ring-[#111827] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rgreen@driving.com"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:ring-1 focus:ring-[#111827] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">NOTES / BACKGROUND</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specializations (highway, teen-groups, parking, dual-control preference)"
                  rows={3}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:ring-1 focus:ring-[#111827] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-xs font-semibold text-[#6B7280]">Active Status</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#111827]"></div>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                >
                  {currentId ? 'Save Updates' : 'Add Instructor'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-[#4B5563] text-xs font-bold py-2 px-4 rounded-lg transition"
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-[#F9FAFB] p-6 rounded-2xl border border-[#E5E7EB] flex flex-col justify-center items-center text-center h-52">
            <BookOpen className="text-gray-300 mb-2" size={24} />
            <p className="text-xs font-bold text-[#111827]">Select or Create an Instructor</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Click "Add Instructor" or click edit on any existing record to adjust notes, phone, active indicators.</p>
          </div>
        )}

        {/* Trainers List Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">All Driving Instructors ({trainers.length})</h3>
            </div>
            
            <div className="divide-y divide-[#E5E7EB]">
              {trainers.map((tr) => {
                const bookingCount = getBookedCount(tr.id);
                return (
                  <div key={tr.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#F9FAFB]/50 transition">
                    <div className="space-y-1 w-full sm:w-auto">
                      <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#111827]">{tr.name}</span>
                        <div className="flex items-center gap-2">
                          {tr.active ? (
                            <span className="bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <CheckCircle size={10} /> Active
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-700 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <ShieldAlert size={10} /> Inactive
                            </span>
                          )}

                          {/* Mobile Edit and Delete icons right next to active badge */}
                          <div className="flex items-center gap-1.5 sm:hidden">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tr)}
                              className="p-1.5 text-slate-500 hover:text-[#111827] hover:bg-slate-100 rounded-lg border border-slate-200/80 transition cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Edit Instructor"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTrainer(tr.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200/80 transition cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Delete Instructor"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Phone size={11} className="text-gray-400" /> {tr.phone || 'No phone'}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Mail size={11} className="text-gray-400" /> {tr.email || 'No email'}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#111827]">
                          <BookOpen size={11} className="text-[#111827]" /> {bookingCount} Bookings
                        </span>
                      </div>
                      
                      {tr.notes && (
                        <p className="text-[10px] sm:text-[11px] text-[#6B7280] italic font-medium leading-relaxed max-w-xl">
                          "{tr.notes}"
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 self-center shrink-0">
                      <button
                        onClick={() => handleOpenEdit(tr)}
                        className="p-2 text-slate-500 hover:text-[#111827] hover:bg-slate-100 rounded-xl transition cursor-pointer touch-press min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200 sm:border-transparent"
                        title="Edit Details"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteTrainer(tr.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer touch-press min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200 sm:border-transparent"
                        title="Delete Instructor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {trainers.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No trainers pre-registered. Add your first certified instructor above!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
