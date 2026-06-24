import React, { useState } from "react";
import { StudentProfile, Appointment, JournalEntry } from "../types";
import { 
  Smile, Dumbbell, Award, BookOpen, Send, Calendar, Clock, Sparkles, 
  Trash2, Plus, PenTool, CheckCircle, TrendingUp, HelpCircle, MessageSquare, Info, Star, Brain
} from "lucide-react";
import { AssessmentWizard } from "./AssessmentWizard";

interface StudentDashboardProps {
  studentProfile: StudentProfile | null;
  appointments: Appointment[];
  journals: JournalEntry[];
  onAddJournal: (journalData: any) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
  onUpdateAssessment: (confidence: number, stress: number, focus: number, goals?: string, currentChallenges?: string[]) => Promise<void>;
  onOpenChat?: (appointmentId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentProfile,
  appointments,
  journals,
  onAddJournal,
  onDeleteJournal,
  onUpdateAssessment,
  onOpenChat
}) => {
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  // Journal form state
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [journalMood, setJournalMood] = useState("😎 Energetic");
  const [savingJournal, setSavingJournal] = useState(false);

  // Test form state
  const [confidence, setConfidence] = useState(studentProfile?.confidenceLevel || 7);
  const [stress, setStress] = useState(studentProfile?.stressLevel || 5);
  const [focus, setFocus] = useState(studentProfile?.focusLevel || 6);
  const [updatingTest, setUpdatingTest] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Filter appointments for the current student
  const studentSessions = appointments.filter(
    (a) => (a.status === "confirmed" || a.status === "requested" || a.status === "completed")
  );

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle || !journalContent) return;
    setSavingJournal(true);
    try {
      await onAddJournal({
        title: journalTitle,
        content: journalContent,
        mood: journalMood,
      });
      // Clear
      setJournalTitle("");
      setJournalContent("");
      setShowJournalForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingJournal(false);
    }
  };

  const handleAssessmentComplete = async (scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string }) => {
    setUpdatingTest(true);
    try {
      await onUpdateAssessment(scores.confidence, scores.stress, scores.focus, scores.goals, scores.supportAreas);
      setShowTestForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTest(false);
    }
  };

  const moods = [
    { label: "😎 Energetic", color: "bg-emerald-50 text-emerald-700" },
    { label: "🧘 Calm & Focused", color: "bg-sky-50 text-sky-700" },
    { label: "😰 Anxious/Stressed", color: "bg-rose-50 text-rose-700" },
    { label: "😔 Unmotivated", color: "bg-amber-50 text-amber-700" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Visual Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider tracking-tight font-sans border border-indigo-10 border-indigo-100">
            Athlete Mental Zone
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-3 tracking-tight">Focus & Development Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
            Record confidential daily mind journals, monitor your sports resilience scales, and attend confirmed mental-mapping events.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowJournalForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <PenTool className="w-3.5 h-3.5" />
            Write Mind Journal Entry
          </button>
          <button
            id="student-mind-gym-btn"
            onClick={() => setShowTestForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-55 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
            My Mind Gym Assessment
          </button>
        </div>
      </div>

      {studentProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Scientific Metrics & journals */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visual Indicators cards */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                <span className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Mental Mind Fitness Scores
                </span>
                {studentProfile.confidenceLevel !== undefined && studentProfile.confidenceLevel !== null && (
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-[10px] font-bold text-[#4f46e5] bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showExplanation ? "Hide Scientific Math" : "How is this calculated?"}
                  </button>
                )}
              </div>

              {studentProfile.confidenceLevel !== undefined && studentProfile.confidenceLevel !== null ? (
                <>
                  {showExplanation ? (
                    /* EXPLANATIVE SCIENTIFIC PANEL */
                    <div className="p-4 bg-indigo-55 bg-indigo-50/40 rounded-xl space-y-3.5 text-xs text-gray-700 animate-in fade-in duration-200">
                      <h4 className="font-extrabold text-indigo-950 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Medical & Sports Psychology Metrics Methodology
                      </h4>
                      <p className="leading-relaxed text-gray-600 text-[11px]">
                        Your diagnostic indices are computed across an age-bracketed diagnostic assessment. Here is the sports science blueprint:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-xl border border-indigo-100/50 space-y-1">
                          <span className="font-extrabold text-gray-950 block">1. Self Belief / Confidence Index</span>
                          <p className="text-[10px] text-gray-550 leading-relaxed">Derived from Bandura's self-efficacy theory. Assesses mental power to perform critical physical actions under stressful spectatorship or game trails.</p>
                          <span className="text-[9px] font-mono text-indigo-600 block mt-1">Formula: Active_Optimism * Intrinsic_Factor</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-indigo-100/50 space-y-1">
                          <span className="font-extrabold text-gray-950 block">2. Pre-Match Anxiety Threshold</span>
                          <p className="text-[10px] text-gray-550 leading-relaxed">Based on the Sport Anxiety Scale (SAS-2). Assesses adrenaline surges, stomach flutters, and how the somatic state regulates prior to game start.</p>
                          <span className="text-[9px] font-mono text-[#e11d48] block mt-1">Formula: Somatic_Arousal + Error_Rumination</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-indigo-100/50 space-y-1">
                          <span className="font-extrabold text-gray-950 block">3. Laser Focus Duration</span>
                          <p className="text-[10px] text-gray-550 leading-relaxed">Measures selective gaze control, concentration duration and the physical ability to filter background noise under fatigue load.</p>
                          <span className="text-[9px] font-mono text-violet-600 block mt-1">Formula: Gating_Efficiency * Exhaustion_Cap</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    
                    {/* Confidence Bar */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Self Belief / Confidence Index
                      </span>
                      <p className="text-2xl font-bold text-slate-900">{studentProfile.confidenceLevel}<span className="text-xs font-normal text-slate-400">/10</span></p>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(studentProfile.confidenceLevel || 0) * 10}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Measures match readiness and self efficacy indicators.</p>
                    </div>

                    {/* Anxiety Bar */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Pre-Match Anxiety Threshold
                      </span>
                      <p className="text-2xl font-bold text-slate-900">{studentProfile.stressLevel}<span className="text-xs font-normal text-slate-400">/10</span></p>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(studentProfile.stressLevel || 0) * 10}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Anxiety triggers and pre-game adrenaline spikes.</p>
                    </div>

                    {/* Attention Bar */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Laser Focus Duration
                      </span>
                      <p className="text-2xl font-bold text-slate-900">{studentProfile.focusLevel}<span className="text-xs font-normal text-slate-400">/10</span></p>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(studentProfile.focusLevel || 0) * 10}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Laser concentration on pitch and during pressure drills.</p>
                    </div>

                  </div>
                  
                  {/* Dynamic Support Areas & Objectives block */}
                  <div className="border-t border-slate-150 pt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
                        Active Support Areas
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {studentProfile.currentChallenges && studentProfile.currentChallenges.length > 0 ? (
                          studentProfile.currentChallenges.map((challenge, index) => (
                            <span key={index} className="px-3 py-1 bg-[#f5f3ff] text-[#4f46e5] font-extrabold text-[10px] uppercase rounded-full border border-[#ddd6fe] flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-300" />
                              ✨ {challenge}
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1 bg-gray-50 text-gray-500 font-extrabold text-[10px] uppercase rounded-full border border-gray-200">
                            ✨ Performance Consistency
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
                        Mental gym objective
                      </span>
                      <p className="text-indigo-600 font-bold bg-[#f5f3ff] border border-indigo-100 px-3 py-1.5 rounded-xl text-[11px] italic max-w-sm">
                        "{studentProfile.goals || "Establish mental baseline & competition down-regulation."}"
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-indigo-50/50 border border-indigo-100 p-6 md:p-8 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-indigo-950">Discover Your High Performance Mental Indices</h4>
                    <p className="text-xs text-indigo-750 max-w-md mx-auto leading-relaxed">
                      You have not completed your baseline sports psychology check yet. In just 2 minutes, YovoEdge can map your confidence, anxiety, and focus indicators.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTestForm(true)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    📝 Launch Diagnostic Assessment Questionnaire
                  </button>
                </div>
              )}

              {/* Personal statements */}
              <div className="mt-2 pt-3 border-t border-slate-200/60 text-[11px] text-slate-550 leading-relaxed flex items-center gap-2 font-mono">
                <span>🏃 Athlete: <strong>{studentProfile.name}</strong></span>
                <span>•</span>
                <span>Age Group: <strong>{studentProfile.age} Match Age</strong></span>
                <span>•</span>
                <span>Competitive Rank: <strong>{studentProfile.competitionLevel} Level</strong></span>
              </div>
            </div>

            {/* INTERACTIVE PRIVATE MIND JOURNAL */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  Self-Therapeutic Journal Logs ({journals.length})
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono">
                  🔒 Private to Student
                </span>
              </div>

              {journals.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Smile className="w-10 h-10 mx-auto stroke-1 text-gray-300" />
                  <p className="text-xs mt-3">Your clinical thoughts timeline is empty. Record your first private diary entry!</p>
                  <button
                    onClick={() => setShowJournalForm(true)}
                    className="mt-4 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Log Current Feeling
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {journals.map((entry) => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 relative group hover:border-violet-200 transition-colors">
                      <button
                        onClick={() => onDeleteJournal(entry.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 rounded p-1 transition-colors hover:bg-red-50"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-800">{entry.title}</span>
                        {entry.mood && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-violet-100/60 text-violet-700">
                            {entry.mood}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono pl-1 border-l border-gray-200">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans pr-8 whitespace-pre-line">{entry.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN: coaching appointments & tasks list */}
          <div className="space-y-8">
            
            {/* Appointments panel */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4 hover:text-violet-700 transition-colors">
                <Calendar className="w-4 h-4 text-violet-600" />
                Therapy Coaching Schedules ({studentSessions.length})
              </h3>

              {studentSessions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Your coaches schedules are empty. Consult your parents to map an appointment!</p>
              ) : (
                <div className="space-y-3">
                  {studentSessions.map((session) => (
                    <div key={session.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800">Coach: {session.therapistName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                          session.status === "completed" 
                            ? "bg-slate-100 text-slate-700" 
                            : session.status === "requested"
                            ? "bg-amber-100 text-amber-700 animate-pulse"
                            : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {session.status === "requested" ? "under review" : session.status}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg text-[10px] text-gray-500 font-mono flex justify-between">
                        <span>📅 {session.date}</span>
                        <span>⏰ {session.timeSlot}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {session.videoLink && session.status !== "completed" && (
                          <a
                            href={session.videoLink}
                            target="_blank"
                            rel="referrer noopener"
                            className="w-full inline-block text-center text-[10px] font-extrabold text-white bg-violet-600 hover:bg-violet-700 py-1.5 rounded-lg transition-colors"
                          >
                            Launch Google Meet Call
                          </a>
                        )}
                        {onOpenChat && (
                          <button
                            onClick={() => onOpenChat(session.id)}
                            className="w-full text-center text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Open Secure Chat Channel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Practice Drills Tips */}
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
              <span className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full" />
              <Dumbbell className="w-8 h-8 text-violet-200" />
              <div>
                <h4 className="text-md font-extrabold tracking-tight">Active Mental Sports Drill</h4>
                <p className="text-xs text-violet-100 leading-relaxed mt-1">
                  Overcoming pre-serve anxiety is like building body muscle. Before execution, do 4 cycles of <strong>4-7-8 deep box breathing</strong>:
                </p>
              </div>
              <ul className="text-[11px] space-y-1 font-sans text-violet-100 list-disc list-inside bg-white/5 p-3 rounded-2xl">
                <li>Belly Inhale: 4 seconds</li>
                <li>Tight Hold: 7 seconds</li>
                <li>Mouth Exhale: 8 seconds</li>
              </ul>
              <p className="text-[10px] text-violet-200 uppercase tracking-widest font-mono text-center">Repeat 4 epochs for laser concentration</p>
            </div>

          </div>

        </div>
      )}

      {/* JOURNAL FORM MODAL ENTRY */}
      {showJournalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-violet-600" />
              Record Mind Journal Entry
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              This diary log is private & encrypted. Write about your training feelings, anxiety patterns, or success blocks.
            </p>

            <form onSubmit={handleJournalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Mood Indicator</label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((m) => (
                    <button
                      type="button"
                      key={m.label}
                      onClick={() => setJournalMood(m.label)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors text-left ${
                        journalMood === m.label ? `${m.color} border-violet-600` : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Entry Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tough football practice today"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">What's on your mind?</label>
                <textarea
                  rows={4}
                  placeholder="Today I felt some concentration pressure during tournament trials. I focused on box breathing..."
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowJournalForm(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJournal}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  {savingJournal ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFIT SELF ASSESSMENT MODAL */}
      {showTestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150">
            <AssessmentWizard
              age={studentProfile?.age || 15}
              sport={studentProfile?.sport || "Athletics"}
              onComplete={handleAssessmentComplete}
              onCancel={() => setShowTestForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
