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
import participantsTransfer from './participants-transfer.js';
import participantsShare from './participants-share.js';
import publicParticipants from './public-participants.js';
import registrationControl from './registration-control.js';
import sheetSync from './sheet-sync.js';
import validationHandlerAccess from './validation-handler-access.js';
import validationHandler from './validation-handler.js';
import login from './auth/login.js';
import me from './auth/me.js';
import signout from './auth/signout.js';

const app = express();
const port = Number(process.env.API_PORT || 8787);
const bodyLimit = String(process.env.API_BODY_LIMIT || '25mb');

app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

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
app.all('/api/participants-transfer', (req, res) => participantsTransfer(req, res));
app.all('/api/participants-share', (req, res) => participantsShare(req, res));
app.all('/api/public-participants', (req, res) => publicParticipants(req, res));
app.all('/api/registration-control', (req, res) => registrationControl(req, res));
app.all('/api/sheet-sync', (req, res) => sheetSync(req, res));
app.all('/api/validation-handler-access', (req, res) => validationHandlerAccess(req, res));
app.all('/api/validation-handler', (req, res) => validationHandler(req, res));
app.all('/api/auth/login', (req, res) => login(req, res));
app.all('/api/auth/me', (req, res) => me(req, res));
app.all('/api/auth/signout', (req, res) => signout(req, res));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err, _req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: `Upload is too large. Maximum request size is ${bodyLimit}.` });
  }
  return next(err);
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
