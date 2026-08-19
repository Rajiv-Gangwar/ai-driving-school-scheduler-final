import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Shield, 
  Sparkles, 
  ChevronRight,
  Info,
  LogOut,
  Heart,
  ChevronDown,
  Users,
  AlertCircle,
  MessageSquare,
  Send,
  ChevronLeft,
  Star,
  FileText,
  LayoutGrid,
  Car,
  CheckCircle2,
  Mail,
  Phone,
  Menu,
  X,
  Bell,
  Check
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isSameMonth,
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { Student, ClassScheduled, Trainer, UserProfile, Cohort, RescheduleRequest, ClassFeedback, AppNotification, TrainerAvailabilitySlot } from '../types';
import { auth, signOut } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { getDriveColor, getDriveColorClass } from '../utils/driveStyles';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface ParentDashboardProps {
  userProfile: UserProfile;
  students: Student[];
  classes: ClassScheduled[];
  trainers: Trainer[];
  cohorts: Cohort[];
  slots: TrainerAvailabilitySlot[];
  rescheduleRequests: RescheduleRequest[];
  classFeedbacks: ClassFeedback[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onApproveMatch: (studentId: string, partnerId: string) => void;
  onBreakMatch: (studentId: string) => void;
  onRequestReschedule: (req: Omit<RescheduleRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export default function ParentDashboard({ 
  userProfile, 
  students, 
  classes, 
  trainers,
  cohorts,
  slots,
  rescheduleRequests,
  classFeedbacks,
  notifications,
  onMarkNotificationRead,
  onApproveMatch,
  onBreakMatch,
  onRequestReschedule
}: ParentDashboardProps) {
  const myStudents = useMemo(() => {
    const parentEmail = userProfile.email?.toLowerCase();
    
    // Find all students linked to this parent by email or primary association
    const results = students.filter(s => {
      const isPrimary = s.id === userProfile.associatedId;
      const isParent1 = s.parentEmail && parentEmail && s.parentEmail.toLowerCase() === parentEmail;
      const isParent2 = s.parent2Email && parentEmail && s.parent2Email.toLowerCase() === parentEmail;
      return isPrimary || isParent1 || isParent2;
    });
    
    // Deduplicate in case association overlaps with email matching
    const seen = new Set();
    return results.filter(s => {
      const duplicate = seen.has(s.id);
      seen.add(s.id);
      return !duplicate;
    });
  }, [students, userProfile]);

  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'performance' | 'monitoring'>('overview');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [thirdTabId, setThirdTabId] = useState<string>('performance');

  React.useEffect(() => {
    const mainTabs = ['overview', 'calendar'];
    if (!mainTabs.includes(activeTab)) {
      setThirdTabId(activeTab);
    }
  }, [activeTab]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [activeStudentId, setActiveStudentId] = useState(myStudents[0]?.id || userProfile.associatedId || '');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [suggestedSlots, setSuggestedSlots] = useState<{date: string, startTime: string, endTime: string}[]>([
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' }
  ]);
  const [selectedCalendarClass, setSelectedCalendarClass] = useState<ClassScheduled | null>(null);
  
  // Update active student if current selection is invalid or empty
  React.useEffect(() => {
    if ((!activeStudentId || !myStudents.find(s => s.id === activeStudentId)) && myStudents.length > 0) {
      setActiveStudentId(myStudents[0].id);
    }
  }, [myStudents, activeStudentId]);

  const student = students.find(s => s.id === activeStudentId);

  const myClasses = useMemo(() => {
    if (!student) return [];
    
    const realClasses = classes.filter(cls => 
      cls.studentNames.includes(student.name)
    ).sort((a, b) => a.date.localeCompare(b.date));

    if (realClasses.length > 0) return realClasses;

    // Dummy data if no real classes found
    return [
      {
        id: `p-dummy-1-${student.id}`,
        date: '2024-06-15',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        trainerId: trainers[0]?.id || 'tr-1',
        studentNames: student.name,
        cohortId: student.cohortId || 'coh-1',
        groupId: 'g-1',
        status: 'Confirmed',
        classNumber: 1
      },
      {
        id: `p-dummy-2-${student.id}`,
        date: '2024-07-01',
        startTime: '01:00 PM',
        endTime: '03:00 PM',
        trainerId: trainers[1]?.id || 'tr-2',
        studentNames: student.name,
        cohortId: student.cohortId || 'coh-1',
        groupId: 'g-1',
        status: 'Confirmed',
        classNumber: 2
      },
      {
        id: `p-dummy-3-${student.id}`,
        date: '2024-07-15',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        trainerId: trainers[0]?.id || 'tr-1',
        studentNames: student.name,
        cohortId: student.cohortId || 'coh-1',
        groupId: 'g-1',
        status: 'Confirmed',
        classNumber: 3
      },
      {
        id: `p-dummy-4-${student.id}`,
        date: '2026-08-15',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        trainerId: trainers[0]?.id || 'tr-1',
        studentNames: student.name,
        cohortId: student.cohortId || 'coh-1',
        groupId: 'g-1',
        status: 'Confirmed',
        classNumber: 4
      }
    ] as ClassScheduled[];
  }, [classes, student, trainers]);

  const uniqueDrives = useMemo(() => {
    const drivesMap = new Map<number, ClassScheduled>();
    myClasses.forEach(cls => {
      if (cls.classNumber >= 1 && cls.classNumber <= 6) {
        drivesMap.set(cls.classNumber, cls);
      }
    });
    return Array.from(drivesMap.values()).sort((a, b) => a.classNumber - b.classNumber);
  }, [myClasses]);

  const totalSkillsScore = useMemo(() => {
    return myClasses.reduce((acc, cls) => {
      const feedback = classFeedbacks.find(f => f.classId === cls.id && f.studentId === student?.id);
      if (feedback && feedback.skills) {
        return acc + Object.values(feedback.skills).reduce((a, b) => a + (b || 0), 0);
      }
      return acc;
    }, 0);
  }, [myClasses, classFeedbacks, student]);

  const hasRecommendation = myClasses.filter(c => classFeedbacks.some(f => f.classId === c.id && f.studentId === student?.id)).length >= 6 && totalSkillsScore < 152;
  const nextClass = myClasses.find(c => new Date(c.date) >= new Date()) || myClasses[1];
  const partner = student?.existingPartnerId ? students.find(s => s.id === student.existingPartnerId) : null;
  const cohort = cohorts.find(c => c.id === student?.cohortId);

  const completedTheorySessions = useMemo(() => {
    if (!student?.classroomSessions) return 0;
    return Object.values(student.classroomSessions).filter(status => status === 'Complete').length;
  }, [student]);

  // Check if student is within the partner selection window (up to 2nd day of class)
  const isWithinPartnerWindow = React.useMemo(() => {
    if (!cohort || !student?.under18) return false;
    const startDate = new Date(cohort.startDate);
    const today = new Date();
    // Reset times for day comparison
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Difference in calendar days. 0 = 1st day, 1 = 2nd day
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 1;
  }, [cohort, student]);

  const availablePartners = React.useMemo(() => {
    if (!student || !cohort) return [];
    return students.filter(s => 
      s.id !== student.id && 
      s.cohortId === student.cohortId && 
      s.under18 && 
      !s.existingPartnerId
    );
  }, [students, student, cohort]);

  const studentFeedbacks = useMemo(() => {
    return classFeedbacks.filter(f => f.studentId === activeStudentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [classFeedbacks, activeStudentId]);

  const performanceStats = useMemo(() => {
    if (studentFeedbacks.length === 0) return null;
    const avgRating = studentFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / studentFeedbacks.length;
    return {
      avgRating: avgRating.toFixed(1),
      totalLessons: studentFeedbacks.length,
      latestRating: studentFeedbacks[studentFeedbacks.length - 1].rating
    };
  }, [studentFeedbacks]);

  const formatTime = (time: string) => {
    if (!time) return '';
    if (time.includes('AM') || time.includes('PM')) return time;
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderCalendar = () => {
    const validMonth = currentMonth instanceof Date && !isNaN(currentMonth.getTime()) ? currentMonth : new Date();
    const monthStart = startOfMonth(validMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const parseSafeDate = (dateStr?: string | null): Date | null => {
      if (!dateStr) return null;
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const currentMonthDrives = uniqueDrives.filter(cls => {
      const clsDate = parseSafeDate(cls.date);
      if (!clsDate) return false;
      return isSameMonth(clsDate, validMonth);
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return (
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xs sm:shadow-sm">
        {/* Calendar Header */}
        <div className="p-3.5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-black text-slate-900 text-xs sm:text-base flex items-center gap-2">
            <Calendar size={16} className="text-rose-600 sm:w-5 sm:h-5 shrink-0" />
            <span>{format(validMonth, 'MMMM yyyy')}</span>
          </h3>
          <div className="flex gap-1 sm:gap-2">
            <button 
              onClick={() => setCurrentMonth(subMonths(validMonth, 1))}
              className="p-1.5 sm:p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer active:scale-95"
              aria-label="Previous Month"
            >
              <ChevronRight className="rotate-180" size={16} />
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(validMonth, 1))}
              className="p-1.5 sm:p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer active:scale-95"
              aria-label="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days Header - Desktop */}
        <div className="hidden sm:grid grid-cols-7 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        {/* Days Header - Mobile */}
        <div className="grid sm:hidden grid-cols-7 border-b border-slate-100 bg-slate-50/40">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="py-1.5 text-center text-[9px] font-black text-slate-400 uppercase">{day}</div>
          ))}
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden sm:grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayClasses = uniqueDrives.filter(c => {
              const cDate = parseSafeDate(c.date);
              if (!cDate) return false;
              return isSameDay(cDate, day);
            });
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={idx} 
                className={`min-h-[100px] p-2 border-r border-b border-slate-100 last:border-r-0 relative transition-colors ${!isSelectedMonth ? 'bg-slate-50/30 opacity-40' : 'hover:bg-slate-50/50'}`}
              >
                <span className={`text-[11px] font-bold ${isToday ? 'w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center' : 'text-slate-900'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-2 space-y-1">
                  {dayClasses.map(cls => {
                    const clsDate = parseSafeDate(cls.date);
                    const isCompleted = clsDate ? clsDate < new Date() : false;
                    const color = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                    
                    return (
                      <button 
                        key={cls.id}
                        onClick={() => {
                          setSelectedCalendarClass(cls);
                        }}
                        style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                        className="w-full text-left border rounded-lg p-1.5 shadow-xs group transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <p style={{ color }} className="text-[9px] font-black leading-tight uppercase">
                            {cls.isSpecialDrive ? 'Special' : `Drive ${cls.classNumber}`}
                          </p>
                          <div className="flex items-center gap-1">
                            {(cls.classNumber === 1 || classFeedbacks.some(f => f.classId === cls.id)) && <MessageSquare size={8} style={{ color }} className="opacity-60" />}
                            {isCompleted && <CheckCircle2 size={8} style={{ color }} />}
                          </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-500">{formatTime(cls.startTime)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Calendar Grid */}
        <div className="grid sm:hidden grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayClasses = uniqueDrives.filter(c => {
              const cDate = parseSafeDate(c.date);
              if (!cDate) return false;
              return isSameDay(cDate, day);
            });
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={idx} 
                className={`min-h-[52px] p-1 border-r border-b border-slate-100 flex flex-col items-center justify-start relative transition-colors ${!isSelectedMonth ? 'bg-slate-50/20 opacity-30' : ''}`}
              >
                <span className={`text-[10px] font-bold ${isToday ? 'w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center font-black shadow-2xs' : 'text-slate-800'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 w-full space-y-0.5">
                  {dayClasses.map(cls => {
                    const clsDate = parseSafeDate(cls.date);
                    const isCompleted = clsDate ? clsDate < new Date() : false;
                    const color = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                    
                    return (
                      <button 
                        key={cls.id}
                        onClick={() => setSelectedCalendarClass(cls)}
                        style={{ backgroundColor: `${color}18`, color: color, borderColor: `${color}40` }}
                        className="w-full text-[8px] font-black py-0.5 px-0.5 rounded border truncate flex items-center justify-center gap-0.5 active:scale-95 transition cursor-pointer"
                        title={`Drive ${cls.classNumber} - ${cls.startTime}`}
                      >
                        <span>D{cls.classNumber}</span>
                        {isCompleted && <CheckCircle2 size={7} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Agenda View below Month Grid */}
        <div className="sm:hidden border-t border-slate-100 bg-slate-50/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {format(validMonth, 'MMMM')} Drives
            </span>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {currentMonthDrives.length} Sessions
            </span>
          </div>

          {currentMonthDrives.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium italic text-center py-2">
              No sessions scheduled for {format(validMonth, 'MMMM yyyy')}
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonthDrives.map(cls => {
                const clsDate = parseSafeDate(cls.date);
                const isCompleted = clsDate ? clsDate < new Date() : false;
                const color = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                const trainer = trainers.find(t => t.id === cls.trainerId);
                
                return (
                  <div 
                    key={cls.id} 
                    onClick={() => setSelectedCalendarClass(cls)}
                    className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between cursor-pointer active:scale-[0.98] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs"
                      >
                        #{cls.classNumber}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{cls.date}</p>
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                          <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                          {trainer && <span className="text-slate-400">• {trainer.name}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        isCompleted ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {isCompleted ? 'Done' : 'Scheduled'}
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-950">
      
      {/* Top Header - Matching Admin theme but with Parent context */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shrink-0 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 transform transition duration-300 group-hover:rotate-12 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="shrink-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-display">
                SteerSafe
              </h1>
              <p className="text-[8px] sm:text-[9px] text-[#EC4899] font-extrabold uppercase tracking-widest leading-none">Parent Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar Toggle Menu Icon Button - Mobile Only (before Notification Bell) */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50/80 rounded-xl transition cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-2xs hover:border-indigo-200 shrink-0"
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={18} />
            </button>

            {/* Notification Bell */}
            <div className="relative group">
              <button className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-100 transition-all cursor-pointer shadow-xs">
                <Bell size={18} />
                {notifications.filter(n => !n.read && n.userId === userProfile.associatedId).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.filter(n => !n.read && n.userId === userProfile.associatedId).length}
                  </span>
                )}
              </button>
              
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] py-2">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notifications</span>
                </div>
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {notifications.filter(n => n.userId === userProfile.associatedId).length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-[10px] text-slate-400 font-bold">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.filter(n => n.userId === userProfile.associatedId).map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-rose-50/30' : ''}`}
                        onClick={() => onMarkNotificationRead(n.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                            n.type === 'Success' ? 'bg-emerald-100 text-emerald-600' : 
                            n.type === 'Error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {n.type === 'Success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          </div>
                          <div>
                            <p className={`text-[11px] font-extrabold leading-tight ${!n.read ? 'text-rose-900' : 'text-slate-900'}`}>{n.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[8px] text-slate-300 font-black uppercase mt-1 tracking-tighter">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-50 text-rose-700 border border-rose-100 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase shadow-xs">
                {(userProfile.displayName || 'P').slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none text-slate-900">{userProfile.displayName}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Guardian</p>
              </div>
              {/* Mobile: Logout Icon Only */}
              <button
                onClick={() => signOut(auth)}
                className="md:hidden p-2 text-slate-500 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl cursor-pointer transition flex items-center justify-center shadow-2xs"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
              {/* Desktop Logout Button */}
              <button
                onClick={() => signOut(auth)}
                className="hidden md:block text-[9px] sm:text-[10px] text-slate-600 hover:text-red-650 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Embedded seamlessly inside sticky header */}
        <div className="sm:hidden border-t border-slate-100/80 px-3 py-1.5 bg-slate-50/90 backdrop-blur-md">
          <div className="bg-[#f0f4ff] p-1 rounded-xl border border-indigo-100/90 flex items-center justify-between shadow-xs">
            {/* Overview Tab */}
            <button
              onClick={() => { setActiveTab('overview'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-600 shadow-xs border border-indigo-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <LayoutGrid size={14} className={activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Overview</span>
            </button>

            {/* Calendar Tab */}
            <button
              onClick={() => { setActiveTab('calendar'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-xs border border-indigo-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Calendar size={14} className={activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Calendar</span>
            </button>

            {/* Dynamic Third Place Tab & More Dropdown */}
            {(() => {
              const allMoreTabs = [
                { id: 'performance', label: 'Performance', icon: Sparkles },
                { id: 'monitoring', label: 'Monitoring', icon: Shield }
              ];

              const currentThirdTab = allMoreTabs.find(t => t.id === thirdTabId) || allMoreTabs[0];
              const ThirdIcon = currentThirdTab.icon;
              const isThirdActive = activeTab === currentThirdTab.id;
              const dropdownTabs = allMoreTabs.filter(t => t.id !== currentThirdTab.id);

              return (
                <>
                  <button
                    onClick={() => { setActiveTab(currentThirdTab.id as any); setIsMoreMenuOpen(false); }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer ${
                      isThirdActive
                        ? 'bg-white text-indigo-600 shadow-xs border border-indigo-50/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    <ThirdIcon size={14} className={isThirdActive ? 'text-indigo-600' : 'text-slate-500'} />
                    <span className="truncate max-w-[65px]">{currentThirdTab.label}</span>
                  </button>

                  {/* More Dropdown Tab */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="w-full py-1.5 px-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition duration-150 cursor-pointer text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      <span>More</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''} text-slate-500`} />
                    </button>

                    {/* Dropdown menu */}
                    {isMoreMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in duration-150 space-y-0.5">
                          {dropdownTabs.map(tab => {
                            const TabIcon = tab.icon;
                            const isSelected = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id as any);
                                  setThirdTabId(tab.id);
                                  setIsMoreMenuOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                  isSelected ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <TabIcon size={15} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                                  <span>{tab.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 w-full flex flex-col gap-3 sm:gap-6 pb-6 sm:pb-8 md:pb-8">

        {/* Desktop View Navigation Bar (Admin Panel Style) */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#f0f4ff] p-1.5 rounded-xl border border-indigo-100/90 shadow-xs overflow-x-auto tab-scroll whitespace-nowrap">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'performance', label: 'Performance', icon: Sparkles },
            { id: 'monitoring', label: 'Monitoring', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer min-h-[34px] relative touch-press shrink-0 ${
                  isActive 
                    ? 'text-indigo-600 z-10' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="parentDesktopActiveTabBg"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-indigo-100/90 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {!student ? (
          <div className="bg-rose-50 border border-rose-100 p-12 rounded-3xl text-center shadow-xs">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-black text-rose-900 mb-2">Student Record Not Found</h3>
            <p className="text-slate-600 font-medium max-w-md mx-auto">
              This parent account is not currently linked to a student record. Please contact the school to verify your guardian authorization.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
              {activeTab === 'overview' ? (
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome, {userProfile.displayName}</h2>
                  <p className="text-xs sm:text-sm sm:text-slate-500 font-medium tracking-tight mt-0.5 sm:mt-1">
                    Guardian dashboard for linked student records and progress tracking
                  </p>
                </div>
              ) : (
                <div className="hidden md:block">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h2>
                </div>
              )}
            </div>

            {/* Child Monitoring Selection */}
            <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs sm:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                  <Users size={18} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-2">Active Student Profile</p>
                  {myStudents.length > 1 ? (
                    <div className="relative z-30 w-full sm:max-w-xs">
                      <button
                        type="button"
                        onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 sm:border-2 sm:border-slate-100 text-slate-900 text-sm sm:text-lg font-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl hover:bg-white hover:border-rose-200 transition-all cursor-pointer shadow-2xs sm:shadow-sm text-left active:scale-[0.99]"
                      >
                        <span className="truncate">{student?.name || 'Select Student'}</span>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isStudentDropdownOpen ? 'rotate-180 text-rose-500' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isStudentDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsStudentDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1 z-50 overflow-hidden min-w-[200px]"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                <span>Active Student Profile</span>
                                <span className="text-rose-500 font-bold">{myStudents.length} Students</span>
                              </div>
                              <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                                {myStudents.map(s => {
                                  const isActive = s.id === activeStudentId;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveStudentId(s.id);
                                        setIsStudentDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition flex items-center justify-between gap-2 cursor-pointer ${
                                        isActive
                                          ? 'bg-rose-50/90 text-rose-700 font-extrabold border border-rose-100/80 shadow-2xs'
                                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                                      }`}
                                    >
                                      <span className="truncate">{s.name}</span>
                                      {isActive && <Check size={14} className="text-rose-500 shrink-0 stroke-[2.5]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-base sm:text-xl font-black text-slate-900 truncate leading-tight">{student?.name}</p>
                  )}
                </div>
              </div>
              <div className="self-start sm:self-center flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100 shrink-0">
                <div className={`w-2 h-2 rounded-full ${student?.under18 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-[11px] sm:text-xs font-bold text-slate-600">{student?.under18 ? 'Minor Student' : 'Adult Student'}</span>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Mobile View: Class Progress & Drive Progress 2-card Grid (matching Student Portal) */}
                    {(() => {
                      const completedDrivesCount = uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length;
                      const totalDrivesNeeded = student.under18 ? 6 : 3;
                      const theoryPct = Math.round((completedTheorySessions / 12) * 100);
                      const drivesPct = Math.round((completedDrivesCount / totalDrivesNeeded) * 100);

                      return (
                        <div className="sm:hidden grid grid-cols-2 gap-2.5">
                          {/* Class Progress */}
                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-2">
                            <div>
                              <div className="mb-1">
                                <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider leading-tight block">Class Progress</span>
                              </div>
                              <div className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100 w-max truncate">
                                Theory
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <div className="w-9 h-9 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { value: completedTheorySessions },
                                        { value: Math.max(0, 12 - completedTheorySessions) }
                                      ]}
                                      innerRadius={11}
                                      outerRadius={17}
                                      dataKey="value"
                                      startAngle={90}
                                      endAngle={-270}
                                    >
                                      <Cell fill="#6366f1" />
                                      <Cell fill="#f1f5f9" />
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 leading-tight">{theoryPct}%</p>
                                <p className="text-[9px] text-slate-400 font-bold truncate">{completedTheorySessions}/12 Done</p>
                              </div>
                            </div>
                          </div>

                          {/* Drive Progress */}
                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-2">
                            <div>
                              <div className="mb-1">
                                <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider leading-tight block">Drive Progress</span>
                              </div>
                              <div className="text-[9px] font-black uppercase text-pink-600 bg-pink-50/80 px-2 py-0.5 rounded-md border border-pink-100 w-max truncate">
                                Drives
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <div className="w-9 h-9 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { value: completedDrivesCount },
                                        { value: Math.max(0, totalDrivesNeeded - completedDrivesCount) }
                                      ]}
                                      innerRadius={11}
                                      outerRadius={17}
                                      dataKey="value"
                                      startAngle={90}
                                      endAngle={-270}
                                    >
                                      <Cell fill="#ec4899" />
                                      <Cell fill="#f1f5f9" />
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 leading-tight">{drivesPct}%</p>
                                <p className="text-[9px] text-slate-400 font-bold truncate">{completedDrivesCount}/{totalDrivesNeeded} Done</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Desktop/Tablet View Pie Charts */}
                    <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Classes Completion Pie Chart */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Class Progress</h3>
                        <div className="h-40 w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Completed', value: completedTheorySessions, color: '#f43f5e' },
                                  { name: 'Remaining', value: 12 - completedTheorySessions, color: '#f1f5f9' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={65}
                                paddingAngle={0}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                              >
                                <Cell key="cell-0" fill="#f43f5e" />
                                <Cell key="cell-1" fill="#f1f5f9" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-900">{completedTheorySessions}/12</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-rose-300">Theory</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{Math.round((completedTheorySessions / 12) * 100)}% Complete</p>
                        </div>
                      </div>

                      {/* Drives Completion Pie Chart */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Drive Progress</h3>
                        <div className="h-40 w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Completed', value: uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length, color: '#fb923c' },
                                  { name: 'Remaining', value: Math.max(0, (student.under18 ? 6 : 3) - uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length), color: '#f1f5f9' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={65}
                                paddingAngle={0}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                              >
                                <Cell key="cell-0" fill="#fb923c" />
                                <Cell key="cell-1" fill="#f1f5f9" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-900">{uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length}/{student.under18 ? 6 : 3}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-orange-300">Drives</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{Math.round((uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length / (student.under18 ? 6 : 3)) * 100)}% Complete</p>
                        </div>
                      </div>
                    </div>

                    {/* Drive Feedback Section */}
                    <div className="space-y-6">
                      {nextClass && (
                        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-rose-500/20 to-transparent pointer-events-none" />
                          <div className="relative z-10 flex justify-between items-center">
                            <div className="space-y-2">
                              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Next Drive
                              </span>
                              <div>
                                <h3 className="text-xl font-black text-white">{nextClass.date}</h3>
                                <p className="text-sm font-medium text-slate-400">{nextClass.startTime} - {nextClass.endTime}</p>
                              </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md text-white w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform duration-500">
                              <Car className="w-6 h-6" style={{ color: getDriveColor(nextClass.classNumber, nextClass.isSpecialDrive) }} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Drive Feedback</h3>
                          <button 
                            onClick={() => setActiveTab('performance')}
                            className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline"
                          >
                            View All
                          </button>
                        </div>
                        <div className="space-y-4">
                          {uniqueDrives
                            .filter(cls => classFeedbacks.some(f => f.classId === cls.id))
                            .slice(-2)
                            .reverse()
                            .map(cls => {
                              const feedback = classFeedbacks.find(f => f.classId === cls.id && f.studentId === student?.id);
                              if (!feedback) return null;
                              return (
                                <div key={feedback.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                                  <div 
                                    className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm"
                                    style={{ backgroundColor: getDriveColor(cls.classNumber, cls.isSpecialDrive) }}
                                  >
                                    {cls.isSpecialDrive ? 'S' : `#${cls.classNumber}`}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs font-black text-slate-900">{cls.date}</p>
                                      <div className="flex gap-0.5 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={10} className={i < feedback.rating ? 'fill-current' : 'text-slate-200'} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic truncate">"{feedback.comment}"</p>
                                  </div>
                                </div>
                              );
                            })}
                          {uniqueDrives.filter(cls => classFeedbacks.some(f => f.classId === cls.id)).length === 0 && (
                            <div className="text-center py-6">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No feedback recorded yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Class Progress Section */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-xs sm:shadow-sm">
                      <div className="flex items-center justify-between mb-3 sm:mb-6">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Class Progress (Theory)</h3>
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded-lg uppercase">{completedTheorySessions} of 12 Complete</span>
                      </div>
                      
                      {/* Mobile progress bar */}
                      <div className="sm:hidden mb-3 bg-slate-100 rounded-full h-2 w-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((completedTheorySessions / 12) * 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                        {[...Array(12)].map((_, i) => {
                          const isPassed = student?.classroomSessions?.[i + 1] === 'Complete';
                          return (
                            <div key={i} className={`flex flex-col items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${isPassed ? 'bg-emerald-50/80 border-emerald-100 text-emerald-600' : 'bg-slate-50/80 border-slate-100 text-slate-400'}`}>
                              {isPassed ? <CheckCircle2 size={14} className="mb-1 sm:mb-2 text-emerald-600 shrink-0" /> : <Clock size={14} className="mb-1 sm:mb-2 shrink-0" />}
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">M{i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Program Pulse</h3>
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3.5 sm:space-y-8 relative overflow-hidden">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                          <Star size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Score</p>
                          <p className="text-xl sm:text-2xl font-black text-slate-900">{performanceStats?.avgRating || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Communication Hub moved to sidebar */}
                    <div className="bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl relative overflow-hidden">
                      <div className="relative z-10 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                          <div className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-400">Contacts</h3>
                          </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 space-y-2 sm:space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Contact</p>
                            {partner ? (
                              <div className="flex items-center justify-between gap-2 bg-black/20 p-2 sm:p-2.5 rounded-xl">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold truncate">{partner.name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <a href={`mailto:${partner.email || ''}`} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Mail size={14} /></a>
                                  {partner.phone && <a href={`tel:${partner.phone}`} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Phone size={14} /></a>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">No partner assigned</p>
                            )}
                          </div>
                          <div className="bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 space-y-2 sm:space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Guardians</p>
                            <div className="space-y-1.5 sm:space-y-2">
                              {student.parentEmail && student.parentEmail !== userProfile.email && (
                                <div className="flex items-center justify-between gap-2 bg-black/20 p-2 sm:p-2.5 rounded-xl">
                                  <span className="text-[9px] sm:text-xs font-bold truncate">{student.parentEmail}</span>
                                  <a href={`mailto:${student.parentEmail}`} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Mail size={12} /></a>
                                </div>
                              )}
                              {student.parent2Email && student.parent2Email !== userProfile.email && (
                                <div className="flex items-center justify-between gap-2 bg-black/20 p-2 sm:p-2.5 rounded-xl">
                                  <span className="text-[9px] sm:text-xs font-bold truncate">{student.parent2Email}</span>
                                  <a href={`mailto:${student.parent2Email}`} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Mail size={12} /></a>
                                </div>
                              )}
                              {(!student.parent2Email || student.parent2Email === userProfile.email) && (!student.parentEmail || student.parentEmail === userProfile.email) && (
                                <p className="text-[10px] text-slate-500 italic">No secondary guardian</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monitoring' && (
              <>
                {/* Next Lesson Highlight */}
                {nextClass && (
                  <div className="bg-slate-900 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-rose-500/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 md:gap-8">
                      <div className="space-y-3 sm:space-y-5 w-full md:w-auto">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-block bg-rose-500 text-white px-2.5 py-0.5 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0">
                            Next Scheduled Session
                          </span>
                          <div className="flex md:hidden bg-white/5 backdrop-blur-md text-white w-10 h-10 rounded-xl items-center justify-center border border-white/10 shrink-0">
                            <Calendar className="w-5 h-5 stroke-[2.5]" style={{ color: getDriveColor(nextClass.classNumber, nextClass.isSpecialDrive) }} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-4xl md:text-5xl font-black font-display mb-0.5 sm:mb-1 text-white leading-tight">{nextClass.date}</h3>
                          <p className="text-sm sm:text-xl md:text-2xl font-medium text-slate-400">{nextClass.startTime} - {nextClass.endTime}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-0.5">
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 text-slate-300">
                            <User size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" style={{ color: getDriveColor(nextClass.classNumber, nextClass.isSpecialDrive) }} />
                            <span className="text-[10px] sm:text-xs font-black truncate max-w-[160px] sm:max-w-none">Instructor {trainers.find(t => t.id === nextClass.trainerId)?.name || 'TBA'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-500/20 text-emerald-400">
                            <Sparkles size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" />
                            <span className="text-[10px] sm:text-xs font-black">Confirmed</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:flex bg-white/5 backdrop-blur-md text-white w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500 border border-white/10 shrink-0">
                        <Calendar className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" style={{ color: getDriveColor(nextClass.classNumber, nextClass.isSpecialDrive) }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule and Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Driving Schedule</h3>
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-full">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{student?.under18 ? 6 : 3} Total Drives</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {uniqueDrives.map((cls) => {
                        const hasPendingReschedule = rescheduleRequests.some(r => r.classId === cls.id && r.status === 'Pending');
                        const trainerName = trainers.find(t => t.id === cls.trainerId)?.name || 'TBA';
                        const driveColor = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                        
                        const sessionDate = new Date(cls.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isCompleted = sessionDate < today;
                        
                        return (
                          <div key={cls.id} className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all group ${isCompleted ? 'bg-slate-50/50 grayscale-[0.3]' : ''}`}>
                            {/* Mobile View Card */}
                            <div className="p-3.5 sm:hidden flex flex-col gap-2.5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    style={{ backgroundColor: isCompleted ? '#94a3b8' : driveColor }}
                                    className="px-2.5 py-1 rounded-lg text-white font-black text-xs flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>Drive #{cls.classNumber}</span>
                                    {isCompleted && <CheckCircle2 size={12} className="text-white" />}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {cls.status}
                                  </span>
                                </div>

                                {!isCompleted && !hasPendingReschedule && cls.status === 'Confirmed' && (
                                  <button 
                                    onClick={() => setActiveRescheduleId(activeRescheduleId === cls.id ? null : cls.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 font-extrabold text-[10px] cursor-pointer active:scale-95 transition"
                                  >
                                    <MessageSquare size={12} />
                                    <span>Reschedule</span>
                                  </button>
                                )}
                                {hasPendingReschedule && (
                                  <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                                    <Clock size={11} />
                                    <span>Pending</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-900">{cls.date}</h4>
                                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-bold">
                                  <span className="flex items-center gap-1"><Clock size={12} className="text-indigo-500" /> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                  <span className="flex items-center gap-1 text-slate-500"><User size={12} className="text-slate-400" /> {trainerName}</span>
                                </div>
                              </div>
                            </div>

                            {/* Desktop View Card */}
                            <div className="hidden sm:flex p-6 flex-row items-center gap-6 cursor-pointer hover:bg-slate-50/50 transition-colors">
                              <div 
                                style={{ backgroundColor: isCompleted ? '#f1f5f9' : driveColor, color: isCompleted ? '#94a3b8' : 'white' }}
                                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors shrink-0 border border-slate-100 relative"
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest mb-0.5">Drive</span>
                                <span className="text-2xl font-black leading-none">{cls.classNumber}</span>
                                {isCompleted && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white"><CheckCircle2 size={10} /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                  <h4 className="text-lg font-black text-slate-900 truncate">{cls.date}</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                      cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {cls.status}
                                    </span>
                                    {isCompleted && (
                                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                                        Completed
                                      </span>
                                    )}
                                    {hasPendingReschedule && (
                                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                                        Resched. Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-bold">
                                  <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                  <span className="flex items-center gap-1.5"><User size={12} className="text-slate-400" /> Instructor {trainerName}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 justify-end">
                                {!isCompleted && !hasPendingReschedule && cls.status === 'Confirmed' && (
                                  <button 
                                    onClick={() => setActiveRescheduleId(activeRescheduleId === cls.id ? null : cls.id)}
                                    className="flex items-center justify-center gap-2 p-2.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/50 cursor-pointer transition-all"
                                    title="Request Reschedule"
                                  >
                                    <MessageSquare size={18} />
                                  </button>
                                )}
                                {hasPendingReschedule && (
                                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5">
                                    <Clock size={12} />
                                    Reschedule Pending
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Program Pulse</h3>
                    
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3.5 sm:space-y-8 text-sm">
                      <div className="space-y-2 sm:space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Cohort</p>
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{cohort?.name || 'Verifying...'}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex justify-between">
                              <span>Starts</span>
                              <span>{cohort?.startDate || 'TBA'}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex justify-between">
                              <span>Ends</span>
                              <span>{cohort?.endDate || 'TBA'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {partner && (
                        <div className="space-y-2 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driving Partner</p>
                          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-50/50 rounded-xl sm:rounded-2xl border border-purple-100">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm sm:text-base shrink-0">
                              {partner.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{partner.name}</p>
                              <p className="text-[9px] sm:text-[10px] text-purple-600 font-bold uppercase">Paired Session Lead</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-1 sm:pt-2 border-t border-slate-100">
                        <div className="bg-rose-600 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-rose-200 text-white group cursor-pointer relative overflow-hidden">
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Safety Concerns?</p>
                              <p className="text-xs font-black">Call Support Office</p>
                            </div>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform sm:w-5 sm:h-5" />
                          </div>
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'calendar' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderCalendar()}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Training Performance Data</h3>
                  {hasRecommendation && (
                    <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-2 animate-pulse">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Recommendation Issued</span>
                    </div>
                  )}
                </div>

                {hasRecommendation && (
                  <div className="p-6 bg-rose-50 rounded-3xl border-2 border-rose-200 border-dashed">
                    <h5 className="text-sm font-black text-rose-900 mb-2">Notice for Candidates & Guardians</h5>
                    <p className="text-xs font-bold text-rose-800 leading-relaxed">
                      Based on cumulative performance data across the primary drive sequence (Score: {totalSkillsScore}/252), 
                      we <span className="underline decoration-2 text-rose-600">Recommend Additional Parent and Instructor Drive for 1-2 hours</span> to reach certification proficiency.
                    </p>
                  </div>
                )}

                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-xs sm:shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-8">Detailed Instructor Observations</h4>
                  <div className="space-y-4 sm:space-y-6">
                    {uniqueDrives
                      .filter(cls => new Date(cls.date) < new Date())
                      .slice().reverse()
                      .map((cls) => {
                        let feedback = classFeedbacks.find(f => f.classId === cls.id && f.studentId === student?.id);
                        
                        // Provide dummy feedback for Drive 1 if it doesn't exist
                        if (!feedback && cls.classNumber === 1) {
                          feedback = {
                            id: 'dummy-1',
                            classId: cls.id,
                            studentId: student?.id || '',
                            studentName: student?.name || '',
                            trainerId: cls.trainerId,
                            rating: 4,
                            comment: "Excellent first drive. Good lane positioning and observation at intersections. Continue working on smooth pedal control during stops.",
                            skills: { "VehicleControl": 3, "Observation": 3, "Confidence": 2, "Safety": 3 },
                            intervention: 1,
                            timestamp: new Date().toISOString(),
                            createdAt: new Date().toISOString()
                          } as ClassFeedback;
                        }

                        const driveColor = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                        
                        return (
                          <div key={cls.id} className="p-3.5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-slate-50 border border-slate-100">
                            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                              <div className="shrink-0 flex flex-row md:flex-col items-center gap-3">
                                <div 
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white shadow-md sm:shadow-lg"
                                  style={{ backgroundColor: driveColor }}
                                >
                                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-80">{cls.isSpecialDrive ? 'Special' : 'Drive'}</span>
                                  <span className="text-base sm:text-xl font-black leading-none">{cls.classNumber}</span>
                                </div>
                                <div className="text-left md:text-center">
                                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {cls.date ? format(new Date(cls.date), 'MMM d') : 'Date TBA'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-4 sm:space-y-6">
                                {feedback ? (
                                  <>
                                    <div className="space-y-3 sm:space-y-4">
                                      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs sm:shadow-sm flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                                        <div className="space-y-1.5 sm:space-y-3 flex-1">
                                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 sm:pb-2">Skill Rating Key</p>
                                          <div className="flex flex-wrap gap-2.5 sm:gap-4">
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-rose-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tight">Needs Improvement</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-rose-500 fill-current" /><Star size={9} className="text-rose-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tight">Basic</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-rose-500 fill-current" /><Star size={9} className="text-rose-500 fill-current" /><Star size={9} className="text-rose-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tight">Consistent</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-3 flex-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
                                          <p className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-50 pb-1.5 sm:pb-2">Instructor Intervention Key</p>
                                          <div className="flex flex-wrap gap-2.5 sm:gap-4">
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-amber-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-tight">Constant</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-amber-500 fill-current" /><Star size={9} className="text-amber-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-tight">Minimal</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="flex gap-0.5"><Star size={9} className="text-amber-500 fill-current" /><Star size={9} className="text-amber-500 fill-current" /><Star size={9} className="text-amber-500 fill-current" /></div>
                                              <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-tight">None</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                        {feedback.skills && Object.entries(feedback.skills).map(([key, score]) => (
                                          <div key={key} className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs sm:shadow-sm">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 truncate">
                                              {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </p>
                                            <div className="flex gap-0.5">
                                              {[1, 2, 3].map(s => (
                                                <Star key={s} size={10} className={s <= (score as number) ? 'text-rose-500 fill-current' : 'text-slate-100'} />
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                        <div className="bg-amber-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-amber-100 shadow-2xs sm:shadow-sm relative overflow-hidden group">
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider truncate">{feedback.interventionMetric || 'Steering Wheel / Brake'}</p>
                                            <div className="p-0.5 bg-amber-100 rounded text-amber-600">
                                              <Info size={8} />
                                            </div>
                                          </div>
                                          <div className="flex gap-0.5">
                                            {[1, 2, 3].map(s => (
                                              <Star key={s} size={10} className={s <= (feedback!.intervention || 0) ? 'text-amber-500 fill-current' : 'text-amber-200'} />
                                            ))}
                                          </div>
                                          <div className="mt-1.5 pt-1 border-t border-amber-100/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[7px] font-black text-amber-500 uppercase tracking-tighter">1: Constant | 2: Minimal | 3: None</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                                      <p className="text-[10px] sm:text-[11px] text-slate-600 italic leading-relaxed">"{feedback.comment}"</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                                      <Clock size={14} className="text-slate-300 sm:w-4 sm:h-4" />
                                    </div>
                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Awaiting Feedback</p>
                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase">Instructor is currently processing this session review</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {uniqueDrives.filter(cls => new Date(cls.date) < new Date()).length === 0 && (
                      <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-2xl sm:rounded-[2.5rem] border border-dashed border-slate-200">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xs sm:shadow-sm">
                          <Star size={20} className="text-slate-200 sm:w-6 sm:h-6" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">No instructor feedback recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 text-white relative overflow-hidden shadow-lg sm:shadow-xl">
                  <div className="relative z-10">
                    <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-indigo-300 mb-1.5 sm:mb-2">Instructor Insight</h4>
                    <p className="text-sm sm:text-xl font-medium leading-relaxed max-w-2xl">
                      "Consistent practice is the key to mastery. Focus on maintaining scanning patterns even in familiar routes."
                    </p>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-800/50 rounded-full blur-2xl" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Calendar Drive Detail Modal */}
      {selectedCalendarClass && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCalendarClass(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="pt-2.5 pb-0 flex justify-center sm:hidden">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div 
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white shadow-md sm:shadow-lg shrink-0"
                    style={{ backgroundColor: getDriveColor(selectedCalendarClass.classNumber, selectedCalendarClass.isSpecialDrive) }}
                  >
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5 sm:mb-1">Drive</span>
                    <span className="text-lg sm:text-2xl font-black leading-none">{selectedCalendarClass.classNumber}</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-black text-slate-900">{selectedCalendarClass.date}</h3>
                    <p className="text-[11px] sm:text-sm font-medium text-slate-500">{formatTime(selectedCalendarClass.startTime)} - {formatTime(selectedCalendarClass.endTime)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCalendarClass(null)} className="p-2 sm:p-3 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer active:scale-95">
                  <ChevronDown size={20} className="text-slate-400 sm:w-6 sm:h-6 sm:rotate-180" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                  <User size={16} className="text-slate-400 sm:w-5 sm:h-5 shrink-0" />
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">Instructor {trainers.find(t => t.id === selectedCalendarClass.trainerId)?.name || 'TBA'}</p>
                  </div>
                </div>

                {new Date(selectedCalendarClass.date) < new Date() ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3.5 sm:p-6 bg-emerald-50 rounded-2xl sm:rounded-[2rem] border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="text-[10px] sm:text-xs font-black text-emerald-900 uppercase tracking-widest">Drive Performance Summary</span>
                      </div>
                      {(() => {
                        let feedback = classFeedbacks.find(f => f.classId === selectedCalendarClass.id && f.studentId === student?.id);
                        if (!feedback && selectedCalendarClass.classNumber === 1) {
                          feedback = {
                            rating: 4,
                            comment: "Excellent first drive. Good lane positioning and observation at intersections. Continue working on smooth pedal control during stops.",
                            skills: { "VehicleControl": 3, "Observation": 3, "Confidence": 2, "Safety": 3 },
                            intervention: 1
                          } as any;
                        }
                        
                        if (feedback) {
                          return (
                            <div className="space-y-4 sm:space-y-6">
                              <p className="text-xs sm:text-sm text-emerald-800 font-medium italic leading-relaxed bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100/50">"{feedback.comment}"</p>
                              
                              <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Skill Evaluation</h4>
                                  <div className="flex gap-1.5 sm:gap-2">
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-200" /><span className="text-[7px] font-bold text-emerald-600 uppercase">1 Imp.</span></div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[7px] font-bold text-emerald-600 uppercase">2 Basic</span></div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /><span className="text-[7px] font-bold text-emerald-600 uppercase">3 Consist.</span></div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                  {feedback.skills && Object.entries(feedback.skills).map(([key, score]) => (
                                    <div key={key} className="flex items-center justify-between p-2 sm:p-2.5 bg-white/40 rounded-lg sm:rounded-xl border border-emerald-100/30">
                                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <div className="flex gap-1">
                                        {[1, 2, 3].map(s => (
                                          <Star key={s} size={11} className={s <= (score as number) ? 'text-emerald-600 fill-current' : 'text-emerald-100'} />
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-3 sm:pt-4 border-t border-emerald-100/50">
                                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Instructor Intervention: <span className="text-amber-900 ml-1">{feedback.interventionMetric || 'Steering/Brake'}</span></h4>
                                </div>
                                <div className="bg-amber-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-100/50">
                                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                    <div className="flex gap-1">
                                      {[1, 2, 3].map(s => (
                                        <Star key={s} size={14} className={s <= (feedback!.intervention || 0) ? 'text-amber-500 fill-current' : 'text-slate-200'} />
                                      ))}
                                    </div>
                                    <span className="text-[9px] font-black text-amber-600 bg-white px-2 py-0.5 sm:py-1 rounded-lg border border-amber-100 shadow-2xs uppercase tracking-widest">
                                      {feedback.intervention === 1 ? 'Constant' : feedback.intervention === 2 ? 'Minimal' : 'None'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    <div className="text-center p-1.5 rounded-lg bg-white/50 border border-amber-100/30">
                                      <p className="text-[7px] font-black text-amber-800 uppercase tracking-tighter">1 Star</p>
                                      <p className="text-[8px] font-bold text-amber-600">Constant</p>
                                    </div>
                                    <div className="text-center p-1.5 rounded-lg bg-white/50 border border-amber-100/30">
                                      <p className="text-[7px] font-black text-amber-800 uppercase tracking-tighter">2 Stars</p>
                                      <p className="text-[8px] font-bold text-amber-600">Minimal</p>
                                    </div>
                                    <div className="text-center p-1.5 rounded-lg bg-white/50 border border-amber-100/30">
                                      <p className="text-[7px] font-black text-amber-800 uppercase tracking-tighter">3 Stars</p>
                                      <p className="text-[8px] font-bold text-amber-600">None</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return <p className="text-xs text-emerald-800 font-medium italic">Feedback is being processed by the instructor.</p>;
                      })()}
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedCalendarClass(null);
                        setActiveTab('performance');
                      }}
                      className="w-full py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-lg active:scale-98 cursor-pointer"
                    >
                      View Detailed Performance
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-100 flex items-center gap-3">
                      <Clock size={16} className="text-amber-600 shrink-0" />
                      <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Upcoming Session</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setActiveRescheduleId(selectedCalendarClass.id);
                        setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                      }}
                      className="w-full py-3 sm:py-4 bg-rose-600 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition shadow-md sm:shadow-lg shadow-rose-200 active:scale-98 cursor-pointer"
                    >
                      Request Reschedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Reschedule Modal */}
      {activeRescheduleId && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveRescheduleId(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Request Reschedule</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Suggest 3 alternative slots for review</p>
                  </div>
                </div>
                <button onClick={() => setActiveRescheduleId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <LayoutGrid size={24} className="text-slate-300 rotate-45" />
                </button>
              </div>

              {(() => {
                const cls = classes.find(c => c.id === activeRescheduleId);
                if (!cls) return null;
                const instructorOpenSlots = slots.filter(s => s.trainerId === cls.trainerId && s.status === 'Open');
                
                return (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Session</p>
                        <p className="text-xs font-bold text-slate-700">{cls.date} • {formatTime(cls.startTime)}</p>
                        <p className="text-[10px] font-bold text-indigo-600 mt-1">{student?.name}'s Drive</p>
                      </div>
                      <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-black text-slate-500">
                        Drive #{cls.classNumber}
                      </div>
                    </div>

                    {instructorOpenSlots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Available Instructor Slots</p>
                          <span className="text-[9px] font-bold text-slate-400">{suggestedSlots.filter(s => s.date).length}/3 Selected</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {instructorOpenSlots.slice(0, 4).map((slot) => {
                            const isSelected = suggestedSlots.some(s => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime);
                            return (
                              <button
                                key={slot.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSuggestedSlots(suggestedSlots.map(s => (s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime) ? { date: '', startTime: '', endTime: '' } : s));
                                  } else {
                                    const emptyIdx = suggestedSlots.findIndex(s => !s.date);
                                    if (emptyIdx !== -1) {
                                      const newSlots = [...suggestedSlots];
                                      newSlots[emptyIdx] = { date: slot.date, startTime: slot.startTime, endTime: slot.endTime };
                                      setSuggestedSlots(newSlots);
                                    }
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left transition-all group ${
                                  isSelected 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-black">{slot.date}</span>
                                  <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>{formatTime(slot.startTime)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propose exactly 3 Slots</p>
                        {suggestedSlots.filter(s => s.date && s.startTime && s.endTime).length < 3 && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase">
                            <AlertCircle size={10} />
                            Required
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {suggestedSlots.map((slot, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border transition-all ${slot.date ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                <input 
                                  type="date"
                                  value={slot.date}
                                  onChange={(e) => {
                                    const newSlots = [...suggestedSlots];
                                    newSlots[idx].date = e.target.value;
                                    setSuggestedSlots(newSlots);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                                  <input 
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => {
                                      const newSlots = [...suggestedSlots];
                                      newSlots[idx].startTime = e.target.value;
                                      setSuggestedSlots(newSlots);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                                  <input 
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => {
                                      const newSlots = [...suggestedSlots];
                                      newSlots[idx].endTime = e.target.value;
                                      setSuggestedSlots(newSlots);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message for Admin (Optional)</label>
                      <textarea 
                        value={rescheduleMessage}
                        onChange={(e) => setRescheduleMessage(e.target.value)}
                        placeholder="Explain why you need to reschedule..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[80px]"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setActiveRescheduleId(null)}
                className="flex-1 py-4 bg-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                disabled={suggestedSlots.some(s => !s.date || !s.startTime || !s.endTime)}
                onClick={() => {
                  const validSlots = suggestedSlots.filter(s => s.date && s.startTime && s.endTime);
                  if (validSlots.length === 3) {
                    onRequestReschedule({
                      classId: activeRescheduleId!,
                      requesterId: userProfile.uid,
                      requesterName: userProfile.displayName,
                      requesterRole: userProfile.role as 'Student' | 'Instructor' | 'Parent',
                      message: rescheduleMessage,
                      suggestedSlots: validSlots,
                    });
                    setRescheduleMessage('');
                    setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                    setActiveRescheduleId(null);
                    setSelectedCalendarClass(null);
                  }
                }}
                className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition shadow-lg shadow-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Reschedule Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Fixed on mobile viewports */}
      <div 
        className="sm:hidden fixed bottom-0 left-0 right-0 w-full z-[40] bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-1 pt-1.5 pb-[calc(1.2rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none"
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)'
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer min-h-[44px] touch-press relative font-bold ${
            activeTab === 'overview' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'overview' && (
            <motion.div
              layoutId="parentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-rose-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <LayoutGrid size={18} className={activeTab === 'overview' ? 'text-rose-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'calendar' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'calendar' && (
            <motion.div
              layoutId="parentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-rose-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Calendar size={18} className={activeTab === 'calendar' ? 'text-rose-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'performance' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'performance' && (
            <motion.div
              layoutId="parentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-rose-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Sparkles size={18} className={activeTab === 'performance' ? 'text-rose-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'monitoring' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'monitoring' && (
            <motion.div
              layoutId="parentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-rose-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Shield size={18} className={activeTab === 'monitoring' ? 'text-rose-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Oversight</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer text-slate-500 font-bold min-h-[44px] touch-press"
        >
          <Menu size={18} className="text-slate-600" />
          <span className="text-[9px] mt-0.5 leading-none">All Views</span>
        </button>
      </div>

      {/* Footer - Minimalist copyright / versioning */}
      <footer className="bg-white border-t border-[#E5E7EB] py-3 sm:py-4 px-4 mt-2 sm:mt-auto text-center text-[10px] sm:text-xs text-[#6B7280] font-bold uppercase tracking-wider shrink-0 mb-20 md:mb-0 shadow-2xs">
        SteerSafe Ecosystem &copy; 2026 • Guardian Oversight Enabled
      </footer>

      {/* Sidebar Navigation Panel (Slide-over Left Sidebar) - Mobile Only */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in" onClick={() => setIsMobileDrawerOpen(false)}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" />

          {/* Left Sidebar Drawer Panel */}
          <div 
            className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200/90 z-10 overflow-hidden animate-in slide-in-from-left duration-200" 
            onClick={e => e.stopPropagation()}
          >
            {/* Sidebar Top Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="shrink-0">
                  <h3 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-display leading-none">
                    SteerSafe
                  </h3>
                  <p className="text-[8px] sm:text-[9px] text-[#EC4899] font-extrabold uppercase tracking-widest leading-none mt-1">Parent Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-600 rounded-xl flex items-center justify-center cursor-pointer transition shadow-2xs"
                title="Close Sidebar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sidebar Navigation List */}
            <div className="p-3 flex-1 overflow-y-auto space-y-1">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Parent Menu</div>
              {[
                { id: 'overview', label: 'Overview', icon: LayoutGrid, desc: 'Student Progress & Drives' },
                { id: 'calendar', label: 'Schedule Calendar', icon: Calendar, desc: 'Upcoming Lessons' },
                { id: 'performance', label: 'Performance', icon: Sparkles, desc: 'Skill Ratings & Scores' },
                { id: 'monitoring', label: 'Guardian Oversight', icon: Shield, desc: 'Safety & Compliance' }
              ].map(tab => {
                const Icon = (tab as any).icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer group ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                        : 'text-slate-700 hover:bg-rose-50/60 hover:text-rose-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{tab.label}</div>
                        <div className={`text-[10px] ${isActive ? 'text-rose-100' : 'text-slate-400'}`}>{tab.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-rose-600'} />
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer User Info & Logout */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 bg-rose-50 text-rose-700 border border-rose-100 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs">
                  {(userProfile.displayName || 'P').slice(0, 1)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold leading-none text-slate-900 truncate">{userProfile.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">Guardian</p>
                </div>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl cursor-pointer transition shrink-0 shadow-2xs"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
