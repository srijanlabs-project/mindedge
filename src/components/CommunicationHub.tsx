import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Video,
  X,
} from "lucide-react";
import { Appointment, StudentProfile, TherapistProfile } from "../types";

interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId?: string;
  receiverName?: string;
  text: string;
  createdAt: string;
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

const quickRepliesByRole: Record<string, string[]> = {
  parent: [
    "Are we still on for today's session?",
    "Please review the latest assessment scores.",
    "We are joining the Meet room now.",
    "Could you suggest a focus exercise for today?",
  ],
  therapist: [
    "I have updated the session notes.",
    "Please start with the breathing drill before the session.",
    "The Google Meet link is ready.",
    "Let's review the athlete's confidence and stress trends today.",
  ],
};

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  currentUser,
  currentProfile,
  appointments,
  activeAppointmentId,
  onClearActiveAppointmentId,
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedTranscripts, setSavedTranscripts] = useState<SavedTranscript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<SavedTranscript | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTranscripts, setLoadingTranscripts] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = () => {
    const token = localStorage.getItem("yovoedge_session_token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const relevantAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (appointment.paymentStatus !== "paid") return false;
      if (appointment.status === "cancelled") return false;
      if (currentProfile.role === "therapist") {
        return appointment.therapistId === currentUser.uid;
      }
      return (
        appointment.bookerId === currentUser.uid ||
        appointment.parentUid === currentUser.uid ||
        appointment.studentId === currentUser.uid
      );
    });
  }, [appointments, currentProfile.role, currentUser.uid]);

  const selectedAppointment = useMemo(
    () => relevantAppointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [relevantAppointments, selectedAppointmentId],
  );

  const partnerName = selectedAppointment
    ? currentProfile.role === "therapist"
      ? selectedAppointment.studentName
      : selectedAppointment.therapistName
    : "";

  const loadMessages = async (appointmentId: string) => {
    if (!appointmentId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chats?appointmentId=${encodeURIComponent(appointmentId)}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadTranscripts = async (appointmentId: string) => {
    if (!appointmentId) {
      setSavedTranscripts([]);
      return;
    }
    setLoadingTranscripts(true);
    try {
      const response = await fetch(`/api/transcripts?appointmentId=${encodeURIComponent(appointmentId)}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      setSavedTranscripts(data.transcripts || []);
    } catch (error) {
      console.error("Failed to load transcripts:", error);
      setSavedTranscripts([]);
    } finally {
      setLoadingTranscripts(false);
    }
  };

  useEffect(() => {
    if (activeAppointmentId) {
      setSelectedAppointmentId(activeAppointmentId);
      return;
    }
    if (!selectedAppointmentId && relevantAppointments.length > 0) {
      setSelectedAppointmentId(relevantAppointments[0].id);
    }
  }, [activeAppointmentId, relevantAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (!selectedAppointmentId) return;
    void loadMessages(selectedAppointmentId);
    void loadTranscripts(selectedAppointmentId);
  }, [selectedAppointmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string, quickReply = false) => {
    if (!selectedAppointmentId || !text.trim()) return;
    setSubmittingMessage(true);
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          appointmentId: selectedAppointmentId,
          text,
          quickReply,
        }),
      });
      setMessageText("");
      await loadMessages(selectedAppointmentId);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!selectedAppointment || messages.length === 0) return;
    const body = messages
      .map((message) => `[${new Date(message.createdAt).toLocaleString()}] ${message.senderName}: ${message.text}`)
      .join("\n\n");
    const content = `# YovoEdge Session Transcript\n\nAppointment: ${selectedAppointment.id}\nParticipant: ${partnerName}\n\n${body}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yovoedge-transcript-${selectedAppointment.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleArchiveTranscript = async () => {
    if (!selectedAppointment || messages.length === 0) return;
    setSavingTranscript(true);
    try {
      const transcript = messages
        .map((message) => `[${new Date(message.createdAt).toLocaleString()}] ${message.senderName}: ${message.text}`)
        .join("\n\n");

      await fetch("/api/transcripts", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: `Transcript with ${partnerName}`,
          participantNames: [currentProfile.name, partnerName],
          messagesCount: messages.length,
          transcript,
          appointmentId: selectedAppointment.id,
        }),
      });

      await loadTranscripts(selectedAppointment.id);
    } catch (error) {
      console.error("Failed to archive transcript:", error);
    } finally {
      setSavingTranscript(false);
    }
  };

  const handleDeleteTranscript = async (transcriptId: string) => {
    try {
      await fetch(`/api/transcripts/${transcriptId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (selectedTranscript?.id === transcriptId) {
        setSelectedTranscript(null);
      }
      if (selectedAppointmentId) {
        await loadTranscripts(selectedAppointmentId);
      }
    } catch (error) {
      console.error("Failed to delete transcript:", error);
    }
  };

  const handleCreateMeetLink = async () => {
    if (!selectedAppointment) return;
    setCreatingMeet(true);
    try {
      await fetch(`/api/appointments/${selectedAppointment.id}/meet`, {
        method: "POST",
        headers: authHeaders(),
      });
      await loadMessages(selectedAppointment.id);
    } catch (error) {
      console.error("Failed to create Meet link:", error);
    } finally {
      setCreatingMeet(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedAppointment) return;
    setClosingSession(true);
    try {
      await fetch(`/api/appointments/${selectedAppointment.id}/close`, {
        method: "POST",
        headers: authHeaders(),
      });
      setSelectedAppointmentId("");
      setMessages([]);
      if (onClearActiveAppointmentId) {
        onClearActiveAppointmentId();
      }
    } catch (error) {
      console.error("Failed to close session:", error);
    } finally {
      setClosingSession(false);
    }
  };

  const quickReplies = quickRepliesByRole[currentProfile.role] || quickRepliesByRole.parent;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8">
        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
          Secure Telehealth
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">Appointment Chat Workspace</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
          Use Postgres-backed chat, transcript archiving, and temporary Google Meet scheduling while we keep the OTP flow simple for local development.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Active Sessions
              </h3>
              <button
                onClick={() => {
                  if (selectedAppointmentId) {
                    void loadMessages(selectedAppointmentId);
                    void loadTranscripts(selectedAppointmentId);
                  }
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {relevantAppointments.length === 0 ? (
              <p className="text-xs text-slate-400">No paid active appointments are available yet.</p>
            ) : (
              <div className="space-y-3">
                {relevantAppointments.map((appointment) => {
                  const active = appointment.id === selectedAppointmentId;
                  return (
                    <button
                      key={appointment.id}
                      onClick={() => {
                        setSelectedAppointmentId(appointment.id);
                        if (onClearActiveAppointmentId) {
                          onClearActiveAppointmentId();
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                        active
                          ? "border-indigo-300 bg-indigo-50/60"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {currentProfile.role === "therapist" ? appointment.studentName : appointment.therapistName}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {appointment.date} at {appointment.timeSlot}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold uppercase">
                          {appointment.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Archived Transcripts</h3>
              {loadingTranscripts && <span className="text-[10px] text-slate-400">Loading...</span>}
            </div>

            {savedTranscripts.length === 0 ? (
              <p className="text-xs text-slate-400">No archived transcripts for this appointment yet.</p>
            ) : (
              <div className="space-y-3">
                {savedTranscripts.map((transcript) => (
                  <div key={transcript.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                    <button
                      onClick={() => setSelectedTranscript(transcript)}
                      className="w-full text-left"
                    >
                      <p className="text-xs font-bold text-slate-900">{transcript.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {transcript.messagesCount} messages • {new Date(transcript.createdAt).toLocaleString()}
                      </p>
                    </button>
                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={() => void handleDeleteTranscript(transcript.id!)}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{partnerName || "Select an appointment"}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {selectedAppointment ? `${selectedAppointment.date} • ${selectedAppointment.timeSlot}` : "No session selected"}
              </p>
            </div>

            {selectedAppointment && (
              <div className="flex flex-wrap gap-2">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={handleDownloadTranscript}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      onClick={() => void handleArchiveTranscript()}
                      disabled={savingTranscript}
                      className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingTranscript ? "Saving..." : "Archive"}
                    </button>
                  </>
                )}

                {currentProfile.role === "therapist" && !selectedAppointment.videoLink && (
                  <button
                    onClick={() => void handleCreateMeetLink()}
                    disabled={creatingMeet}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {creatingMeet ? "Creating..." : "Create Meet"}
                  </button>
                )}

                {selectedAppointment.videoLink && (
                  <a
                    href={selectedAppointment.videoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Join Meet
                  </a>
                )}

                <button
                  onClick={() => void handleCloseSession()}
                  disabled={closingSession}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" />
                  {closingSession ? "Closing..." : "Close"}
                </button>
              </div>
            )}
          </div>

          <div className="p-5 min-h-[360px] max-h-[520px] overflow-y-auto space-y-4 bg-white">
            {!selectedAppointment ? (
              <div className="h-full flex items-center justify-center text-center text-slate-400">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs">Choose an appointment to open the chat workspace.</p>
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-slate-400">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs">No messages yet. Start the conversation below.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.senderId === currentUser.uid;
                const isSystem = message.senderName === "Google Calendar Bot";

                if (isSystem) {
                  return (
                    <div key={message.id} className="mx-auto max-w-lg rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">System Update</p>
                      <p className="text-xs text-indigo-950 mt-2 whitespace-pre-wrap">{message.text}</p>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isCurrentUser
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-slate-100 text-slate-900 rounded-bl-md"
                      }`}
                    >
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${isCurrentUser ? "text-indigo-100" : "text-slate-500"}`}>
                        {message.senderName}
                      </p>
                      <p className="text-xs mt-2 whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <p className={`text-[9px] mt-2 ${isCurrentUser ? "text-indigo-100" : "text-slate-500"}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedAppointment && (
            <>
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => void handleSendMessage(reply, true)}
                    disabled={submittingMessage}
                    className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:border-slate-300 disabled:opacity-60"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendMessage(messageText);
                }}
                className="p-5 border-t border-slate-200 bg-white flex items-center gap-3"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a secure message..."
                  className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  disabled={submittingMessage || !messageText.trim()}
                  className="px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {selectedTranscript && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">{selectedTranscript.title}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {selectedTranscript.messagesCount} messages • {new Date(selectedTranscript.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto bg-slate-50/60">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-mono">
                {selectedTranscript.transcript}
              </pre>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTranscript(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
