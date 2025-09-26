// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); // updated import
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup with public CORS
const io = new Server(server, {
  cors: {
    origin: "*", // public access
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
const mongoURI = process.env.MONGODB_URI; // must set in Railway env variables
if (!mongoURI) {
  console.error("MongoDB URI not found in environment variables!");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected successfully!'))
.catch((error) => {
  console.error('MongoDB Connection Error:', error.message);
  process.exit(1);
});

// Poll Model
const Poll = require('./models/Poll');

// ✅ Routes - ensure GET route exists
const pollRoutes = require('./routes/pollRoutes');
app.use('/api/polls', pollRoutes);

// Socket.io real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ✅ PORT for Railway
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
