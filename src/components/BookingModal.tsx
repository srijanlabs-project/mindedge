import React, { useState } from "react";
import { TherapistProfile, StudentProfile } from "../types";
import { 
  Calendar, Clock, CreditCard, DollarSign, ArrowRight, ShieldCheck, 
  HelpCircle, CheckCircle, Smartphone, Award, Trash, Play, Upload, PhoneCall, AlertCircle, QrCode, Image 
} from "lucide-react";

interface BookingModalProps {
  therapist: TherapistProfile;
  students: StudentProfile[];
  isAuthenticated?: boolean;
  onRedirectToLogin?: () => void;
  onConfirmBooking: (bookingDetails: {
    studentName: string;
    studentId?: string;
    date: string;
    timeSlot: string;
    paymentMode: string;
    orderId: string;
    paymentId: string;
    fee: number;
    paymentScreenshot?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = window.document.createElement("canvas");
        const MAX_WIDTH = 500;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          resolve(compressedBase64);
        } else {
          resolve(event.target?.result as string);
        }
      };
    };
    reader.onerror = () => resolve("");
  });
};

export const BookingModal: React.FC<BookingModalProps> = ({
  therapist,
  students,
  isAuthenticated = true,
  onRedirectToLogin,
  onConfirmBooking,
  onClose
}) => {
  const [step, setStep] = useState(1); // 1 = Select slot, 2 = GPay confirmation screenshot upload, 3 = Pending verification!
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [customStudentName, setCustomStudentName] = useState(students[0]?.name || "");
  const [selectedDate, setSelectedDate] = useState("2026-06-03"); // Default date inside available window
  const [selectedSlot, setSelectedSlot] = useState(therapist.availableTimeSlots?.[0] || "10:00 AM");
  
  // GPay payment states
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCreateOrder = async () => {
    setProcessingPayment(true);
    try {
      // Call actual backend endpoint /api/payments/create-order!
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: therapist.sessionFee * 100, currency: "INR" })
      });
      const data = await res.json();
      setOrderId(data.order_id || "ORD_" + Math.random().toString(36).substring(2, 9).toUpperCase());
      setStep(2); // Go to payment verification step
    } catch (err) {
      console.error("Error creating order:", err);
      // Fallback order ID
      setOrderId("ORD_" + Math.random().toString(36).substring(2, 9).toUpperCase());
      setStep(2);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleProcessConfirmation = async () => {
    if (!screenshotFile) return;

    setProcessingPayment(true);
    try {
      const mockPayId = "PAY_GPAY_" + Math.random().toString(36).substring(2, 10).toUpperCase();

      // Trigger Webhook POST call as simulated gateway webhook (or verify slot on the server)
      try {
        await fetch("/api/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: mockPayId,
            order_id: orderId,
            status: "verification_pending",
            amount: therapist.sessionFee * 100
          })
        });
      } catch (err) {
        console.warn("Could not post to simulated webhook, continuing locally:", err);
      }

      // Find actual student name
      let finalName = customStudentName;
      if (studentId) {
        finalName = students.find(s => s.id === studentId)?.name || customStudentName;
      }

      // Compress image to a base64 string for persistent Firestore storage
      const compressedBase64 = await compressImage(screenshotFile);

      await onConfirmBooking({
        studentName: finalName,
        studentId: studentId || undefined,
        date: selectedDate,
        timeSlot: selectedSlot,
        paymentMode: "GPay • Verification Pending",
        orderId,
        paymentId: mockPayId,
        fee: therapist.sessionFee,
        paymentScreenshot: compressedBase64 || undefined
      });

      setStep(3); // Go to confirmation page
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150 max-h-[90vh] overflow-y-auto font-sans text-gray-800">
        
        {!isAuthenticated ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Coaching Booking Portal</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
                Schedule a professional sports mental performance assessment with <strong>{therapist.name}</strong>. An active student or parent advocate account is required to lock slots and secure payment ledgers.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={onRedirectToLogin}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Sign In or Register New Account
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          <>
            {step < 3 && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-xl text-gray-400 hover:text-gray-850 cursor-pointer"
              >
                &times;
              </button>
            )}

            {/* STEP 1: SELECT SLOT & ATHLETE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
                    Booking: Step 1 of 2
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">Schedule session with {therapist.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Configure preferred scheduling timings and associate the correct child athlete.</p>
                </div>

                <div className="space-y-4">
                  
                  {/* Target Athlete selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 font-sans">For which student athlete?</label>
                    {students.length > 0 ? (
                      <select
                        value={studentId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentId(val);
                          setCustomStudentName(students.find(s => s.id === val)?.name || "");
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-hidden focus:border-indigo-500 transition-colors"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.sport})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Enter athlete's name"
                        value={customStudentName}
                        onChange={(e) => setCustomStudentName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs outline-hidden focus:border-indigo-500 transition-colors"
                      />
                    )}
                  </div>

                  {/* Date chooser */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Date selection (Practitioner free days: {therapist.availableDays?.join(", ")})</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2.2 border border-gray-200 rounded-xl text-xs font-mono bg-white outline-hidden focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Routine slots chooser */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 font-sans">Time slot options</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(therapist.availableTimeSlots || ["10:00 AM", "02:00 PM"]).map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                              isSelected 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                                : "bg-white text-gray-700 border-gray-150 hover:bg-gray-50"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary item */}
                  <div className="p-4 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-800">Therapist Session Fee</p>
                      <p className="text-[10px] text-gray-500 font-sans">Includes secure video invitation & dashboard mapping metrics</p>
                    </div>
                    <span className="text-sm font-black text-indigo-700">₹{therapist.sessionFee}</span>
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 bg-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={processingPayment}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {processingPayment ? "Preparing workspace..." : "Proceed to Payment Upload"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GPAY SCREENSHOT UPLOAD */}
            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-150 font-sans">
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
                    GPay Payment: Step 2 of 2
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">GPay Transfer Verification</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Scan our official sports clinic QR code or transfer to secure VPA link, then attach the payment screenshot below.</p>
                </div>

                {/* TRANSFER INSTRUCTIONS BOARD WITH QR CODE */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                  
                  {/* Mock high-fidelity vector QR code */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 shrink-0">
                    <div className="w-28 h-28 relative flex items-center justify-center p-1 bg-white">
                      {/* Stylized QR Code SVG */}
                      <svg className="w-full h-full text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10-2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-6-6h2v2h-2v-2zm4-4h2v2h-2V9zm-2 2h2v2h-2v-2zm-2-2h2v2h-2V9zm4 0h2V7h-2v2zm-2-4h2v2h-2V5zm-4 4h2v2H9V9z" />
                      </svg>
                      {/* GPay central dot */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white tracking-tighter">
                          GPW
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-500 font-mono tracking-wider mt-1.5 uppercase">Mindedge Athlete Pay</span>
                  </div>

                  {/* Transfer Details */}
                  <div className="md:col-span-3 space-y-2.5 flex flex-col justify-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Athlete UPI VPA</p>
                      <p className="text-sm font-extrabold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 font-mono px-2 py-1 rounded-lg border border-indigo-100/30 inline-block mt-0.5 select-all cursor-pointer select-none transition-colors" title="Double click to copy">
                        mindedge@axisbank
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Transfer Amount</p>
                      <p className="text-md font-black text-slate-800">
                        ₹{therapist.sessionFee} <span className="text-xs font-medium text-slate-500">for {selectedDate} Slot</span>
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-400">
                      Order reference: <strong className="font-mono text-slate-600">{orderId}</strong>
                    </div>
                  </div>
                </div>

                {/* FILE UPLOAD ZONE supporting drag and drop & click browse */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                    dragActive 
                      ? "border-indigo-600 bg-indigo-50/20" 
                      : screenshotFile 
                      ? "border-emerald-500 bg-emerald-50/5" 
                      : "border-slate-200 hover:border-indigo-400 bg-slate-50/30"
                  }`}
                >
                  <input
                    type="file"
                    id="screenshot-loader"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {screenshotPreview ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto w-24 h-24 rounded-lg overflow-hidden border border-emerald-150 shadow-xs">
                        <img 
                          src={screenshotPreview} 
                          alt="GPay confirmation" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800 truncate max-w-xs mx-auto">
                          {screenshotFile?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(screenshotFile!.size / 1024).toFixed(1)} KB • Payment Screenshot Attached
                        </p>
                      </div>
                      <label
                        htmlFor="screenshot-loader"
                        className="inline-block text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
                      >
                        Choose another screenshot
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="screenshot-loader" className="cursor-pointer flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5 pointer-events-none" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Drag & drop GPay screenshot here</p>
                        <p className="text-[10px] text-slate-400 mt-1">or <span className="text-indigo-600 underline font-semibold">browse files</span> from device</p>
                      </div>
                      <p className="text-[9px] text-slate-400">Supports JPEG, PNG, or WebP confirmation slips</p>
                    </label>
                  )}
                </div>

                {/* EXPLICIT CALLOUT MESSAGE */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/50 rounded-2xl flex items-start space-x-2 text-amber-900 shadow-xs">
                  <PhoneCall className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-[11px] leading-relaxed font-sans font-medium">
                    <strong className="text-amber-800 font-extrabold uppercase tracking-wide block mb-0.5 font-sans">Booking Request Note</strong>
                    We have received your booking request, our team will call you and verify the details before confirming your booking.
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 bg-white">
                  <span className="text-xs text-gray-500">Fee to pay: <strong className="text-slate-900 font-extrabold">₹{therapist.sessionFee}</strong></span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-3.5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessConfirmation}
                      disabled={processingPayment || !screenshotFile}
                      className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                        screenshotFile 
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {processingPayment ? "Submitting..." : "Submit Receipt Slip"}
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: BOOKING REQUEST SUBMITTED (PENDING VERIFICATION STATE) */}
            {step === 3 && (
              <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-150 font-sans">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 p-3 text-amber-600 rounded-full mx-auto flex items-center justify-center animate-bounce">
                  <PhoneCall className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-extrabold bg-amber-50 text-amber-750 px-3 py-1 rounded-full font-mono uppercase tracking-widest border border-amber-200">
                    Request Under Review
                  </span>
                  <h3 className="text-xl font-black mt-3">Booking Request Received!</h3>
                  <p className="text-xs text-slate-650 mt-2.5 leading-relaxed max-w-sm mx-auto font-sans bg-amber-50/30 p-3.5 rounded-2xl border border-amber-100/50">
                    We have received your booking request, our team will call you and verify the details before confirming your booking.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-2.5 font-sans text-slate-700 max-w-xs mx-auto">
                  <p className="flex justify-between border-b border-white pb-1.5"><span>Scheduled Date:</span> <span className="font-bold text-slate-900">{selectedDate}</span></p>
                  <p className="flex justify-between border-b border-white pb-1.5"><span>Time Slot:</span> <span className="font-bold text-slate-900">{selectedSlot}</span></p>
                  <p className="flex justify-between border-b border-white pb-1.5"><span>Practitioner:</span> <span className="font-bold text-slate-900">{therapist.name}</span></p>
                  <p className="flex justify-between border-b border-white pb-1.5"><span>Verification Ref:</span> <span className="font-mono text-xs font-bold text-slate-900">{orderId}</span></p>
                  {screenshotFile && (
                    <p className="flex justify-between items-center">
                      <span>Receipt:</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold font-mono px-2 py-0.5 rounded uppercase">Attached ✓</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
