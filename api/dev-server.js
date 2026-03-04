import 'dotenv/config';
import express from 'express';

import participants from './participants.js';
import participantLookup from './participant-lookup.js';
import checkin from './checkin.js';
import paymentVerification from './payment-verification.js';
import stats from './stats.js';
import media from './media.js';
import winners from './winners.js';
import activities from './activities.js';
import managementTeam from './management-team.js';
import emailOtp from './email-otp.js';
import login from './auth/login.js';
import me from './auth/me.js';
import signout from './auth/signout.js';

const app = express();
const port = Number(process.env.API_PORT || 8787);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.all('/api/participants', (req, res) => participants(req, res));
app.all('/api/participant-lookup', (req, res) => participantLookup(req, res));
app.all('/api/checkin', (req, res) => checkin(req, res));
app.all('/api/payment-verification', (req, res) => paymentVerification(req, res));
app.all('/api/stats', (req, res) => stats(req, res));
app.all('/api/media', (req, res) => media(req, res));
app.all('/api/winners', (req, res) => winners(req, res));
app.all('/api/activities', (req, res) => activities(req, res));
app.all('/api/management-team', (req, res) => managementTeam(req, res));
app.all('/api/email-otp', (req, res) => emailOtp(req, res));
app.all('/api/auth/login', (req, res) => login(req, res));
app.all('/api/auth/me', (req, res) => me(req, res));
app.all('/api/auth/signout', (req, res) => signout(req, res));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

const server = app.listen(port, () => {
  console.log(`[api] listening on http://127.0.0.1:${port}`);
});

server.on('close', () => {
  console.error('[api] server closed unexpectedly');
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

// Keep process alive reliably in local dev under npm/concurrently.
setInterval(() => {}, 1 << 30);
