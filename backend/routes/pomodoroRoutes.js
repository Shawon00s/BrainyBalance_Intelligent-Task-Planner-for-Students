import express from 'express';
import { PomodoroSession, PomodoroInterval } from '../models/Pomodoro.js';
import Analytics from '../models/Analytics.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all pomodoro sessions for the authenticated user
router.get("/sessions", authMiddleware, async (req, res) => {
    try {
        const { date, status, limit = 10 } = req.query;

        const filter = { userId: req.user._id };

        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.createdAt = {
                $gte: targetDate,
                $lt: nextDay
            };
        }

        if (status) {
            filter.status = status;
        }

        const sessions = await PomodoroSession.find(filter)
            .populate('taskId', 'title priority')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            sessions,
            count: sessions.length
        });
    } catch (error) {
        console.error('Get pomodoro sessions error:', error);
        res.status(500).json({ error: 'Server error while fetching pomodoro sessions' });
    }
});

// Get a single pomodoro session with intervals
router.get("/sessions/:id", authMiddleware, async (req, res) => {
    try {
        const session = await PomodoroSession.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('taskId', 'title priority');

        if (!session) {
            return res.status(404).json({ error: 'Pomodoro session not found' });
        }

        const intervals = await PomodoroInterval.find({ sessionId: session._id })
            .sort({ startTime: 1 });

        res.json({
            session,
            intervals
        });
    } catch (error) {
        console.error('Get pomodoro session error:', error);
        res.status(500).json({ error: 'Server error while fetching pomodoro session' });
    }
});

// Start a new pomodoro session
router.post("/sessions/start", authMiddleware, async (req, res) => {
    try {
        const { taskId, workDuration = 25, shortBreak = 5, longBreak = 15 } = req.body;

        // Check if there's an active session
        const activeSession = await PomodoroSession.findOne({
            userId: req.user._id,
            status: 'active'
        });

        if (activeSession) {
            return res.status(400).json({ error: 'An active pomodoro session already exists' });
        }

        const session = new PomodoroSession({
            userId: req.user._id,
            taskId: taskId || null,
            startTime: new Date()
        });

        await session.save();
        await session.populate('taskId', 'title priority');

        // Start the first work interval
        const workInterval = new PomodoroInterval({
            sessionId: session._id,
            startTime: new Date(),
            type: 'work',
            duration: workDuration
        });

        await workInterval.save();

        res.status(201).json({
            message: 'Pomodoro session started successfully',
            session,
            currentInterval: workInterval,
            settings: {
                workDuration,
                shortBreak,
                longBreak
            }
        });
    } catch (error) {
        console.error('Start pomodoro session error:', error);
        res.status(500).json({ error: 'Server error while starting pomodoro session' });
    }
});

// Complete current interval and start next one
router.post("/sessions/:id/next-interval", authMiddleware, async (req, res) => {
    try {
        const { shortBreak = 5, longBreak = 15, workDuration = 25 } = req.body;

        const session = await PomodoroSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({ error: 'Active pomodoro session not found' });
        }

        // Find the current active interval
        const currentInterval = await PomodoroInterval.findOne({
            sessionId: session._id,
            completed: false
        }).sort({ startTime: -1 });

        if (!currentInterval) {
            return res.status(400).json({ error: 'No active interval found' });
        }

        // Complete the current interval
        currentInterval.endTime = new Date();
        currentInterval.completed = true;
        await currentInterval.save();

        // Update session stats
        if (currentInterval.type === 'work') {
            session.totalWorkDuration += currentInterval.duration;
            session.sessionsCompleted += 1;
        } else {
            session.totalBreakDuration += currentInterval.duration;
        }

        // Determine next interval type
        let nextType;
        let nextDuration;

        if (currentInterval.type === 'work') {
            // After work, take a break
            if (session.sessionsCompleted % 4 === 0) {
                nextType = 'longBreak';
                nextDuration = longBreak;
            } else {
                nextType = 'shortBreak';
                nextDuration = shortBreak;
            }
        } else {
            // After break, start work
            nextType = 'work';
            nextDuration = workDuration;
        }

        // Create next interval
        const nextInterval = new PomodoroInterval({
            sessionId: session._id,
            startTime: new Date(),
            type: nextType,
            duration: nextDuration
        });

        await nextInterval.save();
        await session.save();

        res.json({
            message: 'Interval completed, next interval started',
            completedInterval: currentInterval,
            currentInterval: nextInterval,
            session
        });
    } catch (error) {
        console.error('Next interval error:', error);
        res.status(500).json({ error: 'Server error while progressing interval' });
    }
});

