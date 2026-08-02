import { PrismaClient } from '@prisma/client'

const DEFAULT_MYSQL_URL = "mysql://colocdz1_dbuser:MyStrongPassword123!@localhost:3306/colocdz1_db";

let dbUrl = process.env.DATABASE_URL || DEFAULT_MYSQL_URL;
dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

if (!dbUrl.startsWith('mysql')) {
  dbUrl = DEFAULT_MYSQL_URL;
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
