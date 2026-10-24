-- Synthetic South African vacancies for local development. Not live postings.
insert into public.jobs (
  source, source_id, original_url, title, company, description, requirements,
  location, province, city, work_mode, posted_at, last_verified_at,
  min_qualification, min_years_experience, skills, is_stale
) values
(
  'synthetic', 'sa-001', 'https://example.com/jobs/sa-001',
  'Graduate Software Developer', 'Harbour Ledger',
  'Build internal web tools for a Cape Town fintech team that is hiring its next graduate cohort.',
  'A bachelor''s degree and comfort with JavaScript. A portfolio or coursework is enough.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'hybrid',
  '2026-10-06', '2026-10-18', 'bachelors', 0,
  array['JavaScript', 'React', 'Git', 'HTML'], false
),
(
  'synthetic', 'sa-002', 'https://example.com/jobs/sa-002',
  'Junior Full-Stack Developer', 'Karoo Cloud',
  'Help ship a small product used by Western Cape schools.',
  'About a year of JavaScript or Node experience, or an equivalent final-year project.',
  'Stellenbosch, Western Cape', 'Western Cape', 'Stellenbosch', 'hybrid',
  '2026-10-08', '2026-10-18', 'bachelors', 1,
  array['JavaScript', 'Node.js', 'SQL', 'Git'], false
),
(
  'synthetic', 'sa-003', 'https://example.com/jobs/sa-003',
  'Software Engineering Intern', 'Table Bay Digital',
  'A six-month internship pairing a graduate with a product team.',
  'Matric and evidence of Python or another programming language.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'on_site',
  '2026-10-01', '2026-10-17', 'matric', 0,
  array['Python', 'Git'], false
),
(
  'synthetic', 'sa-004', 'https://example.com/jobs/sa-004',
  'Junior Data Analyst', 'Highveld Insights',
  'Prepare weekly operating reports for retail clients in Gauteng.',
  'A bachelor''s degree and coursework in SQL or statistics.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'hybrid',
  '2026-10-09', '2026-10-18', 'bachelors', 0,
  array['SQL', 'Excel', 'Python'], false
),
(
  'synthetic', 'sa-005', 'https://example.com/jobs/sa-005',
  'Graduate Data Scientist', 'uMngeni Analytics',
  'Support forecasting work for a Durban logistics client.',
  'An honours degree in a quantitative field.',
  'Durban, KwaZulu-Natal', 'KwaZulu-Natal', 'Durban', 'on_site',
  '2026-09-28', '2026-10-16', 'honours', 0,
  array['Python', 'SQL', 'Statistics'], false
),
(
  'synthetic', 'sa-006', 'https://example.com/jobs/sa-006',
  'Junior Business Analyst', 'Sandton Works',
  'Document requirements for an internal operations system.',
  'A bachelor''s degree and one year in an analyst, internship, or tutoring role.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'on_site',
  '2026-10-04', '2026-10-18', 'bachelors', 1,
  array['Excel', 'SQL', 'Communication'], false
),
(
  'synthetic', 'sa-007', 'https://example.com/jobs/sa-007',
  'Graduate Accountant', 'Ridge and Co',
  'Audit support for a Pretoria practice taking on trainee accountants.',
  'A bachelor''s degree in accounting or a related field.',
  'Pretoria, Gauteng', 'Gauteng', 'Pretoria', 'on_site',
  '2026-10-11', '2026-10-18', 'bachelors', 0,
  array['Accounting', 'Excel'], false
),
(
  'synthetic', 'sa-008', 'https://example.com/jobs/sa-008',
  'Marketing Coordinator', 'Bo-Kaap Studio',
  'Plan social content and simple campaign reports for local brands.',
  'A diploma and some writing or social media coursework.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'hybrid',
  '2026-10-07', '2026-10-17', 'diploma', 1,
  array['Social media', 'Copywriting', 'Canva'], false
),
(
  'synthetic', 'sa-009', 'https://example.com/jobs/sa-009',
  'Junior UX Designer', 'Signal and Co',
  'Design flows for a remote product team serving South African customers.',
  'A diploma or degree and a small portfolio.',
  'Remote — South Africa', null, 'Remote', 'remote',
  '2026-10-12', '2026-10-18', 'diploma', 0,
  array['Figma', 'User research', 'Prototyping'], false
),
(
  'synthetic', 'sa-010', 'https://example.com/jobs/sa-010',
  'Graduate Civil Engineer', 'Drakensberg Projects',
  'Site and design support on municipal infrastructure work.',
  'A bachelor''s degree in civil engineering.',
  'Durban, KwaZulu-Natal', 'KwaZulu-Natal', 'Durban', 'on_site',
  '2026-09-30', '2026-10-15', 'bachelors', 0,
  array['AutoCAD', 'Civil engineering'], false
),
(
  'synthetic', 'sa-011', 'https://example.com/jobs/sa-011',
  'Junior DevOps Engineer', 'Orbit Host',
  'Maintain deployment scripts for a remote South African hosting team.',
  'A bachelor''s degree and exposure to Linux.',
  'Remote — South Africa', null, 'Remote', 'remote',
  '2026-10-10', '2026-10-18', 'bachelors', 1,
  array['Linux', 'Docker', 'Git', 'AWS'], false
),
(
  'synthetic', 'sa-012', 'https://example.com/jobs/sa-012',
  'Customer Support Associate', 'PayCircle',
  'Answer account questions for a payments product by email and chat.',
  'Matric and clear written English.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'hybrid',
  '2026-10-13', '2026-10-18', 'matric', 0,
  array['Communication', 'CRM'], false
),
(
  'synthetic', 'sa-013', 'https://example.com/jobs/sa-013',
  'Junior Cybersecurity Analyst', 'Shieldroom',
  'Triage alerts for a Centurion security operations team.',
  'A bachelor''s degree and a networking or security module.',
  'Centurion, Gauteng', 'Gauteng', 'Centurion', 'on_site',
  '2026-10-03', '2026-10-17', 'bachelors', 1,
  array['Networking', 'Linux', 'Security'], false
),
(
  'synthetic', 'sa-014', 'https://example.com/jobs/sa-014',
  'Graduate Mechanical Engineer', 'Vaal Manufacturing',
  'Support production engineering on a manufacturing site.',
  'A bachelor''s degree in mechanical engineering.',
  'Vanderbijlpark, Gauteng', 'Gauteng', 'Vanderbijlpark', 'on_site',
  '2026-09-26', '2026-10-14', 'bachelors', 0,
  array['CAD', 'Mechanical engineering'], false
),
(
  'synthetic', 'sa-015', 'https://example.com/jobs/sa-015',
  'Content Associate', 'Join the Brief',
  'Write explainers for a remote editorial team.',
  'A diploma and published writing samples, including campus work.',
  'Remote — South Africa', null, 'Remote', 'remote',
  '2026-10-15', '2026-10-18', 'diploma', 0,
  array['Writing', 'SEO', 'Research'], false
),
(
  'synthetic', 'sa-016', 'https://example.com/jobs/sa-016',
  'Junior React Developer', 'Fynbos Apps',
  'Implement interface tickets for a Cape Town product studio.',
  'A bachelor''s degree and React coursework or a personal project.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'hybrid',
  '2026-10-16', '2026-10-18', 'bachelors', 1,
  array['React', 'TypeScript', 'CSS', 'Git'], false
),
(
  'synthetic', 'sa-017', 'https://example.com/jobs/sa-017',
  'Data Engineering Intern', 'Gold Reef Data',
  'A fixed-term internship cleaning and loading client datasets.',
  'A bachelor''s degree with SQL or Python coursework.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'on_site',
  '2026-10-02', '2026-10-16', 'bachelors', 0,
  array['Python', 'SQL'], false
),
(
  'synthetic', 'sa-018', 'https://example.com/jobs/sa-018',
  'HR Graduate', 'PeopleNorth',
  'Coordinate interviews and onboarding paperwork.',
  'A bachelor''s degree in human resources, psychology, or a related field.',
  'Pretoria, Gauteng', 'Gauteng', 'Pretoria', 'on_site',
  '2026-10-05', '2026-10-17', 'bachelors', 0,
  array['Communication', 'HR', 'Excel'], false
),
(
  'synthetic', 'sa-019', 'https://example.com/jobs/sa-019',
  'Junior Accountant', 'Coastal Ledger',
  'Prepare monthly packs for small business clients.',
  'A diploma in accounting and spreadsheet experience.',
  'Gqeberha, Eastern Cape', 'Eastern Cape', 'Gqeberha', 'hybrid',
  '2026-09-29', '2026-10-15', 'diploma', 1,
  array['Accounting', 'Excel', 'Pastel'], false
),
(
  'synthetic', 'sa-020', 'https://example.com/jobs/sa-020',
  'Frontend Intern', 'Aloe Interface',
  'A remote internship turning designs into accessible pages.',
  'A certificate or short course in HTML, CSS, and JavaScript.',
  'Remote — South Africa', null, 'Remote', 'remote',
  '2026-10-14', '2026-10-18', 'certificate', 0,
  array['HTML', 'CSS', 'JavaScript'], false
),
(
  'synthetic', 'sa-021', 'https://example.com/jobs/sa-021',
  'Graduate Environmental Scientist', 'Fynbos Field',
  'Field notes and basic GIS maps for environmental assessments.',
  'A bachelor''s degree in environmental science or geography.',
  'Stellenbosch, Western Cape', 'Western Cape', 'Stellenbosch', 'on_site',
  '2026-10-01', '2026-10-16', 'bachelors', 0,
  array['GIS', 'Environmental science', 'Report writing'], false
),
(
  'synthetic', 'sa-022', 'https://example.com/jobs/sa-022',
  'Junior Product Analyst', 'Neighbourly',
  'Read product funnels and write short findings for the Cape Town team.',
  'A bachelor''s degree and SQL or spreadsheet coursework.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'hybrid',
  '2026-10-17', '2026-10-18', 'bachelors', 1,
  array['SQL', 'Excel', 'Analytics'], false
),
(
  'synthetic', 'sa-023', 'https://example.com/jobs/sa-023',
  'Platform Engineer', 'Rand Compute',
  'Run production infrastructure. This listing is intentionally senior so eligibility checks have a miss.',
  'An honours degree and five years shipping production systems.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'on_site',
  '2026-10-08', '2026-10-18', 'honours', 5,
  array['Kubernetes', 'Go', 'AWS', 'Linux'], false
),
(
  'synthetic', 'sa-024', 'https://example.com/jobs/sa-024',
  'Research Assistant', 'Braamfontein Lab',
  'Support a research group with data collection and literature notes.',
  'A master''s degree.',
  'Johannesburg, Gauteng', 'Gauteng', 'Johannesburg', 'on_site',
  '2026-10-09', '2026-10-18', 'masters', 0,
  array['Research', 'Statistics', 'Python'], false
),
(
  'synthetic', 'sa-025', 'https://example.com/jobs/sa-025',
  'Junior Java Developer', 'Bayview Systems',
  'An older synthetic listing kept so the dashboard can flag roles that may no longer be open.',
  'A bachelor''s degree and Java coursework.',
  'Cape Town, Western Cape', 'Western Cape', 'Cape Town', 'on_site',
  '2025-11-12', '2025-12-01', 'bachelors', 1,
  array['Java', 'SQL', 'Git'], true
)
on conflict (source, source_id) do nothing;
