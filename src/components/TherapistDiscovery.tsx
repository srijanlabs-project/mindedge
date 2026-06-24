import React, { useState } from "react";
import { TherapistProfile, StudentProfile } from "../types";
import { 
  Search, Filter, MapPin, Award, BookOpen, Star, DollarSign, 
  Sparkles, Calendar, Languages, ShieldCheck, Mail, ArrowRight, User 
} from "lucide-react";

interface TherapistDiscoveryProps {
  therapists: TherapistProfile[];
  students: StudentProfile[];
  onSelectTherapist: (therapist: TherapistProfile) => void;
  bookingTriggered: boolean;
}

export const TherapistDiscovery: React.FC<TherapistDiscoveryProps> = ({
  therapists,
  students,
  onSelectTherapist,
  bookingTriggered
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [feeRange, setFeeRange] = useState(2500); // Max fee range slider
  const [langFilter, setLangFilter] = useState("");

  // Detailed modal profile view trigger (therapist profile page)
  const [selectedTherapistProfile, setSelectedTherapistProfile] = useState<TherapistProfile | null>(null);

  // Filter listings
  const filteredTherapists = therapists.filter((t) => {
    // Only show approved therapists
    if (!t.isApproved) return false;

    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.specialization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSport = sportFilter === "" || 
                         (t.sportsExpertise || "").toLowerCase().includes(sportFilter.toLowerCase());

    const matchesSpec = specializationFilter === "" || 
                        (t.specialization || "").toLowerCase().includes(specializationFilter.toLowerCase());

    const matchesLang = langFilter === "" || 
                        (t.languages || "").toLowerCase().includes(langFilter.toLowerCase());

    const matchesFee = t.sessionFee <= feeRange;

    return matchesSearch && matchesSport && matchesSpec && matchesLang && matchesFee;
  });

  // Sports list of categories
  const sportsList = ["Football", "Cricket", "Basketball", "Tennis", "Gymnastics", "Athletics", "Swimming"];
  
  // Specializations
  const specList = ["Anxiety", "Concentration", "Injury", "Goal Mapping", "Breathwork"];
  const isSampleTherapist = (therapist: TherapistProfile) => therapist.id.startsWith("seed-");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Search Header visual */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider tracking-tight font-sans border border-indigo-100">
          YovoEdge Counselor Directory
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3 tracking-tight">Find licensed sports counselors</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Discover licensed professionals who support athletes with confidence, focus, pressure management, and recovery. Seeded practitioner profiles are marked as sample.
        </p>

        {/* Search controls inside banner */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-sans">
          <div className="relative md:col-span-2">
            <Search className="absolute top-3 left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search counselor name, qualifications, or specialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-755 hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">-- All Sports Focus --</option>
              {sportsList.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-755 hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">-- All Specializations --</option>
              {specList.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters slider */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600 px-1 font-sans select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-500"><Languages className="w-3.5 h-3.5 text-slate-400" /> Lang:</span>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Hourly Session Fee Max: <strong className="text-slate-800">₹{feeRange}</strong></span>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={feeRange}
              onChange={(e) => setFeeRange(Number(e.target.value))}
              className="accent-indigo-600 h-1"
            />
          </div>
        </div>
      </div>

      {/* DISCOVERY LIST CARDS */}
      {filteredTherapists.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 stroke-1 p-6 font-sans">
          <MapPin className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="text-md font-bold text-gray-900 mt-4">No matching sports counselors found</h3>
          <p className="text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
            Adjust your hourly budget constraints, language preferences, or sport specialties to discover more approved practitioners in the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {filteredTherapists.map((therapist) => (
            <div 
              key={therapist.id} 
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              {/* Profile card top */}
              <div className="p-6 space-y-4">
                
                <div className="flex items-center gap-4">
                  {therapist.photoURL ? (
                    <img 
                      referrerPolicy="no-referrer"
                      src={therapist.photoURL} 
                      alt={therapist.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold font-mono shrink-0">
                      {therapist.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-none">{therapist.name}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="YovoEdge verified" />
                    </div>
                    <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-wider font-mono">{therapist.qualification}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 shrink-0" />
                      <span>{therapist.experience} years practice</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-400">Clinical Focus:</span>
                    <span className="font-semibold text-slate-700 text-right">{therapist.specialization}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-400">Sports Focus:</span>
                    <span className="font-semibold text-slate-700 flex flex-nowrap shrink-0 max-w-40 truncate">🏃 {therapist.sportsExpertise || "All Sports"}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-400">Session Rate:</span>
                    <span className="font-bold text-indigo-600">₹{therapist.sessionFee}/hr</span>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500 line-clamp-3 leading-relaxed border-t border-slate-100 pt-3 italic font-sans pr-1">
                  "{therapist.biography || 'Practitioner specializes in teenage athlete mindset coaching and group psychology sessions.'}"
                </p>

                {isSampleTherapist(therapist) && (
                  <span className="inline-flex px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                    Sample profile
                  </span>
                )}

              </div>

              {/* Booking Actions */}
              <div className="px-6 pb-6 pt-1 select-none">
                <div className="grid grid-cols-2 gap-2 h-9">
                  <button
                    onClick={() => setSelectedTherapistProfile(therapist)}
                    className="w-full text-center border border-slate-200 hover:border-indigo-600 rounded-lg text-[10.5px] font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    View profile
                  </button>
                  <button
                    onClick={() => onSelectTherapist(therapist)}
                    className="w-full text-center bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-[10.5px] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Request session
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* THERAPIST DETAILED PROFILE MODAL PAGE */}
      {selectedTherapistProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150 max-h-160 overflow-y-auto font-sans">
            <button
              onClick={() => setSelectedTherapistProfile(null)}
              className="absolute top-6 right-6 text-2xl text-gray-400 hover:text-gray-850 cursor-pointer"
            >
              &times;
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-50 pb-6 mb-6">
              {selectedTherapistProfile.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={selectedTherapistProfile.photoURL} 
                  alt={selectedTherapistProfile.name} 
                  className="w-24 h-24 rounded-3xl object-cover border border-violet-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-violet-600 text-white flex items-center justify-center text-3xl font-extrabold font-mono">
                  {selectedTherapistProfile.name.charAt(0)}
                </div>
              )}

              <div className="text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{selectedTherapistProfile.name}</h3>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                {isSampleTherapist(selectedTherapistProfile) && (
                  <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                    Sample profile
                  </span>
                )}
                <p className="text-[11px] text-indigo-700 font-extrabold tracking-wider uppercase font-mono">{selectedTherapistProfile.qualification}</p>
                <p className="text-xs font-semibold text-gray-500">Exp: {selectedTherapistProfile.experience} years clinical practice</p>
                <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">
                  Rate rate: ₹{selectedTherapistProfile.sessionFee}/hr session
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Biography</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">{selectedTherapistProfile.biography || "Professional Sports Performance anxiety coach specializing in teenage athletes."}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase font-mono">Therapeutic Specializations</h5>
                  <p className="text-xs font-bold text-gray-800">{selectedTherapistProfile.specialization}</p>
                  <p className="text-[10px] text-gray-500">Includes competition anxiety, focus diagnostics, attention mapping.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase font-mono">Coaching Sports Experience</h5>
                  <p className="text-xs font-bold text-violet-600">🏃 {selectedTherapistProfile.sportsExpertise || "All youth sports"}</p>
                  <p className="text-[10px] text-gray-500">Specialized exercises for youth team dynamics and serve focus actions.</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Available Days & Routine Slots</h4>
                <div className="flex flex-wrap gap-1">
                  {(selectedTherapistProfile.availableDays || ["Mon", "Wed", "Fri"]).map((day) => (
                    <span key={day} className="px-2.5 py-1 bg-violet-50 text-violet-800 text-xs font-bold rounded-lg">
                      {day} slots open
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => setSelectedTherapistProfile(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const t = selectedTherapistProfile;
                    setSelectedTherapistProfile(null);
                    onSelectTherapist(t);
                  }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Request session
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
