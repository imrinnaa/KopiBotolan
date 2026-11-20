'use strict';

// Rute /api/layanan — CRUD lengkap (GET, POST, PUT, DELETE) seperti tabel slide 21.
// Semua method selain GET memakai butuhAdmin, supaya halaman admin benar-benar
// dilindungi login (poin BONUS).

const router = require('express').Router();
const controller = require('../controllers/layanan.controller');
const { butuhAdmin } = require('../middleware/auth');

router.get('/', controller.semua);
router.get('/:id', controller.satu);
router.post('/', butuhAdmin, controller.tambah);
router.put('/:id', butuhAdmin, controller.ubah);
router.delete('/:id', butuhAdmin, controller.hapus);

module.exports = router;
