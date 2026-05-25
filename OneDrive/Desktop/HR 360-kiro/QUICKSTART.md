# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Git installed

### 1. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd emergency-app

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Install web dependencies
cd ../web
npm install
```

### 2. Database Setup

```bash
# Create database
createdb emergency_app

# Run migrations (from backend directory)
cd backend
npm run migrate
```

### 3. Environment Configuration

**Backend** - Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=emergency_app
JWT_SECRET=your_secret_key_here
API_PORT=3000
NODE_ENV=development
```

**Mobile** - Create `mobile/.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
```

**Web** - Create `web/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npm start
# Press 'a' for Android or 'i' for iOS
```

**Terminal 3 - Web:**
```bash
cd web
npm run dev
# Runs on http://localhost:5173
```

## Project Structure

```
emergency-app/
├── mobile/          # React Native app (Expo)
├── backend/         # Node.js/Express API
├── web/             # React admin console
├── docs/            # Documentation
└── README.md        # Full documentation
```

## Key Files to Know

### Mobile
- `mobile/src/services/` - Core business logic
- `mobile/src/store/` - Redux state management
- `mobile/src/types/` - TypeScript definitions
- `mobile/src/i18n/` - Translations

### Backend
- `backend/src/config/database.ts` - Database setup
- `backend/src/types/` - API types
- `backend/src/routes/` - API endpoints (to be implemented)

### Web
- `web/src/pages/` - Admin pages (to be implemented)
- `web/src/services/` - API services (to be implemented)

## Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm test             # Run tests
npm run lint         # Run linter
```

### Mobile
```bash
npm start            # Start Expo
npm run android      # Build for Android
npm run ios          # Build for iOS
npm test             # Run tests
npm run lint         # Run linter
```

### Web
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run linter
```

## Testing the App

### 1. Test Authentication
- Open mobile app
- Enter email: `test@example.com`
- Check console for verification code (in dev mode)
- Enter code to verify

### 2. Test Offline Mode
- Submit a check-in
- Toggle offline mode
- Check that data is stored locally
- Go online and verify sync

### 3. Test KB
- View knowledge base guides
- Search for guides
- Read guide content

### 4. Test Check-In
- Submit check-in with status
- View check-in history
- See team check-ins (if manager)

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -d emergency_app

# If database doesn't exist, create it
createdb emergency_app

# Run migrations
npm run migrate
```

### Port Already in Use
```bash
# Backend (3000)
lsof -i :3000
kill -9 <PID>

# Web (5173)
lsof -i :5173
kill -9 <PID>
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Expo Issues
```bash
# Clear Expo cache
expo start --clear

# Reset Expo
expo start -c
```

## Next Steps

1. **Read Documentation**
   - [README.md](./README.md) - Full project overview
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md) - Offline implementation

2. **Implement Features**
   - Start with mobile screens
   - Implement backend routes
   - Connect frontend to backend

3. **Test Thoroughly**
   - Unit tests
   - Integration tests
   - Offline scenarios

4. **Deploy**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Set up CI/CD
   - Configure monitoring

## Development Tips

### Mobile Development
- Use React Native debugger for better debugging
- Test on actual device for offline scenarios
- Use Expo Go app for quick testing

### Backend Development
- Use Postman or Insomnia for API testing
- Check database with pgAdmin or psql
- Monitor logs for errors

### Web Development
- Use React DevTools browser extension
- Test responsive design
- Check console for errors

## API Testing

### Using cURL
```bash
# Send verification email
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify email
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Using Postman
1. Import API collection from `docs/API.md`
2. Set environment variables
3. Test endpoints

## Database Inspection

```bash
# Connect to database
psql -U postgres -d emergency_app

# List tables
\dt

# View table structure
\d users

# Query data
SELECT * FROM users;
```

## Performance Monitoring

### Backend
- Check response times in console
- Monitor database queries
- Use `npm run lint` to check code quality

### Mobile
- Use React Native Debugger
- Monitor memory usage
- Check frame rate

### Web
- Use Chrome DevTools
- Check network requests
- Monitor performance

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Set CORS_ORIGIN correctly
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Validate all inputs
- [ ] Sanitize database queries
- [ ] Use HTTPS for API calls

## Useful Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

1. Check documentation files
2. Review code comments
3. Check error messages in console
4. Search GitHub issues
5. Ask team members

## What's Implemented

✅ Project structure
✅ Database schema
✅ Type definitions
✅ Authentication service
✅ Database service
✅ Sync service
✅ Redux store
✅ Translations (EN/FIL)
✅ API documentation
✅ Architecture documentation

## What Needs Implementation

⏳ Mobile screens
⏳ Backend routes
⏳ Web console pages
⏳ Advanced features (SOS, location-aware, biometric)
⏳ Testing
⏳ Deployment

## Estimated Timeline

- **Week 1-2**: Core mobile screens + backend routes
- **Week 3-4**: Web console + integration
- **Week 5-6**: Advanced features
- **Week 7-8**: Testing + deployment

---

**Happy coding! 🚀**

For detailed information, see [README.md](./README.md)
