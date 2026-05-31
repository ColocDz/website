# ColocDZ - Production Deployment Guide

## Overview
ColocDZ is a Next.js-based colocation and house-sharing marketplace platform using MongoDB, Prisma, and Better Auth.

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Google OAuth credentials (optional but recommended)
- Twilio account for SMS (optional)

## Environment Setup

### 1. Create `.env.local` from `.env.example`
```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

#### Database
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/colocdz?retryWrites=true&w=majority"
```

#### Authentication
```env
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"  # Generate random secret
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add both `http://localhost:3000` (development) and your domain (production)
4. Configure in .env.local

#### Twilio (Optional for SMS)
1. Create [Twilio account](https://www.twilio.com/)
2. Get Account SID, Auth Token, and Phone Number
3. Configure in .env.local

## Installation & Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Seed database (optional - populates with initial data)
npm run db:seed

# Push schema to database
npx prisma db push
```

### 3. Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables (Production)
Set all environment variables on your hosting platform:
- Vercel: Settings → Environment Variables
- Docker: Use `.env.local`
- Other: Depends on your platform

## Key Features

### Authentication
- Email/Password signup and login
- Google OAuth integration
- Phone OTP verification (Twilio)
- Face verification for enhanced security

### Core Functionality
- Create and manage posts (rentals, roommate searches)
- Search and filter listings by type, location, price
- Real-time messaging between users
- Comments on posts
- User profiles with verification badges
- Archive conversations and posts

### Data Model
- **Users**: Profiles with verification badges
- **Posts**: Listings with images, amenities, tags
- **Conversations**: Direct messaging between users
- **Messages**: Individual messages with timestamps
- **Comments**: Comments on posts

## API Endpoints

### Public
- `GET /api/posts` - List all published posts
- `GET /api/posts/[id]` - Get post details with comments

### Protected (Requires Authentication)
- `POST /api/posts` - Create post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/[conversationId]` - Get conversation messages
- `GET /api/user` - Get current user
- `PUT /api/user` - Update profile
- `POST /api/phone-otp/send` - Send verification OTP
- `POST /api/phone-otp/verify` - Verify phone

## Database Schema

### Core Models
```prisma
User {
  id              String @id
  name            String
  email           String @unique
  phone           String?
  gender          String?
  birthday        DateTime?
  bio             String?
  wilaya          String?
  city            String?
  image           String?
  identityVerified Boolean
  faceVerified    Boolean
  faceImage       String?
  isPrivate       Boolean
  isArchived      Boolean
  ...
}

Post {
  id          String @id
  title       String
  type        String
  postType    String  // 'offer' or 'request'
  description String
  price       String
  location    String
  wilaya      String
  bedrooms    Int?
  bathrooms   Int?
  amenities   String[]
  tags        String[]
  images      String[]
  status      String  // 'published' or 'draft'
  isArchived  Boolean
  authorId    String  // FK to User
  createdAt   DateTime
  updatedAt   DateTime
}

Conversation {
  id            String @id
  participantIds String[]
  archivedBy    String[]
  createdAt     DateTime
  updatedAt     DateTime
}

Message {
  id             String @id
  content        String
  senderId       String  // FK to User
  conversationId String  // FK to Conversation
  createdAt      DateTime
}

Comment {
  id        String @id
  text      String
  postId    String  // FK to Post
  authorId  String  // FK to User
  createdAt DateTime
}
```

## Important Notes

### Image Handling
- Images are stored as base64 data URLs in the database
- For production, consider using external storage (AWS S3, Cloudinary)
- Update image URLs in `.env` and image handling logic

### Face Verification
- Currently uses face-api.js for client-side detection
- Users must verify before creating posts or messaging
- Store face images for duplicate prevention

### Price Field
- Stored as STRING in database (for flexibility with currency symbols)
- Display with `parseFloat(price).toLocaleString()` for formatting

### Phone Verification
- Optional feature using Twilio
- Falls back gracefully if Twilio credentials missing

## Troubleshooting

### Database Connection
```bash
# Test connection
npx prisma db execute --stdin << EOF
db.adminCommand({ ping: 1 })
EOF
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
npm run build
```

### Environment Variables Not Loading
- Ensure `.env.local` is in project root
- Restart dev server after changes
- Production: Verify variables on hosting platform

## Performance Optimization

### Database
- Add indexes on frequently queried fields
- Use pagination for large result sets
- Cache user profiles

### Frontend
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Client-side caching with React hooks

### API
- Implement rate limiting
- Use database query optimization
- Monitor slow queries

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use HTTPS** - Required for production
3. **Validate all inputs** - Server-side validation mandatory
4. **Hash passwords** - Using bcryptjs
5. **Secure cookies** - `httpOnly` flag set
6. **CORS properly configured** - Only allow your domain
7. **Rate limiting** - Prevent abuse
8. **SQL Injection prevention** - Use Prisma (parameterized queries)

## Support & Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Better Auth Docs](https://www.better-auth.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
