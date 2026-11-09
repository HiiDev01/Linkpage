import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import linkRoutes from './routes/links.js';
import socialRoutes from './routes/social.js';
import portfolioRoutes from './routes/portfolio.js';
import themeRoutes from './routes/themes.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: CLIENT_URL.split(','), methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '100kb' }));

const limiter = (limit, extra = {}) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, ...extra });
app.use('/api', limiter(300));
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'],
  limiter(20, { message: { error: 'Too many attempts. Try again in a few minutes.' } }));

app.use(['/api/analytics/view', '/api/analytics/click'], limiter(120, { message: { error: 'Too many requests.' } }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/social-links', socialRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That image is too large. Profile photos can be up to 2 MB and project images up to 5 MB.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

app.listen(PORT, () => console.log(`LinkPage API listening on :${PORT}`));
