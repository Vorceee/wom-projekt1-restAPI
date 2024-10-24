const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createBoard = async (req, res) => {
  const { name } = req.body;
  const { userId } = req.user;

  try {
    const board = await prisma.board.create({
      data: {
        name,
        owner: { connect: { id: userId } },
      },
    });

    res.status(201).json({ message: 'Board created successfully', board });
  } catch (err) {
    res.status(500).json({ error: 'Error creating board', details: err.message });
  }
};

const getBoards = async (req, res) => {
  const { userId } = req.user; 

  try {
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId }, 
          { participants: { some: { userId } } } 
        ],
      },
      include: {
        owner: true, 
        participants: { 
          include: { user: true } 
        },
      },
    });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching boards', details: err.message });
  }
};

const addTicket = async (req, res) => {
  const { id } = req.params; 
  const { content, x, y } = req.body; 
  const { userId } = req.user; 

  try {
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { participants: { some: { userId } } }
        ]
      }
    });

    if (!board) {
      return res.status(403).json({ error: 'You do not have access to this board.' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        content,
        x,
        y,
        board: { connect: { id } }, 
        createdBy: { connect: { id: userId } }, 
      },
    });

    res.status(201).json({ message: 'Ticket added successfully', ticket });
  } catch (err) {
    res.status(500).json({ error: 'Error adding ticket', details: err.message });
  }
};

const getTickets = async (req, res) => {
  const { id } = req.params; 
  const { userId } = req.user; 

  try {
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { participants: { some: { userId } } }
        ]
      }
    });

    if (!board) {
      return res.status(403).json({ error: 'You do not have access to this board.' });
    }

    const tickets = await prisma.ticket.findMany({
      where: { boardId: id },
    });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching tickets', details: err.message });
  }
};

const updateTicket = async (req, res) => {
  const { ticketId } = req.params; 
  const { content, x, y } = req.body;  
  const { userId } = req.user;  

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        createdById: userId, 
      },
    });

    if (!ticket) {
      return res.status(403).json({ error: 'You do not have access to update this ticket.' });
    }
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        content: content !== undefined ? content : ticket.content,
        x: x !== undefined ? x : ticket.x,
        y: y !== undefined ? y : ticket.y,
      },
    });

    res.json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (err) {
    res.status(500).json({ error: 'Error updating ticket', details: err.message });
  }
};

const deleteTicket = async (req, res) => {
  const { ticketId } = req.params; 
  const { userId } = req.user; 
  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        createdById: userId, 
      },
    });

    if (!ticket) {
      return res.status(403).json({ error: 'You do not have access to delete this ticket.' });
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting ticket', details: err.message });
  }
};

const shareBoardWithFriend = async (req, res) => {
  const { boardId } = req.params; 
  const { friendId } = req.body; 
  const { userId } = req.user;     

  try {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: userId,
      },
    });

    if (!board) {
      return res.status(403).json({ error: 'You do not have permission to share this board.' });
    }
    const friend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' },
        ],
      },
    });

    if (!friend) {
      return res.status(400).json({ error: 'The specified user is not your friend.' });
    }
    const existingParticipant = await prisma.boardParticipant.findFirst({
      where: { boardId, userId: friendId },
    });

    if (existingParticipant) {
      return res.status(400).json({ error: 'This user already has access to the board.' });
    }
    await prisma.boardParticipant.create({
      data: {
        boardId,
        userId: friendId,
      },
    });

    res.json({ message: 'Board shared successfully with your friend.' });
  } catch (err) {
    res.status(500).json({ error: 'Error sharing board', details: err.message });
  }
};


module.exports = { createBoard, getBoards, addTicket, getTickets, updateTicket, deleteTicket, shareBoardWithFriend };