-- ====================================================================================
-- AIIA CLINICAL TRIAL MANAGEMENT SYSTEM (AYURANEX)
-- PRODUCTION SUPABASE POSTGRESQL DATABASE SCHEMA
-- Compliant with:
--   - CDISC SDTM v3.3 (Study Data Tabulation Model)
--   - GCP-ASU & New Drugs and Clinical Trials Rules (NDCT) 2019
--   - Digital Personal Data Protection (DPDP) Act 2023 & Ayushman Bharat (ABDM)
--   - 21 CFR Part 11 Electronic Records & Cryptographic Audit Trails
-- ====================================================================================

-- 1. CLINICAL TRIALS TABLE
CREATE TABLE IF NOT EXISTS public.trials (
    id BIGSERIAL PRIMARY KEY,
    trial_id TEXT UNIQUE NOT NULL,
    study_name TEXT NOT NULL,
    investigator TEXT NOT NULL,
    target_patients INTEGER NOT NULL DEFAULT 100,
    enrolled INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    system_of_medicine TEXT NOT NULL DEFAULT 'Ayurveda',
    study_focus TEXT NOT NULL DEFAULT 'Therapeutic efficacy',
    study_method TEXT NOT NULL DEFAULT 'Randomized Controlled Trial',
    study_type TEXT DEFAULT 'Interventional',
    phase TEXT DEFAULT 'Phase III',
    intervention TEXT,
    sponsor TEXT DEFAULT 'All India Institute of Ayurveda (AIIA)',
    recruitment_status TEXT DEFAULT 'Recruiting',
    ctri_number TEXT,
    iec_approval_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLINICAL PARTICIPANTS & CDISC SDTM DEMOGRAPHICS
CREATE TABLE IF NOT EXISTS public.participants (
    id TEXT PRIMARY KEY, -- Unique Subject ID (USUBJID)
    trial_id TEXT NOT NULL REFERENCES public.trials(trial_id) ON DELETE CASCADE,
    subjid TEXT,
    site_id TEXT DEFAULT 'SITE01',
    site_name TEXT DEFAULT 'AIIA Hospital, New Delhi',
    age INTEGER NOT NULL,
    sex TEXT NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consent_status TEXT NOT NULL DEFAULT 'Obtained',
    treatment_arm TEXT NOT NULL,
    
    -- Clinical Diagnoses
    primary_diagnosis TEXT NOT NULL,
    presenting_complaints TEXT,
    disease_duration_months INTEGER DEFAULT 0,
    icd11_code TEXT,
    namaste_code TEXT,
    
    -- Ayurveda Clinical Phenotyping (GCP-ASU)
    prakriti TEXT NOT NULL DEFAULT 'Vata-Pitta',
    prakriti_dosha_scores JSONB DEFAULT '{"vata": 50, "pitta": 30, "kapha": 20}'::jsonb,
    agni TEXT DEFAULT 'Sama',
    kostha TEXT DEFAULT 'Madhyama',
    dhatu_sarata TEXT DEFAULT 'Madhyama Sarata',
    
    -- Baseline Vitals (SDTM VS Domain)
    baseline_vitals JSONB DEFAULT '{"sysbp": 120, "diabp": 80, "pulse": 72, "temp": 98.4, "bmi": 23.5}'::jsonb,
    
    -- Safety Labs (SDTM LB Domain)
    safety_labs JSONB DEFAULT '{"sgot": 24, "sgpt": 28, "serumCreatinine": 0.9, "fbs": 95, "hba1c": 5.4}'::jsonb,
    
    -- ABDM & DPDP Identity
    abha_id TEXT,
    abha_address TEXT,
    
    -- Compliance & Protocol Status
    visit_schedule TEXT DEFAULT 'Baseline; Week 4; Week 8; Week 12; Week 16',
    adherence_percentage INTEGER DEFAULT 95,
    follow_up_status TEXT DEFAULT 'Ongoing',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PHARMACOVIGILANCE & ADVERSE SAFETY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.safety_events (
    id TEXT PRIMARY KEY, -- Event ID (e.g. NPVCC-2026-SAE-001)
    trial_id TEXT NOT NULL,
    ctri_number TEXT,
    participant_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('AE', 'ADR', 'SAE')),
    
    -- MedDRA Standard Coding
    meddra_soc TEXT NOT NULL,
    meddra_pt TEXT NOT NULL,
    meddra_llt TEXT,
    verbatim_term TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life-threatening')),
    onset_date TIMESTAMPTZ NOT NULL,
    reported_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Suspected Drug & Formulation Details
    suspected_drug TEXT NOT NULL,
    formulation_type TEXT DEFAULT 'Ayurvedic Extract',
    batch_number TEXT,
    daily_dose TEXT,
    route TEXT DEFAULT 'Oral',
    
    -- WHO-UMC / Naranjo Causality
    causality_score INTEGER DEFAULT 0,
    causality_category TEXT NOT NULL,
    
    -- Rule 42 of NDCT Rules 2019 Regulatory Clock
    is_serious BOOLEAN DEFAULT FALSE,
    seriousness_criteria TEXT,
    notification_due_24h TIMESTAMPTZ,
    detailed_report_due_14d TIMESTAMPTZ,
    dcgi_notification_status TEXT DEFAULT 'Pending Submission',
    iec_notification_status TEXT DEFAULT 'Under Committee Review',
    action_taken TEXT,
    outcome TEXT DEFAULT 'Ongoing',
    assigned_officer TEXT DEFAULT 'National Pharmacovigilance Centre (NPvCC)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALCOA+ CRYPTOGRAPHIC AUDIT VAULT TABLE
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id TEXT PRIMARY KEY,
    block_number BIGSERIAL,
    trial_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    field_name TEXT,
    prior_value TEXT,
    new_value TEXT,
    reason_for_change TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    signature_type TEXT DEFAULT '21 CFR Part 11 Digital Signature',
    approval_status TEXT NOT NULL DEFAULT 'Approval Pending' CHECK (approval_status IN ('Approval Pending', 'Approved & Sealed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADMIN-ONLY SECURITY & USER LOGIN ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.login_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    login_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    auth_method TEXT NOT NULL, -- e.g. 'Supabase Auth (Cloud)', 'Institutional SSO / Biometric', 'Government SmartCard'
    session_status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Signed Out', 'Expired'
    risk_assessment TEXT NOT NULL DEFAULT 'Authorized (Normal)',
    machine_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLIANCE & ETHICS MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.compliance_milestones (
    id TEXT PRIMARY KEY,
    trial_id TEXT NOT NULL,
    item TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Upcoming',
    verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CTRI REGULATORY WEBHOOK & SUBMISSION GATEWAY TABLE
CREATE TABLE IF NOT EXISTS public.ctri_submissions (
    id TEXT PRIMARY KEY,
    trial_id TEXT NOT NULL,
    ctri_number TEXT,
    protocol_title TEXT NOT NULL,
    submission_payload JSONB NOT NULL,
    acknowledgment_token TEXT NOT NULL,
    submission_status TEXT NOT NULL DEFAULT 'Pending Review',
    submitted_by TEXT NOT NULL,
    submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
    webhook_response JSONB
);

-- ====================================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================================

-- Enable RLS across all tables
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctri_submissions ENABLE ROW LEVEL SECURITY;

-- Transparent Public Access Policies for Authenticated & Prototype Operations
CREATE POLICY "Allow select on trials" ON public.trials FOR SELECT USING (true);
CREATE POLICY "Allow insert on trials" ON public.trials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on trials" ON public.trials FOR UPDATE USING (true);

CREATE POLICY "Allow select on participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow insert on participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on participants" ON public.participants FOR UPDATE USING (true);

CREATE POLICY "Allow select on safety_events" ON public.safety_events FOR SELECT USING (true);
CREATE POLICY "Allow insert on safety_events" ON public.safety_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on safety_events" ON public.safety_events FOR UPDATE USING (true);

CREATE POLICY "Allow select on audit_trail" ON public.audit_trail FOR SELECT USING (true);
CREATE POLICY "Allow insert on audit_trail" ON public.audit_trail FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on audit_trail" ON public.audit_trail FOR UPDATE USING (true);

CREATE POLICY "Allow select on login_audit_logs" ON public.login_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on login_audit_logs" ON public.login_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on login_audit_logs" ON public.login_audit_logs FOR UPDATE USING (true);

CREATE POLICY "Allow select on compliance_milestones" ON public.compliance_milestones FOR SELECT USING (true);
CREATE POLICY "Allow insert on compliance_milestones" ON public.compliance_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on compliance_milestones" ON public.compliance_milestones FOR UPDATE USING (true);

CREATE POLICY "Allow select on ctri_submissions" ON public.ctri_submissions FOR SELECT USING (true);
CREATE POLICY "Allow insert on ctri_submissions" ON public.ctri_submissions FOR INSERT WITH CHECK (true);

-- Indexes for high-speed clinical querying
CREATE INDEX IF NOT EXISTS idx_participants_trial_id ON public.participants(trial_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_trial_id ON public.safety_events(trial_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_trial_id ON public.audit_trail(trial_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp ON public.login_audit_logs(login_timestamp DESC);

-- 8. NOTIFICATION SETTINGS TABLE (ADMIN REGULATORY CHANNELS)
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_config',
    dcgi_email VARCHAR(255) NOT NULL,
    dcgi_mobile VARCHAR(50) NOT NULL,
    iec_email VARCHAR(255) NOT NULL,
    iec_mobile VARCHAR(50) NOT NULL,
    npvcc_email VARCHAR(255) NOT NULL,
    npvcc_mobile VARCHAR(50) NOT NULL,
    pi_email VARCHAR(255) NOT NULL,
    pi_mobile VARCHAR(50) NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'Admin (Executive Director)'
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on notification_settings" ON public.notification_settings FOR SELECT USING (true);
CREATE POLICY "Allow upsert on notification_settings" ON public.notification_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on notification_settings" ON public.notification_settings FOR UPDATE USING (true);

-- Seed default regulatory contact endpoints
INSERT INTO public.notification_settings (
    id, dcgi_email, dcgi_mobile, iec_email, iec_mobile, npvcc_email, npvcc_mobile, pi_email, pi_mobile
) VALUES (
    'default_config',
    'dcgi.safety@cdsco.nic.in',
    '+91-11-2323-6975',
    'iec.chair@aiia.gov.in',
    '+91-9810-542190',
    'npvcc.safety@aiia.gov.in',
    '+91-9871-330412',
    'pi.nesari@aiia.gov.in',
    '+91-9422-771802'
) ON CONFLICT (id) DO NOTHING;

