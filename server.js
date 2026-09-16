require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB    = require('./config/db');
const { buildTransporter, getSenderEmail } = require('./config/mailer');
const Booking      = require('./models/Booking');
const Contact      = require('./models/Contact');
const OffDay       = require('./models/OffDay');
const requireAdmin = require('./middleware/requireAdmin');
const seedCmsBlocks = require('./seeds/cmsBlocks');

const adminAuth     = require('./routes/adminAuth');
const adminBookings = require('./routes/adminBookings');
const adminMessages = require('./routes/adminMessages');
const adminOffDays  = require('./routes/adminOffDays');
const adminCms      = require('./routes/adminCms');
const publicCms     = require('./routes/publicCms');

const app = express();

const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ── Public routes ──────────────────────────────────────────────────
app.use('/api/admin', adminAuth);
app.use('/api/cms',   publicCms);

// ── Protected admin routes ─────────────────────────────────────────
app.use('/api/admin/bookings',  requireAdmin, adminBookings);
app.use('/api/admin/messages',  requireAdmin, adminMessages);
app.use('/api/admin/off-days',  requireAdmin, adminOffDays);
app.use('/api/admin/cms',       requireAdmin, adminCms);

// ── Public: off-days (for booking page guard) ──────────────────────
app.get('/api/off-days/public', async (req, res) => {
  try {
    res.json(await OffDay.find().sort({ date: 1 }));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── Helpers for off-day time parsing ──────────────────────────────
function parseTime12h(str) {
  const m = String(str || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}
function toMins(t) {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return h * 60 + (m || 0);
}

// ── Public: submit booking ─────────────────────────────────────────
app.post('/api/book', async (req, res) => {
  const { firstName, lastName, email, phone, service, date, time, message } = req.body;

  if (!firstName || !lastName || !email || !service || !date || !time) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    // Past-date guard
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ success: false, code: 'PAST_DATE' });
    }

    // Slot conflict guard
    const existingSlot = await Booking.findOne({ date, time });
    if (existingSlot) {
      return res.status(400).json({ success: false, code: 'SLOT_TAKEN' });
    }

    // Off-day guard
    const offDay = await OffDay.findOne({ date });
    if (offDay) {
      if (offDay.fullDay) {
        return res.status(400).json({ success: false, code: 'OFF_DAY' });
      }
      const time24 = parseTime12h(time);
      if (time24 !== null) {
        const bookMins = toMins(time24);
        const offStart = toMins(offDay.startTime);
        const offEnd   = toMins(offDay.endTime);
        if (bookMins >= offStart && bookMins < offEnd) {
          return res.status(400).json({
            success: false, code: 'OFF_DAY_TIME',
            offStart: offDay.startTime, offEnd: offDay.endTime,
          });
        }
      }
    }

    await Booking.create({ firstName, lastName, email, phone, service, date, time, message });

    const recipient = getSenderEmail();
    if (recipient) {
      try {
        await buildTransporter().sendMail({
          from: `"AlTjawal Booking" <${recipient}>`,
          to: recipient,
          replyTo: email,
          subject: `New Booking — ${service} | ${firstName} ${lastName}`,
          html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>New Booking</title></head>
<body style="margin:0;padding:0;background-color:#EFECE3;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFECE3;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
<tr><td style="background-color:#38443E;padding:36px 40px;text-align:center;">
  <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#EDE1CB;">Al Tajwal</p>
  <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:22px;font-weight:300;color:#EDE1CB;">New Booking Received</h1>
</td></tr>
<tr><td style="background-color:#F2F0EA;padding:36px 40px 28px;">
  <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:13px;font-style:italic;color:#38443E;line-height:1.6;">A new booking has been submitted. Here are the details:</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Name</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${firstName} ${lastName}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Email</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><a href="mailto:${email}" style="font-family:Arial,sans-serif;font-size:13px;color:#38443E;text-decoration:none;">${email}</a></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Phone</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${phone || '—'}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Service</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${service}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Date</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${date}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Time</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${time}</span></td></tr>
    <tr><td style="padding:10px 0;width:130px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Notes</span></td><td style="padding:10px 0 10px 16px;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${message || '—'}</span></td></tr>
  </table>
</td></tr>
<tr><td style="background-color:#38443E;padding:24px 40px;text-align:center;"><p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(237,225,203,0.7);letter-spacing:0.05em;">This booking was submitted via the AlTjawal booking form.</p></td></tr>
</table></td></tr></table>
</body></html>`,
        });
      } catch (emailErr) {
        console.error('Booking email sending failed:', emailErr);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ success: false });
  }
});

// ── Public: submit contact ─────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    await Contact.create({ firstName, lastName, email, phone, message });

    const recipient = getSenderEmail();
    if (recipient) {
      try {
        await buildTransporter().sendMail({
          from: `"AlTjawal Contact" <${recipient}>`,
          to: recipient,
          replyTo: email,
          subject: `New Contact Message — ${firstName} ${lastName}`,
          html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>New Enquiry</title></head>
<body style="margin:0;padding:0;background-color:#EFECE3;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFECE3;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
<tr><td style="background-color:#38443E;padding:36px 40px;text-align:center;">
  <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#EDE1CB;">Al Tajwal</p>
  <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:22px;font-weight:300;color:#EDE1CB;letter-spacing:0.04em;">New Enquiry Received</h1>
</td></tr>
<tr><td style="background-color:#F2F0EA;padding:36px 40px 28px;">
  <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:13px;font-style:italic;color:#38443E;line-height:1.6;">Someone has reached out through the contact form. Here are the details:</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:120px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Name</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${firstName} ${lastName}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:120px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Email</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><a href="mailto:${email}" style="font-family:Arial,sans-serif;font-size:13px;color:#38443E;text-decoration:none;">${email}</a></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddd8ce;width:120px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Phone</span></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #ddd8ce;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${phone || '—'}</span></td></tr>
    <tr><td style="padding:10px 0;width:120px;vertical-align:top;"><span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38443E;">Message</span></td><td style="padding:10px 0 10px 16px;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${message}</span></td></tr>
  </table>
</td></tr>
<tr><td style="background-color:#38443E;padding:24px 40px;text-align:center;"><p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(237,225,203,0.7);letter-spacing:0.05em;">This message was sent via the AlTjawal contact form.</p></td></tr>
</table></td></tr></table>
</body></html>`,
        });
      } catch (emailErr) {
        console.error('Contact email sending failed:', emailErr);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact creation error:', err);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB()
  .then(seedCmsBlocks)
  .catch((err) => console.error('Failed to connect to MongoDB:', err.message));
