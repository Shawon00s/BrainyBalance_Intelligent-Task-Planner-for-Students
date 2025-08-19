import express from 'express';
import Analytics from '../models/Analytics.js';
import Task from '../models/Task.js';
import { PomodoroSession } from '../models/Pomodoro.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get analytics dashboard data
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 6); // Last 7 days
        } else if (period === 'month') {
            startDate.setDate(startDate.getDate() - 29); // Last 30 days
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear(), 0, 1); // This year
        }

        // Get analytics data for the period
        const analytics = await Analytics.find({
            userId: req.user._id,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        // Calculate summary statistics
        const summary = {
            totalTasksCreated: analytics.reduce((sum, day) => sum + day.tasksCreated, 0),
            totalTasksCompleted: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
            totalWorkMinutes: analytics.reduce((sum, day) => sum + day.totalWorkMinutes, 0),
            totalPomodoroSessions: analytics.reduce((sum, day) => sum + day.pomodoroSessions, 0),
            averageProductivityScore: analytics.length > 0
                ? Math.round(analytics.reduce((sum, day) => sum + day.productivityScore, 0) / analytics.length)
                : 0
        };

        // Get task completion rate
        summary.completionRate = summary.totalTasksCreated > 0
            ? Math.round((summary.totalTasksCompleted / summary.totalTasksCreated) * 100)
            : 0;

        // Get current streaks
        const streaks = await calculateStreaks(req.user._id);

        res.json({
            period,
            summary,
            analytics,
            streaks
        });
    } catch (error) {
        console.error('Get analytics dashboard error:', error);
        res.status(500).json({ error: 'Server error while fetching analytics dashboard' });
    }
});

// Get detailed analytics for a specific date
router.get("/date/:date", authMiddleware, async (req, res) => {
    try {
        const targetDate = new Date(req.params.date);
        targetDate.setHours(0, 0, 0, 0);

        const analytics = await Analytics.findOne({
            userId: req.user._id,
            date: targetDate
        });

        if (!analytics) {
            return res.json({
                date: targetDate,
                analytics: null,
                message: 'No analytics data for this date'
            });
        }

        // Get tasks for this date
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const tasks = await Task.find({
            userId: req.user._id,
            createdAt: {
                $gte: targetDate,
                $lt: nextDay
            }
        });

        const completedTasks = await Task.find({
            userId: req.user._id,
            updatedAt: {
                $gte: targetDate,
                $lt: nextDay
            },
            status: 'completed'
        });

        // Get pomodoro sessions for this date
        const pomodoroSessions = await PomodoroSession.find({
            userId: req.user._id,
            createdAt: {
                $gte: targetDate,
                $lt: nextDay
            }
        });

        res.json({
            date: targetDate,
            analytics,
            tasks: {
                created: tasks,
                completed: completedTasks
            },
            pomodoroSessions
        });
    } catch (error) {
        console.error('Get date analytics error:', error);
        res.status(500).json({ error: 'Server error while fetching date analytics' });
    }
});

// Get productivity trends
router.get("/trends", authMiddleware, async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        let groupBy = '$dayOfWeek';

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 6);
            groupBy = '$dayOfWeek';
        } else if (period === 'month') {
            startDate.setDate(startDate.getDate() - 29);
            groupBy = '$dayOfWeek';
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear(), 0, 1);
            groupBy = '$month';
        }

        const trends = await Analytics.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { [groupBy]: { $dateToString: { format: "%w", date: "$date" } } },
                    avgProductivityScore: { $avg: "$productivityScore" },
                    totalTasksCompleted: { $sum: "$tasksCompleted" },
                    totalWorkMinutes: { $sum: "$totalWorkMinutes" },
                    totalPomodoroSessions: { $sum: "$pomodoroSessions" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Get task completion trends by category
        const categoryTrends = await Analytics.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    assignment: { $sum: "$tasksByCategory.assignment" },
                    exam: { $sum: "$tasksByCategory.exam" },
                    personal: { $sum: "$tasksByCategory.personal" },
                    project: { $sum: "$tasksByCategory.project" }
                }
            }
        ]);

        // Get priority distribution
        const priorityTrends = await Analytics.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    low: { $sum: "$tasksByPriority.low" },
                    medium: { $sum: "$tasksByPriority.medium" },
                    high: { $sum: "$tasksByPriority.high" },
                    urgent: { $sum: "$tasksByPriority.urgent" }
                }
            }
        ]);

        res.json({
            period,
            productivityTrends: trends,
            categoryDistribution: categoryTrends[0] || {},
            priorityDistribution: priorityTrends[0] || {}
        });
    } catch (error) {
        console.error('Get trends error:', error);
        res.status(500).json({ error: 'Server error while fetching trends' });
    }
});

