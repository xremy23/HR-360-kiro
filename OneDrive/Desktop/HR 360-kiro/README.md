# Emergency Management Mobile App

A comprehensive, offline-capable emergency management platform for organizations. Features real-time team check-ins, knowledge base management, alert broadcasting, and SOS escalation.

## 🎯 Key Features

### Core Features
- **Email-based Authentication** - Secure sign-in with email verification
- **Offline-First Architecture** - All critical functions work without internet
- **Team Check-In System** - Safe/Need Help/SOS status with location tracking
- **Knowledge Base** - General and org-specific emergency guides with version history
- **Contact Management** - Personal, hotline, and location-aware emergency contacts
- **To-Go Bag Checklist** - Customizable emergency preparedness checklist
- **Alert Broadcasting** - Real-time emergency alerts with severity levels
- **Incident Logging** - Complete audit trail of all incidents and responses

### Advanced Features
- **SOS Escalation** - Automatic notification chain (manager → contacts → team)
- **Drill Mode** - Practice drills with separate logging
- **Location-Aware Contacts** - Auto-populate nearby hospitals, fire stations, police
- **Biometric Security** - Face ID/fingerprint for sensitive data
- **Multilingual Support** - English and Filipino (Tagalog)
- **Admin Dashboard** - Web console for KB, org, and user management
- **Manager Dashboard** - Mobile check-in status for team members
- **Guide Acknowledgment** - Track required reading compliance
- **Offline Maps** - Cached evacuation maps and building layouts
- **Media in Guides** - Images and videos cached for offline access

## 📱 Platform Support

- **Android** - Primary platform (Expo)
- **iOS** - Full support (Expo)
- **Web** - Admin/HR console (React + Vite)

## 🏗️ Architecture

### Three-Tier System

```
Mobile App (React Native)
    ↓
Backend API (Node.js/Express)
    ↓
Web Console (React)
```

### Offline-First Design
- SQLite for local data storage
- Automatic sync queue
- Conflict resolution
- Network status monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Expo CLI (for mobile)

### Installation

1. **Clone repository**
```bash
git clone <repo-url>
cd emergency-app
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev
```

3. **Mobile Setup**
```bash
cd mobile
npm install
npm start
```

4. **Web Console Setup**
```bash
cd web
npm install
npm run dev
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and components
- **[OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md)** - Offline-first implementation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[API.md](./docs/API.md)** - API endpoint documentation

## 🔐 Security

- Email verification for authentication
- JWT tokens with refresh rotation
- Role-based access control (Admin, HR, Employee, Manager)
- Biometric re-authentication
- Encrypted sensitive data
- HTTPS enforcement
- Rate limiting
- CORS protection

## 🌐 Internationalization

- **English** - Default language
- **Filipino (Tagalog)** - Full translation

Add more languages by creating translation files in `mobile/src/i18n/`

## 📊 Data Models

### User Roles
- **Admin** - Full system access, KB management, org management
- **HR** - User management, incident review, compliance tracking
- **Manager** - Team check-in dashboard, team management
- **Employee** - Check-in, KB access, personal contacts

### Emergency Types
- Typhoon
- Earthquake
- Volcanic Eruption
- Flash Floods
- Fire
- Tornado
- Data Breach
- Intruder
- Active Threat
- Workplace Violence

### Check-In Status
- **Safe** - User is safe
- **Need Help** - User needs assistance
- **SOS** - Critical emergency, triggers escalation

### Alert Severity
- **Advisory** - Informational
- **Watch** - Heightened awareness
- **Emergency** - Immediate action required

## 🔄 Sync Strategy

### Automatic Sync
- On app launch
- When connection restored
- Every 30 seconds when online
- Background sync (if supported)

### Manual Sync
- Pull-to-refresh
- Sync button in settings
- Force sync on demand

### Sync Priority
1. SOS escalations (immediate)
2. Check-ins (high)
3. Contacts (medium)
4. To-go bag items (low)

## 📱 Mobile Features

### Screens
- **Auth** - Login, verification, org onboarding
- **Home** - Quick actions, recent alerts, team status
- **Check-In** - Status submission, location, notes
- **Knowledge Base** - Search, browse, read guides
- **Contacts** - Personal, hotlines, location-based
- **To-Go Bag** - Checklist management
- **Alerts** - View and manage alerts
- **Settings** - Profile, language, biometric, notifications
- **Admin** - KB management, org management, alerts, drills, incidents

### Offline Capabilities
- ✅ View KB guides
- ✅ Submit check-in
- ✅ Trigger SOS
- ✅ Manage contacts
- ✅ Manage to-go bag
- ✅ View check-in history
- ✅ View offline maps
- ✅ Read cached alerts

## 🌐 Web Console Features

### Admin Functions
- KB guide management (create, edit, delete, version history)
- Organization structure (teams, departments)
- User management (roles, permissions)
- Alert broadcasting
- Drill mode management
- Incident logging and review

### HR Functions
- User profile management
- Team management
- Incident review
- Compliance tracking
- Guide acknowledgment tracking

### Manager Functions
- Team check-in dashboard
- Team member status
- Incident history
- Team management

## 🗄️ Database

### PostgreSQL Tables
- users
- organizations
- teams
- departments
- kb_guides
- kb_guide_versions
- check_ins
- alerts
- alert_notifications
- contacts
- tobag_items
- incidents
- sos_escalations
- offline_maps
- guide_acknowledgments

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-verification` - Send verification email
- `POST /api/auth/verify-email` - Verify and create session
- `POST /api/auth/join-org` - Join organization
- `POST /api/auth/refresh-token` - Refresh JWT

