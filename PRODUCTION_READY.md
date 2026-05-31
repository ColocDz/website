# ColocDZ - Production Ready Deployment Guide

## Quick Start for Production

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Hosting platform (Vercel, AWS, DigitalOcean, etc.)

### 1. Prepare Environment (5 minutes)
```bash
# Create production environment file
cp .env.example .env.local

# Edit with your production values
nano .env.local  # or vim, code, etc.
```

### 2. Required Environment Variables
```env
# Database (MongoDB Atlas)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/colocdz"

# Authentication
BETTER_AUTH_SECRET="your-generated-secret-here"
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 3. Setup Database (10 minutes)
```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with initial data (optional)
npm run db:seed
```

### 4. Build & Test (15 minutes)
```bash
# Build production bundle
npm run build

# Test production build locally
npm start

# Visit http://localhost:3000 and test core features
```

### 5. Deploy (varies by platform)

#### Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel deploy --prod

# Or connect GitHub repo in Vercel dashboard
```

#### Docker/Self-Hosted
```bash
# Build Docker image
docker build -t colocdz .

# Run container
docker run -e DATABASE_URL="..." -p 3000:3000 colocdz
```

#### AWS/DigitalOcean/Other
Follow platform-specific Next.js deployment guides

## Production Deployment Verification

After deployment, verify these critical functions:

### 1. Authentication ✓
- [ ] Signup with email/password works
- [ ] Login with email/password works
- [ ] Google OAuth works (if configured)
- [ ] Logout clears session
- [ ] Protected routes redirect to login

### 2. Posts ✓
- [ ] View all posts (public)
- [ ] Create post (authenticated + face verified)
- [ ] Edit own post
- [ ] Delete own post
- [ ] Search and filter posts
- [ ] Price displays correctly formatted
- [ ] Images display correctly

### 3. Messaging ✓
- [ ] Send message to another user
- [ ] View conversation list
- [ ] View conversation messages
- [ ] Archive conversation
- [ ] Mark as unread (if implemented)

### 4. User Profile ✓
- [ ] View profile
- [ ] Edit profile
- [ ] Upload avatar
- [ ] Face verification works
- [ ] Display user's posts

