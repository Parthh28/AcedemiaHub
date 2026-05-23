// src/routes/notes.js
const router = require('express').Router();
const ctrl = require('../controllers/notesController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { uploadNote } = require('../middleware/upload');

router.get('/', optionalAuth, ctrl.listNotes);
router.get('/search', optionalAuth, ctrl.searchNotes);
router.get('/trending', ctrl.getTrending);
router.get('/by-department/:deptId', optionalAuth, ctrl.getNotesByDepartment);
router.get('/:id', optionalAuth, ctrl.getNoteById);
router.get('/:id/preview', ctrl.getNotePreview);

router.post('/', authenticate, requireRole('seller'), uploadNote.single('file'), ctrl.createNote);
router.put('/:id', authenticate, requireRole('seller'), ctrl.updateNote);
router.delete('/:id', authenticate, ctrl.deleteNote);

// Download (auth required to verify purchase)
router.get('/downloads/file/:id', authenticate, ctrl.downloadNote);

module.exports = router;
