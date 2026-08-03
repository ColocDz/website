import { PrismaClient } from '@prisma/client';

const directUrl = "mongodb://colocdz:ugDtojEk84H1iWaM@ac-wulwfie-shard-00-00.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-01.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-02.7o4uabo.mongodb.net:27017/colocdz?ssl=true&replicaSet=atlas-13c548-shard-0&authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&connectTimeoutMS=5000";

const srvUrl = "mongodb+srv://colocdz:ugDtojEk84H1iWaM@cluster0.7o4uabo.mongodb.net/colocdz?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&connectTimeoutMS=5000";

async function main() {
  console.log("Testing Direct connection...");
  try {
    const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
    await prisma.$connect();
    console.log("Direct Connected! User count:", await prisma.user.count());
    await prisma.$disconnect();
  } catch (e) {
    console.error("Direct Error:", e);
  }

  console.log("\nTesting SRV connection...");
  try {
    const prisma = new PrismaClient({ datasources: { db: { url: srvUrl } } });
    await prisma.$connect();
    console.log("SRV Connected! User count:", await prisma.user.count());
    await prisma.$disconnect();
  } catch (e) {
    console.error("SRV Error:", e);
  }
}

main();
