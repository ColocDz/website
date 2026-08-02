import { PrismaClient } from '@prisma/client'

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
