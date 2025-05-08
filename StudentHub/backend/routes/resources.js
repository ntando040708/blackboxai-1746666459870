const express = require('express');
const multer = require('multer');
const path = require('path');
const Resource = require('../models/Resource');
const { verifyToken } = require('../middleware/auth');
const virusScan = require('../middleware/virusScan');
const contentModeration = require('../middleware/moderation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resources/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload a new resource
router.post('/upload', verifyToken, upload.single('file'), virusScan, contentModeration, async (req, res) => {
  try {
    const { title, description, institution, faculty, course, year } = req.body;
    if (!req.file) return res.status(400).json({ message: 'File is required' });

    const resource = new Resource({
      title,
      description,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id,
      institution,
      faculty,
      course,
      year,
      versions: [{ fileUrl: req.file.path, uploadedAt: new Date() }],
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resources with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {};
    const { institution, faculty, course, year } = req.query;
    if (institution) filters.institution = institution;
    if (faculty) filters.faculty = faculty;
    if (course) filters.course = course;
    if (year) filters.year = Number(year);

    const resources = await Resource.find(filters).populate('uploadedBy', 'name email');
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a resource
router.post('/:id/rate', verifyToken, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const existingRatingIndex = resource.ratings.findIndex(r => r.user.toString() === req.user.id);
    if (existingRatingIndex !== -1) {
      resource.ratings[existingRatingIndex].rating = rating;
    } else {
      resource.ratings.push({ user: req.user.id, rating });
    }

    // Calculate average rating
    const total = resource.ratings.reduce((acc, r) => acc + r.rating, 0);
    resource.averageRating = total / resource.ratings.length;

    await resource.save();
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
