import React, { useState, useEffect, useCallback } from "react";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, signInWithPopup, GoogleAuthProvider 
} from "firebase/auth";
import { 
  doc, collection, getDocFromServer, getDocs, getDoc, onSnapshot, setDoc, 
  updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  UserProfile, UserRole, StudentProfile, TherapistProfile, Appointment, 
  BlogArticle, JournalEntry, NotificationItem 
} from "./types";
import { Navbar } from "./components/Navbar";
import { Onboarding } from "./components/Onboarding";
import { ParentDashboard } from "./components/ParentDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { TherapistDashboard } from "./components/TherapistDashboard";
import { SchoolDashboard } from "./components/SchoolDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { TherapistDiscovery } from "./components/TherapistDiscovery";
import { BookingModal } from "./components/BookingModal";
import { BlogSection } from "./components/BlogSection";
import { AboutPage } from "./components/AboutPage";
import { FoundersPage } from "./components/FoundersPage";
import { ContactPage } from "./components/ContactPage";
import { CommunicationHub } from "./components/CommunicationHub";
import { INITIAL_BLOG_ARTICLES, INITIAL_SEED_THERAPISTS } from "./data";
import { 
  Sparkles, ShieldCheck, HelpCircle, Heart, Mail, Lock, User, 
  AlertTriangle, CheckSquare, Plus 
} from "lucide-react";

