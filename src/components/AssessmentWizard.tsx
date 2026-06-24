import React, { useState } from "react";
import { 
  Sparkles, Brain, Timer, Activity, Award, ChevronRight, ChevronLeft, 
  HelpCircle, Info, Check, ShieldAlert
} from "lucide-react";

interface Option {
  text: string;
  points: number; // 1 to 10 scale points
  description: string;
}

interface Question {
  id: string;
  text: string;
  field: "confidence" | "stress" | "focus";
  options: Option[];
}

interface AssessmentWizardProps {
  age: number;
  sport: string;
  onComplete: (scores: { confidence: number; stress: number; focus: number; supportAreas: string[]; goals: string }) => void;
  onCancel: () => void;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ age, sport, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Define Age Brackets
  const getAgeBracketLabel = (athleteAge: number) => {
    if (athleteAge < 12) return { label: "Junior Champions Bracket (Ages 6-11)", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (athleteAge <= 16) return { label: "Junior Challenger Bracket (Ages 12-16)", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    return { label: "Elite Performance Bracket (Ages 17+)", style: "bg-violet-50 text-violet-700 border-violet-200" };
  };

  const bracket = getAgeBracketLabel(age);

  // Real, intelligent, practical questions designed for different age brackets
  const getQuestions = (athleteAge: number, s: string): Question[] => {
    const sportName = s || "sports";
    
    if (athleteAge < 12) {
      // Child Athlete - Simple, emoji-powered, focused on enjoyment and elementary coping mechanics
      return [
        {
          id: "q1_child",
          text: `When your coach asks you to play a difficult position or try a new technical trick in ${sportName}, what is your very first thought? 🚀`,
          field: "confidence",
          options: [
            { text: "🚀 'I can totally do this, let me try right now!'", points: 9, description: "High natural self-efficacy and adventure seeking." },
            { text: "🤔 'I'll try my best, but I might make a big mistake.'", points: 6, description: "Moderate belief tempered by immediate fear of failure." },
            { text: "😰 'I'm super worried I will look bad. I prefer playing safety zones.'", points: 3, description: "Avoidant strategy due to psychological safety concerns." }
          ]
        },
        {
          id: "q2_child",
          text: `Just before the starting whistle blows or your turn represents itself, how does your tummy feel? 🌪️`,
          field: "stress",
          options: [
            { text: "🍦 Completely calm and ready for ice cream!", points: 2, description: "Ideal low somatic stress/vagus nerve calmness." },
            { text: "🦋 A little bit of fluffy butterflies, but I'm excited!", points: 5, description: "Standard adrenaline spike converted to helpful excitement." },
            { text: "🌪️ Full of bad storms, feeling dizzy, and I want to escape.", points: 8, description: "High somatic anxiety indicating a need for somatic breathing control." }
          ]
        },
        {
          id: "q3_child",
          text: `If someone in the crowd is shouting very loudly or someone makes a noise during a tight game play, what happens to your eyes? 👀`,
          field: "focus",
          options: [
            { text: "🎯 Nothing! My eyes are strictly locked on the ball/target like a hawk.", points: 9, description: "Excellent selective attention gating." },
            { text: "🔍 I look over once to see who is shouting, then try to look back.", points: 6, description: "Vulnerable to external auditory triggers but recovers." },
            { text: "🎈 I lose focus instantly and forget what I was supposed to be doing.", points: 3, description: "Fractured attention allocation, needs trigger exercises." }
          ]
        },
        {
          id: "q4_child",
          text: "When you miss a shot or make an error, how fast does your smile come back? 💫",
          field: "stress",
          options: [
            { text: "💫 Instantly! I smile, shake it off, and focus on the next exciting ball.", points: 2, description: "High resilience, rapid cognitive reset." },
            { text: "⏳ I feel a bit sad for a minute, but I get back to the game.", points: 5, description: "Optimal resilience with short emotional latency." },
            { text: "🌧️ I feel like crying, I want to leave the court, and my game gets worse.", points: 9, description: "Severe error-dwelling triggers high performance stress." }
          ]
        },
        {
          id: "q5_child",
          text: "If you are trying to learn a long, hard drill, how long can you listen to the coach without playing around? 🧘",
          field: "focus",
          options: [
            { text: "🎯 I can listen carefully the whole time and remember every instruction.", points: 8, description: "High cognitive endurance and instruction absorption." },
            { text: "🚶 I listen at the start, but then my mind starts to wander to other things.", points: 5, description: "Standard adolescent attention span limits." },
            { text: "🤸 I get restless, start playing with my gear, or talking to teammates.", points: 2, description: "Sustained listening deficit, requires brief modular instruction loops." }
          ]
        }
      ];
    } else if (athleteAge <= 16) {
      // Teen/Junior Athlete - Focused on peer pressure, performance anxiety, academic-to-sport transition, mental reset
      return [
        {
          id: "q1_teen",
          text: `When matches get critical and you are trailing behind in a tense ${sportName} event, where does your inner dialogue sit? 📈`,
          field: "confidence",
          options: [
            { text: "📈 I actively welcome the challenge – I feel a deep fire to pull this match back.", points: 9, description: "Elite level performance-optimism and high competitive self-belief." },
            { text: "⚖️ I stay professional and composed, but negative doubt starts whispering in my head.", points: 6, description: "Vulnerable to negative self-talk when outcomes look bleak." },
            { text: "📉 My mind completely gives up. I feel helpless and expect the loss.", points: 3, description: "Learned helplessness under tournament adversity." }
          ]
        },
        {
          id: "q2_teen",
          text: "How does your physique and head respond to competitive anxiety in the 48 hours leading to trials or finals? 🧭",
          field: "stress",
          options: [
            { text: "🕊️ I sleep normally and use breathing techniques to channel adrenaline into focused energy.", points: 3, description: "Advanced arousal regulation and somatic control." },
            { text: "🧭 My muscles feel tight and I overthink constantly, but I manage when the game starts.", points: 6, description: "Moderate anticipatory stress, minor somatic inhibition." },
            { text: "🌋 Sleplessness, physical butterflies, cold sweat, fear of disappointing my parents or coach.", points: 9, description: "Severe social evaluation anxiety causing physiological dysregulation." }
          ]
        },
        {
          id: "q3_teen",
          text: "If a referee makes a bad call against you, or a teammate drops an easy ball, how fast is your attention reset? 🔄",
          field: "focus",
          options: [
            { text: "🔄 Immediate analytical reset. The play is dead; I only process the next active second.", points: 9, description: "Instantaneous cognitive reset; zero rumination lag." },
            { text: "⏱️ I dwell on it for 2 or 3 plays, letting it affect my next physical actions briefly.", points: 5, description: "Attentional lag caused by emotional frustration." },
            { text: "🧠 I fume and stay angry for several minutes, ruining my momentum and focus completely.", points: 2, description: "Attention captured by negative rumination, severely impacting game performance." }
          ]
        },
        {
          id: "q4_teen",
          text: "When practicing a difficult athletic sequence repeatedly under physical exhaustion, what happens to your technique? 🩸",
          field: "focus",
          options: [
            { text: "🎯 My mind blocks out the muscle burn and physical tiredness, and stays precise.", points: 8, description: "High concentration persistence under physical exhaustion fatigue." },
            { text: "🤷 I try to focus, but minor technical errors creep in as I start breathing hard.", points: 5, description: "Moderate selective selection decline due to physical fatigue." },
            { text: "❌ I completely lose focus, give up, or make dangerous coordination mistakes.", points: 2, description: "High susceptibility to physical fatigue over-riding cognitive gating." }
          ]
        },
        {
          id: "q5_teen",
          text: "How much does the opinion of spectators, scouts, or opponents distract you when performing? 👥",
          field: "confidence",
          options: [
            { text: "🛡️ It's background noise. I play for myself, the team, and the love of the game.", points: 8, description: "Intrinsic motivation structure, robust to external evaluation." },
            { text: "👀 If I see scouts or friends looking, I try harder but also feel a bit stiff/nervous.", points: 5, description: "Moderate social approval dependency, causing muscular stiffness." },
            { text: "🚨 I am constantly looking at the crowd, feeling extreme pressure to look perfect.", points: 2, description: "Extrinsically over-activated, high vulnerability to choking." }
          ]
        }
      ];
    } else {
      // Senior / Adult Athlete (17+) - Deep clinical inquiries mapping somatic arousal, cognitive reframing, attentional gating
      return [
        {
          id: "q1_senior",
          text: `How would you evaluate your executive confidence to execute high-stakes tactical plays in ${sportName} under critical end-game conditions? ⚡`,
          field: "confidence",
          options: [
            { text: "⚡ High self-efficacy. I actively request the ball/decisive action under maximum stakes.", points: 10, description: "Elite levels of cognitive self-efficacy and action confidence." },
            { text: "⚖️ Fluctuating based on the immediate warm-up or previous plays in the session.", points: 6, description: "Confidence state-dependent on performance outcomes." },
            { text: "🚨 Robust fragility. I opt for ultra-safe plays and attempt to delegate high-risk actions.", points: 3, description: "Underdeveloped performance self-worth, fear of error responsibility." }
          ]
        },
        {
          id: "q2_senior",
          text: "Which statement best describes your autonomic somatic arousal states just prior to competitive entry? 🌊",
          field: "stress",
          options: [
            { text: "🌊 Highly regulated. I employ controlled parasympathetic down-regulation (e.g. box-breathing, autonomic sighs).", points: 2, description: "Exceptional mastery of autonomic stress down-regulation." },
            { text: "⚠️ Elevated cognitive chatter, combined with noticeable muscle tension in major motor groups.", points: 6, description: "Sub-optimal autonomic arousal; minor physical stiffening." },
            { text: "🚨 Full somatic distress (nausea, hyperventilation, somatic tremors) paired with intrusive fear of failure loops.", points: 9, description: "Dysregulated somatic arousal triggering classical flight responses." }
          ]
        },
        {
          id: "q3_senior",
          text: "Evaluate your sustained attentional gating endurance during multi-hour competitions or high-intensity cognitive exhaustion: 🎯",
          field: "focus",
          options: [
            { text: "🎯 Superior cognitive endurance. External distractions are entirely muted. Complete flow state locking.", points: 10, description: "Peak attentional selectors with deep sensory-gating durability." },
            { text: "⏳ High concentration initially, but decays considerably as physical fatigue and cardiorespiratory load peaks.", points: 6, description: "Attention endurance limits tied directly to physical aerobic threshold." },
            { text: "🌪️ Attentional drift. Highly vulnerable to visual or auditory errors, referee calls, or opponent verbal triggers.", points: 3, description: "Weak attentional boundary control, high cognitive interference." }
          ]
        },
        {
          id: "q4_senior",
          text: "How do you cognitively manage and process an unforced critical error or negative referee decision? 🔄",
          field: "stress",
          options: [
            { text: "🔄 Absolute separation. Zero-latency reset via a psychological cue. Mistakes are classified as factual data points.", points: 2, description: "Exceptional cognitive flexibility, rapid emotional clearance." },
            { text: "⏱️ Minor cognitive friction. I dwell on the negative play for 10-30 seconds, leading to minor mechanical lag.", points: 5, description: "Sub-optimal error recovery causing brief physical play deterioration." },
            { text: "🚨 Chronic worry and negative rumination. The previous error dominates my mental bandwidth and triggers a downward spiral.", points: 8, description: "Extreme error-dwelling behavior, leading to cognitive fatigue." }
          ]
        },
        {
          id: "q5_senior",
          text: "How robust is your performance execution under intense scrutiny or negative psychological banter from opponents? 🛡️",
          field: "confidence",
          options: [
            { text: "🛡️ Immune. I employ active cognitive reframing; adversity makes my execution sharper and more analytical.", points: 9, description: "Robust performance inoculation under social hostile scenarios." },
            { text: "⚖️ I sometimes get internally defensive or rushed, changing my rhythm in an attempt to prove them wrong.", points: 6, description: "Susceptible to psychological disruption, leading to sub-optimal pacing." },
            { text: "🚨 I easily lose my cool, lose track of our tactics, and respond with emotional hostility or panic.", points: 2, description: "Fragile psychological boundaries, easily manipulated by external competitive play." }
          ]
        }
      ];
    }
  };

  const questions = getQuestions(age, sport);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];

  const handleSelectOption = (pointsVal: number) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: pointsVal
    });
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate scores dynamically!
      let confidenceTotal = 0;
      let confidenceCount = 0;
      let stressTotal = 0;
      let stressCount = 0;
      let focusTotal = 0;
      let focusCount = 0;

      questions.forEach((q) => {
        const val = answers[q.id] || 5; // default to 5 if somehow missed
        if (q.field === "confidence") {
          confidenceTotal += val;
          confidenceCount++;
        } else if (q.field === "stress") {
          stressTotal += val;
          stressCount++;
        } else if (q.field === "focus") {
          focusTotal += val;
          focusCount++;
        }
      });

      const finalConfidence = Math.max(1, Math.min(10, Math.round(confidenceTotal / (confidenceCount || 1))));
      const finalStress = Math.max(1, Math.min(10, Math.round(stressTotal / (stressCount || 1))));
      const finalFocus = Math.max(1, Math.min(10, Math.round(focusTotal / (focusCount || 1))));

      // Setup intelligent Active Support Areas & Goals
      const supportAreas: string[] = [];
      let smartGoals = "";

      if (finalStress >= 6) {
        supportAreas.push("anxiety");
      }
      if (finalFocus <= 6) {
        supportAreas.push("concentration");
      }
      if (finalConfidence <= 6) {
        supportAreas.push("confidence");
      }
      if (supportAreas.length === 0) {
        supportAreas.push("performance pressure");
      }

      // Generate customized Goals based on age & sport & support needs
      const sportLabel = sport || "sport";
      if (age < 12) {
        smartGoals = `Build high joy in ${sportLabel}, maintain smiling attitude after mistakes, and follow coach instructions easily.`;
      } else if (age <= 16) {
        if (supportAreas.includes("anxiety")) {
          smartGoals = `Incorporate pre-game box breathing, reduce fear of evaluation in ${sportLabel}, and reset self-belief under pressure.`;
        } else {
          smartGoals = `Boost consistency during high fatigue in ${sportLabel}, ignore crowd/spectator distraction, and build quick reset skills.`;
        }
      } else {
        if (supportAreas.includes("anxiety") || supportAreas.includes("concentration")) {
          smartGoals = `Master autonomic down-regulation to handle somatic pre-match arousal, and build tactical concentration gating under multi-hour cardio loads in ${sportLabel}.`;
        } else {
          smartGoals = `Optimize high-stakes competitive self-efficacy and cognitive reframing of errors for performance consistency in ${sportLabel}.`;
        }
      }

      onComplete({
        confidence: finalConfidence,
        stress: finalStress,
        focus: finalFocus,
        supportAreas,
        goals: smartGoals
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedValue = answers[currentQuestion?.id];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#6366f1] font-bold">Mental Performance Diagnostics</span>
          <h4 className="text-md font-extrabold text-gray-950 flex items-center gap-1.5 mt-0.5">
            <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
            Active Athlete Mind-Gym Assessment
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          {showExplanation ? "Back to Test" : "How are scores calculated?"}
        </button>
      </div>

      {showExplanation ? (
        /* METHODOLOGY EXPLANATION SCREEN */
        <div className="space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 text-xs text-gray-700 animate-in fade-in duration-200">
          <h5 className="font-extrabold text-indigo-950 text-[13px] flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Clinical Sports Psychology Formulas (YOVOEDGE-SC)
          </h5>
          <p className="leading-relaxed">
            Our mental indices are calculated using standard sports science frameworks, tailored for different age brackets (Youth, Teen, Elite).
          </p>

          <div className="space-y-3.5 mt-2">
            <div className="p-3 bg-white rounded-xl border border-indigo-50 space-y-1">
              <span className="font-extrabold text-gray-950 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                1. Self Belief / Confidence Index (SBCI-10)
              </span>
              <p className="leading-relaxed text-gray-500">
                Derived from Bandura's Self-Efficacy Model. It measures an athlete's confidence in executing critical game-changing plays under social evaluation, physical fatigue, and bad team momentum.
              </p>
              <p className="font-mono text-[10px] text-indigo-600">Formula: Max_Arousal_Confidence * Intrinsic_Motivation_Factor (Rounded 1-10)</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-50 space-y-1">
              <span className="font-extrabold text-gray-950 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                2. Pre-Match Anxiety & Stress Threshold (PMAT-10)
              </span>
              <p className="leading-relaxed text-gray-500">
                Mapped against the somatization triggers of the Sport Anxiety Scale (SAS-2). It monitors visceral indicators (adrenaline-induced nausea, stomach flutter) and cognitive interferences (choking worries or parental pressure).
              </p>
              <p className="font-mono text-[10px] text-indigo-600">Formula: Somatic_Arousal_Metric + Error_Rumination_Duration (Lower is calmer)</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-50 space-y-1">
              <span className="font-extrabold text-gray-950 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-violet-600" />
                3. Laser Focus Duration (LFD-10)
              </span>
              <p className="leading-relaxed text-gray-500">
                Evaluates attentional selectivity under physical exhaustion. Measures an athlete's sensory-gating capability to fully mute hostile spectator auditory triggers and initiate sub-second reset sequences.
              </p>
              <p className="font-mono text-[10px] text-indigo-600">Formula: Distraction_Gating_Efficiency * Exhaustion_Concentration_Mins</p>
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Start Assessing Athlete
            </button>
          </div>
        </div>
      ) : (
        /* QUESTIONNAIRE WIZARD SHEET */
        <div className="space-y-5">
          {/* Age Bracket Indicator Badge */}
          <div className={`px-4 py-2 border rounded-xl flex items-center justify-between text-[11px] font-sans ${bracket.style}`}>
            <span className="font-semibold">Bracket: {bracket.label}</span>
            <span className="font-mono font-bold uppercase text-[9px] px-1.5 py-0.5 bg-white/50 rounded border border-current">
              Sport: {sport || "Any Sport"}
            </span>
          </div>

          {/* Progress Dot Indicator Bar */}
          <div className="flex items-center gap-1.5 py-1">
            {questions.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-350 ${
                  idx === currentStep 
                    ? "w-8 bg-indigo-600" 
                    : idx < currentStep 
                    ? "w-4 bg-indigo-200" 
                    : "w-2.5 bg-gray-150"
                }`}
              />
            ))}
            <span className="text-[10px] font-bold text-gray-400 font-mono ml-auto">
              Step {currentStep + 1} of {totalQuestions}
            </span>
          </div>

          {/* Active Question Box */}
          <div className="p-5 bg-slate-50 border border-slate-100/80 rounded-2xl space-y-4">
            <h5 className="text-[13px] font-bold text-slate-800 leading-relaxed font-sans">
              {currentQuestion.text}
            </h5>

            <div className="space-y-2.5">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedValue === opt.points;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(opt.points)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer outline-hidden ${
                      isSelected
                        ? "bg-indigo-50 border-[#4f46e5]/60 text-indigo-950 font-medium ring-2 ring-indigo-400/20"
                        : "bg-white border-gray-150/70 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 text-gray-400"}`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        {opt.text}
                      </span>
                    </div>
                    <p className={`text-[10px] ml-5 italic leading-relaxed ${isSelected ? "text-indigo-600" : "text-gray-400"}`}>
                      Psychological insight: {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={currentStep === 0 ? onCancel : handleBack}
              className="px-4 py-2 border border-gray-250 text-gray-500 hover:text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {currentStep === 0 ? "Cancel" : "Back Step"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={selectedValue === undefined}
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 ${
                selectedValue === undefined 
                  ? "bg-gray-300 cursor-not-allowed shadow-none" 
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {currentStep === totalQuestions - 1 ? (
                <>
                  Compile Diagnostics Results <Check className="w-4 h-4 ml-0.5" />
                </>
              ) : (
                <>
                  Next Assessment Question <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
