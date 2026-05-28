import React, { useState } from "react";
import { TherapistProfile, Appointment } from "../types";
import { 
  Briefcase, Calendar, Clock, DollarSign, PenTool, Edit3, Save, 
  CheckCircle, Plus, Users, User, ArrowUpRight, CheckSquare, MessageSquare
} from "lucide-react";

interface TherapistDashboardProps {
  therapistProfile: TherapistProfile | null;
  appointments: Appointment[];
  onUpdateAvailability: (profileData: any) => Promise<void>;
  onAddSessionNotes: (appointmentId: string, notes: string) => Promise<void>;
  onConfirmBookingRequest: (appointmentId: string) => Promise<void>;
  onOpenChat: (appointmentId: string) => void;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({
  therapistProfile,
  appointments,
  onUpdateAvailability,
  onAddSessionNotes,
  onConfirmBookingRequest,
  onOpenChat
}) => {
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [sessionFee, setSessionFee] = useState(therapistProfile?.sessionFee || 1000);
  const [selectedDays, setSelectedDays] = useState<string[]>(therapistProfile?.availableDays || ["Mon", "Wed", "Fri"]);
  const [biography, setBiography] = useState(therapistProfile?.biography || "");
  const [updating, setUpdating] = useState(false);

  // Notes state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [notesText, setNotesText] = useState("");
  const [submittingNotes, setSubmittingNotes] = useState(false);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Filter appointments for this therapist
  const therapistAppointments = appointments.filter(
    (a) => a.therapistId === therapistProfile?.id && a.paymentStatus === "paid"
  );

  const upcomingSessions = therapistAppointments.filter(
    (a) => a.status === "confirmed" || a.status === "requested"
  );
  
  const completedSessions = therapistAppointments.filter(
    (a) => a.status === "completed"
  );

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleUpdateAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await onUpdateAvailability({
        sessionFee: Number(sessionFee),
        availableDays: selectedDays,
        biography
      });
      setEditingAvailability(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId || !notesText) return;
    setSubmittingNotes(true);
    try {
      await onAddSessionNotes(selectedAppointmentId, notesText);
      setSelectedAppointmentId("");
      setNotesText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNotes(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-400/10 via-sky-500/5 to-transparent rounded-3xl p-6 md:p-8 border border-sky-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            Clinical Practitioner Portal
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">Therapist Office & Availability Panel</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Record confidential diagnostic insights, edit standard session fees, and verify scheduling time blocks.
          </p>
        </div>
        {!therapistProfile?.isApproved ? (
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-amber-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-ping" />
            Verification Pending: Approved status required to enter Search marketplace
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Active Certified Practitioner
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: Session calendar & clinical notes */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active calendar sessions */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                Underway Session Calendars ({upcomingSessions.length})
              </h3>
            </div>

            {upcomingSessions.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-xs">No active verified appointments registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 relative hover:border-sky-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{session.studentName}</p>
                        <p className="text-[10px] text-gray-500 font-sans">Role: {session.bookerType}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold bg-sky-100 text-sky-800">
                        {session.status}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-xl text-[10px] text-gray-500 font-mono flex justify-between">
                      <span>📅 {session.date}</span>
                      <span>⏰ {session.timeSlot}</span>
                    </div>

                    {session.status === "requested" && (
                      <button
                        onClick={() => onConfirmBookingRequest(session.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Booking & Schedule GMeet
                      </button>
                    )}

                    <div className="flex flex-wrap justify-between items-center gap-2 pt-1.5 border-t border-gray-100 text-[10px] font-semibold text-gray-600">
                      <div className="flex items-center gap-3">
                        {session.videoLink ? (
                          <a 
                            href={session.videoLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-violet-600 hover:underline flex items-center gap-0.5"
                          >
                            Launch Call <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 font-sans italic">Call pending activation</span>
                        )}

                        <button
                          onClick={() => onOpenChat(session.id)}
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <MessageSquare className="w-3 h-3" /> Chat Room
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAppointmentId(session.id);
                          setNotesText(session.sessionNotes || "");
                        }}
                        className="text-slate-600 hover:underline flex items-center gap-0.5"
                      >
                        Clinical Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLINICAL SESSION NOTES EDITOR */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 mb-2">
              <PenTool className="w-5 h-5 text-sky-600" />
              Confidential clinical diagnostic updates
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Select an ongoing session below to log notes (coaching progress and key mental health focus areas).
            </p>

            <form onSubmit={handleNotesSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Select Appointment Session</label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAppointmentId(id);
                    const found = therapistAppointments.find(a => a.id === id);
                    setNotesText(found?.sessionNotes || "");
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  required
                >
                  <option value="">-- Choose active session --</option>
                  {therapistAppointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.date} {a.timeSlot}] For Athlete: {a.studentName} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAppointmentId && (
                <div className="animate-in fade-in duration-150 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 mr-auto">Clinical Log & Action Guidelines</label>
                    <textarea
                      rows={4}
                      placeholder="Add mental drills, box breathing tasks, or stress mapping guidelines discussed during play coach sessions..."
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      disabled={submittingNotes}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all shrink-0"
                    >
                      {submittingNotes ? "Saving notes..." : "Save Session Notes"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* RIGHT SIDEBAR: Availabilities & Fees editors */}
        <div className="space-y-8">
          
          {/* Availability Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                Workplace Scheduling
              </h3>
              {!editingAvailability && (
                <button
                  onClick={() => setEditingAvailability(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {editingAvailability ? (
              <form onSubmit={handleUpdateAvailabilitySubmit} className="space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Standard Hourly rate (INR)</label>
                  <input
                    type="number"
                    min="300"
                    max="10000"
                    value={sessionFee}
                    onChange={(e) => setSessionFee(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Available Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {daysOfWeek.map((day) => {
                      const contains = selectedDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            contains 
                              ? "bg-indigo-600 text-white border-indigo-600" 
                              : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Biography Statement</label>
                  <textarea
                    rows={3}
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAvailability(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 p-1 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    {updating ? "Saving..." : "Save config"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-medium text-gray-700">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <span>Standard Session Rate:</span>
                  <span className="font-extrabold text-indigo-700 text-sm">₹{therapistProfile?.sessionFee || 1000}/hr</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">My Active Days:</p>
                  <div className="flex flex-wrap gap-1">
                    {(therapistProfile?.availableDays || ["Mon", "Wed", "Fri"]).map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200/40 rounded font-bold">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Languages Spoken:</p>
                  <p className="text-gray-600 leading-relaxed font-sans">{therapistProfile?.languages || "English"}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Coaching Statement bio:</p>
                  <p className="text-gray-500 leading-relaxed font-sans line-clamp-3 italic">"{therapistProfile?.biography || 'Professional sports performance coach.'}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics statistics */}
          <div className="bg-sky-500/5 p-6 rounded-3xl border border-sky-500/10 space-y-3">
            <Users className="w-8 h-8 text-sky-600" />
            <h4 className="text-sm font-bold text-gray-900 tracking-tight">Practice Office metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 bg-white rounded-xl border border-sky-100/30">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Total bookings</p>
                <p className="text-xl font-extrabold text-sky-900 mt-1">{therapistAppointments.length}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-sky-100/30">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Completed hrs</p>
                <p className="text-xl font-extrabold text-sky-900 mt-1">{completedSessions.length}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
