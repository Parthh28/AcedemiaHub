// src/services/authService.js — Auth business logic
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const emailService = require('./emailService');

// OTP Cache: TTL of 10 minutes (600 seconds)
const otpCache = new NodeCache({ stdTTL: 600 });

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function register({ email, password, firstName, lastName, university, currentYear, academicYear, phone, role = 'buyer' }) {
  // Check if email exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });

  // Enforce university/education emails (.edu or .ac)
  const isEduEmail = /\.(edu|ac)(\.[a-z]{2,})?$/i.test(email) || email === 'acedemiahub@gmail.com';
  if (!isEduEmail) {
    throw Object.assign(new Error('Only university/education emails (.edu, .ac) are allowed to sign up.'), { status: 400, code: 'INVALID_EDU_EMAIL' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  
  // Convert currentYear string to integer as the DB expects int4
  let yearInt = 1;
  if (currentYear.includes('1st')) yearInt = 1;
  else if (currentYear.includes('2nd')) yearInt = 2;
  else if (currentYear.includes('3rd')) yearInt = 3;
  else if (currentYear.includes('4th')) yearInt = 4;
  else if (currentYear.includes('5th')) yearInt = 5;
  else if (currentYear.includes('Masters')) yearInt = 6;

  // Append academic year to university string
  const universityWithBatch = `${university} (Batch of ${academicYear})`;

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id,
      email,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      year: yearInt,
      college: universityWithBatch,
      phone,
      role,
      status: 'inactive', // Start as inactive pending OTP verification
      email_verified: false
    })
    .select('id, email, first_name, last_name, role, status, created_at')
    .single();

  if (error) throw error;

  const otp = generateOTP();
  otpCache.set(email, otp);
  
  // Send OTP to email asynchronously
  emailService.sendOTP(email, otp).catch(err => console.error('Email sending failed:', err));

  return { message: 'OTP sent to your email. Please verify to complete registration.', user };
}

async function verifyOTP(email, otp) {
  const cachedOtp = otpCache.get(email);
  if (!cachedOtp || cachedOtp !== otp) {
    throw Object.assign(new Error('Invalid or expired OTP'), { status: 400, code: 'INVALID_OTP' });
  }

  // Get user to ensure they exist and are inactive
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('email', email)
    .single();
    
  if (fetchError || !user) throw Object.assign(new Error('User not found'), { status: 404 });
  if (user.status !== 'inactive') throw Object.assign(new Error('User already verified'), { status: 400 });

  // Update user status
  const { error: updateError } = await supabase
    .from('users')
    .update({ status: 'active', email_verified: true })
    .eq('id', user.id);

  if (updateError) throw updateError;

  // Clear OTP
  otpCache.del(email);

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store refresh token in DB
  await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

  return { user: { ...user, status: 'active', email_verified: true }, accessToken, refreshToken };
}

async function resendOTP(email) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, status')
    .eq('email', email)
    .single();

  if (error || !user) throw Object.assign(new Error('User not found'), { status: 404 });
  if (user.status !== 'inactive') throw Object.assign(new Error('User already verified'), { status: 400 });

  const otp = generateOTP();
  otpCache.set(email, otp);
  
  await emailService.sendOTP(email, otp);
  return { message: 'A new OTP has been sent to your email.' };
}

