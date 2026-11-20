'use strict';

// Rute /api/auth — masuk, keluar, dan info sesi admin.

const router = require('express').Router();
const controller = require('../controllers/pesan.controller');

router.post('/masuk', controller.masuk);
router.post('/keluar', controller.keluar);
router.get('/saya', controller.saya);

module.exports = router;
