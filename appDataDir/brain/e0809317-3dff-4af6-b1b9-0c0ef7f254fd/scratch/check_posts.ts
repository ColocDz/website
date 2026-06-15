import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    include: { author: true }
  });
  console.log('Posts count:', posts.length);
  posts.forEach(p => {
    console.log(`- ID: ${p.id}, Title: ${p.title}, searchType: ${p.searchType}, author: ${p.author.name}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
