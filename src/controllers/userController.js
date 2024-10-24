const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const signup = async (req, res) => {
  const { name, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user', details: err.message });
  }
};

const login = async (req, res) => {
    const { name, password } = req.body;
  
    try {
      const user = await prisma.user.findFirst({
        where: { name },
      });
  
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }
  
      const isValidPassword = await bcrypt.compare(password, user.password);
  
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.json({ message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ error: 'Error logging in', details: err.message });
    }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users', details: err.message });
  }
};

module.exports = { signup, login, getAllUsers };
