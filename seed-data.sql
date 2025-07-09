-- ==========================================
-- SEED DATA FOR ANGKOR COMPLIANCE
-- ==========================================
-- Version: 1.0
-- Created: January 2024
-- Purpose: Initial test data for development and testing

-- ==========================================
-- ORGANIZATIONS
-- ==========================================

INSERT INTO organizations (id, name, name_khmer, registration_number, address, address_khmer, phone, email, website, industry, employee_count, established_date) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Golden Needle Garments Ltd.',
    'ក្រុមហ៊ុន មាស ម្ជុល សម្លៀកបំពាក់ ខ.ក.',
    'KH-REG-2018-001',
    '123 Industrial Street, Phnom Penh Special Economic Zone, Phnom Penh',
    '១២៣ ផ្លូវ អាគារឧស្សាហកម្ម តំបន់ សេដ្ឋកិច្ច ពិសេស ភ្នំពេញ',
    '+855 23 123 456',
    'info@goldenneedle.com.kh',
    'https://goldenneedle.com.kh',
    'Textile & Garment',
    850,
    '2018-03-15'
),
(
    '00000000-0000-0000-0000-000000000002',
    'Angkor Electronics Manufacturing Co.',
    'ក្រុមហ៊ុន ផលិត សំភារៈ អេឡិចត្រូនិក អង្គរ',
    'KH-REG-2020-045',
    '456 Tech Boulevard, Sihanoukville Industrial Park, Sihanoukville',
    '៤៥៦ មហាវិថី បច្ចេកវិទ្យា ឧទ្យាន ឧស្សាហកម្ម ព្រះសីហនុ',
    '+855 34 567 890',
    'contact@angkorelectronics.com',
    'https://angkorelectronics.com',
    'Electronics Manufacturing',
    1200,
    '2020-07-22'
);

-- ==========================================
-- USERS
-- ==========================================

-- Golden Needle Garments users
INSERT INTO users (id, organization_id, email, full_name, full_name_khmer, role, department, position, phone, employee_id) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'admin@goldenneedle.com.kh',
    'Sophea Chan',
    'ចាន់ សុភា',
    'admin',
    'Management',
    'General Manager',
    '+855 12 345 678',
    'GN-001'
),
(
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'hr@goldenneedle.com.kh',
    'Dara Kem',
    'កែម ដារ៉ា',
    'manager',
    'Human Resources',
    'HR Manager',
    '+855 12 345 679',
    'GN-002'
),
(
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'safety@goldenneedle.com.kh',
    'Pisach Lim',
    'លឹម ពិសាច',
    'supervisor',
    'Safety',
    'Safety Supervisor',
    '+855 12 345 680',
    'GN-003'
),
(
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    'worker1@goldenneedle.com.kh',
    'Sreyleak Noun',
    'នូន ស្រីលីក',
    'worker',
    'Production',
    'Sewing Machine Operator',
    '+855 12 345 681',
    'GN-101'
),
(
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000001',
    'committee@goldenneedle.com.kh',
    'Vibol Sok',
    'សុក វីបុល',
    'committee_member',
    'Administration',
    'Committee Secretary',
    '+855 12 345 682',
    'GN-004'
);

-- Angkor Electronics users
INSERT INTO users (id, organization_id, email, full_name, full_name_khmer, role, department, position, phone, employee_id) VALUES
(
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    'admin@angkorelectronics.com',
    'Makara Pich',
    'ពិជ មករា',
    'admin',
    'Management',
    'Plant Manager',
    '+855 34 567 891',
    'AE-001'
),
(
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000002',
    'auditor@angkorelectronics.com',
    'Chenda Ouk',
    'អ៊ូក ចេនដា',
    'auditor',
    'Quality Control',
    'Internal Auditor',
    '+855 34 567 892',
    'AE-002'
);

-- ==========================================
-- PERMITS
-- ==========================================

