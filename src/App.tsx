import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  Users, 
  Clock, 
  GraduationCap, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  User, 
  Settings,
  Car,
  Shield,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut
} from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import TrainerManagement from './components/TrainerManagement';
import CohortManagement from './components/CohortManagement';
import TrainerAvailabilityCalendar from './components/TrainerAvailabilityCalendar';
import StudentManagement from './components/StudentManagement';
import PartnerMatching from './components/PartnerMatching';
import Scheduling from './components/Scheduling';
import RescheduleRequests from './components/RescheduleRequests';
import TrainerCalendarView from './components/TrainerCalendarView';
import Login from './components/Login';
import RoleSelection from './components/RoleSelection';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import CohortDriveCalendar from './components/CohortDriveCalendar';
import Signup from './components/Signup';
import TheoryFeedback from './components/TheoryFeedback';

// Preset Initial Values
import { 
  INITIAL_LOCATIONS, 
  INITIAL_SCHOOLS, 
  INITIAL_TRAINERS, 
  INITIAL_COHORTS, 
  INITIAL_STUDENTS, 
  INITIAL_SLOTS,
  INITIAL_CLASSES,
  INITIAL_FEEDBACKS
} from './data/initialData';

// Types
import { 
  Student, 
  Trainer, 
  Cohort, 
  TrainerAvailabilitySlot, 
  ClassScheduled, 
  Location, 
  School,
  CohortStatus,
  UserRole,
  UserProfile,
  RescheduleRequest,
  ClassFeedback,
  ClassroomSessionStatus,
  AppNotification
} from './types';

