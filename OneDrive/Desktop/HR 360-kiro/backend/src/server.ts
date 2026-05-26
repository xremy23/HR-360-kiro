import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { initializeDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import kbRoutes from './routes/kb';
import checkinsRoutes from './routes/checkins';
import alertsRoutes from './routes/alerts';
import contactsRoutes from './routes/contacts';
import incidentsRoutes from './routes/incidents';
import sosRoutes from './routes/sos';
import organizationRoutes from './routes/organization';
import tobagRoutes from './routes/tobag';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// API Routes
const apiRouter = express.Router();

// Auth routes (no auth required)
apiRouter.use('/auth', authRoutes);

// Protected routes (auth required)
apiRouter.use('/users', usersRoutes);
apiRouter.use('/kb/guides', kbRoutes);
apiRouter.use('/check-ins', checkinsRoutes);
apiRouter.use('/alerts', alertsRoutes);
apiRouter.use('/contacts', contactsRoutes);
apiRouter.use('/incidents', incidentsRoutes);
apiRouter.use('/sos', sosRoutes);
apiRouter.use('/org', organizationRoutes);
apiRouter.use('/tobag', tobagRoutes);

// Mount API router
app.use('/api', apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    statusCode: 404,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
    statusCode: err.statusCode || 500,
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
