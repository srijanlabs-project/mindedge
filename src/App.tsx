import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import {
  Appointment,
  BlogArticle,
  JournalEntry,
  NotificationItem,
  SchoolCatalogItem,
  SchoolProfile,
  StudentProfile,
  TherapistProfile,
  UserProfile,
  UserRole,
} from "./types";
import { Navbar } from "./components/Navbar";
import { AboutPage } from "./components/AboutPage";
import { FoundersPage } from "./components/FoundersPage";
import { ContactPage } from "./components/ContactPage";
import { TherapistDiscovery } from "./components/TherapistDiscovery";
import { BlogSection } from "./components/BlogSection";
import { Onboarding } from "./components/Onboarding";
import { ParentDashboard } from "./components/ParentDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { TherapistDashboard } from "./components/TherapistDashboard";
import { SchoolDashboard } from "./components/SchoolDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { CommunicationHub } from "./components/CommunicationHub";
import { BookingModal } from "./components/BookingModal";

type AppSession = {
  profile: UserProfile | null;
  details: StudentProfile | TherapistProfile | SchoolProfile | null;
};

type BootstrapPayload = {
  session: AppSession | null;
  users: UserProfile[];
  students: StudentProfile[];
  therapists: TherapistProfile[];
  appointments: Appointment[];
  blogs: BlogArticle[];
  journals: JournalEntry[];
  notifications: NotificationItem[];
  schoolCatalog: SchoolCatalogItem[];
};

