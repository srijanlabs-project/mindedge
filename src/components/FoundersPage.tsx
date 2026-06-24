import React from "react";
import { GraduationCap, Trophy, Heart, Quote, AlertCircle } from "lucide-react";

export const FoundersPage: React.FC = () => {
  const founders = [
    {
      name: "Founder Profile 1",
      role: "Clinical Lead (Sample)",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "Sample founder content. Replace this block with the real YovoEdge clinical leadership profile, including credentials, sports psychology background, and mission.",
      degrees: ["Sample credential 1", "Sample credential 2"],
      milestone: "Sample milestone - replace with real founder achievement",
      quote: "Sample quote - replace with the founder's actual voice.",
    },
    {
      name: "Founder Profile 2",
      role: "Sports Performance Lead (Sample)",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "Sample founder content. This area can describe how YovoEdge connects athlete development, parent involvement, and mental performance support.",
      degrees: ["Sample credential 1", "Sample credential 2"],
      milestone: "Sample milestone - replace with real founder achievement",
      quote: "Sample quote - replace with the founder's actual voice.",
    },
    {
      name: "Founder Profile 3",
      role: "Platform and Operations Lead (Sample)",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
      bio: "Sample founder content. Use this section for the real YovoEdge technology, operations, or platform leadership story.",
      degrees: ["Sample credential 1", "Sample credential 2"],
      milestone: "Sample milestone - replace with real founder achievement",
      quote: "Sample quote - replace with the founder's actual voice.",
    },
  ];

  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-emerald-100">
          YovoEdge Leadership
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Meet the Team Behind YovoEdge
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          YovoEdge is built around the missing layer of athlete development: mental performance support delivered in a trusted, online-first way.
        </p>
      </div>

      <div className="max-w-3xl mx-auto p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          The founder profiles on this page are currently marked as sample content. Replace them with the real YovoEdge founder names, bios, credentials, and quotes when ready.
        </p>
      </div>

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

              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{founder.name}</h3>
                  <p className="text-sm font-semibold text-indigo-600 mt-1">{founder.role}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 flex gap-3 text-xs italic text-slate-600 leading-relaxed font-sans">
                  <Quote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>"{founder.quote}"</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans">{founder.bio}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Credentials</h4>
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
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Milestone</h4>
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

      <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl max-w-xl mx-auto space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          YovoEdge Mission
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          "Think Sharp, Play Sharper."
        </p>
      </div>
    </div>
  );
};
