import React from "react";
import { Brain, Award, Shield, ChevronRight, Users, CheckCircle } from "lucide-react";

interface AboutPageProps {
  onNavigate: (tab: string) => void;
  isAuthenticated: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-indigo-100/60">
          YovoEdge | Think Sharp, Play Sharper
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          The Missing Layer of Athlete Development, Delivered Online
        </h1>
        <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
          YovoEdge is a digital sports psychology platform for young athletes, parents, schools, and licensed counselors. We make credible mental performance support easier to discover, safer to access, and simpler to manage online.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("therapists")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            Find Licensed Counselors
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => onNavigate("login")}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Access Member Portals
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Mental Performance Screening</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Structured assessments help athletes and families identify confidence gaps, stress triggers, and focus challenges before they become performance blockers.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Counselor Discovery & Booking</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Parents discover vetted specialists by sport and specialization, request sessions online, and manage booking and payments through a professional parent-first workflow.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Secure, Online-First Care</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sessions, chat, and records are designed for secure digital care so counselors can support athletes across cities without operational burnout.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 flex flex-col lg:flex-row gap-12 items-center">
        <div className="space-y-6 lg:w-1/2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono">Unified Platform Features</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How YovoEdge Connects Every Part of the Support System
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Training plans often cover physical skill and competition schedules, but the mental layer is still fragmented. YovoEdge closes that gap with a structured online pathway for assessment, booking, and ongoing support.
          </p>

          <div className="space-y-3.5">
            {[
              { role: "For Young Athletes", desc: "Build awareness around confidence, pressure, and focus with guided journaling and assessments." },
              { role: "For Parents", desc: "Act as the client gate for booking, payments, and secure communication with the counselor." },
              { role: "For Licensed Counselors", desc: "Expand access to families beyond metro hubs without losing autonomy over time and case acceptance." },
              { role: "For Schools & Academies", desc: "Create visibility into wellbeing trends and organize mindset support at scale." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{item.role}</h4>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-1/2 w-full grid grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/40 shadow-xs space-y-2">
            <div className="text-3xl font-black text-indigo-600">100%</div>
            <p className="text-xs font-semibold text-slate-800">Online Delivery</p>
            <p className="text-[10px] text-slate-400">Counselors can support athletes remotely through YovoEdge's digital workflow.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200/40 shadow-xs space-y-2">
            <div className="text-3xl font-black text-indigo-600">0-Risk</div>
            <p className="text-xs font-semibold text-slate-800">On-Demand Booking Flow</p>
            <p className="text-[10px] text-slate-400">Counselors accept requests only when the case and timing fit.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200/40 shadow-xs space-y-2 col-span-2 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Professional, Parent-Led Access Model</p>
              <p className="text-[10px] text-slate-400">Built to avoid retail-style marketplace noise and preserve counselor credibility.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
