import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { testDbConnection, getDbPool } from "./src/db";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Essential middleware
  app.use(express.json({ limit: "25mb" })); // Increase JSON payload for sync batches

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "MINDEDGE", serverTime: new Date().toISOString() });
  });

  app.get("/api/db-check", async (req, res) => {
    console.log("Checking DB connection...");
    const status = await testDbConnection();
    res.json(status);
  });

  // GET /api/db-status - Queries actual PostgreSQL table stats
  app.get("/api/db-status", async (req, res) => {
    console.log("Fetching live PostgreSQL table statistics...");
    try {
      const pool = getDbPool();
      const tables = [
        "users", "students", "therapists", "schools", 
        "appointments", "payments", "blogs", "journals", "notifications"
      ];
      
      const stats: Record<string, number> = {};
      for (const table of tables) {
        try {
          const result = await pool.query(`SELECT COUNT(*)::integer as count FROM ${table}`);
          stats[table] = result.rows[0]?.count ?? 0;
        } catch (tableErr: any) {
          console.warn(`Could not count table "${table}":`, tableErr.message);
          stats[table] = -1; // Flag table error / table does not exist
        }
      }

      // Check for duplicate emails in the users table to diagnose conflicts
      let emailDuplicates: any[] = [];
      try {
        const dupResult = await pool.query(`
          SELECT email, COUNT(*)::integer as occurrence_count, 
                 json_agg(json_build_object('uid', uid, 'name', name, 'role', role)) as accounts
          FROM users 
          WHERE email IS NOT NULL AND email <> ''
          GROUP BY email 
          HAVING COUNT(*) > 1
        `);
        emailDuplicates = dupResult.rows;
      } catch (dupErr: any) {
        console.warn("Could not query duplicate emails analysis:", dupErr.message);
      }
      
      res.json({
        success: true,
        stats,
        emailDuplicates,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Failed to query DB stats:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Unknown error occurred"
      });
    }
  });

  // POST /api/db-sync - Safely upserts bulk documents from clinical Firestore snapshot to cloud PostgreSQL
  app.post("/api/db-sync", async (req, res) => {
    console.log("Commencing sync from Firestore payload to PostgreSQL core...");
    const { users, students, therapists, appointments, journals, blogs, notifications, schools } = req.body;
    
    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN;");
      
      let syncedCounts = {
        users: 0,
        therapists: 0,
        students: 0,
        schools: 0,
        appointments: 0,
        journals: 0,
        blogs: 0,
        notifications: 0
      };

      // Track emails processed during session to avoid duplicate key conflicts within the payload
      const syncedEmailsMap = new Map<string, string>();

      const resolveUniqueEmailSetting = async (rawEmail: string, currentUid: string): Promise<string> => {
        let email = (rawEmail || "").trim().toLowerCase();
        if (!email) {
          return `${currentUid}@mindedge.internal`;
        }
        
        // 1. Check for duplicates in the current memory sync batch
        const registeredUid = syncedEmailsMap.get(email);
        if (registeredUid && registeredUid !== currentUid) {
          const parts = email.split("@");
          const localPart = parts[0];
          const domain = parts[1] || "mindedge.internal";
          email = `${localPart}+conflict-${currentUid.slice(0, 6)}@${domain}`;
        }
        
        // 2. Check for matching rows of different UIDs already present in PostgreSQL table
        let attempts = 0;
        const baseEmail = email;
        while (attempts < 5) {
          const checkRes = await client.query("SELECT uid FROM users WHERE email = $1 AND uid <> $2", [email, currentUid]);
          if (checkRes.rowCount === 0) {
            break; 
          }
          attempts++;
          const parts = baseEmail.split("@");
          const localPart = parts[0];
          const domain = parts[1] || "mindedge.internal";
          email = `${localPart}+conflict-${currentUid.slice(0, 5)}-${attempts}@${domain}`;
        }
        
        syncedEmailsMap.set(email, currentUid);
        return email;
      };

      // 1. Sync Users
      if (Array.isArray(users)) {
        for (const u of users) {
          const uid = u.uid || u.id;
          if (!uid) continue;

          const resolvedEmail = await resolveUniqueEmailSetting(u.email, uid);

          await client.query(`
            INSERT INTO users (uid, name, email, mobile, role, relationship, city, photo_url, is_approved)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (uid) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              mobile = EXCLUDED.mobile,
              role = EXCLUDED.role,
              relationship = EXCLUDED.relationship,
              city = EXCLUDED.city,
              photo_url = EXCLUDED.photo_url,
              is_approved = EXCLUDED.is_approved,
              updated_at = CURRENT_TIMESTAMP
          `, [
            uid,
            u.name || "Unnamed User",
            resolvedEmail,
            u.mobile || u.phone || null,
            u.role || "student",
            u.relationship || null,
            u.city || null,
            u.photoUrl || u.photo_url || null,
            u.isApproved !== undefined ? u.isApproved : (u.is_approved !== undefined ? u.is_approved : true)
          ]);
          syncedCounts.users++;
        }
      }

      // 2. Sync Therapists (Must precede appointments, require verified users reference)
      if (Array.isArray(therapists)) {
        for (const t of therapists) {
          const id = t.id;
          if (!id) continue;
          
          const resolvedEmail = await resolveUniqueEmailSetting(t.email, id);

          // Outer guard: ensure therapist user exists
          const userCheck = await client.query("SELECT uid FROM users WHERE uid = $1", [id]);
          if (userCheck.rowCount === 0) {
            // Auto-create user record for referential integrity
            await client.query(`
              INSERT INTO users (uid, name, email, mobile, role, is_approved)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [id, t.name || t.fullName || "Practitioner User", resolvedEmail, t.mobile || null, "therapist", true]);
            syncedCounts.users++;
          } else {
            // Force synchronize email update in core user records
            await client.query(`
              UPDATE users SET email = $1, name = $2 WHERE uid = $3
            `, [resolvedEmail, t.name || t.fullName || "Practitioner User", id]);
          }

          await client.query(`
            INSERT INTO therapists (
              id, name, email, mobile, photo_url, qualification, experience, 
              specialization, languages, sports_expertise, certifications_url, 
              degree_documents_url, identity_proof_url, display_consent, 
              service_agreement, data_usage_agreement, is_approved, session_fee, 
              available_days, available_time_slots, session_duration, biography
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              mobile = EXCLUDED.mobile,
              photo_url = EXCLUDED.photo_url,
              qualification = EXCLUDED.qualification,
              experience = EXCLUDED.experience,
              specialization = EXCLUDED.specialization,
              languages = EXCLUDED.languages,
              sports_expertise = EXCLUDED.sports_expertise,
              certifications_url = EXCLUDED.certifications_url,
              degree_documents_url = EXCLUDED.degree_documents_url,
              identity_proof_url = EXCLUDED.identity_proof_url,
              display_consent = EXCLUDED.display_consent,
              service_agreement = EXCLUDED.service_agreement,
              data_usage_agreement = EXCLUDED.data_usage_agreement,
              is_approved = EXCLUDED.is_approved,
              session_fee = EXCLUDED.session_fee,
              available_days = EXCLUDED.available_days,
              available_time_slots = EXCLUDED.available_time_slots,
              session_duration = EXCLUDED.session_duration,
              biography = EXCLUDED.biography,
              updated_at = CURRENT_TIMESTAMP
          `, [
            id,
            t.name || "Practitioner",
            resolvedEmail,
            t.mobile || null,
            t.photoUrl || t.photo_url || null,
            t.qualification || "Ph.D./Licensed Psychologist",
            typeof t.experience === "number" ? t.experience : 2,
            t.specialization || "Clinical Sports Mental Performance",
            t.languages || "English",
            t.sportsExpertise || t.sports_expertise || "All Sports",
            t.certificationsUrl || t.certifications_url || null,
            t.degreeDocumentsUrl || t.degree_documents_url || null,
            t.identityProofUrl || t.identity_proof_url || null,
            t.displayConsent !== undefined ? t.displayConsent : true,
            t.serviceAgreement !== undefined ? t.serviceAgreement : true,
            t.dataUsageAgreement !== undefined ? t.dataUsageAgreement : true,
            t.isApproved !== undefined ? t.isApproved : true,
            typeof t.sessionFee === "number" ? t.sessionFee : (typeof t.session_fee === "number" ? t.session_fee : 1000),
            Array.isArray(t.availableDays) ? t.availableDays : (Array.isArray(t.available_days) ? t.available_days : ["Mon", "Tue", "Wed", "Thu", "Fri"]),
            Array.isArray(t.availableTimeSlots) ? t.availableTimeSlots : (Array.isArray(t.available_time_slots) ? t.available_time_slots : ["10:00 AM", "02:00 PM"]),
            typeof t.sessionDuration === "number" ? t.sessionDuration : (typeof t.session_duration === "number" ? t.session_duration : 60),
            t.biography || t.bio || ""
          ]);
          syncedCounts.therapists++;
        }
      }

      // 3. Sync Students
      if (Array.isArray(students)) {
        for (const s of students) {
          const id = s.id;
          if (!id) continue;

          // Resolve parent_id / student_id to prevent FK lookup issues - verify they exist
          let verifiedParentId = s.parentUid || s.parentId || s.parent_id || null;
          let verifiedStudentId = s.studentUid || s.studentId || s.student_id || null;

          if (verifiedParentId) {
            const row = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedParentId]);
            if (row.rowCount === 0) verifiedParentId = null; // cascade avoid violation
          }
          if (verifiedStudentId) {
            const row = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedStudentId]);
            if (row.rowCount === 0) verifiedStudentId = null; // cascade avoid violation
          }

          await client.query(`
            INSERT INTO students (
              id, parent_id, student_id, name, age, gender, school, sport, 
              competition_level, training_frequency, confidence_level, 
              stress_level, focus_level, goals, current_challenges
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              parent_id = EXCLUDED.parent_id,
              student_id = EXCLUDED.student_id,
              name = EXCLUDED.name,
              age = EXCLUDED.age,
              gender = EXCLUDED.gender,
              school = EXCLUDED.school,
              sport = EXCLUDED.sport,
              competition_level = EXCLUDED.competition_level,
              training_frequency = EXCLUDED.training_frequency,
              confidence_level = EXCLUDED.confidence_level,
              stress_level = EXCLUDED.stress_level,
              focus_level = EXCLUDED.focus_level,
              goals = EXCLUDED.goals,
              current_challenges = EXCLUDED.current_challenges,
              updated_at = CURRENT_TIMESTAMP
          `, [
            id,
            verifiedParentId,
            verifiedStudentId,
            s.name || "Student Athlete",
            typeof s.age === "number" ? s.age : 16,
            s.gender || "Not specified",
            s.school || "MindEdge Sports Academy",
            s.sport || "All Sports",
            s.competitionLevel || s.competition_level || "school",
            s.trainingFrequency || s.training_frequency || "5 hours/week",
            typeof s.confidenceLevel === "number" ? s.confidenceLevel : (typeof s.confidence_level === "number" ? s.confidence_level : null),
            typeof s.stressLevel === "number" ? s.stressLevel : (typeof s.stress_level === "number" ? s.stress_level : null),
            typeof s.focusLevel === "number" ? s.focusLevel : (typeof s.focus_level === "number" ? s.focus_level : null),
            s.goals || null,
            Array.isArray(s.currentChallenges) ? s.currentChallenges : (Array.isArray(s.current_challenges) ? s.current_challenges : null)
          ]);
          syncedCounts.students++;
        }
      }

      // 4. Sync Schools
      if (Array.isArray(schools)) {
        for (const sch of schools) {
          const id = sch.id;
          if (!id) continue;

          const resolvedEmail = await resolveUniqueEmailSetting(sch.email, id);

          // Guard: user exists
          const userCheck = await client.query("SELECT uid FROM users WHERE uid = $1", [id]);
          if (userCheck.rowCount === 0) {
            await client.query(`
              INSERT INTO users (uid, name, email, role, is_approved)
              VALUES ($1, $2, $3, $4, $5)
            `, [id, sch.schoolName || sch.school_name || "School Representative", resolvedEmail, "school_admin", true]);
            syncedCounts.users++;
          } else {
            // Synchronize email on core user record for existing users
            await client.query(`
              UPDATE users SET email = $1, name = $2 WHERE uid = $3
            `, [resolvedEmail, sch.schoolName || sch.school_name || "School Representative", id]);
          }

          await client.query(`
            INSERT INTO schools (
              id, school_name, contact_person, email, phone, address, 
              number_of_students, sports_programs, existing_counselor_details
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              school_name = EXCLUDED.school_name,
              contact_person = EXCLUDED.contact_person,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              address = EXCLUDED.address,
              number_of_students = EXCLUDED.number_of_students,
              sports_programs = EXCLUDED.sports_programs,
              existing_counselor_details = EXCLUDED.existing_counselor_details,
              updated_at = CURRENT_TIMESTAMP
          `, [
            id,
            sch.schoolName || sch.school_name || "Default School",
            sch.contactPerson || sch.contact_person || "Contact Person",
            resolvedEmail,
            sch.phone || sch.contactPhone || null,
            sch.address || null,
            typeof sch.numberOfStudents === "number" ? sch.numberOfStudents : (typeof sch.number_of_students === "number" ? sch.number_of_students : 0),
            sch.sportsPrograms || sch.sports_programs || "",
            sch.existingCounselorDetails || sch.existing_counselor_details || ""
          ]);
          syncedCounts.schools++;
        }
      }

      // 5. Sync Appointments
      if (Array.isArray(appointments)) {
        for (const a of appointments) {
          const id = a.id;
          if (!id) continue;

          // Resolve foreign keys to prevent integrity locks
          let verifiedTherapistId = a.therapistId || a.therapist_id;
          let verifiedBookerId = a.bookerId || a.booker_id;
          if (!verifiedTherapistId || !verifiedBookerId) {
            console.warn(`[PG Sync Warning] Skipping appointment ${id} because therapistId or bookerId was null.`);
            continue;
          }
          let verifiedStudentId = a.studentId || a.student_id;
          let verifiedParentUid = a.parentUid || a.parent_uid || null;

          // Double check therapist table
          const tRow = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedTherapistId]);
          if (tRow.rowCount === 0) {
            // Stub user so Postgres allows referencing
            await client.query(`
              INSERT INTO users (uid, name, email, role)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (uid) DO NOTHING
            `, [verifiedTherapistId, a.therapistName || "Therapist User", `${verifiedTherapistId}@temp.internal`, "therapist"]);
          }

          // Double check booker
          const bRow = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedBookerId]);
          if (bRow.rowCount === 0) {
            await client.query(`
              INSERT INTO users (uid, name, email, role)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (uid) DO NOTHING
            `, [verifiedBookerId, a.studentName || "Booker User", `${verifiedBookerId}@temp.internal`, "parent"]);
          }

          // Double check student id
          if (verifiedStudentId) {
            const sRow = await client.query("SELECT id FROM students WHERE id = $1", [verifiedStudentId]);
            if (sRow.rowCount === 0) {
              // Create student row stub
              await client.query(`
                INSERT INTO students (id, name, sport, competition_level)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
              `, [verifiedStudentId, a.studentName || "Student Stub", "All", "school"]);
            }
          }

          if (verifiedParentUid) {
            const pRow = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedParentUid]);
            if (pRow.rowCount === 0) verifiedParentUid = null;
          }

          // Parse Appointment Date - Ensure clean ISO/YMD format
          let formattedDate = a.date || a.appointmentDate || a.appointment_date || new Date().toISOString().split("T")[0];
          if (formattedDate.includes("T")) {
            formattedDate = formattedDate.split("T")[0];
          }

          await client.query(`
            INSERT INTO appointments (
              id, therapist_id, therapist_name, booker_id, booker_type, 
              student_id, student_name, appointment_date, time_slot, status, 
              video_link, payment_status, session_notes, payment_id, order_id, 
              payment_mode, parent_uid
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::DATE, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO UPDATE SET
              therapist_id = EXCLUDED.therapist_id,
              therapist_name = EXCLUDED.therapist_name,
              booker_id = EXCLUDED.booker_id,
              booker_type = EXCLUDED.booker_type,
              student_id = EXCLUDED.student_id,
              student_name = EXCLUDED.student_name,
              appointment_date = EXCLUDED.appointment_date,
              time_slot = EXCLUDED.time_slot,
              status = EXCLUDED.status,
              video_link = EXCLUDED.video_link,
              payment_status = EXCLUDED.payment_status,
              session_notes = EXCLUDED.session_notes,
              payment_id = EXCLUDED.payment_id,
              order_id = EXCLUDED.order_id,
              payment_mode = EXCLUDED.payment_mode,
              parent_uid = EXCLUDED.parent_uid,
              updated_at = CURRENT_TIMESTAMP
          `, [
            id,
            verifiedTherapistId,
            a.therapistName || a.therapist_name || "Coaching Specialist",
            verifiedBookerId,
            a.bookerType || a.booker_type || "parent",
            verifiedStudentId || null,
            a.studentName || a.student_name || "Athlete Name",
            formattedDate,
            a.timeSlot || a.time_slot || "10:00 AM",
            a.status || "requested",
            a.videoLink || a.video_link || null,
            a.paymentStatus || a.payment_status || "pending",
            a.sessionNotes || a.session_notes || "",
            a.paymentId || a.payment_id || null,
            a.orderId || a.order_id || null,
            a.paymentMode || a.payment_mode || null,
            verifiedParentUid
          ]);
          syncedCounts.appointments++;
        }
      }

      // 6. Sync Journals
      if (Array.isArray(journals)) {
        for (const j of journals) {
          const id = j.id;
          if (!id) continue;

          let verifiedStudentId = j.studentId || j.student_id;
          if (!verifiedStudentId) {
            console.warn(`[PG Sync Warning] Skipping journal ${id} because studentId was null.`);
            continue;
          }
          const userCheck = await client.query("SELECT uid FROM users WHERE uid = $1", [verifiedStudentId]);
          if (userCheck.rowCount === 0) {
            // Insert dummy student user to preserve FK integrity
            await client.query(`
              INSERT INTO users (uid, name, email, role)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (uid) DO NOTHING
            `, [verifiedStudentId, "Student Author", `${verifiedStudentId}@mindedge.internal`, "student"]);
          }

          await client.query(`
            INSERT INTO journals (id, student_id, title, content, mood)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
              student_id = EXCLUDED.student_id,
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              mood = EXCLUDED.mood
          `, [
            id,
            verifiedStudentId,
            j.title || "Private Entry",
            j.content || "",
            j.mood || "neutral"
          ]);
          syncedCounts.journals++;
        }
      }

      // 7. Sync Blogs
      if (Array.isArray(blogs)) {
        for (const b of blogs) {
          const id = b.id;
          if (!id) continue;

          let authorId = b.authorId || b.author_id || "admin";
          const userCheck = await client.query("SELECT uid FROM users WHERE uid = $1", [authorId]);
          if (userCheck.rowCount === 0) {
            await client.query(`
              INSERT INTO users (uid, name, email, role)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (uid) DO NOTHING
            `, [authorId, b.authorName || b.author_name || "MINDEDGE Editor", `${authorId}@mindedge.internal`, "admin"]);
          }

          let category = b.category || "mental_fitness";
          const allowedCategories = ["competition_anxiety", "focus_concentration", "parent_guidance", "mental_fitness", "athlete_development"];
          if (!allowedCategories.includes(category)) {
            category = "mental_fitness"; // normalize to check constraint string
          }

          await client.query(`
            INSERT INTO blogs (id, title, content, author_id, author_name, category, image, featured)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              author_id = EXCLUDED.author_id,
              author_name = EXCLUDED.author_name,
              category = EXCLUDED.category,
              image = EXCLUDED.image,
              featured = EXCLUDED.featured
          `, [
            id,
            b.title || "Knowledge Base Article",
            b.content || "",
            authorId,
            b.authorName || b.author_name || "Editor",
            category,
            b.image || null,
            b.featured !== undefined ? b.featured : false
          ]);
          syncedCounts.blogs++;
        }
      }

      // 8. Sync Notifications
      if (Array.isArray(notifications)) {
        for (const n of notifications) {
          const id = n.id;
          if (!id) continue;

          let userId = n.userId || n.user_id;
          const userCheck = await client.query("SELECT uid FROM users WHERE uid = $1", [userId]);
          if (userCheck.rowCount === 0) continue; // Skip orphaned notifications, avoid FK lock

          await client.query(`
            INSERT INTO notifications (id, user_id, message, read, type)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
              user_id = EXCLUDED.user_id,
              message = EXCLUDED.message,
              read = EXCLUDED.read,
              type = EXCLUDED.type
          `, [
            id,
            userId,
            n.message || "",
            n.read !== undefined ? n.read : false,
            n.type || "system"
          ]);
          syncedCounts.notifications++;
        }
      }

      await client.query("COMMIT;");
      console.log("Database transaction committed successfully! Sync totals:", syncedCounts);

      res.json({
        success: true,
        message: "Successfully synchronized clinical records with Cloud PostgreSQL!",
        syncedCounts
      });

    } catch (txErr: any) {
      await client.query("ROLLBACK;");
      console.error("Failed to commit PostgreSQL sync transaction:", txErr);
      res.status(500).json({
        success: false,
        message: "Failed to sync database payload.",
        error: txErr.message || txErr
      });
    } finally {
      client.release();
    }
  });

  // POST /api/payments/create-order as per GPay / Razorpay flow in MVP PRD
  app.post("/api/payments/create-order", (req, res) => {
    const { amount, currency } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }
    
    // Generate a secure, mock order ID matching the PRD format
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const orderId = `order_${randomId}`;
    
    res.json({
      order_id: orderId,
      amount: amount,
      currency: currency || "INR",
      status: "created",
      created_at: Date.now()
    });
  });

  // POST /api/payments/webhook as per PRD
  app.post("/api/payments/webhook", (req, res) => {
    const { payment_id, order_id, status, amount } = req.body;
    
    // Process webhook success event
    console.log(`Payment Webhook Captured: Pay ID: ${payment_id}, Order: ${order_id}, Amt: ${amount}, Status: ${status}`);
    
    res.json({
      received: true,
      event: "payment.captured",
      payment_id,
      order_id,
      status: "captured",
      amount
    });
  });

  // Blog Categories API to fetch standard categories in the system
  app.get("/api/blogs/categories", (req, res) => {
    res.json({
      categories: [
        { id: "competition_anxiety", label: "Competition Anxiety" },
        { id: "focus_concentration", label: "Focus & Concentration" },
        { id: "parent_guidance", label: "Parent Guidance" },
        { id: "mental_fitness", label: "Mental Fitness" },
        { id: "athlete_development", label: "Athlete Development" }
      ]
    });
  });

  // GET /api/users/:uid - Loads user profile info, credentials, and details from active PostgreSQL
  app.get("/api/users/:uid", async (req, res) => {
    const { uid } = req.params;
    console.log(`[PG Auth Query] Searching user credentials on database: UID: ${uid}`);
    try {
      const pool = getDbPool();
      const userResult = await pool.query("SELECT * FROM users WHERE uid = $1", [uid]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ 
          success: false, 
          error: "User credential record not initialized in PostgreSQL yet.", 
          onboardingRequired: true 
        });
      }

      const user = userResult.rows[0];

      // Standardize casing for reactive app schema
      const userProfile = {
        uid: user.uid,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        relationship: user.relationship,
        city: user.city,
        photoUrl: user.photo_url || null,
        isApproved: user.is_approved !== false,
        createdAt: user.created_at
      };

      // Query detailed subcategories matching the client specifications
      let detailedProfile: any = null;
      if (user.role === "student") {
        const studentResult = await pool.query("SELECT * FROM students WHERE id = $1", [uid]);
        if (studentResult.rowCount > 0) {
          const row = studentResult.rows[0];
          detailedProfile = {
            id: row.id,
            parentId: row.parent_id,
            studentId: row.student_id,
            name: row.name,
            age: row.age,
            gender: row.gender,
            school: row.school,
            sport: row.sport,
            competitionLevel: row.competition_level,
            trainingFrequency: row.training_frequency,
            confidenceLevel: row.confidence_level,
            stressLevel: row.stress_level,
            focusLevel: row.focus_level,
            goals: row.goals,
            currentChallenges: row.current_challenges
          };
        }
      } else if (user.role === "therapist") {
        const therapistResult = await pool.query("SELECT * FROM therapists WHERE id = $1", [uid]);
        if (therapistResult.rowCount > 0) {
          const row = therapistResult.rows[0];
          detailedProfile = {
            id: row.id,
            name: row.name,
            email: row.email,
            mobile: row.mobile,
            photoUrl: row.photo_url,
            qualification: row.qualification,
            experience: row.experience,
            specialization: row.specialization,
            languages: row.languages,
            sportsExpertise: row.sports_expertise,
            certificationsUrl: row.certifications_url,
            degreeDocumentsUrl: row.degree_documents_url,
            identityProofUrl: row.identity_proof_url,
            displayConsent: row.display_consent,
            serviceAgreement: row.service_agreement,
            dataUsageAgreement: row.data_usage_agreement,
            isApproved: row.is_approved !== false,
            sessionFee: row.session_fee,
            availableDays: row.available_days,
            availableTimeSlots: row.available_time_slots,
            sessionDuration: row.session_duration,
            biography: row.biography
          };
        }
      } else if (user.role === "school_admin" || user.role === "school") {
        const schoolResult = await pool.query("SELECT * FROM schools WHERE id = $1", [uid]);
        if (schoolResult.rowCount > 0) {
          const row = schoolResult.rows[0];
          detailedProfile = {
            id: row.id,
            schoolName: row.school_name,
            contactPerson: row.contact_person,
            email: row.email,
            phone: row.phone,
            address: row.address,
            numberOfStudents: row.number_of_students,
            sportsPrograms: row.sports_programs,
            existingCounselorDetails: row.existing_counselor_details
          };
        }
      }

      res.json({
        success: true,
        profile: userProfile,
        details: detailedProfile
      });
    } catch (err: any) {
      console.error(`PostgreSQL retrieve error for UID ${uid}:`, err);
      res.status(500).json({ success: false, error: err.message || "Persistent schema retrieval failure" });
    }
  });

  // POST /api/users/save - Handles Registration, Direct setup & details upserts in PostgreSQL
  app.post("/api/users/save", async (req, res) => {
    const { profile, details } = req.body;
    if (!profile || !profile.uid) {
      return res.status(400).json({ success: false, error: "Valid user credentials of UID schema required" });
    }

    const { uid, name, email, mobile, role, relationship, city, photoUrl, isApproved } = profile;
    console.log(`[PG Registrations] Storing master credential mapping under Postgres: UID: ${uid}, Role: ${role}`);
    
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN;");

      await client.query(`
        INSERT INTO users (uid, name, email, mobile, role, relationship, city, photo_url, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (uid) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          mobile = EXCLUDED.mobile,
          role = EXCLUDED.role,
          relationship = EXCLUDED.relationship,
          city = EXCLUDED.city,
          photo_url = EXCLUDED.photo_url,
          is_approved = EXCLUDED.is_approved,
          updated_at = CURRENT_TIMESTAMP
      `, [
        uid,
        name || "Unnamed MindEdge User",
        email || `${uid}@mindedge.internal`,
        mobile || null,
        role || "student",
        relationship || null,
        city || null,
        photoUrl || null,
        isApproved !== undefined ? isApproved : true
      ]);

      // Seed detailed table if details are included in onboarding sync
      if (details) {
        if (role === "student") {
          await client.query(`
            INSERT INTO students (
              id, parent_id, student_id, name, age, gender, school, sport, 
              competition_level, training_frequency, confidence_level, 
              stress_level, focus_level, goals, current_challenges
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              parent_id = EXCLUDED.parent_id,
              student_id = EXCLUDED.student_id,
              name = EXCLUDED.name,
              age = EXCLUDED.age,
              gender = EXCLUDED.gender,
              school = EXCLUDED.school,
              sport = EXCLUDED.sport,
              competition_level = EXCLUDED.competition_level,
              training_frequency = EXCLUDED.training_frequency,
              confidence_level = EXCLUDED.confidence_level,
              stress_level = EXCLUDED.stress_level,
              focus_level = EXCLUDED.focus_level,
              goals = EXCLUDED.goals,
              current_challenges = EXCLUDED.current_challenges,
              updated_at = CURRENT_TIMESTAMP
          `, [
            uid,
            details.parentId || details.parent_id || null,
            details.studentId || details.student_id || null,
            details.name || name || "Student Athlete",
            typeof details.age === "number" ? details.age : 16,
            details.gender || "Not specified",
            details.school || "MindEdge Sports Academy",
            details.sport || "All Sports",
            details.competitionLevel || details.competition_level || "school",
            details.trainingFrequency || details.training_frequency || "5 hours/week",
            typeof details.confidenceLevel === "number" ? details.confidenceLevel : null,
            typeof details.stressLevel === "number" ? details.stressLevel : null,
            typeof details.focusLevel === "number" ? details.focusLevel : null,
            details.goals || null,
            Array.isArray(details.currentChallenges) ? details.currentChallenges : null
          ]);
        } else if (role === "therapist") {
          await client.query(`
            INSERT INTO therapists (
              id, name, email, mobile, photo_url, qualification, experience, 
              specialization, languages, sports_expertise, certifications_url, 
              degree_documents_url, identity_proof_url, display_consent, 
              service_agreement, data_usage_agreement, is_approved, session_fee, 
              available_days, available_time_slots, session_duration, biography
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              mobile = EXCLUDED.mobile,
              photo_url = EXCLUDED.photo_url,
              qualification = EXCLUDED.qualification,
              experience = EXCLUDED.experience,
              specialization = EXCLUDED.specialization,
              languages = EXCLUDED.languages,
              sports_expertise = EXCLUDED.sports_expertise,
              certifications_url = EXCLUDED.certifications_url,
              degree_documents_url = EXCLUDED.degree_documents_url,
              identity_proof_url = EXCLUDED.identity_proof_url,
              display_consent = EXCLUDED.display_consent,
              service_agreement = EXCLUDED.service_agreement,
              data_usage_agreement = EXCLUDED.data_usage_agreement,
              is_approved = EXCLUDED.is_approved,
              session_fee = EXCLUDED.session_fee,
              available_days = EXCLUDED.available_days,
              available_time_slots = EXCLUDED.available_time_slots,
              session_duration = EXCLUDED.session_duration,
              biography = EXCLUDED.biography,
              updated_at = CURRENT_TIMESTAMP
          `, [
            uid,
            details.name || name || "Practitioner",
            details.email || email,
            details.mobile || null,
            details.photoUrl || photoUrl || null,
            details.qualification || "Ph.D./Licensed Psychologist",
            typeof details.experience === "number" ? details.experience : 2,
            details.specialization || "Clinical Sports Mental Performance",
            details.languages || "English",
            details.sportsExpertise || details.sports_expertise || "All Sports",
            details.certificationsUrl || details.certifications_url || null,
            details.degreeDocumentsUrl || details.degree_documents_url || null,
            details.identityProofUrl || details.identity_proof_url || null,
            details.displayConsent !== undefined ? details.displayConsent : true,
            details.serviceAgreement !== undefined ? details.serviceAgreement : true,
            details.dataUsageAgreement !== undefined ? details.dataUsageAgreement : true,
            details.isApproved !== undefined ? details.isApproved : true,
            typeof details.sessionFee === "number" ? details.sessionFee : 1000,
            Array.isArray(details.availableDays) ? details.availableDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
            Array.isArray(details.availableTimeSlots) ? details.availableTimeSlots : ["10:00 AM", "02:00 PM"],
            typeof details.sessionDuration === "number" ? details.sessionDuration : 60,
            details.biography || details.bio || ""
          ]);
        } else if (role === "school_admin" || role === "school") {
          await client.query(`
            INSERT INTO schools (
              id, school_name, contact_person, email, phone, address, 
              number_of_students, sports_programs, existing_counselor_details
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              school_name = EXCLUDED.school_name,
              contact_person = EXCLUDED.contact_person,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              address = EXCLUDED.address,
              number_of_students = EXCLUDED.number_of_students,
              sports_programs = EXCLUDED.sports_programs,
              existing_counselor_details = EXCLUDED.existing_counselor_details,
              updated_at = CURRENT_TIMESTAMP
          `, [
            uid,
            details.schoolName || details.school_name || "Default School",
            details.contactPerson || details.contact_person || name,
            details.email || email,
            details.phone || details.contactPhone || null,
            details.address || null,
            typeof details.numberOfStudents === "number" ? details.numberOfStudents : 0,
            details.sportsPrograms || details.sports_programs || "",
            details.existingCounselorDetails || details.existing_counselor_details || ""
          ]);
        }
      }

      await client.query("COMMIT;");
      res.json({ success: true, message: "User credentials registered securely in master PostgreSQL database." });

    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error("[PG Registrations] Failed secure upsert:", err);
      res.status(500).json({ success: false, error: err.message || err });
    } finally {
      client.release();
    }
  });

  // POST /api/users/:uid/approve - Handles secure toggle approval directly on PostgreSQL tables
  app.post("/api/users/:uid/approve", async (req, res) => {
    const { uid } = req.params;
    const { isApproved } = req.body;
    console.log(`[PG Approval] Setting compliance status on database: UID: ${uid}, Approved: ${isApproved}`);
    
    const pool = getDbPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      await client.query("UPDATE users SET is_approved = $1, updated_at = CURRENT_TIMESTAMP WHERE uid = $2", [isApproved, uid]);
      await client.query("UPDATE therapists SET is_approved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [isApproved, uid]);
      await client.query("COMMIT;");
      res.json({ success: true, message: `Compliance state updated for ${uid} in master PostgreSQL.` });
    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error(`[PG Compliance] Failed toggle approval for user ${uid}:`, err);
      res.status(500).json({ success: false, error: err.message || err });
    } finally {
      client.release();
    }
  });

  // DELETE /api/users/:uid - Purges user account and reference dependencies completely from SQL storage
  app.delete("/api/users/:uid", async (req, res) => {
    const { uid } = req.params;
    console.log(`[PG Purge Check] Commencing deep purge mapping for user: UID: ${uid}`);
    
    const pool = getDbPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      
      // Clear secondary relational references
      await client.query("DELETE FROM students WHERE id = $1 OR parent_id = $1 OR student_id = $1", [uid]);
      await client.query("DELETE FROM therapists WHERE id = $1", [uid]);
      await client.query("DELETE FROM schools WHERE id = $1", [uid]);
      await client.query("DELETE FROM appointments WHERE therapist_id = $1 OR booker_id = $1 OR student_id = $1 OR parent_uid = $1", [uid]);
      await client.query("DELETE FROM journals WHERE student_id = $1", [uid]);
      await client.query("DELETE FROM notifications WHERE user_id = $1", [uid]);
      
      const userDel = await client.query("DELETE FROM users WHERE uid = $1", [uid]);
      
      await client.query("COMMIT;");
      res.json({ success: true, message: `Account and relative references deactivated successfully on postgreSQL (${userDel.rowCount} rows).` });
    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error(`[PG Purge Failure] Handlers error during deactivation for UID ${uid}:`, err);
      res.status(500).json({ success: false, error: err.message || err });
    } finally {
      client.release();
    }
  });

  // Integration with Vite
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MINDEDGE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

