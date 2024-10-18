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
          { participants: { some: { userId } } },  
        ],
      },
      include: {
        owner: true,
        participants: true,
      },
    });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching boards', details: err.message });
  }
};

module.exports = { createBoard, getBoards };
