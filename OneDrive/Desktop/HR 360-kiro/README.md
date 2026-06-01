# HR 360 - Emergency Management System

A comprehensive Progressive Web App (PWA) for emergency management. Features real-time team check-ins, organization management, and role-based access control. Works on all devices including mobile, tablet, and desktop.

## 🎯 Key Features

### Core Features
- ✅ **Passwordless Authentication** - Magic link email authentication
- ✅ **Organization Management** - Create and manage organizations
- ✅ **Team Check-In System** - Real-time status updates with location tracking
- ✅ **Role-Based Access Control** - Admin, HR, Manager, Employee roles
- ✅ **Super-Admin Features** - System-wide management and organization switching
- ✅ **Real-Time Updates** - WebSocket-based instant notifications
- ✅ **Session Management** - Redis-backed session persistence
- ✅ **Automated Backups** - Daily backup with point-in-time recovery

### Advanced Features
- ✅ **Progressive Web App** - Works on iOS, Android, Desktop, Tablet
- ✅ **Responsive Design** - Mobile-first, works on all screen sizes
- ✅ **Cloud Infrastructure** - Google Cloud Run, Cloud SQL, Cloud Memorystore
- ✅ **Monitoring & Alerting** - Real-time system monitoring with alerts
- ✅ **Email Notifications** - Gmail SMTP integration for alerts
- ✅ **User Management** - Invite users, manage roles, remove members

## 📱 Platform Support

- ✅ **iOS** - Full PWA support (Safari 11.3+)
- ✅ **Android** - Full PWA support (Chrome, Firefox, Samsung Internet)
- ✅ **Desktop** - Full support (Chrome, Firefox, Edge, Safari)
- ✅ **Tablet** - Full support (iPad, Android tablets)

## 🏗️ Architecture

### Tech Stack

**Frontend (PWA)**
- React 18 + Redux Toolkit
- Vite build tool
- Tailwind CSS
- Axios HTTP client
- Socket.io for real-time updates

**Backend (API)**
- Node.js + Express.js
- TypeScript
- PostgreSQL database
- Redis cache
- Socket.io WebSocket server

**Infrastructure**
- Google Cloud Run (hosting)
- Cloud SQL (database)
- Cloud Memorystore (Redis)
- Cloud Monitoring (alerts)
- Cloud Storage (backups)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud account (for deployment)

### Installation

1. **Clone repository**
```bash
git clone https://github.com/xremy23/HR-360-kiro.git
cd HR-360-kiro
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run build
npm run dev
```

3. **Web App Setup**
```bash
cd web
npm install
npm run dev
```

### Access the Application
- **Web App**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 📚 Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current project status and features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and components
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Detailed setup instructions

## 🔐 Security

- ✅ Passwordless magic link authentication
- ✅ JWT tokens with 24-hour expiration
- ✅ Token blacklist for logout
- ✅ Role-based access control (RBAC)
- ✅ Session management with Redis
- ✅ HTTPS enforcement
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Brute-force protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Credentials in environment variables (not in code)

## 🌐 Internationalization

Currently English only. Multilingual support planned for future releases.

## 📊 Data Models

### User Roles
- **super_admin** - System-wide management, view all orgs and users
- **admin** - Organization management, user management
- **hr** - User management, incident review
- **manager** - Team check-in dashboard, team management
- **employee** - Check-in, profile management

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/send-magic-link` - Send magic link
- `POST /api/auth/verify-magic-link` - Verify magic link
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - Get user's organization
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/invite` - Invite user
- `DELETE /api/organizations/:id/members/:userId` - Remove user

### Check-Ins
- `POST /api/check-ins` - Submit check-in
- `PUT /api/check-ins/:id` - Update check-in status
- `GET /api/check-ins/:id` - Get check-in
- `GET /api/check-ins/history` - Get check-in history

### Super-Admin
- `GET /api/superadmin/organizations` - View all organizations
- `GET /api/superadmin/organizations/:orgId` - View org details
- `POST /api/superadmin/organizations/:orgId/switch` - Switch organization
- `GET /api/superadmin/users` - View all users
- `PUT /api/superadmin/users/:userId/role` - Update user role

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Web App
cd web
npm test
```

## 📦 Building

```bash
# Backend
cd backend
npm run build

# Web App
cd web
npm run build
```

## 🚢 Deployment

### Production URLs
- **Web App**: https://web-116253736511.us-central1.run.app
- **Backend API**: https://backend-116253736511.us-central1.run.app

### Deploy Backend
```bash
gcloud builds submit backend/ --tag gcr.io/hr-360-497706/backend
gcloud run deploy backend --image gcr.io/hr-360-497706/backend
```

### Deploy Web App
```bash
cd web && npm run build
gsutil -m cp -r dist/* gs://hr-360-web-app/
```

See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for detailed deployment instructions.

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact support team
- Check documentation

## 🗺️ Roadmap

### ✅ Completed (v1.0.0)
- Magic link authentication
- Organization management
- Check-in system
- Role-based access control
- Super-admin features
- Real-time WebSocket updates
- Cloud infrastructure
- Monitoring and alerting
- Automated backups

### 📋 Planned (v1.1.0)
- Chatbot feature
- Toggle state persistence
- Email validation on forms
- Custom confirmation modals
- Push notifications
- SMS notifications
- Advanced reporting
- Team management

### 🔮 Future (v2.0.0)
- SOS escalation workflows
- Incident tracking
- Admin dashboard
- Multi-language support
- Mobile app (native)

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)

## 📞 Contact & Support

For issues, questions, or suggestions:
- Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current status
- Review [CHANGELOG.md](./CHANGELOG.md) for recent changes
- See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for setup help
- Check logs: `gcloud run services logs read backend --region us-central1`

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Project:** HR 360 Emergency Management System  
**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** May 30, 2026