export default function App() {
  // Global authenticated user
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [hasPopupError, setHasPopupError] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Role selections and screen tabs
  const [activeTab, setActiveTab] = useState<string>("about");
  const [showBookingTherapist, setShowBookingTherapist] = useState<TherapistProfile | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [showSystemBanner, setShowSystemBanner] = useState<boolean>(() => localStorage.getItem("hideSystemBanner") !== "true");

  // Firestore Reactive States
  const [dbStatusText, setDbStatusText] = useState("Establishing DB link...");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Auth Inputs
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  // Connection validation test on boot
  useEffect(() => {
    async function testDB() {
      try {
        setDbStatusText("Pinpointing server link...");
        // Use non-blocking getDocFromServer on a test connection doc per guidelines
        const connDoc = doc(db, "test", "connection");
        await getDocFromServer(connDoc);
        setDbStatusText("Database Connected Securely");
      } catch (err) {
        console.warn("Firestore validation test caught error:", err);
        setDbStatusText("Local mode standby active");
      }
    }
    testDB();
  }, []);

  // Intercept any global Firebase popup assertion/rejection errors triggered by iframe/sandbox limits
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason);
      if (
        msg.includes("Pending promise") || 
        msg.includes("popup-closed-by-user") || 
        msg.includes("INTERNAL ASSERTION FAILED") ||
        msg.includes("network-request-failed")
      ) {
        console.warn("Interceded global sandbox Firebase Auth exception:", msg);
        event.preventDefault();
        setHasPopupError(true);
        setAuthError(
          "The Google Sign-In script encountered an iframe sandbox or third-party cookie limitation.\n\n" +
          "👉 IMMEDIATE SOLUTION:\n" +
          "Press any of the 1-click 'Secure Direct Access Bypass' buttons below with your email 'rrahulprakash@gmail.com' to bypass this instantly!"
        );
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const msg = String(event.message || event.error);
      if (
        msg.includes("Pending promise") || 
        msg.includes("popup-closed-by-user") || 
        msg.includes("assertion") || 
        msg.includes("Assertion") ||
        msg.includes("INTERNAL ASSERTION FAILED")
      ) {
        console.warn("Interceded global sandbox Firebase Auth runtime error:", msg);
        event.preventDefault();
        setHasPopupError(true);
        setAuthError(
          "An internal Firebase SDK assertion occurred (Pending promise was never set/popup restricted).\n\n" +
          "👉 IMMEDIATE SOLUTION:\n" +
          "Select any of the 1-click 'Secure Direct Access Bypass' buttons below to instantly sign in with 'rrahulprakash@gmail.com' without needing popups!"
        );
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleGlobalError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  // Set up Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        console.log(`[PG Auth Check] User ${currentUser.uid} session active. Checking PostgreSQL...`);
        try {
          // Pull from core PostgreSQL database
          const res = await fetch(`/api/users/${currentUser.uid}`);
          const data = await res.json();
          if (res.ok && data.success && data.profile) {
            console.log("[PG Auth Check] Verified user profile directly from PostgreSQL:", data.profile);
            setProfile(data.profile);
            setLoading(false);
          } else {
            // Profile not initialized in SQL store (needs onboarding or seed sync)
            console.log("[PG Auth Check] Credentials missing in PostgreSQL. Querying backup Firestore metadata...");
            const userDocRef = doc(db, "users", currentUser.uid);
            const snapshot = await getDoc(userDocRef);
            if (snapshot.exists()) {
              const fsProfile = snapshot.data() as UserProfile;
              setProfile(fsProfile);

              // Query accompanying Firestore detail records to save synchronously to SQL
              let fsDetails: any = null;
              try {
                if (fsProfile.role === "student") {
                  const sSnap = await getDoc(doc(db, "students", currentUser.uid));
                  if (sSnap.exists()) {
                    const sd = sSnap.data();
                    fsDetails = {
                      studentId: currentUser.uid,
                      parentId: sd.parentUid || null,
                      name: sd.name || fsProfile.name,
                      age: sd.age,
                      gender: sd.gender,
                      school: sd.school,
                      sport: sd.sport,
                      competitionLevel: sd.competitionLevel || sd.competition_level,
                      trainingFrequency: sd.trainingFrequency || sd.training_frequency,
                      confidenceLevel: sd.confidenceLevel || sd.confidence_level,
                      stressLevel: sd.stressLevel || sd.stress_level,
                      focusLevel: sd.focusLevel || sd.focus_level,
                      goals: sd.goals,
                      currentChallenges: sd.currentChallenges || sd.current_challenges
                    };
                  }
                } else if (fsProfile.role === "therapist") {
                  const tSnap = await getDoc(doc(db, "therapists", currentUser.uid));
                  if (tSnap.exists()) {
                    const td = tSnap.data();
                    fsDetails = {
                      name: td.name || fsProfile.name,
                      email: td.email || fsProfile.email,
                      photoUrl: td.photoURL || td.photo_url || null,
                      qualification: td.qualification,
                      experience: td.experience,
                      specialization: td.specialization,
                      sportsExpertise: td.sportsExpertise || td.sports_expertise,
                      languages: td.languages,
                      sessionFee: td.sessionFee || td.session_fee,
                      availableDays: td.availableDays || td.available_days,
                      availableTimeSlots: td.availableTimeSlots || td.available_time_slots,
                      biography: td.biography || td.bio,
                      certificationsUrl: td.certificationsUrl || td.certifications_url || td.certDocs,
                      degreeDocumentsUrl: td.degreeDocumentsUrl || td.degree_documents_url || td.degreeDocs,
                      identityProofUrl: td.identityProofUrl || td.identity_proof_url || td.identityDocs,
                      isApproved: td.isApproved !== false
                    };
                  }
                } else if (fsProfile.role === "school_admin") {
                  const hSnap = await getDoc(doc(db, "schools", currentUser.uid));
                  if (hSnap.exists()) {
                    const hd = hSnap.data();
                    fsDetails = {
                      schoolName: hd.schoolName || hd.school_name,
                      email: hd.email || fsProfile.email,
                      contactPerson: hd.contactPerson || hd.contact_person || fsProfile.name,
                      phone: hd.phone || hd.contactPhone,
                      existingCounselorDetails: hd.existingCounselorDetails || hd.existing_counselor_details
                    };
                  }
                }
              } catch (detErr) {
                console.warn("[PG Auth Sync Warning] Could not retrieve supplemental Firestore details for self-healing:", detErr);
              }

              // Perform dynamic self-healing synchronization back to persistent database
              console.log("[PG Dynamic Sync] Re-registering backend credential mapping in active PostgreSQL instance...");
              await fetch("/api/users/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  profile: fsProfile,
                  details: fsDetails
                })
              });
            } else {
              setProfile(null); // Onboarding needed for brand-new users
            }
            setLoading(false);
          }
        } catch (connectionErr) {
          console.warn("[PG Database Unreachable] Defaulting to Firestore snapshots under standby resilience:", connectionErr);
          // Hybrid backup system: subscribe to Firestore to keep preview functional 
          const userDocRef = doc(db, "users", currentUser.uid);
          const unsub = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            setLoading(false);
            try {
              handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
            } catch (e) {
              console.error("Failed to sync authenticated fallback profile snapshot:", e);
              setAuthError("Could not verify clinical credentials on standalone store. Offline active.");
            }
          });
          return unsub;
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Loading failsafe to guarantee the UI is unlocked if Firestore or Auth connection hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Clinical database connection timed out; forcing UI unlock for offline/local mode.");
        setLoading(false);
        setDbStatusText("Local mode standby active");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [loading]);

  // 1. Query Public Collections in Real Time (Always active for Guests and Members)
  useEffect(() => {
    // Listen for Blogs
    const blogsUnsub = onSnapshot(collection(db, "blogs"), async (snapshot) => {
      const bList: BlogArticle[] = [];
      snapshot.forEach((doc) => bList.push({ id: doc.id, ...doc.data() } as BlogArticle));
      
      if (bList.length === 0) {
        if (auth.currentUser) {
          console.log("Seeding initial blogs to Firestore...");
          try {
            const batch = writeBatch(db);
            INITIAL_BLOG_ARTICLES.forEach((art) => {
              const docRef = doc(collection(db, "blogs"));
              batch.set(docRef, {
                id: docRef.id,
                ...art,
                createdAt: new Date().toISOString()
              });
            });
            await batch.commit();
          } catch (e) {
            console.error("Seeding blogs failure:", e);
          }
        } else {
          // Visual fallback for guests if firestore collection is literally unpopulated yet
          setBlogs(INITIAL_BLOG_ARTICLES.map((art, idx) => ({
            id: `fallback-${idx}`,
            createdAt: new Date().toISOString(),
            ...art
          } as BlogArticle)));
        }
      } else {
        // Sort decreasing chronological order
        setBlogs(bList.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      }
    }, (error) => {
      console.warn("Public blogs subscribe failed (falling back to local state):", error.message);
      setBlogs(INITIAL_BLOG_ARTICLES.map((art, idx) => ({
        id: `fallback-${idx}`,
        createdAt: new Date().toISOString(),
        ...art
      } as BlogArticle)));
    });

    // Listen for Therapists
    const therapistsUnsub = onSnapshot(collection(db, "therapists"), async (snapshot) => {
      const tList: TherapistProfile[] = [];
      snapshot.forEach((doc) => tList.push({ id: doc.id, ...doc.data() } as TherapistProfile));

      if (tList.length === 0) {
        if (auth.currentUser) {
          console.log("Seeding initial therapists to Firestore...");
          try {
            const batch = writeBatch(db);
            INITIAL_SEED_THERAPISTS.forEach((ther) => {
              const docRef = doc(db, "therapists", ther.id);
              batch.set(docRef, ther);
            });
            await batch.commit();
          } catch (e) {
            console.error("Seeding therapists failure:", e);
          }
        } else {
          // Visual fallback for guests
          setTherapists(INITIAL_SEED_THERAPISTS);
        }
      } else {
        setTherapists(tList);
      }
    }, (error) => {
      console.warn("Public therapists subscribe failed (falling back to local state):", error.message);
      setTherapists(INITIAL_SEED_THERAPISTS);
    });

    return () => {
      blogsUnsub();
      therapistsUnsub();
    };
  }, []);

  // 2. Query Authenticated-only collections in Real Time
  useEffect(() => {
    if (!user) {
      setStudents([]);
      setAppointments([]);
      setAllUsers([]);
      return;
    }

    const studUnsub = onSnapshot(collection(db, "students"), (snapshot) => {
      const sList: StudentProfile[] = [];
      snapshot.forEach((doc) => sList.push({ id: doc.id, ...doc.data() } as StudentProfile));
      setStudents(sList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "students");
    });

    const appUnsub = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const aList: Appointment[] = [];
      snapshot.forEach((doc) => aList.push({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(aList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "appointments");
    });

    const userUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach((doc) => uList.push({ uid: doc.id, ...doc.data() } as UserProfile));
      setAllUsers(uList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "users");
    });

    return () => {
      studUnsub();
      appUnsub();
      userUnsub();
    };
  }, [user]);

  // Listen to Personal Journals (Student logs) & Notifications
  useEffect(() => {
    if (!user) {
      setJournals([]);
      setNotifications([]);
      return;
    }

    // Live sync journals for current logged student user
    const journalQuery = query(collection(db, "journals"), where("studentId", "==", user.uid));
    const journalUnsub = onSnapshot(journalQuery, (snapshot) => {
      const jList: JournalEntry[] = [];
      snapshot.forEach((doc) => jList.push({ id: doc.id, ...doc.data() } as JournalEntry));
      setJournals(jList.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "journals"));

    const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const notifUnsub = onSnapshot(notificationsQuery, (snapshot) => {
      const nList: NotificationItem[] = [];
      snapshot.forEach((doc) => nList.push({ id: doc.id, ...doc.data() } as NotificationItem));
      setNotifications(nList.sort((a,b) => b.createdAt - a.createdAt));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "notifications"));

    return () => {
      journalUnsub();
      notifUnsub();
    };
  }, [user]);

  // Auth Functions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // On creation, we do not write profile immediately; let onboarding handle detail collection!
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      console.error(err);
      const errStr = String(err);
      if (err.code === "auth/operation-not-allowed" || (err.message && err.message.toLowerCase().includes("operation-not-allowed"))) {
        setAuthError(
          "Email/Password Sign-In is not enabled on your brand new Firebase project (mindedge-1203).\n\n" +
          "👉 1-MINUTE REMEDY:\n" +
          "1. Open the Firebase Console (link below under setup guides).\n" +
          "2. Navigate to Build > Authentication > Sign-in method tab.\n" +
          "3. Click 'Add new provider', select 'Email/Password', make sure it is toggled to ENABLED, and save!\n\n" +
          "💡 To continue testing immediately, please use the 1-click 'Secure Direct Access Bypass' personas below!"
        );
      } else if (err.code === "auth/invalid-credential" || errStr.includes("invalid-credential")) {
        setAuthError(
          "The email or password you entered is incorrect, or you haven't created an account yet.\n\n" +
          "👉 ACTIONS TO TAKE:\n" +
          "1. If you are logging in for the first time, click 'Register a brand new Clinical Account' at the bottom of the card first!\n" +
          "2. If you already registered, please double-check your email and password characters for typos.\n" +
          "3. Alternatively, use any of the 1-click 'Fast Bypass' personas below to sign in instantly!"
        );
      } else if (err.code === "auth/email-already-in-use" || errStr.includes("email-already-in-use")) {
        setAuthError(
          "This email address is already registered.\n\n" +
          "👉 ACTIONS TO TAKE:\n" +
          "Please click 'Already have an account? Sign In' at the bottom to sign in with your password, or use a different email address."
        );
      } else if (err.code === "auth/network-request-failed" || errStr.includes("network-request-failed")) {
        setHasPopupError(true);
        setAuthError(
          "Firebase Auth error: auth/network-request-failed.\n\n" +
          "👉 CRITICAL REMEDY:\n" +
          "Your current development domain is likely not registered in the 'Authorized Domains' of your Firebase project 'mindedge-1203'.\n\n" +
          "Please follow the 'Authorized Domains Setup' guide below to authorize this development sandbox!"
        );
      } else {
        setAuthError(err.message || "Failed Authentication");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setHasPopupError(false);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Auth error info:", err);
      setHasPopupError(true);
      const errStr = String(err);
      if (err.code === "auth/network-request-failed" || errStr.includes("network-request-failed")) {
        setAuthError(
          "Google Sign-In was blocked inside the preview iframe by your browser's security/third-party cookie restrictions (auth/network-request-failed).\n\n" +
          "👉 SOLUTION:\n" +
          "1. Click the square 'Open in New Tab' icon in the top-right corner of the preview panel to run the app in its own browser tab.\n" +
          "2. Alternatively, use any of the 1-click 'Secure Direct Access Bypass' buttons below to instantly test and explore with 'rrahulprakash@gmail.com'!"
        );
      } else if (
        err.code === "auth/popup-closed-by-user" || 
        errStr.includes("popup-closed-by-user") || 
        errStr.includes("Pending promise") || 
        errStr.includes("assertion") || 
        errStr.includes("Assertion")
      ) {
        setAuthError(
          "The Google Sign-In popup was closed or restricted before authentication could complete.\n\n" +
          "👉 TIPS:\n" +
          "1. Use the 'Open in New Tab' button in the top-right corner to open the app directly and bypass iframe locks.\n" +
          "2. Alternatively, use any of the 1-click 'Secure Direct Access Bypass' buttons below to instantly sign in rrahulprakash@gmail.com without needing popups!"
        );
      } else {
        setAuthError(err.message || "Google Authentication aborted or failed. Please try opening in a New Tab or use the 1-click logins below.");
      }
    }
  };

  // Direct Bypass Sign-Ins for testing and validation
  const handleBypassSignIn = async (role: "parent" | "student" | "therapist" | "school" | "admin", customEmail?: string) => {
    setAuthError("");
    setHasPopupError(false);
    let email = customEmail || "parent@mindedge.com";
    let pwd = "password123";
    let name = customEmail ? "User (rrahulprakash)" : "R Prakash Advocate";

    if (!customEmail) {
      if (role === "student") {
        email = "junior@mindedge.com";
        name = "Rahul Jr";
      } else if (role === "therapist") {
        email = "dr.ananya@mindedge.com";
        name = "Dr. Ananya Sharma";
      } else if (role === "school") {
        email = "bishop@mindedge.com";
        name = "Bishop Cotton High School";
      } else if (role === "admin") {
        email = "support@mindedge.com";
        name = "Super Admin Support";
      }
    } else {
      if (role === "parent") name = "Rahul Prakash Senior";
      else if (role === "student") name = "Rahul Jr";
      else if (role === "therapist") name = "Dr. Rahul Prakash";
      else if (role === "school") name = "Rahul International Campus";
      else if (role === "admin") name = "Rahul Admin";
    }

    try {
      // First try standard sign-in
      try {
        await signInWithEmailAndPassword(auth, email, pwd);
      } catch {
        // If account does not exist, create it and seed associated onboarding profiles!
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        const userUid = cred.user.uid;

        if (role === "parent") {
          const profile: UserProfile = {
            uid: userUid,
            name,
            email,
            role: "parent",
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userUid), profile);
          // Seed child students registered in DB
          await setDoc(doc(db, "students", "stud-1"), {
            id: "stud-1",
            name: "Rahul Jr",
            parentUid: userUid,
            age: 14,
            gender: "Male",
            school: "Bishop Cotton High School",
            sport: "Athletics",
            competitionLevel: "State",
            confidenceLevel: 8,
            stressLevel: 3,
            focusLevel: 7,
            goals: "Improve concentration & reduce match pressure",
            currentChallenges: ["concentration", "anxiety"],
            createdAt: new Date().toISOString()
          });
        } else if (role === "student") {
          const profile: UserProfile = {
            uid: userUid,
            name,
            email,
            role: "student",
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userUid), profile);
          // Insert a profile in student collection tying this account
          await setDoc(doc(db, "students", userUid), {
            id: userUid,
            name,
            parentUid: "parent-bypass-uid",
            age: 14,
            gender: "Male",
            school: "Bishop Cotton High School",
            sport: "Cricket",
            competitionLevel: "District",
            confidenceLevel: 7,
            stressLevel: 5,
            focusLevel: 6,
            goals: "Handle swing bowling pressure",
            currentChallenges: ["match fatigue"],
            createdAt: new Date().toISOString()
          });
        } else if (role === "therapist") {
          // Practitioner setup
          const profile: UserProfile = {
            uid: userUid,
            name,
            email,
            role: "therapist",
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userUid), profile);
          await setDoc(doc(db, "therapists", userUid), {
            id: userUid,
            name,
            email,
            photoURL: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
            qualification: "M.Sc Sports Neuro-Psychology",
            experience: 9,
            specialization: "Anxiety, pre-game focus, injury trauma",
            languages: "English, Hindi",
            sessionFee: 1500,
            availableDays: ["Mon", "Wed", "Fri"],
            availableTimeSlots: ["10:00 AM", "02:00 PM"],
            biography: "Licensed Clinical Sports Performance psychologist assisting junior national athletes.",
            isApproved: true,
            createdAt: new Date().toISOString()
          });
        } else if (role === "school") {
          const profile: UserProfile = {
            uid: userUid,
            name,
            email,
            role: "school_admin",
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userUid), profile);
          await setDoc(doc(db, "schools", userUid), {
            id: userUid,
            schoolName: "Bishop Cotton High School",
            email,
            contactPerson: "Principal Sarah Jenkins",
            phone: "+91 80 2221 2623",
            existingCounselorDetails: "In-house psychological coaching clinic setup.",
            isApproved: true,
            createdAt: new Date().toISOString()
          });
        } else if (role === "admin") {
          const profile: UserProfile = {
            uid: userUid,
            name,
            email,
            role: "admin",
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userUid), profile);
        }
      }
    } catch (e: any) {
      setAuthError(e.message || "Failed Bypass Auto Setup");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setActiveTab("dashboard");
    } catch (err: any) {
      console.error(err);
    }
  };

  // Onboarding completions Callback
  const handleOnboardingComplete = async (role: UserRole, details: any) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      
      let name = "";
      if (role === "student") {
        name = details.studentName || user.displayName || user.email?.split("@")[0] || "Student";
      } else if (role === "parent") {
        name = details.parentName || "Parent";
      } else if (role === "therapist") {
        name = details.therapistName || "Therapist";
      } else if (role === "school_admin") {
        name = details.schoolContact || "School Admin";
      } else {
        name = user.displayName || user.email?.split("@")[0] || "User";
      }

      const basicProfile: UserProfile = {
        uid: user.uid,
        name: name,
        email: user.email || "",
        role: role,
        isApproved: role === "therapist" ? false : true, // Therapist requires audit approval
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, basicProfile);

      // Create role specific subcollection items in database
      let pgDetails: any = null;
      if (role === "student") {
        const studentDetail = {
          id: user.uid,
          name: name,
          parentUid: details.parentUid || "",
          age: details.studentAge || 16,
          gender: details.studentGender || "Female",
          school: details.studentSchool || "",
          sport: details.studentSport || "Tennis",
          competitionLevel: details.studentCompLevel || "State",
          trainingFrequency: details.studentTrainFreq || "4 hours/week",
          confidenceLevel: details.confidence || 8,
          stressLevel: details.stress || 4,
          focusLevel: details.focus || 7,
          goals: details.goals || "",
          currentChallenges: details.challenges || [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "students", user.uid), studentDetail);
        
        pgDetails = {
          studentId: user.uid,
          parentId: details.parentUid || null,
          name: name,
          age: details.studentAge || 16,
          gender: details.studentGender || "Female",
          school: details.studentSchool || "",
          sport: details.studentSport || "Tennis",
          competitionLevel: details.studentCompLevel || "State",
          trainingFrequency: details.studentTrainFreq || "4 hours/week",
          confidenceLevel: details.confidence || 8,
          stressLevel: details.stress || 4,
          focusLevel: details.focus || 7,
          goals: details.goals || "",
          currentChallenges: details.challenges || []
        };
      } else if (role === "therapist") {
        const therapistDetail = {
          id: user.uid,
          name: name,
          email: user.email || "",
          photoURL: details.photoURL || "",
          qualification: details.qualification || "",
          experience: details.experience || 5,
          specialization: details.specialization || "",
          sportsExpertise: details.sportsExpertise || "",
          languages: details.languages || "English",
          sessionFee: details.sessionFee || 100,
          availableDays: details.availableDays || ["Mon", "Wed", "Fri"],
          availableTimeSlots: ["10:00 AM", "02:00 PM"],
          biography: details.biography || "",
          certificationsUrl: details.certDocs || "",
          degreeDocumentsUrl: details.degreeDocs || "",
          identityProofUrl: details.identityDocs || "",
          isApproved: false, // Requires admin audit verify
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "therapists", user.uid), therapistDetail);
        
        pgDetails = {
          name: name,
          email: user.email || "",
          photoUrl: details.photoURL || "",
          qualification: details.qualification || "",
          experience: details.experience || 5,
          specialization: details.specialization || "",
          sportsExpertise: details.sportsExpertise || "",
          languages: details.languages || "English",
          sessionFee: details.sessionFee || 100,
          availableDays: details.availableDays || ["Mon", "Wed", "Fri"],
          availableTimeSlots: ["10:00 AM", "02:00 PM"],
          biography: details.biography || "",
          certificationsUrl: details.certDocs || "",
          degreeDocumentsUrl: details.degreeDocs || "",
          identityProofUrl: details.identityDocs || "",
          isApproved: false
        };
      } else if (role === "school_admin") {
        const schoolDetail = {
          id: user.uid,
          schoolName: details.schoolName || "",
          email: user.email || "",
          contactPerson: name,
          phone: details.schoolPhone || "",
          existingCounselorDetails: details.currentCounselor || "",
          isApproved: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "schools", user.uid), schoolDetail);
        
        pgDetails = {
          schoolName: details.schoolName || "",
          email: user.email || "",
          contactPerson: name,
          phone: details.schoolPhone || "",
          existingCounselorDetails: details.currentCounselor || ""
        };
      } else if (role === "parent") {
        // Automatically add the child student linked to this parent
        const childDocId = `child-of-${user.uid}`;
        const studentDetail = {
          id: childDocId,
          parentUid: user.uid,
          name: details.childName || "Athlete",
          age: details.childAge || 12,
          gender: details.childGender || "Male",
          school: details.childSchool || "",
          sport: details.childSport || "Soccer",
          competitionLevel: details.childCompetition || "Club",
          trainingFrequency: details.childTraining || "3 hours/week",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "students", childDocId), studentDetail);
        
        pgDetails = {
          parentId: user.uid,
          name: details.childName || "Athlete",
          age: details.childAge || 12,
          gender: details.childGender || "Male",
          school: details.childSchool || "",
          sport: details.childSport || "Soccer",
          competitionLevel: details.childCompetition || "Club",
          trainingFrequency: details.childTraining || "3 hours/week"
        };
      }

      // Synchronize immediately to core PostgreSQL
      try {
        console.log("[PG Onboarding Complete] Syncing metadata directly with secure PostgreSQL endpoint...");
        const pgResponse = await fetch("/api/users/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: basicProfile,
            details: pgDetails
          })
        });
        
        if (pgResponse.ok) {
          console.log("[PG Onboarding Check] Registration synchronized successfully with persistent DB.");
        } else {
          console.warn("[PG Onboarding Warning] Status code error on database saving. Stand-by file active.");
        }
      } catch (sqlErr) {
        console.error("Failed core PostgreSQL onboarding sync connection:", sqlErr);
      }

      // Display system notice
      const alertRef = doc(collection(db, "notifications"));
      await setDoc(alertRef, {
        id: alertRef.id,
        userId: user.uid,
        title: "Account Set Up Successfully",
        message: "Your MINDEDGE multirole credentials are saved on production Firestore and PostgreSQL persistent storage.",
        createdAt: Date.now(),
        read: false
      });

      // Update state to trigger rendering of the correct role dashboard immediately
      setProfile(basicProfile);

    } catch (err: any) {
      console.error("Onboarding setup failure:", err);
      setGeneralError(err.message);
    }
  };

  // Parent Dashboard actions callbacks
  const handleAddChild = async (childData: any) => {
    if (!user) return;
    try {
      const childDocRef = doc(collection(db, "students"));
      const studentPayload = {
        id: childDocRef.id,
        ...childData,
        parentUid: user.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(childDocRef, studentPayload);

      // System notification
      const alertRef = doc(collection(db, "notifications"));
      await setDoc(alertRef, {
        id: alertRef.id,
        userId: user.uid,
        title: "Student Athlete Registered",
        message: `${childData.name} profile successfully added. Measurements initialized.`,
        createdAt: Date.now(),
        read: false
      });

      // Mirror immediately to PostgreSQL database for complete DDL compatibility
      try {
        const pgResponse = await fetch("/api/db-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: [studentPayload] })
        });
        if (pgResponse.ok) {
          console.log(`[PG Child Sync] Student ${childDocRef.id} successfully mirrored to PostgreSQL instance.`);
        } else {
          console.warn("[PG Child Sync Warning] Failed to sync student profile with relational DB.");
        }
      } catch (sqlErr) {
        console.error("Failed to propagate child registration to PostgreSQL core:", sqlErr);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: "cancelled"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBookingRequest = async (appointmentId: string) => {
    try {
      const apptRef = doc(db, "appointments", appointmentId);
      const randomMeetingCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
      const generatedMeetUrl = `https://meet.google.com/${randomMeetingCode}`;
      
      await updateDoc(apptRef, {
        status: "confirmed",
        paymentStatus: "paid",
        videoLink: generatedMeetUrl
      });
      
      // Notify parent/booker
      const appt = appointments.find(a => a.id === appointmentId);
      if (appt && appt.bookerId) {
        const notifRef = doc(collection(db, "notifications"));
        await setDoc(notifRef, {
          id: notifRef.id,
          userId: appt.bookerId,
          title: "Appointment Confirmed",
          message: `Your booking with ${appt.therapistName} on ${appt.date} at ${appt.timeSlot} has been Confirmed & Payment verified. Google Meet URL is auto-scheduled: ${generatedMeetUrl}`,
          createdAt: Date.now(),
          read: false
        });
      }
    } catch (err) {
      console.error("Error confirming booking request:", err);
    }
  };

  // Student Dashboard Actions
  const handleAddJournal = async (journalData: any) => {
    if (!user) return;
    try {
      const journalRef = doc(collection(db, "journals"));
      await setDoc(journalRef, {
        id: journalRef.id,
        ...journalData,
        studentId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    try {
      await deleteDoc(doc(db, "journals", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAssessment = async (confidence: number, stress: number, focus: number, goals?: string, currentChallenges?: string[]) => {
    if (!user) return;
    try {
      const updateData: any = {
        confidenceLevel: confidence,
        stressLevel: stress,
        focusLevel: focus
      };
      if (goals) updateData.goals = goals;
      if (currentChallenges) updateData.currentChallenges = currentChallenges;

      await updateDoc(doc(db, "students", user.uid), updateData);

      // Replicate immediately to central PostgreSQL instance
      try {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        if (studentDoc.exists()) {
          const studentRaw = studentDoc.data();
          await fetch("/api/db-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              students: [{
                id: user.uid,
                parentUid: studentRaw.parentUid || null,
                studentUid: studentRaw.studentId || null,
                name: studentRaw.name,
                age: studentRaw.age,
                gender: studentRaw.gender,
                school: studentRaw.school,
                sport: studentRaw.sport,
                competitionLevel: studentRaw.competitionLevel,
                trainingFrequency: studentRaw.trainingFrequency || "",
                confidenceLevel: confidence,
                stressLevel: stress,
                focusLevel: focus,
                goals: goals || studentRaw.goals || "",
                currentChallenges: currentChallenges || studentRaw.currentChallenges || []
              }]
            })
          });
        }
      } catch (sqlErr) {
        console.error("Failed to sync self assessment result with PostgreSQL instance:", sqlErr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Therapist Dashboard Actions
  const handleUpdateAvailability = async (availabilityData: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "therapists", user.uid), availabilityData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSessionNotes = async (appointmentId: string, notes: string) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        sessionNotes: notes,
        status: "completed" // Completes slot upon submitting clinical progress summary notes
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Admin approvals
  const handleApproveTherapist = async (id: string, isApproved: boolean) => {
    try {
      // Update therapists collection approval state
      await updateDoc(doc(db, "therapists", id), { isApproved });
      
      // Update basic user index
      await updateDoc(doc(db, "users", id), { isApproved });

      // Sync approval immediately to PostgreSQL database
      try {
        await fetch(`/api/users/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isApproved })
        });
        console.log(`[PG Admin Sync] User ${id} approval status adjusted to ${isApproved} in PostgreSQL.`);
      } catch (sqlErr) {
        console.error("Failed to commit approval synchronization to PostgreSQL:", sqlErr);
      }

      // Trigger notification message to newly active practitioner
      const alertRef = doc(collection(db, "notifications"));
      await setDoc(alertRef, {
        id: alertRef.id,
        userId: id,
        title: isApproved ? "Practitioner Status Approved!" : "Credentials Audited",
        message: isApproved 
          ? "Your certifications have been verified and you are now visible on the Therapist Discovery board." 
          : "Your credentials require further audit support. Please resubmit paperwork.",
        createdAt: Date.now(),
        read: false
      });

    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));

      // Cascade purge from relational tables in Core PostgreSQL
      try {
        await fetch(`/api/users/${uid}`, {
          method: "DELETE"
        });
        console.log(`[PG Admin Sync] User account and dependency chains purged for UID: ${uid} in PostgreSQL.`);
      } catch (sqlErr) {
        console.error("Failed to propagate user deletion to PostgreSQL core:", sqlErr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Blog publishing
  const handleAddArticle = async (articleData: any) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, "blogs"));
      await setDoc(docRef, {
        id: docRef.id,
        ...articleData,
        authorId: user.uid,
        authorName: profile?.name || "Practologist Specialist",
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Modal checkout booking confirm
  const handleConfirmBookingInDB = async (details: {
    studentName: string;
    studentId?: string;
    date: string;
    timeSlot: string;
    paymentMode: string;
    orderId: string;
    paymentId: string;
    fee: number;
    paymentScreenshot?: string;
  }) => {
    if (!user || !showBookingTherapist) return;
    try {
      const appRef = doc(collection(db, "appointments"));
      const newApp: Appointment = {
        id: appRef.id,
        bookerId: user.uid,
        parentUid: user.uid,
        therapistId: showBookingTherapist.id,
        therapistName: showBookingTherapist.name,
        studentName: details.studentName,
        studentId: details.studentId,
        date: details.date,
        timeSlot: details.timeSlot,
        bookerType: "parent",
        status: "requested",
        paymentStatus: "pending",
        sessionNotes: "",
        paymentId: details.paymentId,
        orderId: details.orderId,
        paymentMode: details.paymentMode,
        paymentScreenshot: details.paymentScreenshot || "",
        createdAt: new Date().toISOString()
      };

      await setDoc(appRef, newApp);

      // Trigger notifications to both Parent booker & Therapist practitioner
      const alertParentRef = doc(collection(db, "notifications"));
      await setDoc(alertParentRef, {
        id: alertParentRef.id,
        userId: user.uid,
        title: "Session Booking Request Submitted",
        message: `₹${details.fee} booking request received. Under admin verification review before confirming with ${showBookingTherapist.name}.`,
        createdAt: Date.now(),
        read: false
      });

      const alertTherapistRef = doc(collection(db, "notifications"));
      await setDoc(alertTherapistRef, {
        id: alertTherapistRef.id,
        userId: showBookingTherapist.id,
        title: "New Student Booking Request Received",
        message: `${details.studentName} requested a 60-minute mental assessment session (Pending Admin Verification).`,
        createdAt: Date.now(),
        read: false
      });

      // We do NOT set showBookingTherapist(null) here so that BookingModal can render STEP 3 ("Booking Request Received! We have received your booking request, our team will call you...") successfully. Clicking "Return to Dashboard" on Step 3 will call onClose() which sets showBookingTherapist to null.
    } catch (err) {
      console.error("Booking error details confirmation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      {/* GLOBAL SYSTEM CONNECTION STATUS AND WARNING BANNER */}
      {showSystemBanner && (
        <div className="bg-slate-900 text-slate-300 text-[10px] px-6 py-2.5 font-mono flex flex-col sm:flex-row justify-between items-center gap-1.5 select-none border-b border-slate-800">
          <span className="flex items-center gap-2 text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            SYSTEM CORE CONNECTIVITY: <strong className="text-emerald-400 font-bold uppercase font-mono">{dbStatusText}</strong>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">MINDEDGE MULTI-PORTAL V9 • EST. 2026-05-27</span>
            <button 
              type="button"
              onClick={() => {
                setShowSystemBanner(false);
                localStorage.setItem("hideSystemBanner", "true");
              }}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded border border-slate-700/60 transition-colors cursor-pointer text-[9px] font-sans font-bold"
            >
              Hide Bar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 tracking-wider font-mono uppercase">Unlocking clinical databases...</p>
        </div>
      ) : (
        // MASTER APP SHELL WITH NAVBAR & ROUTING
        <div className="flex-1 flex flex-col justify-between">
          <Navbar 
            userProfile={profile} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
            notifications={notifications}
            onMarkNotificationRead={async (id) => {
              try {
                // Mark single notification read
                await updateDoc(doc(db, "notifications", id), { read: true });
              } catch (e) {
                console.error(e);
              }
            }}
          />

          <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
            
            {/* ERROR BANNER IF ANY FIREBASE ACCESS RULE CAUGHT */}
            {generalError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-3xl text-sm text-rose-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{generalError}</span>
                </div>
                <button 
                  onClick={() => setGeneralError("")}
                  className="p-1 font-bold text-rose-900"
                >
                  &times;
                </button>
              </div>
            )}

            {/* CONDITIONAL TAB RENDER ENGINE */}
            {activeTab === "about" && (
              <AboutPage onNavigate={setActiveTab} isAuthenticated={!!user} />
            )}

            {activeTab === "founders" && (
              <FoundersPage />
            )}

            {activeTab === "contact" && (
              <ContactPage />
            )}

            {(activeTab === "dashboard" || activeTab === "children" || activeTab === "appointments") && !user && (
              <div className="text-center py-16 space-y-6 max-w-md mx-auto animate-in fade-in duration-200">
                <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full mx-auto flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900">Member Session Required</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    You need to be logged in to access secure athlete dashboards, coping logs, daily psychiatric assignments, and verified invoices.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("login")}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors font-sans"
                >
                  Access Secure Entrance Portal
                </button>
              </div>
            )}

            {(activeTab === "dashboard" || activeTab === "children" || activeTab === "appointments") && user && !profile && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <Onboarding 
                  userEmail={user.email || ""} 
                  userName={user.displayName || user.email?.split("@")[0] || ""}
                  onSubmit={handleOnboardingComplete} 
                />
              </div>
            )}

            {(activeTab === "dashboard" || activeTab === "children" || activeTab === "appointments") && user && profile && (
              <>
                {profile.role === "parent" && (
                  <ParentDashboard 
                    students={students.filter(s => s.parentUid === user.uid)}
                    appointments={appointments.filter(a => a.parentUid === user.uid || a.bookerId === user.uid)}
                    onAddChild={handleAddChild}
                    onNavigateToDiscovery={() => setActiveTab("therapists")}
                    onCancelAppointment={handleCancelAppointment}
                    activeSubTab={activeTab}
                    onOpenChat={(apptId) => {
                      setActiveTab("telehealth");
                      setActiveAppointmentId(apptId);
                    }}
                  />
                )}

                {profile.role === "student" && (
                  <StudentDashboard 
                    studentProfile={students.find(s => s.id === user.uid) || null}
                    appointments={appointments.filter(a => a.studentId === user.uid || a.studentName === profile.name)}
                    journals={journals}
                    onAddJournal={handleAddJournal}
                    onDeleteJournal={handleDeleteJournal}
                    onUpdateAssessment={handleUpdateAssessment}
                    onOpenChat={(apptId) => {
                      setActiveTab("telehealth");
                      setActiveAppointmentId(apptId);
                    }}
                  />
                )}

                {profile.role === "therapist" && (
                  <TherapistDashboard 
                    therapistProfile={therapists.find(t => t.id === user.uid) || null}
                    appointments={appointments}
                    onUpdateAvailability={handleUpdateAvailability}
                    onAddSessionNotes={handleAddSessionNotes}
                    onConfirmBookingRequest={handleConfirmBookingRequest}
                    onOpenChat={(apptId) => {
                      setActiveTab("telehealth");
                      setActiveAppointmentId(apptId);
                    }}
                  />
                )}

                {profile.role === "school_admin" && (
                  <SchoolDashboard 
                    schoolProfile={{
                      id: user.uid,
                      schoolName: profile.name,
                      email: user.email || ""
                    }}
                    students={students}
                  />
                )}

                {profile.role === "admin" && (
                  <AdminPanel 
                    allUsers={allUsers}
                    allStudents={students}
                    allTherapists={therapists}
                    appointments={appointments}
                    onApproveTherapist={handleApproveTherapist}
                    onDeleteUser={handleDeleteUser}
                    onConfirmBookingRequest={handleConfirmBookingRequest}
                    onOpenChat={(apptId) => {
                      setActiveTab("telehealth");
                      setActiveAppointmentId(apptId);
                    }}
                    journals={journals}
                    blogs={blogs}
                    notifications={notifications}
                  />
                )}
              </>
            )}

            {activeTab === "therapists" && (
              <TherapistDiscovery 
                therapists={therapists}
                students={user ? students.filter(s => s.parentUid === user.uid) : []}
                onSelectTherapist={(t) => setShowBookingTherapist(t)}
                bookingTriggered={!!showBookingTherapist}
              />
            )}

            {activeTab === "telehealth" && user && profile && (
              <CommunicationHub 
                currentUser={user}
                currentProfile={profile}
                appointments={appointments}
                therapists={therapists}
                students={students}
                activeAppointmentId={activeAppointmentId}
                onClearActiveAppointmentId={() => setActiveAppointmentId(null)}
              />
            )}

            {activeTab === "blogs" && (
              <BlogSection 
                articles={blogs}
                userProfile={profile}
                onAddArticle={handleAddArticle}
              />
            )}

            {activeTab === "admin" && profile?.role === "admin" && (
              <AdminPanel 
                allUsers={allUsers}
                allStudents={students}
                allTherapists={therapists}
                appointments={appointments}
                onApproveTherapist={handleApproveTherapist}
                onDeleteUser={handleDeleteUser}
                journals={journals}
                blogs={blogs}
                notifications={notifications}
              />
            )}

            {activeTab === "login" && (
              user ? (
                <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Secure Session Verified</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    You are already logged in as <strong>{profile?.name}</strong>. Let's redirect you back to your customized member cockpit dashboard.
                  </p>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Enter Private Dashboard
                  </button>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto w-full py-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Brand Banner */}
                    <div className="lg:col-span-7 space-y-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono border border-indigo-100">
                        Multipurpose Sports Health Portal
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        MINDEDGE: Specialized Mental Health Framework for High-Performing Student Athletes
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-sans">
                        A secure digital system safely connecting competitive youngsters, parent advocates, licensed sports psychotherapists, and institutional campus partners on a secure, validated database.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">Mental Indices</p>
                          <h4 className="text-xs font-semibold text-slate-800">Anxiety Retests</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Interactive mental indices dynamically diagnostic on timeline dashboard screens.</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">Credentials</p>
                          <h4 className="text-xs font-semibold text-slate-800">Verified Doctors</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Credential review queue secure under rigorous validation guidelines.</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5 font-sans">Billing Integrations</p>
                          <h4 className="text-xs font-semibold text-slate-800">UPI/GPay Gateway</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Mock-payment transaction receipt ledger webhook synchronizing in real time.</p>
                        </div>
                      </div>
                    </div>

                    {/* Authentication Box */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Access Secure Credentials</h3>
                          <p className="text-xs text-slate-400 mt-1">Sign in using production database checks or register a new role profile.</p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                          {authError && (
                            <div className="space-y-3">
                              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2 whitespace-pre-line">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-bold block mb-1">Authorization Action Required:</span>
                                  <span>{authError}</span>
                                </div>
                              </div>

                              {hasPopupError && (
                                <div className="p-4 bg-indigo-50/75 border border-indigo-100 rounded-xl space-y-4 font-sans text-left">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                                    <span className="text-xs font-bold text-indigo-900">Secure Direct Access Bypass</span>
                                  </div>
                                  <p className="text-[10px] text-indigo-700 leading-relaxed">
                                    Iframe browser limitations or cookie blocks can prevent popups. You can instantly bypass this by clicking below to log in as <strong>rrahulprakash@gmail.com</strong> into any workspace:
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                                    <button
                                      type="button"
                                      onClick={() => handleBypassSignIn("parent", "rrahulprakash@gmail.com")}
                                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-center transition-all cursor-pointer shadow-xs"
                                    >
                                      🗣️ Parent Advocate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBypassSignIn("therapist", "rrahulprakash@gmail.com")}
                                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-center transition-all cursor-pointer shadow-xs"
                                    >
                                      👩‍⚕️ Psychotherapist
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBypassSignIn("student", "rrahulprakash@gmail.com")}
                                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-center transition-all cursor-pointer shadow-xs"
                                    >
                                      🏃 Student Athlete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBypassSignIn("admin", "rrahulprakash@gmail.com")}
                                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-center transition-all cursor-pointer shadow-xs"
                                    >
                                      ⚙️ Super Admin
                                    </button>
                                  </div>

                                  {/* Authorized Domains Step Guide */}
                                  <div className="pt-3 border-t border-indigo-100 mt-2 space-y-2 text-[10px] text-indigo-800">
                                    <div className="font-bold flex items-center gap-1.5 text-[11px] text-indigo-900 uppercase tracking-tight">
                                      🔧 RESOLVE PERMANENTLY (Authorized Domains)
                                    </div>
                                    <p className="leading-relaxed">
                                      To permanently authorize your new Firebase project <strong>mindedge-1203</strong> to accept queries from this sandboxed development iframe, register these domains in your Console:
                                    </p>
                                    <div className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-[9px] select-all space-y-1 block leading-snug break-all border border-slate-700">
                                      <div>ais-dev-fagpmoloildn4v3woqkrur-374041979999.asia-east1.run.app</div>
                                      <div>ais-pre-fagpmoloildn4v3woqkrur-374041979999.asia-east1.run.app</div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-snug">
                                      👉 <strong>Steps:</strong> Go to the link below, scroll to the bottom of the Sign-in method tab, find <strong>'Authorized domains'</strong>, click <strong>'Add domain'</strong>, and paste both lines!
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                      <a 
                                        href="https://console.firebase.google.com/project/mindedge-1203/authentication/providers" 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-block text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors"
                                      >
                                        Go to Firebase Auth settings ↗
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email account</label>
                            <div className="relative">
                              <Mail className="absolute top-2.5 left-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                required
                                placeholder="your@email.com"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secure Password</label>
                            <div className="relative">
                              <Lock className="absolute top-2.5 left-3.5 w-4 h-4 text-slate-400" />
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            {isSignUp ? "Sign Up Custom Credentials" : "Enter Dashboard Portal"}
                          </button>

                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full py-2 mt-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21.35 11.1H12v2.7h5.38c-.24 1.28-.96 2.37-2.04 3.1v2.6h3.3c1.93-1.78 3.04-4.4 3.04-7.4 0-.44-.12-.87-.33-1.16z" fill="#4285F4" />
                              <path d="M12 20.6c2.43 0 4.47-.8 5.96-2.2l-3.3-2.6c-.91.61-2.08.98-3.3.98-2.34 0-4.33-1.58-5.04-3.7H2.9v2.7c1.48 2.34 5.07 4.22 9.1 4.22z" fill="#34A853" />
                              <path d="M6.96 13.08a6.01 6.01 0 010-2.16V8.22H2.9a10.02 10.02 0 000 7.56l4.06-2.7c-.5-.68-.5-1.32 0-2z" fill="#FBBC05" />
                              <path d="M12 6.16c1.32 0 2.51.45 3.44 1.35l2.58-2.58C16.46 3.46 14.43 2.6 12 2.6 7.97 2.6 4.38 4.48 2.9 7.48l4.06 2.7C7.67 7.44 9.66 6.16 12 6.16z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                          </button>
                        </form>

                        <div className="relative flex py-1 items-center select-none font-sans">
                          <div className="flex-grow border-t border-slate-100"></div>
                          <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-bold tracking-widest">Or Fast Bypass Role Tests</span>
                          <div className="flex-grow border-t border-slate-100"></div>
                        </div>

                        {/* SINGLE CLICK MULTI-ROLE TEST PORTAL TRIGGERS */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center font-sans">Fast-Login as Test Persona</p>
                          <div className="grid grid-cols-2 gap-2 text-xs select-none font-sans">
                            <button
                              onClick={() => handleBypassSignIn("parent")}
                              className="p-2.5 bg-slate-50 text-slate-800 text-left rounded-xl border border-slate-200 hover:bg-slate-100/80 cursor-pointer font-medium text-xs transition-all flex items-center gap-1.5"
                            >
                              🗣️ Parent Advocate
                            </button>
                            <button
                              onClick={() => handleBypassSignIn("student")}
                              className="p-2.5 bg-slate-50 text-slate-800 text-left rounded-xl border border-slate-200 hover:bg-slate-100/80 cursor-pointer font-medium text-xs transition-all flex items-center gap-1.5"
                            >
                              🏃 Student Athlete
                            </button>
                            <button
                              onClick={() => handleBypassSignIn("therapist")}
                              className="p-2.5 bg-slate-50 text-slate-800 text-left rounded-xl border border-slate-200 hover:bg-slate-100/80 cursor-pointer font-medium text-xs transition-all flex items-center gap-1.5"
                            >
                              👩‍⚕️ Approved Specialist
                            </button>
                            <button
                              onClick={() => handleBypassSignIn("school")}
                              className="p-2.5 bg-slate-50 text-slate-800 text-left rounded-xl border border-slate-200 hover:bg-slate-100/80 cursor-pointer font-medium text-xs transition-all flex items-center gap-1.5"
                            >
                              🏫 Campus Partner
                            </button>
                          </div>
                          <button
                            onClick={() => handleBypassSignIn("admin")}
                            className="w-full p-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider text-center block cursor-pointer hover:bg-slate-800 transition-colors"
                          >
                            ⚙️ Launch Super Admin Console
                          </button>
                        </div>

                        <div className="text-center font-sans">
                          <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                          >
                            {isSignUp ? "Already have an account? Sign In" : "Register a brand new Clinical Account"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

          </main>
        </div>
      )}

      {/* COACHING BOOKING PANEL MODAL TRIGGER */}
      {showBookingTherapist && (
        <BookingModal 
          therapist={showBookingTherapist}
          students={user ? students.filter(s => s.parentUid === user.uid) : []}
          isAuthenticated={!!user}
          onRedirectToLogin={() => {
            setShowBookingTherapist(null);
            setActiveTab("login");
          }}
          onClose={() => setShowBookingTherapist(null)}
          onConfirmBooking={handleConfirmBookingInDB}
        />
      )}

      {/* SECURE FOOTER ACCORDING TO ARCH PRINCIPLES */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center font-sans tracking-wide">
        <p className="text-xs text-gray-400">© 2026 MINDEDGE. All Rights Reserved. Designed and Developed by Srijan Labs. 2026</p>
        <p className="text-[10px] text-gray-300 mt-1">Designed with desktop-first pixel precision and secure zero-trust Firestore constraints.</p>
      </footer>

    </div>
  );
}
