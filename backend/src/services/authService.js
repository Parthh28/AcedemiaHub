// src/services/authService.js — Auth business logic
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');

async function register({ email, password, firstName, lastName, role = 'buyer' }) {
  // Check if email exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });

  const password_hash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id,
      email,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'active',
      email_verified: false
    })
    .select('id, email, first_name, last_name, role, status, created_at')
    .single();

  if (error) throw error;

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store refresh token in DB
  await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

  return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, first_name, last_name, role, status, profile_pic_url')
    .eq('email', email)
    .single();

  if (error || !user) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
  if (user.status === 'suspended') throw Object.assign(new Error('Account suspended'), { status: 403, code: 'SUSPENDED' });

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

async function logout(userId) {
  await supabase.from('users').update({ refresh_token: null }).eq('id', userId);
}

async function getMe(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, first_name, last_name, profile_pic_url, role, status,
      bio, phone, upi_id, email_verified, year, created_at, last_login,
      colleges(id, name, city),
      departments(id, name, code)
    `)
    .eq('id', userId)
    .single();

  if (error || !user) throw Object.assign(new Error('User not found'), { status: 404 });

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

async function updateProfile(userId, { firstName, lastName, phone, upiId, collegeId, departmentId, year, bio }) {
  const updateData = {};
  if (firstName !== undefined) updateData.first_name = firstName;
  if (lastName !== undefined) updateData.last_name = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (upiId !== undefined) updateData.upi_id = upiId;
  if (collegeId !== undefined) updateData.college_id = collegeId;
  if (departmentId !== undefined) updateData.department_id = departmentId;
  if (year !== undefined) updateData.year = year;
  if (bio !== undefined) updateData.bio = bio;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select(`
      id, email, first_name, last_name, profile_pic_url, role, status,
      bio, phone, upi_id, email_verified, year, created_at,
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
  login,
  refreshTokens,
  logout,
  getMe,
  getColleges,
  getDepartments,
  updateProfile,
  updateAvatar
};

