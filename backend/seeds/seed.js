// seeds/seed.js — Seed the Supabase database with sample data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('🌱 Starting database seed...\n');

  console.log('🧹 Cleaning up existing database tables...');
  await supabase.from('moderation_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('seller_earnings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('wishlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('colleges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Cleanup finished.\n');

  // ─── Colleges ──────────────────────────────────────────────────────────────
  const colleges = [
    { id: uuidv4(), name: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra', student_count: 10000 },
    { id: uuidv4(), name: 'IIT Delhi', city: 'New Delhi', state: 'Delhi', student_count: 9500 },
    { id: uuidv4(), name: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan', student_count: 8000 },
    { id: uuidv4(), name: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', student_count: 6000 },
    { id: uuidv4(), name: 'VIT Vellore', city: 'Vellore', state: 'Tamil Nadu', student_count: 20000 }
  ];

  const { error: collegeErr } = await supabase.from('colleges').upsert(colleges, { onConflict: 'name' });
  if (collegeErr) console.error('Colleges error:', collegeErr.message);
  else console.log(`✅ Seeded ${colleges.length} colleges`);

  // ─── Departments ───────────────────────────────────────────────────────────
  const iitBombay = colleges[0];
  const departments = [
    { id: uuidv4(), name: 'Computer Science & Engineering', college_id: iitBombay.id, code: 'CSE' },
    { id: uuidv4(), name: 'Electrical Engineering', college_id: iitBombay.id, code: 'EE' },
    { id: uuidv4(), name: 'Mechanical Engineering', college_id: iitBombay.id, code: 'ME' },
    { id: uuidv4(), name: 'Mathematics', college_id: iitBombay.id, code: 'MATH' },
    { id: uuidv4(), name: 'Physics', college_id: iitBombay.id, code: 'PHY' },
    { id: uuidv4(), name: 'Chemical Engineering', college_id: iitBombay.id, code: 'CHE' },
    { id: uuidv4(), name: 'Civil Engineering', college_id: iitBombay.id, code: 'CE' },
    { id: uuidv4(), name: 'Aerospace Engineering', college_id: iitBombay.id, code: 'AE' }
  ];

  const { error: deptErr } = await supabase.from('departments').upsert(departments, { onConflict: 'college_id,code' });
  if (deptErr) console.error('Departments error:', deptErr.message);
  else console.log(`✅ Seeded ${departments.length} departments`);

  // ─── Users ─────────────────────────────────────────────────────────────────
  const password_hash = await bcrypt.hash('Password@123', 12);
  const cseDept = departments[0];
  const eeDept = departments[1];
  const meDept = departments[2];
  const mathDept = departments[3];
  const phyDept = departments[4];
  const cheDept = departments[5];
  const ceDept = departments[6];
  const aeDept = departments[7];

  const users = [
    {
      id: uuidv4(), email: 'admin@notesmarket.com', password_hash,
      first_name: 'Admin', last_name: 'User', role: 'admin',
      status: 'active', email_verified: true, college_id: iitBombay.id
    },
    {
      id: uuidv4(), email: 'priya@student.iitb.ac.in', password_hash,
      first_name: 'Priya', last_name: 'Sharma', role: 'both',
      status: 'active', email_verified: true, college_id: iitBombay.id,
      department_id: cseDept.id, year: 3
    },
    {
      id: uuidv4(), email: 'rahul@student.iitb.ac.in', password_hash,
      first_name: 'Rahul', last_name: 'Verma', role: 'seller',
      status: 'active', email_verified: true, college_id: iitBombay.id,
      department_id: cseDept.id, year: 4
    },
    {
      id: uuidv4(), email: 'sneha@student.iitb.ac.in', password_hash,
      first_name: 'Sneha', last_name: 'Patel', role: 'both',
      status: 'active', email_verified: true, college_id: iitBombay.id,
      department_id: cseDept.id, year: 2
    },
    {
      id: uuidv4(), email: 'arjun@student.iitb.ac.in', password_hash,
      first_name: 'Arjun', last_name: 'Singh', role: 'both',
      status: 'active', email_verified: true, college_id: iitBombay.id,
      department_id: departments[1].id, year: 3
    }
  ];

  const { error: userErr } = await supabase.from('users').upsert(users, { onConflict: 'email' });
  if (userErr) console.error('Users error:', userErr.message);
  else console.log(`✅ Seeded ${users.length} users`);

  // ─── Notes ─────────────────────────────────────────────────────────────────
  const seller1 = users[1]; // Priya
  const seller2 = users[3]; // Sneha
  const seller3 = users[1]; // Fallback to Priya

  const notes = [
    {
      id: uuidv4(), seller_id: seller1.id, title: 'DBMS Complete Notes - Semester 5',
      description: 'Comprehensive notes covering relational algebra, SQL, normalization (1NF to BCNF), transactions, and concurrency control. Includes solved gate problems.',
      subject: 'Database Management Systems', department_id: cseDept.id, college_id: iitBombay.id,
      year: 3, price: 249, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['DBMS', 'SQL', 'Normalization', 'Transactions']),
      rating: 4.8, rating_count: 42, download_count: 312, page_count: 68,
      file_url: 'https://example.com/files/dbms_notes.pdf',
      preview_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400'
    },
    {
      id: uuidv4(), seller_id: seller1.id, title: 'Data Structures & Algorithms — Full Course',
      description: 'From arrays to AVL trees. Covers sorting, searching, graphs (BFS/DFS), dynamic programming, and time complexity analysis. 100+ solved problems.',
      subject: 'Data Structures', department_id: cseDept.id, college_id: iitBombay.id,
      year: 2, price: 399, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['DSA', 'Algorithms', 'Trees', 'Graphs', 'DP']),
      rating: 4.9, rating_count: 87, download_count: 654, page_count: 124,
      file_url: 'https://example.com/files/dsa_notes.pdf',
      preview_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400'
    },
    {
      id: uuidv4(), seller_id: seller2.id, title: 'Operating Systems — Exam Ready Notes',
      description: 'Concise OS notes: process scheduling, memory management, file systems, deadlock detection/prevention. Short-answer format for quick revision.',
      subject: 'Operating Systems', department_id: cseDept.id, college_id: iitBombay.id,
      year: 3, price: 199, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['OS', 'Scheduling', 'Memory Management', 'Deadlock']),
      rating: 4.6, rating_count: 29, download_count: 198, page_count: 45,
      file_url: 'https://example.com/files/os_notes.pdf',
      preview_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'
    },
    {
      id: uuidv4(), seller_id: seller2.id, title: 'Computer Networks — Free Cheatsheet',
      description: 'Free one-page cheatsheet covering OSI model, TCP/IP, subnetting, routing protocols (OSPF, BGP), and HTTP/HTTPS. Perfect for last-minute revision.',
      subject: 'Computer Networks', department_id: cseDept.id, college_id: iitBombay.id,
      year: 4, price: 0, is_free: true, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Networks', 'TCP/IP', 'OSI', 'Free']),
      rating: 4.5, rating_count: 156, download_count: 1240, page_count: 8,
      file_url: 'https://example.com/files/networks_cheatsheet.pdf',
      preview_url: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Thermodynamics & Heat Transfer — Engineering Notes',
      description: 'Complete engineering thermodynamics: laws, Carnot cycle, heat engines, refrigerators. Plus heat transfer (conduction, convection, radiation) with solved numericals.',
      subject: 'Thermodynamics', department_id: departments[2].id, college_id: iitBombay.id,
      year: 2, price: 349, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Thermodynamics', 'Heat Transfer', 'Engineering', 'Carnot']),
      rating: 4.7, rating_count: 33, download_count: 287, page_count: 92,
      file_url: 'https://example.com/files/thermo_notes.pdf',
      preview_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'
    },
    {
      id: uuidv4(), seller_id: seller1.id, title: 'Discrete Mathematics Study Guide',
      description: 'Comprehensive study guide covering graph theory, set theory, propositional logic, and combinatorics. Includes solved exam papers.',
      subject: 'Discrete Mathematics', department_id: mathDept.id, college_id: iitBombay.id,
      year: 2, price: 180, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Mathematics', 'Discrete Math', 'Graph Theory', 'Logic']),
      rating: 4.6, rating_count: 14, download_count: 53, page_count: 50,
      file_url: 'https://example.com/files/discrete_math.pdf',
      preview_url: 'https://images.unsplash.com/photo-1453733190148-c44698c265f8?w=400'
    },
    {
      id: uuidv4(), seller_id: seller2.id, title: 'Compiler Design Complete Lecture Notes',
      description: 'Handwritten and typed notes detailing lexical analysis, parsing, semantic analysis, syntax-directed translation, and code generation.',
      subject: 'Compiler Design', department_id: cseDept.id, college_id: iitBombay.id,
      year: 3, price: 299, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Compiler', 'Lexical Analysis', 'Parsing', 'CSE']),
      rating: 4.8, rating_count: 22, download_count: 89, page_count: 75,
      file_url: 'https://example.com/files/compiler_design.pdf',
      preview_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Signals and Systems Exam Prep',
      description: 'Exam preparation guide with step-by-step solutions for Fourier transform, Laplace transform, z-transform, and system response calculations.',
      subject: 'Signals and Systems', department_id: eeDept.id, college_id: iitBombay.id,
      year: 2, price: 220, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Signals', 'Systems', 'Fourier', 'Laplace', 'EE']),
      rating: 4.7, rating_count: 19, download_count: 67, page_count: 60,
      file_url: 'https://example.com/files/signals_systems.pdf',
      preview_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Chemical Reaction Engineering Notes',
      description: 'Core concepts of chemical reaction engineering, covering reactor design, kinetics, multiple reactions, and temperature/pressure effects.',
      subject: 'Chemical Reaction Engineering', department_id: cheDept.id, college_id: iitBombay.id,
      year: 3, price: 260, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Chemical', 'Kinetics', 'Reactors', 'CHE']),
      rating: 4.5, rating_count: 12, download_count: 41, page_count: 85,
      file_url: 'https://example.com/files/che_reaction.pdf',
      preview_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Structural Analysis & Mechanics Guide',
      description: 'Detailing shear force and bending moment diagrams, deflection of beams, truss analysis, and column buckling theories.',
      subject: 'Structural Analysis', department_id: ceDept.id, college_id: iitBombay.id,
      year: 3, price: 199, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Civil', 'Structures', 'Beams', 'Trusses', 'CE']),
      rating: 4.4, rating_count: 8, download_count: 32, page_count: 70,
      file_url: 'https://example.com/files/structural_analysis.pdf',
      preview_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Introduction to Aerodynamics & Fluid Flow',
      description: 'Covers fluid dynamics equations, potential flow, airfoil theory, boundary layer theory, and high-speed aerodynamics principles.',
      subject: 'Aerodynamics', department_id: aeDept.id, college_id: iitBombay.id,
      year: 3, price: 320, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Aerospace', 'Aerodynamics', 'Lift', 'Drag', 'AE']),
      rating: 4.9, rating_count: 15, download_count: 48, page_count: 95,
      file_url: 'https://example.com/files/aerodynamics.pdf',
      preview_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400'
    },
    {
      id: uuidv4(), seller_id: seller1.id, title: 'Classical Mechanics & Relativity',
      description: 'Lagrangian and Hamiltonian formulations, central force motion, rigid body dynamics, and special relativity concepts.',
      subject: 'Classical Mechanics', department_id: phyDept.id, college_id: iitBombay.id,
      year: 1, price: 150, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Physics', 'Mechanics', 'Relativity', 'PHY']),
      rating: 4.7, rating_count: 25, download_count: 110, page_count: 55,
      file_url: 'https://example.com/files/classical_mechanics.pdf',
      preview_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400'
    },
    {
      id: uuidv4(), seller_id: seller3.id, title: 'Fluid Mechanics & Machinery Study Material',
      description: 'Covers fluid properties, pressure measurements, flow through pipes, boundary layers, and operation of centrifugal pumps and turbines.',
      subject: 'Fluid Mechanics', department_id: meDept.id, college_id: iitBombay.id,
      year: 2, price: 280, is_free: false, status: 'live', published_at: new Date().toISOString(),
      tags: JSON.stringify(['Mechanical', 'Fluids', 'Pumps', 'Turbines', 'ME']),
      rating: 4.6, rating_count: 18, download_count: 59, page_count: 80,
      file_url: 'https://example.com/files/fluid_mechanics.pdf',
      preview_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'
    },
    {
      id: uuidv4(), seller_id: seller1.id, title: 'Machine Learning — Semester Notes Under Review',
      description: 'Covers supervised/unsupervised learning, neural networks, SVMs, decision trees, and evaluation metrics.',
      subject: 'Machine Learning', department_id: cseDept.id, college_id: iitBombay.id,
      year: 4, price: 499, is_free: false, status: 'under_review',
      tags: JSON.stringify(['ML', 'AI', 'Neural Networks']), rating: 0, rating_count: 0, download_count: 0,
      file_url: 'https://example.com/files/ml_notes.pdf',
      preview_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400'
    }
  ];

  const { error: notesErr } = await supabase.from('notes').upsert(notes, { onConflict: 'id' });
  if (notesErr) console.error('Notes error:', notesErr.message);
  else console.log(`✅ Seeded ${notes.length} notes`);

  // Add ML note to moderation queue
  const mlNote = notes.find(n => n.status === 'under_review');
  await supabase.from('moderation_queue').upsert([{
    id: uuidv4(), notes_id: mlNote.id, status: 'pending', submitted_at: new Date().toISOString()
  }], { onConflict: 'id' });

    // Removed dummy sales generation per user request



  console.log('\n🎉 Seed complete!\n');
  console.log('📌 Test accounts (password: Password@123):');
  console.log('   👑 Admin:  admin@notesmarket.com');
  console.log('   🛒 Seller: priya@student.iitb.ac.in');
  console.log('   📚 Buyer:  sneha@student.iitb.ac.in\n');
}

seed().catch(console.error);
