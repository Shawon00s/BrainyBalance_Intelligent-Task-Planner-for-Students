import express from 'express';
import Task from '../models/Task.js';
import Analytics from '../models/Analytics.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { status, priority, category, sortBy = 'createdAt', order = 'desc' } = req.query;

        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const tasks = await Task.find(filter).sort(sortOptions);

        res.json({
            tasks,
            count: tasks.length
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error while fetching tasks' });
    }
});

// Get a single task
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Server error while fetching task' });
    }
});

// Create a new task
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, deadline, priority, category, estimatedTime, tags } = req.body;

        if (!title || !deadline) {
            return res.status(400).json({ error: 'Title and deadline are required' });
        }

        const task = new Task({
            userId: req.user._id,
            title,
            description,
            deadline: new Date(deadline),
            priority: priority || 'medium',
            category: category || 'personal',
            estimatedTime: estimatedTime || 60,
            tags: tags || []
        });

        await task.save();

        // Update analytics
        await updateDailyAnalytics(req.user._id, 'taskCreated');

        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error while creating task' });
    }
});

// Update a task
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { title, description, deadline, priority, status, category, estimatedTime, tags } = req.body;

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const wasCompleted = task.status === 'completed';

        // Update fields
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (deadline) task.deadline = new Date(deadline);
        if (priority) task.priority = priority;
        if (status) task.status = status;
        if (category) task.category = category;
        if (estimatedTime) task.estimatedTime = estimatedTime;
        if (tags) task.tags = tags;

        await task.save();

        // Update analytics if task was completed
        if (!wasCompleted && task.status === 'completed') {
            await updateDailyAnalytics(req.user._id, 'taskCompleted', task);
        }

        res.json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error while updating task' });
    }
});

// Delete a task
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error while deleting task' });
    }
});

// Get upcoming tasks (due within next 7 days)
router.get("/upcoming/week", authMiddleware, async (req, res) => {
    try {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const tasks = await Task.find({
            userId: req.user._id,
            deadline: { $lte: nextWeek },
            status: { $ne: 'completed' }
        }).sort({ deadline: 1 });

        res.json({
            tasks,
            count: tasks.length
        });
    } catch (error) {
        console.error('Get upcoming tasks error:', error);
        res.status(500).json({ error: 'Server error while fetching upcoming tasks' });
    }
});

// Helper function to update daily analytics
async function updateDailyAnalytics(userId, action, task = null) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let analytics = await Analytics.findOne({ userId, date: today });

        if (!analytics) {
            analytics = new Analytics({ userId, date: today });
        }

        if (action === 'taskCreated') {
            analytics.tasksCreated += 1;
        } else if (action === 'taskCompleted' && task) {
            analytics.tasksCompleted += 1;
            analytics.tasksByPriority[task.priority] += 1;
            analytics.tasksByCategory[task.category] += 1;

            // Calculate productivity score (simple algorithm)
            const totalTasks = analytics.tasksCreated;
            const completedTasks = analytics.tasksCompleted;
            analytics.productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }

        await analytics.save();
    } catch (error) {
        console.error('Analytics update error:', error);
    }
}

export default router;
