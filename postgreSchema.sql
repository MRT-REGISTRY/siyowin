DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'super-admin');
CREATE TYPE exam_type_enum AS ENUM ('term-test', 'day-paper', 'month-test', 'quiz', 'practical', 'homework');
CREATE TYPE report_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE report_channel AS ENUM ('whatsapp', 'email', 'both');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE teacher_assignment_role AS ENUM ('primary', 'assistant');
CREATE TYPE subject_module_item_type AS ENUM ('mark', 'link', 'text', 'document', 'video');

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    student_id TEXT,
    teacher_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    grade VARCHAR(50),
    assigned_subjects JSONB DEFAULT '[]'::jsonb,
    phone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grades (
    id TEXT PRIMARY KEY,
    grade_name VARCHAR(50) UNIQUE NOT NULL,
    display_order INTEGER
);

CREATE TABLE classes (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    grade VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    name VARCHAR(30) NOT NULL,
    label VARCHAR(100) NOT NULL,
    medium VARCHAR(50) NOT NULL,
    academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    schedule VARCHAR(100),
    fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id TEXT PRIMARY KEY,
    index_number VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    address TEXT,
    school VARCHAR(150),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    status enrollment_status DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, class_id)
);

CREATE OR REPLACE FUNCTION create_student_with_user(
    p_student_id TEXT,
    p_student_name VARCHAR,
    p_index_number VARCHAR,
    p_date_of_birth DATE,
    p_class_id TEXT,
    p_parent_name VARCHAR,
    p_parent_phone VARCHAR,
    p_student_password_hash VARCHAR,
    p_user_id TEXT,
    p_username VARCHAR,
    p_email VARCHAR,
    p_user_password_hash VARCHAR,
    p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(created_student_id TEXT, created_user_id TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_academic_year INTEGER;
BEGIN
    INSERT INTO students (
        id,
        index_number,
        name,
        password_hash,
        class_id,
        parent_name,
        parent_phone,
        date_of_birth,
        is_active
    )
    VALUES (
        p_student_id,
        p_index_number,
        p_student_name,
        p_student_password_hash,
        p_class_id,
        p_parent_name,
        p_parent_phone,
        p_date_of_birth,
        COALESCE(p_is_active, TRUE)
    );

    INSERT INTO users (
        id,
        name,
        username,
        email,
        password_hash,
        role,
        student_id,
        is_active
    )
    VALUES (
        p_user_id,
        p_student_name,
        LOWER(TRIM(p_username)),
        LOWER(TRIM(p_email)),
        p_user_password_hash,
        'student',
        p_student_id,
        COALESCE(p_is_active, TRUE)
    );

    SELECT academic_year
    INTO v_academic_year
    FROM classes
    WHERE id = p_class_id;

    INSERT INTO student_enrollments (
        id,
        student_id,
        class_id,
        academic_year,
        status,
        enrolled_at
    )
    VALUES (
        CONCAT('enr-', p_student_id, '-', p_class_id),
        p_student_id,
        p_class_id,
        COALESCE(v_academic_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
        'active',
        NOW()
    )
    ON CONFLICT (student_id, class_id) DO UPDATE
    SET
        academic_year = EXCLUDED.academic_year,
        status = EXCLUDED.status,
        enrolled_at = EXCLUDED.enrolled_at;

    RETURN QUERY SELECT p_student_id AS created_student_id, p_user_id AS created_user_id;
END;
$$;

CREATE TABLE teacher_class_assignments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    role teacher_assignment_role DEFAULT 'primary',
    active_from DATE,
    active_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (teacher_id, class_id)
);

CREATE TABLE parents (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(100),
    whatsapp_number VARCHAR(20),
    email VARCHAR(150)
);

CREATE TABLE exams (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    exam_type exam_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    exam_date DATE NOT NULL,
    total_marks DECIMAL(6,2),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE results (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(6,2),
    is_absent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, student_id)
);

CREATE TABLE homework_records (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    is_done BOOLEAN DEFAULT FALSE,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, student_id)
);

CREATE TABLE monthly_reports (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    report_month INTEGER CHECK (report_month BETWEEN 1 AND 12),
    report_year INTEGER NOT NULL,
    report_data JSONB,
    sent_via report_channel,
    sent_at TIMESTAMP,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subject_modules (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subject_module_items (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES subject_modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    item_type subject_module_item_type NOT NULL DEFAULT 'text',
    href TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_class ON student_enrollments(class_id);
CREATE INDEX idx_teacher_class_assignments_teacher ON teacher_class_assignments(teacher_id);
CREATE INDEX idx_teacher_class_assignments_class ON teacher_class_assignments(class_id);
CREATE INDEX idx_results_exam ON results(exam_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_subject_modules_class ON subject_modules(class_id);
CREATE INDEX idx_subject_modules_order ON subject_modules(class_id, sort_order);
CREATE INDEX idx_subject_module_items_module ON subject_module_items(module_id);
CREATE INDEX idx_subject_module_items_order ON subject_module_items(module_id, sort_order);

ALTER TABLE users
    ADD CONSTRAINT users_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

ALTER TABLE users
    ADD CONSTRAINT users_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_results_updated
BEFORE UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_homework_updated
BEFORE UPDATE ON homework_records
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
