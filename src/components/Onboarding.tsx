import React, { useState } from "react";
import { SchoolCatalogItem, UserProfile, UserRole } from "../types";
import { SchoolAutocomplete } from "./SchoolAutocomplete";
import { 
  Heart, Dumbbell, ShieldCheck, ClipboardList, Briefcase, 
  GraduationCap, UserCheck, CheckSquare, Sparkles, Smile, ArrowRight 
} from "lucide-react";

interface OnboardingProps {
  userEmail: string;
  userName: string;
  schoolCatalog: SchoolCatalogItem[];
  onSubmit: (role: UserRole, details: any) => Promise<void>;
}

export const Onboarding: React.FC<OnboardingProps> = ({ userEmail, userName, schoolCatalog, onSubmit }) => {
  const [role, setRole] = useState<UserRole | "">("");
  const [step, setStep] = useState(1); // 1 = Role selection, 2 = Details form
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Role selections descriptions
  const rolesInfo = [
    {
      id: "parent" as UserRole,
      title: "Parent / Guardian",
      desc: "Register, manage your student athlete's scheduling, complete required consents, and track performance scores.",
      icon: Heart,
      color: "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-emerald-600 hover:shadow-xs cursor-pointer"
    },
    {
      id: "student" as UserRole,
      title: "Student Athlete",
      desc: "Log daily feelings, set laser focus goals, take self mental health assessments, and review coaching schedules.",
      icon: Dumbbell,
      color: "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-indigo-600 hover:shadow-xs cursor-pointer"
    },
    {
      id: "therapist" as UserRole,
      title: "Mental Health Therapist",
      desc: "Configure specialized sport focus, establish available hours, record session summaries, and publish mental blogs.",
      icon: Briefcase,
      color: "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-indigo-600 hover:shadow-xs cursor-pointer"
    },
    {
      id: "school_admin" as UserRole,
      title: "School / College Admin",
      desc: "Partner with professional mental coaches, view combined workshop indicators, and oversee school stats.",
      icon: GraduationCap,
      color: "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-amber-600 hover:shadow-xs cursor-pointer"
    }
  ];

  // Specific Forms States
  // 1. Parent Data
  const [parentName, setParentName] = useState(userName);
  const [parentMobile, setParentMobile] = useState("");
  const [parentRelation, setParentRelation] = useState("Mother");
  // Child Details (inside Parent Form)
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(14);
  const [childGender, setChildGender] = useState("");
  const [childSchoolCatalogId, setChildSchoolCatalogId] = useState("");
  const [childSchool, setChildSchool] = useState("");
  const [childSchoolLocation, setChildSchoolLocation] = useState("");
  const [childSchoolCity, setChildSchoolCity] = useState("");
  const [childSport, setChildSport] = useState("Football");
  const [childCompetition, setChildCompetition] = useState("School");
  const [childTraining, setChildTraining] = useState("3 days/week");
  // Parent Consent
  const [consentParticipation, setConsentParticipation] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentCommunication, setConsentCommunication] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);

  // 2. Student Data
  const [studentAge, setStudentAge] = useState(16);
  const [studentGender, setStudentGender] = useState("");
  const [studentSchoolCatalogId, setStudentSchoolCatalogId] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [studentCity, setStudentCity] = useState("");
  const [studentSchoolLocation, setStudentSchoolLocation] = useState("");
  const [studentSport, setStudentSport] = useState("Tennis");
  const [studentCompLevel, setStudentCompLevel] = useState("State");
  const [studentTrainFreq, setStudentTrainFreq] = useState("4 hours/week");
  // Student assessment
  const [confidence, setConfidence] = useState(7);
  const [stress, setStress] = useState(5);
  const [focus, setFocus] = useState(6);
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);

  // 3. Therapist Data
  const [therapistName, setTherapistName] = useState(userName);
  const [therapistMobile, setTherapistMobile] = useState("");
  const [qualification, setQualification] = useState("M.Sc. in Performance Psychology");
  const [experience, setExperience] = useState(5);
  const [specialization, setSpecialization] = useState("Competition Anxiety, Group Therapy");
  const [languages, setLanguages] = useState("English, Hindi");
  const [sportsExpertise, setSportsExpertise] = useState("Football, Track, Cricket");
  const [biography, setBiography] = useState("");
  const [sessionFee, setSessionFee] = useState(1000);
  // Therapist upload mocks
  const [certDocs, setCertDocs] = useState("https://drive.google.com/cert1");
  const [degreeDocs, setDegreeDocs] = useState("https://drive.google.com/degree1");
  const [identityDocs, setIdentityDocs] = useState("https://drive.google.com/id1");
  // Therapist Consents
  const [therapistDisplayConsent, setTherapistDisplayConsent] = useState(false);
  const [therapistServiceAgreement, setTherapistServiceAgreement] = useState(false);
  const [therapistDataAgreement, setTherapistDataAgreement] = useState(false);

  // 4. School Data
  const [schoolCatalogId, setSchoolCatalogId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolContact, setSchoolContact] = useState(userName);
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [numStudents, setNumStudents] = useState(400);
  const [sportsPrograms, setSportsPrograms] = useState("Interclash leagues, Football team");
  const [currentCounselor, setCurrentCounselor] = useState("None currently affiliated");

  const selectedChildSchool = schoolCatalog.find((item) => item.id === childSchoolCatalogId);
  const selectedStudentSchool = schoolCatalog.find((item) => item.id === studentSchoolCatalogId);
  const selectedAdminSchool = schoolCatalog.find((item) => item.id === schoolCatalogId);

  const toggleChallenge = (item: string) => {
    if (challenges.includes(item)) {
      setChallenges(challenges.filter((c) => c !== item));
    } else {
      setChallenges([...challenges, item]);
    }
  };

  const handleNextStep = () => {
    if (!role) {
      setError("Please select a profile role to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setError("");
    setSubmitting(true);

    try {
      let payload: any = {};

      if (role === "parent") {
        const resolvedChildSchool = selectedChildSchool?.schoolName || childSchool;
        const resolvedChildSchoolLocation = selectedChildSchool?.location || childSchoolLocation;
        const resolvedChildSchoolCity = selectedChildSchool?.city || childSchoolCity;
        if (!parentMobile || !childName || !childGender || !resolvedChildSchool) {
          throw new Error("Please fill out parent contact details and student information.");
        }
        if (!consentParticipation || !consentData || !consentCommunication || !consentTerms) {
          throw new Error("You must accept all consent checkmarks to complete onboarding.");
        }
        payload = {
          parentName,
          parentMobile,
          parentRelation,
          childName,
          childAge,
          childGender,
          childSchoolCatalogId: selectedChildSchool?.id,
          childSchool: resolvedChildSchool,
          childSchoolLocation: resolvedChildSchoolLocation,
          childSchoolCity: resolvedChildSchoolCity,
          childSport,
          childCompetition,
          childTraining,
          consentParticipation,
          consentData,
          consentCommunication,
          consentTerms
        };
      } else if (role === "student") {
        const resolvedStudentSchool = selectedStudentSchool?.schoolName || studentSchool;
        const resolvedStudentSchoolLocation = selectedStudentSchool?.location || studentSchoolLocation;
        const resolvedStudentSchoolCity = selectedStudentSchool?.city || studentCity;
        if (!studentGender || !resolvedStudentSchool || !studentCity || !goals) {
          throw new Error("Please populate your school location and mental development goals.");
        }
        payload = {
          studentName: userName,
          studentAge,
          studentGender,
          studentSchoolCatalogId: selectedStudentSchool?.id,
          studentSchool: resolvedStudentSchool,
          studentSchoolLocation: resolvedStudentSchoolLocation,
          studentSchoolCity: resolvedStudentSchoolCity,
          studentCity,
          studentSport,
          studentCompLevel,
          studentTrainFreq,
          confidence,
          stress,
          focus,
          goals,
          challenges
        };
      } else if (role === "therapist") {
        if (!therapistMobile || !qualification || !specialization || !biography) {
          throw new Error("Please provide your license particulars, credentials and biography.");
        }
        if (!therapistDisplayConsent || !therapistServiceAgreement || !therapistDataAgreement) {
          throw new Error("You must agree to professional display and service guidelines.");
        }
        payload = {
          therapistName,
          therapistMobile,
          qualification,
          experience: Number(experience),
          specialization,
          languages,
          sportsExpertise,
          biography,
          sessionFee: Number(sessionFee),
          certDocs,
          degreeDocs,
          identityDocs,
          therapistDisplayConsent,
          therapistServiceAgreement,
          therapistDataAgreement,
          availableDays: ["Mon", "Wed", "Fri"],
          availableTimeSlots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"],
          sessionDuration: 60,
          isApproved: false // Admin approval required
        };
      } else if (role === "school_admin") {
        const resolvedAdminSchool = selectedAdminSchool?.schoolName || schoolName;
        const resolvedAdminLocation = selectedAdminSchool?.location || schoolLocation;
        const resolvedAdminCity = selectedAdminSchool?.city || schoolCity;
        if (!resolvedAdminSchool || !schoolPhone || !schoolAddress) {
          throw new Error("Please complete the school board address and point of contact.");
        }
        payload = {
          schoolCatalogId: selectedAdminSchool?.id,
          schoolName: resolvedAdminSchool,
          schoolLocation: resolvedAdminLocation,
          schoolCity: resolvedAdminCity,
          schoolContact,
          schoolPhone,
          schoolAddress,
          numStudents: Number(numStudents),
          sportsPrograms,
          currentCounselor
        };
      }

      await onSubmit(role, payload);
    } catch (err: any) {
      setError(err?.message || "Onboarding failed. Please review values.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Dynamic Title Headers */}
      <div className="text-center mb-8">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-widest font-sans border border-indigo-100">
          YovoEdge Portal Onboarding
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">
          Configure Your Mental Mindset Path
        </h1>
        <p className="text-slate-500 mt-1.5 text-xs max-w-xl mx-auto leading-relaxed">
          Tailored dashboard modules that build athletic confidence, connect professional therapy networks, and foster resilient mental growth.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 md:p-10 animate-in fade-in duration-200">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-sans leading-relaxed flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: CHOOSE SYSTEM PROFILE ROLE */}
        {step === 1 && (
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-mono border border-indigo-100">01</span>
              Select your structural persona:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rolesInfo.map((r) => {
                const IconComponent = r.icon;
                const isSelected = role === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`border p-5 rounded-xl transition-all flex items-start space-x-4 ${r.color} ${
                      isSelected ? "border-indigo-600 bg-indigo-50/10! ring-1 ring-indigo-600/20" : "border-slate-200"
                    }`}
                  >
                    <div className={`p-3 rounded-lg transition-colors shrink-0 ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-950 text-sm leading-tight">{r.title}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold shrink-0">Selected</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={!role}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold transition-all text-xs ${
                  role 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Proceed With Form
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS PROFILE FORM */}
        {step === 2 && (
          <form onSubmit={handleFormSubmit}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ← Back to Persona
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono border border-indigo-100">
                Step 2 of 2
              </span>
            </div>

            {/* A. PARENT WIZARD FORM */}
            {role === "parent" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    Parent / Guardian Registration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Parent Full Name</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={parentMobile}
                        onChange={(e) => setParentMobile(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Relationship</label>
                      <select
                        value={parentRelation}
                        onChange={(e) => setParentRelation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Guardian</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <Dumbbell className="w-5 h-5 text-emerald-600" />
                    Child Athlete Registration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Child Athlete Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Jr"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        min="5"
                        max="25"
                        value={childAge}
                        onChange={(e) => setChildAge(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Gender</label>
                      <select
                        value={childGender}
                        onChange={(e) => setChildGender(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      >
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Others</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <SchoolAutocomplete
                        label="School / College Affiliation"
                        catalog={schoolCatalog}
                        selectedSchoolId={childSchoolCatalogId}
                        onSelectedSchoolIdChange={setChildSchoolCatalogId}
                        otherSchoolName={childSchool}
                        onOtherSchoolNameChange={setChildSchool}
                        otherLocation={childSchoolLocation}
                        onOtherLocationChange={setChildSchoolLocation}
                        otherCity={childSchoolCity}
                        onOtherCityChange={setChildSchoolCity}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Primary Sport</label>
                      <input
                        type="text"
                        placeholder="e.g. Cricket, Football"
                        value={childSport}
                        onChange={(e) => setChildSport(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Competition Level</label>
                      <select
                        value={childCompetition}
                        onChange={(e) => setChildCompetition(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option>School</option>
                        <option>District</option>
                        <option>State</option>
                        <option>National</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 bg-emerald-50/10 p-4 rounded-2xl border border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5" />
                    Mandatory Parent Consent Collection
                  </h3>
                  <div className="space-y-2 text-xs font-medium text-gray-700">
                    <label className="flex items-start gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={consentParticipation}
                        onChange={(e) => setConsentParticipation(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>I give consent for my child to participate in YovoEdge mental diagnostics and video sports counseling sessions.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={consentData}
                        onChange={(e) => setConsentData(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>I consent to local secure storage of mental health assessments for progress tracking metrics.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={consentCommunication}
                        onChange={(e) => setConsentCommunication(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>I authorize communication regarding session scheduling reminder emails or text notifications.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={consentTerms}
                        onChange={(e) => setConsentTerms(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>I accept the platform's terms of sports coaching agreements and cancellation guidelines.</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* B. STUDENT ONBOARDING WITH MENTAL ASSESSMENT */}
            {role === "student" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <UserCheck className="w-5 h-5 text-violet-600" />
                    Student Athlete Profile Info
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        min="10"
                        max="26"
                        value={studentAge}
                        onChange={(e) => setStudentAge(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Gender</label>
                      <select
                        value={studentGender}
                        onChange={(e) => setStudentGender(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      >
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Others</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <SchoolAutocomplete
                        label="School Name"
                        catalog={schoolCatalog}
                        selectedSchoolId={studentSchoolCatalogId}
                        onSelectedSchoolIdChange={(value) => {
                          setStudentSchoolCatalogId(value);
                          const selectedSchool = schoolCatalog.find((item) => item.id === value);
                          if (selectedSchool?.city) {
                            setStudentCity(selectedSchool.city);
                          }
                        }}
                        otherSchoolName={studentSchool}
                        onOtherSchoolNameChange={setStudentSchool}
                        otherLocation={studentSchoolLocation}
                        onOtherLocationChange={setStudentSchoolLocation}
                        otherCity={studentCity}
                        onOtherCityChange={setStudentCity}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={studentCity}
                        onChange={(e) => setStudentCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <Dumbbell className="w-5 h-5 text-violet-600" />
                    Sports Specifics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Sport</label>
                      <input
                        type="text"
                        placeholder="e.g. Basketball, Badminton"
                        value={studentSport}
                        onChange={(e) => setStudentSport(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Competition Scale</label>
                      <select
                        value={studentCompLevel}
                        onChange={(e) => setStudentCompLevel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      >
                        <option>School</option>
                        <option>State</option>
                        <option>National</option>
                        <option>Elite Academy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Weekly Training Hours</label>
                      <input
                        type="text"
                        placeholder="e.g. 6 hours/week"
                        value={studentTrainFreq}
                        onChange={(e) => setStudentTrainFreq(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 bg-violet-50/10 p-5 rounded-2xl border border-violet-100">
                  <h3 className="text-md font-bold text-violet-800 mb-4 flex items-center gap-1.5">
                    <Smile className="w-5 h-5" />
                    Mental Assessment Survey
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Confidence Level ({confidence}/10)</span>
                        <span className="text-violet-600">Self Believing value</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={confidence}
                        onChange={(e) => setConfidence(Number(e.target.value))}
                        className="w-full accent-violet-600"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Stress & Anxiety Level ({stress}/10)</span>
                        <span className="text-amber-600">Pre-competition tension</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={stress}
                        onChange={(e) => setStress(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Focus & Concentration ({focus}/10)</span>
                        <span className="text-emerald-600">Action concentration</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={focus}
                        onChange={(e) => setFocus(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Brief Athlete mental goals</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Reduce pre-service anxiety in tennis points..."
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Check current challenges (Select multiple):</label>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {["anxiety", "confidence", "concentration", "performance pressure"].map((challenge) => {
                          const hasItem = challenges.includes(challenge);
                          return (
                            <button
                              type="button"
                              key={challenge}
                              onClick={() => toggleChallenge(challenge)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                                hasItem 
                                  ? "bg-violet-600 text-white border-violet-600" 
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {challenge === "anxiety" && "😰 Pre-game Anxiety"}
                              {challenge === "confidence" && "💪 Self-Doubt / Confidence"}
                              {challenge === "concentration" && "🎯 Laser Focus / Concentration"}
                              {challenge === "performance pressure" && "⚡ Performance Pressure"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. THERAPIST PROFESSIONAL DETAILS ONBOARDING */}
            {role === "therapist" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <Briefcase className="w-5 h-5 text-sky-600" />
                    Licenses & Contact Particulars
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Therapist Display Name</label>
                      <input
                        type="text"
                        value={therapistName}
                        onChange={(e) => setTherapistName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        value={therapistMobile}
                        onChange={(e) => setTherapistMobile(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Session Rate (INR/hour)</label>
                      <input
                        type="number"
                        min="200"
                        max="10000"
                        value={sessionFee}
                        onChange={(e) => setSessionFee(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-indigo-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Qualifications</label>
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Experience (Years)</label>
                      <input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Principal Specialized Focus</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Languages Spoken</label>
                      <input
                        type="text"
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Sports Coaching Expertise</label>
                      <input
                        type="text"
                        value={sportsExpertise}
                        onChange={(e) => setSportsExpertise(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Biography / Professional Statement</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a bio summarizing your clinical background and approach to youthful sports performance anxiety..."
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5 font-mono">
                    <ClipboardList className="w-5 h-5 text-sky-600" />
                    Verify Documents upload links
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Certifications proof PDF URL</label>
                      <input
                        type="text"
                        value={certDocs}
                        onChange={(e) => setCertDocs(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Medical Degree details link</label>
                      <input
                        type="text"
                        value={degreeDocs}
                        onChange={(e) => setDegreeDocs(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Government identity proof ID</label>
                      <input
                        type="text"
                        value={identityDocs}
                        onChange={(e) => setIdentityDocs(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 bg-sky-50/10 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <h3 className="text-xs font-bold text-sky-800 mb-2">Practitioner Terms consent checks</h3>
                  <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer p-1">
                    <input
                      type="checkbox"
                      checked={therapistDisplayConsent}
                      onChange={(e) => setTherapistDisplayConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I consent to publicly displaying my qualifications, specialization, and session rate details on the therapist directory listings.</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer p-1">
                    <input
                      type="checkbox"
                      checked={therapistServiceAgreement}
                      onChange={(e) => setTherapistServiceAgreement(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I verify standard licensing laws apply, and establish that all notes regarding underage kids are registered securely.</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer p-1">
                    <input
                      type="checkbox"
                      checked={therapistDataAgreement}
                      onChange={(e) => setTherapistDataAgreement(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I accept the platform's data usage guidelines and privacy agreements.</span>
                  </label>
                </div>
              </div>
            )}

            {/* D. SCHOOL PARTNER REGISTRATION */}
            {role === "school_admin" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    Institution Profile Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <SchoolAutocomplete
                        label="School / College Name"
                        catalog={schoolCatalog}
                        selectedSchoolId={schoolCatalogId}
                        onSelectedSchoolIdChange={setSchoolCatalogId}
                        otherSchoolName={schoolName}
                        onOtherSchoolNameChange={setSchoolName}
                        otherLocation={schoolLocation}
                        onOtherLocationChange={setSchoolLocation}
                        otherCity={schoolCity}
                        onOtherCityChange={setSchoolCity}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Point of Contact Person</label>
                      <input
                        type="text"
                        value={schoolContact}
                        onChange={(e) => setSchoolContact(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Official Desk Phone</label>
                      <input
                        type="tel"
                        placeholder="e.g. 0802345678"
                        value={schoolPhone}
                        onChange={(e) => setSchoolPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Regional Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 12th Cross road, Koramangala, Bangalore"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Total Number of Students</label>
                    <input
                      type="number"
                      value={numStudents}
                      onChange={(e) => setNumStudents(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Underway Sports Programs descriptions</label>
                    <input
                      type="text"
                      placeholder="e.g. Hockey team, state basketball group, junior training tracks"
                      value={sportsPrograms}
                      onChange={(e) => setSportsPrograms(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Details on existing local guidance counselors</label>
                  <input
                    type="text"
                    value={currentCounselor}
                    onChange={(e) => setCurrentCounselor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* BUTTON SUBMIT ONBOARDING */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-50">
              <span className="text-xs text-gray-400 font-sans">
                By completing, you verify accurate medical & licensing identities.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? "Finalizing database records..." : "Submit Profile Onboarding"}
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
