require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const rateLimit = require('express-rate-limit');
const httpsRedirect = require('./middleware/httpsRedirect');

app.use(httpsRedirect);
app.use(cors());
app.use(express.json());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

app.get('/', (req, res) => {
  res.send('StudentHub Backend API');
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const resourceRoutes = require('./routes/resources');
app.use('/api/resources', resourceRoutes);

const forumRoutes = require('./routes/forums');
app.use('/api/forums', forumRoutes);

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

  // Handle chat message event
  socket.on('chatMessage', ({ toUserId, message }) => {
    // Broadcast message to the recipient if connected
    io.to(toUserId).emit('chatMessage', { fromUserId: socket.id, message });
  });

  // Join user to a room for private messaging
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
