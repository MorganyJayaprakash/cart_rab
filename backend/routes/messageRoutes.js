const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/send', authMiddleware, sendMessage);
router.get('/:userId', authMiddleware, getMessages);

module.exports = router;
