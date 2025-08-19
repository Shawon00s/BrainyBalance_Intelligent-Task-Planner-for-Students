import express from 'express';
import Schedule from '../models/Schedule.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all schedule entries for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;

        const filter = { userId: req.user._id };

        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.date = {
                $gte: targetDate,
                $lt: nextDay
            };
        } else if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const schedules = await Schedule.find(filter)
            .populate('taskId', 'title priority status')
            .sort({ date: 1, startTime: 1 });

        res.json({
            schedules,
            count: schedules.length
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ error: 'Server error while fetching schedules' });
    }
});

// Get a single schedule entry
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const schedule = await Schedule.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('taskId', 'title priority status');

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule entry not found' });
        }

        res.json(schedule);
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: 'Server error while fetching schedule' });
    }
});

// Create a new schedule entry
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { date, startTime, endTime, title, description, reminderSet, reminderTime, taskId } = req.body;

        if (!date || !startTime || !endTime || !title) {
            return res.status(400).json({ error: 'Date, start time, end time, and title are required' });
        }

        // Validate time format and logic
        if (startTime >= endTime) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        const schedule = new Schedule({
            userId: req.user._id,
            date: new Date(date),
            startTime,
            endTime,
            title,
            description,
            reminderSet: reminderSet || false,
            reminderTime: reminderTime ? new Date(reminderTime) : null,
            taskId: taskId || null
        });

        await schedule.save();
        await schedule.populate('taskId', 'title priority status');

        res.status(201).json({
            message: 'Schedule entry created successfully',
            schedule
        });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: 'Server error while creating schedule' });
    }
});

// Update a schedule entry
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { date, startTime, endTime, title, description, reminderSet, reminderTime, taskId } = req.body;

        const schedule = await Schedule.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule entry not found' });
        }

        // Validate time logic if being updated
        const newStartTime = startTime || schedule.startTime;
        const newEndTime = endTime || schedule.endTime;

        if (newStartTime >= newEndTime) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        // Update fields
        if (date) schedule.date = new Date(date);
        if (startTime) schedule.startTime = startTime;
        if (endTime) schedule.endTime = endTime;
        if (title) schedule.title = title;
        if (description !== undefined) schedule.description = description;
        if (reminderSet !== undefined) schedule.reminderSet = reminderSet;
        if (reminderTime !== undefined) schedule.reminderTime = reminderTime ? new Date(reminderTime) : null;
        if (taskId !== undefined) schedule.taskId = taskId || null;

        await schedule.save();
        await schedule.populate('taskId', 'title priority status');

        res.json({
            message: 'Schedule entry updated successfully',
            schedule
        });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Server error while updating schedule' });
    }
});

// Delete a schedule entry
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const schedule = await Schedule.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule entry not found' });
        }

        res.json({ message: 'Schedule entry deleted successfully' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: 'Server error while deleting schedule' });
    }
});

// Get today's schedule
router.get("/today/entries", authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await Schedule.find({
            userId: req.user._id,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('taskId', 'title priority status')
            .sort({ startTime: 1 });

        res.json({
            schedules,
            count: schedules.length,
            date: today
        });
    } catch (error) {
        console.error('Get today schedule error:', error);
        res.status(500).json({ error: 'Server error while fetching today\'s schedule' });
    }
});

// Get week's schedule
router.get("/week/entries", authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get start of week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Get end of week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const schedules = await Schedule.find({
            userId: req.user._id,
            date: {
                $gte: startOfWeek,
                $lt: endOfWeek
            }
        })
            .populate('taskId', 'title priority status')
            .sort({ date: 1, startTime: 1 });

        res.json({
            schedules,
            count: schedules.length,
            weekStart: startOfWeek,
            weekEnd: endOfWeek
        });
    } catch (error) {
        console.error('Get week schedule error:', error);
        res.status(500).json({ error: 'Server error while fetching week\'s schedule' });
    }
});

export default router;
