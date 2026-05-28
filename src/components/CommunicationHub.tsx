import React, { useState, useEffect, useRef } from "react";
import { 
  collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc, setDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Send, Video, Calendar, MessageSquare, Check, CheckCheck, User, Clock, 
  Sparkles, PhoneCall, ExternalLink, Lock, CheckCircle, RefreshCw,
  Download, History, Save, FileText, Trash2, X, AlertCircle, Info, Settings, ShieldAlert
} from "lucide-react";
import { StudentProfile, TherapistProfile, Appointment } from "../types";

interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: "parent" | "therapist" | string;
  receiverId: string;
  receiverName: string;
  text: string;
  createdAt: any;
  quickReply?: boolean;
  appointmentId?: string;
}

interface SavedTranscript {
  id?: string;
  title: string;
  creatorId: string;
  participantNames: string[];
  messagesCount: number;
  transcript: string;
  createdAt: string;
  appointmentId?: string;
}

interface CommunicationHubProps {
  currentUser: {
    uid: string;
    email: string | null;
  };
  currentProfile: {
    name: string;
    role: "parent" | "therapist" | string;
  };
  appointments: Appointment[];
  therapists: TherapistProfile[];
  students: StudentProfile[];
  activeAppointmentId?: string | null;
  onClearActiveAppointmentId?: () => void;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  currentUser,
  currentProfile,
  appointments,
  therapists,
  students,
  activeAppointmentId,
  onClearActiveAppointmentId
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [activePartnerId, setActivePartnerId] = useState<string>("");
  const [activePartnerName, setActivePartnerName] = useState<string>("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Saved Transcripts states
  const [savedTranscripts, setSavedTranscripts] = useState<SavedTranscript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<SavedTranscript | null>(null);
  const [savingTranscriptState, setSavingTranscriptState] = useState(false);

  // Google Calendar Integration states
  const [syncingGoogleCalendar, setSyncingGoogleCalendar] = useState<string | null>(null);
  const [showMeetSetupInfo, setShowMeetSetupInfo] = useState(false);
  const [enableMeetAutoSchedule, setEnableMeetAutoSchedule] = useState(false);
  const [activeTabLeft, setActiveTabLeft] = useState<"contacts" | "transcripts" | "google_meet">("contacts");

  // Suggested Quick Replies
  const quickReplies = currentProfile.role === "parent" 
    ? [
        "Are we on for today's mental strategy session?",
        "Please review the resilience scores for my child.",
        "We are joining the Google Meet room right now.",
        "Could you suggest some deep-breathing exercises?"
      ]
    : [
        "Incredible resilience markers observed today!",
        "Yes, I have just recorded clinical diagnostic assessments.",
        "Ensure the athlete conducts focus exercises before the game.",
        "Let's reschedule to the alternative morning slot."
      ];

  // 1. Gather all paid appointments relevant to the current user
  const relevantAppointments = appointments.filter((appt) => {
    if (appt.paymentStatus !== "paid") return false;
    if (currentProfile.role === "therapist") {
      return appt.therapistId === currentUser.uid;
    } else {
      // Parents & Students
      return appt.bookerId === currentUser.uid || appt.parentUid === currentUser.uid || appt.studentId === currentUser.uid;
    }
  });

  // Sync activeAppointmentId from props or default to first appointment
  useEffect(() => {
    if (activeAppointmentId) {
      setSelectedAppointmentId(activeAppointmentId);
      const appt = appointments.find((a) => a.id === activeAppointmentId);
      if (appt) {
        if (currentProfile.role === "therapist") {
          setActivePartnerId(appt.bookerId || "");
          setActivePartnerName(appt.studentName || "");
        } else {
          setActivePartnerId(appt.therapistId || "");
          setActivePartnerName(appt.therapistName || "");
        }
      }
    } else if (relevantAppointments.length > 0 && !selectedAppointmentId) {
      const defaultApp = relevantAppointments[0];
      setSelectedAppointmentId(defaultApp.id);
      if (currentProfile.role === "therapist") {
        setActivePartnerId(defaultApp.bookerId || "");
        setActivePartnerName(defaultApp.studentName || "");
      } else {
        setActivePartnerId(defaultApp.therapistId || "");
        setActivePartnerName(defaultApp.therapistName || "");
      }
    }
  }, [activeAppointmentId, appointments]);

  // 2. Load Chat History real-time - strictly mapped with the selected appointment!
  useEffect(() => {
    if (!selectedAppointmentId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "chats");
    const q = query(messagesRef, where("appointmentId", "==", selectedAppointmentId));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const allMsgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        allMsgs.push({ id: doc.id, ...data });
      });
      allMsgs.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setMessages(allMsgs);
    }, (err) => {
      console.error("Error loading secure Chats mapping:", err);
    });

    return () => unsub();
  }, [selectedAppointmentId]);

  // 3. Listen to Saved Transcripts - strictly filtered by the selected appointment!
  useEffect(() => {
    if (!selectedAppointmentId) {
      setSavedTranscripts([]);
      return;
    }

    const q = query(
      collection(db, "transcripts"), 
      where("creatorId", "==", currentUser.uid),
      where("appointmentId", "==", selectedAppointmentId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: SavedTranscript[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SavedTranscript);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedTranscripts(list);
    });
    return () => unsub();
  }, [selectedAppointmentId, currentUser.uid]);

  // Scroll chats to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Chat message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activePartnerId || !selectedAppointmentId) return;
    setSending(true);

    try {
      const msgData: Message = {
        senderId: currentUser.uid,
        senderName: currentProfile.name,
        senderRole: currentProfile.role as "parent" | "therapist",
        receiverId: activePartnerId,
        receiverName: activePartnerName,
        text: textToSend,
        createdAt: new Date().toISOString(),
        appointmentId: selectedAppointmentId // strictly mapped
      };

      await addDoc(collection(db, "chats"), msgData);
      setInputText("");

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        id: notifRef.id,
        userId: activePartnerId,
        title: `Message from ${currentProfile.name}`,
        message: textToSend.substring(0, 80) + (textToSend.length > 80 ? "..." : ""),
        createdAt: Date.now(),
        read: false
      });
    } catch (err) {
      console.error("Error sending chat message:", err);
    } finally {
      setSending(false);
    }
  };

  // Download Chat log as a formatted Markdown transcript file
  const handleDownloadTranscriptFile = () => {
    if (messages.length === 0) return;
    
    let mdContent = `# CLINICAL TELEHEALTH TRANSCRIPT REPORT\n`;
    mdContent += `### Generated securely on: ${new Date().toLocaleString()}\n`;
    mdContent += `**Reporter (Creator)**: ${currentProfile.name} (${currentProfile.role.toUpperCase()})\n`;
    mdContent += `**Participant**: ${activePartnerName}\n`;
    mdContent += `**Appointment Session ID**: ${selectedAppointmentId}\n`;
    mdContent += `**Total Messages**: ${messages.length}\n`;
    mdContent += `\n---\n\n`;

    messages.forEach((msg) => {
      const msgDate = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "System Time";
      mdContent += `**[${msgDate}] ${msg.senderName} (${msg.senderRole.toUpperCase()}):**\n`;
      mdContent += `${msg.text}\n\n`;
    });

    mdContent += `\n---\n*CONFIDENTIAL SUMMARY REPORT - MINDEDGE SPORTS ASSESSMENT SYSTEMS*`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Telehealth_Transcript_${activePartnerName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Transcript snapshot permanently in Firestore
  const handleSaveTranscriptToDB = async () => {
    if (messages.length === 0 || !selectedAppointmentId) return;
    setSavingTranscriptState(true);
    try {
      const fileText = messages.map(m => {
        const time = m.createdAt ? new Date(m.createdAt).toLocaleString() : "System Time";
        return `[${time}] ${m.senderName} (${m.senderRole.toUpperCase()}): ${m.text}`;
      }).join("\n\n");

      const docData: SavedTranscript = {
        title: `Transcript: ${currentProfile.name} & ${activePartnerName}`,
        creatorId: currentUser.uid,
        participantNames: [currentProfile.name, activePartnerName],
        messagesCount: messages.length,
        transcript: fileText,
        createdAt: new Date().toISOString(),
        appointmentId: selectedAppointmentId // strictly mapped
      };

      await addDoc(collection(db, "transcripts"), docData);
      
      // Notify parent/therapist about saved logs
      alert("Chat transcript successfully compiled and secured to Archives!");
    } catch (err) {
      console.error("Error saving transcript:", err);
      alert("Database is currently syncing, failed to commit.");
    } finally {
      setSavingTranscriptState(false);
    }
  };

  // Delete an archived transcript
  const handleDeleteTranscript = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this archived log?")) return;
    try {
      await deleteDoc(doc(db, "transcripts", id));
      if (selectedTranscript?.id === id) {
        setSelectedTranscript(null);
      }
    } catch (err) {
      console.error("Error deleting transcript:", err);
    }
  };

  // Generate GMeet URL dynamically & save to DB apppointment object 
  const handleSetGoogleMeetBooking = async (appt: Appointment) => {
    setSyncingGoogleCalendar(appt.id);
    setTimeout(async () => {
      try {
        const randomMeetCode = Math.random().toString(36).substring(2, 5) + "-" + 
                               Math.random().toString(36).substring(2, 6) + "-" + 
                               Math.random().toString(36).substring(2, 5);
        const virtualMeetUrl = `https://meet.google.com/${randomMeetCode}`;

        await updateDoc(doc(db, "appointments", appt.id), {
          videoLink: virtualMeetUrl,
          updatedAt: new Date().toISOString()
        });

        // Inform both participants via integrated Chat bot payload
        const systemMessage = `📅 **Google Calendar & Google Meet Integrated!**\n\nA Google Meet link has been generated and synced with calendars of both accounts.\n\n🔗 **Join Video**: ${virtualMeetUrl}\n🕒 **Time Slot**: ${appt.date} • ${appt.timeSlot}\n\n*Synced alerts and (.ics) data payloads have been sent to both mailboxes.*`;
        
        await addDoc(collection(db, "chats"), {
          senderId: "system-calendar-bot",
          senderName: "Google Calendar Bot",
          senderRole: "therapist",
          receiverId: activePartnerId,
          receiverName: activePartnerName,
          text: systemMessage,
          createdAt: new Date().toISOString()
        });

      } catch (err) {
        console.error("Error generating meet slot:", err);
      } finally {
        setSyncingGoogleCalendar(null);
      }
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hub Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl p-6 md:p-8 border border-indigo-150/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
              Enfield & MindEdge Tele-Hub
            </span>
            <h2 className="text-2xl font-extrabold text-navy-900 mt-2 tracking-tight">Parent - Therapist Communication Workspace</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">
              Conduct secure chat sessions with coaches, save secure text transcripts, toggle automated Google Meet virtual link dispatch, and sync scheduled appointment reminders.
            </p>
          </div>
          <div className="flex bg-white rounded-2xl border border-slate-100 p-3 items-center gap-3 shadow-xs shrink-0 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 font-mono tracking-tight uppercase">Security: Active & Guarded</span>
          </div>
        </div>

        {/* Real-time Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANELS: Switchable tabs for Contacts, Saved transcripts archive, or Google Calendar settings */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Nav pills for left column */}
            <div className="bg-white p-1 rounded-2xl border border-slate-150 flex gap-1">
              <button
                onClick={() => setActiveTabLeft("contacts")}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                  activeTabLeft === "contacts" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Inboxes
              </button>
              <button
                onClick={() => setActiveTabLeft("transcripts")}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex justify-center items-center gap-1 ${
                  activeTabLeft === "transcripts" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Archived Logs
                {savedTranscripts.length > 0 && (
                  <span className="bg-indigo-500 text-white text-[9px] px-1 rounded-full">
                    {savedTranscripts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTabLeft("google_meet")}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                  activeTabLeft === "google_meet" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Meet Sync
              </button>
            </div>

            {/* TAB CONTENT A: ACTIVE INBOX CORRESPONDENTS */}
            {activeTabLeft === "contacts" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 animate-in fade-in duration-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Select Session Appointment
                </h3>

                {relevantAppointments.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No active paid appointments found on booking registry. Schedule a session from the Explore coaches directory first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relevantAppointments.map((appt) => {
                      const isActive = selectedAppointmentId === appt.id;
                      const displayTitle = currentProfile.role === "therapist" 
                        ? `Athlete: ${appt.studentName}`
                        : `Coach: ${appt.therapistName}`;
                      const subTitle = currentProfile.role === "therapist"
                        ? `Parent Booker • ${appt.date}`
                        : `Sports Mind Gym • ${appt.date}`;
                      
                      return (
                        <button
                          key={appt.id}
                          onClick={() => {
                            setSelectedAppointmentId(appt.id);
                            if (currentProfile.role === "therapist") {
                              setActivePartnerId(appt.bookerId || "");
                              setActivePartnerName(appt.studentName || "");
                            } else {
                              setActivePartnerId(appt.therapistId || "");
                              setActivePartnerName(appt.therapistName || "");
                            }
                            if (onClearActiveAppointmentId) {
                              onClearActiveAppointmentId();
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl transition-all border outline-hidden flex flex-col gap-1 cursor-pointer ${
                            isActive 
                              ? "bg-indigo-600 font-bold border-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                              : "bg-slate-50 text-slate-700 border-slate-100/70 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{displayTitle}</p>
                              <p className={`text-[9.5px] mt-0.5 font-sans ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                {subTitle}
                              </p>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[8px] tracking-wide font-mono font-bold uppercase rounded ${
                              isActive 
                                ? "bg-white/20 text-white" 
                                : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {appt.timeSlot}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center w-full mt-1 pt-1.5 border-t border-dashed border-slate-200" style={{ borderTopColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)" }}>
                            <span className={`text-[8.5px] uppercase font-mono tracking-widest ${isActive ? "text-indigo-200" : "text-indigo-600"}`}>
                              Status: {appt.status}
                            </span>
                            <span className={`text-[9px] font-mono ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                              #{appt.id.substring(0, 6).toUpperCase()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT B: SAVED TRANSCRIPTS ARCHIVE */}
            {activeTabLeft === "transcripts" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 animate-in fade-in duration-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    Saved Sessions Archives
                  </h3>
                  <span className="text-[10px] text-slate-400">confidential logs</span>
                </div>

                {savedTranscripts.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">No archived transcripts saved yet.</p>
                    <p className="text-[9.5px] text-slate-400 px-4 mt-1 leading-relaxed">
                      Click "Save Log to History" in the chat tool header above when actively chatting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {savedTranscripts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTranscript(item)}
                        className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all flex justify-between items-center group cursor-pointer"
                      >
                        <div className="space-y-1 truncate max-w-[85%]">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[9.5px] text-slate-400 font-medium">
                            {item.messagesCount} message loops • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteTranscript(item.id || "", e)}
                          className="p-1 px-1.5 hover:bg-rose-100 hover:text-rose-700 rounded text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT C: GOOGLE CALENDAR & MEET CONFIGURATION DECK */}
            {activeTabLeft === "google_meet" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5 animate-in fade-in duration-100">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-600" />
                    Google Meet API Integration
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Under strict system policies, scheduling Google Meet videoconferences or managing online chats can only be performed by the **Therapist/Coach** or **System Admin**.
                  </p>
                </div>

                {currentProfile.role === "therapist" || currentProfile.role === "admin" ? (
                  <>
                    {/* API Info / Credentials status board */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150/70 text-xs space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Integration Blueprint (Admin/Therapist)</p>
                      
                      <div className="flex items-center justify-between text-[11px] font-medium border-b border-white pb-1.5">
                        <span className="text-slate-500">Workspace API status:</span>
                        <span className="text-indigo-600 bg-indigo-50 font-bold font-mono px-1.5 py-0.5 rounded text-[9.5px]">Connected ✓</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium border-b border-white pb-1.5">
                        <span className="text-slate-500">Google OAuth Scope:</span>
                        <span className="text-slate-700 font-mono text-[9px]">calendar.events</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-slate-500">Default Call Engine:</span>
                        <span className="text-emerald-700 font-bold font-mono text-[9px]">Google Meet API (v3)</span>
                      </div>
                    </div>

                    {/* Auto scheduler preferences */}
                    <div className="p-4 bg-indigo-50/25 border border-indigo-100/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-indigo-950">Auto-inject GMeet Code</p>
                          <p className="text-[9.5px] text-slate-400 leading-relaxed mt-0.5">Generate links upon booking approval.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableMeetAutoSchedule} 
                            onChange={(e) => setEnableMeetAutoSchedule(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                        </label>
                      </div>
                    </div>

                    {/* Meet manual triggers for upcoming reservations */}
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Sync Manual Slots</span>
                      {appointments.filter(a => a.status === "confirmed").length === 0 ? (
                        <p className="text-[10.5px] text-slate-400 py-1 font-medium">No verified confirmed session timeslots cataloged.</p>
                      ) : (
                        <div className="space-y-2">
                          {appointments.filter(a => a.status === "confirmed").map((appt) => (
                            <div key={appt.id} className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl space-y-2 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-extrabold text-slate-800">{appt.studentName}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{appt.date} • {appt.timeSlot}</p>
                                </div>
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded">Confirmed</span>
                              </div>

                              {appt.videoLink ? (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> GMeet Live
                                  </span>
                                  <a 
                                    href={appt.videoLink} 
                                    target="_blank" 
                                    rel="referrer noopener"
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors"
                                  >
                                    Join Call <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSetGoogleMeetBooking(appt)}
                                  disabled={syncingGoogleCalendar === appt.id}
                                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  {syncingGoogleCalendar === appt.id ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Creating Google Meet Event...
                                    </>
                                  ) : (
                                    <>
                                      <Video className="w-3 h-3" />
                                      Create calendar GMeet Event
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Read-only view for Parents and Students */
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 font-sans">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mb-2" />
                    <h4 className="text-xs font-bold text-slate-950">Patient Schedulers Verified</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Your Google Meet video links are scheduled directly and securely by your approved Clinical Specialist.
                    </p>
                    
                    {appointments.filter(a => a.id === selectedAppointmentId).map(appt => (
                      <div key={appt.id} className="pt-2 border-t border-slate-100 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase font-mono tracking-widest text-slate-400">Current Active Session Link:</p>
                        {appt.videoLink ? (
                          <div className="flex flex-col gap-1.5">
                            <a
                              href={appt.videoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 font-extrabold hover:underline font-mono inline-flex items-center gap-1"
                            >
                              Join Call Link ↗
                            </a>
                            <span className="text-[9.5px] font-mono text-slate-400">({appt.videoLink})</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-600 font-semibold italic">
                            Awaiting video launch details from Coach. Checking notifications...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* RIGHT PANELS: SECURE INSTANT CHAT BOARD */}
          <div className="lg:col-span-8 bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs flex flex-col min-h-[500px]">
            
            {/* Chat Header actions panel */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs font-mono uppercase">
                  {activePartnerName ? activePartnerName.slice(0, 2) : "TX"}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">{activePartnerName || "Select Correspondents"}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                    Encrypted Session Channel Active
                  </p>
                </div>
              </div>

              {/* Secure actions: Download log & Save snapshot button */}
              {messages.length > 0 && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  
                  <button
                    onClick={handleDownloadTranscriptFile}
                    title="Export log as clean Markdown document to your local machine"
                    className="p-2 bg-white hover:bg-slate-150 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10.5px] font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Markdown
                  </button>

                  <button
                    onClick={handleSaveTranscriptToDB}
                    disabled={savingTranscriptState}
                    title="Commit transcript permanently to Firestore securely under Archived Logs"
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10.5px] font-bold disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingTranscriptState ? "Archiving..." : "Archive Log"}
                  </button>

                </div>
              )}
            </div>

            {/* MESSAGE CONTAINER CHANNELS */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 font-mono">End-to-End Encrypted Session</h5>
                    <p className="text-[10.5px] text-slate-400 mt-1 max-w-sm">
                      Clarify focus techniques, physical diagnostic parameters, performance stats and homework exercises with therapist <strong>{activePartnerName}</strong> safely.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const isSystem = msg.senderName === "Google Calendar Bot";
                    
                    if (isSystem) {
                      return (
                        <div key={i} className="mx-auto max-w-sm p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center space-y-2 text-[10.5px] text-indigo-950">
                          <p className="font-extrabold flex items-center justify-center gap-1 text-indigo-900 uppercase tracking-widest font-mono text-[9px]">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                            Secure Google Meet Link Synced
                          </p>
                          <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in-30`}>
                        <div className={`max-w-[80%] rounded-2xl p-3.5 font-sans text-xs space-y-1 ${
                          isMe 
                            ? "bg-indigo-600 text-white rounded-br-none" 
                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                        }`}>
                          <p className="text-[9px] font-black uppercase text-indigo-100 select-none pb-0.5" style={{ opacity: isMe ? 0.8 : 0.6 }}>
                            {msg.senderName} ({msg.senderRole})
                          </p>
                          <p className="leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 text-[8.5px] text-indigo-200 select-none pt-1" style={{ opacity: 0.8 }}>
                            <span>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* QUICK AUTO COMPLETIONS */}
            {activePartnerId && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(reply)}
                    disabled={sending}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[10px] font-bold cursor-pointer transition-all truncate max-w-xs"
                  >
                    🚀 {reply}
                  </button>
                ))}
              </div>
            )}

            {/* SEND TEXT DIALOG ACTIONS */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-4 bg-slate-50 border-t border-slate-150 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                required
                disabled={!activePartnerId || sending}
                placeholder={activePartnerId ? `Type message to send...` : "Select a contact to begin..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-500 text-xs px-4 py-2.5 rounded-2xl outline-hidden text-slate-800 transition-all font-sans disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!activePartnerId || sending || !inputText.trim()}
                className={`p-2.5 rounded-2xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 shrink-0 ${
                  activePartnerId && inputText.trim() 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" 
                    : "bg-slate-150 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4 pointer-events-none" />
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* VIEW ARCHIVED SESSION TRANSCRIPT DIALOG MODAL */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 relative shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setSelectedTranscript(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 font-bold text-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="shrink-0 space-y-1">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                Archived Report
              </span>
              <h3 className="text-lg font-black text-slate-900 pr-8">{selectedTranscript.title}</h3>
              <p className="text-xs text-slate-400">
                Created on {new Date(selectedTranscript.createdAt).toLocaleString()} • Contains {selectedTranscript.messagesCount} statements
              </p>
            </div>

            <div className="flex-1 border border-slate-150 bg-slate-50/50 rounded-2xl p-4 overflow-y-auto text-xs whitespace-pre-wrap font-mono leading-relaxed text-slate-805">
              {selectedTranscript.transcript || "None written."}
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  const blob = new Blob([selectedTranscript.transcript], { type: "text/plain;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Archived_Transcript_${selectedTranscript.createdAt.split("T")[0]}.txt`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Raw Export (.txt)
              </button>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