// Firebase Setup
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  FirebaseUser,
  handleFirestoreError,
  OperationType 
} from './firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [thirdTabId, setThirdTabId] = useState<string>('students');
  const [activeCohortId, setActiveCohortId] = useState<string>('coh-june-2026');
  const [showSignup, setShowSignup] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'cohorts') {
      setThirdTabId(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);
  
  // Realtime Connection & Handlers
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);

  // Master States
  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    try {
      const raw = localStorage.getItem('ds_trainers');
      const local = raw ? JSON.parse(raw) : INITIAL_TRAINERS;
      if (!Array.isArray(local)) return INITIAL_TRAINERS;
      const missing = INITIAL_TRAINERS.filter(t => !local.find((l: any) => l && l.id === t.id));
      return [...local, ...missing];
    } catch {
      return INITIAL_TRAINERS;
    }
  });

  const [cohorts, setCohorts] = useState<Cohort[]>(() => {
    try {
      const raw = localStorage.getItem('ds_cohorts');
      const local = raw ? JSON.parse(raw) : INITIAL_COHORTS;
      if (!Array.isArray(local)) return INITIAL_COHORTS;
      const missing = INITIAL_COHORTS.filter(c => !local.find((l: any) => l && l.id === c.id));
      return [...local, ...missing];
    } catch {
      return INITIAL_COHORTS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem('ds_students');
      const local = raw ? JSON.parse(raw) : INITIAL_STUDENTS;
      if (!Array.isArray(local)) return INITIAL_STUDENTS;
      const missing = INITIAL_STUDENTS.filter(s => !local.find((l: any) => l && l.id === s.id));
      return [...local, ...missing];
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [slots, setSlots] = useState<TrainerAvailabilitySlot[]>(() => {
    try {
      const raw = localStorage.getItem('ds_slots');
      const parsed = raw ? JSON.parse(raw) : INITIAL_SLOTS;
      return Array.isArray(parsed) ? parsed : INITIAL_SLOTS;
    } catch {
      return INITIAL_SLOTS;
    }
  });

  const [classes, setClasses] = useState<ClassScheduled[]>(() => {
    try {
      const raw = localStorage.getItem('ds_classes');
      const local = raw ? JSON.parse(raw) : INITIAL_CLASSES;
      if (!Array.isArray(local)) return INITIAL_CLASSES;
      const missing = INITIAL_CLASSES.filter(c => !local.find((l: any) => l && l.id === c.id));
      return [...local, ...missing];
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>(() => {
    try {
      const raw = localStorage.getItem('ds_reschedule_requests');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [classFeedbacks, setClassFeedbacks] = useState<ClassFeedback[]>(() => {
    try {
      const raw = localStorage.getItem('ds_class_feedbacks');
      const parsed = raw ? JSON.parse(raw) : INITIAL_FEEDBACKS;
      return Array.isArray(parsed) ? parsed : INITIAL_FEEDBACKS;
    } catch {
      return INITIAL_FEEDBACKS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem('ds_notifications');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    try {
      const raw = localStorage.getItem('ds_locations');
      const parsed = raw ? JSON.parse(raw) : INITIAL_LOCATIONS;
      return Array.isArray(parsed) ? parsed : INITIAL_LOCATIONS;
    } catch {
      return INITIAL_LOCATIONS;
    }
  });

  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const raw = localStorage.getItem('ds_schools');
      const parsed = raw ? JSON.parse(raw) : INITIAL_SCHOOLS;
      return Array.isArray(parsed) ? parsed : INITIAL_SCHOOLS;
    } catch {
      return INITIAL_SCHOOLS;
    }
  });

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('ds_trainers', JSON.stringify(trainers));
  }, [trainers]);

  useEffect(() => {
    localStorage.setItem('ds_cohorts', JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    localStorage.setItem('ds_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('ds_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('ds_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('ds_reschedule_requests', JSON.stringify(rescheduleRequests));
  }, [rescheduleRequests]);

  useEffect(() => {
    localStorage.setItem('ds_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ds_class_feedbacks', JSON.stringify(classFeedbacks));
  }, [classFeedbacks]);

  useEffect(() => {
    localStorage.setItem('ds_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('ds_schools', JSON.stringify(schools));
  }, [schools]);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Profile state from localStorage
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }

    let profiles: Record<string, any> = {};
    try {
      const raw = localStorage.getItem('ds_user_profiles');
      profiles = raw ? JSON.parse(raw) : {};
    } catch (e) {
      profiles = {};
    }
    let profile = (profiles && currentUser?.uid) ? profiles[currentUser.uid] || null : null;
    
    // Alias old role to new role for backward compatibility
    if (profile && profile.role === 'Coach' as any) {
      profile.role = 'Instructor';
    }
    
    setUserProfile(profile);
    setIsProfileLoading(false);
  }, [currentUser]);

  const handleRoleSelect = async (role: UserRole, associatedId?: string) => {
    if (!currentUser) return;
    
    const profile: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || 'User',
      photoURL: currentUser.photoURL || undefined,
      role,
      associatedId
    };

    let profiles: Record<string, any> = {};
    try {
      const raw = localStorage.getItem('ds_user_profiles');
      profiles = raw ? JSON.parse(raw) : {};
    } catch (e) {
      profiles = {};
    }
    profiles[currentUser.uid] = profile;
    localStorage.setItem('ds_user_profiles', JSON.stringify(profiles));
    setUserProfile(profile);
  };

  // Trainer Handlers
  const handleAddTrainer = (newTr: Omit<Trainer, 'id'>) => {
    const withId: Trainer = {
      ...newTr,
      id: `tr-${Date.now()}`
    };
    setTrainers([...trainers, withId]);
  };

  const handleEditTrainer = (updatedTr: Trainer) => {
    setTrainers(trainers.map(t => t.id === updatedTr.id ? updatedTr : t));
  };

  const handleDeleteTrainer = (id: string) => {
    setTrainers(trainers.filter(t => t.id !== id));
  };

  // Cohort Handlers
  const handleAddCohort = (newCoh: Omit<Cohort, 'id'>) => {
    const withId: Cohort = {
      ...newCoh,
      id: `coh-${Date.now()}`
    };
    setCohorts([...cohorts, withId]);
    setActiveCohortId(withId.id);
  };

  const handleEditCohortStatus = (id: string, status: CohortStatus) => {
    const cohort = cohorts.find(c => c.id === id);
    if (!cohort) return;
    const updated = { ...cohort, status };
    setCohorts(cohorts.map(c => c.id === id ? updated : c));
  };

  const handleDeleteCohort = (id: string) => {
    setCohorts(cohorts.filter(c => c.id !== id));
  };

  // Availability Slot Handlers
  const handleAddSlots = (newSlots: TrainerAvailabilitySlot[]) => {
    const existingIds = new Set(slots.map(s => s.id));
    const filteredNew = newSlots.filter(s => !existingIds.has(s.id));
    setSlots([...slots, ...filteredNew]);
  };

  const handleUpdateSlotStatus = (slotId: string, status: 'Open' | 'Booked' | 'Unavailable') => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    const updated = { ...slot, status };
    setSlots(slots.map(s => s.id === slotId ? updated : s));
  };

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter(s => s.id !== slotId));
  };

  // Student Profile Handlers
  const handleAddStudent = (newStd: Omit<Student, 'id' | 'age' | 'under18'>) => {
    const birthDate = new Date(newStd.dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    const under18 = calculatedAge < 18;

    const studentWithId: Student = {
      ...newStd,
      id: `std-${Date.now()}`,
      age: calculatedAge,
      under18,
      paidStatus: false,
      completedDrives: {}
    };

    setStudents([...students, studentWithId]);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents(students.map(s => s.id === updated.id ? updated : s));
  };

  const handleUpdateStudentPermit = (studentId: string, permitId: string) => {
    setStudents(students.map(s => s.id === studentId ? { ...s, permitId } : s));
  };

  const handleUpdateClassroomSession = (studentId: string, sessionNumber: number, status: ClassroomSessionStatus) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          classroomSessions: {
            ...(s.classroomSessions || {}),
            [sessionNumber]: status
          }
        };
      }
      return s;
    }));
  };

  const handleImportDemoStudents = () => {
    const currentNames = new Set(students.map(s => s.name));
    const toAdd = INITIAL_STUDENTS.filter(s => !currentNames.has(s.name));
    setStudents([...students, ...toAdd]);
  };

  // Partner match handlers
  const handleApproveMatch = (studentId: string, partnerId: string) => {
    const s1 = students.find(s => s.id === studentId);
    const s2 = students.find(s => s.id === partnerId);
    if (!s1 || !s2) return;

    const s1Updated = { ...s1, existingPartnerId: partnerId };
    const s2Updated = { ...s2, existingPartnerId: studentId };

    setStudents(students.map(s => {
      if (s.id === studentId) return s1Updated;
      if (s.id === partnerId) return s2Updated;
      return s;
    }));
  };

  const handleBreakMatch = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const partnerId = student.existingPartnerId;

    const s1 = students.find(s => s.id === studentId);
    const s2 = partnerId ? students.find(s => s.id === partnerId) : undefined;

    let s1Updated: Student | null = null;
    let s2Updated: Student | null = null;

    if (s1) {
      const { existingPartnerId, ...rest } = s1;
      s1Updated = rest as Student;
    }
    if (s2) {
      const { existingPartnerId, ...rest } = s2;
      s2Updated = rest as Student;
    }

    setStudents(students.map(s => {
      if (s.id === studentId) return s1Updated!;
      if (partnerId && s.id === partnerId) return s2Updated!;
      return s;
    }));
  };

  // Scheduling handlers
  const handleUpdateClass = (updated: ClassScheduled) => {
    setClasses(classes.map(c => c.id === updated.id ? updated : c));
  };

  const handleUpdateClasses = (updatedClasses: ClassScheduled[]) => {
    setClasses(updatedClasses);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  const handleUpdateSlots = (updatedSlots: TrainerAvailabilitySlot[]) => {
    setSlots(updatedSlots);
  };

  const handleAddClasses = (newCls: ClassScheduled[]) => {
    setClasses([...classes, ...newCls]);
  };

  const handleConfirmAllProposed = () => {
    const confirmedList = classes.map(cls => {
      if (cls.cohortId === activeCohortId && cls.status === 'Proposed') {
        return { ...cls, status: 'Confirmed' as const };
      }
      return cls;
    });
    setClasses(confirmedList);
  };

  // Reschedule & Feedback Handlers
  const handleRequestReschedule = (req: Omit<RescheduleRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: RescheduleRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setRescheduleRequests([...rescheduleRequests, newReq]);
  };

  const handleSubmitFeedback = (fb: Omit<ClassFeedback, 'id' | 'createdAt'>) => {
    const newFb: ClassFeedback = {
      ...fb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setClassFeedbacks([...classFeedbacks, newFb]);
  };

  const handleResolveReschedule = (id: string, status: 'Resolved' | 'Declined', chosenSlot?: {date: string, startTime: string, endTime: string}) => {
    setRescheduleRequests(rescheduleRequests.map(r => r.id === id ? { ...r, status } : r));
    
    if (status === 'Resolved' && chosenSlot) {
      const request = rescheduleRequests.find(r => r.id === id);
      if (request) {
        setClasses(classes.map(cls => 
          cls.id === request.classId 
            ? { ...cls, date: chosenSlot.date, startTime: chosenSlot.startTime, endTime: chosenSlot.endTime, status: 'Confirmed' } 
            : cls
        ));

        // Create In-App Notification
        const newNotification: AppNotification = {
          id: `notif-${Date.now()}`,
          userId: request.requesterId,
          title: 'Reschedule Request Approved',
          message: `Your request for session reschedule has been approved for ${chosenSlot.date} at ${chosenSlot.startTime}.`,
          type: 'Success',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications([newNotification, ...notifications]);

        // Simulate Email Notification
        console.log(`Email sent to user associated with ID ${request.requesterId}: Reschedule approved.`);
      }
    } else if (status === 'Declined') {
      const request = rescheduleRequests.find(r => r.id === id);
      if (request) {
        const newNotification: AppNotification = {
          id: `notif-${Date.now()}`,
          userId: request.requesterId,
          title: 'Reschedule Request Declined',
          message: `Your request for session reschedule has been declined by the admin.`,
          type: 'Error',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications([newNotification, ...notifications]);
      }
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleResetWorkflow = () => {
    localStorage.clear();
    setTrainers(INITIAL_TRAINERS);
    setCohorts(INITIAL_COHORTS);
    setStudents(INITIAL_STUDENTS);
    setSlots(INITIAL_SLOTS);
    setClasses(INITIAL_CLASSES);
    setLocations(INITIAL_LOCATIONS);
    setSchools(INITIAL_SCHOOLS);
    setRescheduleRequests([]);
    setClassFeedbacks(INITIAL_FEEDBACKS);
    setNotifications([]);
    setActiveCohortId('coh-june-2026');
    setActiveTab('dashboard');
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Environment...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showSignup) {
      return (
        <Signup 
          onBack={() => setShowSignup(false)} 
          cohorts={cohorts} 
          students={students} 
          locations={locations}
          schools={schools}
        />
      );
    }
    return <Login onShowSignup={() => setShowSignup(true)} />;
  }

  if (!userProfile) {
    return <RoleSelection onSelect={handleRoleSelect} students={students} trainers={trainers} />;
  }

  // Instructor Specific Dashboard
  if (userProfile.role === 'Instructor') {
    return (
      <InstructorDashboard 
        userProfile={userProfile}
        trainers={trainers}
        cohorts={cohorts}
        students={students}
        classes={classes}
        slots={slots}
        locations={locations}
        schools={schools}
        rescheduleRequests={rescheduleRequests}
        classFeedbacks={classFeedbacks}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onAddSlots={handleAddSlots}
        onUpdateSlotStatus={handleUpdateSlotStatus}
        onDeleteSlot={handleDeleteSlot}
        onRequestReschedule={handleRequestReschedule}
        onUpdateClass={handleUpdateClass}
        onSubmitFeedback={handleSubmitFeedback}
        onUpdateClasses={handleUpdateClasses}
        onDeleteClass={handleDeleteClass}
        onUpdateSlots={handleUpdateSlots}
        onAddClasses={handleAddClasses}
        onConfirmAllProposed={handleConfirmAllProposed}
      />
    );
  }

  // Student Specific Dashboard
  if (userProfile.role === 'Student') {
    return (
      <StudentDashboard 
        userProfile={userProfile}
        students={students}
        classes={classes}
        trainers={trainers}
        cohorts={cohorts}
        slots={slots}
        rescheduleRequests={rescheduleRequests}
        classFeedbacks={classFeedbacks}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onUpdatePermitId={handleUpdateStudentPermit}
        onApproveMatch={handleApproveMatch}
        onBreakMatch={handleBreakMatch}
        onRequestReschedule={handleRequestReschedule}
        onSubmitFeedback={handleSubmitFeedback}
      />
    );
  }

  // Parent Specific Dashboard
  if (userProfile.role === 'Parent') {
    return (
      <ParentDashboard 
        userProfile={userProfile}
        students={students}
        classes={classes}
        trainers={trainers}
        cohorts={cohorts}
        slots={slots}
        rescheduleRequests={rescheduleRequests}
        classFeedbacks={classFeedbacks}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onApproveMatch={handleApproveMatch}
        onBreakMatch={handleBreakMatch}
        onRequestReschedule={handleRequestReschedule}
      />
    );
  }

  // Admin Dashboard (Original Tab-based UI)
  if (userProfile.role === 'Admin') {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-950 w-full">
      
      {/* Top Header - Luxurious glassmorphism visual style */}
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
              <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-widest leading-none">Driving School Admin Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar Toggle Menu Icon Button - Mobile Only */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50/80 rounded-xl transition cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-2xs hover:border-indigo-200 shrink-0"
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={18} />
            </button>
            {/* Status indicator badge - hidden on very small screens */}
            <div className={`hidden xs:flex text-[9px] sm:text-[10px] uppercase tracking-wider font-black px-2 sm:px-3 py-1.5 rounded-lg border items-center gap-2 transition-all duration-300 ${
              currentUser 
                ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60 shadow-xs' 
                : 'bg-slate-100 text-slate-500 border-slate-200/80'
            }`}>
              <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="hidden sm:inline">{currentUser ? 'Cloud Active' : 'Sandbox'}</span>
              <span className="sm:hidden">{currentUser ? 'Cloud' : 'Sandbox'}</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-2.5 border-l border-slate-200 pl-3">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || 'user'} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-indigo-500/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase shadow-xs">
                    {(currentUser.displayName || currentUser.email || 'U').slice(0, 1)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-none text-slate-900">{currentUser.displayName || 'Authorized'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">{currentUser.email}</p>
                </div>
                {/* Mobile: Logout Icon Only */}
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } catch (err) {
                      console.error("Sign out fail:", err);
                    }
                  }}
                  className="md:hidden p-2 text-slate-500 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl cursor-pointer transition flex items-center justify-center shadow-2xs"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>

                {/* Desktop: Logout Text + Icon Button */}
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } catch (err) {
                      console.error("Sign out fail:", err);
                    }
                  }}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl cursor-pointer transition shadow-2xs"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithPopup(auth, googleProvider);
                  } catch (err) {
                    console.error("Sign in failed:", err);
                  }
                }}
                className="text-[10px] sm:text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10 hover:shadow-md hover:shadow-indigo-600/20"
              >
                <Sparkles size={11} className="text-purple-200" />
                <span className="hidden sm:inline">Connect Cloud DB</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            <button
              onClick={handleResetWorkflow}
              className="hidden sm:block text-xs bg-white hover:bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer hover:border-slate-300"
              title="Populate demo entities in memory or cloud"
            >
              Reset Demos
            </button>
          </div>
        </div>

        {/* Mobile View: Dynamic 3rd Slot + More Dropdown embedded inside sticky header */}
        <div className="sm:hidden border-t border-slate-100/80 px-3 py-1.5 bg-slate-50/90 backdrop-blur-md">
          <div className="bg-[#f0f4ff] p-1 rounded-xl border border-indigo-100/90 flex items-center justify-between shadow-xs">
            {/* Overview Tab */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <BarChart2 size={14} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Overview</span>
            </button>

            {/* Cohorts Tab */}
            <button
              onClick={() => { setActiveTab('cohorts'); setIsMoreMenuOpen(false); }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                activeTab === 'cohorts'
                  ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <GraduationCap size={14} className={activeTab === 'cohorts' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Cohorts</span>
            </button>

            {/* Dynamic Third Place Tab & More Dropdown */}
            {(() => {
              const allMoreTabs = [
                { id: 'students', label: 'Students', icon: Users },
                { id: 'reschedule', label: 'Reschedule', icon: MessageSquare, badge: rescheduleRequests.filter(r => r.status === 'Pending').length },
                { id: 'trainers', label: 'Instructors', icon: User },
                { id: 'availability', label: 'Availability', icon: Clock },
                { id: 'cohort-calendar', label: 'Calendar', icon: Calendar },
                { id: 'theory', label: 'Class Feedback', icon: BookOpen },
                { id: 'matching', label: 'Partner Match', icon: Sparkles },
                { id: 'scheduling', label: 'Scheduler', icon: Calendar },
              ];

              const currentThirdTab = allMoreTabs.find(t => t.id === thirdTabId) || allMoreTabs[0];
              const ThirdIcon = currentThirdTab.icon;
              const isThirdActive = activeTab === currentThirdTab.id;
              const dropdownTabs = allMoreTabs.filter(t => t.id !== currentThirdTab.id);
              const hasMorePendingBadge = dropdownTabs.some(t => t.badge && t.badge > 0);

              return (
                <>
                  <button
                    onClick={() => { setActiveTab(currentThirdTab.id); setIsMoreMenuOpen(false); }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer border ${
                      isThirdActive
                        ? 'bg-white text-indigo-600 shadow-xs border-indigo-100/90'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <ThirdIcon size={14} className={isThirdActive ? 'text-indigo-600' : 'text-slate-500'} />
                    <span className="truncate max-w-[65px]">{currentThirdTab.label}</span>
                    {currentThirdTab.badge && currentThirdTab.badge > 0 ? (
                      <span className={`text-[8px] font-black px-1 py-0.1 rounded-full ${isThirdActive ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-500 text-white'}`}>
                        {currentThirdTab.badge}
                      </span>
                    ) : null}
                  </button>

                  {/* More Dropdown Tab */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="w-full py-1.5 px-1.5 rounded-lg text-xs font-bold border border-transparent flex items-center justify-center gap-1 transition duration-150 cursor-pointer text-slate-600 hover:text-slate-900"
                    >
                      <span>More</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''} text-slate-500`} />
                      {hasMorePendingBadge && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse ml-0.5"></span>
                      )}
                    </button>

                    {/* Dropdown menu */}
                    {isMoreMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in duration-150 space-y-0.5">
                          {dropdownTabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setIsMoreMenuOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer text-slate-700 hover:bg-slate-50"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon size={15} className="text-slate-400" />
                                  <span>{tab.label}</span>
                                </div>
                                {tab.badge && tab.badge > 0 ? (
                                  <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    {tab.badge}
                                  </span>
                                ) : null}
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2 sm:py-6 flex-1 w-full flex flex-col gap-3 sm:gap-6">

        {/* Desktop View Navigation Bar */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#f0f4ff] p-1.5 rounded-xl border border-indigo-100/90 shadow-xs overflow-x-auto tab-scroll whitespace-nowrap">
          {[
            { id: 'dashboard', label: 'Overview', icon: BarChart2 },
            { id: 'reschedule', label: 'Reschedule', icon: MessageSquare, badge: rescheduleRequests.filter(r => r.status === 'Pending').length },
            { id: 'trainers', label: 'Instructors', icon: User },
            { id: 'cohorts', label: 'Cohorts', icon: GraduationCap },
            { id: 'availability', label: 'Availability', icon: Clock },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'cohort-calendar', label: 'Calendar', icon: Calendar },
            { id: 'theory', label: 'Class Feedback', icon: BookOpen },
            { id: 'matching', label: 'Partner Match', icon: Sparkles },
            { id: 'scheduling', label: 'Scheduler', icon: Calendar }
          ].map(tab => {
            const Icon = (tab as any).icon;
            const isActive = activeTab === tab.id;
            const badgeCount = (tab as any).badge;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer min-h-[34px] relative touch-press shrink-0 ${
                  isActive 
                    ? 'text-indigo-600 z-10' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktopActiveTabBg"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-indigo-100/90 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                <span>{tab.label}</span>
                {badgeCount > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-500 text-white'}`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab workspaces render with smooth motion transition */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="w-full h-full flex flex-col flex-1 min-h-0"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  students={students}
                  trainers={trainers}
                  cohorts={cohorts}
                  slots={slots}
                  classes={classes}
                  rescheduleRequests={rescheduleRequests}
                  classFeedbacks={classFeedbacks}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  setActiveTab={setActiveTab}
                  onApproveMatch={handleApproveMatch}
                  onResolveReschedule={handleResolveReschedule}
                />
              )}

              {activeTab === 'trainers' && (
                <TrainerManagement 
                  trainers={trainers}
                  classes={classes}
                  onAddTrainer={handleAddTrainer}
                  onEditTrainer={handleEditTrainer}
                  onDeleteTrainer={handleDeleteTrainer}
                />
              )}

              {activeTab === 'cohorts' && (
                <CohortManagement 
                  cohorts={cohorts}
                  trainers={trainers}
                  students={students}
                  onAddCohort={handleAddCohort}
                  onEditCohortStatus={handleEditCohortStatus}
                  onDeleteCohort={handleDeleteCohort}
                />
              )}

              {activeTab === 'availability' && (
                <TrainerAvailabilityCalendar 
                  slots={slots}
                  classes={classes}
                  trainers={trainers}
                  cohorts={cohorts}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  onAddSlots={handleAddSlots}
                  onUpdateSlotStatus={handleUpdateSlotStatus}
                  onDeleteSlot={handleDeleteSlot}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onRequestReschedule={handleRequestReschedule}
                  userProfile={userProfile}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'students' && (
                <StudentManagement 
                  students={students}
                  cohorts={cohorts}
                  locations={locations}
                  schools={schools}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onImportDemoStudents={handleImportDemoStudents}
                />
              )}

              {activeTab === 'cohort-calendar' && (
                <CohortDriveCalendar 
                  cohorts={cohorts}
                  students={students}
                  trainers={trainers}
                  classes={classes}
                  slots={slots}
                  locations={locations}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onAddClasses={handleAddClasses}
                  onUpdateSlots={handleUpdateSlots}
                />
              )}

              {activeTab === 'matching' && (
                <PartnerMatching 
                  students={students}
                  locations={locations}
                  schools={schools}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  cohorts={cohorts}
                  onApproveMatch={handleApproveMatch}
                  onBreakMatch={handleBreakMatch}
                />
              )}

              {activeTab === 'theory' && (
                <TheoryFeedback 
                  students={students}
                  cohorts={cohorts}
                  activeCohortId={activeCohortId}
                  setActiveCohortId={setActiveCohortId}
                  onUpdateClassroomSession={handleUpdateClassroomSession}
                />
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
                  onUpdateClasses={handleUpdateClasses}
                  onUpdateSlots={handleUpdateSlots}
                  onAddClasses={handleAddClasses}
                  onConfirmAllProposed={handleConfirmAllProposed}
                />
              )}

              {activeTab === 'reschedule' && (
                <RescheduleRequests 
                  requests={rescheduleRequests}
                  classes={classes}
                  trainers={trainers}
                  students={students}
                  cohorts={cohorts}
                  onUpdateStatus={handleResolveReschedule}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Mobile Bottom Navigation Bar - Fixed on mobile viewport */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[11] bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-1 pt-1.5 pb-[calc(1.4rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none"
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
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer min-h-[44px] touch-press relative font-bold ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'dashboard' && (
            <motion.div
              layoutId="mobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <BarChart2 size={18} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('reschedule')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'reschedule' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'reschedule' && (
            <motion.div
              layoutId="mobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative">
            <MessageSquare size={18} className={activeTab === 'reschedule' ? 'text-indigo-600' : 'text-slate-400'} />
            {rescheduleRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {rescheduleRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 leading-none">Requests</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'students' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'students' && (
            <motion.div
              layoutId="mobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Users size={18} className={activeTab === 'students' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Students</span>
        </button>

        <button
          onClick={() => setActiveTab('cohort-calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] touch-press font-bold ${
            activeTab === 'cohort-calendar' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          {activeTab === 'cohort-calendar' && (
            <motion.div
              layoutId="mobileBottomBarIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-indigo-600 rounded-full shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Calendar size={18} className={activeTab === 'cohort-calendar' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[9px] mt-0.5 leading-none">Calendar</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer text-slate-500 font-bold min-h-[44px] touch-press"
        >
          <Menu size={18} className="text-slate-600" />
          <span className="text-[9px] mt-0.5 leading-none">All Views</span>
        </button>
      </div>

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
                  <p className="text-[8px] sm:text-[9px] text-[#7C3AED] font-extrabold uppercase tracking-widest leading-none mt-1">Driving School Admin Suite</p>
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
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation Menu</div>
              {[
                { id: 'dashboard', label: 'Overview', icon: BarChart2, desc: 'Metrics & Stats' },
                { id: 'reschedule', label: 'Reschedule Requests', icon: MessageSquare, badge: rescheduleRequests.filter(r => r.status === 'Pending').length, desc: 'Student Requests' },
                { id: 'trainers', label: 'Instructors', icon: User, desc: 'Staff Profiles' },
                { id: 'cohorts', label: 'Cohorts', icon: GraduationCap, desc: 'Programs & Batches' },
                { id: 'availability', label: 'Instructor Availability', icon: Clock, desc: 'Slot Management' },
                { id: 'students', label: 'Students Roster', icon: Users, desc: 'Student Permits' },
                { id: 'cohort-calendar', label: 'Cohort Calendar', icon: Calendar, desc: 'Monthly Drives' },
                { id: 'theory', label: 'Class Feedback', icon: BookOpen, desc: 'Ratings & Reviews' },
                { id: 'matching', label: 'Partner Match', icon: Sparkles, desc: 'Drive Partner Pairs' },
                { id: 'scheduling', label: 'Auto Scheduler', icon: Calendar, desc: 'Smart Allocator' }
              ].map(tab => {
                const Icon = (tab as any).icon;
                const isActive = activeTab === tab.id;
                const badgeCount = (tab as any).badge;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
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
                    {badgeCount > 0 && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'}`}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar Bottom User Info / Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              {currentUser ? (
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-indigo-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center text-xs">
                      {(currentUser.displayName || currentUser.email || 'A').slice(0, 1)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{currentUser.displayName || 'Admin User'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">System Admin</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-semibold">SteerSafe Admin Suite</div>
              )}
              
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                title="Collapse Sidebar"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Humble Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-3 sm:py-4 px-4 mt-6 sm:mt-auto text-center text-[10px] sm:text-xs text-[#6B7280] font-bold uppercase tracking-wider shrink-0 mb-24 md:mb-0 shadow-2xs">
        SteerSafe Scheduling • Precision Automated Workflow Engine
      </footer>

    </div>
    );
  }

  // Fallback for unauthorized or unknown roles
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
        <Shield size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
      <p className="text-slate-500 font-medium mb-8 max-w-sm">
        Your account role "{userProfile.role}" does not have a designated dashboard or your session has expired.
      </p>
      <button 
        onClick={() => {
          localStorage.removeItem('ds_user_profiles'); // Clear profiles to force re-selection
          signOut(auth);
        }}
        className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-indigo-600 transition-colors shadow-lg"
      >
        Sign Out & Re-verify Role
      </button>
    </div>
  );
}
