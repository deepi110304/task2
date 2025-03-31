const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user'); // Import User model
const jwt = require('jsonwebtoken'); // Import JWT
require('dotenv').config(); // Load environment variables

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use environment variable
        req.user = decoded.user;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

// Create a post (authenticated)
router.post('/', auth, async (req, res) => {
    try {
        const { text } = req.body;
        const user = await User.findById(req.user.id);

        const post = new Post({
            text: text,
            user: user._id, // Associate post with the user
        });

        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Get all posts (populated with user info)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('user', ['username', 'email']);
        res.send(posts);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Like a post (authenticated)
router.post('/like/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        const user = await User.findById(req.user.id);

        if (!post) return res.status(404).send('Post not found.');

        if (post.likes.includes(user._id)) {
            return res.status(400).send('Post already liked.');
        }

        post.likes.push(user._id);
        await post.save();

        res.send(post);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Add a comment (authenticated)
router.post('/comment/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        const user = await User.findById(req.user.id);

        if (!post) return res.status(404).send('Post not found.');

        const comment = {
            text: req.body.text,
            user: user._id,
        };

        post.comments.push(comment);
        await post.save();

        res.send(post);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;