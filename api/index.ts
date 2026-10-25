import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDatabase } from '../server/db.ts';
import { apiRouter } from '../server/routes/api.ts';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Serverless DB connection initialization
let dbInitPromise: Promise<void> | null = null;
app.use(async (req, res, next) => {
  try {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase();
    }
    await dbInitPromise;
    next();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err);
    next();
  }
});

// Handle both /api/foo and /foo routes for Vercel
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
