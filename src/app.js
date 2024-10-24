const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const friendRoutes = require('./routes/friendRoutes'); 
require('dotenv').config();

const app = express();
app.use(express.json()); 
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/boards', boardRoutes);

app.use('/api/friends', friendRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