### Check-Ins
- `POST /api/check-ins` - Submit check-in
- `GET /api/check-ins/team/:teamId` - Get team check-ins
- `GET /api/check-ins/history` - Get user history

### Knowledge Base
- `GET /api/kb/guides` - Get guides
- `POST /api/kb/guides` - Create guide (admin)
- `PUT /api/kb/guides/:id` - Update guide (admin)
- `DELETE /api/kb/guides/:id` - Delete guide (admin)

### Alerts
- `GET /api/alerts` - Get alerts
- `POST /api/alerts/broadcast` - Broadcast alert (admin)
- `PUT /api/alerts/:id/notifications/:nId` - Mark as read

### SOS
- `POST /api/sos` - Trigger SOS
- `GET /api/sos/escalations` - Get escalations (admin)

See [API.md](./docs/API.md) for complete documentation.

## 🧪 Testing

### Mobile
```bash
cd mobile
npm test
```

### Backend
```bash
cd backend
npm test
```

### Web
```bash
cd web
npm test
```

## 📦 Building

### Mobile APK
```bash
cd mobile
eas build --platform android --type apk
```

### Mobile iOS
```bash
cd mobile
eas build --platform ios
```

### Web
```bash
cd web
npm run build
```

### Backend
```bash
cd backend
npm run build
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy
```bash
# Backend
docker build -t emergency-app-backend backend/
docker run -d -p 3000:3000 emergency-app-backend

# Web
cd web && npm run build
# Deploy dist/ to CDN

# Mobile
eas build --platform android
eas submit --platform android
```

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

### Phase 1 (Current)
- ✅ Core authentication
- ✅ Offline-first architecture
- ✅ Basic KB and check-in
- ✅ Contact management
- ✅ To-go bag

### Phase 2
- 🔄 Alert broadcasting
- 🔄 Admin console
- 🔄 Drill mode
- 🔄 Incident logging

### Phase 3
- 📋 SOS escalation
- 📋 Location-aware contacts
- 📋 Biometric security
- 📋 Multilingual support

### Phase 4
- 📋 Manager dashboard
- 📋 Guide acknowledgment
- 📋 Offline maps
- 📋 Media in guides

### Phase 5
- 📋 Advanced analytics
- 📋 Compliance reporting
- 📋 Integration APIs
- 📋 Mobile web version

## 🎓 Learning Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

## 📞 Contact

- **Project Lead**: [Your Name]
- **Email**: support@emergencyapp.com
- **Website**: https://emergencyapp.com

---

**Last Updated**: May 2026
**Version**: 1.0.0
