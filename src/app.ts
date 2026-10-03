import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRouter from './routes/health.route';
import productRouter from './routes/product.routes';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app = express();

// Configure trust proxy for rate limiting
// TRUST_PROXY=0: No proxy (direct deployment) - DEFAULT
// TRUST_PROXY=1: Single trusted reverse proxy (e.g., Nginx)
// TRUST_PROXY=true: Trust all proxies (NOT recommended for production)
app.set('trust proxy', env.TRUST_PROXY);

// Global Middlewares
app.use(helmet());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Configure CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Request Parsers with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// API Routes
app.use('/api', healthRouter);
app.use('/api/products', productRouter);
app.use('/api/auth', authRouter);

// Not Found Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
