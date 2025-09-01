import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
    try {
        console.log('Auth middleware - Headers:', req.headers.authorization);
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Auth middleware - Extracted token:', token ? 'Token present' : 'No token');

        if (!token) {
            console.log('Auth middleware - No token provided');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        console.log('Auth middleware - Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware - Token decoded, userId:', decoded.userId);

        const user = await User.findById(decoded.userId).select('-password');
        console.log('Auth middleware - User found:', user ? user.email : 'No user');

        if (!user) {
            console.log('Auth middleware - Invalid token, user not found');
            return res.status(401).json({ error: 'Invalid token.' });
        }

        req.user = user;
        console.log('Auth middleware - Authentication successful');
        next();
    } catch (error) {
        console.error('Auth middleware - Error:', error.message);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
};
