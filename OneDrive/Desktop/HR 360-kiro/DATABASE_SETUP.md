# Database Setup Guide

This guide helps you set up PostgreSQL for the HR 360 Emergency Management PWA.

## Prerequisites

- PostgreSQL 14+ installed
- Database created
- User credentials ready

## Configuration

### 1. Update .env File

Edit `backend/.env` and set your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=hr360
```

**⚠️ SECURITY WARNING**: 
- Never commit `.env` to version control
- `.env` is in `.gitignore` - it will not be committed
- Keep your password secure and do not share it

### 2. Verify PostgreSQL Connection

Before running migrations, verify your PostgreSQL connection works.

#### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Create a new server connection
3. Use your credentials to connect
4. Verify you can see your database

#### Option B: Using Command Line
```bash
# Windows (if psql is in PATH)
psql -U postgres -h localhost -d postgres

# If psql is not in PATH, find it:
# Usually at: C:\Program Files\PostgreSQL\14\bin\psql.exe
```

### 3. Create Database (if not already created)

If you haven't created the database yet:

```sql
-- Connect as postgres user first
-- Then run:

CREATE DATABASE hr360;

-- Verify it was created
\l

-- Exit
\q
```

### 4. Run Migrations

Once your `.env` is configured and PostgreSQL is running:

```bash
cd backend

# Run migrations
npm run migrate:run

# Check migration status
npm run migrate:status
```

Expected output:
```
🚀 Starting database migrations...
✅ Migrations table initialized
✅ Migration 001_initial_schema.sql executed
✅ Migration 002_add_chat_messages.sql executed
✅ All migrations completed successfully
```

## Troubleshooting

### Error: "password authentication failed"

**Cause**: PostgreSQL is rejecting the password

**Solutions**:

1. **Verify password is correct**
   - Double-check the password in `.env`
   - Make sure there are no extra spaces
   - Check for special characters that might need escaping

2. **Check PostgreSQL authentication method**
   - On Windows, PostgreSQL might use Windows authentication
   - Try connecting without a password first
   - Check `pg_hba.conf` file (usually in PostgreSQL data directory)

3. **Verify PostgreSQL is running**
   - Windows: Check Services (services.msc) for PostgreSQL
   - Command: `pg_isready -h localhost -p 5432`

4. **Check database exists**
   - Verify the database name in `.env` matches your created database
   - Default database name: `hr360`

### Error: "database does not exist"

**Solution**: Create the database first

```sql
CREATE DATABASE hr360;
```

### Error: "connection refused"

**Cause**: PostgreSQL is not running or not listening on the specified port

**Solutions**:

1. **Start PostgreSQL**
   - Windows: `net start postgresql-x64-14` (or your version)
   - macOS: `brew services start postgresql@14`
   - Linux: `sudo systemctl start postgresql`

2. **Check port**
   - Verify PostgreSQL is listening on port 5432
   - Check `.env` for correct port number

3. **Check host**
   - Verify `DB_HOST` is correct (usually `localhost` or `127.0.0.1`)

### Error: "permission denied"

**Cause**: User doesn't have permission to create tables

**Solution**: Grant privileges to user

```sql
-- Connect as postgres superuser
-- Then run:

ALTER USER postgres WITH SUPERUSER;

-- Or create a new user with proper privileges
CREATE USER app_user WITH PASSWORD 'secure_password';
ALTER ROLE app_user SET client_encoding TO 'utf8';
ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE hr360 TO app_user;
```

## Verification

After successful migration, verify the database schema:

```bash
# Connect to database
psql -U postgres -h localhost -d hr360

# List tables
\dt

# Expected tables:
# - users
# - organizations
# - alerts
# - check_ins
# - incidents
# - sos_escalations
# - kb_guides
# - kb_categories
# - guide_acknowledgments
# - notifications
# - alert_recipients
# - incident_updates
# - escalation_contacts

# Exit
\q
```

## Next Steps

1. ✅ Configure `.env` with PostgreSQL credentials
2. ✅ Verify PostgreSQL connection
3. ✅ Run migrations
4. ⏳ Start backend server: `npm run dev`
5. ⏳ Test API endpoints
6. ⏳ Build frontend components

## Database Schema

The migrations create the following tables:

### Core Tables
- `users` - User accounts
- `organizations` - Organizations/Companies
- `sessions` - User sessions (Redis-backed)

### Phase 2 Tables
- `kb_guides` - Knowledge base articles
- `kb_categories` - KB categories
- `guide_acknowledgments` - User guide acknowledgments
- `alerts` - Emergency alerts
- `alert_recipients` - Alert delivery tracking
- `notifications` - User notifications
- `check_ins` - Employee check-ins
- `incidents` - Incident records
- `incident_updates` - Incident timeline
- `sos_escalations` - SOS records
- `escalation_contacts` - Emergency contacts

See `backend/src/migrations/001_initial_schema.sql` for complete schema details.

## Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use strong passwords** - At least 12 characters with mixed case, numbers, symbols
3. **Limit user privileges** - Don't use superuser for application
4. **Rotate passwords regularly** - Change database password periodically
5. **Use environment variables** - Never hardcode credentials in code
6. **Backup database** - Regular backups of production database
7. **Monitor access** - Check PostgreSQL logs for unauthorized access attempts

## Support

If you encounter issues:

1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\14\data\log\`
2. Verify `.env` configuration
3. Test connection with pgAdmin
4. Check PostgreSQL is running and accessible
5. Review error messages carefully

---

**Last Updated**: June 1, 2026  
**Status**: Database setup guide for Phase 2 development