// Pause current session
router.put("/sessions/:id/pause", authMiddleware, async (req, res) => {
    try {
        const session = await PomodoroSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({ error: 'Active pomodoro session not found' });
        }

        session.status = 'paused';
        await session.save();

        res.json({
            message: 'Pomodoro session paused',
            session
        });
    } catch (error) {
        console.error('Pause session error:', error);
        res.status(500).json({ error: 'Server error while pausing session' });
    }
});

// Resume paused session
router.put("/sessions/:id/resume", authMiddleware, async (req, res) => {
    try {
        const session = await PomodoroSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
            status: 'paused'
        });

        if (!session) {
            return res.status(404).json({ error: 'Paused pomodoro session not found' });
        }

        session.status = 'active';
        await session.save();

        res.json({
            message: 'Pomodoro session resumed',
            session
        });
    } catch (error) {
        console.error('Resume session error:', error);
        res.status(500).json({ error: 'Server error while resuming session' });
    }
});

// End pomodoro session
router.put("/sessions/:id/end", authMiddleware, async (req, res) => {
    try {
        const session = await PomodoroSession.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Pomodoro session not found' });
        }

        // Complete any active intervals
        await PomodoroInterval.updateMany(
            { sessionId: session._id, completed: false },
            { endTime: new Date(), completed: true }
        );

        session.status = 'completed';
        session.endTime = new Date();
        await session.save();

        // Update analytics
        await updatePomodoroAnalytics(req.user._id, session);

        res.json({
            message: 'Pomodoro session ended',
            session
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Server error while ending session' });
    }
});

// Get active session
router.get("/active", authMiddleware, async (req, res) => {
    try {
        const session = await PomodoroSession.findOne({
            userId: req.user._id,
            status: { $in: ['active', 'paused'] }
        }).populate('taskId', 'title priority');

        if (!session) {
            return res.json({ activeSession: null });
        }

        const currentInterval = await PomodoroInterval.findOne({
            sessionId: session._id,
            completed: false
        }).sort({ startTime: -1 });

        res.json({
            activeSession: session,
            currentInterval
        });
    } catch (error) {
        console.error('Get active session error:', error);
        res.status(500).json({ error: 'Server error while fetching active session' });
    }
});

// Get pomodoro statistics
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - startDate.getDay());
        } else if (period === 'month') {
            startDate.setDate(1);
        }

        const sessions = await PomodoroSession.find({
            userId: req.user._id,
            createdAt: { $gte: startDate },
            status: 'completed'
        });

        const totalSessions = sessions.length;
        const totalWorkTime = sessions.reduce((sum, session) => sum + session.totalWorkDuration, 0);
        const totalBreakTime = sessions.reduce((sum, session) => sum + session.totalBreakDuration, 0);
        const averageSessionLength = totalSessions > 0 ? Math.round(totalWorkTime / totalSessions) : 0;

        res.json({
            period,
            totalSessions,
            totalWorkTime,
            totalBreakTime,
            averageSessionLength,
            stats: {
                sessionsPerDay: Math.round(totalSessions / 7 * 10) / 10,
                workTimePerDay: Math.round(totalWorkTime / 7 * 10) / 10
            }
        });
    } catch (error) {
        console.error('Get pomodoro stats error:', error);
        res.status(500).json({ error: 'Server error while fetching pomodoro statistics' });
    }
});

// Helper function to update analytics
async function updatePomodoroAnalytics(userId, session) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let analytics = await Analytics.findOne({ userId, date: today });

        if (!analytics) {
            analytics = new Analytics({ userId, date: today });
        }

        analytics.totalWorkMinutes += session.totalWorkDuration;
        analytics.pomodoroSessions += 1;

        await analytics.save();
    } catch (error) {
        console.error('Pomodoro analytics update error:', error);
    }
}

export default router;
