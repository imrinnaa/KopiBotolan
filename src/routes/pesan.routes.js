'use strict';

// Rute /api/pesan — POST untuk form kontak publik, GET untuk halaman admin.

const router = require('express').Router();
const controller = require('../controllers/pesan.controller');
const { butuhAdmin } = require('../middleware/auth');

router.post('/', controller.kirim);
router.get('/', butuhAdmin, controller.semua);
router.get('/belum-dibaca', butuhAdmin, controller.jumlahBelumDibaca);
router.patch('/:id/dibaca', butuhAdmin, controller.tandaiDibaca);

module.exports = router;