async function login({ email, password }) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, first_name, last_name, role, status, profile_pic_url')
    .eq('email', email)
    .single();

  if (error || !user) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
  if (user.status === 'suspended') throw Object.assign(new Error('Account suspended'), { status: 403, code: 'SUSPENDED' });
  if (user.status === 'inactive') throw Object.assign(new Error('Account inactive. Please verify your email first.'), { status: 403, code: 'INACTIVE' });

  if (user.email === 'acedemiahub@gmail.com' && user.role !== 'admin') {
    await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
    user.role = 'admin';
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Update refresh token + last login
  await supabase
    .from('users')
    .update({ refresh_token: refreshToken, last_login: new Date().toISOString() })
    .eq('id', user.id);

  const { password_hash, refresh_token, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

async function refreshTokens(token) {
  const decoded = verifyRefreshToken(token);

  const { data: user } = await supabase
    .from('users')
    .select('id, email, role, status, refresh_token')
    .eq('id', decoded.id)
    .single();

  if (!user || user.refresh_token !== token) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
  if (user.status === 'suspended') throw Object.assign(new Error('Account suspended'), { status: 403 });

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user.id });

  await supabase.from('users').update({ refresh_token: newRefreshToken }).eq('id', user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

async function forgotPassword(email) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, status')
    .eq('email', email)
    .single();

  if (error || !user) {
    // Prevent email enumeration by returning success even if not found
    return { message: 'If the email exists, a reset link was sent.' };
  }

  // Generate a secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const { error: updateError } = await supabase
    .from('users')
    .update({ reset_token: resetToken, reset_token_expiry: expiry })
    .eq('id', user.id);

  if (updateError) throw Object.assign(new Error('Failed to initiate password reset'), { status: 500 });

  const resetLink = `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/login.html?reset_token=${resetToken}`;
  
  // Send email asynchronously
  emailService.sendPasswordResetEmail(email, resetLink).catch(err => console.error('Reset email failed:', err));
  
  return { message: 'If the email exists, a reset link was sent.' };
}

async function resetPassword(token, newPassword) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, reset_token_expiry')
    .eq('reset_token', token)
    .single();

  if (error || !user) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });

  if (new Date(user.reset_token_expiry) < new Date()) {
    throw Object.assign(new Error('Reset token has expired'), { status: 400 });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      password_hash, 
      reset_token: null, 
      reset_token_expiry: null 
    })
    .eq('id', user.id);

  if (updateError) throw Object.assign(new Error('Failed to reset password'), { status: 500 });
  return { message: 'Password reset successfully' };
}

async function logout(userId) {
  await supabase.from('users').update({ refresh_token: null }).eq('id', userId);
}

async function getMe(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, first_name, last_name, profile_pic_url, role, status,
      bio, phone, upi_id, email_verified, year, created_at, last_login, razorpay_account_id, college, major,
      colleges(id, name, city),
      departments(id, name, code)
    `)
    .eq('id', userId)
    .single();

  if (error || !user) throw Object.assign(new Error('User not found'), { status: 404 });

  if (user.email === 'acedemiahub@gmail.com' && user.role !== 'admin') {
    await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
    user.role = 'admin';
  }

  // Calculate user's available credit balance from seller_earnings
  const { data: earningsData, error: earningsErr } = await supabase
    .from('seller_earnings')
    .select('net_amount')
    .eq('seller_id', userId)
    .eq('status', 'available');

  const balance = (earningsData || []).reduce((sum, e) => sum + parseFloat(e.net_amount), 0);
  user.balance = balance;

  return user;
}

async function getColleges() {
  const { data, error } = await supabase.from('colleges').select('*').order('name');
  if (error) throw error;
  return data;
}

async function getDepartments(collegeId) {
  let query = supabase.from('departments').select('*');
  if (collegeId) {
    query = query.eq('college_id', collegeId);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data;
}

async function updateProfile(userId, { firstName, lastName, phone, upiId, collegeId, departmentId, year, bio, college, major }) {
  const updateData = {};
  if (firstName !== undefined) updateData.first_name = firstName;
  if (lastName !== undefined) updateData.last_name = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (upiId !== undefined) updateData.upi_id = upiId;
  if (collegeId !== undefined) updateData.college_id = collegeId;
  if (departmentId !== undefined) updateData.department_id = departmentId;
  if (year !== undefined) updateData.year = year;
  if (bio !== undefined) updateData.bio = bio;
  if (college !== undefined) updateData.college = college;
  if (major !== undefined) updateData.major = major;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select(`
      id, email, first_name, last_name, profile_pic_url, role, status,
      bio, phone, upi_id, email_verified, year, created_at, college, major,
      colleges(id, name, city),
      departments(id, name, code)
    `)
    .single();

  if (error) throw error;
  return data;
}

async function updateAvatar(userId, file) {
  const ext = file.originalname.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  const avatarUrl = publicUrlData.publicUrl;

  const { data, error } = await supabase
    .from('users')
    .update({ profile_pic_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, profile_pic_url')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  refreshTokens,
  logout,
  getMe,
  getColleges,
  getDepartments,
  updateProfile,
  updateAvatar
};

