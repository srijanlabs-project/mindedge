import React from "react";
import { Mail, GraduationCap, Trophy, Globe, Heart, Quote } from "lucide-react";

export const FoundersPage: React.FC = () => {
  const founders = [
    {
      name: "Dr. Evelyn Vance, PhD",
      role: "Chief Sports Psychologist & Co-Founder",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "Dr. Vance is a recognized authority in adolescent peak performance. Over 15 years, she coached over 40+ national sprinters, swimmers, and collegiate athletes, focusing on proactive anxiety control indices.",
      degrees: ["PhD in Clinical Psychology - Stanford University", "MS in Kinesiology - Penn State"],
      milestone: "Former consultant for US Athletics Olympic Advisory Council",
      quote: "Success in high-stakes environments belongs to those who actively train the mind as rigorously as they condition the body."
    },
    {
      name: "Marcus Thornhill, MS, CSCS",
      role: "High-Performance Director & Co-Founder",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "A former division-I collegiate runner, Marcus spent a decade managing elite youth athletic training circles. He co-founded Mindedge to establish standardized mental gymnastics into daily youth training agendas.",
      degrees: ["MS in Sports Sciences - Loughborough University", "Strength & Conditioning Specialist (CSCS)"],
      milestone: "Author of 'The Resilient Teen: Cognitive Drills for High School Sports'",
      quote: "We don't expect athletes to run a mile without guidance, yet we expect them to carry immense psychological pressure without a playbook."
    },
    {
      name: "Siddharth Mehta",
      role: "Sports Tech Director & Co-Founder",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "Siddharth is an enterprise digital system architect. Deeply passionate about accessibility and telemedicine regulations, he programmed the initial Mindedge HIPAA/FERPA audit protocol ledger.",
      degrees: ["BTech in Computer Science - IIT Bombay", "Coaching Certification - National Council on Youth Sports"],
      milestone: "Spearheaded technical development for three mental-health scale-up applications",
      quote: "Security isn't an afterthought in sports medicine. Protecting a child athlete's cognitive profile must rely on a bulletproof framework."
    }
  ];

  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300">
      
      {/* Title intro */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-emerald-100">
          The Leadership Circle
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Meet the Minds Behind Mindedge
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          We are clinic specialists, sports scientists, and technology innovators united by a single vision: to ensure youth athletes are psychologically resilient.
        </p>
      </div>

      {/* Founders List layout */}
      <div className="space-y-12">
        {founders.map((founder, index) => {
          const isEven = index % 2 === 0;
          return (
            <div 
              key={index}
              className={`flex flex-col lg:flex-row items-center gap-8 md:gap-12 p-8 bg-white rounded-3xl border border-slate-200/60 shadow-xs transition-colors hover:border-slate-300 ${
                isEven ? "" : "lg:flex-row-reverse"
              }`}
            >
              {/* Image side */}
              <div className="w-full lg:w-1/3 max-w-xs shrink-0">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-80 object-cover rounded-2xl shadow-sm border border-slate-100"
                  />
                </div>
              </div>

              {/* Bio & Details side */}
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{founder.name}</h3>
                  <p className="text-sm font-semibold text-indigo-600 mt-1">{founder.role}</p>
                </div>

                {founder.quote && (
                  <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 flex gap-3 text-xs italic text-slate-600 leading-relaxed font-sans">
                    <Quote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>"{founder.quote}"</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  {founder.bio}
                </p>

                {/* Grid specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Academic Background</h4>
                    <ul className="space-y-1 text-[11px] text-slate-600 font-sans">
                      {founder.degrees.map((deg, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{deg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Key Career Milestones</h4>
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600 font-sans">
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{founder.milestone}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Advisory Note */}
      <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl max-w-xl mx-auto space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          Our Shared Institutional Motto
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          "Sports medicine doesn't end under the skull guidelines of peak performances. Protecting the adolescent heart and cognitive clarity builds heroes."
        </p>
      </div>

    </div>
  );
};