-- Golden Needle Garments permits
INSERT INTO permits (id, organization_id, permit_type, permit_number, title, title_khmer, issuing_authority, issue_date, expiry_date, status, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000001',
    'environmental',
    'ENV-2024-001',
    'Environmental Compliance Certificate',
    'វិញ្ញាបនបត្រ អនុប្បយោគ បរិស្ថាន',
    'Ministry of Environment',
    '2024-01-15',
    '2025-01-14',
    'active',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000001',
    'fire_safety',
    'FIRE-2023-089',
    'Fire Safety Certificate',
    'វិញ្ញាបនបត្រ សុវត្ថិភាព អគ្គិភ័យ',
    'Ministry of Interior - Fire Department',
    '2023-06-20',
    '2024-06-19',
    'pending_renewal',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000001',
    'labor',
    'LAB-2023-156',
    'Labor License',
    'អាជ្ញាប័ណ្ណ ការងារ',
    'Ministry of Labor and Vocational Training',
    '2023-12-01',
    '2024-11-30',
    'active',
    '00000000-0000-0000-0000-000000000101'
);

-- Angkor Electronics permits
INSERT INTO permits (id, organization_id, permit_type, permit_number, title, title_khmer, issuing_authority, issue_date, expiry_date, status, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000002',
    'environmental',
    'ENV-2024-002',
    'Environmental Impact Assessment',
    'ការវាយតម្លៃ ផលប៉ះពាល់ បរិស្ថាន',
    'Ministry of Environment',
    '2024-02-01',
    '2025-01-31',
    'active',
    '00000000-0000-0000-0000-000000000201'
),
(
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000002',
    'export_permit',
    'EXP-2024-123',
    'Export License',
    'អាជ្ញាប័ណ្ណ នាំចេញ',
    'Ministry of Commerce',
    '2024-01-10',
    '2024-12-31',
    'active',
    '00000000-0000-0000-0000-000000000201'
);

-- ==========================================
-- AUDITS
-- ==========================================

-- Golden Needle Garments audit
INSERT INTO audits (id, organization_id, audit_type, auditor_name, auditor_organization, audit_date, audit_scope, overall_score, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000001',
    'Social Compliance',
    'John Smith',
    'Better Work Cambodia',
    '2024-01-10',
    'Full factory audit covering labor standards, health & safety, and environmental compliance',
    82.5,
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000002',
    'Environmental Audit',
    'Maria Garcia',
    'SGS Cambodia',
    '2024-01-25',
    'Environmental management system audit',
    78.0,
    '00000000-0000-0000-0000-000000000201'
);

-- ==========================================
-- AUDIT FINDINGS
-- ==========================================

-- Golden Needle Garments audit findings
INSERT INTO audit_findings (id, audit_id, category, subcategory, finding_text, finding_text_khmer, severity, compliance_standard, requirement_reference, location) VALUES
(
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000501',
    'Health & Safety',
    'Emergency Exits',
    'Emergency exit on second floor is partially blocked by fabric storage',
    'ច្រកចេញ អាសន្ន នៅ ជាន់ទី២ ត្រូវបាន រារាំង ដោយ ការរក្សាទុក កម្រាល',
    'medium',
    'ILO OSH Convention',
    'Section 4.2.1',
    'Second Floor, Production Area'
),
(
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000501',
    'Working Hours',
    'Overtime',
    'Some workers exceeded 60 hours per week during peak season',
    'កម្មករ មួយចំនួន ធ្វើការលើស ៦០ ម៉ោង ក្នុងសប្តាហ៍ ក្នុងអំឡុងពេល ខ្ពស់បំផុត',
    'high',
    'Labor Law of Cambodia',
    'Article 137',
    'Production Floor'
),
(
    '00000000-0000-0000-0000-000000000603',
    '00000000-0000-0000-0000-000000000501',
    'Environmental',
    'Waste Management',
    'Fabric waste sorting could be improved to increase recycling efficiency',
    'ការផ្តាច់ សំណល់ កម្រាល អាច ត្រូវបាន ធ្វើឱ្យប្រសើរ ដើម្បី បង្កើន ប្រសិទ្ធភាព កែច្នៃ',
    'low',
    'ISO 14001',
    'Section 8.1',
    'Waste Storage Area'
);

