-- MINDEDGE PostgreSQL Database DDL Schema
-- Designed for Railway PostgreSQL, standardizing on snake_case (Postgres standard) 
-- and fully compatible with the application's types.

-- Enable UUID helper extension (handy if generating unique keys on db-side)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Tab: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'student', 'therapist', 'school_admin', 'admin')),
    relationship VARCHAR(100), -- 'mother' | 'father' | 'guardian' (for parents)
    city VARCHAR(100),
    photo_url TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    profile_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Tab: students
-- ==========================================
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(128) PRIMARY KEY,
    parent_id VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    student_id VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age >= 0),
    gender VARCHAR(50),
    school_catalog_id VARCHAR(128),
    school VARCHAR(255),
    sport VARCHAR(100) NOT NULL,
    competition_level VARCHAR(100) NOT NULL, -- 'school', 'state', 'national', 'elite'
    training_frequency VARCHAR(100), -- hours/week or days/week
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 10),
    goals TEXT,
    current_challenges TEXT[], -- text array: e.g. ARRAY['Anxiety', 'Concentration']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Tab: therapists
-- ==========================================
CREATE TABLE IF NOT EXISTS therapists (
    id VARCHAR(128) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(50),
    photo_url TEXT,
    qualification TEXT NOT NULL,
    experience INTEGER NOT NULL CHECK (experience >= 0),
    specialization TEXT NOT NULL,
    languages TEXT, -- comma separated or array
    sports_expertise TEXT, -- comma separated or array
    certifications_url TEXT,
    degree_documents_url TEXT,
    identity_proof_url TEXT,
    display_consent BOOLEAN DEFAULT FALSE,
    service_agreement BOOLEAN DEFAULT FALSE,
    data_usage_agreement BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    session_fee INTEGER NOT NULL DEFAULT 0,
    available_days TEXT[], -- e.g. ARRAY['Mon', 'Wed', 'Fri']
    available_time_slots TEXT[], -- e.g. ARRAY['10:00 AM', '02:00 PM']
    session_duration INTEGER DEFAULT 60, -- minutes
    biography TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. Tab: schools
-- ==========================================
CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(128) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    catalog_school_id VARCHAR(128),
    school_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    city VARCHAR(100),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    number_of_students INTEGER CHECK (number_of_students >= 0),
    sports_programs TEXT,
    existing_counselor_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. Tab: appointments
-- ==========================================
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(128) PRIMARY KEY,
    therapist_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    therapist_name VARCHAR(255) NOT NULL,
    booker_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    booker_type VARCHAR(50) NOT NULL CHECK (booker_type IN ('parent', 'student')),
    student_id VARCHAR(128) REFERENCES students(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    video_link TEXT,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    session_notes TEXT,
    payment_id VARCHAR(128),
    order_id VARCHAR(128),
    payment_mode VARCHAR(50),
    payment_screenshot TEXT,
    parent_uid VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4A. Tab: school_catalog
-- ==========================================
CREATE TABLE IF NOT EXISTS school_catalog (
    id VARCHAR(128) PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    city VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by_uid VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    approved_by_uid VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. Tab: payments
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(128) PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    appointment_id VARCHAR(128) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    payment_mode VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed')),
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receipt_url TEXT
);

-- ==========================================
-- 7. Tab: blogs
-- ==========================================
CREATE TABLE IF NOT EXISTS blogs (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('competition_anxiety', 'focus_concentration', 'parent_guidance', 'mental_fitness', 'athlete_development')),
    image TEXT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. Tab: journals
-- ==========================================
CREATE TABLE IF NOT EXISTS journals (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. Tab: notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. Tab: chats
-- ==========================================
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(128) PRIMARY KEY,
    appointment_id VARCHAR(128) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
    receiver_name VARCHAR(255),
    text TEXT NOT NULL,
    quick_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 11. Tab: transcripts
-- ==========================================
CREATE TABLE IF NOT EXISTS transcripts (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id VARCHAR(128) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    participant_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    messages_count INTEGER DEFAULT 0,
    transcript TEXT NOT NULL,
    appointment_id VARCHAR(128) REFERENCES appointments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 12. INDEXES (Optimized for Querying)
-- ==========================================

-- Index base role permissions lookup
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Now parent_id and student_id exist explicitly inside the students table, making these CREATE INDEX statements run flawlessly!
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_student ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_sport ON students(sport);
CREATE INDEX IF NOT EXISTS idx_students_school_catalog ON students(school_catalog_id);

-- Index therapist approval filters
CREATE INDEX IF NOT EXISTS idx_therapists_is_approved ON therapists(is_approved);

-- Appointment listings index
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_booker ON appointments(booker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Payment index Lookups
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- Blog categorization searches
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);

-- Journal records indexing
CREATE INDEX IF NOT EXISTS idx_journals_student ON journals(student_id);

-- Notification event index
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Chat and transcript indexes
CREATE INDEX IF NOT EXISTS idx_chats_appointment ON chats(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_appointment ON transcripts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_creator ON transcripts(creator_id);
CREATE INDEX IF NOT EXISTS idx_school_catalog_status ON school_catalog(status);
CREATE INDEX IF NOT EXISTS idx_school_catalog_city ON school_catalog(city);
