const express = require('express');
const router = express.Router();
const Status = require('../models/Status');
const authMiddleware = require('../middleware/authMiddleware');

// Get all recent statuses grouped by user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
      .populate('userId', 'username avatar _id')
      .sort({ createdAt: 1 });
    
    // Group by user
    const grouped = statuses.reduce((acc, status) => {
      const uid = status.userId._id.toString();
      if (!acc[uid]) {
        acc[uid] = {
          user: status.userId,
          statuses: []
        };
      }
      acc[uid].statuses.push(status);
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new status
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, type, backgroundColor } = req.body;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const newStatus = new Status({
      userId: req.user.id,
      content,
      type: type || 'text',
      backgroundColor: backgroundColor || '#00a884',
      expiresAt
    });

    const savedStatus = await newStatus.save();
    
    // Populate user to return
    await savedStatus.populate('userId', 'username avatar');
    res.status(201).json(savedStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