-- Angkor Electronics audit findings
INSERT INTO audit_findings (id, audit_id, category, subcategory, finding_text, finding_text_khmer, severity, compliance_standard, requirement_reference, location) VALUES
(
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000502',
    'Environmental',
    'Chemical Storage',
    'Chemical storage area lacks proper ventilation system',
    'តំបន់ រក្សាទុក សារធាតុគីមី ខ្វះ ប្រព័ន្ធ ខ្យល់ចូល សមរម្យ',
    'high',
    'ISO 14001',
    'Section 8.2',
    'Chemical Storage Room'
),
(
    '00000000-0000-0000-0000-000000000702',
    '00000000-0000-0000-0000-000000000502',
    'Waste Management',
    'Electronic Waste',
    'Electronic waste disposal procedures need documentation',
    'នីតិវិធី បោះចោល សំណល់ អេឡិចត្រូនិក ត្រូវការ ឯកសារ',
    'medium',
    'Basel Convention',
    'Article 6',
    'E-waste Storage'
);

-- ==========================================
-- CAPS (Corrective Action Plans)
-- ==========================================

-- Golden Needle Garments CAPs
INSERT INTO caps (id, organization_id, audit_finding_id, title, title_khmer, description, description_khmer, root_cause, root_cause_khmer, status, priority, assigned_to, reviewer_id, due_date, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000601',
    'Clear Emergency Exit Blockage',
    'ដោះស្រាយ ការរារាំង ច្រកចេញ អាសន្ន',
    'Remove fabric storage from emergency exit area and implement proper storage procedures',
    'ដកចេញ ការរក្សាទុក កម្រាល ពី តំបន់ ច្រកចេញ អាសន្ន និង អនុវត្ត នីតិវិធី រក្សាទុក សមរម្យ',
    'Inadequate storage space planning and lack of clear storage procedures',
    'ការរៀបចំ ទំហំ រក្សាទុក មិនគ្រប់គ្រាន់ និង ខ្វះ នីតិវិធី រក្សាទុក ច្បាស់លាស់',
    'in_progress',
    'medium',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000101',
    '2024-02-15',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000802',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000602',
    'Implement Overtime Control System',
    'អនុវត្ត ប្រព័ន្ធ ត្រួតពិនិត្យ ម៉ោង បន្ថែម',
    'Establish working hours monitoring system and train supervisors on overtime limits',
    'បង្កើត ប្រព័ន្ធ តាមដាន ម៉ោង ធ្វើការ និង បណ្តុះបណ្តាល អ្នកត្រួតពិនិត្យ លើ ដែនកំណត់ ម៉ោង បន្ថែម',
    'Lack of systematic overtime tracking and supervisor training',
    'ខ្វះ ការតាមដាន ម៉ោង បន្ថែម ប្រព័ន្ធ និង ការបណ្តុះបណ្តាល អ្នកត្រួតពិនិត្យ',
    'open',
    'high',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000101',
    '2024-03-01',
    '00000000-0000-0000-0000-000000000101'
);

-- Angkor Electronics CAPs
INSERT INTO caps (id, organization_id, audit_finding_id, title, title_khmer, description, description_khmer, root_cause, root_cause_khmer, status, priority, assigned_to, reviewer_id, due_date, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000701',
    'Install Ventilation System',
    'ដំឡើង ប្រព័ន្ធ ខ្យល់ចូល',
    'Install proper ventilation system in chemical storage area and conduct air quality testing',
    'ដំឡើង ប្រព័ន្ធ ខ្យល់ចូល សមរម្យ នៅ តំបន់ រក្សាទុក សារធាតុគីមី និង ធ្វើតេស្ត គុណភាព ខ្យល់',
    'Original facility design did not account for chemical storage requirements',
    'ការរចនា គ្រឹះ ដើម មិនបាន គិតគូរ ពី តម្រូវការ រក្សាទុក សារធាតុគីមី',
    'open',
    'high',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    '2024-04-15',
    '00000000-0000-0000-0000-000000000201'
);

-- ==========================================
-- GRIEVANCES
-- ==========================================

