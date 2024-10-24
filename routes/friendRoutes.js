const express = require('express');
const { sendFriendRequest, respondToFriendRequest, getFriends, getPendingFriendRequests } = require('../controllers/friendController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/request', authenticateToken, sendFriendRequest);
router.post('/respond', authenticateToken, respondToFriendRequest);
router.get('/', authenticateToken, getFriends);
router.get('/pending', authenticateToken, getPendingFriendRequests);  // New route for pending requests

module.exports = router;
