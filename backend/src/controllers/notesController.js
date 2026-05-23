// src/controllers/notesController.js
const notesService = require('../services/notesService');
const { success, created, notFound, forbidden, badRequest } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');
const path = require('path');
const fs = require('fs');

async function listNotes(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { department, year, subject, minPrice, maxPrice, isFree, sort } = req.query;
    const { notes, total } = await notesService.listNotes({ page, limit, department, year, subject, minPrice, maxPrice, isFree, sort });
    return success(res, { notes }, 'OK', 200, paginationMeta(page, limit, total));
  } catch (err) { next(err); }
}

async function searchNotes(req, res, next) {
  try {
    if (!req.query.q) return badRequest(res, 'Search query (q) is required');
    const { page, limit } = getPagination(req.query);
    const { q, department, year, sort } = req.query;
    const { notes, total } = await notesService.searchNotes({ q, department, year, sort, page, limit });
    return success(res, { notes }, 'OK', 200, paginationMeta(page, limit, total));
  } catch (err) { next(err); }
}

async function getTrending(req, res, next) {
  try {
    const notes = await notesService.getTrending({ limit: req.query.limit });
    return success(res, { notes });
  } catch (err) { next(err); }
}

async function getNoteById(req, res, next) {
  try {
    const note = await notesService.getNoteById(req.params.id, req.user?.id);
    return success(res, { note });
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 403) return forbidden(res, err.message);
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, description, subject, departmentId, collegeId, year, price, isFree, tags, pageCount } = req.body;
    if (!title) return badRequest(res, 'Title is required');

    const note = await notesService.createNote({
      sellerId: req.user.id,
      title, description, subject,
      departmentId, collegeId, year, price,
      isFree: isFree === 'true' || isFree === true,
      tags: tags ? JSON.parse(tags) : [],
      file: req.file,
      pageCount
    });
    return created(res, { note }, 'Note submitted for review');
  } catch (err) { next(err); }
}

async function updateNote(req, res, next) {
  try {
    const note = await notesService.updateNote({
      noteId: req.params.id,
      sellerId: req.user.id,
      updates: req.body
    });
    return success(res, { note }, 'Note updated');
  } catch (err) {
    if (err.status === 403) return forbidden(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    await notesService.deleteNote({
      noteId: req.params.id,
      sellerId: req.user.id,
      isAdmin: req.user.role === 'admin'
    });
    return success(res, {}, 'Note deleted');
  } catch (err) {
    if (err.status === 403) return forbidden(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    next(err);
  }
}

async function getNotePreview(req, res, next) {
  try {
    const note = await notesService.getNoteById(req.params.id, req.user?.id);
    if (!note.preview_url) return notFound(res, 'No preview available');
    return success(res, { preview_url: note.preview_url });
  } catch (err) { next(err); }
}

async function downloadNote(req, res, next) {
  try {
    const { id } = req.params;
    const note = await notesService.getNoteById(id, req.user?.id);
    if (!note.is_purchased && !note.is_free && note.seller?.id !== req.user?.id) {
      return forbidden(res, 'Purchase this note to download');
    }
    if (!note.file_url) return notFound(res, 'File not found');

    const filePath = path.join(process.cwd(), note.file_url);
    if (fs.existsSync(filePath)) {
      return res.download(filePath);
    }
    // If file doesn't exist locally (Supabase Storage), redirect to file_url
    return res.redirect(note.file_url);
  } catch (err) { next(err); }
}

async function getNotesByDepartment(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query);
    const { notes, total } = await notesService.getByDepartment(req.params.deptId, { page, limit, ...req.query });
    return success(res, { notes }, 'OK', 200, paginationMeta(page, limit, total));
  } catch (err) { next(err); }
}

module.exports = { listNotes, searchNotes, getTrending, getNoteById, createNote, updateNote, deleteNote, getNotePreview, downloadNote, getNotesByDepartment };
