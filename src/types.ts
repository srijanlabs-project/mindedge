export type UserRole = "parent" | "student" | "therapist" | "school_admin" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  relationship?: string; // mother/father/guardian (for parents)
  city?: string;
  photoURL?: string;
  isApproved?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentProfile {
  id: string;
  parentId?: string; // parent's UID if added by parent
  studentId?: string; // direct student user's UID
  name: string;
  age: number;
  gender: string;
  school: string;
  sport: string;
  competitionLevel: string; // school, state, national, elite
  trainingFrequency?: string; // hours/week
  confidenceLevel?: number; // 1-10
  stressLevel?: number; // 1-10
  focusLevel?: number; // 1-10
  goals?: string;
  currentChallenges?: string[]; // anxiety, concentration, etc.
  createdAt: string;
  updatedAt?: string;
}

export interface TherapistProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  photoURL?: string;
  qualification: string;
  experience: number; // years
  specialization: string;
  languages?: string;
  sportsExpertise?: string;
  certificationsUrl?: string;
  degreeDocumentsUrl?: string;
  identityProofUrl?: string;
  displayConsent?: boolean;
  serviceAgreement?: boolean;
  dataUsageAgreement?: boolean;
  isApproved: boolean;
  sessionFee: number;
  availableDays?: string[]; // e.g., ["Mon", "Wed", "Fri"]
  availableTimeSlots?: string[]; // e.g., ["10:00 AM", "02:00 PM"]
  sessionDuration?: number; // minutes
  biography?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolProfile {
  id: string; // admin user's UID
  schoolName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  numberOfStudents?: number;
  sportsPrograms?: string;
  existingCounselorDetails?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  therapistId: string;
  therapistName: string;
  bookerId: string; // standard UID
  bookerType: "parent" | "student";
  studentId?: string; // linked student profile ID
  studentName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM AM/PM
  status: "requested" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  videoLink?: string; // meeting links
  paymentStatus: "pending" | "paid";
  sessionNotes?: string;
  paymentId?: string;
  orderId?: string;
  paymentMode?: string;
  parentUid?: string;
  paymentScreenshot?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string; // unique database ID
  paymentId: string; // Razorpay gateway id
  orderId: string;
  userId: string;
  appointmentId: string;
  amount: number; // in INR
  paymentMode: string; // GPay, UPI, Card, etc.
  status: "success" | "failed";
  transactionTime: string;
  receiptUrl?: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: "competition_anxiety" | "focus_concentration" | "parent_guidance" | "mental_fitness" | "athlete_development";
  image?: string;
  featured?: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}
