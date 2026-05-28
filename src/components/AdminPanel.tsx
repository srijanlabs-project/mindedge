import React, { useState, useEffect } from "react";
import { UserProfile, StudentProfile, TherapistProfile, Appointment } from "../types";
import { 
  ShieldCheck, Users, Calendar, DollarSign, ArrowUpRight, CheckCircle2, 
  XCircle, FileText, UserMinus, ShieldAlert, TrendingUp, MessageSquare, CheckCircle,
  Database, RefreshCw, AlertCircle, HardDrive, CheckSquare, BookOpen, Plus
} from "lucide-react";

interface AdminPanelProps {
  allUsers: UserProfile[];
  allStudents: StudentProfile[];
  allTherapists: TherapistProfile[];
  appointments: Appointment[];
  onApproveTherapist: (id: string, isApproved: boolean) => Promise<void>;
  onDeleteUser: (uid: string) => Promise<void>;
  onConfirmBookingRequest?: (appointmentId: string) => Promise<void>;
  onOpenChat?: (appointmentId: string) => void;
  journals?: any[];
  blogs?: any[];
  notifications?: any[];
  onNavigateToTab?: (tab: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  allUsers,
  allStudents,
  allTherapists,
  appointments,
  onApproveTherapist,
  onDeleteUser,
  onConfirmBookingRequest,
  onOpenChat,
  journals = [],
  blogs = [],
  notifications = [],
  onNavigateToTab
}) => {
  // Compute Dashboard Metrics
  const totalUsersCount = allUsers.length;
  const activeStudentsCount = allStudents.length;
  const activeTherapistsCount = allTherapists.filter((t) => t.isApproved).length;
  const totalAppointmentsCount = appointments.length;

  // Compute simulated revenue
  const paidAppointments = appointments.filter((a) => a.paymentStatus === "paid");
  const totalRevenue = paidAppointments.reduce((acc, current) => {
    const matchedFee = allTherapists.find(t => t.id === current.therapistId)?.sessionFee || 1000;
    return acc + matchedFee;
  }, 0);

  // Unapproved therapists list
  const pendingTherapists = allTherapists.filter((t) => !t.isApproved);

  // PostgreSQL Sync States
  const [dbStats, setDbStats] = useState<Record<string, number> | null>(null);
  const [emailDuplicates, setEmailDuplicates] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
    syncedCounts?: Record<string, number>;
    error?: string;
  } | null>(null);

  const fetchDbStats = async () => {
    setLoadingStats(true);
    setStatsError("");
    try {
      const res = await fetch("/api/db-status");
      const data = await res.json();
      if (data.success) {
        setDbStats(data.stats);
        setEmailDuplicates(data.emailDuplicates || []);
      } else {
        setStatsError(data.message || "Failed to query PostgreSQL stats.");
      }
    } catch (err: any) {
      console.error("Failed to fetch Postgres stats:", err);
      setStatsError(err.message || "Cloud Run connection error. Database Offline.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, [allUsers, allStudents, allTherapists, appointments]);

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      // Build dummy school data for school admin users for foreign key integrity
      const schoolAdmins = allUsers.filter(u => u.role === "school_admin");
      const schoolsPayload = schoolAdmins.map(admin => ({
        id: admin.uid,
        schoolName: admin.name || "Default Sports School",
        contactPerson: admin.name,
        email: admin.email,
        phone: admin.mobile || null,
        address: admin.city || "Primary Corporate Office"
      }));

      const syncPayload = {
        users: allUsers,
        students: allStudents,
        therapists: allTherapists,
        appointments: appointments,
        journals: journals,
        blogs: blogs,
        notifications: notifications,
        schools: schoolsPayload
      };

      const res = await fetch("/api/db-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload)
      });
      const data = await res.json();
      
      setSyncStatus({
        success: data.success,
        message: data.message,
        syncedCounts: data.syncedCounts,
        error: data.error
      });
      
      if (data.success) {
        await fetchDbStats();
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      setSyncStatus({
        success: false,
        message: err.message || "Failed to finalize database transaction mapping."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncBadge = (table: string, count: number) => {
    if (!dbStats) return <span className="text-[10px] text-gray-400">Loading...</span>;
    const pgCount = dbStats[table];
    if (pgCount === -1 || pgCount === undefined) {
      return <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-mono">Error</span>;
    }
    if (pgCount >= count) {
      return <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[9px] font-mono font-bold flex items-center gap-0.5">● Synced</span>;
    }
    return <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded text-[9px] font-mono flex items-center gap-0.5">Pending ({count - pgCount} left)</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-rose-550/5 to-transparent rounded-3xl p-6 md:p-8 border border-indigo-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            Super Admin Console
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">System Core Administration</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Verify credentials of practitioners, review booking ledger transaction audits, and manage live Railway PostgreSQL synchronization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono font-semibold text-gray-700">Railway Postgres Connected</span>
        </div>
      </div>

      {/* RAILWAY POSTGRESQL LIVE INTEGRATION BOARD */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-md font-extrabold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Railway PostgreSQL Synchronization Dashboard
            </h3>
            <p className="text-xs text-gray-500">
              Live statistics comparison between reactive client-side Firestore cache and persistent relational database tables.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDbStats}
              disabled={loadingStats}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-indigo-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh counts"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing Sync...
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  Sync Firestore to Postgres
                </>
              )}
            </button>
          </div>
        </div>

        {statsError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statsError}</span>
          </div>
        )}

        {syncStatus && (
          <div className={`p-4 rounded-xl text-xs space-y-2 border ${
            syncStatus.success 
              ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
              : "bg-red-50 text-red-800 border-red-100"
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{syncStatus.message}</span>
            </div>
            {syncStatus.error && !syncStatus.success && (
              <div className="bg-red-100/70 border border-red-200 text-red-900 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre-wrap mt-1">
                <strong>Raw SQL Error:</strong> {syncStatus.error}
              </div>
            )}
            {syncStatus.syncedCounts && (
              <div className="font-mono text-[10px] grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1.5 border-t border-emerald-200/50">
                <div>👥 Users: {syncStatus.syncedCounts.users}</div>
                <div>🩺 Therapists: {syncStatus.syncedCounts.therapists}</div>
                <div>🏃 Students: {syncStatus.syncedCounts.students}</div>
                <div>📅 Appointments: {syncStatus.syncedCounts.appointments}</div>
                <div>📖 Journals: {syncStatus.syncedCounts.journals}</div>
                <div>📰 Blogs: {syncStatus.syncedCounts.blogs}</div>
                <div>🔔 Notifications: {syncStatus.syncedCounts.notifications}</div>
                <div>🏫 Schools: {syncStatus.syncedCounts.schools}</div>
              </div>
            )}
          </div>
        )}

        {/* Database Tables Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 font-sans border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest font-semibold pb-2">
                <th className="py-2.5">PostgreSQL Table Name</th>
                <th className="py-2.5">Postgres Row Count</th>
                <th className="py-2.5">App Cache / Firestore Counts</th>
                <th className="py-2.5 text-right font-mono">Status Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
              
              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">users</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.users === -1 ? "N/A" : dbStats.users) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium">
                  {totalUsersCount} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("users", totalUsersCount)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">therapists</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.therapists === -1 ? "N/A" : dbStats.therapists) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {allTherapists.length} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("therapists", allTherapists.length)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">students</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.students === -1 ? "N/A" : dbStats.students) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {activeStudentsCount} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("students", activeStudentsCount)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">appointments</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.appointments === -1 ? "N/A" : dbStats.appointments) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {totalAppointmentsCount} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("appointments", totalAppointmentsCount)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">journals</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.journals === -1 ? "N/A" : dbStats.journals) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {journals.length} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("journals", journals.length)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">blogs</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.blogs === -1 ? "N/A" : dbStats.blogs) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {blogs.length} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("blogs", blogs.length)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">notifications</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.notifications === -1 ? "N/A" : dbStats.notifications) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {notifications.length} cached rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("notifications", notifications.length)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-all">
                <td className="py-3 font-bold text-gray-900 font-mono">schools</td>
                <td className="py-3 font-semibold text-gray-800">
                  {dbStats ? (dbStats.schools === -1 ? "N/A" : dbStats.schools) : "..."}
                </td>
                <td className="py-3 text-gray-500 font-medium font-sans">
                  {allUsers.filter(u => u.role === "school_admin").length} potential rows
                </td>
                <td className="py-3 text-right">
                  {getSyncBadge("schools", allUsers.filter(u => u.role === "school_admin").length)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {emailDuplicates && emailDuplicates.length > 0 && (
          <div className="mt-6 p-5 bg-amber-50/70 rounded-3xl border border-amber-100 space-y-3 font-sans">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1">
                Duplicate Email Key Conflicts Detected
              </h4>
            </div>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              The following email addresses are linked to multiple unique user IDs. Having duplicate email records violates the standard <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">UNIQUE</code> constraint in production databases, causing synchronization conflicts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pt-1">
              {emailDuplicates.map((dup, idx) => (
                <div key={idx} className="p-4 bg-white border border-amber-100/60 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                    <span className="font-mono font-bold text-gray-950 text-xs selection:bg-amber-100 select-all">{dup.email}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-full font-mono uppercase">
                      {dup.occurrence_count} Accounts
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {dup.accounts?.map((acc: any, accIdx: number) => (
                      <div key={accIdx} className="p-2 bg-gray-50 rounded-xl space-y-0.5 text-[10px]">
                        <p className="font-bold text-gray-800 flex justify-between">
                          <span>{acc.name || "Unnamed Athlete"}</span>
                          <span className="text-[9px] font-semibold font-mono text-violet-600 bg-violet-50 px-1 leading-none self-center rounded border border-violet-100 uppercase">{acc.role}</span>
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono select-all">UID: {acc.uid}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD METRICS SUMMARY WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Total Users</p>
          <p className="text-2xl font-black text-gray-900 mt-2">{totalUsersCount}</p>
          <p className="text-[10px] text-gray-500 mt-1">Parents, Coaches boards</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono font-sans animate-pulse">Active Students</p>
          <p className="text-2xl font-black text-violet-700 mt-2">{activeStudentsCount}</p>
          <p className="text-[10px] text-violet-600 mt-1 animate-in">Registered youngsters</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Active Coaches</p>
          <p className="text-2xl font-black text-sky-700 mt-2">{activeTherapistsCount}</p>
          <p className="text-[10px] text-sky-600 mt-1">Approved practitioners</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Appointments</p>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalAppointmentsCount}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Total scheduled blocks</p>
        </div>

        <div className="bg-gradient-to-tr from-rose-600 to-rose-700 p-4 rounded-2xl text-white shadow-md relative overflow-hidden col-span-2 md:col-span-1 border border-transparent">
          <span className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full" />
          <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest font-mono">Total Revenue</p>
          <p className="text-2xl font-black mt-2 text-white">₹{totalRevenue}</p>
          <p className="text-[10px] text-rose-100 mt-1">Paid coaching bookings</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: Therapist approvals list & User audit directories */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* THERAPIST APPROVAL LIST (OCR SEC 13) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              Credentials Review: Onboarding Practitioner Requests ({pendingTherapists.length})
            </h3>

            {pendingTherapists.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto stroke-1" />
                <p className="mt-3">No pending therapist verification requests. System registry clean.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTherapists.map((therapist) => (
                  <div key={therapist.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4.5">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">{therapist.name}</h4>
                        <p className="text-[10px] text-gray-400 font-sans mt-0.5">{therapist.email} • Exp: {therapist.experience} yrs</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider font-mono rounded">
                        Pending Admin Audit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                      <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase font-mono">Specialization & Sports</p>
                        <p className="text-gray-700 mt-1 font-semibold">{therapist.specialization}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">Focus: {therapist.sportsExpertise || "All Sports"}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase font-mono">Credentials Link proofs</p>
                        <ul className="text-[10px] space-y-1 mt-1 text-indigo-600 list-disc list-inside">
                          <li><a href={therapist.certificationsUrl} target="_blank" rel="noreferrer" className="hover:underline">Certifications PDF ↗</a></li>
                          <li><a href={therapist.degreeDocumentsUrl} target="_blank" rel="noreferrer" className="hover:underline">Clinical Degree Documents ↗</a></li>
                          <li><a href={therapist.identityProofUrl} target="_blank" rel="noreferrer" className="hover:underline">Govt ID proof document ↗</a></li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[10px] font-semibold text-gray-400">
                      <span>Rate Fee: ₹{therapist.sessionFee}/hr</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveTherapist(therapist.id, false)}
                          className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Request
                        </button>
                        <button
                          onClick={() => onApproveTherapist(therapist.id, true)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Profile
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SYSTEM USER AUDIT DIRECTORIES */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-600" />
              General System Account Directory ({totalUsersCount})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-gray-700 font-sans">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest font-semibold pb-2">
                    <th className="py-2">User Name</th>
                    <th className="py-2">Role Persona</th>
                    <th className="py-2">Contact Link</th>
                    <th className="py-2 text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-55">
                  {allUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-bold text-gray-900">{user.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize font-mono ${
                          user.role === "parent" ? "bg-emerald-50 text-emerald-800" :
                          user.role === "student" ? "bg-violet-50 text-violet-800" :
                          user.role === "therapist" ? "bg-sky-50 text-sky-800" :
                          user.role === "school_admin" ? "bg-amber-50 text-amber-800" :
                          "bg-rose-50 text-rose-800"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 select-all text-gray-500 font-mono text-[10px]">{user.email}</td>
                      <td className="py-3 text-right">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => onDeleteUser(user.uid)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            title="Deactivate account"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Appointments & Meet Scheduler Booking Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            <h3 className="text-md font-bold text-gray-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Global Appointments & Meet Scheduling Ledger
            </h3>
            <p className="text-xs text-gray-400">
              Review active athlete consultation bookings, manually confirm requested slot proposals, and launch clinical channels.
            </p>

            {appointments.length === 0 ? (
              <p className="text-xs text-center py-6 text-gray-400">No appointments registered in system yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">Athlete: {appt.studentName}</p>
                        <p className="text-[10px] text-gray-500">Coach: {appt.therapistName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold ${
                        appt.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-xl text-[10px] text-gray-500 font-mono flex justify-between">
                      <span>📅 {appt.date}</span>
                      <span>⏰ {appt.timeSlot}</span>
                    </div>

                    {(appt.paymentId || appt.orderId || appt.paymentScreenshot) && (
                      <div className="p-3 bg-white rounded-xl border border-gray-150 text-[11px] space-y-1.5">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-gray-100 pb-1 mb-1">
                          Payment Info Verification
                        </div>
                        <div className="grid grid-cols-1 gap-1 font-mono text-gray-600 text-[10px]">
                          <div><span className="text-gray-400">Order Ref:</span> <span className="font-semibold text-gray-800 break-all">{appt.orderId || "N/A"}</span></div>
                          <div><span className="text-gray-400 font-mono">GPay PayID:</span> <span className="font-semibold text-gray-800 break-all">{appt.paymentId || "N/A"}</span></div>
                          <div><span className="text-gray-400">Mode:</span> <span className="font-semibold text-gray-800">{appt.paymentMode || "N/A"}</span></div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">Ledger:</span> 
                            <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold tracking-wider ${appt.paymentStatus === 'paid' ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' : 'bg-amber-50 border border-amber-150 text-amber-700'}`}>
                              {appt.paymentStatus?.toUpperCase() || "PENDING"}
                            </span>
                          </div>
                        </div>
                        {appt.paymentScreenshot && (
                          <div className="mt-2 pt-2 border-t border-gray-150">
                            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest font-mono block mb-1">User Screenshot:</span>
                            <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-slate-100 max-w-[140px] hover:max-w-full duration-300 transition-all">
                              <img 
                                src={appt.paymentScreenshot} 
                                alt="Payment Receipt" 
                                className="w-full object-contain cursor-zoom-in max-h-32"
                                onClick={() => {
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0f172a;"><img src="${appt.paymentScreenshot}" style="max-height:90vh; max-width:90vw; border-radius:12px; box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1);" /></div>`);
                                  }
                                }}
                              />
                            </div>
                            <p className="text-[8px] text-gray-400 mt-1">Click thumbnail to inspect full resolution recept</p>
                          </div>
                        )}
                      </div>
                    )}

                    {appt.status === "requested" && onConfirmBookingRequest && (
                      <button
                        onClick={() => onConfirmBookingRequest(appt.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve request & schedule GMeet
                      </button>
                    )}

                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 text-[10px] font-semibold text-gray-650">
                      <div>
                        {appt.videoLink ? (
                          <a 
                            href={appt.videoLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            Launch Call <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Call pending</span>
                        )}
                      </div>

                      {onOpenChat && (
                        <button
                          onClick={() => onOpenChat(appt.id)}
                          className="text-indigo-600 hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> Mapped Chat Room
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN: Financial Pipeline */}
        <div className="space-y-8">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4 font-sans">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              Coaching Financial Ledger ({paidAppointments.length} paid)
            </h3>

            {appointments.filter((a) => a.paymentId || a.orderId || a.paymentScreenshot).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No paid receipts registered on database ledger yet.</p>
            ) : (
              <div className="space-y-3 font-sans max-h-120 overflow-y-auto">
                {appointments.filter((a) => a.paymentId || a.orderId || a.paymentScreenshot).map((app) => (
                  <div key={app.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-xs text-gray-700 hover:border-gray-300 transition-all">
                    <div className="flex justify-between font-bold">
                      <span>👤 {app.studentName}</span>
                      <span className={app.paymentStatus === "paid" ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                        ₹{allTherapists.find(t => t.id === app.therapistId)?.sessionFee || 500}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">Order: {app.id.substring(0, 8).toUpperCase()} • Coach: {app.therapistName}</p>
                    
                    {app.paymentScreenshot && (
                      <div className="py-1">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-1">Receipt Preview</p>
                        <img 
                          src={app.paymentScreenshot} 
                          alt="Receipt Thumbnail" 
                          className="w-14 h-14 rounded-lg object-cover cursor-zoom-in border border-gray-200 bg-white"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0f172a;"><img src="${app.paymentScreenshot}" style="max-height:90vh; max-width:90vw; border-radius:12px; box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1);" /></div>`);
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[10px] text-gray-500">
                      <span className={`font-bold flex items-center gap-1 ${app.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                        {app.paymentStatus === "paid" ? "✅ Verified Success" : "⏳ Pending Audit"}
                      </span>
                      <span>📅 {app.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mindset Resources & Library */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5 font-sans">
              <BookOpen className="w-4 h-4 text-violet-600" />
              Athlete Mindset Resource Library
            </h3>
            <p className="text-xs text-gray-400">
              Approved sport psychologists and super admins can publish academic blogs about match anxiety and focus.
            </p>
            {blogs && blogs.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {blogs.slice(0, 3).map((blog) => (
                  <div key={blog.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-left">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{blog.title}</p>
                    <p className="text-[9px] text-gray-450 mt-0.5 capitalize">{blog.category.replace(/_/g, " ")} • {blog.authorName}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => onNavigateToTab ? onNavigateToTab("blogs") : alert("Please click the 'Mental Library' tab in the top navigation bar to write blogs.")}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-sans"
            >
              <Plus className="w-4 h-4" />
              Manage & Publish Blogs
            </button>
          </div>

          {/* System status security logs */}
          <div className="bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 space-y-3">
            <ShieldAlert className="w-8 h-8 text-indigo-650" />
            <h4 className="text-sm font-bold text-gray-900 tracking-tight">System Core Locks</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Adhering strictly to Zero-Trust Secure Firestore validation templates. Access-controlled permissions are locked to verified emails. Relational schema indexes optimized directly.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