const SESSION_TOKEN_KEY = "yovoedge_session_token";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [generalError, setGeneralError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileDetails, setProfileDetails] = useState<AppSession["details"]>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [schoolCatalog, setSchoolCatalog] = useState<SchoolCatalogItem[]>([]);

  const [authMobile, setAuthMobile] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [showBookingTherapist, setShowBookingTherapist] = useState<TherapistProfile | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const authHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const applyBootstrap = (data: BootstrapPayload) => {
    setProfile(data.session?.profile || null);
    setProfileDetails(data.session?.details || null);
    setAllUsers(data.users || []);
    setStudents(data.students || []);
    setTherapists(data.therapists || []);
    setAppointments(data.appointments || []);
    setBlogs(data.blogs || []);
    setJournals(data.journals || []);
    setNotifications(data.notifications || []);
    setSchoolCatalog(data.schoolCatalog || []);
  };

  const refreshData = async () => {
    try {
      setGeneralError("");
      const response = await fetch("/api/bootstrap", {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load application data.");
      }

      applyBootstrap(data);

      if (data.session?.profile) {
        if (data.session.profile.profileCompleted === false) {
          setActiveTab("onboarding");
        } else if (["about", "login", "onboarding", "founders", "contact"].includes(activeTab)) {
          setActiveTab("dashboard");
        }
      } else if (!["about", "therapists", "blogs", "founders", "contact", "login"].includes(activeTab)) {
        setActiveTab("about");
      }
    } catch (error: any) {
      console.error("Failed to bootstrap app:", error);
      setGeneralError(error.message || "Failed to load application data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const parentStudents = useMemo(
    () => students.filter((student) => student.parentId === profile?.uid),
    [students, profile?.uid],
  );

  const studentProfile = useMemo(() => {
    const fromList = students.find((student) => student.id === profile?.uid || student.studentId === profile?.uid);
    return fromList || ((profileDetails as StudentProfile | null) ?? null);
  }, [students, profile?.uid, profileDetails]);

  const therapistProfile = useMemo(() => {
    const fromList = therapists.find((therapist) => therapist.id === profile?.uid);
    return fromList || ((profileDetails as TherapistProfile | null) ?? null);
  }, [therapists, profile?.uid, profileDetails]);

  const schoolProfile = useMemo(
    () => (profileDetails as SchoolProfile | null) ?? null,
    [profileDetails],
  );

  const handleRequestCode = async () => {
    setRequestingCode(true);
    setGeneralError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: authMobile }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to request OTP.");
      }
      setOtpRequested(true);
      setStatusMessage(`Temporary OTP sent. For now, use code ${data.codeHint || "123456"}.`);
    } catch (error: any) {
      setGeneralError(error.message || "Failed to request OTP.");
    } finally {
      setRequestingCode(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setVerifyingCode(true);
    setGeneralError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: authMobile, code: authCode }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to verify OTP.");
      }
      localStorage.setItem(SESSION_TOKEN_KEY, data.token);
      setAuthCode("");
      setStatusMessage("Session verified.");
      await refreshData();
    } catch (error: any) {
      setGeneralError(error.message || "Failed to verify OTP.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setProfile(null);
      setProfileDetails(null);
      setAuthCode("");
      setOtpRequested(false);
      setAllUsers([]);
      setStudents([]);
      setAppointments([]);
      setJournals([]);
      setNotifications([]);
      setSchoolCatalog([]);
      setActiveAppointmentId(null);
      setActiveTab("about");
    }
  };

  const handleOnboardingComplete = async (role: UserRole, details: any) => {
    setGeneralError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ role, details }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save onboarding.");
      }
      await refreshData();
    } catch (error: any) {
      setGeneralError(error.message || "Failed to save onboarding.");
    }
  };

  const handleAddChild = async (childData: any) => {
    const response = await fetch("/api/students", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(childData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to add child.");
    }
    await refreshData();
  };

  const handleAssessExistingChild = async (
    studentId: string,
    scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string },
  ) => {
    const response = await fetch(`/api/students/${studentId}/assessment`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        confidenceLevel: scores.confidence,
        stressLevel: scores.stress,
        focusLevel: scores.focus,
        goals: scores.goals,
        currentChallenges: scores.supportAreas,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update assessment.");
    }
    await refreshData();
  };

  const handleUpdateAssessment = async (
    confidence: number,
    stress: number,
    focus: number,
    goals?: string,
    currentChallenges?: string[],
  ) => {
    if (!studentProfile) return;
    await handleAssessExistingChild(studentProfile.id, {
      confidence,
      stress,
      focus,
      goals: goals || "",
      supportAreas: currentChallenges || [],
    });
  };

  const handleUpdateAvailability = async (details: any) => {
    if (!profile) return;
    const response = await fetch(`/api/therapists/${profile.uid}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(details),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update therapist profile.");
    }
    await refreshData();
  };

  const handleAddSessionNotes = async (appointmentId: string, notes: string) => {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ sessionNotes: notes }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save session notes.");
    }
    await refreshData();
  };

  const handleConfirmBookingRequest = async (appointmentId: string) => {
    const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to confirm booking.");
    }
    await refreshData();
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "cancelled" }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to cancel appointment.");
    }
    await refreshData();
  };

  const handleAddJournal = async (journalData: any) => {
    const response = await fetch("/api/journals", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(journalData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to add journal.");
    }
    await refreshData();
  };

  const handleDeleteJournal = async (journalId: string) => {
    const response = await fetch(`/api/journals/${journalId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete journal.");
    }
    await refreshData();
  };

  const handleAddArticle = async (articleData: any) => {
    const response = await fetch("/api/blogs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(articleData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to publish article.");
    }
    await refreshData();
  };

  const handleApproveTherapist = async (uid: string, isApproved: boolean) => {
    const response = await fetch(`/api/users/${uid}/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ isApproved }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update therapist approval.");
    }
    await refreshData();
  };

  const handleDeleteUser = async (uid: string) => {
    const response = await fetch(`/api/users/${uid}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete user.");
    }
    await refreshData();
  };

  const handleMarkNotificationRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to mark notification as read.");
    }
    await refreshData();
  };

  const handleConfirmBookingInDB = async (bookingDetails: {
    studentName: string;
    studentId?: string;
    date: string;
    timeSlot: string;
    paymentMode: string;
    orderId: string;
    paymentId: string;
    fee: number;
    paymentScreenshot?: string;
  }) => {
    if (!showBookingTherapist) return;
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        therapistId: showBookingTherapist.id,
        studentId: bookingDetails.studentId,
        studentName: bookingDetails.studentName,
        date: bookingDetails.date,
        timeSlot: bookingDetails.timeSlot,
        paymentMode: bookingDetails.paymentMode,
        orderId: bookingDetails.orderId,
        paymentId: bookingDetails.paymentId,
        paymentScreenshot: bookingDetails.paymentScreenshot,
        fee: bookingDetails.fee,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to create appointment.");
    }
    setShowBookingTherapist(null);
    setActiveTab(profile?.role === "parent" ? "appointments" : "dashboard");
    await refreshData();
  };

  const bookingStudents = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "parent") return parentStudents;
    if (profile.role === "student" && studentProfile) return [studentProfile];
    return [];
  }, [profile, parentStudents, studentProfile]);

  const renderDashboard = () => {
    if (!profile) return null;

    if (profile.role === "parent") {
      return (
        <ParentDashboard
          students={parentStudents}
          appointments={appointments}
          schoolCatalog={schoolCatalog}
          onAddChild={handleAddChild}
          onAssessExistingChild={handleAssessExistingChild}
          onNavigateToDiscovery={() => setActiveTab("therapists")}
          onCancelAppointment={handleCancelAppointment}
          activeSubTab={activeTab}
          onOpenChat={(appointmentId) => {
            setActiveAppointmentId(appointmentId);
            setActiveTab("telehealth");
          }}
        />
      );
    }

    if (profile.role === "student") {
      return (
        <StudentDashboard
          studentProfile={studentProfile}
          appointments={appointments.filter((appointment) => appointment.bookerId === profile.uid || appointment.studentId === profile.uid)}
          journals={journals.filter((journal) => journal.studentId === profile.uid)}
          onAddJournal={handleAddJournal}
          onDeleteJournal={handleDeleteJournal}
          onUpdateAssessment={handleUpdateAssessment}
          onOpenChat={(appointmentId) => {
            setActiveAppointmentId(appointmentId);
            setActiveTab("telehealth");
          }}
        />
      );
    }

    if (profile.role === "therapist") {
      return (
        <TherapistDashboard
          therapistProfile={therapistProfile}
          appointments={appointments}
          onUpdateAvailability={handleUpdateAvailability}
          onAddSessionNotes={handleAddSessionNotes}
          onConfirmBookingRequest={handleConfirmBookingRequest}
          onOpenChat={(appointmentId) => {
            setActiveAppointmentId(appointmentId);
            setActiveTab("telehealth");
          }}
        />
      );
    }

    if (profile.role === "school_admin") {
      return <SchoolDashboard schoolProfile={schoolProfile} students={students} />;
    }

    if (profile.role === "admin") {
      return (
        <AdminPanel
          allUsers={allUsers}
          allStudents={students}
          allTherapists={therapists}
          appointments={appointments}
          schoolCatalog={schoolCatalog}
          journals={journals}
          blogs={blogs}
          notifications={notifications}
          onApproveTherapist={handleApproveTherapist}
          onDeleteUser={handleDeleteUser}
          onConfirmBookingRequest={handleConfirmBookingRequest}
          onOpenChat={(appointmentId) => {
            setActiveAppointmentId(appointmentId);
            setActiveTab("telehealth");
          }}
          onNavigateToTab={setActiveTab}
          onRefreshData={refreshData}
        />
      );
    }

    return null;
  };

  const renderContent = () => {
    if (profile && profile.profileCompleted === false) {
      return (
        <Onboarding
          userEmail={profile.email}
          userName={profile.name}
          schoolCatalog={schoolCatalog}
          onSubmit={handleOnboardingComplete}
        />
      );
    }

    if (activeTab === "about") {
      return <AboutPage onNavigate={setActiveTab} isAuthenticated={!!profile} />;
    }
    if (activeTab === "founders") {
      return <FoundersPage />;
    }
    if (activeTab === "contact") {
      return <ContactPage />;
    }
    if (activeTab === "therapists") {
      return (
        <TherapistDiscovery
          therapists={therapists}
          students={bookingStudents}
          onSelectTherapist={setShowBookingTherapist}
          bookingTriggered={!!showBookingTherapist}
        />
      );
    }
    if (activeTab === "blogs") {
      return (
        <BlogSection
          articles={blogs}
          userProfile={profile}
          onAddArticle={handleAddArticle}
        />
      );
    }
    if (activeTab === "telehealth" && profile) {
      return (
        <CommunicationHub
          currentUser={{ uid: profile.uid, email: profile.email }}
          currentProfile={{ name: profile.name, role: profile.role }}
          appointments={appointments}
          therapists={therapists}
          students={students}
          activeAppointmentId={activeAppointmentId}
          onClearActiveAppointmentId={() => setActiveAppointmentId(null)}
        />
      );
    }
    if (["dashboard", "children", "appointments", "admin"].includes(activeTab) && profile) {
      return renderDashboard();
    }

    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-900">Sign in to continue</p>
        <p className="text-xs text-slate-500 mt-2">Use the temporary OTP flow below to access the Postgres-backed local app.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading YovoEdge...</p>
        </div>
      </div>
    );
  }

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpRequested) {
      await handleVerifyCode(event);
      return;
    }
    await handleRequestCode();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        userProfile={profile}
        notifications={notifications as any}
        onMarkNotificationRead={(id) => {
          void handleMarkNotificationRead(id);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        {generalError && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {!profile && activeTab === "login" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-5">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                Temporary OTP Login
              </span>
              <h2 className="text-2xl font-bold tracking-tight">YovoEdge mobile sign in</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your mobile number to request OTP. After verification, existing users go to their dashboard and new users continue into registration.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    {otpRequested ? "Enter OTP" : "Mobile Number"}
                  </label>
                  <div className="relative">
                    {otpRequested ? (
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    )}
                    <input
                      type={otpRequested ? "text" : "tel"}
                      value={otpRequested ? authCode : authMobile}
                      onChange={(event) => {
                        if (otpRequested) {
                          setAuthCode(event.target.value);
                        } else {
                          setAuthMobile(event.target.value);
                        }
                      }}
                      placeholder={otpRequested ? "123456" : "9876543210"}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    otpRequested
                      ? verifyingCode || !authCode
                      : requestingCode || !authMobile
                  }
                  className={`w-full py-3 rounded-2xl text-xs font-bold disabled:opacity-60 ${
                    otpRequested
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  {otpRequested
                    ? (verifyingCode ? "Verifying..." : "Enter Dashboard")
                    : (requestingCode ? "Requesting code..." : "Request OTP")}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-5">
              <h3 className="text-lg font-bold tracking-tight">
                {otpRequested ? "OTP sent" : "How it works"}
              </h3>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-900 mb-1">
                  {otpRequested ? "Current dev OTP" : "Current flow"}
                </p>
                {otpRequested ? (
                  <p>
                    Use OTP <strong>123456</strong> for now. If this mobile number is new, registration continues after verification. If it already exists, the user goes straight to the dashboard.
                  </p>
                ) : (
                  <p>
                    Enter a mobile number and click <strong>Request OTP</strong>. The same field will switch to OTP entry, and the app will decide whether to continue registration or open the existing dashboard.
                  </p>
                )}
              </div>
              {otpRequested && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpRequested(false);
                    setAuthCode("");
                    setStatusMessage("");
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Change mobile number
                </button>
              )}
            </div>
          </div>
        )}

        {!(activeTab === "login" && !profile) && renderContent()}
      </main>

      {showBookingTherapist && (
        <BookingModal
          therapist={showBookingTherapist}
          students={bookingStudents}
          isAuthenticated={!!profile}
          onRedirectToLogin={() => {
            setShowBookingTherapist(null);
            setActiveTab("login");
          }}
          onClose={() => setShowBookingTherapist(null)}
          onConfirmBooking={handleConfirmBookingInDB}
        />
      )}

      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">Copyright 2026 YovoEdge. Local Postgres mode enabled.</p>
        <p className="text-[10px] text-slate-300 mt-1">Temporary OTP flow is active until the real OTP provider is wired in.</p>
      </footer>
    </div>
  );
}
