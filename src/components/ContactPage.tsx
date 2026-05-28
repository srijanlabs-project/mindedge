import React, { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle, Send, ShieldCheck, Building, Clock } from "lucide-react";

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    org: "",
    subject: "Campus Partnership",
    message: ""
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate real database write or endpoint trigger
    setTimeout(() => {
      const code = "MEQ-" + Math.floor(100000 + Math.random() * 900000);
      setInquiryCode(code);
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-300 font-sans">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-violet-100">
          Inquiry & Support Center
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Can We Help You Build Peak Resilience?
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          Need school partnerships, clinical counselor affiliations, or general account telemetry assistance? Pitch us a message below.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Info panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Institutional Advocacy</h3>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">
                Empowering athletic departments, coaching divisions, and collegiate communities globally.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Mindedge Headquarters</h4>
                  <p className="text-[11px] text-slate-400 mt-1 lines-clamp-2">
                    78 Sector 12, High-Resilience Tech Boulevard, Gurugram, India - 122001
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Email Contact Links</h4>
                  <p className="text-[11px] text-indigo-600 font-mono mt-1">support@mindedgeportal.org</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Professional Hotline Number</h4>
                  <p className="text-[11px] text-slate-400 mt-1">+91 (124) 4902-390</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Consulting Business Timings</h4>
                  <p className="text-[11px] text-slate-400 mt-1">09:00 AM - 06:00 PM IST (Mon-Fri)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex gap-3 text-xs text-emerald-800 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h5 className="font-bold">Guaranteed Response Pipeline</h5>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  All campus board partnerships and general inquiries receive priority specialist triage and responses within 24 working hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          
          {submitted ? (
            <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Inquiry Sheet Submitted!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out to Mindedge. Your query has been logged securely under compliance protocols.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl max-w-xs mx-auto font-mono text-[11px] text-slate-600 flex justify-between select-all cursor-pointer" title="Click to select reference code">
                <span>Inquiry Reference Code:</span>
                <span className="font-bold text-indigo-600">{inquiryCode}</span>
              </div>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    org: "",
                    subject: "Campus Partnership",
                    message: ""
                  });
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Drop us a digital query</h3>
                <p className="text-[11px] text-slate-400 mt-1">Our clinical advocates review incoming reports daily.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone Contact Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">School / Academy affliation</label>
                  <input
                    type="text"
                    placeholder="School Board / Club Name"
                    value={formData.org}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Inquiry Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-700"
                >
                  <option value="Campus Partnership">Campus Partnership Consultation</option>
                  <option value="Join as Therapist">Registered Clinical Affiliation</option>
                  <option value="Parent Advocate Help">Parent Advocate Triage Support</option>
                  <option value="General Support">Technical / Billing discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your requirements here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? "Transmitting to clinical ledger..." : "Broadcast Inquiry Message"}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
