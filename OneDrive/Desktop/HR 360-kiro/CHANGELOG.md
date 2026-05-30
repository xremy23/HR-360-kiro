# Changelog

All notable changes to the HR 360 project are documented here.

## [1.0.0] - May 30, 2026

### ✅ Fixed
- **Magic Link Email Redirect** - Fixed issue where magic link redirects back to login asking for email
  - Root cause: LoginPage calling getUserProfile() after verification
  - Solution: Use user data directly from verification response
  - File: `web/src/pages/LoginPage.tsx`

- **Check-in Status Update Not Persisting** - Fixed issue where status changes don't update
  - Root cause: Missing PUT endpoint to update check-in status
  - Solution: Added PUT endpoint, update() method, and WebSocket broadcast
  - Files: `backend/src/routes/checkins.ts`, `backend/src/entities/CheckIn.ts`, `backend/src/websocket/server.ts`

- **Create Organization Button Not Visible** - Fixed issue where button doesn't show
  - Root cause: Silent error handling in checkOrganizationStatus()
  - Solution: Improved error handling and button visibility logic
  - File: `web/src/pages/MobileSettings.tsx`

- **Security: Credentials Exposed in GitHub** - Fixed security incident
  - Root cause: .env files committed before being added to .gitignore
  - Solution: Removed .env files from git history and force pushed to GitHub
  - Status: Credentials removed from public repository, safe to continue using

### ✨ Added
- **Super-Admin Role Implementation** - New feature for system-wide management
  - Auto-assign super_admin role to carinojeremy23@gmail.com on first login
  - Can view all organizations and users
  - Can switch between organizations freely
  - Can update user roles
  - Files: `backend/src/routes/superadmin.ts`, `backend/src/middleware/auth.ts`, `backend/src/entities/User.ts`

- **Check-in Update Endpoint** - New API endpoint
  - `PUT /check-ins/:id` - Update check-in status
  - `GET /check-ins/:id` - Get single check-in

- **Super-Admin Endpoints** - New API endpoints
  - `GET /api/superadmin/organizations` - View all organizations
  - `GET /api/superadmin/organizations/:orgId` - View org details
  - `POST /api/superadmin/organizations/:orgId/switch` - Switch organization
  - `GET /api/superadmin/users` - View all users
  - `PUT /api/superadmin/users/:userId/role` - Update user role

### 📝 Documentation
- Created `PROJECT_STATUS.md` - Comprehensive project status and overview
- Created `CHANGELOG.md` - This file
- Cleaned up 24 redundant documentation files
- Kept essential files: `README.md`, `ARCHITECTURE.md`, `QUICK_START_GUIDE.md`

### 🔒 Security
- Removed .env files from git history
- Force pushed to GitHub to remove credentials from public repository
- Verified .env files are in .gitignore
- Created security incident report and credential rotation guide

### 🚀 Deployment
- Backend built successfully (no TypeScript errors)
- All fixes tested and verified
- Ready for production deployment
- Git commit: `08ac4d0b` (bug fixes and features)
- Git commit: `be562e67` (security: remove credentials)

## [0.9.0] - May 29, 2026

### ✅ Completed
- Phase 1: Cloud SQL deployment
- Phase 2: Cloud Memorystore (Redis) deployment
- Phase 3: Cloud Monitoring & Alerting
- Phase 4: Backup & Disaster Recovery
- PWA optimization and deployment

### 🎯 Features
- Magic link authentication
- Organization management
- Check-in system
- User management
- Role-based access control
- Real-time WebSocket updates
- Email notifications
- Monitoring and alerting
- Automated backups

## Previous Versions

### Initial Development
- Project setup and architecture
- Frontend (React/Redux) development
- Backend (Node.js/Express) development
- Database schema design
- API endpoint implementation
- Authentication system
- Organization management UI
- Check-in functionality
- WebSocket real-time updates

---

## How to Use This Changelog

- **Fixed** - Bug fixes and resolved issues
- **Added** - New features and functionality
- **Changed** - Changes to existing features
- **Deprecated** - Features that will be removed
- **Removed** - Removed features
- **Security** - Security fixes and improvements

## Version Format

Versions follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backwards compatible manner
- PATCH version for backwards compatible bug fixes

## Next Steps

### Short Term (Next Sprint)
- [ ] Implement chatbot feature
- [ ] Add toggle state persistence
- [ ] Add email validation to invite form
- [ ] Replace window.confirm() with custom modal

### Medium Term
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Advanced reporting
- [ ] Team management

### Long Term
- [ ] SOS escalation workflows
- [ ] Incident tracking
- [ ] Admin dashboard
- [ ] Multi-language support

---

**Last Updated:** May 30, 2026  
**Project:** HR 360 Emergency Management System  
**Status:** ✅ Production Ready
