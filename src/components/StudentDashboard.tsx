import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Users,
  MapPin, 
  Sparkles, 
  ChevronRight,
  ChevronDown,
  Info,
  LogOut,
  Car,
  FileText,
  MessageSquare,
  Star,
  Send,
  BarChart2,
  LayoutGrid,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Student, ClassScheduled, Trainer, UserProfile, Cohort, RescheduleRequest, ClassFeedback, AppNotification, TrainerAvailabilitySlot } from '../types';
import { auth, signOut } from '../firebase';
import { getDriveColor, getDriveColorClass } from '../utils/driveStyles';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface StudentDashboardProps {
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
  onUpdatePermitId: (studentId: string, permitId: string) => void;
  onApproveMatch: (studentId: string, partnerId: string) => void;
  onBreakMatch: (studentId: string) => void;
  onRequestReschedule: (req: Omit<RescheduleRequest, 'id' | 'createdAt' | 'status'>) => void;
  onSubmitFeedback: (fb: Omit<ClassFeedback, 'id' | 'createdAt'>) => void;
}

export default function StudentDashboard({ 
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
  onUpdatePermitId,
  onApproveMatch,
  onBreakMatch,
  onRequestReschedule,
  onSubmitFeedback
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'schedule' | 'calendar' | 'performance'>('overview');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [thirdTabId, setThirdTabId] = React.useState<string>('calendar');

  React.useEffect(() => {
    const mainTabs = ['overview', 'schedule'];
    if (!mainTabs.includes(activeTab)) {
      setThirdTabId(activeTab);
    }
  }, [activeTab]);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [permitInput, setPermitInput] = React.useState('');
  const [rescheduleMessage, setRescheduleMessage] = React.useState('');
  const [activeRescheduleId, setActiveRescheduleId] = React.useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = React.useState<{date: string, startTime: string, endTime: string}[]>([
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' }
  ]);
  const [feedbackRating, setFeedbackRating] = React.useState(0);
  const [feedbackComment, setFeedbackComment] = React.useState('');
  const [activeFeedbackId, setActiveFeedbackId] = React.useState<string | null>(null);
  const [selectedCalendarClass, setSelectedCalendarClass] = React.useState<ClassScheduled | null>(null);

  const student = students.find(s => s.id === userProfile.associatedId);
  const myClasses = classes.filter(cls => 
    student && cls.studentNames.includes(student.name)
  ).sort((a, b) => a.date.localeCompare(b.date));

  const uniqueDrives = useMemo(() => {
    const drivesMap = new Map<number, ClassScheduled>();
    myClasses.forEach(cls => {
      if (cls.classNumber >= 1 && cls.classNumber <= 6) {
        drivesMap.set(cls.classNumber, cls);
      }
    });
    return Array.from(drivesMap.values()).sort((a, b) => a.classNumber - b.classNumber);
  }, [myClasses]);

  // Helper to convert 24h to AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const nextClass = myClasses.find(c => new Date(c.date) >= new Date()) || myClasses[1];

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

  // Performance Data Generation
  const performanceData = myClasses
    .filter(cls => new Date(cls.date) < new Date())
    .map((cls, index) => {
      const feedback = classFeedbacks.find(f => f.classId === cls.id && f.studentId === student?.id);
      return {
        session: `Sess ${cls.classNumber}`,
        score: feedback?.rating || 0,
        date: cls.date
      };
    });

  const skillsData = [
    { skill: 'Vehicle Control', value: 85 },
    { skill: 'Traffic Rules', value: 92 },
    { skill: 'Parking', value: 78 },
    { skill: 'Hazard Awareness', value: 88 },
    { skill: 'Confidence', value: 95 }
  ];

  // Calendar Helpers
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
            <Calendar size={16} className="text-indigo-600 sm:w-5 sm:h-5 shrink-0" />
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
                <span className={`text-[11px] font-bold ${isToday ? 'w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center' : 'text-slate-900'}`}>
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
                            {isCompleted && <CheckCircle2 size={8} /> }
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
                <span className={`text-[10px] font-bold ${isToday ? 'w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shadow-2xs' : 'text-slate-800'}`}>
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
            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
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
      
      {/* Top Header - Luxurious glassmorphism visual style (Matching Admin) */}
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
              <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-widest leading-none">Student Portal</p>
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
              <button className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer shadow-xs">
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
                        className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}`}
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
                            <p className={`text-[11px] font-extrabold leading-tight ${!n.read ? 'text-indigo-900' : 'text-slate-900'}`}>{n.title}</p>
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

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase shadow-xs">
                {(userProfile.displayName || 'S').slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none text-slate-900">{student?.name || userProfile.displayName}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Student</p>
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

        {/* Mobile View: Dynamic 3rd Slot + More Dropdown embedded inside sticky header (Admin style) */}
        <div className="sm:hidden border-t border-slate-100/80 px-3 py-1.5 bg-slate-50/90 backdrop-blur-md">
          <div className="bg-[#f0f4ff] p-1 rounded-xl border border-indigo-100/90 flex items-center justify-between shadow-xs">
            {/* Overview Tab */}
            <button
              onClick={() => { setActiveTab('overview'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <LayoutGrid size={14} className={activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Overview</span>
            </button>

            {/* My Schedule Tab */}
            <button
              onClick={() => { setActiveTab('schedule'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Calendar size={14} className={activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Schedule</span>
            </button>

            {/* Dynamic Third Place Tab & More Dropdown */}
            {(() => {
              const allMoreTabs = [
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'performance', label: 'Performance', icon: Sparkles }
              ];

              const currentThirdTab = allMoreTabs.find(t => t.id === thirdTabId) || allMoreTabs[0];
              const ThirdIcon = currentThirdTab.icon;
              const isThirdActive = activeTab === currentThirdTab.id;
              const dropdownTabs = allMoreTabs.filter(t => t.id !== currentThirdTab.id);

              return (
                <>
                  <button
                    onClick={() => { setActiveTab(currentThirdTab.id as any); setIsMoreMenuOpen(false); }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                      isThirdActive
                        ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <ThirdIcon size={14} className={isThirdActive ? 'text-indigo-600' : 'text-slate-500'} />
                    <span className="truncate max-w-[65px]">{currentThirdTab.label}</span>
                  </button>

                  {/* More Dropdown Tab */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="w-full py-1.5 px-1.5 rounded-lg text-xs font-bold border border-transparent flex items-center justify-center gap-1 transition duration-150 cursor-pointer text-slate-600 hover:text-slate-900"
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full flex flex-col gap-4 sm:gap-6 pb-2 sm:pb-6 md:pb-8">

        {/* Desktop View Navigation Bar (Admin Panel Style) */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#f0f4ff] p-1.5 rounded-xl border border-indigo-100/90 shadow-xs overflow-x-auto tab-scroll whitespace-nowrap">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'schedule', label: 'My Schedule', icon: Calendar },
            { id: 'calendar', label: 'Calendar Grid', icon: Calendar },
            { id: 'performance', label: 'Performance', icon: Sparkles }
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
                    layoutId="studentDesktopActiveTabBg"
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
          <div className="bg-amber-50/50 border border-amber-200 p-12 rounded-3xl text-center shadow-xs">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-black text-amber-900 mb-2">Profile Not Linked</h3>
            <p className="text-slate-600 font-medium max-w-md mx-auto">
              Your account is not currently linked to a student record. Please contact administration to synchronize your enrollment data.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {activeTab === 'overview' ? (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Hello, {student.name}!</h2>
                  <p className="text-sm sm:text-slate-500 font-medium mt-1">Manage your upcoming driving sessions and track your progress.</p>
                </div>
              ) : (
                <div className="invisible h-0 md:h-auto md:visible">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h2>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {!student.permitId && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between sm:justify-start gap-3 animate-pulse">
                    <div className="flex items-center gap-3 flex-1 sm:flex-initial">
                      <FileText className="text-amber-600 shrink-0" size={18} />
                      <input 
                        type="text" 
                        placeholder="Enter Permit ID #" 
                        value={permitInput}
                        onChange={(e) => setPermitInput(e.target.value)}
                        className="bg-white border-none text-xs font-bold p-1.5 rounded-lg w-full sm:w-32 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (permitInput) onUpdatePermitId(student.id, permitInput);
                      }}
                      className="bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-amber-700 transition"
                    >
                      Save
                    </button>
                  </div>
                )}
                {student.permitId && (
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <FileText className="text-emerald-600" size={18} />
                    <div>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Permit Verified</p>
                      <p className="text-xs font-bold text-emerald-800">{student.permitId}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <User size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cohort Enrollment</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[150px] sm:max-w-none">{cohort?.name || 'Pending Assignment'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Mobile View: Class Progress & Drive Progress (Compact 2-col cards like Instructor Portal) */}
                    {(() => {
                      const completedDrivesCount = uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length;
                      const totalDrivesNeeded = student.under18 ? 6 : 3;
                      const theoryPct = Math.round((completedTheorySessions / 12) * 100);
                      const drivesPct = Math.round((completedDrivesCount / totalDrivesNeeded) * 100);

                      return (
                        <div className="grid sm:hidden grid-cols-2 gap-2.5">
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

                    {/* Desktop/Tablet View (hidden sm:grid) */}
                    <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Classes Completion Pie Chart */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Class Progress</h3>
                        <div className="h-40 w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Completed', value: completedTheorySessions, color: '#6366f1' },
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
                                <Cell key="cell-0" fill="#6366f1" />
                                <Cell key="cell-1" fill="#f1f5f9" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-900">{completedTheorySessions}/12</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Theory</span>
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
                                  { name: 'Completed', value: uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length, color: '#ec4899' },
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
                                <Cell key="cell-0" fill="#ec4899" />
                                <Cell key="cell-1" fill="#f1f5f9" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-900">{uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length}/{student.under18 ? 6 : 3}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Drives</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{Math.round((uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length / (student.under18 ? 6 : 3)) * 100)}% Complete</p>
                        </div>
                      </div>
                    </div>

                    {/* Next Drive Tile */}
                    {nextClass && (
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Next Drive</h3>
                          <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">
                            Drive #{nextClass.classNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div 
                            style={{ backgroundColor: getDriveColor(nextClass.classNumber, nextClass.isSpecialDrive) }}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                          >
                            <Car size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{nextClass.date}</p>
                            <p className="text-xs font-bold text-slate-500">{formatTime(nextClass.startTime)} - {formatTime(nextClass.endTime)}</p>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                      </div>
                    )}

                    {/* Drive Feedback Section */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Drive Feedback</h3>
                        <button 
                          onClick={() => setActiveTab('performance')}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-4">
                        {myClasses
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
                        {myClasses.filter(cls => classFeedbacks.some(f => f.classId === cls.id)).length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No feedback recorded yet</p>
                          </div>
                        )}
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
                )}
                {activeTab === 'schedule' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">Driving Schedule</h3>
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-full">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.under18 ? 6 : 3} Total Drives</span>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {uniqueDrives.map((cls) => {
                    const sessionDate = new Date(cls.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isCompleted = sessionDate < today;
                    const pendingRequest = rescheduleRequests.find(r => r.classId === cls.id && r.requesterId === student.id && r.status === 'Pending');
                    const driveColor = getDriveColor(cls.classNumber, cls.isSpecialDrive);

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

                            {/* Reschedule Button in Mobile Header */}
                            {!isCompleted && !pendingRequest && (
                              <button 
                                onClick={() => {
                                  setActiveRescheduleId(cls.id);
                                  setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 font-extrabold text-[10px] cursor-pointer active:scale-95 transition"
                              >
                                <MessageSquare size={12} />
                                <span>Reschedule</span>
                              </button>
                            )}
                            {pendingRequest && (
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
                              <span className="flex items-center gap-1 text-slate-500"><User size={12} className="text-slate-400" /> {trainers.find(t => t.id === cls.trainerId)?.name || 'TBA'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop View Card */}
                        <div className="hidden sm:flex p-6 flex-row items-center gap-6 cursor-pointer">
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
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-bold">
                              <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                              <span className="flex items-center gap-1.5"><User size={12} className="text-slate-400" /> Instructor {trainers.find(t => t.id === cls.trainerId)?.name || 'TBA'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end">
                            {!isCompleted && !pendingRequest && (
                              <button 
                                onClick={() => {
                                  setActiveRescheduleId(cls.id);
                                  setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                                }}
                                className="flex items-center justify-center gap-2 p-2.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/50 cursor-pointer transition-all"
                                title="Request Reschedule"
                              >
                                <MessageSquare size={18} />
                              </button>
                            )}
                            {pendingRequest && (
                              <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5">
                                <Clock size={12} />
                                Reschedule Pending
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Feedback Form */}
                        {activeFeedbackId === cls.id && (
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-indigo-50/50 p-3 sm:p-4 rounded-2xl space-y-3 sm:space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Rate your lesson</label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                      key={star}
                                      onClick={() => setFeedbackRating(star)}
                                      className={`p-1 transition-transform hover:scale-125 ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                                    >
                                      <Star size={18} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <textarea 
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="How was your driving experience today? (Optional)"
                                  className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-18"
                                />
                                <button 
                                  onClick={() => {
                                    if (feedbackRating > 0) {
                                      onSubmitFeedback({
                                        classId: cls.id,
                                        studentId: student.id,
                                        studentName: student.name,
                                        rating: feedbackRating,
                                        comment: feedbackComment
                                      });
                                      setFeedbackRating(0);
                                      setFeedbackComment('');
                                      setActiveFeedbackId(null);
                                    }
                                  }}
                                  className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
                                >
                                  Submit Feedback
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                    {/* Theory Sessions Module */}
                    <div className="mt-8 sm:mt-12 space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">Theory Sessions</h3>
                        <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                          12 Total Modules
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                        {[...Array(12)].map((_, i) => {
                          const sessionNum = i + 1;
                          const isCompleted = sessionNum <= completedTheorySessions;
                          
                          return (
                            <div 
                              key={i} 
                              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                                isCompleted 
                                  ? 'bg-slate-50 border-slate-100 grayscale-[0.5]' 
                                  : 'bg-white border-indigo-100 shadow-2xs sm:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs ${
                                  isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                }`}>
                                  M{sessionNum}
                                </div>
                                {isCompleted ? (
                                  <div className="bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-2xs">
                                    <CheckCircle2 size={11} />
                                  </div>
                                ) : (
                                  <div className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase">
                                    Next
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={`text-xs font-black ${isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>Module {sessionNum}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">Theory Classroom</p>
                              </div>
                              {!isCompleted && (
                                <div className="mt-2.5 pt-2 sm:mt-3 sm:pt-3 border-t border-indigo-50 flex items-center justify-between">
                                  <span className="text-[8px] sm:text-[9px] font-black text-indigo-600 uppercase">Scheduled</span>
                                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 truncate max-w-[65px]">In Cohort</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'calendar' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900">Session Calendar</h3>
                    {renderCalendar()}
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Training Performance</h3>
                      {hasRecommendation && (
                        <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-2 animate-pulse">
                          <AlertCircle size={14} className="shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Recommendation Issued</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Charts (Pie Charts) */}
                    {(() => {
                      const completedDrivesCount = uniqueDrives.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length;
                      const totalDrivesNeeded = student.under18 ? 6 : 3;
                      const theoryPct = Math.round((completedTheorySessions / 12) * 100);
                      const drivesPct = Math.round((completedDrivesCount / totalDrivesNeeded) * 100);

                      return (
                        <>
                          {/* Mobile View: Class Progress & Drive Progress (Compact 2-col cards like Overview) */}
                          <div className="grid sm:hidden grid-cols-2 gap-2.5">
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

                          {/* Desktop/Tablet View (hidden sm:grid) */}
                          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Class Progress</h3>
                              <div className="h-40 w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Completed', value: completedTheorySessions, color: '#6366f1' },
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
                                      <Cell key="cell-0" fill="#6366f1" />
                                      <Cell key="cell-1" fill="#f1f5f9" />
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                  <span className="text-xl font-black text-slate-900">{completedTheorySessions}/12</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Theory</span>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">{Math.round((completedTheorySessions / 12) * 100)}% Complete</p>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Drive Progress</h3>
                              <div className="h-40 w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Completed', value: completedDrivesCount, color: '#ec4899' },
                                        { name: 'Remaining', value: Math.max(0, totalDrivesNeeded - completedDrivesCount), color: '#f1f5f9' }
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
                                      <Cell key="cell-0" fill="#ec4899" />
                                      <Cell key="cell-1" fill="#f1f5f9" />
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                  <span className="text-xl font-black text-slate-900">{completedDrivesCount}/{totalDrivesNeeded}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Behind the Wheel</span>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">{Math.round((completedDrivesCount / totalDrivesNeeded) * 100)}% Complete</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {hasRecommendation && (
                      <div className="p-6 bg-rose-50 rounded-3xl border-2 border-rose-200 border-dashed">
                        <h5 className="text-sm font-black text-rose-900 mb-2">Notice for Candidates & Guardians</h5>
                        <p className="text-xs font-bold text-rose-800 leading-relaxed">
                          Based on cumulative performance data across your primary drive sequence (Score: {totalSkillsScore}/252), 
                          we <span className="underline decoration-2 text-rose-600">Recommend Additional Parent and Instructor Drive for 1-2 hours</span> to reach certification proficiency.
                        </p>
                      </div>
                    )}

                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-xs sm:shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-8">Detailed Instructor Observations</h4>
                      <div className="space-y-3.5 sm:space-y-6">
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
                                <div className="flex flex-col md:flex-row gap-3 sm:gap-6">
                                  <div className="shrink-0 flex flex-row md:flex-col items-center gap-2.5 sm:gap-3 border-b md:border-b-0 border-slate-200/60 pb-2.5 md:pb-0">
                                    <div 
                                      style={{ backgroundColor: driveColor }}
                                      className="w-10 h-10 sm:w-12 sm:h-12 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shadow-md shrink-0"
                                    >
                                      {cls.isSpecialDrive ? 'S' : `#${cls.classNumber}`}
                                    </div>
                                    <div className="text-left md:text-center flex-1 md:flex-none">
                                      <p className="text-xs sm:text-[10px] font-black text-slate-800 sm:text-slate-400 uppercase tracking-wider sm:tracking-widest">
                                        {(() => {
                                          const d = cls.date ? new Date(cls.date) : null;
                                          return d && !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : (cls.date || 'TBA');
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 space-y-3 sm:space-y-6">
                                    {feedback ? (
                                      <>
                                        <div className="space-y-2.5 sm:space-y-4">
                                          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs sm:shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between">
                                            <div className="space-y-1.5 sm:space-y-3 flex-1">
                                              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 sm:pb-2">Skill Rating Key</p>
                                              <div className="flex flex-wrap gap-2.5 sm:gap-4">
                                                <div className="flex items-center gap-1">
                                                  <div className="flex gap-0.5"><Star size={9} className="text-indigo-600 fill-current" /></div>
                                                  <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tight">Needs Improvement</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <div className="flex gap-0.5"><Star size={9} className="text-indigo-600 fill-current" /><Star size={9} className="text-indigo-600 fill-current" /></div>
                                                  <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tight">Basic</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <div className="flex gap-0.5"><Star size={9} className="text-indigo-600 fill-current" /><Star size={9} className="text-indigo-600 fill-current" /><Star size={9} className="text-indigo-600 fill-current" /></div>
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
                                                    <Star key={s} size={10} className={s <= (score as number) ? 'text-indigo-600 fill-current' : 'text-slate-100'} />
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
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase">Instructor is currently processing this session's review</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        
                        {myClasses.filter(cls => classFeedbacks.some(f => f.classId === cls.id && f.studentId === student?.id)).length === 0 && (
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
                        <div className="mt-4 sm:mt-8 flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-sm sm:text-xl shrink-0">🎓</div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Lead Instructor</p>
                            <p className="text-xs sm:text-sm font-bold">Certification Board</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl -mr-32 -mt-32 sm:-mr-48 sm:-mt-48" />
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Program Summary */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Program Pulse</h3>
                
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3.5 sm:space-y-8 relative overflow-hidden">
                  {partner && (
                    <div className="space-y-2 sm:space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={12} /> Driving Partner
                      </p>
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base sm:text-lg shadow-inner shrink-0">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{partner.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{partner.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Class Tile */}
                  <div className="space-y-2 sm:space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Next Class Session
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden">
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
                          <BookOpen size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Module {completedTheorySessions + 1}</p>
                          <p className="text-[9px] sm:text-[10px] font-bold text-indigo-600">{cohort?.startDate ? format(new Date(cohort.startDate), 'MMM d, yyyy') : 'TBA'}</p>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200/20 rounded-full blur-xl -mr-8 -mt-8" />
                    </div>
                  </div>

                  <div className="pt-1 sm:pt-2">
                    <div className="bg-indigo-600 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-indigo-200 text-white group cursor-pointer relative overflow-hidden">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Need Help?</p>
                          <p className="text-xs font-black">Contact Office</p>
                        </div>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform sm:w-5 sm:h-5" />
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    </div>
                  </div>
                </div>

                {/* Communication Hub in Sidebar */}
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Communication Hub</h3>
                  </div>

                  {/* Parents Contact */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Parents</p>
                    {student.parentEmail ? (
                      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{student.parentEmail}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Primary Guardian</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <a href={`mailto:${student.parentEmail}`} className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition shadow-xs">
                            <Mail size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No parent email listed</p>
                    )}
                  </div>

                  {/* Partner Contact */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driving Partner</p>
                    {partner ? (
                      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{partner.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{partner.phone || 'No phone listed'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {partner.phone && (
                            <a href={`tel:${partner.phone}`} className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition shadow-xs">
                              <Phone size={12} />
                            </a>
                          )}
                          <a href={`mailto:${partner.email || ''}`} className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition shadow-xs">
                            <Mail size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[10px] text-slate-400 italic text-center">No partner assigned</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                            <div className="space-y-6">
                              <p className="text-xs sm:text-sm text-emerald-800 font-medium italic leading-relaxed bg-white/50 p-4 rounded-2xl border border-emerald-100/50">"{feedback.comment}"</p>
                              
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Skill Evaluation</h4>
                                  <div className="flex gap-2">
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-200" /><span className="text-[7px] font-bold text-emerald-600 uppercase">1 Imp.</span></div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[7px] font-bold text-emerald-600 uppercase">2 Basic</span></div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /><span className="text-[7px] font-bold text-emerald-600 uppercase">3 Consist.</span></div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {feedback.skills && Object.entries(feedback.skills).map(([key, score]) => (
                                    <div key={key} className="flex items-center justify-between p-2.5 bg-white/40 rounded-xl border border-emerald-100/30">
                                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <div className="flex gap-1">
                                        {[1, 2, 3].map(s => (
                                          <Star key={s} size={12} className={s <= (score as number) ? 'text-emerald-600 fill-current' : 'text-emerald-100'} />
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-emerald-100/50">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Instructor Intervention: <span className="text-amber-900 ml-1">{feedback.interventionMetric || 'Steering/Brake'}</span></h4>
                                </div>
                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex gap-1.5">
                                      {[1, 2, 3].map(s => (
                                        <Star key={s} size={16} className={s <= (feedback!.intervention || 0) ? 'text-amber-500 fill-current' : 'text-slate-200'} />
                                      ))}
                                    </div>
                                    <span className="text-[9px] font-black text-amber-600 bg-white px-2 py-1 rounded-lg border border-amber-100 shadow-sm uppercase tracking-widest">
                                      {feedback.intervention === 1 ? 'Constant' : feedback.intervention === 2 ? 'Minimal' : 'None'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
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
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-lg"
                    >
                      View Detailed Performance
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                      <Clock size={18} className="text-amber-600" />
                      <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Upcoming Session</span>
                    </div>

                    <button 
                      onClick={() => {
                        setActiveRescheduleId(selectedCalendarClass.id);
                        setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                      }}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition shadow-lg shadow-rose-200"
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

      {/* Student Reschedule Modal */}
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
                  if (validSlots.length === 3 && student) {
                    onRequestReschedule({
                      classId: activeRescheduleId!,
                      requesterId: student.id,
                      requesterName: student.name,
                      requesterRole: 'Student',
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
            activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'overview' && (
            <motion.div
              layoutId="studentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <LayoutGrid size={18} className={activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'schedule' && (
            <motion.div
              layoutId="studentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Clock size={18} className={activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'calendar' && (
            <motion.div
              layoutId="studentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Calendar size={18} className={activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'performance' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'performance' && (
            <motion.div
              layoutId="studentMobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Sparkles size={18} className={activeTab === 'performance' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Performance</span>
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
        SteerSafe Ecosystem &copy; 2026 • Precision Candidate Link Enabled
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
                  <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-widest leading-none mt-1">Student Portal</p>
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
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Student Menu</div>
              {[
                { id: 'overview', label: 'Overview', icon: LayoutGrid, desc: 'Dashboard & Progress' },
                { id: 'schedule', label: 'My Schedule', icon: Calendar, desc: 'Scheduled Drives' },
                { id: 'calendar', label: 'Calendar Grid', icon: Calendar, desc: 'Monthly Schedule' },
                { id: 'performance', label: 'Performance', icon: Sparkles, desc: 'Ratings & Feedback' }
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                        : 'text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{tab.label}</div>
                        <div className={`text-[10px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{tab.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'} />
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer User Info & Logout */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs">
                  {(userProfile.displayName || 'S').slice(0, 1)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold leading-none text-slate-900 truncate">{student?.name || userProfile.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">Student</p>
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
