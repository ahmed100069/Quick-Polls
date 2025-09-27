const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pollsDB";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected successfully!'))
.catch((error) => {
  console.error('MongoDB Connection Error:', error.message);
  process.exit(1);
});

// ✅ Make io accessible to routes
app.set('io', io);

// Poll Model
const Poll = require('./models/Poll');

// ✅ Routes
const pollRoutes = require('./routes/pollRoutes');
app.use('/api/polls', pollRoutes);

// ✅ Socket.io Real-time Connection Handling
io.on('connection', (socket) => {
  console.log('✅ User connected via Socket.io:', socket.id);

  // ✅ Join poll room for real-time updates
  socket.on('join-poll', (pollId) => {
    socket.join(pollId);
    console.log(`👥 User ${socket.id} joined poll room: ${pollId}`);
  });

  // ✅ Leave poll room
  socket.on('leave-poll', (pollId) => {
    socket.leave(pollId);
    console.log(`👋 User ${socket.id} left poll room: ${pollId}`);
  });

  // ✅ Handle new poll creation broadcast
  socket.on('newPoll', (pollData) => {
    console.log('📢 New poll created, broadcasting to all clients');
    socket.broadcast.emit('pollCreated', pollData);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} with Socket.io`));