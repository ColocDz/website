import { PrismaClient } from '@prisma/client'

const DEFAULT_MONGO_URL = "mongodb+srv://colocdz:ugDtojEk84H1iWaM@cluster01.7o4uabo.mongodb.net/colocdz?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&connectTimeoutMS=5000";

let dbUrl = process.env.DATABASE_URL || DEFAULT_MONGO_URL;
dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

if (!dbUrl.startsWith('mongodb')) {
  dbUrl = DEFAULT_MONGO_URL;
}

process.env.DATABASE_URL = dbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
