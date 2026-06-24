import React, { useState } from "react";
import { StudentProfile, Appointment, SchoolCatalogItem } from "../types";
import { 
  Heart, Calendar, Search, PlusCircle, UserCircle2, ArrowUpRight, 
  TrendingUp, Compass, Clock, CheckCircle2, ShieldAlert, Award, MessageSquare 
} from "lucide-react";
import { AssessmentWizard } from "./AssessmentWizard";
import { SchoolAutocomplete } from "./SchoolAutocomplete";

interface ParentDashboardProps {
  students: StudentProfile[];
  appointments: Appointment[];
  schoolCatalog: SchoolCatalogItem[];
  onAddChild: (childData: any) => Promise<void>;
  onAssessExistingChild: (studentId: string, scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string }) => Promise<void>;
  onNavigateToDiscovery: () => void;
  onCancelAppointment: (id: string) => Promise<void>;
  activeSubTab?: "dashboard" | "children" | "appointments" | string;
  onOpenChat?: (appointmentId: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  students,
  appointments,
  schoolCatalog,
  onAddChild,
  onAssessExistingChild,
  onNavigateToDiscovery,
  onCancelAppointment,
  activeSubTab,
  onOpenChat
}) => {
  const subTab = activeSubTab || "dashboard";
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<"basic" | "assessment">("basic");
  const [adding, setAdding] = useState(false);
  const [assessingKid, setAssessingKid] = useState<StudentProfile | null>(null);

  // Form details
  const [name, setName] = useState("");
  const [age, setAge] = useState(14);
  const [gender, setGender] = useState("");
  const [schoolCatalogId, setSchoolCatalogId] = useState("");
  const [school, setSchool] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [sport, setSport] = useState("Athletics");
  const [compLevel, setCompLevel] = useState("School");
  const [trainFreq, setTrainFreq] = useState("3 hours/week");

  const upcomingSessions = appointments.filter(
    (a) => (a.status === "requested" || a.status === "confirmed")
  );
  
  const historySessions = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const selectedCatalogSchool = schoolCatalog.find((item) => item.id === schoolCatalogId);

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSchool = selectedCatalogSchool?.schoolName || school;
    if (!name || !gender || !resolvedSchool || !sport) return;
    setWizardStep("assessment");
  };

  const handleAddBasicOnly = async () => {
    const resolvedSchool = selectedCatalogSchool?.schoolName || school;
    const resolvedSchoolCity = selectedCatalogSchool?.city || schoolCity;
    const resolvedSchoolLocation = selectedCatalogSchool?.location || schoolLocation;
    if (!name || !gender || !resolvedSchool || !sport) return;
    setAdding(true);
    try {
      await onAddChild({
        name,
        age: Number(age),
        gender,
        schoolCatalogId: selectedCatalogSchool?.id,
        school: resolvedSchool,
        schoolLocation: resolvedSchoolLocation,
        schoolCity: resolvedSchoolCity,
        sport,
        competitionLevel: compLevel,
        trainingFrequency: trainFreq
        // Let confidenceLevel, stressLevel, focusLevel remain empty/null to wait for actual assessment questionnaire submission!
      });
      setShowAddChildModal(false);
      setWizardStep("basic");
      // Reset form variables
      setName("");
      setGender("");
      setSchoolCatalogId("");
      setSchool("");
      setSchoolLocation("");
      setSchoolCity("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleAssessExistingChildComplete = async (scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string }) => {
    if (!assessingKid) return;
    setAdding(true);
    try {
      await onAssessExistingChild(assessingKid.id, scores);
      setAssessingKid(null);
    } catch (err) {
      console.error("Failed to submit direct existing assessment update:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleAssessmentWizardComplete = async (scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string }) => {
    const resolvedSchool = selectedCatalogSchool?.schoolName || school;
    const resolvedSchoolCity = selectedCatalogSchool?.city || schoolCity;
    const resolvedSchoolLocation = selectedCatalogSchool?.location || schoolLocation;
    setAdding(true);
    try {
      await onAddChild({
        name,
        age: Number(age),
        gender,
        schoolCatalogId: selectedCatalogSchool?.id,
        school: resolvedSchool,
        schoolLocation: resolvedSchoolLocation,
        schoolCity: resolvedSchoolCity,
        sport,
        competitionLevel: compLevel,
        trainingFrequency: trainFreq,
        confidenceLevel: scores.confidence,
        stressLevel: scores.stress,
        focusLevel: scores.focus,
        goals: scores.goals,
        currentChallenges: scores.supportAreas
      });
      setShowAddChildModal(false);
      setWizardStep("basic");
      // Reset
      setName("");
      setGender("");
      setSchoolCatalogId("");
      setSchool("");
      setSchoolLocation("");
      setSchoolCity("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const renderKidScores = (kid: StudentProfile) => {
    const hasAssessment = kid.confidenceLevel !== undefined && kid.confidenceLevel !== null;

    if (hasAssessment) {
      return (
        <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            Mental Mind Fitness Scores
          </span>
          
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
              <span>Self Belief / Confidence Index</span>
              <span className="font-bold text-emerald-600">{kid.confidenceLevel}/10</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(kid.confidenceLevel || 0) * 10}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
              <span>Pre-Match Anxiety Threshold</span>
              <span className="font-bold text-amber-500">{kid.stressLevel}/10</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(kid.stressLevel || 0) * 10}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
              <span>Laser Focus Duration</span>
              <span className="font-bold text-indigo-500">{kid.focusLevel}/10</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(kid.focusLevel || 0) * 10}%` }}
              />
            </div>
          </div>

          {/* Challenges listed */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-1.5">
              Active Support Areas:
            </p>
            <div className="flex flex-wrap gap-1">
              {kid.currentChallenges && kid.currentChallenges.length > 0 ? (
                kid.currentChallenges.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-extrabold capitalize">
                    ✨ {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">Excellent stable indices, no critical blocks</span>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col items-stretch space-y-4">
          <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
              ⚠️ Diagnostic Baseline Pending
            </p>
            <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
              No diagnostic questionnaires have been completed yet. Baseline metrics cannot be simulated.
            </p>
          </div>
          <button
            onClick={() => setAssessingKid(kid)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 hover:shadow-xs active:scale-95 cursor-pointer transition-all text-center"
          >
            📝 Start Mind Gym Baseline Assessment
          </button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Banner Intro */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-3xl p-6 md:p-8 border border-emerald-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            Secure Parent Portal
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">
            {subTab === "children" ? "My Children's Athlete Profiles" : subTab === "appointments" ? "My Mental-gym Appointments" : "Parent Advocate Command Centre"}
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {subTab === "children" 
              ? "Manage your registered student athletes, review real-time resilience metrics, and enroll new team candidates." 
              : subTab === "appointments" 
              ? "Track upcoming consultation slots, join remote therapy rooms via Meet, and read coach-assigned session notes." 
              : "Monitor athletic progress indexes, book professional mental-mapping sessions, and manage participation consents."}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {(subTab === "dashboard" || subTab === "children") && (
            <button
              onClick={() => {
                setWizardStep("basic");
                setShowAddChildModal(true);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Add Student Athlete
            </button>
          )}
          {(subTab === "dashboard" || subTab === "appointments") && (
            <button
              onClick={onNavigateToDiscovery}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              Discover Coaches
            </button>
          )}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
          <UserCircle2 className="w-12 h-12 text-emerald-300 mx-auto stroke-1" />
          <h3 className="text-md font-bold mt-4 text-gray-900">No Student Athletes Registered</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">
            You must register your child to begin testing mental indices, track consultation history, and schedule custom slots.
          </p>
          <button
            onClick={() => setShowAddChildModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Student Now
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: DASHBOARD VIEW (Combines both children + appointments summaries in a grid) */}
          {subTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT/MID: Kid profiles indices and summary */}
              <div className="lg:col-span-2 space-y-8">
                <h3 className="text-md font-extrabold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Student Athlete Profiles & Resilience Indicators
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {students.map((kid) => (
                    <div key={kid.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
                      <span className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                      
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-extrabold text-gray-800 tracking-tight">{kid.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                              🏃 {kid.sport}
                            </span>
                            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded">
                              🎂 {kid.age} yrs
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded">
                              🎖️ {kid.competitionLevel} Level
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scientific Indicators metrics */}
                      {renderKidScores(kid)}
                    </div>
                  ))}
                </div>

                {/* Session History section link preview */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Consolidated Activity Logs • Previews
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    You have <b>{historySessions.length} completed consultations</b> and <b>{upcomingSessions.length} upcoming appointments</b> active.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDEBAR: Upcoming schedules & scheduling notes */}
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 relative overflow-hidden shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Upcoming Booked Session slots
                  </h3>

                  {upcomingSessions.length === 0 ? (
                    <div className="py-6 text-center text-gray-400">
                      <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs">No upcoming mapped session bookings.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingSessions.slice(0, 2).map((session) => (
                        <div key={session.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-gray-800">{session.therapistName}</p>
                              <p className="text-[10px] text-gray-500 font-medium">Licensed Coaching Practitioner</p>
                            </div>
                            {session.status === "confirmed" ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                                Confirmed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono animate-pulse">
                                Under Review
                              </span>
                            )}
                          </div>
                          
                          <div className="p-2.5 rounded-xl bg-white border border-gray-100 flex justify-between text-[11px] font-medium text-gray-700 font-mono">
                            <span>📅 {session.date}</span>
                            <span>⏰ {session.timeSlot}</span>
                          </div>

                          <span className="text-[10px] text-emerald-600 font-semibold block">👤 Athlete: {session.studentName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consents & Protection card */}
                <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-3xl relative overflow-hidden space-y-3">
                  <Award className="w-8 h-8 text-emerald-600" />
                  <h4 className="text-sm font-bold text-gray-900 tracking-tight">Active Legal Consent Records</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Under age athlete registrations comply with legal data security guidelines. Consents are verified in real time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXCLUSIVELY MY CHILDRENS */}
          {subTab === "children" && (
            <div className="space-y-8">
              <h3 className="text-md font-extrabold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Active Student Athlete Profiles & Resilience Indicators ({students.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((kid) => (
                  <div key={kid.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
                    <span className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-extrabold text-gray-800 tracking-tight">{kid.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                            🏃 {kid.sport}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded">
                            🎂 {kid.age} yrs
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded">
                            🎖️ {kid.competitionLevel} Level
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Indicators metrics */}
                    {renderKidScores(kid)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXCLUSIVELY MY APPOINTMENTS */}
          {subTab === "appointments" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT/MID: Upcoming schedules & appointment history logs */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100">
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    My Upcoming Scheduled Consultations ({upcomingSessions.length})
                  </h3>

                  {upcomingSessions.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-sans">You don't have any upcoming sports mapping sessions scheduled.</p>
                      <button
                        onClick={onNavigateToDiscovery}
                        className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                      >
                        <Search className="w-4 h-4" />
                        Schedule Your First Session Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{session.therapistName}</p>
                              <p className="text-[10px] text-gray-500 font-medium">Licensed Mind-gym Coach</p>
                            </div>
                            {session.status === "confirmed" ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                                Confirmed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono animate-pulse">
                                Under Review
                              </span>
                            )}
                          </div>
                          
                          <div className="p-2.5 rounded-xl bg-white border border-gray-100 flex justify-between text-[11px] font-medium text-gray-700 font-mono">
                            <span>📅 {session.date}</span>
                            <span>⏰ {session.timeSlot}</span>
                          </div>

                          <div className="flex items-center justify-between font-sans pt-1">
                            <span className="text-[10px] text-emerald-600 font-semibold font-bold">👤 Athlete: {session.studentName}</span>
                            {session.videoLink ? (
                              <a 
                                href={session.videoLink} 
                                target="_blank" 
                                rel="referrer noopener"
                                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                              >
                                Launch Call <ArrowUpRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-mono">Call link pending</span>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {onOpenChat && (
                              <button
                                onClick={() => onOpenChat(session.id)}
                                className="flex-1 text-center text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Secure Chat Track
                              </button>
                            )}
                            <button
                              onClick={() => onCancelAppointment(session.id)}
                              className="flex-1 text-center text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consultation Logs history */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Historic Consultation Logs & Reviews ({historySessions.length})
                  </h4>
                  {historySessions.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-xs">No completed consultation logs in this account yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50 font-sans">
                      {historySessions.map((hist) => (
                        <div key={hist.id} className="py-4 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-gray-800">Therapist: {hist.therapistName}</p>
                            <p className="text-gray-400 mt-0.5 font-mono">Consulted {hist.date} at {hist.timeSlot} for {hist.studentName}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            hist.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {hist.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Legal documents */}
              <div className="space-y-8">
                <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-3xl relative overflow-hidden space-y-3">
                  <Award className="w-8 h-8 text-emerald-600" />
                  <h4 className="text-sm font-bold text-gray-900 tracking-tight">Active Legal Consent Records</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Under age athlete registrations comply with legal data security guidelines. Consents are verified in real time.
                  </p>
                  <div className="space-y-1.5 pt-1 text-xs text-gray-700 font-sans">
                    <p className="flex items-center gap-1.5 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Child Participation: OK</p>
                    <p className="flex items-center gap-1.5 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Data Storage Encrypted: OK</p>
                    <p className="flex items-center gap-1.5 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Automated Reminders set: OK</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD CHILD WIZARD MODAL */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150">
            {wizardStep === "basic" ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Register Student Athlete</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Step 1: Create the athlete's primary profile. Next, you will perform a tailored Mind Gym mental assessment.
                </p>

                <form onSubmit={handleAddChildSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Student Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Jr"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Age</label>
                      <input
                        type="number"
                        min="6"
                        max="25"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                        required
                      >
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Others</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <SchoolAutocomplete
                      label="School / Affiliated Board"
                      catalog={schoolCatalog}
                      selectedSchoolId={schoolCatalogId}
                      onSelectedSchoolIdChange={setSchoolCatalogId}
                      otherSchoolName={school}
                      onOtherSchoolNameChange={setSchool}
                      otherLocation={schoolLocation}
                      onOtherLocationChange={setSchoolLocation}
                      otherCity={schoolCity}
                      onOtherCityChange={setSchoolCity}
                    />
                  </div>

                  {selectedCatalogSchool && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-[11px] text-emerald-800">
                      Mapping child to <strong>{selectedCatalogSchool.schoolName}</strong>
                      {selectedCatalogSchool.city ? `, ${selectedCatalogSchool.city}` : ""}.
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Primary Sport</label>
                      <input
                        type="text"
                        placeholder="e.g. Swimming, Badminton"
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Level</label>
                      <select
                        value={compLevel}
                        onChange={(e) => setCompLevel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                      >
                        <option>School</option>
                        <option>State</option>
                        <option>National</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => setShowAddChildModal(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 order-last sm:order-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBasicOnly}
                      disabled={adding || !name || !gender || !(selectedCatalogSchool?.schoolName || school) || !sport}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Add & Skip Assessment for Now
                    </button>
                    <button
                      type="submit"
                      disabled={adding}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 font-sans"
                    >
                      Next: Setup Mind Assessment
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <AssessmentWizard
                age={Number(age)}
                sport={sport}
                onComplete={handleAssessmentWizardComplete}
                onCancel={() => setWizardStep("basic")}
              />
            )}
          </div>
        </div>
      )}

      {/* Direct Assessment Wizard Modal for Existing Child */}
      {assessingKid && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              Sports Mind Assessment Wizard
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Answering diagnostic questions for <strong className="font-bold text-gray-800">{assessingKid.name}</strong> ({assessingKid.sport})
            </p>
            <AssessmentWizard
              age={assessingKid.age}
              sport={assessingKid.sport}
              onComplete={handleAssessExistingChildComplete}
              onCancel={() => setAssessingKid(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
