const User = require('../models/User');
const users = {}; // userId -> socketId mapping

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user socket
    socket.on('register', (userId) => {
      users[userId] = socket.id;
      io.emit('onlineUsers', Object.keys(users));
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Send generic message
    socket.on('sendMessage', (data) => {
      const receiverSocketId = users[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', data);
      }
    });

    // Calling system logic
    socket.on('callUser', (data) => {
      const receiverSocketId = users[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incomingCall', { caller: data.caller, callType: data.callType });
      }
    });

    socket.on('answerCall', (data) => {
      const callerSocketId = users[data.callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit('callAnswered', { accepted: data.accepted });
      }
    });

    socket.on('endCall', (data) => {
      const otherUserSocketId = users[data.otherUserId];
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('callEnded');
      }
    });

    // WebRTC Signaling
    socket.on('webrtcSignal', (data) => {
      const receiverSocketId = users[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('webrtcSignal', { 
          signal: data.signal, 
          senderId: data.senderId 
        });
      }
    });

    socket.on('disconnect', async () => {
      const userId = Object.keys(users).find(key => users[key] === socket.id);
      if (userId) {
        delete users[userId];
        
        // Update last seen
        try {
          await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
          io.emit('userOffline', { userId, lastSeen: new Date() });
        } catch (err) {
          console.error('Error updating last seen:', err);
        }
        
        io.emit('onlineUsers', Object.keys(users));
      }
      console.log('User disconnected:', socket.id);
    });
  });
};
