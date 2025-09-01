import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { read, type, limit = 20, page = 1 } = req.query;

        const filter = { userId: req.user._id };

        if (read !== undefined) {
            if (read === 'true') {
                filter.readAt = { $ne: null };
            } else {
                filter.readAt = null;
            }
        }

        if (type) {
            filter.type = type;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            readAt: null
        });

        res.json({
            notifications,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                count: notifications.length,
                totalCount: total
            },
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error while fetching notifications' });
    }
});

// Get unread notifications count
router.get("/unread/count", authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            readAt: null
        });

        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Server error while fetching unread count' });
    }
});

// Get unread notifications
router.get("/unread", authMiddleware, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const notifications = await Notification.find({
            userId: req.user._id,
            readAt: null
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Get unread notifications error:', error);
        res.status(500).json({ error: 'Server error while fetching unread notifications' });
    }
});

// Create a new notification
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { type, title, message, relatedEntityId, relatedEntityType, priority } = req.body;

        if (!type || !title || !message) {
            return res.status(400).json({ error: 'Type, title, and message are required' });
        }

        const notification = new Notification({
            userId: req.user._id,
            type,
            title,
            message,
            relatedEntityId: relatedEntityId || null,
            relatedEntityType: relatedEntityType || null,
            priority: priority || 'medium'
        });

        await notification.save();

        res.status(201).json({
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Server error while creating notification' });
    }
});

// Mark notification as read
router.put("/:id/read", authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (!notification.readAt) {
            notification.readAt = new Date();
            await notification.save();
        }

        res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Server error while marking notification as read' });
    }
});

// Mark all notifications as read
router.put("/read-all", authMiddleware, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user._id, readAt: null },
            { readAt: new Date() }
        );

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Server error while marking all notifications as read' });
    }
});

// Delete a notification
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Server error while deleting notification' });
    }
});

// Delete all read notifications
router.delete("/read/clear", authMiddleware, async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            userId: req.user._id,
            readAt: { $ne: null }
        });

        res.json({
            message: 'All read notifications deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Clear read notifications error:', error);
        res.status(500).json({ error: 'Server error while clearing read notifications' });
    }
});

// Get notifications by type
router.get("/type/:type", authMiddleware, async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 10 } = req.query;

        const notifications = await Notification.find({
            userId: req.user._id,
            type
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            type,
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Get notifications by type error:', error);
        res.status(500).json({ error: 'Server error while fetching notifications by type' });
    }
});

export default router;
