import { PrismaClient } from '@prisma/client'

const DEFAULT_MONGODB_URL = "mongodb+srv://colocdz:ugDtojEk84H1iWaM@cluster0.7o4uabo.mongodb.net/colocdz?retryWrites=true&w=majority";

let dbUrl = process.env.DATABASE_URL || DEFAULT_MONGODB_URL;
dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

if (!dbUrl.startsWith('mongodb') && !dbUrl.startsWith('mongodb+srv')) {
  dbUrl = DEFAULT_MONGODB_URL;
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
