const express = require('express');
const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');  
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/boards', boardRoutes); 

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
