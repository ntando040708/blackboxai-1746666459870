const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { registerValidationRules, loginValidationRules, validate } = require('../middleware/validation');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; 
const EMAIL_USER = process.env.EMAIL_USER || 'your_email@example.com'; 
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_email_password'; 

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Register user
router.post('/register', registerValidationRules(), validate, async (req, res) => {
  const { email, password, name, institution, faculty, courses } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      email,
      passwordHash: password,
      name,
      institution,
      faculty,
      courses,
      verificationToken,
    });
    await user.save();

    // Send verification email
    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`;
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'StudentHub Email Verification',
      html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  const { token, email } = req.query;
  try {
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid token or email' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', loginValidationRules(), validate, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email: user.email, name: user.name, institution: user.institution, faculty: user.faculty, courses: user.courses, reputation: user.reputation, badges: user.badges } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
