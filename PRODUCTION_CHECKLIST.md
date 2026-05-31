# Production Deployment Checklist

## Prerequisites
- [ ] MongoDB Atlas database setup and connection verified
- [ ] Environment variables configured (.env.local created from .env.example)
- [ ] SSL certificate configured (HTTPS required for production)

## Environment Configuration
- [ ] `DATABASE_URL` set to production MongoDB connection string
- [ ] `BETTER_AUTH_SECRET` set to a strong random secret (min 32 characters)
- [ ] `BETTER_AUTH_URL` set to production domain (HTTPS)
- [ ] `NEXT_PUBLIC_BASE_URL` set to production domain
- [ ] Google OAuth credentials configured (if using social login)
- [ ] Twilio credentials configured (if using SMS verification)

## Security Checks
- [ ] HTTPS enabled on all routes
- [ ] CORS headers properly configured
- [ ] Authentication tokens not exposed in logs
- [ ] Sensitive data not stored in browser localStorage (use secure cookies)
- [ ] API rate limiting implemented
- [ ] SQL injection/NoSQL injection protections in place
- [ ] CSRF tokens implemented

## Database
- [ ] Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Database indexes created for frequently queried fields
- [ ] Backup strategy implemented
- [ ] User archival instead of hard delete implemented (soft delete)
- [ ] No test/temporary data in production database

## API Routes
- [ ] All endpoints return proper HTTP status codes
- [ ] Error messages don't expose sensitive information
- [ ] Input validation on all POST/PUT requests
- [ ] Authorization checks on protected routes
- [ ] Rate limiting on authentication endpoints

## Frontend
- [ ] Prices display correctly as formatted numbers (not raw strings)
- [ ] All user data fetched from database, not hardcoded
- [ ] Images optimized and properly cached
- [ ] Loading states handled for all async operations
- [ ] Error messages user-friendly

## Authentication Flow
- [ ] Email/password registration working
- [ ] Email/password login working
- [ ] Google OAuth working
- [ ] Session persistence working
- [ ] Logout clears all tokens
- [ ] Protected routes redirect to login
- [ ] Face verification flow working

## File Uploads
- [ ] Image upload limits enforced (20 images max per post)
- [ ] File type validation (images only)
- [ ] Image storage solution configured
- [ ] No sensitive data in uploaded files

## Testing
- [ ] All API endpoints tested with real database data
- [ ] Edge cases handled (missing data, invalid IDs, etc.)
- [ ] Error responses tested
- [ ] Concurrent operations tested (multiple users)

## Monitoring & Logging
- [ ] Error logging configured
- [ ] Performance monitoring configured
- [ ] User analytics configured
- [ ] Email alerts for critical errors configured

## Deployment
- [ ] Build process tested: `npm run build`
- [ ] No build errors or warnings
- [ ] Production environment variables set on hosting platform
- [ ] Database backups scheduled
- [ ] Monitoring and alerting active

## Post-Deployment
- [ ] All pages load without errors
- [ ] Database operations working
- [ ] Authentication flow tested
- [ ] File uploads working
- [ ] Messaging system working
- [ ] Profile management working
- [ ] Search and filtering working
- [ ] Comments working