### 5. Comments ✓
- [ ] Post comment on post
- [ ] View comments
- [ ] See comment author details

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
│  - React components with Tailwind CSS               │
│  - Client-side state with hooks                     │
│  - Face detection (face-api.js)                     │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│              API Routes (Next.js API)               │
│  - /api/posts - Post management                     │
│  - /api/messages - Messaging                        │
│  - /api/user - Profile management                   │
│  - /api/phone-otp - Phone verification              │
│  - /api/auth - Authentication                       │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│          Authentication & Authorization             │
│  - Better Auth framework                            │
│  - Email/Password auth                              │
│  - OAuth2 (Google)                                  │
│  - Session management                               │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│             Database (MongoDB Atlas)                │
│  - Users, Posts, Conversations, Messages            │
│  - Comments, Sessions, Accounts                     │
│  - Soft-delete for archival                         │
└─────────────────────────────────────────────────────┘
```

## Database Schema

### Users
```javascript
{
  id: ObjectId,
  name: String,
  lastName: String,
  email: String (unique),
  phone: String,
  gender: String,
  birthday: Date,
  image: String,
  bio: String,
  wilaya: String,
  city: String,
  identityVerified: Boolean,
  faceVerified: Boolean,
  faceImage: String,
  isPrivate: Boolean,
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Posts
```javascript
{
  id: ObjectId,
  title: String,
  type: String (Apartment|House|Studio|Room|Shared Space),
  postType: String (offer|request),
  description: String,
  price: String,
  location: String,
  wilaya: String,
  bedrooms: Int,
  bathrooms: Int,
  amenities: String[],
  tags: String[],
  images: String[] (base64),
  status: String (published|draft),
  isArchived: Boolean,
  authorId: ObjectId (FK),
  createdAt: Date,
  updatedAt: Date
}
```

### Conversations & Messages
```javascript
// Conversation
{
  id: ObjectId,
  participantIds: ObjectId[],
  archivedBy: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}

// Message
{
  id: ObjectId,
  content: String,
  senderId: ObjectId (FK),
  conversationId: ObjectId (FK),
  createdAt: Date
}
```

## API Endpoints

### Public Endpoints
```
GET    /api/posts                    - List all published posts
GET    /api/posts/[id]               - Get post details
GET    /api/posts/[id]/comments      - Get post comments
```

### Protected Endpoints
```
POST   /api/posts                    - Create post
PUT    /api/posts/[id]               - Update post
DELETE /api/posts/[id]               - Delete post
POST   /api/posts/[id]/comments      - Add comment

GET    /api/messages                 - Get conversations
POST   /api/messages                 - Send message
GET    /api/messages/[conversationId] - Get messages
PATCH  /api/messages/[conversationId]/archive - Archive conversation

GET    /api/user                     - Get user profile
PUT    /api/user                     - Update profile
DELETE /api/user                     - Archive account

POST   /api/phone-otp/send           - Send verification code
POST   /api/phone-otp/verify         - Verify phone number

POST   /api/auth/[...all]            - Auth routes (Better Auth)
```

## Performance Optimization

### Frontend
```javascript
// Use Next.js Image component
import Image from 'next/image';
<Image src={url} alt="..." width={400} height={300} />

// Use dynamic imports for heavy components
const FaceVerification = dynamic(() => import('@/components/face-verification'));

// Use React.memo for expensive components
export default React.memo(PostCard);
```

### Database
```javascript
// Create indexes
db.Post.createIndex({ "authorId": 1, "createdAt": -1 });
db.Post.createIndex({ "wilaya": 1, "status": 1 });
db.Conversation.createIndex({ "participantIds": 1 });
db.Message.createIndex({ "conversationId": 1, "createdAt": -1 });
```

### API
```javascript
// Use pagination
const take = 10;
const skip = (page - 1) * take;
const posts = await prisma.post.findMany({ take, skip });
```

## Security Measures

✓ **Authentication**
- Email/password with bcrypt hashing
- OAuth2 integration
- Session management with secure cookies

✓ **Authorization**
- Protected API routes verify user ownership
- Face verification required for posting

✓ **Data Protection**
- Soft delete instead of hard delete
- Sensitive data not exposed in API
- Input validation on all endpoints

✓ **Network**
- HTTPS enforced
- CORS configured
- Security headers set

## Monitoring & Maintenance

### Database Backups
```bash
# MongoDB Atlas: Automated snapshots every 6 hours
# Manual backup
mongodump --uri="$DATABASE_URL" --out=./backup
```

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Monitor error rates
- Track user analytics

### Health Checks
```bash
# Test database connection
curl https://yourdomain.com/api/posts

# Test authentication
curl -H "Authorization: Bearer TOKEN" https://yourdomain.com/api/user
```

## Troubleshooting

### Connection Refused
```bash
# Check database credentials
echo "Testing: mongodb+srv://user:pass@cluster.mongodb.net/colocdz"

# Verify whitelist in MongoDB Atlas
# Add your IP to Network Access
```

### Build Fails
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
npm run build
```

### Face Detection Not Working
```bash
# Ensure face-api models in public/models/
# Check browser console for errors
# Verify camera permissions in browser
```

## Scaling Considerations

### If Traffic Increases:
1. **Database**: Upgrade MongoDB cluster tier
2. **API**: Add caching layer (Redis)
3. **Storage**: Migrate images to CDN (CloudFlare, AWS S3)
4. **Images**: Implement compression and optimization
5. **Monitoring**: Add observability tools

### If Database Grows:
1. Archive old posts (after 1 year)
2. Implement pagination everywhere
3. Add database indexes
4. Consider sharding if > 50GB

## Support & Resources

- Documentation: See files in this directory
  - `PRODUCTION_DEPLOYMENT.md` - Detailed deployment guide
  - `DATABASE_MIGRATION.md` - Database setup & migration
  - `PRODUCTION_CHECKLIST.md` - Pre-deployment checklist
  - `KNOWN_ISSUES.md` - Known issues & fixes
  
- External Resources:
  - [Next.js Docs](https://nextjs.org/docs)
  - [Prisma Docs](https://www.prisma.io/docs/)
  - [MongoDB Docs](https://docs.mongodb.com/)
  - [Better Auth Docs](https://www.better-auth.com/)

## Success Metrics

Your deployment is successful when:
- ✓ All pages load under 3 seconds
- ✓ API responses under 200ms
- ✓ Users can complete signup → post → message workflow
- ✓ Database connections are stable
- ✓ No console errors or warnings
- ✓ Face verification works smoothly
- ✓ Images display correctly
- ✓ Search and filtering work

**Estimated Time to Production: 30-45 minutes**

Good luck with your deployment! 🚀
