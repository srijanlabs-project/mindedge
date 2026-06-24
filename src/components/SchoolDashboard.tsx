import React, { useState } from "react";
import { SchoolProfile, StudentProfile } from "../types";
import { 
  GraduationCap, Calendar, Users, BarChart3, Clock, NotebookTabs, 
  Sparkles, CheckSquare, PlusCircle, VolumeX, ShieldAlert 
} from "lucide-react";

interface SchoolDashboardProps {
  schoolProfile: SchoolProfile | null;
  students: StudentProfile[];
}

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({
  schoolProfile,
  students,
}) => {
  const [showAddWorkshop, setShowAddWorkshop] = useState(false);
  const [workshops, setWorkshops] = useState([
    { id: "w-1", title: "Sample: Defeating Exam and Athlete Evaluation Anxiety", date: "2026-06-12", time: "02:00 PM", host: "Dr. Ananya Sharma", attendance: 250, sample: true },
    { id: "w-2", title: "Sample: Parenting Elite Athlete Mindsets on Sidelines", date: "2026-06-25", time: "11:00 AM", host: "Sarah Jenkins", attendance: 120, sample: true }
  ]);

  const [wTitle, setWTitle] = useState("");
  const [wDate, setWDate] = useState("");
  const [wTime, setWTime] = useState("");
  const [wHost, setWHost] = useState("");

  const handleAddWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wTitle || !wDate || !wHost) return;
    setWorkshops([
      ...workshops,
      {
        id: `w-${Date.now()}`,
        title: wTitle,
        date: wDate,
        time: wTime || "12:00 PM",
        host: wHost,
        attendance: 0,
        sample: false,
      }
    ]);
    setShowAddWorkshop(false);
    setWTitle("");
    setWHost("");
  };

  // Filter out students who are listed under this school
  const schoolNameKey = (schoolProfile?.schoolName || "").toLowerCase().trim();
  const catalogSchoolId = schoolProfile?.catalogSchoolId;
  const schoolStudents = students.filter(
    (s) => catalogSchoolId
      ? s.schoolCatalogId === catalogSchoolId
      : !!(s.school && s.school.toLowerCase().trim().includes(schoolNameKey))
  );

  // Compute mock localized metrics for visual charts
  const avgConfidence = schoolStudents.length > 0 
    ? Math.round(schoolStudents.reduce((acc, current) => acc + (current.confidenceLevel || 8), 0) / schoolStudents.length) 
    : 8;

  const avgAnxiety = schoolStudents.length > 0 
    ? Math.round(schoolStudents.reduce((acc, current) => acc + (current.stressLevel || 4), 0) / schoolStudents.length) 
    : 4;

  const avgFocus = schoolStudents.length > 0 
    ? Math.round(schoolStudents.reduce((acc, current) => acc + (current.focusLevel || 7), 0) / schoolStudents.length) 
    : 7;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-3xl p-6 md:p-8 border border-amber-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            Institutional Partner Console
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">
            {schoolProfile?.schoolName || "Participating Partner School"} Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Oversee combined athletic mental wellness indicators, plan group psychology webinars, and check localized school statistics.
          </p>
        </div>
        <button
          onClick={() => setShowAddWorkshop(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Schedule Mindset Webinar Workshop
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: Scientific Analytics & student directory */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* BAR CHART GRAPH FOR DIAGNOSTIC METRICS */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 leading-tight mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                Aggregated Sports Mental indices ({schoolStudents.length} Active Athletes)
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                Localized School Metrics
              </span>
            </h3>

            {/* Custom crafted bar chart for analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 select-none">
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between h-40">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest font-mono">School Confidence Average</p>
                  <p className="text-4xl font-black mt-2 text-emerald-900">{avgConfidence}<span className="text-xs font-normal">/10</span></p>
                </div>
                <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgConfidence * 10}%` }} />
                </div>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col justify-between h-40">
                <div>
                  <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest font-mono font-mono">School Tension Anxiety Avg</p>
                  <p className="text-4xl font-black mt-2 text-rose-900">{avgAnxiety}<span className="text-xs font-normal">/10</span></p>
                </div>
                <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${avgAnxiety * 10}%` }} />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col justify-between h-40">
                <div>
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest font-mono">Laser focus Average</p>
                  <p className="text-4xl font-black mt-2 text-amber-900">{avgFocus}<span className="text-xs font-normal">/10</span></p>
                </div>
                <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${avgFocus * 10}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* Student directory registered under school */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5 font-sans">
              <Users className="w-4 h-4 text-amber-600" />
              School Registered Athletes List ({schoolStudents.length})
            </h3>

            {schoolStudents.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-xs">No students registered from your school yet. Students and parents will map here when they select "{schoolProfile?.schoolName}" from the approved school list.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-2">Athlete Full Name</th>
                      <th className="py-2">Sport Focus</th>
                      <th className="py-2 text-center">Confidence</th>
                      <th className="py-2 text-center">Tension</th>
                      <th className="py-2">Active Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {schoolStudents.map((stud) => (
                      <tr key={stud.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 font-bold text-gray-800">{stud.name} (Age {stud.age})</td>
                        <td className="py-2.5 font-semibold text-violet-600">🏃 {stud.sport}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">{stud.confidenceLevel || 8}/10</td>
                        <td className="py-2.5 text-center font-semibold text-rose-500">{stud.stressLevel || 4}/10</td>
                        <td className="py-2.5 max-w-40 truncate font-mono text-gray-400">{stud.currentChallenges?.join(", ") || "Resilient Athlete"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN: Group psychology webinar workshops */}
        <div className="space-y-8">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4 font-sans">
              <Calendar className="w-4 h-4 text-amber-500" />
              Mindset Group Webinars scheduled ({workshops.length})
            </h3>

            <div className="space-y-4">
              {workshops.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[9px] rounded font-bold uppercase tracking-wider font-mono">
                    {w.sample ? "Sample seminar" : "Scheduled seminar"}
                  </span>
                  <p className="text-xs font-extrabold text-gray-800 leading-tight">{w.title}</p>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">Host: 👩‍⚕️ {w.host}</p>

                  <div className="p-2 rounded-xl bg-white border border-gray-100 text-[10px] text-gray-500 font-mono flex justify-between">
                    <span>📅 {w.date}</span>
                    <span>⏰ {w.time}</span>
                  </div>
                  
                  {w.attendance > 0 && (
                    <span className="text-[9px] text-gray-400 block font-mono">Estimated attendance: {w.attendance} students</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Counselor config status */}
          <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 space-y-3">
            <NotebookTabs className="w-8 h-8 text-amber-600" />
            <h4 className="text-sm font-bold text-gray-900 tracking-tight">Institution Counselor Contacts</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Configured Contact: <strong>{schoolProfile?.contactPerson || "None"}</strong> • {schoolProfile?.phone || "No phone added"}
            </p>
            <div className="p-3 bg-white rounded-xl border border-amber-100/30 text-[11px] text-gray-500 font-sans italic">
              "Local Counselor Affiliation details: {schoolProfile?.existingCounselorDetails || "Standard wellness guidance."}"
            </div>
          </div>

        </div>

      </div>

      {/* SCHEDULE MINDSET WEB WORKSHOP MODAL */}
      {showAddWorkshop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Mindset Web Webinar</h3>
            <p className="text-xs text-gray-500 mb-6">
              Create a group video workshop for students and parent sidelines covering performance and exam anxiety.
            </p>

            <form onSubmit={handleAddWorkshopSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Webinar Title</label>
                <input
                  type="text"
                  placeholder="e.g. Focus training during high-pressure games"
                  value={wTitle}
                  onChange={(e) => setWTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Date</label>
                  <input
                    type="date"
                    value={wDate}
                    onChange={(e) => setWDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 03:00 PM"
                    value={wTime}
                    onChange={(e) => setWTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Host Therapist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ananya Sharma"
                  value={wHost}
                  onChange={(e) => setWHost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 font-sans">
                <button
                  type="button"
                  onClick={() => setShowAddWorkshop(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Schedule Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