-- Sample grievances
INSERT INTO grievances (id, organization_id, grievance_number, grievance_type, title, title_khmer, description, description_khmer, status, priority, is_anonymous, submitted_by, submitted_via, assigned_committee, due_date) VALUES
(
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000000001',
    'GRV-2024-001',
    'workplace_safety',
    'Unsafe working conditions in cutting section',
    'លក្ខខណ្ឌ ការងារ មិនមានសុវត្ថិភាព នៅ ផ្នែក កាត់',
    'The cutting machines in section A do not have proper safety guards, creating risk of injury',
    'ម៉ាស៊ីន កាត់ នៅ ផ្នែក A មិនមាន រុំព័ទ្ធ សុវត្ថិភាព សមរម្យ បង្កើត ហានិភ័យ របួស',
    'under_review',
    'high',
    false,
    '00000000-0000-0000-0000-000000000104',
    'web',
    'osh',
    '2024-02-05'
),
(
    '00000000-0000-0000-0000-000000001002',
    '00000000-0000-0000-0000-000000000001',
    'GRV-2024-002',
    'working_conditions',
    'Excessive heat in production area',
    'កំដៅ លើសកម្រិត នៅ តំបន់ ផលិតកម្ម',
    'The production floor gets extremely hot during afternoon shifts, affecting worker comfort and productivity',
    'ជាន់ ផលិតកម្ម ក្តៅ ខ្លាំងណាស់ ក្នុងអំឡុងពេល វេន រសៀល ប៉ះពាល់ ដល់ ការសុខស្រួល កម្មករ និង ផលិតភាព',
    'submitted',
    'medium',
    true,
    null,
    'qr_code',
    'osh',
    '2024-02-10'
);

-- ==========================================
-- COMMITTEES
-- ==========================================

-- Golden Needle Garments committees
INSERT INTO committees (id, organization_id, committee_type, name, name_khmer, description, description_khmer, meeting_frequency) VALUES
(
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000000001',
    'picc',
    'Participation and Consultation Committee',
    'គណៈកម្មការ ការចូលរួម និង ការពិគ្រោះយោបល់',
    'Committee for worker participation and consultation on workplace matters',
    'គណៈកម្មការ សម្រាប់ ការចូលរួម កម្មករ និង ការពិគ្រោះយោបល់ លើ បញ្ហា កន្លែងធ្វើការ',
    'monthly'
),
(
    '00000000-0000-0000-0000-000000001102',
    '00000000-0000-0000-0000-000000000001',
    'osh',
    'Occupational Safety and Health Committee',
    'គណៈកម្មការ សុវត្ថិភាព និង សុខភាព វិជ្ជាជីវៈ',
    'Committee responsible for workplace safety and health matters',
    'គណៈកម្មការ ទទួលខុសត្រូវ លើ បញ្ហា សុវត្ថិភាព និង សុខភាព កន្លែងធ្វើការ',
    'monthly'
),
(
    '00000000-0000-0000-0000-000000001103',
    '00000000-0000-0000-0000-000000000001',
    'grievance_handling',
    'Grievance Handling Committee',
    'គណៈកម្មការ ដោះស្រាយ បណ្តឹងតវ៉ា',
    'Committee for handling worker grievances and disputes',
    'គណៈកម្មការ សម្រាប់ ដោះស្រាយ បណ្តឹងតវ៉ា និង ជម្លោះ កម្មករ',
    'weekly'
);

-- ==========================================
-- COMMITTEE MEMBERS
-- ==========================================

-- Committee member assignments
INSERT INTO committee_members (committee_id, user_id, role) VALUES
-- PICC Committee
('00000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000000102', 'chair'),
('00000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000000105', 'secretary'),
('00000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000000104', 'member'),

-- OSH Committee
('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000103', 'chair'),
('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000105', 'secretary'),
('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000104', 'member'),

-- Grievance Committee
('00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000000102', 'chair'),
('00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000000105', 'secretary');

-- ==========================================
-- TRAINING MODULES
-- ==========================================

