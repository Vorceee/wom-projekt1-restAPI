const express = require('express');
const { createBoard, getBoards, addTicket, getTickets, updateTicket, deleteTicket, shareBoardWithFriend} = require('../controllers/boardController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authenticateToken, createBoard);

router.get('/', authenticateToken, getBoards);

router.post('/:id/tickets', authenticateToken, addTicket);

router.get('/:id/tickets', authenticateToken, getTickets);

router.put('/tickets/:ticketId', authenticateToken, updateTicket);

router.delete('/tickets/:ticketId', authenticateToken, deleteTicket);

router.post('/:boardId/share', authenticateToken, shareBoardWithFriend);

module.exports = router;