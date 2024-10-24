const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendFriendRequest = async (req, res) => {
  const { friendId } = req.body;
  const { userId } = req.user;   

  try {
    const existingRequest = await prisma.friend.findFirst({
      where: {
        userId,
        friendId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    await prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
    });

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error sending friend request', details: err.message });
  }
};

const respondToFriendRequest = async (req, res) => {
  const { friendId, response } = req.body;
  const { userId } = req.user; 

  try {
    const friendRequest = await prisma.friend.findFirst({
      where: {
        userId: friendId, 
        friendId: userId, 
        status: 'pending',
      },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friend.update({
      where: { id: friendRequest.id },
      data: { status: response },
    });

    res.json({ message: `Friend request ${response}` });
  } catch (err) {
    res.status(500).json({ error: 'Error responding to friend request', details: err.message });
  }
};

const getFriends = async (req, res) => {
  const { userId } = req.user;

  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: { user: true, friend: true },  
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching friends', details: err.message });
  }
};

const getPendingFriendRequests = async (req, res) => {
  const { userId } = req.user;

  try {
    const pendingRequests = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: userId, status: 'pending' }, // Sent requests by the user
          { friendId: userId, status: 'pending' }, // Received requests to the user
        ],
      },
      include: { 
        user: true,   // Include details of the user who sent the request
        friend: true  // Include details of the friend who received the request
      },
    });

    res.json(pendingRequests);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pending friend requests', details: err.message });
  }
};

module.exports = { sendFriendRequest, respondToFriendRequest, getFriends, getPendingFriendRequests };