// Get productivity insights and recommendations
router.get("/insights", authMiddleware, async (req, res) => {
    try {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 29);
        last30Days.setHours(0, 0, 0, 0);

        const analytics = await Analytics.find({
            userId: req.user._id,
            date: { $gte: last30Days }
        }).sort({ date: -1 });

        if (analytics.length === 0) {
            return res.json({
                insights: ['Start tracking your tasks to get personalized insights!'],
                recommendations: ['Create your first task to begin your productivity journey.']
            });
        }

        const insights = [];
        const recommendations = [];

        // Calculate average productivity score
        const avgProductivity = analytics.reduce((sum, day) => sum + day.productivityScore, 0) / analytics.length;

        if (avgProductivity >= 80) {
            insights.push(`Excellent! Your average productivity score is ${Math.round(avgProductivity)}%`);
        } else if (avgProductivity >= 60) {
            insights.push(`Good work! Your average productivity score is ${Math.round(avgProductivity)}%`);
            recommendations.push('Try breaking down large tasks into smaller, manageable chunks');
        } else {
            insights.push(`Your average productivity score is ${Math.round(avgProductivity)}%. There's room for improvement!`);
            recommendations.push('Consider using the Pomodoro technique to improve focus');
            recommendations.push('Set realistic daily goals and priorities');
        }

        // Analyze work patterns
        const totalWorkMinutes = analytics.reduce((sum, day) => sum + day.totalWorkMinutes, 0);
        const avgWorkMinutes = totalWorkMinutes / analytics.length;

        if (avgWorkMinutes < 60) {
            recommendations.push('Try to dedicate at least 1 hour per day to focused work');
        } else if (avgWorkMinutes > 480) {
            insights.push('You\'re putting in long work hours. Make sure to take breaks!');
            recommendations.push('Remember to schedule breaks and maintain work-life balance');
        }

        // Analyze task completion patterns
        const totalCompleted = analytics.reduce((sum, day) => sum + day.tasksCompleted, 0);
        const totalCreated = analytics.reduce((sum, day) => sum + day.tasksCreated, 0);

        if (totalCreated > totalCompleted * 2) {
            insights.push('You create more tasks than you complete. Consider setting smaller, achievable goals.');
            recommendations.push('Focus on completing existing tasks before adding new ones');
        }

        // Analyze category preferences
        const categoryTotals = analytics.reduce((acc, day) => {
            acc.assignment += day.tasksByCategory.assignment;
            acc.exam += day.tasksByCategory.exam;
            acc.personal += day.tasksByCategory.personal;
            acc.project += day.tasksByCategory.project;
            return acc;
        }, { assignment: 0, exam: 0, personal: 0, project: 0 });

        const maxCategory = Object.keys(categoryTotals).reduce((a, b) =>
            categoryTotals[a] > categoryTotals[b] ? a : b
        );

        if (categoryTotals[maxCategory] > 0) {
            insights.push(`You focus most on ${maxCategory} tasks`);
        }

        res.json({
            insights,
            recommendations,
            stats: {
                avgProductivity: Math.round(avgProductivity),
                avgWorkMinutes: Math.round(avgWorkMinutes),
                completionRate: totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ error: 'Server error while generating insights' });
    }
});

// Helper function to calculate streaks
async function calculateStreaks(userId) {
    try {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 29);
        last30Days.setHours(0, 0, 0, 0);

        const analytics = await Analytics.find({
            userId,
            date: { $gte: last30Days }
        }).sort({ date: -1 });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (let i = 0; i < analytics.length; i++) {
            const day = analytics[i];

            if (day.tasksCompleted > 0) {
                if (i === 0) currentStreak = 1;
                else if (i === currentStreak) currentStreak++;

                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                if (i < currentStreak) currentStreak = 0;
                tempStreak = 0;
            }
        }

        return {
            currentStreak,
            longestStreak
        };
    } catch (error) {
        console.error('Calculate streaks error:', error);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

export default router;
