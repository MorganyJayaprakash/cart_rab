const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const authMiddleware = require('../middleware/authMiddleware');

// Get call history for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
    .populate('callerId', 'username avatar _id')
    .populate('receiverId', 'username avatar _id')
    .sort({ startedAt: -1 });
    
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a call record (could also be done via Socket.io)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, callType, status, duration, startedAt, endedAt } = req.body;
    
    const newCall = new Call({
      callerId: req.user.id,
      receiverId,
      callType,
      status,
      duration,
      startedAt,
      endedAt
    });

    const savedCall = await newCall.save();
    res.status(201).json(savedCall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
