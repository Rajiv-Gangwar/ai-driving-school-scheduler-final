import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  Users, 
  Clock, 
  GraduationCap, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  User, 
  MessageSquare,
  Star,
  Send,
  ChevronRight,
  Search,
  Car,
  ChevronLeft,
  LayoutGrid,
  FileText,
  List,
  Filter,
  CheckCircle,
  Plus,
  X,
  PieChart as PieChartIcon,
  AlertCircle,
  Info,
  Menu,
  LogOut,
  ChevronDown,
  Bell,
  Check,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  subMonths,
  isToday
} from 'date-fns';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Trainer, 
  ClassScheduled, 
  Student, 
  Location, 
  School, 
  Cohort, 
  UserProfile,
  TrainerAvailabilitySlot,
  RescheduleRequest,
  ClassFeedback,
  AppNotification
} from '../types';
import TrainerCalendarView from './TrainerCalendarView';
import TrainerAvailabilityCalendar from './TrainerAvailabilityCalendar';
import Scheduling from './Scheduling';
import { auth, signOut } from '../firebase';
import { getDriveColor, getDriveColorClass } from '../utils/driveStyles';

interface InstructorDashboardProps {
  userProfile: UserProfile;
  trainers: Trainer[];
  cohorts: Cohort[];
  students: Student[];
  classes: ClassScheduled[];
  slots: TrainerAvailabilitySlot[];
  locations: Location[];
  schools: School[];
  rescheduleRequests: RescheduleRequest[];
  classFeedbacks: ClassFeedback[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onAddSlots: (newSlots: TrainerAvailabilitySlot[]) => void;
  onUpdateSlotStatus: (slotId: string, status: 'Open' | 'Booked' | 'Unavailable') => void;
  onDeleteSlot: (slotId: string) => void;
  onRequestReschedule: (req: Omit<RescheduleRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateClass: (updated: ClassScheduled) => void;
  onSubmitFeedback: (feedback: Omit<ClassFeedback, 'id' | 'createdAt'>) => void;
  onUpdateClasses: (updatedClasses: ClassScheduled[]) => void;
  onDeleteClass: (id: string) => void;
  onUpdateSlots: (updatedSlots: TrainerAvailabilitySlot[]) => void;
  onAddClasses: (newClasses: ClassScheduled[]) => void;
  onConfirmAllProposed: () => void;
}

export default function InstructorDashboard({
  userProfile,
  trainers,
  cohorts,
  students,
  classes,
  slots,
  locations,
  schools,
  rescheduleRequests,
  classFeedbacks,
  notifications,
  onMarkNotificationRead,
  onAddSlots,
  onUpdateSlotStatus,
  onDeleteSlot,
  onRequestReschedule,
  onUpdateClass,
  onSubmitFeedback,
  onUpdateClasses,
  onDeleteClass,
  onUpdateSlots,
  onAddClasses,
  onConfirmAllProposed
}: InstructorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'calendar' | 'performance' | 'programs' | 'availability' | 'candidates' | 'scheduling'>('overview');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [thirdTabId, setThirdTabId] = useState<string>('calendar');

  React.useEffect(() => {
    const mainTabs = ['overview', 'schedule'];
    if (!mainTabs.includes(activeTab)) {
      setThirdTabId(activeTab);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);
  const [selectedDriveForDetail, setSelectedDriveForDetail] = useState<string | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);
  const [activeCohortId, setActiveCohortId] = useState<string>(cohorts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<{date: string, startTime: string, endTime: string}[]>([
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' },
    { date: '', startTime: '', endTime: '' }
  ]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackClassId, setFeedbackClassId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackStudentId, setFeedbackStudentId] = useState<string | null>(null);
  const [feedbackSkills, setFeedbackSkills] = useState({
    instruments: 3,
    starts: 3,
    stops: 3,
    leftTurns: 3,
    rightTurns: 3,
    signs: 3,
    lanePositioning: 3,
    intersections: 3,
    awareness: 3,
    space: 3,
    speed: 3,
    rules: 3,
    parking: 3,
    laneChanging: 3,
  });
  const [feedbackIntervention, setFeedbackIntervention] = useState(3);
  const [feedbackInterventionMetric, setFeedbackInterventionMetric] = useState('Steering Wheel');
  const [markAsComplete, setMarkAsComplete] = useState(true);

  // Selected day for mobile calendar view
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date>(new Date());

  // Add Drive Modal State
  const [isAddDriveModalOpen, setIsAddDriveModalOpen] = useState(false);
  const [isAddDriveCohortDropdownOpen, setIsAddDriveCohortDropdownOpen] = useState(false);
  const [newDriveDate, setNewDriveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newDriveStartTime, setNewDriveStartTime] = useState('09:00');
  const [newDriveEndTime, setNewDriveEndTime] = useState('11:00');
  const [newDriveCohortId, setNewDriveCohortId] = useState('');
  const [newDriveStudentIds, setNewDriveStudentIds] = useState<string[]>([]);
  const [newDriveClassNumber, setNewDriveClassNumber] = useState(1);
  const [newDriveIsSpecial, setNewDriveIsSpecial] = useState(false);

  // Tag-along State
  const [isTagAlongMode, setIsTagAlongMode] = useState(false);
  const [activeTagAlongClassId, setActiveTagAlongClassId] = useState<string | null>(null);

  // Performance Filters
  const [perfFilterStudent, setPerfFilterStudent] = useState<string>('all');
  const [perfFilterCohort, setPerfFilterCohort] = useState<string>('all');
  const [perfFilterClassNum, setPerfFilterClassNum] = useState<string>('all');
  const [isPerfCohortDropdownOpen, setIsPerfCohortDropdownOpen] = useState(false);
  const [isPerfStudentDropdownOpen, setIsPerfStudentDropdownOpen] = useState(false);
  const [isPerfClassNumDropdownOpen, setIsPerfClassNumDropdownOpen] = useState(false);

  // Availability Filters
  const [isDefineCohortDropdownOpen, setIsDefineCohortDropdownOpen] = useState(false);

  // Schedule Filters
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'lead' | 'tag'>('all');
  const [scheduleCohortFilter, setScheduleCohortFilter] = useState<string>('all');
  const [isScheduleCohortDropdownOpen, setIsScheduleCohortDropdownOpen] = useState(false);
  const [chartsCohortFilter, setChartsCohortFilter] = useState<string>('all');

  const [candidatesCohortFilter, setCandidatesCohortFilter] = useState<string>('all');
  const [isCandidatesCohortDropdownOpen, setIsCandidatesCohortDropdownOpen] = useState(false);

  const instructor = trainers.find(t => t.id === userProfile.associatedId);
  
  // Filter cohorts assigned to this instructor
  const assignedCohorts = useMemo(() => {
    return cohorts.filter(c => instructor && c.assignedTrainers.includes(instructor.id));
  }, [cohorts, instructor]);

  const studentDetailScore = useMemo(() => {
    if (!selectedStudentForDetail) return 0;
    return classFeedbacks
      .filter(f => f.studentId === selectedStudentForDetail)
      .reduce((acc, f) => acc + (f.skills ? Object.values(f.skills).reduce((a, b) => a + (b || 0), 0) : 0), 0);
  }, [selectedStudentForDetail, classFeedbacks]);

  const hasDetailRecommendation = studentDetailScore < 152 && classFeedbacks.filter(f => f.studentId === selectedStudentForDetail).length >= 6;

  // Filter students in lead assigned cohorts OR cohorts where I am a tag-along for at least one session
  const assignedStudents = useMemo(() => {
    const leadCohortIds = new Set(assignedCohorts.map(c => c.id));
    const tagAlongCohortIds = new Set(classes.filter(c => c.tagAlongTrainerId === instructor?.id).map(c => c.cohortId));
    return students.filter(s => leadCohortIds.has(s.cohortId) || tagAlongCohortIds.has(s.cohortId));
  }, [students, assignedCohorts, classes, instructor]);

  // Stats
  const stats = {
    partners: assignedStudents.filter(s => s.existingPartnerId).length,
    tagAlongSessions: classes.filter(c => c.tagAlongTrainerId === instructor?.id).length,
  };

  // Chart Calculations
  const chartData = useMemo(() => {
    let filteredClasses = classes.filter(c => c.trainerId === instructor?.id);
    if (chartsCohortFilter !== 'all') {
      filteredClasses = filteredClasses.filter(c => c.cohortId === chartsCohortFilter);
    }

    const totalClasses = filteredClasses.length;
    const completedClasses = filteredClasses.filter(c => c.status === 'Completed' || new Date(c.date) < new Date()).length;
    const classesCompletionPct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

    const drivesWithFeedback = filteredClasses.filter(c => classFeedbacks.some(f => f.classId === c.id)).length;
    const drivesCompletionPct = totalClasses > 0 ? Math.round((drivesWithFeedback / totalClasses) * 100) : 0;

    return {
      classesCompletion: { pct: classesCompletionPct, completed: completedClasses, total: totalClasses },
      drivesCompletion: { pct: drivesCompletionPct, completed: drivesWithFeedback, total: totalClasses }
    };
  }, [classes, classFeedbacks, instructor, chartsCohortFilter]);

  const openFeedbackModal = (classId: string, studentId?: string) => {
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      const classStudents = students.filter(s => cls.studentNames.includes(s.name));
      setFeedbackClassId(classId);
      setFeedbackStudentId(studentId || classStudents[0]?.id || null);
      setIsFeedbackModalOpen(true);
    }
  };

  const filteredFeedback = useMemo(() => {
    const assignedStudentIds = new Set(assignedStudents.map(s => s.id));
    return classFeedbacks.filter(f => {
      // Only show feedback for students this instructor is associated with
      if (!assignedStudentIds.has(f.studentId)) return false;

      const studentMatch = perfFilterStudent === 'all' || f.studentId === perfFilterStudent;
      
      const cls = classes.find(c => c.id === f.classId);
      const classMatch = perfFilterClassNum === 'all' || (cls && cls.classNumber.toString() === perfFilterClassNum);
      
      const student = students.find(s => s.id === f.studentId);
      const cohortMatch = perfFilterCohort === 'all' || (student && student.cohortId === perfFilterCohort);
      
      return studentMatch && classMatch && cohortMatch;
    });
  }, [classFeedbacks, assignedStudents, perfFilterStudent, perfFilterClassNum, perfFilterCohort, classes, students]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'performance', label: 'Progress', icon: BarChart2 },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'candidates', label: 'Students', icon: Users }
  ];

  const myClasses = useMemo(() => {
    // Both sessions I am the lead trainer OR the tag-along trainer
    let filtered = classes.filter(cls => cls.trainerId === instructor?.id || cls.tagAlongTrainerId === instructor?.id);
    
    if (scheduleFilter === 'lead') {
      filtered = filtered.filter(c => c.trainerId === instructor?.id);
    } else if (scheduleFilter === 'tag') {
      filtered = filtered.filter(c => c.tagAlongTrainerId === instructor?.id);
    }

    if (scheduleCohortFilter !== 'all') {
      filtered = filtered.filter(c => c.cohortId === scheduleCohortFilter);
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }, [classes, instructor, scheduleFilter, scheduleCohortFilter]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddTagAlong = (classId: string, trainerId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      onUpdateClass({ ...cls, tagAlongTrainerId: trainerId });
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
        {/* Calendar Header */}
        <div className="p-4 sm:p-8 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-md">
                <Calendar size={20} className="text-indigo-400 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Training Schedule</p>
              </div>
            </div>

            {/* Mobile Month Navigation */}
            <div className="flex sm:hidden items-center gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-300">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-300">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button 
              onClick={() => {
                setNewDriveDate(format(selectedCalendarDay || new Date(), 'yyyy-MM-dd'));
                setNewDriveCohortId(assignedCohorts[0]?.id || '');
                setNewDriveStudentIds([]);
                setIsAddDriveModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/20 sm:mr-4 cursor-pointer"
            >
              <Plus size={14} /> Add Drive
            </button>
            <div className="hidden sm:flex gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {daysOfWeek.map(day => (
            <div key={day} className="py-2.5 sm:py-4 text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="sm:hidden">{day.charAt(0)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayClasses = myClasses.filter(c => isSameDay(new Date(c.date), day));
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const isSelectedDay = isSameDay(day, selectedCalendarDay);

            return (
              <div 
                key={day.toString()} 
                onClick={() => {
                  setSelectedCalendarDay(day);
                }}
                className={`min-h-[52px] sm:min-h-[140px] p-1 sm:p-2 border-r border-b border-slate-100 transition-colors cursor-pointer hover:bg-indigo-50/30 ${
                  !isSelectedMonth ? 'bg-slate-50/30' : 'bg-white'
                } ${isTodayDate ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''} ${
                  isSelectedDay ? 'bg-indigo-50/60 sm:bg-white' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-0.5 sm:mb-2">
                  <span className={`text-[9px] sm:text-[10px] font-black ${
                    isSelectedMonth ? 'text-slate-900' : 'text-slate-300'
                  } ${isTodayDate ? 'bg-indigo-600 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px]' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {/* Mobile badge count */}
                  {dayClasses.length > 0 && (
                    <span className="sm:hidden text-[7px] font-black px-1 py-0.5 rounded-md bg-indigo-600 text-white leading-none">
                      {dayClasses.length}
                    </span>
                  )}
                </div>

                {/* Mobile View: Compact Indicators */}
                <div className="sm:hidden flex flex-col gap-0.5 mt-0.5">
                  {dayClasses.slice(0, 2).map(cls => (
                    <div 
                      key={cls.id}
                      style={{ backgroundColor: getDriveColor(cls.classNumber, cls.isSpecialDrive) }}
                      className="h-1.5 rounded-full w-full opacity-90"
                      title={`${cls.startTime} - ${cls.studentNames}`}
                    />
                  ))}
                  {dayClasses.length > 2 && (
                    <span className="text-[7px] font-black text-slate-400 text-center leading-none">
                      +{dayClasses.length - 2}
                    </span>
                  )}
                </div>

                {/* Desktop View: Full detailed cards */}
                <div className="hidden sm:block space-y-1">
                  {dayClasses.map(cls => (
                    <div 
                      key={cls.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDriveForDetail(cls.id);
                        setActiveTab('overview');
                      }}
                      className={`p-1.5 rounded-lg text-[9px] font-bold truncate border shadow-xs cursor-pointer hover:scale-[1.05] transition-transform ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)}`}
                      title={`${cls.startTime} - ${cls.studentNames} (${cls.isSpecialDrive ? 'Special' : `Lesson ${cls.classNumber}`})`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 opacity-80">
                          <Clock size={8} />
                          {cls.startTime}
                        </div>
                        <span className="text-[7px] font-black uppercase opacity-60">
                          {cls.isSpecialDrive ? 'S' : `#${cls.classNumber}`}
                        </span>
                      </div>
                      <div className="truncate flex items-center gap-1">
                        {cls.tagAlongTrainerId === instructor?.id && <Users size={8} className="shrink-0" />}
                        {cls.studentNames.split('&')[0]}
                      </div>
                      {cls.tagAlongTrainerId === instructor?.id && (
                        <div className="mt-0.5 pt-0.5 border-t border-emerald-200 text-[8px] italic">Tag-along Role</div>
                      )}
                      {isSameDay(new Date(cls.date), day) && new Date(cls.date) < new Date() && cls.trainerId === instructor?.id && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openFeedbackModal(cls.id);
                          }}
                          className="mt-1 w-full flex items-center justify-center gap-1 py-1 rounded bg-white/50 hover:bg-white text-[7px] font-black uppercase tracking-tighter transition-colors border border-indigo-100"
                        >
                          <Star size={8} className="fill-indigo-600 text-indigo-600" />
                          Rate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View: Selected Day Schedule Card List */}
        <div className="sm:hidden border-t border-slate-200 bg-slate-50/80 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-indigo-600" />
              <h4 className="text-xs font-black text-slate-900">
                {format(selectedCalendarDay, 'EEE, MMM d, yyyy')}
              </h4>
            </div>
            <button
              onClick={() => {
                setNewDriveDate(format(selectedCalendarDay, 'yyyy-MM-dd'));
                setNewDriveCohortId(assignedCohorts[0]?.id || '');
                setNewDriveStudentIds([]);
                setIsAddDriveModalOpen(true);
              }}
              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {(() => {
            const selectedDayClasses = myClasses.filter(c => isSameDay(new Date(c.date), selectedCalendarDay));
            if (selectedDayClasses.length === 0) {
              return (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center text-slate-400 text-xs font-bold">
                  No drives scheduled for this date.
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {selectedDayClasses.map(cls => {
                  const isLead = cls.trainerId === instructor?.id;
                  const isCompleted = cls.status === 'Completed' || new Date(cls.date) < new Date();
                  const cohortName = cohorts.find(c => c.id === cls.cohortId)?.name || 'Cohort';

                  return (
                    <div key={cls.id} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            style={{ backgroundColor: getDriveColor(cls.classNumber, cls.isSpecialDrive) }}
                            className="w-8 h-8 rounded-lg flex flex-col items-center justify-center text-white shrink-0 shadow-xs"
                          >
                            <span className="text-[6px] font-black uppercase opacity-80">{cls.isSpecialDrive ? 'S' : (isLead ? 'Lead' : 'Tag')}</span>
                            <span className="text-xs font-black leading-none">{cls.isSpecialDrive ? 'S' : cls.classNumber}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{cls.studentNames}</p>
                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Clock size={10} className="text-slate-400 shrink-0" /> {cls.startTime} - {cls.endTime} • {cohortName}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDriveForDetail(cls.id);
                            setActiveTab('overview');
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase shrink-0 border border-indigo-100 cursor-pointer"
                        >
                          View
                        </button>
                      </div>

                      {isCompleted && isLead && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400">Student Rating</span>
                          <button
                            onClick={() => openFeedbackModal(cls.id)}
                            className="flex items-center gap-1 text-[8px] font-black uppercase text-white bg-indigo-600 px-2 py-0.5 rounded-md cursor-pointer"
                          >
                            <Star size={8} /> Rate Student
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-display leading-tight">
                SteerSafe
              </h1>
              <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-wider leading-tight">
                Certified<br className="sm:hidden" /> Instructor Portal
              </p>
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
                            {n.type === 'Success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
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

            {/* Status indicator badge - hidden on very small screens */}
            <div className="hidden xs:flex text-[9px] sm:text-[10px] uppercase tracking-wider font-black px-2 sm:px-3 py-1.5 rounded-lg border bg-emerald-50/80 text-emerald-800 border-emerald-200/60 shadow-xs items-center gap-2">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="hidden sm:inline">Instructor Connected</span>
              <span className="sm:hidden">Online</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase shadow-xs">
                {(userProfile.displayName || 'C').slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none text-slate-900">{instructor?.name || userProfile.displayName}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{userProfile.role}</p>
              </div>
              {/* Mobile: Logout Icon Only */}
              <button
                onClick={handleLogout}
                className="md:hidden p-2 text-slate-500 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl cursor-pointer transition flex items-center justify-center shadow-2xs"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
              {/* Desktop Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden md:block text-[9px] sm:text-[10px] text-slate-600 hover:text-red-650 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Header Sub-nav tabs (Admin style) */}
        <div className="sm:hidden border-t border-slate-100/80 px-3 py-1.5 bg-slate-50/90 backdrop-blur-md">
          <div className="bg-[#f0f4ff] p-1 rounded-xl border border-indigo-100/90 flex items-center justify-between shadow-xs">
            {/* Overview Tab */}
            <button
              type="button"
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

            {/* Schedule Tab */}
            <button
              type="button"
              onClick={() => { setActiveTab('schedule'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Clock size={14} className={activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Schedule</span>
            </button>

            {/* Dynamic Third Place Tab & More Dropdown */}
            {(() => {
              const allMoreTabs = [
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'performance', label: 'Progress', icon: BarChart2 },
                { id: 'availability', label: 'Availability', icon: Calendar },
                { id: 'candidates', label: 'Students', icon: Users },
              ];

              const currentThirdTab = allMoreTabs.find(t => t.id === thirdTabId) || allMoreTabs[0];
              const ThirdIcon = currentThirdTab.icon;
              const isThirdActive = activeTab === currentThirdTab.id;
              const dropdownTabs = allMoreTabs.filter(t => t.id !== currentThirdTab.id);

              return (
                <>
                  <button
                    type="button"
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
                      type="button"
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
                                type="button"
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full flex flex-col gap-4 sm:gap-6 pb-2 sm:pb-6">

        {/* Main Navigation Bar - Visible on Desktop (Admin Panel Style) */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#f0f4ff] p-1.5 rounded-xl border border-indigo-100/90 shadow-xs overflow-x-auto tab-scroll whitespace-nowrap">
          {menuItems.map(tab => {
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
                    layoutId="instructorNavActiveTabBg"
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

        {/* Tab workspaces render */}
        <div className="flex-1 min-h-0">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dynamic Stats Row - Mobile Redesigned (sm:hidden) */}
              <div className="block sm:hidden space-y-2.5">
                {/* Top Row: Today's Sessions & Pending Feedback */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Today's Sessions */}
                  <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 p-3.5 rounded-2xl border border-indigo-100/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group active:scale-98 transition">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider leading-snug">Today's Sessions</span>
                      <div className="w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar size={14} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          {classes.filter(c => c.trainerId === instructor?.id && c.date === format(new Date(), 'yyyy-MM-dd')).length}
                        </span>
                        <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Feedback */}
                  <div className="bg-gradient-to-br from-pink-50/90 via-white to-slate-50/80 p-3.5 rounded-2xl border border-pink-100/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group active:scale-98 transition">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] font-extrabold text-pink-950 uppercase tracking-wider leading-snug">Pending Feedback</span>
                      <div className="w-7 h-7 bg-pink-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                        <Star size={14} />
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const count = classes.filter(c => {
                          const isPast = new Date(c.date) < new Date();
                          const hasFeedback = classFeedbacks.some(f => f.classId === c.id);
                          return c.trainerId === instructor?.id && isPast && !hasFeedback;
                        }).length;
                        return (
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{count}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0 ${
                              count > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {count > 0 ? 'Pending' : 'Done'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Classes & Drives Completion Progress */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Classes Completion */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-2">
                    <div>
                      <div className="mb-1">
                        <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider leading-tight block">Classes Completion</span>
                      </div>
                      <select 
                        value={chartsCohortFilter}
                        onChange={(e) => setChartsCohortFilter(e.target.value)}
                        className="w-full text-[9px] font-black uppercase text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100 outline-none cursor-pointer truncate"
                      >
                        <option value="all">Overall Cohorts</option>
                        {assignedCohorts.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="w-9 h-9 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ value: chartData.classesCompletion.pct }, { value: Math.max(0, 100 - chartData.classesCompletion.pct) }]}
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
                        <p className="text-sm font-black text-slate-900 leading-tight">{chartData.classesCompletion.pct}% Avg</p>
                        <p className="text-[9px] text-slate-400 font-bold truncate">{chartData.classesCompletion.completed}/{chartData.classesCompletion.total} Done</p>
                      </div>
                    </div>
                  </div>

                  {/* Drives Completion */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-2">
                    <div>
                      <div className="mb-1">
                        <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider leading-tight block">Drives Completion</span>
                      </div>
                      <select 
                        value={chartsCohortFilter}
                        onChange={(e) => setChartsCohortFilter(e.target.value)}
                        className="w-full text-[9px] font-black uppercase text-pink-600 bg-pink-50/80 px-2 py-0.5 rounded-md border border-pink-100 outline-none cursor-pointer truncate"
                      >
                        <option value="all">Overall Cohorts</option>
                        {assignedCohorts.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="w-9 h-9 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ value: chartData.drivesCompletion.pct }, { value: Math.max(0, 100 - chartData.drivesCompletion.pct) }]}
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
                        <p className="text-sm font-black text-slate-900 leading-tight">{chartData.drivesCompletion.pct}% Avg</p>
                        <p className="text-[9px] text-slate-400 font-bold truncate">{chartData.drivesCompletion.completed}/{chartData.drivesCompletion.total} Rated</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Row - Desktop/Tablet Original View (hidden sm:grid) */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Sessions</p>
                    <p className="text-2xl font-black text-slate-900">
                      {classes.filter(c => c.trainerId === instructor?.id && c.date === format(new Date(), 'yyyy-MM-dd')).length}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center">
                    <Star size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Feedback</p>
                    <p className="text-2xl font-black text-slate-900">
                      {classes.filter(c => {
                        const isPast = new Date(c.date) < new Date();
                        const hasFeedback = classFeedbacks.some(f => f.classId === c.id);
                        return c.trainerId === instructor?.id && isPast && !hasFeedback;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Pie Chart: Classes Progress */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Classes Completion</p>
                    <select 
                      value={chartsCohortFilter}
                      onChange={(e) => setChartsCohortFilter(e.target.value)}
                      className="text-[9px] font-black uppercase tracking-wider bg-slate-50 border-none outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Overall</option>
                      {assignedCohorts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: chartData.classesCompletion.pct }, { value: 100 - chartData.classesCompletion.pct }]}
                            innerRadius={20}
                            outerRadius={30}
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
                    <div>
                      <p className="text-xl font-black text-slate-900">{chartData.classesCompletion.pct}% Avg</p>
                      <p className="text-[10px] text-slate-400 font-bold">{chartData.classesCompletion.completed}/{chartData.classesCompletion.total} Classes</p>
                    </div>
                  </div>
                </div>

                {/* Pie Chart: Drives Progress */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Drives Completion</p>
                    <select 
                      value={chartsCohortFilter}
                      onChange={(e) => setChartsCohortFilter(e.target.value)}
                      className="text-[9px] font-black uppercase tracking-wider bg-slate-50 border-none outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Overall</option>
                      {assignedCohorts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: chartData.drivesCompletion.pct }, { value: 100 - chartData.drivesCompletion.pct }]}
                            innerRadius={20}
                            outerRadius={30}
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
                    <div>
                      <p className="text-xl font-black text-slate-900">{chartData.drivesCompletion.pct}% Avg</p>
                      <p className="text-[10px] text-slate-400 font-bold">{chartData.drivesCompletion.completed}/{chartData.drivesCompletion.total} Rated</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Today's Drives</h3>
                <button 
                  onClick={() => setActiveTab('scheduling')}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition"
                >
                  <Plus size={16} />
                  Add Drive
                </button>
              </div>

              {/* Today's Drives Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes
                  .filter(c => c.trainerId === instructor?.id && c.date === format(new Date(), 'yyyy-MM-dd'))
                  .map(cls => (
                    <button 
                      key={cls.id}
                      onClick={() => setSelectedDriveForDetail(cls.id)}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getDriveColorClass(cls.classNumber, cls.isSpecialDrive)} border border-current border-opacity-10`}>
                          {cls.isSpecialDrive ? 'Special' : `#${cls.classNumber}`}
                        </span>
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-900 mb-1">{cls.startTime} - {cls.endTime}</p>
                      <p className="text-xs font-bold text-slate-500">{cohorts.find(c => c.id === cls.cohortId)?.name}</p>
                      <div className="mt-6 flex -space-x-2">
                        {students.filter(s => cls.studentNames.includes(s.name)).map(s => (
                          <div key={s.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                            {s.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                {classes.filter(c => c.trainerId === instructor?.id && c.date === format(new Date(), 'yyyy-MM-dd')).length === 0 && (
                  <div className="col-span-full py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
                    <Car size={32} className="mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No drives scheduled for today</p>
                  </div>
                )}
              </div>

              {/* This Week's Drives Row */}
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6">This Week's Drives</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {classes
                    .filter(c => {
                      const date = new Date(c.date);
                      const now = new Date();
                      now.setHours(0,0,0,0);
                      const weekEnd = new Date();
                      weekEnd.setDate(now.getDate() + 7);
                      return c.trainerId === instructor?.id && date > now && date <= weekEnd;
                    })
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(cls => {
                      const driveColor = getDriveColor(cls.classNumber, cls.isSpecialDrive);
                      return (
                        <button 
                          key={cls.id}
                          onClick={() => setSelectedDriveForDetail(cls.id)}
                          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left min-w-[280px] group"
                        >
                          <p 
                            style={{ color: driveColor }}
                            className="text-[10px] font-black uppercase tracking-widest mb-1"
                          >
                            {cls.isSpecialDrive ? 'Special Drive' : `Drive ${cls.classNumber}`} • {format(new Date(cls.date), 'EEE, MMM d')}
                          </p>
                          <p className="text-lg font-black text-slate-900 mb-1">{cls.startTime} - {cls.endTime}</p>
                          <p className="text-xs font-bold text-slate-500">{cohorts.find(c => c.id === cls.cohortId)?.name}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {students.filter(s => cls.studentNames.includes(s.name)).map(s => (
                                <div key={s.id} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600">
                                  {s.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <div 
                              style={{ backgroundColor: `${driveColor}10`, color: driveColor }}
                              className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter"
                            >
                              {cls.isSpecialDrive ? 'S' : `#${cls.classNumber}`}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  }
                  {classes.filter(c => {
                      const date = new Date(c.date);
                      const now = new Date();
                      now.setHours(0,0,0,0);
                      const weekEnd = new Date();
                      weekEnd.setDate(now.getDate() + 7);
                      return c.trainerId === instructor?.id && date > now && date <= weekEnd;
                    }).length === 0 && (
                      <p className="text-xs font-bold text-slate-400 italic">No additional drives this week</p>
                    )
                  }
                </div>
              </div>

              {/* Course Calendar Shortcut */}
              <div className="bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] text-white relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black mb-1 sm:mb-2">Detailed Schedule</h3>
                    <p className="text-slate-400 font-medium text-xs sm:text-sm">View and manage the complete training itinerary for your cohorts.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="w-full md:w-auto bg-white text-slate-900 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition shadow-xl"
                  >
                    Open Schedule
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              </div>

              {/* Drive Detail Slide-over */}
              {selectedDriveForDetail && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-end bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
                  <div className="bg-white w-full sm:max-w-xl h-[92vh] sm:h-full rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-right-full duration-300">
                    <div className="pt-2.5 pb-0 flex justify-center sm:hidden">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                    </div>
                    <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">Drive Session Detail</h3>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1">
                          {(() => {
                            const cls = classes.find(c => c.id === selectedDriveForDetail);
                            if (!cls) return 'Session Details';
                            const d = cls.date ? new Date(cls.date) : null;
                            const formattedDate = d && !isNaN(d.getTime()) ? format(d, 'MMMM d, yyyy') : (cls.date || 'TBA');
                            return `${formattedDate} • ${cls.startTime || ''}`;
                          })()}
                        </p>
                      </div>
                      <button onClick={() => { setSelectedDriveForDetail(null); setSelectedStudentForDetail(null); }} className="p-2 sm:p-4 hover:bg-slate-50 rounded-2xl text-slate-400 transition cursor-pointer active:scale-95">
                        <X size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-8 no-scrollbar">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 sm:mb-4">Select Individual to View Progress</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                          {students
                            .filter(s => classes.find(c => c.id === selectedDriveForDetail)?.studentNames.includes(s.name))
                            .map(s => (
                              <button 
                                key={s.id}
                                onClick={() => setSelectedStudentForDetail(s.id)}
                                className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-[2rem] border transition-all text-left cursor-pointer active:scale-98 ${selectedStudentForDetail === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg sm:shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-900 hover:bg-white hover:border-slate-200'}`}
                              >
                                <p className={`text-xs sm:text-sm font-black mb-0.5 sm:mb-1 ${selectedStudentForDetail === s.id ? 'text-white' : 'text-slate-900'}`}>{s.name}</p>
                                <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tight ${selectedStudentForDetail === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>{s.email}</p>
                              </button>
                            ))}
                        </div>
                      </div>

                      {selectedStudentForDetail && (
                        <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-300">
                          {hasDetailRecommendation && (
                            <div className="bg-amber-50 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 border-amber-200 border-dashed">
                              <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                                <h4 className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-widest">Action Recommended</h4>
                              </div>
                              <p className="text-[11px] sm:text-xs font-bold text-amber-800 leading-relaxed">
                                Cumulative score ({studentDetailScore}/252) is below proficiency threshold. 
                                <span className="block mt-1 font-black underline decoration-2">Recommend Additional Parent and Instructor Drive for 1-2 hours</span>
                              </p>
                            </div>
                          )}
                          {/* Course Completion Progress */}
                          <div className="bg-slate-50 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Course Completion</h4>
                              <span className="text-[10px] sm:text-xs font-black text-indigo-600 bg-white px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border border-slate-100 shadow-2xs">
                                {Math.round(((classes.filter(c => c.studentNames.includes(students.find(s => s.id === selectedStudentForDetail)?.name || '') && (c.status === 'Completed' || new Date(c.date) < new Date())).length) / 18) * 100)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col items-center">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 relative">
                                  {(() => {
                                    const studentName = students.find(s => s.id === selectedStudentForDetail)?.name || '';
                                    const completedClasses = classes.filter(c => c.studentNames.includes(studentName) && (c.status === 'Completed' || new Date(c.date) < new Date())).length;
                                    return (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={[{ value: completedClasses }, { value: Math.max(0, 12 - completedClasses) }]}
                                            innerRadius={20}
                                            outerRadius={30}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                          >
                                            <Cell fill="#6366f1" />
                                            <Cell fill="#f1f5f9" />
                                          </Pie>
                                        </PieChart>
                                      </ResponsiveContainer>
                                    );
                                  })()}
                                </div>
                                <p className="text-[10px] font-black text-slate-900 mt-1.5 sm:mt-2">
                                  {classes.filter(c => c.studentNames.includes(students.find(s => s.id === selectedStudentForDetail)?.name || '') && (c.status === 'Completed' || new Date(c.date) < new Date())).length}/12 Classes
                                </p>
                              </div>
                              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col items-center">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 relative">
                                  {(() => {
                                    const studentId = selectedStudentForDetail;
                                    const feedbackCount = classFeedbacks.filter(f => f.studentId === studentId).length;
                                    return (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={[{ value: feedbackCount }, { value: Math.max(0, 6 - feedbackCount) }]}
                                            innerRadius={20}
                                            outerRadius={30}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                          >
                                            <Cell fill="#ec4899" />
                                            <Cell fill="#f1f5f9" />
                                          </Pie>
                                        </PieChart>
                                      </ResponsiveContainer>
                                    );
                                  })()}
                                </div>
                                <p className="text-[10px] font-black text-slate-900 mt-1.5 sm:mt-2">
                                  {classFeedbacks.filter(f => f.studentId === selectedStudentForDetail).length}/6 Drives
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Drive Feedback History */}
                          <div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Current Drive Feedback</h4>
                              <button 
                                onClick={() => {
                                  setFeedbackClassId(selectedDriveForDetail);
                                  setFeedbackStudentId(selectedStudentForDetail);
                                  setIsFeedbackModalOpen(true);
                                }}
                                className="w-full sm:w-auto text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-3.5 py-2 rounded-xl shadow-md sm:shadow-lg hover:bg-indigo-700 transition cursor-pointer active:scale-98 text-center"
                              >
                                Give Feedback for Current Session
                              </button>
                            </div>
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Previous Observations</h5>
                              {classFeedbacks
                                .filter(f => f.studentId === selectedStudentForDetail)
                                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                                .map(f => (
                                  <div key={f.id} className="p-3 sm:p-4 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-2xs">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex gap-0.5 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={10} className={i < f.rating ? 'fill-current' : 'text-slate-200'} />
                                        ))}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400">{format(new Date(f.createdAt), 'MMM d, h:mm a')}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 italic">"{f.comment}"</p>
                                  </div>
                                ))}
                              {classFeedbacks.filter(f => f.studentId === selectedStudentForDetail).length === 0 && (
                                <p className="text-center py-4 sm:py-6 text-xs font-bold text-slate-400 italic">No drive feedback history found.</p>
                              )}
                            </div>
                          </div>

                          {/* Class Progress Details */}
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest mb-3 sm:mb-4">Class Progress (Theory)</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                              {(() => {
                                const studentName = students.find(s => s.id === selectedStudentForDetail)?.name || '';
                                const completedCount = classes.filter(c => c.studentNames.includes(studentName) && (c.status === 'Completed' || new Date(c.date) < new Date())).length;
                                return [...Array(12)].map((_, i) => (
                                  <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${i < completedCount ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                                    M{i + 1}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Driving Schedule</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">Manage your sessions, tag-along instructors, and performance data.</p>
                </div>
                {/* Desktop View Controls */}
                <div className="hidden sm:flex items-center gap-2">
                  {/* Admin-styled Custom Cohort Selector Dropdown */}
                  <div className="relative z-30 min-w-[210px]">
                    <button
                      type="button"
                      onClick={() => setIsScheduleCohortDropdownOpen(!isScheduleCohortDropdownOpen)}
                      className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/90 cursor-pointer shadow-2xs text-left transition duration-150 active:scale-98 w-full"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">Cohort:</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate max-w-[120px]">
                          {scheduleCohortFilter === 'all' 
                            ? 'All Cohorts' 
                            : assignedCohorts.find(c => c.id === scheduleCohortFilter)?.name || 'All Cohorts'}
                        </span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isScheduleCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isScheduleCohortDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsScheduleCohortDropdownOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select Program Cohort</span>
                              <span className="text-indigo-600 font-bold">{assignedCohorts.length + 1} options</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setScheduleCohortFilter('all');
                                  setIsScheduleCohortDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                  scheduleCohortFilter === 'all'
                                    ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="truncate">All Cohorts</span>
                                {scheduleCohortFilter === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                              </button>
                              {assignedCohorts.map(c => {
                                const isActive = c.id === scheduleCohortFilter;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setScheduleCohortFilter(c.id);
                                      setIsScheduleCohortDropdownOpen(false);
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

                  <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-sm">
                    {(['all', 'lead', 'tag'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setScheduleFilter(mode)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          scheduleFilter === mode 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'all' ? 'All Sessions' : mode === 'lead' ? 'Lead Role' : 'Tag Role'}
                      </button>
                    ))}
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-1"></div>
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    Lead: {myClasses.filter(c => c.trainerId === instructor?.id).length}
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Tag-along: {myClasses.filter(c => c.tagAlongTrainerId === instructor?.id).length}
                  </div>
                </div>

                {/* Mobile View Controls */}
                <div className="flex sm:hidden flex-col gap-2.5 w-full">
                  {/* Row 1: Admin-styled Custom Cohort Selector Dropdown */}
                  <div className="relative z-30 w-full">
                    <button
                      type="button"
                      onClick={() => setIsScheduleCohortDropdownOpen(!isScheduleCohortDropdownOpen)}
                      className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl border border-slate-200/90 w-full cursor-pointer shadow-xs text-left transition duration-150 active:scale-98"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">Cohort:</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate">
                          {scheduleCohortFilter === 'all' 
                            ? 'All Cohorts' 
                            : assignedCohorts.find(c => c.id === scheduleCohortFilter)?.name || 'All Cohorts'}
                        </span>
                      </div>
                      <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isScheduleCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isScheduleCohortDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsScheduleCohortDropdownOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select Program Cohort</span>
                              <span className="text-indigo-600 font-bold">{assignedCohorts.length + 1} options</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setScheduleCohortFilter('all');
                                  setIsScheduleCohortDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                  scheduleCohortFilter === 'all'
                                    ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="truncate">All Cohorts</span>
                                {scheduleCohortFilter === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                              </button>
                              {assignedCohorts.map(c => {
                                const isActive = c.id === scheduleCohortFilter;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setScheduleCohortFilter(c.id);
                                      setIsScheduleCohortDropdownOpen(false);
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

                  {/* Row 2: Navtabs (Single line, full width) */}
                  <div className="w-full bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-xs">
                    {(['all', 'lead', 'tag'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setScheduleFilter(mode)}
                        className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center cursor-pointer ${
                          scheduleFilter === mode 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {mode === 'all' ? 'All Sessions' : mode === 'lead' ? 'Lead Role' : 'Tag Role'}
                      </button>
                    ))}
                  </div>

                  {/* Row 3: Lead and Tag-along count badges (New line) */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-100 text-center truncate font-bold">
                      Lead: {myClasses.filter(c => c.trainerId === instructor?.id).length}
                    </div>
                    <div className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 text-center truncate font-bold">
                      Tag-along: {myClasses.filter(c => c.tagAlongTrainerId === instructor?.id).length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-4">
                {myClasses.map((cls) => {
                  const sessionDate = new Date(cls.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isCompleted = cls.status === 'Completed' || sessionDate <= today;
                  const pendingRequest = rescheduleRequests.find(r => r.classId === cls.id && r.requesterId === instructor?.id && r.status === 'Pending');
                  const cohortName = cohorts.find(c => c.id === cls.cohortId)?.name || 'Unknown Cohort';
                  const isLead = cls.trainerId === instructor?.id;
                  const tagAlongInstructor = trainers.find(t => t.id === cls.tagAlongTrainerId);
                  const feedbackGiven = classFeedbacks.some(f => f.classId === cls.id);

                  return (
                    <div key={cls.id} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs sm:shadow-xs overflow-hidden transition-all group">
                      <div className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-6">
                        
                        {/* Top / Main Row on Mobile (Drive Badge + Class Details) */}
                        <div className="flex items-start gap-2.5 sm:gap-4 flex-1 min-w-0 w-full">
                          <div 
                            style={{ backgroundColor: getDriveColor(cls.classNumber, cls.isSpecialDrive) }}
                            className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white transition-colors shrink-0 shadow-md sm:shadow-lg"
                          >
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest mb-0.5 opacity-80">{cls.isSpecialDrive ? 'Special' : (isLead ? 'Lead' : 'Tag')}</span>
                            <span className="text-base sm:text-2xl font-black leading-none">{cls.isSpecialDrive ? 'S' : cls.classNumber}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-1">
                              <h4 className="text-sm sm:text-lg font-black text-slate-900 truncate">{format(new Date(cls.date), 'EEE, MMM d, yyyy')}</h4>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest ${
                                  cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {cls.status}
                                </span>
                                {isCompleted && (
                                  <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-500 font-bold leading-tight">
                              <span className="flex items-center gap-1"><Clock size={11} className="text-slate-400 shrink-0" /> {cls.startTime} - {cls.endTime}</span>
                              <span className="flex items-center gap-1"><GraduationCap size={11} className="text-slate-400 shrink-0" /> {cohortName}</span>
                              <span className="flex items-center gap-1"><Users size={11} className="text-slate-400 shrink-0" /> {cls.studentNames}</span>
                              {!isLead && (
                                <span className="flex items-center gap-1 text-indigo-600">
                                  <User size={11} className="shrink-0" /> Lead: {trainers.find(t => t.id === cls.trainerId)?.name || 'Unknown'}
                                </span>
                              )}
                              {isLead && tagAlongInstructor && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <User size={11} className="shrink-0" /> Tag-along: {tagAlongInstructor.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (Completed, Assign Tag-Along, Reschedule) */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100/80 pt-2 sm:pt-0 shrink-0">
                          {isCompleted && (isLead || cls.tagAlongTrainerId === instructor?.id) && (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {students.filter(s => cls.studentNames.includes(s.name)).map(student => {
                                const hasFeedback = classFeedbacks.some(f => f.classId === cls.id && f.studentId === student.id);
                                return (
                                  <div key={student.id} className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-lg sm:rounded-xl border border-slate-100">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-indigo-600">
                                      {student.name.charAt(0)}
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{student.name}</span>
                                    {hasFeedback ? (
                                      <div className="flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                        <Star size={8} className="fill-emerald-600" />
                                        {isLead ? 'Logged' : 'Rated'}
                                      </div>
                                    ) : isLead ? (
                                      <button
                                        onClick={() => openFeedbackModal(cls.id, student.id)}
                                        className="flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] font-black uppercase text-white bg-indigo-600 px-1.5 py-0.5 rounded-md hover:bg-indigo-700 transition cursor-pointer"
                                      >
                                        <Star size={8} />
                                        Rate
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                        Pending
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {isLead && !isCompleted && cls.status === 'Confirmed' && (
                            <button
                              onClick={() => onUpdateClass({ ...cls, status: 'Completed' })}
                              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest bg-indigo-600 text-white shadow-md sm:shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition cursor-pointer"
                            >
                              <CheckCircle size={13} className="sm:w-3.5 sm:h-3.5" />
                              Mark Completed
                            </button>
                          )}

                          {isLead && !isCompleted && (
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  if (activeTagAlongClassId === cls.id) {
                                    setActiveTagAlongClassId(null);
                                    setIsTagAlongMode(false);
                                  } else {
                                    setActiveTagAlongClassId(cls.id);
                                    setIsTagAlongMode(true);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition border cursor-pointer shadow-2xs sm:shadow-sm hover:shadow-md ${
                                  activeTagAlongClassId === cls.id
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md sm:shadow-lg shadow-emerald-200'
                                    : 'bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                                }`}
                              >
                                <User size={13} className="sm:w-3.5 sm:h-3.5" />
                                {cls.tagAlongTrainerId ? 'Change Tag-along' : 'Assign Tag-along'}
                              </button>

                              {isTagAlongMode && activeTagAlongClassId === cls.id && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                  <div className="p-2 border-b border-slate-50 mb-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Select Partner Instructor</p>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar space-y-1">
                                    {trainers.filter(t => t.id !== instructor?.id).map(trainer => (
                                      <button
                                        key={trainer.id}
                                        onClick={() => {
                                          onUpdateClass({ ...cls, tagAlongTrainerId: trainer.id });
                                          setIsTagAlongMode(false);
                                          setActiveTagAlongClassId(null);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black transition-colors ${
                                          cls.tagAlongTrainerId === trainer.id 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        {trainer.name}
                                      </button>
                                    ))}
                                    {cls.tagAlongTrainerId && (
                                      <button
                                        onClick={() => {
                                          onUpdateClass({ ...cls, tagAlongTrainerId: undefined });
                                          setIsTagAlongMode(false);
                                          setActiveTagAlongClassId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-slate-50"
                                      >
                                        Remove Tag-along
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {!isCompleted && !pendingRequest && isLead && (
                            <button 
                              onClick={() => setActiveRescheduleId(activeRescheduleId === cls.id ? null : cls.id)}
                              className={`flex items-center gap-1.5 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all border cursor-pointer ${
                                activeRescheduleId === cls.id 
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-md sm:shadow-lg shadow-rose-200' 
                                  : 'bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                              }`}
                              title="Request Reschedule"
                            >
                              <MessageSquare size={15} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          )}
                        </div>
                      </div>

                      {activeRescheduleId === cls.id && (
                        <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                          <div className="bg-rose-50/30 p-6 rounded-3xl space-y-4 border border-rose-100/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Suggest 3 Alternative Slots</p>
                              <Info size={14} className="text-rose-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {suggestedSlots.map((slot, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                                    <input 
                                      type="date"
                                      value={slot.date}
                                      onChange={(e) => {
                                        const newSlots = [...suggestedSlots];
                                        newSlots[idx].date = e.target.value;
                                        setSuggestedSlots(newSlots);
                                      }}
                                      className="flex-1 bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 pl-7">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase w-6">From</span>
                                      <input 
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => {
                                          const newSlots = [...suggestedSlots];
                                          newSlots[idx].startTime = e.target.value;
                                          setSuggestedSlots(newSlots);
                                        }}
                                        className="flex-1 bg-slate-50 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase w-6">To</span>
                                      <input 
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => {
                                          const newSlots = [...suggestedSlots];
                                          newSlots[idx].endTime = e.target.value;
                                          setSuggestedSlots(newSlots);
                                        }}
                                        className="flex-1 bg-slate-50 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <textarea 
                              value={rescheduleMessage}
                              onChange={(e) => setRescheduleMessage(e.target.value)}
                              placeholder="Optional message for the admin..."
                              className="w-full bg-white border border-rose-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none h-24 shadow-sm"
                            />
                            
                            <div className="flex gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  const validSlots = suggestedSlots.filter(s => s.date && s.startTime && s.endTime);
                                  if (validSlots.length === 3 && instructor) {
                                    onRequestReschedule({
                                      classId: cls.id,
                                      requesterId: instructor.id,
                                      requesterName: instructor.name,
                                      requesterRole: 'Instructor',
                                      message: rescheduleMessage,
                                      suggestedSlots: validSlots
                                    });
                                    setRescheduleMessage('');
                                    setSuggestedSlots([{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }]);
                                    setActiveRescheduleId(null);
                                  }
                                }}
                                className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition shadow-lg shadow-rose-200 disabled:opacity-50"
                                disabled={suggestedSlots.some(s => !s.date || !s.startTime || !s.endTime)}
                              >
                                Send Reschedule Request
                              </button>
                              <button 
                                onClick={() => setActiveRescheduleId(null)}
                                className="px-8 py-4 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 rounded-2xl transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="animate-in fade-in duration-500">
              {renderCalendar()}
            </div>
          )}

          {activeTab === 'scheduling' && (
            <Scheduling 
              cohorts={cohorts}
              students={students}
              trainers={trainers}
              slots={slots}
              classes={classes}
              activeCohortId={activeCohortId}
              setActiveCohortId={setActiveCohortId}
              onUpdateClasses={onUpdateClasses}
              onUpdateSlots={onUpdateSlots}
              onAddClasses={onAddClasses}
              onConfirmAllProposed={onConfirmAllProposed}
            />
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Training Performance Data</h3>
                  <p className="text-sm text-slate-400 font-medium">Aggregated analytics from student driving sessions.</p>
                </div>
                
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-100 shadow-sm w-full sm:w-auto">
                  {/* Mobile Row 1: Filters Label + All Cohorts Dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 border-r border-slate-100 shrink-0">
                      <Filter size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters</span>
                    </div>

                    {/* Cohort Custom Select Dropdown */}
                    <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPerfCohortDropdownOpen(!isPerfCohortDropdownOpen);
                          setIsPerfStudentDropdownOpen(false);
                          setIsPerfClassNumDropdownOpen(false);
                        }}
                        className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/80 active:scale-98 transition-all duration-150 py-1.5 px-3 rounded-xl border border-slate-200/80 cursor-pointer text-left outline-none w-full sm:w-auto"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {perfFilterCohort === 'all' 
                              ? 'All Cohorts' 
                              : assignedCohorts.find(c => c.id === perfFilterCohort)?.name || 'All Cohorts'}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isPerfCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isPerfCohortDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-50" 
                              onClick={() => setIsPerfCohortDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] overflow-hidden"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                <span>Select Cohort</span>
                                <span className="text-indigo-600 font-bold">{assignedCohorts.length + 1} options</span>
                              </div>
                              <div className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPerfFilterCohort('all');
                                    setIsPerfCohortDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    perfFilterCohort === 'all'
                                      ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                  }`}
                                >
                                  <span>All Cohorts</span>
                                  {perfFilterCohort === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                                {assignedCohorts.map(c => {
                                  const isActive = c.id === perfFilterCohort;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        setPerfFilterCohort(c.id);
                                        setIsPerfCohortDropdownOpen(false);
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

                    {(perfFilterCohort !== 'all' || perfFilterStudent !== 'all' || perfFilterClassNum !== 'all') && (
                      <button 
                        onClick={() => {
                          setPerfFilterCohort('all');
                          setPerfFilterStudent('all');
                          setPerfFilterClassNum('all');
                          setIsPerfCohortDropdownOpen(false);
                          setIsPerfStudentDropdownOpen(false);
                          setIsPerfClassNumDropdownOpen(false);
                        }}
                        className="sm:hidden text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-colors cursor-pointer border border-indigo-100 shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Mobile Separate Rows for Candidate and Lesson Dropdowns */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                    {/* Candidate Custom Select Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPerfStudentDropdownOpen(!isPerfStudentDropdownOpen);
                          setIsPerfCohortDropdownOpen(false);
                          setIsPerfClassNumDropdownOpen(false);
                        }}
                        className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/80 active:scale-98 transition-all duration-150 py-1.5 px-3 rounded-xl border border-slate-200/80 cursor-pointer text-left outline-none w-full sm:w-auto"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {perfFilterStudent === 'all' 
                              ? 'All Candidates' 
                              : assignedStudents.find(s => s.id === perfFilterStudent)?.name || 'All Candidates'}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isPerfStudentDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isPerfStudentDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-50" 
                              onClick={() => setIsPerfStudentDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute left-0 top-full mt-1.5 w-full sm:w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] overflow-hidden"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                <span>Select Candidate</span>
                                <span className="text-indigo-600 font-bold">{assignedStudents.length + 1} options</span>
                              </div>
                              <div className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPerfFilterStudent('all');
                                    setIsPerfStudentDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    perfFilterStudent === 'all'
                                      ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                  }`}
                                >
                                  <span>All Candidates</span>
                                  {perfFilterStudent === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                                {assignedStudents.map(s => {
                                  const isActive = s.id === perfFilterStudent;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        setPerfFilterStudent(s.id);
                                        setIsPerfStudentDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                        isActive
                                          ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                      }`}
                                    >
                                      <span className="truncate">{s.name}</span>
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

                    {/* Lesson Custom Select Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPerfClassNumDropdownOpen(!isPerfClassNumDropdownOpen);
                          setIsPerfCohortDropdownOpen(false);
                          setIsPerfStudentDropdownOpen(false);
                        }}
                        className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/80 active:scale-98 transition-all duration-150 py-1.5 px-3 rounded-xl border border-slate-200/80 cursor-pointer text-left outline-none w-full sm:w-auto"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {perfFilterClassNum === 'all' 
                              ? 'All Lessons' 
                              : `Lesson ${perfFilterClassNum}`}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isPerfClassNumDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isPerfClassNumDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-50" 
                              onClick={() => setIsPerfClassNumDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute left-0 top-full mt-1.5 w-full sm:w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] overflow-hidden"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                <span>Select Lesson</span>
                                <span className="text-indigo-600 font-bold">7 options</span>
                              </div>
                              <div className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPerfFilterClassNum('all');
                                    setIsPerfClassNumDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                    perfFilterClassNum === 'all'
                                      ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                  }`}
                                >
                                  <span>All Lessons</span>
                                  {perfFilterClassNum === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                                </button>
                                {[1, 2, 3, 4, 5, 6].map(num => {
                                  const numStr = num.toString();
                                  const isActive = perfFilterClassNum === numStr;
                                  return (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => {
                                        setPerfFilterClassNum(numStr);
                                        setIsPerfClassNumDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                        isActive
                                          ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                      }`}
                                    >
                                      <span>Lesson {num}</span>
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

                  {(perfFilterCohort !== 'all' || perfFilterStudent !== 'all' || perfFilterClassNum !== 'all') && (
                    <button 
                      onClick={() => {
                        setPerfFilterCohort('all');
                        setPerfFilterStudent('all');
                        setPerfFilterClassNum('all');
                        setIsPerfCohortDropdownOpen(false);
                        setIsPerfStudentDropdownOpen(false);
                        setIsPerfClassNumDropdownOpen(false);
                      }}
                      className="hidden sm:block sm:ml-auto text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-colors cursor-pointer border border-indigo-100"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Performance Chart */}
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-8">Average Lesson Rating Progression</h4>
                  <div className="h-60 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredFeedback.slice(-10).map((f, i) => ({ name: f.studentName.split(' ')[0], rating: f.rating, date: format(new Date(f.createdAt), 'MMM d') }))}>
                        <defs>
                          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="rating" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feedback Stream */}
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-8">Candidate Feedback Log</h4>
                  <div className="space-y-4 max-h-[18rem] overflow-y-auto pr-2 no-scrollbar">
                    {filteredFeedback.length > 0 ? (
                      filteredFeedback.slice().reverse().map(feedback => (
                        <div key={feedback.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-black text-slate-900">{feedback.studentName}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                {classes.find(c => c.id === feedback.classId)?.classNumber ? `Lesson ${classes.find(c => c.id === feedback.classId)?.classNumber}` : 'Session'}
                              </p>
                            </div>
                            <div className="flex gap-0.5 text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} className={i < feedback.rating ? 'fill-current' : 'text-slate-200'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 italic leading-relaxed">"{feedback.comment}"</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                            {format(new Date(feedback.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-200">
                            <FileText size={24} />
                         </div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records</p>
                         <button 
                           onClick={() => {
                             setPerfFilterCohort('all');
                             setPerfFilterStudent('all');
                             setPerfFilterClassNum('all');
                           }}
                           className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                         >
                           Clear Filters
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {assignedCohorts.map(c => {
                const cohortStudents = students.filter(s => s.cohortId === c.id);
                return (
                  <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <GraduationCap size={24} />
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-1">{c.name}</h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {c.startDate}</span>
                        <span className="flex items-center gap-1.5"><Users size={12} /> {cohortStudents.length} Students</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>Assigned Schedule</span>
                          <span className="text-indigo-600">{c.selectedDays.join(', ')}</span>
                        </div>
                        {c.notes && (
                          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 italic">
                            "{c.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex justify-between items-center">
                      <button 
                        onClick={() => {
                          setActiveCohortId(c.id);
                          setActiveTab('candidates');
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        View Candidates <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {assignedCohorts.length === 0 && (
                <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <GraduationCap size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">No Assigned Programs</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium">
                    You haven't been assigned to any cohorts yet. Please contact the administrator for assignment.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white p-3.5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
              <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Define Your Availability</h3>
                  <p className="text-sm text-slate-400 font-medium">Set your driving session slots for your assigned cohorts.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsDefineCohortDropdownOpen(!isDefineCohortDropdownOpen)}
                    className="flex items-center justify-between gap-2.5 bg-indigo-50 hover:bg-indigo-100/80 active:scale-98 transition-all duration-150 px-4 py-2 rounded-xl border border-indigo-100 cursor-pointer text-left outline-none w-full sm:w-auto"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest shrink-0">Cohort Focus:</span>
                      <span className="text-xs font-black text-indigo-900 truncate">
                        {assignedCohorts.find(c => c.id === activeCohortId)?.name || 'Select Cohort'}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isDefineCohortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDefineCohortDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsDefineCohortDropdownOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 sm:right-0 sm:left-auto left-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                            <span>Select Program Cohort</span>
                            <span className="text-indigo-600 font-bold">{assignedCohorts.length} available</span>
                          </div>
                          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                            {assignedCohorts.map(c => {
                              const isActive = c.id === activeCohortId;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveCohortId(c.id);
                                    setIsDefineCohortDropdownOpen(false);
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
              <TrainerAvailabilityCalendar 
                slots={slots.filter(s => s.trainerId === instructor?.id)}
                classes={classes.filter(c => c.trainerId === instructor?.id)}
                trainers={instructor ? [instructor] : []}
                cohorts={assignedCohorts}
                activeCohortId={activeCohortId}
                setActiveCohortId={setActiveCohortId}
                onAddSlots={onAddSlots}
                onUpdateSlotStatus={onUpdateSlotStatus}
                onDeleteSlot={onDeleteSlot}
                onUpdateClass={onUpdateClass}
                onDeleteClass={onDeleteClass}
                onRequestReschedule={onRequestReschedule}
                userProfile={userProfile}
                setActiveTab={(tab: string) => setActiveTab(tab as any)}
              />
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">My Candidates</h3>
                  <p className="text-sm text-slate-400 font-medium">Directory of students in your assigned cohorts.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsCandidatesCohortDropdownOpen(!isCandidatesCohortDropdownOpen)}
                      className="flex items-center justify-between gap-2.5 bg-indigo-50 hover:bg-indigo-100/80 active:scale-98 transition-all duration-150 px-4 py-2 rounded-2xl border border-indigo-100 cursor-pointer text-left outline-none w-full sm:w-auto"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest shrink-0">Cohort Filter:</span>
                        <span className="text-xs font-black text-indigo-900 truncate">
                          {candidatesCohortFilter === 'all'
                            ? 'All Cohorts'
                            : (assignedCohorts.find(c => c.id === candidatesCohortFilter)?.name || 'Select Cohort')
                          }
                        </span>
                      </div>
                      <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isCandidatesCohortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCandidatesCohortDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsCandidatesCohortDropdownOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 sm:right-0 sm:left-auto left-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select Program Cohort</span>
                              <span className="text-indigo-600 font-bold">{assignedCohorts.length + 1} options</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                              <button
                                type="button"
                                onClick={() => {
                                  setCandidatesCohortFilter('all');
                                  setIsCandidatesCohortDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                  candidatesCohortFilter === 'all'
                                    ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="truncate">All Cohorts</span>
                                {candidatesCohortFilter === 'all' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                              </button>

                              {assignedCohorts.map(c => {
                                const isActive = c.id === candidatesCohortFilter;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setCandidatesCohortFilter(c.id);
                                      setIsCandidatesCohortDropdownOpen(false);
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

                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 w-full sm:w-auto">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search candidates..." 
                      className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none w-full sm:w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile View: Cards Layout */}
              <div className="block sm:hidden space-y-3 p-4 sm:p-0">
                {assignedStudents
                  .filter(s => candidatesCohortFilter === 'all' || s.cohortId === candidatesCohortFilter)
                  .filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(student => (
                  <div key={student.id} className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 transition">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          student.under18 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {student.name.slice(0, 1)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {student.age} Yrs • {student.under18 ? 'Teen' : 'Adult'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        student.permitId ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {student.permitId ? 'Permit Verified' : 'No Permit'}
                      </span>
                    </div>

                    {/* Cohort & Location badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Cohort</span>
                        <p className="font-extrabold text-slate-800 truncate">
                          {cohorts.find(c => c.id === student.cohortId)?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Location</span>
                        <p className="font-extrabold text-indigo-600 truncate flex items-center gap-1">
                          <Car size={12} className="text-indigo-400 shrink-0" />
                          {locations.find(l => l.id === student.locationId)?.name || 'Central'}
                        </p>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="pt-0.5 space-y-1.5 text-xs">
                      {student.email && (
                        <a href={`mailto:${student.email}`} className="flex items-center gap-2 text-slate-600 font-medium hover:text-indigo-600 transition truncate">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </a>
                      )}
                      {student.phone && (
                        <a href={`tel:${student.phone}`} className="flex items-center gap-2 text-slate-600 font-medium hover:text-indigo-600 transition truncate">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{student.phone}</span>
                        </a>
                      )}
                      {student.under18 && (student.parentName || student.parent2Name) && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 bg-white/80 p-2.5 rounded-xl">
                          <span className="font-black text-slate-400 uppercase tracking-widest block mb-1">Parent Contacts</span>
                          {student.parentName && (
                            <p className="font-semibold text-slate-600">P1: {student.parentName} {student.parentPhone && <a href={`tel:${student.parentPhone}`} className="text-indigo-600 font-bold ml-1">({student.parentPhone})</a>}</p>
                          )}
                          {student.parent2Name && (
                            <p className="font-semibold text-slate-600">P2: {student.parent2Name} {student.parent2Phone && <a href={`tel:${student.parent2Phone}`} className="text-indigo-600 font-bold ml-1">({student.parent2Phone})</a>}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {assignedStudents
                  .filter(s => candidatesCohortFilter === 'all' || s.cohortId === candidatesCohortFilter)
                  .filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
                    No candidates found in your assigned cohorts.
                  </div>
                )}
              </div>

              {/* Desktop View: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cohort</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {assignedStudents
                      .filter(s => candidatesCohortFilter === 'all' || s.cohortId === candidatesCohortFilter)
                      .filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                              student.under18 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {student.name.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{student.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {student.age} Years • {student.under18 ? 'Teen' : 'Adult'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-600">
                            {cohorts.find(c => c.id === student.cohortId)?.name || 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Car size={12} className="text-indigo-400" />
                            {locations.find(l => l.id === student.locationId)?.name || 'Central'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] font-bold text-slate-400 space-y-0.5">
                            <p>{student.email}</p>
                            <p>{student.phone}</p>
                            {student.under18 && (
                              <div className="mt-1 pt-1 border-t border-slate-100 text-[9px] text-slate-400 italic">
                                {student.parentName && (
                                  <p>P1: {student.parentName} ({student.parentPhone})</p>
                                )}
                                {student.parent2Name && (
                                  <p>P2: {student.parent2Name} ({student.parent2Phone})</p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                            student.permitId ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {student.permitId ? 'Permit Verified' : 'No Permit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {assignedStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic">
                          No candidates found in your assigned cohorts.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

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
            <div className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs" />
          )}
          <LayoutGrid size={18} className={activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer min-h-[44px] touch-press relative font-bold ${
            activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'schedule' && (
            <div className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs" />
          )}
          <Clock size={18} className={activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer min-h-[44px] touch-press relative font-bold ${
            activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'calendar' && (
            <div className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs" />
          )}
          <Calendar size={18} className={activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer min-h-[44px] touch-press relative font-bold ${
            activeTab === 'candidates' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'candidates' && (
            <div className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs" />
          )}
          <Users size={18} className={activeTab === 'candidates' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Students</span>
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
        SteerSafe Ecosystem &copy; 2026 • Secure Instructor Link Enabled
      </footer>
      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFeedbackModalOpen(false)} />
          <div className="relative bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg max-h-[90vh] sm:max-h-[90vh] my-0 sm:my-auto overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 flex flex-col">
            <div className="pt-2.5 pb-0 flex justify-center sm:hidden bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>
            <div className="p-4 sm:p-8 bg-slate-900 text-white shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl font-black mb-0.5 sm:mb-1">Performance Review</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Recording session data for candidate</p>
              </div>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white active:scale-95">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-8 no-scrollbar">
              {feedbackClassId && (
                <div className="bg-slate-50 p-3.5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 sm:mb-4 text-center">Active Candidate</label>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {students.filter(s => {
                      const cls = classes.find(c => c.id === feedbackClassId);
                      return cls ? cls.studentNames.includes(s.name) : false;
                    }).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setFeedbackStudentId(s.id)}
                        className={`flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all border cursor-pointer active:scale-95 ${
                          feedbackStudentId === s.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md sm:shadow-lg shadow-indigo-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] ${feedbackStudentId === s.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {s.name.charAt(0)}
                        </div>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Driving Skills - 14 Items */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 sm:mb-6">Driving Skills Evaluation</label>
                <div className="space-y-2.5 sm:space-y-6">
                  {Object.entries({
                    instruments: 'Instruments',
                    starts: 'Starts',
                    stops: 'Stops',
                    leftTurns: 'Left Turns',
                    rightTurns: 'Right Turns',
                    signs: 'Signs',
                    lanePositioning: 'Lane Positioning',
                    intersections: 'Intersections',
                    awareness: 'Awareness',
                    space: 'Space',
                    speed: 'Speed',
                    rules: 'Rules',
                    parking: 'Parking',
                    laneChanging: 'Lane Changing'
                  }).map(([key, label]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                        <span className="text-xs font-black text-slate-800">{label}</span>
                        <span className="sm:hidden text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                          {(feedbackSkills as any)[key] === 1 ? 'Needs Imp.' : (feedbackSkills as any)[key] === 2 ? 'Basic' : 'Consistent'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex gap-2">
                          {[1, 2, 3].map((star) => (
                            <button
                              key={star}
                              onClick={() => setFeedbackSkills(prev => ({ ...prev, [key]: star }))}
                              className={`p-1.5 sm:p-0 transition-all transform active:scale-125 cursor-pointer ${
                                star <= (feedbackSkills as any)[key] ? 'text-indigo-600' : 'text-slate-200'
                              }`}
                            >
                              <Star size={20} className={star <= (feedbackSkills as any)[key] ? 'fill-current' : ''} />
                            </button>
                          ))}
                        </div>
                        <span className="hidden sm:inline-block text-[9px] font-black uppercase text-indigo-600 w-24">
                          {(feedbackSkills as any)[key] === 1 ? 'Needs Improvement' : (feedbackSkills as any)[key] === 2 ? 'Basic' : 'Consistent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Intervention */}
              <div className="bg-amber-50 p-3.5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-amber-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="space-y-1 w-full sm:w-auto">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] block">Instructor Intervention</label>
                    <input 
                      type="text"
                      value={feedbackInterventionMetric}
                      onChange={(e) => setFeedbackInterventionMetric(e.target.value)}
                      placeholder="e.g. Steering Wheel, Brake..."
                      className="bg-transparent border-b border-amber-200 text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500 w-full sm:w-48 placeholder:text-amber-300 placeholder:font-normal py-0.5"
                    />
                  </div>
                  <Info size={14} className="text-amber-400 hidden sm:block" />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackIntervention(star)}
                        className={`p-1.5 sm:p-0 transition-all transform active:scale-125 cursor-pointer ${
                          star <= feedbackIntervention ? 'text-amber-500' : 'text-slate-200'
                        }`}
                      >
                        <Star size={22} className={`sm:w-6 sm:h-6 ${star <= feedbackIntervention ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200/50 sm:bg-transparent sm:p-0 sm:border-none">
                    {feedbackIntervention === 1 ? 'Constant' : feedbackIntervention === 2 ? 'Minimal' : 'None'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Detailed Observations</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Notes on student performance, technical skill mastery, and areas for improvement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 sm:h-32 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100">
                <button 
                  onClick={() => setMarkAsComplete(!markAsComplete)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer ${markAsComplete ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-transparent'}`}
                >
                  <CheckCircle size={14} />
                </button>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Mark Drive as Complete</p>
                  <p className="text-[9px] text-indigo-600 font-bold">This will update the session status to 'Completed' for everyone.</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer active:scale-98"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const cls = classes.find(c => c.id === feedbackClassId);
                    const student = students.find(s => s.id === feedbackStudentId);
                    if (cls && student) {
                      let totalSkillsScore = 0;
                      Object.values(feedbackSkills).forEach(val => {
                        totalSkillsScore += (val as number);
                      });
                      const maxScore = 14 * 3;
                      const mappedRating = Math.round((totalSkillsScore / maxScore) * 5);
                      
                      onSubmitFeedback({
                        classId: cls.id,
                        studentId: student.id,
                        studentName: student.name,
                        skills: feedbackSkills,
                        intervention: feedbackIntervention,
                        interventionMetric: feedbackInterventionMetric,
                        rating: mappedRating,
                        comment: feedbackComment
                      });

                      if (markAsComplete && cls) {
                        onUpdateClass({ ...cls, status: 'Completed' });
                      }

                      setIsFeedbackModalOpen(false);
                      setFeedbackComment('');
                      setFeedbackInterventionMetric('Steering Wheel');
                      setFeedbackSkills({
                        instruments: 3,
                        starts: 3,
                        stops: 3,
                        leftTurns: 3,
                        rightTurns: 3,
                        signs: 3,
                        lanePositioning: 3,
                        intersections: 3,
                        awareness: 3,
                        space: 3,
                        speed: 3,
                        rules: 3,
                        parking: 3,
                        laneChanging: 3,
                      });
                      setFeedbackIntervention(3);
                    }
                  }}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md sm:shadow-lg shadow-indigo-200 cursor-pointer active:scale-98 text-center"
                >
                  Save Performance Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Drive Modal */}
      {isAddDriveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddDriveModalOpen(false)} />
          <div className="relative bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] my-auto overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col border border-slate-100">
            <div className="p-4 sm:p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg sm:text-2xl font-black mb-0.5 sm:mb-1">Add Driving Session</h3>
                <p className="text-indigo-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Manually schedule a drive</p>
              </div>
              <button onClick={() => setIsAddDriveModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                  <input 
                    type="date" 
                    value={newDriveDate}
                    onChange={(e) => setNewDriveDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class Number</label>
                  <input 
                    type="number" 
                    min="1"
                    max="6"
                    value={newDriveClassNumber}
                    onChange={(e) => setNewDriveClassNumber(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <input 
                  type="checkbox"
                  id="specialDrive"
                  checked={newDriveIsSpecial}
                  onChange={(e) => setNewDriveIsSpecial(e.target.checked)}
                  className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="specialDrive" className="text-xs font-black text-purple-900 uppercase tracking-widest cursor-pointer">
                  Mark as Special Drive (Outside normal 6 drives)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Start Time</label>
                  <input 
                    type="time" 
                    value={newDriveStartTime}
                    onChange={(e) => setNewDriveStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">End Time</label>
                  <input 
                    type="time" 
                    value={newDriveEndTime}
                    onChange={(e) => setNewDriveEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cohort</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddDriveCohortDropdownOpen(!isAddDriveCohortDropdownOpen)}
                    className="flex items-center justify-between gap-2.5 bg-slate-50 hover:bg-slate-100/80 active:scale-98 transition-all duration-150 p-3 rounded-xl border border-slate-200 w-full cursor-pointer text-left focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">Cohort:</span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {assignedCohorts.find(c => c.id === newDriveCohortId)?.name || 'Select a cohort...'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isAddDriveCohortDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isAddDriveCohortDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-50" 
                          onClick={() => setIsAddDriveCohortDropdownOpen(false)} 
                        />

                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] overflow-hidden"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                            <span>Select Program Cohort</span>
                            <span className="text-indigo-600 font-bold">{assignedCohorts.length} available</span>
                          </div>
                          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                            {assignedCohorts.map(c => {
                              const isActive = c.id === newDriveCohortId;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setNewDriveCohortId(c.id);
                                    setNewDriveStudentIds([]);
                                    setIsAddDriveCohortDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
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

              {newDriveCohortId && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Candidates (Max 2)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {students.filter(s => s.cohortId === newDriveCohortId).map(s => {
                      const isSelected = newDriveStudentIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (isSelected) {
                              setNewDriveStudentIds(newDriveStudentIds.filter(id => id !== s.id));
                            } else if (newDriveStudentIds.length < 2) {
                              setNewDriveStudentIds([...newDriveStudentIds, s.id]);
                            }
                          }}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600' 
                              : 'bg-white border-slate-200 hover:border-indigo-400'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.age} Years • {s.under18 ? 'Teen' : 'Adult'}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddDriveModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newDriveCohortId || newDriveStudentIds.length === 0) {
                      return;
                    }
                    if (!instructor) return;

                    const driveStudents = students.filter(s => newDriveStudentIds.includes(s.id));
                    const studentNames = driveStudents.map(s => s.name).join(' & ');

                    const newClass: ClassScheduled = {
                      id: `manual-${Date.now()}`,
                      cohortId: newDriveCohortId,
                      groupId: '',
                      studentNames,
                      classNumber: newDriveClassNumber,
                      isSpecialDrive: newDriveIsSpecial,
                      trainerId: instructor.id,
                      date: newDriveDate,
                      startTime: newDriveStartTime,
                      endTime: newDriveEndTime,
                      status: 'Confirmed'
                    };

                    onAddClasses([newClass]);
                    setIsAddDriveModalOpen(false);
                    // Reset state
                    setNewDriveCohortId('');
                    setNewDriveStudentIds([]);
                    setNewDriveClassNumber(1);
                    setNewDriveIsSpecial(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer disabled:opacity-50"
                  disabled={!newDriveCohortId || newDriveStudentIds.length === 0}
                >
                  Add Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-display leading-none">
                    SteerSafe
                  </h3>
                  <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-widest leading-none mt-1">Certified Instructor Portal</p>
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
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Instructor Menu</div>
              {[
                { id: 'overview', label: 'Overview', icon: LayoutGrid, desc: 'Dashboard & Metrics' },
                { id: 'schedule', label: 'Schedule', icon: Clock, desc: 'Assigned Drives' },
                { id: 'calendar', label: 'Calendar', icon: Calendar, desc: 'Monthly Schedule' },
                { id: 'performance', label: 'Student Progress', icon: BarChart2, desc: 'Ratings & Skills' },
                { id: 'availability', label: 'Availability', icon: Clock, desc: 'Slot Management' },
                { id: 'candidates', label: 'Students Roster', icon: Users, desc: 'Assigned Candidates' },
                { id: 'scheduling', label: 'Auto Scheduler', icon: Sparkles, desc: 'Class Allocator' }
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
                  {(userProfile.displayName || 'C').slice(0, 1)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold leading-none text-slate-900 truncate">{instructor?.name || userProfile.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{userProfile.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
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
