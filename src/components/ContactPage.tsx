import React, { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle, Send, ShieldCheck, Clock } from "lucide-react";

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    org: "",
    subject: "Campus Partnership",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      const code = "YOV-" + Math.floor(100000 + Math.random() * 900000);
      setInquiryCode(code);
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-300 font-sans">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-violet-100">
          YovoEdge Support
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Connect YovoEdge With Your Athletes, Parents, or School
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          Reach out for school onboarding, counselor partnerships, parent support, or platform setup. YovoEdge is built to make youth athlete mental performance support easier to access online.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Partnership Desk</h3>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">
                Online-first support for schools, parents, athletes, and licensed counselors.
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 leading-relaxed">
              Sample contact details are marked below until final YovoEdge business information is confirmed.
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">YovoEdge Office Address (Sample)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 lines-clamp-2">
                    Sample address: 78 Sector 12, Tech Boulevard, Gurugram, India - 122001
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Email Contact (Sample)</h4>
                  <p className="text-[11px] text-indigo-600 font-mono mt-1">sample@yovoedge.com</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Hotline Number (Sample)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">+91 98765 40000</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Response Window</h4>
                  <p className="text-[11px] text-slate-400 mt-1">09:00 AM - 06:00 PM IST (Mon-Fri)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex gap-3 text-xs text-emerald-800 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h5 className="font-bold">YovoEdge Response Commitment</h5>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  School partnerships, counselor onboarding requests, and parent support messages are reviewed within 24 working hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Inquiry submitted</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out to YovoEdge. Your message has been logged and will be reviewed by the appropriate team.
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
                    message: "",
                  });
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Send a message</h3>
                <p className="text-[11px] text-slate-400 mt-1">Choose the topic that best matches your YovoEdge requirement.</p>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">School / Academy affiliation</label>
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
                  <option value="Campus Partnership">School or academy partnership</option>
                  <option value="Join as Therapist">Join as counselor</option>
                  <option value="Parent Advocate Help">Parent support</option>
                  <option value="General Support">General platform support</option>
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
                {loading ? "Sending to YovoEdge..." : "Send message"}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
