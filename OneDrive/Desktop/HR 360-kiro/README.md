# HR 360 - Emergency Management PWA

A modern, minimalistic Progressive Web App for emergency management and crisis response. Provides real-time communication, location tracking, incident management, and offline-first capabilities for organizations.

**Status**: ✅ Phase 1 Complete - Build Pipeline Working  
**Last Updated**: June 1, 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd HR 360-kiro

# Backend setup
cd backend
npm install
npm run build

# Frontend setup
cd ../web
npm install
npm run build
```

### Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd web
npm run dev
```

Backend runs on `http://localhost:3000`  
Frontend runs on `http://localhost:5173`

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide for all platforms
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Design specifications and guidelines
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[API.md](./API.md)** - API endpoints documentation
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guidelines and best practices

---

## 🏗️ Project Structure

```
HR 360-kiro/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Database & security config
│   │   ├── entities/       # Data models
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers & validators
│   │   ├── migrations/     # Database migrations
│   │   └── server.ts       # Express app
│   ├── dist/               # Compiled output
│   └── package.json
│
├── web/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & PWA services
│   │   ├── store/          # Redux state management
│   │   ├── utils/          # Helpers
│   │   └── App.tsx         # Main app
│   ├── dist/               # Built output
│   └── package.json
│
├── mobile/                  # React Native (future)
└── docs/                    # Additional documentation
```

---

## 🎯 Features

### Phase 1 - Foundation (✅ Complete)
- ✅ Magic link authentication
- ✅ User and organization management
- ✅ Role-based access control
- ✅ Modern minimalistic design system
- ✅ Protected routes and middleware
- ✅ Error handling and logging

### Phase 2 - Core Features (In Progress)
- ⏳ Knowledge Base (KB) management
- ⏳ Alert system and notifications
- ⏳ Check-in functionality
- ⏳ Incident management
- ⏳ SOS and escalation
- ⏳ Offline support (Service Workers, IndexedDB)

### Phase 3 - Advanced Features (Planned)
- Mobile app (React Native)
- Advanced analytics
- Integration with external services
- Multi-language support

---

## 🔐 Security

- JWT authentication with 7-day expiration
- Role-based access control (RBAC)
- Token blacklist support
- Session management with Redis
- Input validation and sanitization
- Rate limiting on auth endpoints
- CORS configuration
- Helmet.js for security headers

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: JWT
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Redux
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Custom (minimalistic design)

### DevOps
- **Deployment**: Google Cloud Run
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Cloud Memorystore (Redis)
- **Monitoring**: Cloud Logging & Monitoring

---

## 📊 Build Status

### Backend
```
✅ npm run build - SUCCESS
- TypeScript compilation: 0 errors
- Ready for deployment
```

### Frontend
```
✅ npm run build - SUCCESS
- Vite build: 180 modules
- CSS: 29.97 kB (gzip: 5.80 kB)
- JS: 359.35 kB (gzip: 108.23 kB)
```

---

## 🚀 Deployment

### Google Cloud Run

```bash
# Build and deploy backend
cd backend
gcloud run deploy hr360-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and deploy frontend
cd ../web
gcloud run deploy hr360-web \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/send-magic-link` - Send magic link
- `POST /api/auth/verify-magic-link` - Verify magic link
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/validate` - Validate token

### Users
- `GET /api/users/profile` - Get current user
- `PUT /api/users/profile` - Update current user
- `GET /api/users` - List organization users
- `GET /api/users/:id` - Get user by ID (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Organizations
- `POST /api/org` - Create organization
- `GET /api/org` - Get current organization
- `GET /api/org/:id` - Get organization by ID (admin)
- `PUT /api/org` - Update organization (admin)
- `GET /api/org/stats` - Get organization stats

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../web
npm test

# E2E tests
npm run test:e2e
```

---

## 📖 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Git Workflow
- Create feature branches from `main`
- Use conventional commits
- Create pull requests for review
- Merge after approval

### Database Migrations
```bash
# Run migrations
npm run migrate:run

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:create
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎯 Next Steps

1. **Database Setup** - Run PostgreSQL migrations
2. **Endpoint Testing** - Test auth and user management endpoints
3. **Integration Testing** - Write unit and integration tests
4. **Phase 2 Development** - Begin core features implementation

---

**Last Updated**: June 1, 2026  
**Status**: ✅ Phase 1 Complete - Ready for Phase 2

