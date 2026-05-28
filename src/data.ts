import { BlogArticle, TherapistProfile } from "./types";

export const INITIAL_BLOG_ARTICLES: Omit<BlogArticle, "id" | "createdAt">[] = [
  {
    title: "Overcoming Pre-Competition Anxiety in Youth Athletes",
    content: "Pre-competition anxiety is one of the most common challenges faced by young sports players. The pressure of performance, fear of failure, and parental expectations can combine to form a high-stress state. To manage this: \n\n1. Enforce a proper pre-game warm-up that focuses on controlled breathing.\n2. Reframe nervous energy as 'excitement' rather than 'fear'.\n3. Set technique-based goals instead of outcome-based goals (e.g., 'keep my shoulders relaxed' instead of 'I must score 3 goals').",
    authorId: "seed-therapist-1",
    authorName: "Dr. Ananya Sharma",
    category: "competition_anxiety",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    featured: true
  },
  {
    title: "Developing Laser-Focus: Training Drills for Football & Basketball Players",
    content: "Concentration is a mental muscle that can be developed just like physical endurance. Young athletes often get distracted by noise, referees, or previous mistakes. Use the 'Reset Trigger' technique:\n\n- Actively touch the ground or wipe your hands on your shirt to symbolize wiping away the mistake.\n- Take a deep belly inhale, holding for 3 seconds.\n- Use a focus keyword like 'Next Play' to physically shift your attention back to the present.",
    authorId: "seed-therapist-2",
    authorName: "Mark Harrison",
    category: "focus_concentration",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
    featured: false
  },
  {
    title: "The Parent's Sideline Guide: Support Without Pressure",
    content: "Parental involvement is double-edged. While support is crucial, sideline shouting—even well-intentioned coaching tips—has been shown to increase stress and reduce athletic enjoyment. The best way to support your child:\n\n- Limit post-game analysis on the car ride home. Let them bring it up.\n- Emphasize character and grit over scores.\n- Remind them that your love and pride are completely independent of their performance.",
    authorId: "seed-therapist-1",
    authorName: "Dr. Ananya Sharma",
    category: "parent_guidance",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80",
    featured: true
  }
];

export const INITIAL_SEED_THERAPISTS: TherapistProfile[] = [
  {
    id: "seed-therapist-1",
    name: "Dr. Ananya Sharma",
    email: "ananya.sharma@mindedge.org",
    mobile: "9876543210",
    qualification: "Ph.D. in Sports Psychology (Loughborough)",
    experience: 12,
    specialization: "Performance Anxiety & Breathwork",
    languages: "English, Hindi",
    sportsExpertise: "Cricket, Athletics, Badminton",
    displayConsent: true,
    serviceAgreement: true,
    dataUsageAgreement: true,
    isApproved: true,
    sessionFee: 1200,
    availableDays: ["Mon", "Tue", "Wed", "Thu"],
    availableTimeSlots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"],
    sessionDuration: 50,
    biography: "Ananya has over a decade of experience advising elite national-level cricket squads and teenage badminton champions. She specializes in cognitive-behavioral techniques paired with bio-feedback loops.",
    photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-therapist-2",
    name: "Mark Harrison",
    email: "mark.harrison@mindedge.org",
    mobile: "9123456789",
    qualification: "M.Sc. in Applied Sports Psychology",
    experience: 8,
    specialization: "Attention Training & Goal Mapping",
    languages: "English, Spanish",
    sportsExpertise: "Football, Basketball, Tennis",
    displayConsent: true,
    serviceAgreement: true,
    dataUsageAgreement: true,
    isApproved: true,
    sessionFee: 1500,
    availableDays: ["Wed", "Thu", "Fri", "Sat"],
    availableTimeSlots: ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM", "04:30 PM"],
    sessionDuration: 60,
    biography: "Mark is a former collegiate football coach certified in mental performance strategy. He works with high-school players to overcome performance blocks and formulate actionable game mental guides.",
    photoURL: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-therapist-3",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@mindedge.org",
    mobile: "9456781230",
    qualification: "Licensed Clinical Counselor, Sports Specialist",
    experience: 15,
    specialization: "Injury Recovery Therapy & Redirection",
    languages: "English",
    sportsExpertise: "Gymnastics, Swimming, Track",
    displayConsent: true,
    serviceAgreement: true,
    dataUsageAgreement: true,
    isApproved: true, // Auto-approved for seed discovery lists
    sessionFee: 1800,
    availableDays: ["Mon", "Web", "Fri"],
    availableTimeSlots: ["11:00 AM", "01:00 PM", "04:00 PM", "06:00 PM"],
    sessionDuration: 60,
    biography: "Sarah specializes in guiding adolescent athletes coping with the acute psychological fallout of severe career-interrupting injuries (ACL tears, concussions). She works closely with therapists and parents to maintain mental connection during isolation.",
    photoURL: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString()
  }
];
