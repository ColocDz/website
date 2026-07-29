import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function getDatabaseUrl() {
  let url = process.env.DATABASE_URL || '';
  if (url.startsWith('mongodb+srv://colocdz:ugDtojEk84H1iWaM@cluster01.7o4uabo.mongodb.net')) {
    url = "mongodb://colocdz:ugDtojEk84H1iWaM@ac-wulwfie-shard-00-00.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-01.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-02.7o4uabo.mongodb.net:27017/colocdz?ssl=true&replicaSet=atlas-13c548-shard-0&authSource=admin&retryWrites=true&w=majority";
  }
  if (url && !url.includes('serverSelectionTimeoutMS')) {
    url += (url.includes('?') ? '&' : '?') + 'serverSelectionTimeoutMS=5000&connectTimeoutMS=5000';
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
