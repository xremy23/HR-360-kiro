# Development Guide - HR 360 Emergency Management PWA

Guidelines, best practices, and development workflows.

---

## Code Style & Standards

### TypeScript

- Use strict mode
- Avoid `any` types
- Use interfaces for object shapes
- Use enums for constants
- Use generics for reusable code

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'employee' | 'guest';
}

function getUser<T extends User>(id: string): Promise<T> {
  // implementation
}

// ❌ Bad
function getUser(id: string): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Use custom hooks for logic reuse

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};

// ❌ Bad
const Button = ({ label, onClick, variant }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

### Express Routes

- Use async/await
- Handle errors properly
- Validate input
- Use middleware for cross-cutting concerns

```typescript
// ✅ Good
router.post('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email, firstName } = req.body;
    
    // Validate input
    if (!email || !firstName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Business logic
    const user = await userService.createUser({ email, firstName });
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ❌ Bad
router.post('/users', (req, res) => {
  const user = userService.createUser(req.body);
  res.json(user);
});
```

### Naming Conventions

- **Files**: kebab-case (user-service.ts)
- **Classes**: PascalCase (UserService)
- **Functions**: camelCase (getUserById)
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRIES)
- **Interfaces**: PascalCase with I prefix (IUser) or without (User)
- **Enums**: PascalCase (UserRole)

---

## Git Workflow

### Branch Naming

```
feature/description          # New feature
bugfix/description           # Bug fix
hotfix/description           # Production hotfix
refactor/description         # Code refactoring
docs/description             # Documentation
chore/description            # Maintenance tasks
```

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build, dependencies, etc.

**Examples**:
```
feat(auth): add magic link authentication
fix(users): prevent self-deletion
docs(setup): add PostgreSQL installation guide
refactor(services): extract common logic
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Request review
6. Address feedback
7. Merge after approval

---

## Testing

### Unit Tests

Test individual functions and services:

```typescript
// userService.test.ts
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'test-id';
      const mockUser = { id: userId, email: 'test@example.com' };
      
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);
      
      const result = await userService.getUserById(userId);
      
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(null);
      
      const result = await userService.getUserById('nonexistent');
      
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
// auth.test.ts
describe('POST /api/auth/send-magic-link', () => {
  it('should send magic link email', async () => {
    const response = await request(app)
      .post('/api/auth/send-magic-link')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should return error for invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/send-magic-link')
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- userService.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Database Migrations

### Creating Migrations

```bash
npm run migrate:create
```

This creates a new migration file in `src/migrations/`.

### Migration Template

```typescript
// src/migrations/003_add_user_phone.ts
export async function up(db: Database): Promise<void> {
  await db.query(`
    ALTER TABLE users
    ADD COLUMN phone VARCHAR(20);
  `);
}

export async function down(db: Database): Promise<void> {
  await db.query(`
    ALTER TABLE users
    DROP COLUMN phone;
  `);
}
```

### Running Migrations

```bash
# Run all pending migrations
npm run migrate:run

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback
```

---

## API Development

### Creating New Endpoints

1. **Create Service Method**

```typescript
// userService.ts
async getUsersByDepartment(departmentId: string): Promise<User[]> {
  const query = `
    SELECT * FROM users
    WHERE department_id = $1 AND is_active = true
    ORDER BY first_name, last_name
  `;
  const result = await db.query(query, [departmentId]);
  return result.rows;
}
```

2. **Create Route Handler**

```typescript
// routes/users.ts
router.get(
  '/department/:departmentId',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { departmentId } = req.params;
      const users = await userService.getUsersByDepartment(departmentId);
      
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
);
```

3. **Add Tests**

```typescript
// routes/__tests__/users.test.ts
describe('GET /api/users/department/:departmentId', () => {
  it('should return users in department', async () => {
    const response = await request(app)
      .get('/api/users/department/dept-123')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### API Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* optional */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "statusCode": 400
}
```

---

## Frontend Development

### Creating New Pages

1. **Create Page Component**

```typescript
// pages/IncidentsPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { apiService } from '../services/apiService';

const IncidentsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await apiService.get('/incidents');
        setIncidents(response.data);
      } catch (error) {
        console.error('Failed to fetch incidents', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="incidents-page">
      <h1>Incidents</h1>
      {/* Page content */}
    </div>
  );
};

export default IncidentsPage;
```

2. **Add Route**

```typescript
// AppRouter.tsx
<Route path="/incidents" element={<IncidentsPage />} />
```

3. **Add Tests**

```typescript
// pages/__tests__/IncidentsPage.test.tsx
describe('IncidentsPage', () => {
  it('should render incidents list', async () => {
    const { getByText } = render(<IncidentsPage />);
    
    await waitFor(() => {
      expect(getByText('Incidents')).toBeInTheDocument();
    });
  });
});
```

### Creating Custom Hooks

```typescript
// hooks/useIncidents.ts
import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Incident {
  id: string;
  title: string;
  status: string;
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await apiService.get('/incidents');
        setIncidents(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  return { incidents, loading, error };
}
```

---

## Performance Optimization

### Backend

- Use database indexes for frequently queried columns
- Implement pagination for large datasets
- Cache frequently accessed data in Redis
- Use connection pooling for database
- Optimize database queries

### Frontend

- Code splitting with React.lazy()
- Image optimization
- Lazy load components
- Memoize expensive computations
- Use production builds

```typescript
// Code splitting
const AdminConsole = React.lazy(() => import('./pages/AdminConsole'));

// Memoization
const MemoizedComponent = React.memo(MyComponent);

// useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

---

## Debugging

### Backend Debugging

```bash
# Run with debugging
node --inspect-brk dist/server.js

# Or use VS Code debugger
# Add to .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/backend/dist/server.js",
  "restart": true,
  "console": "integratedTerminal"
}
```

### Frontend Debugging

- Use React DevTools browser extension
- Use Redux DevTools for state debugging
- Use browser DevTools for network debugging
- Use console.log for quick debugging

### Logging

```typescript
// Backend
logger.info('User created', { userId, email });
logger.error('Database error', { error, query });

// Frontend
console.log('State updated', state);
console.error('API error', error);
```

---

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Create database migration if needed
3. Create service methods
4. Create API routes
5. Create frontend components
6. Add tests
7. Create pull request
8. Merge after review

### Fixing a Bug

1. Create bugfix branch
2. Write test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Create pull request
6. Merge after review

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Install new package
npm install package-name

# Remove package
npm uninstall package-name
```

---

## Troubleshooting

### Build Errors

```bash
# Clear build cache
rm -rf dist/
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### Runtime Errors

```bash
# Check logs
npm run dev 2>&1 | tee debug.log

# Use debugger
node --inspect-brk dist/server.js
```

### Database Issues

```bash
# Check connection
psql -U hr360_user -d hr360 -c "SELECT 1"

# Check migrations
npm run migrate:status

# Rollback and retry
npm run migrate:rollback
npm run migrate:run
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redux Documentation](https://redux.js.org/)

---

**Last Updated**: June 1, 2026

