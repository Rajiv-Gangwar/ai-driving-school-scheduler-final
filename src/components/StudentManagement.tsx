import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  ClipboardCheck, 
  Sparkles, 
  MapPin, 
  School as SchoolIcon,
  X,
  CreditCard,
  CheckCircle2,
  Circle,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { Student, Cohort, Location, School } from '../types';

interface StudentManagementProps {
  students: Student[];
  cohorts: Cohort[];
  locations: Location[];
  schools: School[];
  activeCohortId: string;
  setActiveCohortId?: (id: string) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'age' | 'under18'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onImportDemoStudents: () => void;
}

export default function StudentManagement({
  students,
  cohorts,
  locations,
  schools,
  activeCohortId,
  setActiveCohortId,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportDemoStudents
}: StudentManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [permitId, setPermitId] = useState('');
  const [dob, setDob] = useState('2009-08-15');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parent2Name, setParent2Name] = useState('');
  const [parent2Phone, setParent2Phone] = useState('');
  const [parent2Email, setParent2Email] = useState('');
  const [cohortId, setCohortId] = useState(activeCohortId || cohorts[0]?.id || '');
  const [schoolId, setSchoolId] = useState(schools[0]?.id || '');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [paidStatus, setPaidStatus] = useState(false);
  
  // Filtering
  const [filterCohortId, setFilterCohortId] = useState<string>(activeCohortId || cohorts[0]?.id || '');
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);

  // Form Dropdowns
  const [isFormCohortOpen, setIsFormCohortOpen] = useState(false);
  const [isFormLocationOpen, setIsFormLocationOpen] = useState(false);
  const [isFormSchoolOpen, setIsFormSchoolOpen] = useState(false);

  // Keep form default cohort synchronized
  React.useEffect(() => {
    if (activeCohortId) {
      setCohortId(activeCohortId);
      setFilterCohortId(activeCohortId);
    } else if (!filterCohortId && cohorts.length > 0) {
      setFilterCohortId(cohorts[0].id);
    }
  }, [activeCohortId, cohorts]);

  const displayedStudents = students.filter(student => {
    if (filterCohortId === 'all') return true;
    return student.cohortId === filterCohortId;
  });
  
  // Availability Day choices
  const [availDays, setAvailDays] = useState<string[]>(['Monday', 'Wednesday', 'Saturday']);
  // Preference choices
  const [availTimes, setAvailTimes] = useState<string[]>(['4 PM to 6 PM', 'Saturday morning']);
  
  // Custom blocks list
  const [blockDate, setBlockDate] = useState('');
  const [blockedDatesList, setBlockedDatesList] = useState<string[]>([]);
  
  const [formError, setFormError] = useState('');

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const prefTimes = ['4 PM to 6 PM', '6 PM to 8 PM', 'Saturday morning', 'Saturday afternoon'];

  const toggleDay = (day: string) => {
    if (availDays.includes(day)) {
      setAvailDays(availDays.filter(d => d !== day));
    } else {
      setAvailDays([...availDays, day]);
    }
  };

  const toggleTime = (time: string) => {
    if (availTimes.includes(time)) {
      setAvailTimes(availTimes.filter(t => t !== time));
    } else {
      setAvailTimes([...availTimes, time]);
    }
  };

  const handleAddBlockedDate = () => {
    if (blockDate && !blockedDatesList.includes(blockDate)) {
      setBlockedDatesList([...blockedDatesList, blockDate]);
      setBlockDate('');
    }
  };

  const handleRemoveBlockedDate = (target: string) => {
    setBlockedDatesList(blockedDatesList.filter(d => d !== target));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Student name is required.');
      return;
    }

    // Determine age to verify if under-18 rules are satisfied
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    const under18 = calculatedAge < 18;
    
    if (calculatedAge < 14) {
      setFormError("Student must be at least 14 years old to enroll.");
      return;
    }

    if (under18 && !parentName.trim()) {
      setFormError('Teens under 18 require a parental supervisor name.');
      return;
    }

    onAddStudent({
      name,
      dateOfBirth: dob,
      phone,
      email,
      parentName: parentName.trim() ? parentName : undefined,
      parentPhone: parentPhone.trim() ? parentPhone : undefined,
      parentEmail: parentEmail.trim() ? parentEmail : undefined,
      parent2Name: parent2Name.trim() ? parent2Name : undefined,
      parent2Phone: parent2Phone.trim() ? parent2Phone : undefined,
      parent2Email: parent2Email.trim() ? parent2Email : undefined,
      cohortId,
      schoolId,
      locationId,
      partnerRequired: under18, // true by default for under 18
      availabilityDays: availDays,
      availabilityTimeRanges: availTimes,
      blockedDates: blockedDatesList,
      blockedTimes: [],
      notes: '',
      permitId: permitId || undefined,
      paidStatus,
      completedDrives: {}
    });

    setIsAdding(false);
    // Reset Form
    setName('');
    setPermitId('');
    setDob('2009-08-15');
    setPhone('');
    setEmail('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setParent2Name('');
    setParent2Phone('');
    setParent2Email('');
    setBlockedDatesList([]);
    setPaidStatus(false);
    setFormError('');
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Student Center</h2>
          <p className="text-xs text-[#6B7280]">Configure driving lesson preferences, supervisor lists, and completion status.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick Demo Preloads */}
          <button
            onClick={onImportDemoStudents}
            className="flex-1 sm:flex-initial bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] border border-[#E5E7EB] px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap active:scale-95"
            title="Pre-populate students for automated partner scoring demos."
          >
            <Sparkles size={14} className="shrink-0 text-indigo-600" />
            <span>Preload Test Students</span>
          </button>
          
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 sm:flex-initial bg-[#111827] hover:bg-gray-800 text-white px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus size={15} className="shrink-0" />
            <span>{isAdding ? 'Hide Editor' : 'Register Student'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Adding Form Block */}
        {isAdding && (
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs h-fit space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <ClipboardCheck className="text-[#111827]" size={16} />
                Register New Student
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1.5 text-[#6B7280] md:hidden hover:text-[#111827] hover:bg-slate-100 rounded-lg transition cursor-pointer active:scale-95"
                title="Close Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-750 text-[11px] font-semibold rounded-lg border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">STUDENT NAME *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mike Wheeler"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#111827]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">LEARNER PERMIT ID (OPTIONAL)</label>
                  <input
                    type="text"
                    value={permitId}
                    onChange={(e) => setPermitId(e.target.value)}
                    placeholder="e.g. PER-12345678"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#111827]"
                  />
                </div>
              </div>

              {/* Birthdate and Cohort */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">BIRTHDATE</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] cursor-pointer focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">COHORT</label>
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormCohortOpen(!isFormCohortOpen);
                        setIsFormLocationOpen(false);
                        setIsFormSchoolOpen(false);
                      }}
                      className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full cursor-pointer shadow-xs text-left"
                    >
                      <span className="text-xs font-extrabold text-slate-800 truncate">
                        {cohorts.find(c => c.id === cohortId)?.name || 'Select Cohort'}
                      </span>
                      <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isFormCohortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isFormCohortOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsFormCohortOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select Cohort</span>
                              <span className="text-indigo-600 font-bold">{cohorts.length} available</span>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                              {cohorts.map(c => {
                                const isActive = c.id === cohortId;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setCohortId(c.id);
                                      setIsFormCohortOpen(false);
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
              </div>

              {/* Paid Enrolment Card with Toggle */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
                    <CreditCard size={16} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Paid Enrolment</span>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      {paidStatus ? 'Payment Confirmed / Enrolled' : 'Pending Tuition Payment'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPaidStatus(!paidStatus)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    paidStatus ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  aria-pressed={paidStatus}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      paidStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Parent / Guardian Contacts Section (Step 3 Structure in One Card) */}
              <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                    Parent / Guardian Contacts
                  </span>
                </div>

                {/* Primary Parent / Guardian */}
                <div className="p-3 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <span className="text-[10px] font-black text-amber-900/90 uppercase tracking-wider block">
                    Primary Parent / Guardian
                  </span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        placeholder="parent@example.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Parent / Guardian (Optional) */}
                <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                      Secondary Parent / Guardian <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Robert Doe"
                      value={parent2Name}
                      onChange={(e) => setParent2Name(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={parent2Phone}
                        onChange={(e) => setParent2Phone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        placeholder="parent2@example.com"
                        value={parent2Email}
                        onChange={(e) => setParent2Email(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Region & High School/Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">LOCATION REGION</label>
                  <div className="relative z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormLocationOpen(!isFormLocationOpen);
                        setIsFormCohortOpen(false);
                        setIsFormSchoolOpen(false);
                      }}
                      className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full cursor-pointer shadow-xs text-left"
                    >
                      <span className="text-xs font-extrabold text-slate-800 truncate">
                        {locations.find(l => l.id === locationId)?.name || 'Select Location'}
                      </span>
                      <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isFormLocationOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isFormLocationOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsFormLocationOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select Location Region</span>
                              <span className="text-indigo-600 font-bold">{locations.filter(l => l.active).length} available</span>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                              {locations.filter(l => l.active).map(l => {
                                const isActive = l.id === locationId;
                                return (
                                  <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => {
                                      setLocationId(l.id);
                                      setIsFormLocationOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                      isActive
                                        ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                    }`}
                                  >
                                    <span className="truncate">{l.name}</span>
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

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">HIGH SCHOOL/CAMPUS</label>
                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormSchoolOpen(!isFormSchoolOpen);
                        setIsFormCohortOpen(false);
                        setIsFormLocationOpen(false);
                      }}
                      className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full cursor-pointer shadow-xs text-left"
                    >
                      <span className="text-xs font-extrabold text-slate-800 truncate">
                        {schools.find(s => s.id === schoolId)?.name || 'No school / adult'}
                      </span>
                      <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isFormSchoolOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isFormSchoolOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsFormSchoolOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                              <span>Select High School/Campus</span>
                              <span className="text-indigo-600 font-bold">{schools.filter(s => s.active).length + 1} options</span>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSchoolId('');
                                  setIsFormSchoolOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                  schoolId === ''
                                    ? 'bg-indigo-50/90 text-indigo-700 font-extrabold border border-indigo-100/80 shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="truncate">No school / adult</span>
                                {schoolId === '' && <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />}
                              </button>

                              {schools.filter(s => s.active).map(s => {
                                const isActive = s.id === schoolId;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      setSchoolId(s.id);
                                      setIsFormSchoolOpen(false);
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
                </div>
              </div>

              {/* Day preferences checkboxes */}
              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">AVAILABLE DAYS</label>
                <div className="flex flex-wrap gap-1">
                  {weekdays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${availDays.includes(day) ? 'bg-[#111827] text-white' : 'bg-gray-100 border border-[#E5E7EB] text-gray-500 hover:bg-gray-200'}`}
                    >
                      {day.substring(0,3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocked Dates list builder */}
              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">DATES BLOCKOUTS (EXCLUSIONS)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#111827] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#111827]"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="bg-[#111827] hover:bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                  >
                    Blockout
                  </button>
                </div>
                {blockedDatesList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {blockedDatesList.map(d => (
                      <span key={d} className="bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-100">
                        {d}
                        <Trash2 size={10} className="cursor-pointer text-red-550 hover:text-red-750" onClick={() => handleRemoveBlockedDate(d)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
              >
                Assemble Profile
              </button>
            </form>
          </div>
        )}

      {/* Profiles View */}
      <div className={`${isAdding ? 'lg:col-span-2' : 'col-span-full'} space-y-4`}>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Driving Students ({displayedStudents.length})
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] shrink-0">Cohort:</span>
              <div className="relative z-40 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
                  className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 active:scale-98 transition-all duration-150 px-3 py-1.5 rounded-xl border border-indigo-200/90 w-full sm:w-auto cursor-pointer shadow-xs text-left"
                >
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {cohorts.find(c => c.id === filterCohortId)?.name || cohorts[0]?.name || 'Select Cohort'}
                  </span>
                  <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ${isCohortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCohortDropdownOpen && (
                    <>
                      {/* Backdrop to close on click outside */}
                      <div 
                        className="fixed inset-0 z-50" 
                        onClick={() => setIsCohortDropdownOpen(false)} 
                      />

                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-[60] overflow-hidden"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                          <span>Select Program Cohort</span>
                          <span className="text-indigo-600 font-bold">{cohorts.length} available</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                          {cohorts.map(c => {
                            const isActive = c.id === filterCohortId;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setFilterCohortId(c.id);
                                  if (setActiveCohortId) {
                                    setActiveCohortId(c.id);
                                  }
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
          </div>

          {/* Table for Desktop, Cards for Mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] text-[#6B7280] uppercase font-bold border-b border-[#E5E7EB]">
                  <th className="p-3">Student & Age</th>
                  <th className="p-3">Paid Status</th>
                  <th className="p-3">School / Location</th>
                  <th className="p-3 text-center">Student Type</th>
                  <th className="p-3 text-center">Drive Completion</th>
                  <th className="p-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#4B5563] font-semibold">
                {displayedStudents.map(std => {
                  const schoolName = schools.find(s => s.id === std.schoolId)?.name || 'N/A (Adult)';
                  const locName = locations.find(l => l.id === std.locationId)?.name || 'Unset area';
                  const completedCount = Object.values(std.completedDrives || {}).filter(v => v).length;
                  const targetCount = std.under18 ? 6 : 3; // Teens: 6 sessions (12h), Adults/Solo: 3 sessions (6h)

                  return (
                    <tr key={std.id} className="hover:bg-[#F9FAFB]/50 transition-colors cursor-pointer group" onClick={() => setSelectedStudentId(std.id)}>
                      <td className="p-3 space-y-0.5 max-w-[170px]">
                        <div className="font-bold text-[#111827] group-hover:text-indigo-600 truncate" title={std.name}>{std.name}</div>
                        <div className="text-[10px] text-[#6B7280]">
                          Age {std.age} • DOB: {std.dateOfBirth}
                        </div>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStudent({ ...std, paidStatus: !std.paidStatus });
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                            std.paidStatus 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}
                        >
                          {std.paidStatus ? <CheckCircle2 size={12} /> : <X size={12} />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{std.paidStatus ? 'Paid' : 'Unpaid'}</span>
                        </button>
                      </td>

                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-[#111827] font-bold truncate" title={schoolName}>
                          <SchoolIcon size={12} className="text-gray-500 shrink-0" />
                          {schoolName}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#6B7280] truncate" title={locName}>
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          {locName}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {std.under18 ? (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                            Teen
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-[#4B5563] text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                            Adult
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-0.5">
                            {Array.from({ length: targetCount }, (_, i) => i + 1).map(i => (
                              <div 
                                key={i} 
                                className={`w-1 h-1 rounded-full ${std.completedDrives?.[i] ? 'bg-emerald-500' : 'bg-slate-200'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{completedCount}/{targetCount}</span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStudent(std.id);
                          }}
                          className="p-1 text-[#6B7280] hover:text-red-650 rounded-md hover:bg-gray-100 transition cursor-pointer"
                          title="Remove Student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {displayedStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-450 hover:bg-transparent">
                      No students enrolled in this cohort yet. Tap "Register Student" or switch to "All Cohorts".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile */}
          <div className="sm:hidden divide-y divide-gray-100">
            {displayedStudents.map(std => {
              const schoolName = schools.find(s => s.id === std.schoolId)?.name || 'N/A (Adult)';
              const locName = locations.find(l => l.id === std.locationId)?.name || 'Unset area';
              return (
                <div key={std.id} className="p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#111827] text-sm truncate">{std.name}</h4>
                      <p className="text-[10px] text-[#6B7280]">Age {std.age} • DOB: {std.dateOfBirth}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {std.under18 ? (
                        <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200/60">
                          Teen
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-[#4B5563] text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200/60">
                          Adult
                        </span>
                      )}

                      {/* Delete Icon right next to badge on mobile screens (like Cohorts delete icon) */}
                      <button
                        type="button"
                        onClick={() => onDeleteStudent(std.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200/80 transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                        title="Remove Student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {std.permitId && (
                    <div>
                      <span className="font-mono text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        Permit: {std.permitId}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#111827] font-bold">
                        <SchoolIcon size={11} className="text-gray-400 shrink-0" />
                        <span className="truncate">{schoolName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="truncate">{locName}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-right space-y-1">
                      <p className="text-slate-500">Days: {std.availabilityDays.map(d => d.substring(0,3)).join(', ')}</p>
                      {std.blockedDates.length > 0 && <p className="text-red-600 font-bold">{std.blockedDates.length} Blocked</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            {displayedStudents.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                No students enrolled in this cohort yet.
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* Student Detail Modal / Completion Status */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStudentId(null)} />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black mb-1">{selectedStudent.name}</h3>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Enrollment Details & Completion Status</p>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paid Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedStudent.paidStatus ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-sm font-bold text-slate-900">{selectedStudent.paidStatus ? 'Full Paid' : 'Pending Payment'}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Permit ID</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{selectedStudent.permitId || 'Not Provided'}</span>
                </div>
              </div>

              {/* Parent / Guardian Contacts Info */}
              {(selectedStudent.parentName || selectedStudent.parent2Name) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Parent / Guardian Contacts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedStudent.parentName && (
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 block">Primary Parent / Guardian</span>
                        <p className="text-xs font-bold text-slate-900">{selectedStudent.parentName}</p>
                        {selectedStudent.parentPhone && <p className="text-[11px] text-slate-600">📞 {selectedStudent.parentPhone}</p>}
                        {selectedStudent.parentEmail && <p className="text-[11px] text-slate-600">✉️ {selectedStudent.parentEmail}</p>}
                      </div>
                    )}
                    {selectedStudent.parent2Name && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">Secondary Parent (Optional)</span>
                        <p className="text-xs font-bold text-slate-900">{selectedStudent.parent2Name}</p>
                        {selectedStudent.parent2Phone && <p className="text-[11px] text-slate-600">📞 {selectedStudent.parent2Phone}</p>}
                        {selectedStudent.parent2Email && <p className="text-[11px] text-slate-600">✉️ {selectedStudent.parent2Email}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Tracker */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardCheck size={16} className="text-rose-600" />
                    Theory Module Progress (1-12)
                  </h4>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    {Object.values(selectedStudent.classroomSessions || {}).filter(v => v === 'Complete').length} / 12 Complete
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(modNum => {
                    const isDone = selectedStudent.classroomSessions?.[modNum] === 'Complete';
                    return (
                      <button
                        key={modNum}
                        onClick={() => {
                          const newSessions = { ...(selectedStudent.classroomSessions || {}) };
                          newSessions[modNum] = isDone ? 'Needs to Complete' : 'Complete';
                          onUpdateStudent({ ...selectedStudent, classroomSessions: newSessions });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                          isDone 
                            ? 'bg-rose-50 border-rose-200 text-rose-900' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest mb-1">M{modNum}</span>
                        {isDone ? <CheckCircle2 size={12} className="text-rose-500" /> : <Circle size={12} className="text-slate-200" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    Driving Session Progress (1-{selectedStudent.under18 ? 6 : 3})
                  </h4>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    {Object.values(selectedStudent.completedDrives || {}).filter(v => v).length} / {selectedStudent.under18 ? 6 : 3} Complete
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: selectedStudent.under18 ? 6 : 3 }, (_, i) => i + 1).map(driveNum => {
                    const isDone = selectedStudent.completedDrives?.[driveNum];
                    return (
                      <button
                        key={driveNum}
                        onClick={() => {
                          const newCompleted = { ...(selectedStudent.completedDrives || {}) };
                          newCompleted[driveNum] = !isDone;
                          onUpdateStudent({ ...selectedStudent, completedDrives: newCompleted });
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest mb-1">Drive {driveNum}</span>
                        {isDone ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-200" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setSelectedStudentId(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
