# ColocDZ - Migration & Setup Guide

## Database Migration from Development to Production

### Step 1: Export Current Data (if needed)
```bash
# Use MongoDB Atlas Data Export (GUI) or mongodump
mongodump --uri="mongodb+srv://user:pass@dev-cluster.mongodb.net/colocdz" --out=./backup
```

### Step 2: Create Production Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster for production
3. Configure network access (whitelist production server IP)
4. Create database user for production
5. Get connection string

### Step 3: Update Prisma Schema (if needed)
```bash
# Schema is already production-ready
# Review prisma/schema.prisma to ensure all models are correct
cat prisma/schema.prisma
```

### Step 4: Initialize Production Database
```bash
# Set production DATABASE_URL in .env.local
export DATABASE_URL="mongodb+srv://prod-user:prod-pass@prod-cluster.mongodb.net/colocdz"

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Run seed (optional - adds initial data)
npm run db:seed
```

## Application Setup

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Environment Configuration
Create `.env.local` with production values:
```bash
# Copy template
cp .env.example .env.local

# Edit with your production values
vim .env.local
```

### Step 3: Build Application
```bash
npm run build
```

### Step 4: Test Production Build Locally
```bash
npm start
# Visit http://localhost:3000
```

### Step 5: Deploy to Hosting
Deploy built application to your hosting platform (Vercel, AWS, etc.)

## Data Integrity Checks

### Verify Database Connection
```bash
npx prisma db execute --stdin << EOF
db.adminCommand({ ping: 1 })
EOF
```

### Check Collections Created
```bash
npx prisma studio  # Opens GUI to inspect data
```

### Verify Indexes
```javascript
db.User.getIndexes()
db.Post.getIndexes()
db.Conversation.getIndexes()
db.Message.getIndexes()
db.Comment.getIndexes()
```

## Initial Data Setup

### Option 1: Run Seed Script
```bash
npm run db:seed
```
This will create:
- Test users
- Sample posts
- Test conversations

### Option 2: Manual Setup
1. Go to https://yourdomain.com/signup
2. Create test accounts
3. Create sample posts
4. Test messaging between accounts

## Verification Steps

### Critical Path Testing
1. [ ] User can sign up with email/password
2. [ ] User can login with email/password
3. [ ] User can view all posts without login
4. [ ] User must verify face to create posts
5. [ ] Authenticated user can create posts
6. [ ] Users can edit their own posts
7. [ ] Users can delete their own posts
8. [ ] Users can send messages
9. [ ] Users can view conversations
10. [ ] Users can archive conversations
11. [ ] Users can view comments
12. [ ] Users can post comments
13. [ ] User profile displays correct data
14. [ ] User can update profile
15. [ ] Search and filtering works

### API Endpoint Testing
```bash
# Get all posts
curl https://yourdomain.com/api/posts

# Create post (requires auth)
curl -X POST https://yourdomain.com/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...}'

# Send message
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...}'
```

## Troubleshooting

### Database Connection Failed
**Problem**: `Error: connect ECONNREFUSED` or `MongoAuthenticationError`

**Solution**:
1. Verify DATABASE_URL is correct
2. Check MongoDB Atlas network access whitelist
3. Ensure user credentials are correct
4. Test connection: `npx prisma db execute --stdin < /dev/null`

### Build Errors
**Problem**: `Error: Could not find prisma client`

**Solution**:
```bash
npx prisma generate
npm run build
```

### Face Verification Not Working
**Problem**: Face detection fails or not processing

**Solution**:
1. Install face-api.js models: `npm install face-api.js`
2. Download model files to `public/models/`
3. Verify models are accessible
4. Check browser console for errors

### Images Not Displaying
**Problem**: Image 404s or not showing

**Solution**:
1. Images stored as base64 in database (working but inefficient for production)
2. For production, recommend external storage:
   - AWS S3
   - Cloudinary
   - Google Cloud Storage
3. Update image handling in components

### Authentication Issues
**Problem**: Users can't login or session not persisting

**Solution**:
1. Clear browser cookies
2. Verify BETTER_AUTH_SECRET is set
3. Check session storage in database
4. Verify HTTPS on production (required for secure cookies)

### Rate Limiting Issues
**Problem**: API rate limits being hit too quickly

**Solution**:
1. Implement rate limiting middleware
2. Add caching layer (Redis)
3. Use CDN for static content
4. Monitor API usage

## Performance Optimization

### Database
- Create indexes on frequently queried fields:
```javascript
db.Post.createIndex({ "authorId": 1 })
db.Post.createIndex({ "createdAt": -1 })
db.Post.createIndex({ "wilaya": 1, "status": 1 })
db.Conversation.createIndex({ "participantIds": 1 })
db.Message.createIndex({ "conversationId": 1, "createdAt": -1 })
db.Comment.createIndex({ "postId": 1, "createdAt": -1 })
```

### Application
- Enable image optimization
- Use pagination for lists
- Implement client-side caching
- Use service workers

### Infrastructure
- Use CDN for static files
- Enable gzip compression
- Set cache headers
- Monitor and optimize slow queries

## Monitoring & Maintenance

### Set Up Logging
- Configure error tracking (Sentry, LogRocket)
- Monitor API performance
- Track user analytics

### Backup Strategy
```bash
# Daily backups (using MongoDB Atlas)
# Verify backup schedule in Atlas console
# Test restore procedure
```

### Database Maintenance
```bash
# Monitor database size
db.adminCommand({ dbstats: 1 })

# Clean up old sessions monthly
db.Session.deleteMany({ expiresAt: { $lt: new Date() } })
```

## Security Checklist (Post-Deployment)

- [ ] HTTPS enabled on all routes
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Sensitive data not in logs
- [ ] Regular security audits scheduled
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting active
- [ ] User data encryption at rest
- [ ] SSL certificate valid and up to date
