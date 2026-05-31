# ColocDZ - Developer Quick Reference

## Quick Commands

### Development
```bash
# Install dependencies
pnpm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Seed database
npm run db:seed
```

### Database
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Create migration (after schema change)
npx prisma migrate dev --name description_here
```

---

## Project Structure

```
colocdz/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── posts/               # Post endpoints
│   │   ├── messages/            # Messaging endpoints
│   │   ├── user/                # User profile endpoints
│   │   ├── phone-otp/           # SMS verification
│   │   └── auth/                # Authentication (Better Auth)
│   ├── login/                   # Login page
│   ├── signup/                  # Registration page
│   ├── posts/                   # Posts listing page
│   ├── post/[id]/              # Post detail page
│   ├── adding-post/            # Create/edit post
│   ├── messages/               # Messaging page
│   ├── profile/                # User profile
│   ├── settings/               # Settings & verification
│   ├── page.tsx                # Home page
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── ui/                     # Shadcn UI components
│   └── layout/                 # Layout components (navbar, footer)
├── lib/                         # Utilities & libraries
│   ├── auth.ts                 # Better Auth setup
│   ├── auth-client.ts          # Auth client
│   ├── prisma.ts               # Prisma client
│   └── utils.ts                # Utility functions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
├── public/
│   ├── models/                 # Face detection models
│   └── images/                 # Static images
├── types/                      # TypeScript types
├── styles/                     # Global styles
├── .env.example                # Environment template
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

---

## Environment Variables

```env
# Required
DATABASE_URL=mongodb+srv://...
BETTER_AUTH_SECRET=generated-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## Database Models

### User
```prisma
model User {
  id: String @id @default(auto()) @map("_id") @db.ObjectId
  name: String
  email: String @unique
  phone: String?
  // ... more fields
  posts: Post[]
  sessions: Session[]
  conversations: Conversation[]
  comments: Comment[]
}
```

### Post
```prisma
model Post {
  id: String @id @default(auto()) @map("_id") @db.ObjectId
  title: String
  description: String
  price: String          // Note: stored as string!
  type: String           // Apartment, House, Studio, etc.
  images: String[]       // Base64 or URLs
  authorId: String @db.ObjectId
  author: User @relation(fields: [authorId])
  comments: Comment[]
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  isArchived: Boolean @default(false)
  status: String @default("published")  // published or draft
}
```

### Conversation & Message
```prisma
model Conversation {
  id: String @id @default(auto()) @map("_id") @db.ObjectId
  participantIds: String[] @db.ObjectId
  messages: Message[]
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}

model Message {
  id: String @id @default(auto()) @map("_id") @db.ObjectId
  content: String
  senderId: String @db.ObjectId
  conversationId: String @db.ObjectId @relation(fields: [conversationId])
  createdAt: DateTime @default(now())
}
```

---

## API Response Format

### Success Response
```json
{
  "id": "...",
  "title": "...",
  "price": "50000",
  "createdAt": "2024-01-15T10:30:00Z",
  // ... other fields
}
```

### Error Response
```json
{
  "error": "User not found"
}
```

**Status Codes**:
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## Common Tasks

### Add a New API Endpoint
```typescript
// app/api/posts/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Add a New Database Model
```prisma
// prisma/schema.prisma
model NewModel {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  name String
  createdAt DateTime @default(now())
}

// Then:
npx prisma db push
```

### Create a Protected Component
```typescript
'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (!session) return <div>Loading...</div>;

  return <div>Protected content for {session.user.name}</div>;
}
```

---

## Common Issues & Solutions

### Issue: "Cannot GET /post/123"
**Solution**: 
- Check post ID is valid MongoDB ObjectId
- Verify post exists in database
- Check API route path is correct

### Issue: Price shows as "50000" instead of formatted
**Solution**:
```typescript
// Use this formatting
parseFloat(post.price || '0').toLocaleString()
```

### Issue: Face verification not working
**Solution**:
- Check face-api models are in `public/models/`
- Verify browser has camera permissions
- Check console for errors

### Issue: Messages not sending
**Solution**:
- Verify both users exist
- Check conversation exists
- Ensure user is authenticated
- Verify receiver ID is valid

---

## Debugging Tips

### Enable Debug Logs
```typescript
// Add in your code
console.log('Debug:', { variable, anotherVar });

// Check browser console (F12)
// Check server logs in terminal
```

### Check Database Directly
```bash
# Open Prisma Studio
npx prisma studio

# Or use MongoDB Atlas UI
```

### Test API Endpoints
```bash
# List posts
curl http://localhost:3000/api/posts

# Get specific post
curl http://localhost:3000/api/posts/ID

# With authentication
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/user
```

---

## Performance Tips

### Image Optimization
```typescript
import Image from 'next/image';

// Good - uses Next.js optimization
<Image src={url} alt="..." width={400} height={300} />

// Avoid - no optimization
<img src={url} alt="..." />
```

### Data Fetching
```typescript
// Good - only fetch needed fields
include: { author: { select: { name: true, image: true } } }

// Avoid - fetching all fields
include: { author: true }
```

### Pagination
```typescript
// For large datasets
const skip = (page - 1) * pageSize;
const posts = await prisma.post.findMany({
  skip,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

---

## Testing Checklist

Before deployment:
- [ ] Create post and verify in database
- [ ] Edit post and verify changes
- [ ] Delete post and verify soft-delete
- [ ] Send message and verify reception
- [ ] Search posts with various filters
- [ ] Comment on post and verify display
- [ ] Upload images and verify display
- [ ] Test face verification flow
- [ ] Test logout and session clearing
- [ ] Verify error messages are helpful
- [ ] Check all pages load without errors

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Better Auth Docs](https://www.better-auth.com/)
- [MongoDB Docs](https://docs.mongodb.com/)

---

## File Guide

- `README.md` - Project overview
- `FIXES_SUMMARY.md` - All fixes applied (START HERE)
- `PRODUCTION_READY.md` - Quick start for production
- `PRODUCTION_DEPLOYMENT.md` - Detailed deployment guide
- `DATABASE_MIGRATION.md` - Database setup and migration
- `PRODUCTION_CHECKLIST.md` - Pre-deployment checklist
- `KNOWN_ISSUES.md` - Known issues and recommendations

---

**Last Updated**: May 30, 2026
