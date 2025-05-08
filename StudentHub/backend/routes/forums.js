const express = require('express');
const Forum = require('../models/Forum');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/auth');
const contentModeration = require('../middleware/moderation');

const router = express.Router();

router.post('/', verifyToken, contentModeration, async (req, res) => {
  try {
    const { university, faculty, course } = req.body;
    const existingForum = await Forum.findOne({ university, faculty, course });
    if (existingForum) return res.status(400).json({ message: 'Forum already exists' });

    const forum = new Forum({ university, faculty, course });
    await forum.save();
    res.status(201).json(forum);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get forums by university, faculty, or course
router.get('/', async (req, res) => {
  try {
    const { university, faculty, course } = req.query;
    const filters = {};
    if (university) filters.university = university;
    if (faculty) filters.faculty = faculty;
    if (course) filters.course = course;

    const forums = await Forum.find(filters).populate({
      path: 'threads',
      populate: { path: 'createdBy', select: 'name' }
    });
    res.json(forums);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new thread in a forum
router.post('/:forumId/threads', verifyToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const { title } = req.body;

    const forum = await Forum.findById(forumId);
    if (!forum) return res.status(404).json({ message: 'Forum not found' });

    const thread = new Thread({
      forum: forumId,
      title,
      createdBy: req.user.id,
      posts: [],
    });
    await thread.save();

    forum.threads.push(thread._id);
    await forum.save();

    res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get threads in a forum
router.get('/:forumId/threads', async (req, res) => {
  try {
    const { forumId } = req.params;
    const threads = await Thread.find({ forum: forumId }).populate('createdBy', 'name');
    res.json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post in a thread
router.post('/threads/:threadId/posts', verifyToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const post = new Post({
      thread: threadId,
      content,
      createdBy: req.user.id,
    });
    await post.save();

    thread.posts.push(post._id);
    await thread.save();

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts in a thread
router.get('/threads/:threadId/posts', async (req, res) => {
  try {
    const { threadId } = req.params;
    const posts = await Post.find({ thread: threadId }).populate('createdBy', 'name');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
