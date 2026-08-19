import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Car,
  ChevronRight,
  Search,
  Trash2
} from 'lucide-react';
import { 
  auth, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { Cohort, Student, UserProfile, Location, School } from '../types';

interface SignupProps {
  onBack: () => void;
  cohorts: Cohort[];
  students: Student[];
  locations: Location[];
  schools: School[];
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Signup({ onBack, cohorts, students, locations, schools }: SignupProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    age: 0,
    phone: '',
    availabilityDays: ['Monday', 'Wednesday', 'Saturday'] as string[],
    blockedDates: [] as string[],
    cohortId: '',
    locationId: '',
    schoolId: '',
    partnerName: '',
    partnerId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parent2Name: '',
    parent2Phone: '',
    parent2Email: '',
  });

  const [blockDate, setBlockDate] = useState('');

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const current = prev.availabilityDays || [];
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day];
      return { ...prev, availabilityDays: updated };
    });
  };

  const handleAddBlockedDate = () => {
    if (blockDate && !formData.blockedDates.includes(blockDate)) {
      setFormData(prev => ({
        ...prev,
        blockedDates: [...prev.blockedDates, blockDate]
      }));
      setBlockDate('');
    }
  };

  const handleRemoveBlockedDate = (target: string) => {
    setFormData(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.filter(d => d !== target)
    }));
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData({ ...formData, dob, age });
    setError(null);
  };

  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerFound, setPartnerFound] = useState<Student | null>(null);

  const handleNext = () => {
    setError(null);
    setStep(s => s + 1);
  };
  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const filteredCohorts = cohorts.length > 0
    ? cohorts.filter(c => {
        const age = formData.age;
        if (age > 0 && age < 14) return false;
        if (age === 14 && formData.dob) {
          const birthDate = new Date(formData.dob);
          const halfYearLater = new Date(birthDate);
          halfYearLater.setMonth(birthDate.getMonth() + 6);
          const cohortStartDate = new Date(c.startDate);
          if (cohortStartDate < halfYearLater) return false;
        }
        if (age > 0 && age < 18) {
          return c.name.toLowerCase().includes('teen') || c.id.includes('june') || c.name.toLowerCase().includes('summer');
        }
        return true;
      })
    : [];

  const searchPartner = () => {
    const found = students.find(s => 
      s.name.toLowerCase() === partnerSearch.toLowerCase() && 
      s.cohortId === formData.cohortId
    );
    if (found) {
      setPartnerFound(found);
      setFormData({ ...formData, partnerName: found.name, partnerId: found.id });
    } else {
      setPartnerFound(null);
      setError("No student with that name found in this cohort.");
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const { user } = userCredential;

      const studentId = `std-${Date.now()}`;
      const name = formData.name || `User_${Math.floor(Math.random() * 1000)}`;
      const email = formData.email || `user${Date.now()}@example.com`;
      const ageNum = parseInt(formData.age as any) || 18;
      
      const newStudent: Student = {
        id: studentId,
        name: name,
        email: email,
        phone: formData.phone || '000-000-0000',
        cohortId: formData.cohortId || (cohorts[0]?.id || 'coh-unknown'),
        under18: ageNum < 18,
        age: ageNum,
        dateOfBirth: formData.dob || `${2026 - ageNum}-01-01`, 
        existingPartnerId: formData.partnerId || undefined,
        schoolId: formData.schoolId || 'sch-highview', 
        locationId: formData.locationId || 'loc-main', 
        partnerRequired: true,
        availabilityDays: formData.availabilityDays.length > 0 ? formData.availabilityDays : ['Monday', 'Wednesday', 'Saturday'],
        availabilityTimeRanges: [],
        blockedDates: formData.blockedDates || [],
        blockedTimes: [],
        parentName: formData.parentName || undefined,
        parentPhone: formData.parentPhone || undefined,
        parentEmail: formData.parentEmail || undefined,
        parent2Name: formData.parent2Name || undefined,
        parent2Phone: formData.parent2Phone || undefined,
        parent2Email: formData.parent2Email || undefined,
        notes: `Registered via signup flow. Initial partner choice: ${formData.partnerName || 'None'}`,
        paidStatus: false,
        completedDrives: {}
      };

      const userProfile: UserProfile = {
        uid: user.uid,
        email: email,
        displayName: name,
        role: 'Student',
        associatedId: studentId
      };

      const localStudents = JSON.parse(localStorage.getItem('ds_students') || '[]');
      localStudents.push(newStudent);
      localStorage.setItem('ds_students', JSON.stringify(localStudents));

      const profiles = JSON.parse(localStorage.getItem('ds_user_profiles') || '{}');
      profiles[user.uid] = userProfile;
      localStorage.setItem('ds_user_profiles', JSON.stringify(profiles));

    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-50 flex flex-col justify-center items-center p-3 sm:p-6 overflow-hidden relative">
      <div className="max-w-sm sm:max-w-md w-full my-auto flex flex-col gap-2 sm:gap-2.5 max-h-[96dvh]">
        {/* Brand Logo Header */}
        <div className="text-center flex items-center justify-center gap-2 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 gradient-brand rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center shrink-0">
            <Car className="text-white w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-display leading-none">
              SteerSafe
            </h1>
            <p className="text-slate-500 text-[10px] sm:text-xs font-semibold mt-0.5">Student Account Registration</p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-between items-center px-2 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step >= i ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > i ? <CheckCircle2 size={13} /> : i}
              </div>
              {i < 5 && (
                <div className={`h-1 flex-1 mx-1 sm:mx-1.5 rounded-full transition-all ${
                  step > i ? 'bg-indigo-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col gap-2.5 max-h-[calc(100dvh-125px)] sm:max-h-[78dvh] overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
            <button 
              onClick={step === 1 ? onBack : handleBack} 
              className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold cursor-pointer touch-press"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Step {step} of 5
            </span>
          </div>

          <div className="shrink-0">
            <h2 className="text-base font-black text-slate-900 leading-tight">
              {step === 1 && "Create Student Account"}
              {step === 2 && "Personal Details"}
              {step === 3 && "Parent / Guardian Contact"}
              {step === 4 && "Select Your Program"}
              {step === 5 && "Choose Partner (Optional)"}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {step === 1 && "Enter your basic login details."}
              {step === 2 && "Used to filter available programs."}
              {step === 3 && (formData.age > 0 && formData.age < 18 ? "Required for students under 18." : "Primary and optional secondary contact.")}
              {step === 4 && "Choose the schedule that fits your life."}
              {step === 5 && "Search for a registered friend."}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-2 rounded-lg flex items-center gap-1.5 text-[11px] font-bold animate-in fade-in shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span className="leading-tight truncate">{error}</span>
            </div>
          )}

          {/* Form Content Steps */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
            {step === 1 && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={handleDOBChange}
                      className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calculated Age</label>
                    <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-black text-xs text-slate-800">
                      {formData.age > 0 ? `${formData.age} Yrs` : '--'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                    <select
                      value={formData.locationId}
                      onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                      className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-xs font-bold text-slate-900"
                    >
                      <option value="">Select Location</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">School</label>
                    <select
                      value={formData.schoolId}
                      onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                      className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-xs font-bold text-slate-900"
                    >
                      <option value="">Select School</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>{sch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-xs font-bold text-slate-900"
                    placeholder="(555) 000-0000"
                  />
                </div>

                {/* AVAILABLE DAYS */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Days</label>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {formData.availabilityDays.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full">
                    {weekdays.map(day => {
                      const isSelected = formData.availabilityDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          title={day}
                          className={`w-full py-2 flex items-center justify-center text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-200 ease-out cursor-pointer active:scale-95 touch-press border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-200'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DATES BLOCKOUTS (EXCLUSIONS) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Dates Blockouts (Exclusions)
                    </label>
                    {formData.blockedDates.length > 0 && (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                        {formData.blockedDates.length} blocked
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer focus:outline-hidden focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddBlockedDate}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer touch-press active:scale-95 transition-all shadow-xs shrink-0"
                    >
                      Blockout
                    </button>
                  </div>
                  {formData.blockedDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.blockedDates.map(d => (
                        <span key={d} className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-rose-200/80 shadow-2xs animate-in fade-in">
                          <span>{d}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlockedDate(d)}
                            className="cursor-pointer text-rose-500 hover:text-rose-700 active:scale-90 transition-transform p-0.5 rounded"
                            title="Remove date"
                          >
                            <Trash2 size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: PARENT / GUARDIAN ADDITION */}
            {step === 3 && (
              <div className="space-y-2">
                {formData.age > 0 && formData.age < 18 ? (
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-700 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 leading-tight">
                      Student is under 18. Parent/Guardian contact details are required.
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                    <User size={14} className="text-indigo-600 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-900 leading-tight">
                      Parent / emergency contact information for your profile.
                    </span>
                  </div>
                )}

                {/* Primary Parent / Guardian */}
                <div className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-2">
                  <span className="text-[10px] font-black text-amber-900/90 uppercase tracking-wider block">
                    Primary Parent / Guardian
                  </span>
                  <div className="space-y-0.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={formData.parentName}
                      onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        placeholder="parent@example.com"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Parent / Guardian (Optional) */}
                <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                      Secondary Parent / Guardian <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Robert Doe"
                      value={formData.parent2Name}
                      onChange={(e) => setFormData({...formData, parent2Name: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={formData.parent2Phone}
                        onChange={(e) => setFormData({...formData, parent2Phone: e.target.value})}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        placeholder="parent2@example.com"
                        value={formData.parent2Email}
                        onChange={(e) => setFormData({...formData, parent2Email: e.target.value})}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SELECT YOUR PROGRAM */}
            {step === 4 && (
              <div className="border-2 border-dashed border-slate-200/90 bg-slate-50/60 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center my-1">
                <div className="w-10 h-10 rounded-full border-2 border-slate-400/80 flex items-center justify-center text-slate-400 mb-2.5">
                  <AlertCircle className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  No Eligible Programs Found
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 max-w-xs leading-relaxed">
                  You must be at least 14 years old to view programs.
                </p>
              </div>
            )}

            {/* STEP 5: CHOOSE PARTNER */}
            {step === 5 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    placeholder="Friend's Full Name"
                  />
                  <button 
                    type="button"
                    onClick={searchPartner}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer touch-press"
                  >
                    Find
                  </button>
                </div>

                {partnerFound && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-emerald-900">{partnerFound.name}</h4>
                      <p className="text-[9px] font-black text-emerald-600 uppercase">Partner Selected</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setPartnerFound(null);
                        setPartnerSearch('');
                        setFormData({...formData, partnerName: '', partnerId: ''});
                      }}
                      className="text-[10px] font-bold text-emerald-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-slate-100 shrink-0">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 gradient-brand text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer touch-press active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-slate-900 text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer touch-press active:scale-95 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Complete Registration"}
                <Car size={15} className="text-indigo-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