-- Training modules for Golden Needle Garments
INSERT INTO training_modules (id, organization_id, title, title_khmer, description, description_khmer, training_type, duration_hours, is_mandatory, refresh_frequency_months, created_by) VALUES
(
    '00000000-0000-0000-0000-000000001201',
    '00000000-0000-0000-0000-000000000001',
    'Fire Safety Training',
    'ការបណ្តុះបណ្តាល សុវត្ថិភាព អគ្គិភ័យ',
    'Comprehensive fire safety training covering prevention, evacuation procedures, and emergency response',
    'ការបណ្តុះបណ្តាល សុវត្ថិភាព អគ្គិភ័យ ពេញលេញ ក្នុងការ ការពារ នីតិវិធី ជម្លៀស និង ការឆ្លើយតប អាសន្ន',
    'fire_safety',
    2.0,
    true,
    12,
    '00000000-0000-0000-0000-000000000103'
),
(
    '00000000-0000-0000-0000-000000001202',
    '00000000-0000-0000-0000-000000000001',
    'Occupational Health and Safety',
    'សុខភាព និង សុវត្ថិភាព វិជ្ជាជីវៈ',
    'Basic OSH training for all workers covering hazard identification and safe work practices',
    'ការបណ្តុះបណ្តាល OSH មូលដ្ឋាន សម្រាប់ កម្មករ ទាំងអស់ គ្របដណ្តប់ លើ ការកំណត់ គ្រោះថ្នាក់ និង ការអនុវត្ត ការងារ មានសុវត្ថិភាព',
    'osh',
    4.0,
    true,
    6,
    '00000000-0000-0000-0000-000000000103'
),
(
    '00000000-0000-0000-0000-000000001203',
    '00000000-0000-0000-0000-000000000001',
    'Environmental Awareness',
    'ការយល់ដឹង បរិស្ថាន',
    'Environmental awareness training focusing on waste reduction and energy conservation',
    'ការបណ្តុះបណ្តាល ការយល់ដឹង បរិស្ថាន ផ្តោតលើ ការកាត់បន្ថយ សំណល់ និង ការសន្សំ ថាមពល',
    'environmental',
    1.5,
    false,
    12,
    '00000000-0000-0000-0000-000000000103'
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

-- Sample notifications
INSERT INTO notifications (organization_id, user_id, title, title_khmer, message, message_khmer, type, priority, is_read, sent_via) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'Permit Expiry Alert',
    'ការជូនដំណឹង ផុតកំណត់ អាជ្ញាប័ណ្ណ',
    'Fire Safety Certificate (FIRE-2023-089) will expire on June 19, 2024. Please start renewal process.',
    'វិញ្ញាបនបត្រ សុវត្ថិភាព អគ្គិភ័យ (FIRE-2023-089) នឹង ផុតកំណត់ នៅ ថ្ងៃទី ១៩ ខែមិថុនា ២០២៤។ សូម ចាប់ផ្តើម ដំណើរការ ពន្យាពេល។',
    'permit_expiry',
    'high',
    false,
    ARRAY['email', 'app']
),
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000103',
    'New Grievance Assigned',
    'បណ្តឹងតវ៉ា ថ្មី ត្រូវបាន បន្ទុក',
    'Grievance GRV-2024-001 regarding workplace safety has been assigned to you for review.',
    'បណ្តឹងតវ៉ា GRV-2024-001 ទាក់ទង នឹង សុវត្ថិភាព កន្លែងធ្វើការ ត្រូវបាន បន្ទុក ឱ្យ អ្នក សម្រាប់ ពិនិត្យ។',
    'grievance_assigned',
    'medium',
    false,
    ARRAY['email', 'app']
);

-- ==========================================
-- SYSTEM SETTINGS
-- ==========================================

-- Organization-specific settings
INSERT INTO system_settings (organization_id, setting_key, setting_value, description, created_by) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'company_timezone',
    'Asia/Phnom_Penh',
    'Factory timezone setting',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000001',
    'working_hours_per_week',
    '48',
    'Standard working hours per week',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000001',
    'overtime_limit_per_week',
    '12',
    'Maximum overtime hours per week',
    '00000000-0000-0000-0000-000000000101'
),
(
    '00000000-0000-0000-0000-000000000002',
    'company_timezone',
    'Asia/Phnom_Penh',
    'Factory timezone setting',
    '00000000-0000-0000-0000-000000000201'
),
(
    '00000000-0000-0000-0000-000000000002',
    'working_hours_per_week',
    '48',
    'Standard working hours per week',
    '00000000-0000-0000-0000-000000000201'
);

-- ==========================================
-- FINAL NOTES
-- ==========================================

-- This seed data provides:
-- - 2 sample organizations (Golden Needle Garments and Angkor Electronics)
-- - 7 users across different roles (admin, manager, supervisor, worker, committee member, auditor)
-- - 5 permits with different statuses (active, pending renewal)
-- - 2 audits with associated findings
-- - 3 CAPs in different statuses (open, in progress)
-- - 2 grievances with different submission methods
-- - 3 committees with member assignments
-- - 3 training modules
-- - Sample notifications
-- - Organization-specific system settings

-- You can expand this data as needed for testing different scenarios and features. 