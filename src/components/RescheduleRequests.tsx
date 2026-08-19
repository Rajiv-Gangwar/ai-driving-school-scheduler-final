import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Search,
  ChevronRight,
  ExternalLink,
  History,
  AlertCircle
} from 'lucide-react';
import { 
  RescheduleRequest, 
  ClassScheduled, 
  Trainer, 
  Student, 
  Cohort 
} from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RescheduleRequestsProps {
  requests: RescheduleRequest[];
  classes: ClassScheduled[];
  trainers: Trainer[];
  students: Student[];
  cohorts: Cohort[];
  onUpdateStatus: (requestId: string, newStatus: 'Resolved' | 'Declined', chosenSlot?: {date: string, startTime: string, endTime: string}) => void;
}

export default function RescheduleRequests({ 
  requests, 
  classes, 
  trainers, 
  students, 
  cohorts,
  onUpdateStatus 
}: RescheduleRequestsProps) {
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'All' || req.status === 'Pending';
    const requesterName = req.requesterName || '';
    const message = req.message || '';
    const matchesSearch = 
      (requesterName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (message || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getRequestDetails = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return null;

    const trainer = trainers.find(t => t.id === cls.trainerId);
    const cohort = cohorts.find(c => c.id === cls.cohortId);

    return { cls, trainer, cohort };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Student': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Instructor': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Parent': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Declined': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-rose-50/20 to-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
            Reschedule Requests
            <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
              {requests.filter(r => r.status === 'Pending').length} Pending
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage session change requests from students, parents, and instructors.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
            <button 
              onClick={() => setFilter('Pending')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-center cursor-pointer active:scale-95 ${filter === 'Pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending Only
            </button>
            <button 
              onClick={() => setFilter('All')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-center cursor-pointer active:scale-95 ${filter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              View All
            </button>
          </div>
          
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none" size={14} />
            <input 
              type="text" 
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none w-full sm:w-48 transition-all sm:focus:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requests List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-slate-300" size={32} />
              </div>
              <h3 className="text-slate-900 font-black">All Caught Up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">No {filter === 'Pending' ? 'pending' : ''} reschedule requests were found matching your criteria.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const details = getRequestDetails(req.classId);
              
              return (
                <motion.div 
                  layout
                  key={req.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all hover:border-rose-200 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-slate-50 group-hover:bg-rose-50 rounded-full transition-colors`} />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-rose-600 transition-colors">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 leading-tight">{req.requesterName}</h3>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${getRoleColor(req.requesterRole)}`}>
                              {req.requesterRole}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            Requested {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 mb-6 flex items-start gap-3">
                      <MessageSquare className="text-slate-400 mt-0.5 shrink-0" size={16} />
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                        "{req.message}"
                      </p>
                    </div>

                    {details && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Current Session</p>
                            <p className="text-xs font-extrabold text-slate-900">Sess #{details.cls.classNumber} - {details.cls.date}</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Current Time</p>
                            <p className="text-xs font-extrabold text-slate-900">{details.cls.startTime} - {details.cls.endTime}</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Instructor</p>
                            <p className="text-xs font-extrabold text-slate-900">{details.trainer?.name || 'TBA'}</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                            <History size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Cohort</p>
                            <p className="text-xs font-extrabold text-slate-900">{details.cohort?.name || 'Unassigned'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {req.status === 'Pending' && (
                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        {req.suggestedSlots && req.suggestedSlots.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested Alternatives (Pick One to Resolve)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {req.suggestedSlots.map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => onUpdateStatus(req.id, 'Resolved', slot)}
                                  className="bg-white border border-slate-200 p-3 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group/slot shadow-sm"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-4 h-4 rounded-full bg-slate-100 group-hover/slot:bg-emerald-100 flex items-center justify-center text-[8px] font-black text-slate-500 group-hover/slot:text-emerald-600 transition-colors">
                                      {sIdx + 1}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900">{slot.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 group-hover/slot:text-emerald-700 transition-colors">
                                    <Clock size={10} />
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onUpdateStatus(req.id, 'Declined')}
                            className="flex-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={14} />
                            Decline Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right Column: Insights/Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
            <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-4">Request Insights</h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution Rate</span>
                  <span className="text-xs font-black text-emerald-400">84%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[84%]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Avg. Wait</span>
                  <span className="text-lg font-black tracking-tight text-white">4.2h</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Success</span>
                  <span className="text-lg font-black tracking-tight text-white">92%</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button className="w-full bg-white text-slate-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all">
                Download History (CSV)
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-500" />
              Administrative Guidelines
            </h3>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                  Respond to all pending requests within **24 hours** to maintain scheduling integrity.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                  Decline requests that violate the **72-hour cancellation policy** unless emergency notes are provided.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                  Communicate with instructors directly if a reschedule requires manual slot adjustments.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
