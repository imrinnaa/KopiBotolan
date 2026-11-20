'use strict';

// Catatan permintaan masuk (mirip middleware logger pada slide 20).

function logger(req, res, next) {
  const mulai = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - mulai;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

module.exports = logger;
