'use strict';

// Koneksi database lewat Prisma Client (ORM).
// Skema ada di prisma/schema.prisma, pengaturan koneksi di .env (DATABASE_URL).
// Perintah Prisma:
//   npx prisma generate   -> membuat ulang Prisma Client
//   npx prisma db push    -> menyesuaikan tabel di database dengan skema
//   npx prisma studio     -> melihat dan mengubah data lewat browser

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
