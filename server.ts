import "dotenv/config";
import express from "express";
import { randomUUID } from "crypto";
import path from "path";
import { createServer as createViteServer } from "vite";
import { testDbConnection, getDbPool } from "./src/db";
import { INITIAL_BLOG_ARTICLES, INITIAL_SEED_THERAPISTS } from "./src/data";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const OTP_CODE = process.env.HARDCODED_OTP || "123456";
  const sessionStore = new Map<string, { uid: string }>();

  // Essential middleware
  app.use(express.json({ limit: "25mb" })); // Increase JSON payload for sync batches

  type SessionRequest = express.Request & {
    sessionUser?: {
      uid: string;
      name: string;
      email: string;
      role: string;
      mobile?: string | null;
      relationship?: string | null;
      city?: string | null;
      photo_url?: string | null;
      is_approved?: boolean;
      profile_completed?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    sessionToken?: string;
  };

  const makeId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const getPool = () => getDbPool();
  const getEmailLocalPart = (email: string) => email.split("@")[0]?.replace(/[._-]+/g, " ") || "YovoEdge User";
  const titleCase = (value: string) => value.replace(/\b\w/g, (char) => char.toUpperCase());
  const normalizeMobile = (value: string) => value.replace(/\D/g, "");
  const normalizeString = (value: unknown) => String(value || "").trim();
  const normalizeLower = (value: unknown) => normalizeString(value).toLowerCase();
  const extractToken = (req: express.Request) => {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice("Bearer ".length).trim();
    }
    const altHeader = req.headers["x-session-token"];
    return typeof altHeader === "string" ? altHeader : "";
  };

  const mapUserProfile = (user: any) => ({
    uid: user.uid,
    name: user.name,
    email: user.email,
    mobile: user.mobile || undefined,
    role: user.role,
    relationship: user.relationship || undefined,
    city: user.city || undefined,
    photoURL: user.photo_url || undefined,
    isApproved: user.is_approved !== false,
    profileCompleted: user.profile_completed !== false,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });

  const mapStudent = (row: any) => ({
    id: row.id,
    parentId: row.parent_id || undefined,
    studentId: row.student_id || undefined,
    name: row.name,
    age: row.age,
    gender: row.gender,
    schoolCatalogId: row.school_catalog_id || undefined,
    school: row.school,
    sport: row.sport,
    competitionLevel: row.competition_level,
    trainingFrequency: row.training_frequency || undefined,
    confidenceLevel: row.confidence_level,
    stressLevel: row.stress_level,
    focusLevel: row.focus_level,
    goals: row.goals || undefined,
    currentChallenges: row.current_challenges || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapTherapist = (row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile || undefined,
    photoURL: row.photo_url || undefined,
    qualification: row.qualification,
    experience: row.experience,
    specialization: row.specialization,
    languages: row.languages || undefined,
    sportsExpertise: row.sports_expertise || undefined,
    certificationsUrl: row.certifications_url || undefined,
    degreeDocumentsUrl: row.degree_documents_url || undefined,
    identityProofUrl: row.identity_proof_url || undefined,
    displayConsent: row.display_consent,
    serviceAgreement: row.service_agreement,
    dataUsageAgreement: row.data_usage_agreement,
    isApproved: row.is_approved !== false,
    sessionFee: row.session_fee,
    availableDays: row.available_days || [],
    availableTimeSlots: row.available_time_slots || [],
    sessionDuration: row.session_duration,
    biography: row.biography || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapSchool = (row: any) => ({
    id: row.id,
    catalogSchoolId: row.catalog_school_id || undefined,
    schoolName: row.school_name,
    location: row.location || undefined,
    city: row.city || undefined,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone || undefined,
    address: row.address || undefined,
    numberOfStudents: row.number_of_students,
    sportsPrograms: row.sports_programs || undefined,
    existingCounselorDetails: row.existing_counselor_details || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapSchoolCatalog = (row: any) => ({
    id: row.id,
    schoolName: row.school_name,
    location: row.location || undefined,
    city: row.city || undefined,
    status: row.status,
    submittedByUid: row.submitted_by_uid || undefined,
    approvedByUid: row.approved_by_uid || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapAppointment = (row: any) => ({
    id: row.id,
    therapistId: row.therapist_id,
    therapistName: row.therapist_name,
    bookerId: row.booker_id,
    bookerType: row.booker_type,
    studentId: row.student_id || undefined,
    studentName: row.student_name,
    date: row.appointment_date instanceof Date
      ? row.appointment_date.toISOString().split("T")[0]
      : String(row.appointment_date),
    timeSlot: row.time_slot,
    status: row.status,
    videoLink: row.video_link || undefined,
    paymentStatus: row.payment_status,
    sessionNotes: row.session_notes || undefined,
    paymentId: row.payment_id || undefined,
    orderId: row.order_id || undefined,
    paymentMode: row.payment_mode || undefined,
    parentUid: row.parent_uid || undefined,
    paymentScreenshot: row.payment_screenshot || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapBlog = (row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorName: row.author_name,
    category: row.category,
    image: row.image || undefined,
    featured: row.featured === true,
    createdAt: row.created_at,
  });

  const mapJournal = (row: any) => ({
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    content: row.content,
    mood: row.mood || undefined,
    createdAt: row.created_at,
  });

  const mapNotification = (row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title || "YovoEdge Update",
    message: row.message,
    read: row.read === true,
    type: row.type || "system",
    createdAt: new Date(row.created_at).getTime(),
  });

  const mapChat = (row: any) => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    text: row.text,
    quickReply: row.quick_reply === true,
    appointmentId: row.appointment_id,
    createdAt: row.created_at,
  });

  const mapTranscript = (row: any) => ({
    id: row.id,
    title: row.title,
    creatorId: row.creator_id,
    participantNames: row.participant_names || [],
    messagesCount: row.messages_count || 0,
    transcript: row.transcript,
    createdAt: row.created_at,
    appointmentId: row.appointment_id || undefined,
  });

  const seedBlogs = () =>
    INITIAL_BLOG_ARTICLES.map((article, index) => ({
      id: `seed-blog-${index + 1}`,
      ...article,
      createdAt: new Date().toISOString(),
    }));

  const resolveRoleDetails = async (uid: string, role: string) => {
    const pool = getPool();
    if (role === "student") {
      const result = await pool.query("SELECT * FROM students WHERE id = $1 OR student_id = $1 LIMIT 1", [uid]);
      return result.rowCount ? mapStudent(result.rows[0]) : null;
    }
    if (role === "therapist") {
      const result = await pool.query("SELECT * FROM therapists WHERE id = $1 LIMIT 1", [uid]);
      return result.rowCount ? mapTherapist(result.rows[0]) : null;
    }
    if (role === "school_admin") {
      const result = await pool.query("SELECT * FROM schools WHERE id = $1 LIMIT 1", [uid]);
      return result.rowCount ? mapSchool(result.rows[0]) : null;
    }
    return null;
  };

  const ensureAdmin = (req: SessionRequest, res: express.Response, next: express.NextFunction) => {
    if (req.sessionUser?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access required." });
    }
    next();
  };

  const resolveSchoolSelection = async (
    client: any,
    {
      schoolCatalogId,
      schoolName,
      schoolLocation,
      schoolCity,
      submittedByUid,
    }: {
      schoolCatalogId?: string | null;
      schoolName?: string | null;
      schoolLocation?: string | null;
      schoolCity?: string | null;
      submittedByUid?: string | null;
    },
  ) => {
    const requestedCatalogId = normalizeString(schoolCatalogId);
    if (requestedCatalogId) {
      const catalogResult = await client.query("SELECT * FROM school_catalog WHERE id = $1 LIMIT 1", [requestedCatalogId]);
      if (!catalogResult.rowCount) {
        throw new Error("Selected school could not be found.");
      }
      const catalogRow = catalogResult.rows[0];
      return {
        catalogId: catalogRow.id,
        schoolName: catalogRow.school_name,
        location: catalogRow.location || "",
        city: catalogRow.city || "",
        status: catalogRow.status,
      };
    }

    const requestedSchoolName = normalizeString(schoolName);
    if (!requestedSchoolName) {
      throw new Error("School name is required.");
    }

    const requestedLocation = normalizeString(schoolLocation);
    const requestedCity = normalizeString(schoolCity);
    const existing = await client.query(
      `
        SELECT *
        FROM school_catalog
        WHERE LOWER(school_name) = LOWER($1)
          AND LOWER(COALESCE(city, '')) = LOWER($2)
        ORDER BY CASE WHEN status = 'approved' THEN 0 ELSE 1 END, created_at ASC
        LIMIT 1
      `,
      [requestedSchoolName, requestedCity],
    );

    if (existing.rowCount) {
      const row = existing.rows[0];
      return {
        catalogId: row.id,
        schoolName: row.school_name,
        location: row.location || requestedLocation,
        city: row.city || requestedCity,
        status: row.status,
      };
    }

    const createdId = makeId("schoolcat");
    await client.query(
      `
        INSERT INTO school_catalog (
          id, school_name, location, city, status, submitted_by_uid, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, 'pending', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [createdId, requestedSchoolName, requestedLocation || null, requestedCity || null, submittedByUid || null],
    );

    return {
      catalogId: createdId,
      schoolName: requestedSchoolName,
      location: requestedLocation,
      city: requestedCity,
      status: "pending",
    };
  };

  const createNotification = async (userId: string, title: string, message: string, type = "system") => {
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO notifications (id, user_id, title, message, read, type, created_at)
        VALUES ($1, $2, $3, $4, FALSE, $5, CURRENT_TIMESTAMP)
      `,
      [makeId("notif"), userId, title, message, type],
    );
  };

  const ensureSessionUser = async (req: SessionRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const token = extractToken(req);
      const session = token ? sessionStore.get(token) : undefined;
      if (!token || !session) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }
      const pool = getPool();
      const result = await pool.query("SELECT * FROM users WHERE uid = $1 LIMIT 1", [session.uid]);
      if (!result.rowCount) {
        sessionStore.delete(token);
        return res.status(401).json({ success: false, error: "Session expired." });
      }
      req.sessionToken = token;
      req.sessionUser = result.rows[0];
      next();
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to resolve session." });
    }
  };

  const buildBootstrapPayload = async (currentUser?: SessionRequest["sessionUser"]) => {
    const pool = getPool();
    const therapistsResult = await pool.query("SELECT * FROM therapists ORDER BY created_at DESC");
    const blogsResult = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
    const schoolCatalogResult = currentUser?.role === "admin"
      ? await pool.query("SELECT * FROM school_catalog ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, school_name ASC")
      : await pool.query("SELECT * FROM school_catalog WHERE status = 'approved' ORDER BY school_name ASC");

    const therapists = therapistsResult.rowCount
      ? therapistsResult.rows.map(mapTherapist)
      : INITIAL_SEED_THERAPISTS;
    const blogs = blogsResult.rowCount
      ? blogsResult.rows.map(mapBlog)
      : seedBlogs();
    const schoolCatalog = schoolCatalogResult.rows.map(mapSchoolCatalog);

    if (!currentUser) {
      return {
        session: null,
        users: [],
        students: [],
        therapists,
        appointments: [],
        blogs,
        journals: [],
        notifications: [],
        schoolCatalog,
      };
    }

    const userProfile = mapUserProfile(currentUser);
    const details = await resolveRoleDetails(currentUser.uid, currentUser.role);

    let usersQuery = "SELECT * FROM users WHERE uid = $1";
    let usersParams: any[] = [currentUser.uid];
    if (currentUser.role === "admin") {
      usersQuery = "SELECT * FROM users ORDER BY created_at DESC";
      usersParams = [];
    }

    let studentsQuery = "SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC";
    let studentsParams: any[] = [currentUser.uid];
    if (currentUser.role === "student") {
      studentsQuery = "SELECT * FROM students WHERE id = $1 OR student_id = $1 ORDER BY created_at DESC";
    } else if (currentUser.role === "therapist") {
      studentsQuery = `
        SELECT DISTINCT s.*
        FROM students s
        INNER JOIN appointments a ON a.student_id = s.id
        WHERE a.therapist_id = $1
        ORDER BY s.created_at DESC
      `;
    } else if (currentUser.role === "school_admin") {
      const schoolResult = await pool.query("SELECT catalog_school_id, school_name FROM schools WHERE id = $1 LIMIT 1", [currentUser.uid]);
      const catalogSchoolId = schoolResult.rows[0]?.catalog_school_id || "";
      const schoolName = schoolResult.rows[0]?.school_name || "";
      if (catalogSchoolId) {
        studentsQuery = "SELECT * FROM students WHERE school_catalog_id = $1 ORDER BY created_at DESC";
        studentsParams = [catalogSchoolId];
      } else {
        studentsQuery = "SELECT * FROM students WHERE LOWER(COALESCE(school, '')) = LOWER($1) ORDER BY created_at DESC";
        studentsParams = [schoolName];
      }
    } else if (currentUser.role === "admin") {
      studentsQuery = "SELECT * FROM students ORDER BY created_at DESC";
      studentsParams = [];
    }

    let appointmentsQuery = `
      SELECT * FROM appointments
      WHERE booker_id = $1 OR parent_uid = $1
      ORDER BY appointment_date DESC, created_at DESC
    `;
    let appointmentsParams: any[] = [currentUser.uid];
    if (currentUser.role === "student") {
      appointmentsQuery = `
        SELECT * FROM appointments
        WHERE booker_id = $1 OR student_id = $1
        ORDER BY appointment_date DESC, created_at DESC
      `;
    } else if (currentUser.role === "therapist") {
      appointmentsQuery = `
        SELECT * FROM appointments
        WHERE therapist_id = $1
        ORDER BY appointment_date DESC, created_at DESC
      `;
    } else if (currentUser.role === "admin") {
      appointmentsQuery = "SELECT * FROM appointments ORDER BY appointment_date DESC, created_at DESC";
      appointmentsParams = [];
    } else if (currentUser.role === "school_admin") {
      appointmentsQuery = "SELECT * FROM appointments ORDER BY appointment_date DESC, created_at DESC";
      appointmentsParams = [];
    }

    const journalsQuery = currentUser.role === "admin"
      ? "SELECT * FROM journals ORDER BY created_at DESC"
      : "SELECT * FROM journals WHERE student_id = $1 ORDER BY created_at DESC";
    const journalsParams = currentUser.role === "admin" ? [] : [currentUser.uid];

    const [usersResult, studentsResult, appointmentsResult, journalsResult, notificationsResult] = await Promise.all([
      pool.query(usersQuery, usersParams),
      pool.query(studentsQuery, studentsParams),
      pool.query(appointmentsQuery, appointmentsParams),
      pool.query(journalsQuery, journalsParams),
      pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [currentUser.uid]),
    ]);

    return {
      session: {
        profile: userProfile,
        details,
      },
      users: usersResult.rows.map(mapUserProfile),
      students: studentsResult.rows.map(mapStudent),
      therapists,
      appointments: appointmentsResult.rows.map(mapAppointment),
      blogs,
      journals: journalsResult.rows.map(mapJournal),
      notifications: notificationsResult.rows.map(mapNotification),
      schoolCatalog,
    };
  };

  app.post("/api/auth/request-code", async (req, res) => {
    const mobile = normalizeMobile(String(req.body?.mobile || ""));
    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ success: false, error: "A valid mobile number is required." });
    }

    const pool = getPool();
    const existing = await pool.query("SELECT uid FROM users WHERE mobile = $1 LIMIT 1", [mobile]);
    res.json({
      success: true,
      message: `Temporary OTP issued for ${mobile}.`,
      isExistingUser: existing.rowCount > 0,
      codeHint: OTP_CODE,
    });
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    const mobile = normalizeMobile(String(req.body?.mobile || ""));
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim();

    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ success: false, error: "A valid mobile number is required." });
    }
    if (code !== OTP_CODE) {
      return res.status(401).json({ success: false, error: "Invalid OTP code." });
    }

    const pool = getPool();
    let userResult = await pool.query("SELECT * FROM users WHERE mobile = $1 LIMIT 1", [mobile]);

    if (!userResult.rowCount) {
      const uid = makeId("user");
      const provisionalName = name || `User ${mobile.slice(-4)}`;
      const syntheticEmail = `${mobile}@yovoedge.mobile`;
      await pool.query(
        `
          INSERT INTO users (uid, name, email, mobile, role, is_approved, profile_completed, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'parent', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [uid, provisionalName, syntheticEmail, mobile],
      );
      userResult = await pool.query("SELECT * FROM users WHERE uid = $1 LIMIT 1", [uid]);
    }

    const user = userResult.rows[0];
    const token = makeId("sess");
    sessionStore.set(token, { uid: user.uid });

    res.json({
      success: true,
      token,
      session: {
        profile: mapUserProfile(user),
        details: await resolveRoleDetails(user.uid, user.role),
      },
    });
  });

  app.get("/api/auth/me", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    res.json({
      success: true,
      profile: mapUserProfile(currentUser),
      details: await resolveRoleDetails(currentUser.uid, currentUser.role),
    });
  });

  app.post("/api/auth/logout", ensureSessionUser, async (req: SessionRequest, res) => {
    if (req.sessionToken) {
      sessionStore.delete(req.sessionToken);
    }
    res.json({ success: true });
  });

  app.get("/api/bootstrap", async (req, res) => {
    try {
      const token = extractToken(req);
      const session = token ? sessionStore.get(token) : undefined;
      if (!session) {
        return res.json({ success: true, ...(await buildBootstrapPayload()) });
      }

      const pool = getPool();
      const userResult = await pool.query("SELECT * FROM users WHERE uid = $1 LIMIT 1", [session.uid]);
      if (!userResult.rowCount) {
        sessionStore.delete(token);
        return res.json({ success: true, ...(await buildBootstrapPayload()) });
      }

      res.json({ success: true, ...(await buildBootstrapPayload(userResult.rows[0])) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to load bootstrap data." });
    }
  });

  app.get("/api/schools/catalog", async (req, res) => {
    try {
      const includeAll = req.query.includeAll === "true";
      const token = extractToken(req);
      const session = token ? sessionStore.get(token) : undefined;
      let currentUser: any = null;
      if (session) {
        const pool = getPool();
        const userResult = await pool.query("SELECT * FROM users WHERE uid = $1 LIMIT 1", [session.uid]);
        currentUser = userResult.rows[0] || null;
      }

      const pool = getPool();
      const result = includeAll && currentUser?.role === "admin"
        ? await pool.query("SELECT * FROM school_catalog ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, school_name ASC")
        : await pool.query("SELECT * FROM school_catalog WHERE status = 'approved' ORDER BY school_name ASC");

      res.json({ success: true, schools: result.rows.map(mapSchoolCatalog) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to load school catalog." });
    }
  });

  app.post("/api/schools/catalog/import", ensureSessionUser, ensureAdmin, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!entries.length) {
      return res.status(400).json({ success: false, error: "At least one school entry is required." });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let imported = 0;

      for (const entry of entries) {
        const schoolName = normalizeString(entry?.schoolName);
        const location = normalizeString(entry?.location);
        const city = normalizeString(entry?.city);
        if (!schoolName) {
          continue;
        }

        const existing = await client.query(
          `
            SELECT id
            FROM school_catalog
            WHERE LOWER(school_name) = LOWER($1)
              AND LOWER(COALESCE(city, '')) = LOWER($2)
            LIMIT 1
          `,
          [schoolName, city],
        );

        if (existing.rowCount) {
          await client.query(
            `
              UPDATE school_catalog
              SET location = $1,
                  city = $2,
                  status = 'approved',
                  approved_by_uid = $3,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $4
            `,
            [location || null, city || null, currentUser.uid, existing.rows[0].id],
          );
        } else {
          await client.query(
            `
              INSERT INTO school_catalog (
                id, school_name, location, city, status, submitted_by_uid, approved_by_uid, created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, 'approved', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [makeId("schoolcat"), schoolName, location || null, city || null, currentUser.uid, currentUser.uid],
          );
        }
        imported += 1;
      }

      await client.query("COMMIT");
      res.json({ success: true, imported });
    } catch (error: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ success: false, error: error.message || "Failed to import schools." });
    } finally {
      client.release();
    }
  });

  app.patch("/api/schools/catalog/:id", ensureSessionUser, ensureAdmin, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const { id } = req.params;
    const schoolName = normalizeString(req.body?.schoolName);
    const location = normalizeString(req.body?.location);
    const city = normalizeString(req.body?.city);
    const requestedStatus = normalizeLower(req.body?.status);

    if (!schoolName) {
      return res.status(400).json({ success: false, error: "School name is required." });
    }
    if (!["pending", "approved", "rejected"].includes(requestedStatus)) {
      return res.status(400).json({ success: false, error: "A valid status is required." });
    }

    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE school_catalog
        SET school_name = $1,
            location = $2,
            city = $3,
            status = $4,
            approved_by_uid = CASE WHEN $4 = 'approved' THEN $5 ELSE approved_by_uid END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `,
      [schoolName, location || null, city || null, requestedStatus, currentUser.uid, id],
    );

    if (!result.rowCount) {
      return res.status(404).json({ success: false, error: "School entry not found." });
    }

    res.json({ success: true, school: mapSchoolCatalog(result.rows[0]) });
  });

  app.post("/api/onboarding", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const role = String(req.body?.role || "");
    const details = req.body?.details || {};
    if (!["parent", "student", "therapist", "school_admin"].includes(role)) {
      return res.status(400).json({ success: false, error: "A supported role is required." });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (role === "parent") {
        if (!normalizeString(details.childGender)) {
          throw new Error("Gender is required for the athlete profile.");
        }
        await client.query(
          `
            UPDATE users
            SET name = $1, mobile = $2, relationship = $3, role = 'parent', profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $4
          `,
          [
            details.parentName || currentUser.name,
            details.parentMobile || currentUser.mobile || null,
            (details.parentRelation || "").toLowerCase() || null,
            currentUser.uid,
          ],
        );

        if (details.childName) {
          const childSchoolSelection = await resolveSchoolSelection(client, {
            schoolCatalogId: details.childSchoolCatalogId,
            schoolName: details.childSchool,
            schoolLocation: details.childSchoolLocation,
            schoolCity: details.childSchoolCity,
            submittedByUid: currentUser.uid,
          });
          const studentId = makeId("student");
          await client.query(
            `
              INSERT INTO students (
                id, parent_id, name, age, gender, school_catalog_id, school, sport, competition_level,
                training_frequency, created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [
              studentId,
              currentUser.uid,
              details.childName,
              Number(details.childAge) || 14,
              details.childGender,
              childSchoolSelection.catalogId,
              childSchoolSelection.schoolName,
              details.childSport || "Athletics",
              String(details.childCompetition || "school").toLowerCase(),
              details.childTraining || "",
            ],
          );
        }
      } else if (role === "student") {
        if (!normalizeString(details.studentGender)) {
          throw new Error("Gender is required for the athlete profile.");
        }
        const studentSchoolSelection = await resolveSchoolSelection(client, {
          schoolCatalogId: details.studentSchoolCatalogId,
          schoolName: details.studentSchool,
          schoolLocation: details.studentSchoolLocation,
          schoolCity: details.studentSchoolCity || details.studentCity,
          submittedByUid: currentUser.uid,
        });
        await client.query(
          `
            UPDATE users
            SET name = $1, city = $2, role = 'student', profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $3
          `,
          [details.studentName || currentUser.name, details.studentCity || studentSchoolSelection.city || null, currentUser.uid],
        );

        await client.query(
          `
            INSERT INTO students (
              id, student_id, name, age, gender, school_catalog_id, school, sport, competition_level, training_frequency,
              confidence_level, stress_level, focus_level, goals, current_challenges, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
              student_id = EXCLUDED.student_id,
              name = EXCLUDED.name,
              age = EXCLUDED.age,
              gender = EXCLUDED.gender,
              school_catalog_id = EXCLUDED.school_catalog_id,
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
          `,
          [
            currentUser.uid,
            currentUser.uid,
            details.studentName || currentUser.name,
            Number(details.studentAge) || 16,
            details.studentGender,
            studentSchoolSelection.catalogId,
            studentSchoolSelection.schoolName,
            details.studentSport || "Athletics",
            String(details.studentCompLevel || "school").toLowerCase(),
            details.studentTrainFreq || "",
            Number(details.confidence) || null,
            Number(details.stress) || null,
            Number(details.focus) || null,
            details.goals || null,
            Array.isArray(details.challenges) ? details.challenges : [],
          ],
        );
      } else if (role === "therapist") {
        await client.query(
          `
            UPDATE users
            SET name = $1, mobile = $2, role = 'therapist', is_approved = FALSE, profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $3
          `,
          [details.therapistName || currentUser.name, details.therapistMobile || null, currentUser.uid],
        );

        await client.query(
          `
            INSERT INTO therapists (
              id, name, email, mobile, qualification, experience, specialization, languages,
              sports_expertise, certifications_url, degree_documents_url, identity_proof_url,
              display_consent, service_agreement, data_usage_agreement, is_approved, session_fee,
              available_days, available_time_slots, session_duration, biography, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, FALSE, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              mobile = EXCLUDED.mobile,
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
              is_approved = FALSE,
              session_fee = EXCLUDED.session_fee,
              available_days = EXCLUDED.available_days,
              available_time_slots = EXCLUDED.available_time_slots,
              session_duration = EXCLUDED.session_duration,
              biography = EXCLUDED.biography,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            currentUser.uid,
            details.therapistName || currentUser.name,
            currentUser.email,
            details.therapistMobile || null,
            details.qualification || "",
            Number(details.experience) || 0,
            details.specialization || "",
            details.languages || "",
            details.sportsExpertise || "",
            details.certDocs || null,
            details.degreeDocs || null,
            details.identityDocs || null,
            details.therapistDisplayConsent === true,
            details.therapistServiceAgreement === true,
            details.therapistDataAgreement === true,
            Number(details.sessionFee) || 1000,
            Array.isArray(details.availableDays) ? details.availableDays : ["Mon", "Wed", "Fri"],
            Array.isArray(details.availableTimeSlots) ? details.availableTimeSlots : ["10:00 AM", "02:00 PM"],
            Number(details.sessionDuration) || 60,
            details.biography || "",
          ],
        );
      } else if (role === "school_admin") {
        const schoolSelection = await resolveSchoolSelection(client, {
          schoolCatalogId: details.schoolCatalogId,
          schoolName: details.schoolName,
          schoolLocation: details.schoolLocation,
          schoolCity: details.schoolCity,
          submittedByUid: currentUser.uid,
        });
        await client.query(
          `
            UPDATE users
            SET name = $1, mobile = $2, role = 'school_admin', profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $3
          `,
          [details.schoolContact || currentUser.name, details.schoolPhone || null, currentUser.uid],
        );

        await client.query(
          `
            INSERT INTO schools (
              id, catalog_school_id, school_name, location, city, contact_person, email, phone, address,
              number_of_students, sports_programs, existing_counselor_details, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
              catalog_school_id = EXCLUDED.catalog_school_id,
              school_name = EXCLUDED.school_name,
              location = EXCLUDED.location,
              city = EXCLUDED.city,
              contact_person = EXCLUDED.contact_person,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              address = EXCLUDED.address,
              number_of_students = EXCLUDED.number_of_students,
              sports_programs = EXCLUDED.sports_programs,
              existing_counselor_details = EXCLUDED.existing_counselor_details,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            currentUser.uid,
            schoolSelection.catalogId,
            schoolSelection.schoolName,
            schoolSelection.location || null,
            schoolSelection.city || null,
            details.schoolContact || currentUser.name,
            currentUser.email,
            details.schoolPhone || null,
            details.schoolAddress || null,
            Number(details.numStudents) || 0,
            details.sportsPrograms || "",
            details.currentCounselor || "",
          ],
        );
      }

      await client.query("COMMIT");
      const refreshedUser = await pool.query("SELECT * FROM users WHERE uid = $1 LIMIT 1", [currentUser.uid]);
      res.json({
        success: true,
        session: {
          profile: mapUserProfile(refreshedUser.rows[0]),
          details: await resolveRoleDetails(currentUser.uid, role),
        },
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ success: false, error: error.message || "Failed to save onboarding." });
    } finally {
      client.release();
    }
  });

  app.post("/api/students", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const details = req.body || {};
    const pool = getPool();
    const id = makeId("student");
    if (!normalizeString(details.name) || !normalizeString(details.gender) || !normalizeString(details.sport)) {
      return res.status(400).json({ success: false, error: "Student name, gender, and sport are required." });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const schoolSelection = await resolveSchoolSelection(client, {
        schoolCatalogId: details.schoolCatalogId,
        schoolName: details.school,
        schoolLocation: details.schoolLocation,
        schoolCity: details.schoolCity,
        submittedByUid: currentUser.uid,
      });
      await client.query(
        `
          INSERT INTO students (
            id, parent_id, name, age, gender, school_catalog_id, school, sport, competition_level,
            training_frequency, confidence_level, stress_level, focus_level, goals, current_challenges,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          id,
          currentUser.uid,
          details.name,
          Number(details.age) || 14,
          details.gender,
          schoolSelection.catalogId,
          schoolSelection.schoolName,
          details.sport || "Athletics",
          String(details.competitionLevel || "school").toLowerCase(),
          details.trainingFrequency || "",
          typeof details.confidenceLevel === "number" ? details.confidenceLevel : null,
          typeof details.stressLevel === "number" ? details.stressLevel : null,
          typeof details.focusLevel === "number" ? details.focusLevel : null,
          details.goals || null,
          Array.isArray(details.currentChallenges) ? details.currentChallenges : [],
        ],
      );
      await client.query("COMMIT");
    } catch (error: any) {
      await client.query("ROLLBACK");
      return res.status(500).json({ success: false, error: error.message || "Failed to add student." });
    } finally {
      client.release();
    }
    const created = await pool.query("SELECT * FROM students WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, student: mapStudent(created.rows[0]) });
  });

  app.patch("/api/students/:id/assessment", ensureSessionUser, async (req, res) => {
    const { id } = req.params;
    const { confidenceLevel, stressLevel, focusLevel, goals, currentChallenges } = req.body || {};
    const pool = getPool();
    await pool.query(
      `
        UPDATE students
        SET confidence_level = $1,
            stress_level = $2,
            focus_level = $3,
            goals = $4,
            current_challenges = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `,
      [confidenceLevel ?? null, stressLevel ?? null, focusLevel ?? null, goals || null, Array.isArray(currentChallenges) ? currentChallenges : [], id],
    );
    res.json({ success: true });
  });

  app.patch("/api/therapists/:id", ensureSessionUser, async (req, res) => {
    const { id } = req.params;
    const { sessionFee, availableDays, biography } = req.body || {};
    const pool = getPool();
    await pool.query(
      `
        UPDATE therapists
        SET session_fee = COALESCE($1, session_fee),
            available_days = COALESCE($2, available_days),
            biography = COALESCE($3, biography),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
      [typeof sessionFee === "number" ? sessionFee : null, Array.isArray(availableDays) ? availableDays : null, biography || null, id],
    );
    res.json({ success: true });
  });

  app.post("/api/appointments", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const {
      therapistId,
      studentId,
      studentName,
      date,
      timeSlot,
      paymentMode,
      orderId,
      paymentId,
      paymentScreenshot,
      fee,
    } = req.body || {};

    if (!therapistId || !studentName || !date || !timeSlot) {
      return res.status(400).json({ success: false, error: "Therapist, student, date, and time are required." });
    }

    const pool = getPool();
    const therapistResult = await pool.query("SELECT * FROM therapists WHERE id = $1 LIMIT 1", [therapistId]);
    if (!therapistResult.rowCount) {
      return res.status(404).json({ success: false, error: "Therapist not found." });
    }

    const appointmentId = makeId("appt");
    const therapist = therapistResult.rows[0];
    const normalizedBookerType = currentUser.role === "student" ? "student" : "parent";

    await pool.query(
      `
        INSERT INTO appointments (
          id, therapist_id, therapist_name, booker_id, booker_type, student_id, student_name,
          appointment_date, time_slot, status, video_link, payment_status, session_notes,
          payment_id, order_id, payment_mode, payment_screenshot, parent_uid, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'requested', NULL, 'paid', NULL, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        appointmentId,
        therapistId,
        therapist.name,
        currentUser.uid,
        normalizedBookerType,
        studentId || null,
        studentName,
        date,
        timeSlot,
        paymentId || null,
        orderId || null,
        paymentMode || "GPay • Verification Pending",
        paymentScreenshot || null,
        normalizedBookerType === "parent" ? currentUser.uid : null,
      ],
    );

    if (paymentId || orderId) {
      await pool.query(
        `
          INSERT INTO payments (
            id, payment_id, order_id, user_id, appointment_id, amount, payment_mode, status, transaction_time
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'success', CURRENT_TIMESTAMP)
        `,
        [makeId("pay"), paymentId || makeId("payref"), orderId || makeId("order"), currentUser.uid, appointmentId, Number(fee) || therapist.session_fee || 0, paymentMode || "GPay"],
      );
    }

    await createNotification(
      therapistId,
      "New booking request",
      `${currentUser.name} booked ${studentName} for ${date} at ${timeSlot}.`,
      "appointment",
    );

    const created = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [appointmentId]);
    res.json({ success: true, appointment: mapAppointment(created.rows[0]) });
  });

  app.patch("/api/appointments/:id", ensureSessionUser, async (req, res) => {
    const { id } = req.params;
    const { status, sessionNotes, videoLink } = req.body || {};
    const pool = getPool();
    await pool.query(
      `
        UPDATE appointments
        SET status = COALESCE($1, status),
            session_notes = COALESCE($2, session_notes),
            video_link = COALESCE($3, video_link),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
      [status || null, sessionNotes || null, videoLink || null, id],
    );
    const updated = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, appointment: updated.rowCount ? mapAppointment(updated.rows[0]) : null });
  });

  app.post("/api/appointments/:id/confirm", ensureSessionUser, async (req, res) => {
    const { id } = req.params;
    const pool = getPool();
    const current = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [id]);
    if (!current.rowCount) {
      return res.status(404).json({ success: false, error: "Appointment not found." });
    }
    const appointment = current.rows[0];
    const meetCode = `${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
    const videoLink = appointment.video_link || `https://meet.google.com/${meetCode}`;

    await pool.query(
      `
        UPDATE appointments
        SET status = 'confirmed', video_link = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [videoLink, id],
    );

    await createNotification(
      appointment.booker_id,
      "Appointment confirmed",
      `${appointment.therapist_name} confirmed the session for ${appointment.appointment_date} at ${appointment.time_slot}.`,
      "appointment",
    );

    const updated = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, appointment: mapAppointment(updated.rows[0]) });
  });

  app.post("/api/appointments/:id/meet", ensureSessionUser, async (req, res) => {
    const { id } = req.params;
    const pool = getPool();
    const current = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [id]);
    if (!current.rowCount) {
      return res.status(404).json({ success: false, error: "Appointment not found." });
    }
    const appointment = current.rows[0];
    const meetCode = `${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
    const videoLink = `https://meet.google.com/${meetCode}`;

    await pool.query(
      `
        UPDATE appointments
        SET video_link = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [videoLink, id],
    );

    await pool.query(
      `
        INSERT INTO chats (
          id, appointment_id, sender_id, sender_name, sender_role, receiver_id, receiver_name, text, quick_reply, created_at
        )
        VALUES ($1, $2, $3, 'Google Calendar Bot', 'system', $4, $5, $6, FALSE, CURRENT_TIMESTAMP)
      `,
      [
        makeId("chat"),
        appointment.id,
        appointment.therapist_id,
        appointment.booker_id,
        appointment.student_name,
        `Google Meet link generated: ${videoLink}`,
      ],
    );

    res.json({ success: true, videoLink });
  });

  app.post("/api/appointments/:id/close", ensureSessionUser, async (req, res) => {
    const pool = getPool();
    await pool.query("UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  app.post("/api/journals", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const { title, content, mood } = req.body || {};
    const pool = getPool();
    const id = makeId("journal");
    await pool.query(
      `
        INSERT INTO journals (id, student_id, title, content, mood, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `,
      [id, currentUser.uid, title, content, mood || null],
    );
    const created = await pool.query("SELECT * FROM journals WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, journal: mapJournal(created.rows[0]) });
  });

  app.delete("/api/journals/:id", ensureSessionUser, async (req, res) => {
    const pool = getPool();
    await pool.query("DELETE FROM journals WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/blogs", async (_req, res) => {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
    res.json({ success: true, blogs: result.rowCount ? result.rows.map(mapBlog) : seedBlogs() });
  });

  app.post("/api/blogs", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const { title, content, category, image, featured } = req.body || {};
    const pool = getPool();
    const id = makeId("blog");
    await pool.query(
      `
        INSERT INTO blogs (id, title, content, author_id, author_name, category, image, featured, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `,
      [id, title, content, currentUser.uid, currentUser.name, category, image || null, featured === true],
    );
    const created = await pool.query("SELECT * FROM blogs WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, blog: mapBlog(created.rows[0]) });
  });

  app.patch("/api/notifications/:id/read", ensureSessionUser, async (req, res) => {
    const pool = getPool();
    await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/chats", ensureSessionUser, async (req, res) => {
    const appointmentId = String(req.query.appointmentId || "");
    if (!appointmentId) {
      return res.json({ success: true, messages: [] });
    }
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM chats WHERE appointment_id = $1 ORDER BY created_at ASC",
      [appointmentId],
    );
    res.json({ success: true, messages: result.rows.map(mapChat) });
  });

  app.post("/api/chats", ensureSessionUser, async (req: SessionRequest, res) => {
    const currentUser = req.sessionUser!;
    const { appointmentId, text, quickReply } = req.body || {};
    const pool = getPool();
    const appointmentResult = await pool.query("SELECT * FROM appointments WHERE id = $1 LIMIT 1", [appointmentId]);
    if (!appointmentResult.rowCount) {
      return res.status(404).json({ success: false, error: "Appointment not found." });
    }
    const appointment = appointmentResult.rows[0];
    const receiverId = currentUser.uid === appointment.therapist_id ? appointment.booker_id : appointment.therapist_id;
    const receiverName = currentUser.uid === appointment.therapist_id ? appointment.student_name : appointment.therapist_name;
    const id = makeId("chat");

    await pool.query(
      `
        INSERT INTO chats (
          id, appointment_id, sender_id, sender_name, sender_role, receiver_id, receiver_name, text, quick_reply, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `,
      [id, appointmentId, currentUser.uid, currentUser.name, currentUser.role, receiverId, receiverName, text, quickReply === true],
    );

    await createNotification(receiverId, `Message from ${currentUser.name}`, String(text).slice(0, 120), "message");

    const created = await pool.query("SELECT * FROM chats WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, message: mapChat(created.rows[0]) });
  });

  app.get("/api/transcripts", ensureSessionUser, async (req: SessionRequest, res) => {
    const appointmentId = String(req.query.appointmentId || "");
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT * FROM transcripts
        WHERE creator_id = $1 AND ($2 = '' OR appointment_id = $2)
        ORDER BY created_at DESC
      `,
      [req.sessionUser!.uid, appointmentId],
    );
    res.json({ success: true, transcripts: result.rows.map(mapTranscript) });
  });

  app.post("/api/transcripts", ensureSessionUser, async (req: SessionRequest, res) => {
    const { title, participantNames, messagesCount, transcript, appointmentId } = req.body || {};
    const pool = getPool();
    const id = makeId("transcript");
    await pool.query(
      `
        INSERT INTO transcripts (
          id, title, creator_id, participant_names, messages_count, transcript, appointment_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `,
      [id, title, req.sessionUser!.uid, Array.isArray(participantNames) ? participantNames : [], Number(messagesCount) || 0, transcript, appointmentId || null],
    );
    const created = await pool.query("SELECT * FROM transcripts WHERE id = $1 LIMIT 1", [id]);
    res.json({ success: true, transcript: mapTranscript(created.rows[0]) });
  });

  app.delete("/api/transcripts/:id", ensureSessionUser, async (req, res) => {
    const pool = getPool();
    await pool.query("DELETE FROM transcripts WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "YOVOEDGE", serverTime: new Date().toISOString() });
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
          return `${currentUid}@yovoedge.internal`;
        }
        
        // 1. Check for duplicates in the current memory sync batch
        const registeredUid = syncedEmailsMap.get(email);
        if (registeredUid && registeredUid !== currentUid) {
          const parts = email.split("@");
          const localPart = parts[0];
          const domain = parts[1] || "yovoedge.internal";
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
          const domain = parts[1] || "yovoedge.internal";
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
            s.school || "YovoEdge Sports Academy",
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
            `, [verifiedStudentId, "Student Author", `${verifiedStudentId}@yovoedge.internal`, "student"]);
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
            `, [authorId, b.authorName || b.author_name || "YOVOEDGE Editor", `${authorId}@yovoedge.internal`, "admin"]);
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
        name || "Unnamed YovoEdge User",
        email || `${uid}@yovoedge.internal`,
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
            details.school || "YovoEdge Sports Academy",
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
    console.log(`YOVOEDGE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

