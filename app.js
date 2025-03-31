const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const users = require('./routes/users');
const posts = require('./routes/posts');
const path = require('path'); // Add this line

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/socialmedia', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', users);
app.use('/api/posts', posts);

// Serve static files from the 'frontend' directory (if applicable)
app.use(express.static(path.join(__dirname, '../frontend')));

// Add this route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html')); // Send your index.html file
});

const port = 5001;
app.listen(port, () => console.log(`Server is running on port ${port}`));