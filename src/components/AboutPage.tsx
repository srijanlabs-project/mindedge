import React from "react";
import { Brain, Award, Shield, Activity, ChevronRight, Users, CheckCircle, GraduationCap, HeartHandshake } from "lucide-react";

interface AboutPageProps {
  onNavigate: (tab: string) => void;
  isAuthenticated: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-indigo-100/60">
          Sports Psychology & Mental Resilience
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Unlocking the Mental Edge for High-Performance Student Athletes
        </h1>
        <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Mindedge is a specialized clinical digital ecosystem that safely connects competitive youngsters, parent advocates, licensed sports psychotherapists, and academic institutional partners.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("therapists")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            Find Certified Coaches
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

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Anxiety & Resilience Profiling</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unrestricted access to scientifically backed, role-based mental diagnostic questionnaires. Track score timelines to proactively regulate pre-game performance anxiety.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Therapist Collaboration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search, vet, and consult licensed practitioners. Seamless clinical appointment pipelines, integrated local calendar locking, and Razorpay-simulated billing receipts.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs transition-shadow hover:shadow-md space-y-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">GDPR & FERPA Compliance</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your telemetry data is stored safely. Complete visibility and logs for academic partners, sports psychologists, parents, and adolescent student advocates.
          </p>
        </div>
      </div>

      {/* Structured Role Flow Section */}
      <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 flex flex-col lg:flex-row gap-12 items-center">
        <div className="space-y-6 lg:w-1/2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono">Unified Platform Features</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Mindedge Serves Each Pillar of the Sports Ecosystem
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Traditional sports medicine covers physical recovery, but often ignores cognitive loading. Mindedge bridges this critical gap through real-time communication loop channels.
          </p>
          
          <div className="space-y-3.5">
            {[
              { role: "For Young Athletes", desc: "Gain access to coping journals, emotional diagnostic retests, and support tools." },
              { role: "For Parent Advocates", desc: "Securely review booking invoices, assign mental tasks, and discover leading child specialists." },
              { role: "For Licensed Therapists", desc: "Digital consulting workstation, custom appointment logs, and direct client communications." },
              { role: "For Academic Counselors", desc: "Aggregate campus dashboard reports tracking active athletic stress distributions." }
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
            <div className="text-3xl font-black text-indigo-600">88%</div>
            <p className="text-xs font-semibold text-slate-800">Reduction in Pre-Competition Stress</p>
            <p className="text-[10px] text-slate-400">Recorded using our active anxiety profile indices.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200/40 shadow-xs space-y-2">
            <div className="text-3xl font-black text-indigo-600">5/5★</div>
            <p className="text-xs font-semibold text-slate-800">Practitioner Ratings</p>
            <p className="text-[10px] text-slate-400">Clinically vetted sports consults across 24 specialties.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200/40 shadow-xs space-y-2 col-span-2 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Validated Sports Resilience Framework</p>
              <p className="text-[10px] text-slate-400">Co-developed with senior partners at premier Olympic training facilities.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
