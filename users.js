const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config(); // Load environment variables

// Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        // Generate JWT
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => { // Use environment variable
            if (err) throw err;
            res.status(201).json({ token });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        // Generate JWT
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => { // Use environment variable
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
});

// Get user profile (protected route)
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ errors: [{ msg: 'No token, authorization denied' }] });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use environment variable
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(401).json({ errors: [{ msg: 'Token is not valid' }] });
    }
});

// Follow a user (example, add your own logic)
router.post('/follow/:id', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ errors: [{ msg: 'No token, authorization denied' }] });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use environment variable
        const currentUser = await User.findById(decoded.user.id);
        const userToFollow = await User.findById(req.params.id);

        if (!userToFollow) {
            return res.status(404).json({ errors: [{ msg: 'User to follow not found' }] });
        }

        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ errors: [{ msg: 'Already following this user' }] });
        }

        currentUser.following.push(userToFollow._id);
        await currentUser.save();

        res.json({ msg: 'User followed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
});

module.exports = router;