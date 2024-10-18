const express = require('express');
const { createBoard, getBoards } = require('../controllers/boardController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authenticateToken, createBoard);

router.get('/', authenticateToken, getBoards);

module.exports = router;

