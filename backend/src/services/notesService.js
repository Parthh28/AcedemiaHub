// src/services/notesService.js — Notes CRUD and search business logic
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const NOTE_SELECT = `
  id, title, description, subject, year, price, is_free, status,
  file_url, file_size, page_count, preview_url, tags,
  rating, rating_count, download_count, created_at, published_at,
  seller:users!seller_id(id, first_name, last_name, profile_pic_url, role, college),
  department:departments(id, name, code, college_id),
  colleges(id, name, city)
`;

async function listNotes({ page = 1, limit = 20, department, year, subject, minPrice, maxPrice, isFree, sort = 'popular', status = 'live' }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notes')
    .select(NOTE_SELECT, { count: 'exact' })
    .eq('status', status)
    .range(offset, offset + limit - 1);

  if (department) query = query.eq('department_id', department);
  if (year) query = query.eq('year', parseInt(year));
  if (subject) query = query.ilike('subject', `%${subject}%`);
  if (isFree !== undefined) query = query.eq('is_free', isFree === 'true');
  if (minPrice) query = query.gte('price', parseFloat(minPrice));
  if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

  switch (sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'low_high': query = query.order('price', { ascending: true }); break;
    case 'high_low': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    default: // popular
      query = query.order('download_count', { ascending: false }).order('rating', { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) {
    if (error.code === 'PGRST103' || error.message.includes('range not satisfiable')) {
      return { notes: [], total: 0 };
    }
    throw error;
  }
  return { notes: data, total: count };
}

async function searchNotes({ q, department, year, sort, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notes')
    .select(NOTE_SELECT, { count: 'exact' })
    .eq('status', 'live')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,subject.ilike.%${q}%`)
    .range(offset, offset + limit - 1);

  if (department) query = query.eq('department_id', department);
  if (year) query = query.eq('year', parseInt(year));

  switch (sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    default: query = query.order('download_count', { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) {
    if (error.code === 'PGRST103' || error.message.includes('range not satisfiable')) {
      return { notes: [], total: 0 };
    }
    throw error;
  }
  return { notes: data, total: count };
}

async function getTrending({ limit = 10 }) {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_SELECT)
    .eq('status', 'live')
    .order('download_count', { ascending: false })
    .order('rating', { ascending: false })
    .limit(parseInt(limit));

  if (error) throw error;
  return data;
}

async function getNoteById(id, userId = null, userRole = null) {
  const { data: note, error } = await supabase
    .from('notes')
    .select(`${NOTE_SELECT}, rejection_reason`)
    .eq('id', id)
    .single();

  if (error || !note) throw Object.assign(new Error('Note not found'), { status: 404 });
  if (note.status !== 'live' && note.seller?.id !== userId && userRole !== 'admin') {
    throw Object.assign(new Error('Note not available'), { status: 403 });
  }

  // Check if buyer has purchased this note
  let isPurchased = false;
  if (userId) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', userId)
      .eq('notes_id', id)
      .eq('status', 'completed')
      .single();
    isPurchased = !!purchase;
  }

  return { ...note, is_purchased: isPurchased };
}

async function createNote({ sellerId, title, description, subject, departmentId, collegeId, year, price, isFree, tags, file, preview1, preview2, pageCount }) {
  const id = uuidv4();
  let fileUrl = null;
  let previewUrls = [];

  // Helper function to upload files
  const uploadToSupabase = async (uploadFile, prefix) => {
    const originalName = uploadFile.originalname || 'file.jpg';
    const ext = originalName.split('.').pop();
    const fileName = `${id}_${prefix}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(fileName, uploadFile.buffer, {
        contentType: uploadFile.mimetype,
        upsert: true
      });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  if (file) {
    fileUrl = await uploadToSupabase(file, 'main');
  }

  if (preview1) {
    previewUrls.push(await uploadToSupabase(preview1, 'prev1'));
  }
  
  if (preview2) {
    previewUrls.push(await uploadToSupabase(preview2, 'prev2'));
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      id,
      seller_id: sellerId,
      title,
      description,
      subject,
      department_id: departmentId,
      college_id: collegeId,
      year: year ? parseInt(year) : null,
      price: isFree ? 0 : parseFloat(price) || 0,
      is_free: !!isFree,
      tags: JSON.stringify(tags || []),
      file_url: fileUrl,
      preview_url: previewUrls.length > 0 ? JSON.stringify(previewUrls) : null,
      file_size: file?.size || 0,
      page_count: parseInt(pageCount) || 0,
      status: 'under_review'
    })
    .select(NOTE_SELECT)
    .single();

  if (error) throw error;

  // Add to moderation queue
  const { error: modError } = await supabase
    .from('moderation_queue')
    .insert({
      id: uuidv4(),
      notes_id: id,
      status: 'pending',
      submitted_at: new Date().toISOString()
    });

  if (modError) console.error('Failed to add note to moderation queue:', modError);

  if (error) throw error;

  return note;
}

async function updateNote({ noteId, sellerId, updates }) {
  // Verify ownership
  const { data: existing } = await supabase
    .from('notes')
    .select('seller_id, status')
    .eq('id', noteId)
    .single();

  if (!existing) throw Object.assign(new Error('Note not found'), { status: 404 });
  if (existing.seller_id !== sellerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  const allowedUpdates = ['title', 'description', 'subject', 'year', 'price', 'is_free', 'tags', 'status'];
  const cleanUpdates = {};
  allowedUpdates.forEach(key => { if (updates[key] !== undefined) cleanUpdates[key] = updates[key]; });
  cleanUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('notes')
    .update(cleanUpdates)
    .eq('id', noteId)
    .select(NOTE_SELECT)
    .single();

  if (error) throw error;
  return data;
}

async function deleteNote({ noteId, sellerId, isAdmin = false }) {
  const { data: existing } = await supabase
    .from('notes')
    .select('seller_id')
    .eq('id', noteId)
    .single();

  if (!existing) throw Object.assign(new Error('Note not found'), { status: 404 });
  if (!isAdmin && existing.seller_id !== sellerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Soft delete
  const { error } = await supabase
    .from('notes')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', noteId);

  if (error) throw error;
}

async function getByDepartment(deptId, options) {
  return listNotes({ ...options, department: deptId });
}

module.exports = { listNotes, searchNotes, getTrending, getNoteById, createNote, updateNote, deleteNote, getByDepartment };
