const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminPasswordOverride = require('../models/AdminPasswordOverride');
const AdminOTP = require('../models/AdminOTP');
const { buildTransporter } = require('../config/mailer');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// GET /api/admin/verify — lightweight token check used by the dashboard
router.get('/verify', (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).end();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.admin) return res.status(401).end();
    res.status(200).end();
  } catch {
    res.status(401).end();
  }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  try {
    const override = await AdminPasswordOverride.findOne();
    let valid = false;
    if (override) {
      valid = await bcrypt.compare(password, override.hashedPassword);
    } else {
      valid = password === process.env.ADMIN_PASSWORD;
    }

    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('admin_token', token, COOKIE_OPTS);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true });
});

// POST /api/admin/forgot-password  (Step 1 — generate & send OTP)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({ message: 'If that email is registered, an OTP has been sent.' });

  if (email !== process.env.ADMIN_EMAIL) return;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await AdminOTP.deleteMany({});
    await AdminOTP.create({ otp, expiresAt });

    await buildTransporter().sendMail({
      from: `"AlTjawal Admin" <${process.env.BUSINESS_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Your AlTjawal Dashboard OTP',
      html: `
        <div style="background:#38443E;padding:32px 40px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#EDE1CB;margin:0;">Al Tajwal</p>
          <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:300;color:#EDE1CB;margin:10px 0 0;">Password Reset OTP</h1>
        </div>
        <div style="background:#F2F0EA;padding:36px 40px;">
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">Your one-time password is:</p>
          <p style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#38443E;margin:20px 0;">${otp}</p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    }).catch(console.error);
  } catch (err) {
    console.error('OTP error:', err);
  }
});

// POST /api/admin/verify-otp  (Step 2)
router.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;
  try {
    const record = await AdminOTP.findOne();
    if (!record) return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    if (record.otp !== String(otp)) return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/reset-password  (Step 3)
router.post('/reset-password', async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const record = await AdminOTP.findOne();
    if (!record || new Date() > record.expiresAt) {
      return res.status(400).json({ error: 'OTP session expired. Start over.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await AdminPasswordOverride.deleteMany({});
    await AdminPasswordOverride.create({ hashedPassword, updatedAt: new Date() });
    await AdminOTP.deleteMany({});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
