import express from 'express';
import Analytics from '../models/Analytics.js';
import Task from '../models/Task.js';
import { PomodoroSession } from '../models/Pomodoro.js';
import { authMiddleware } from '../middleware/auth.js';
import { getGeminiRecommendation } from '../services/geminiService.js';

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

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 6);
        } else if (period === 'month') {
            startDate.setDate(startDate.getDate() - 29);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear(), 0, 1);
        }

        console.log('Trends query - Start date:', startDate, 'User ID:', req.user._id);

        // Get analytics data
        const analyticsData = await Analytics.find({
            userId: req.user._id,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        // Process the data manually to avoid aggregation issues
        const dayOfWeekMap = {};
        let totalProductivityScore = 0;
        let totalTasksCompleted = 0;
        let totalWorkMinutes = 0;
        let totalPomodoroSessions = 0;
        let count = 0;

        analyticsData.forEach(entry => {
            const dayOfWeek = entry.date.getDay() + 1; // MongoDB uses 1-7, Sunday=1

            if (!dayOfWeekMap[dayOfWeek]) {
                dayOfWeekMap[dayOfWeek] = {
                    _id: dayOfWeek,
                    avgProductivityScore: 0,
                    totalTasksCompleted: 0,
                    totalWorkMinutes: 0,
                    totalPomodoroSessions: 0,
                    count: 0
                };
            }

            dayOfWeekMap[dayOfWeek].totalTasksCompleted += entry.tasksCompleted || 0;
            dayOfWeekMap[dayOfWeek].totalWorkMinutes += entry.totalWorkMinutes || 0;
            dayOfWeekMap[dayOfWeek].totalPomodoroSessions += entry.pomodoroSessions || 0;
            dayOfWeekMap[dayOfWeek].avgProductivityScore += entry.productivityScore || 0;
            dayOfWeekMap[dayOfWeek].count++;

            totalProductivityScore += entry.productivityScore || 0;
            totalTasksCompleted += entry.tasksCompleted || 0;
            totalWorkMinutes += entry.totalWorkMinutes || 0;
            totalPomodoroSessions += entry.pomodoroSessions || 0;
            count++;
        });

        // Calculate averages
        Object.values(dayOfWeekMap).forEach(day => {
            if (day.count > 0) {
                day.avgProductivityScore = day.avgProductivityScore / day.count;
            }
        });

        // Convert to array and sort
        const trends = Object.values(dayOfWeekMap).sort((a, b) => a._id - b._id);

        // Calculate category and priority distributions manually
        let categoryDistribution = {
            assignment: 0,
            exam: 0,
            personal: 0,
            project: 0
        };

        let priorityDistribution = {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
        };

        analyticsData.forEach(entry => {
            if (entry.tasksByCategory) {
                categoryDistribution.assignment += entry.tasksByCategory.assignment || 0;
                categoryDistribution.exam += entry.tasksByCategory.exam || 0;
                categoryDistribution.personal += entry.tasksByCategory.personal || 0;
                categoryDistribution.project += entry.tasksByCategory.project || 0;
            }

            if (entry.tasksByPriority) {
                priorityDistribution.low += entry.tasksByPriority.low || 0;
                priorityDistribution.medium += entry.tasksByPriority.medium || 0;
                priorityDistribution.high += entry.tasksByPriority.high || 0;
                priorityDistribution.urgent += entry.tasksByPriority.urgent || 0;
            }
        });

        res.json({
            period,
            productivityTrends: trends,
            categoryDistribution,
            priorityDistribution
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

        // Get user analytics data
        const analytics = await Analytics.find({
            userId: req.user._id,
            date: { $gte: last30Days }
        }).sort({ date: -1 });

        // Get user tasks data
        const tasks = await Task.find({
            userId: req.user._id,
            createdAt: { $gte: last30Days }
        }).sort({ createdAt: -1 });

        // Get user Pomodoro sessions
        const pomodoroSessions = await PomodoroSession.find({
            userId: req.user._id,
            createdAt: { $gte: last30Days }
        }).sort({ createdAt: -1 });

        if (analytics.length === 0 && tasks.length === 0) {
            return res.json({
                insights: ['🚀 Start tracking your tasks and productivity to get personalized AI insights!'],
                recommendations: ['📝 Create your first task to begin your productivity journey with AI-powered recommendations.'],
                source: 'default'
            });
        }

        // Prepare data summary for Gemini AI
        const analyticsData = {
            totalDays: analytics.length,
            avgProductivityScore: analytics.length > 0 ? analytics.reduce((sum, day) => sum + day.productivityScore, 0) / analytics.length : 0,
            totalWorkMinutes: analytics.reduce((sum, day) => sum + day.totalWorkMinutes, 0),
            avgWorkMinutes: analytics.length > 0 ? analytics.reduce((sum, day) => sum + day.totalWorkMinutes, 0) / analytics.length : 0,
            tasksCompleted: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
            tasksCreated: analytics.reduce((sum, day) => sum + day.tasksCreated, 0),
            pomodoroSessions: pomodoroSessions.length,
            taskCategories: {
                assignment: analytics.reduce((sum, day) => sum + (day.tasksByCategory?.assignment || 0), 0),
                exam: analytics.reduce((sum, day) => sum + (day.tasksByCategory?.exam || 0), 0),
                personal: analytics.reduce((sum, day) => sum + (day.tasksByCategory?.personal || 0), 0),
                project: analytics.reduce((sum, day) => sum + (day.tasksByCategory?.project || 0), 0)
            },
            recentTasks: tasks.slice(0, 5).map(task => ({
                title: task.title,
                category: task.category,
                priority: task.priority,
                status: task.status,
                deadline: task.deadline
            }))
        };

        // Create AI prompt for Gemini
        const prompt = `
You are an AI study coach analyzing a student's productivity data. Based on this data, provide personalized insights and actionable recommendations.

STUDENT DATA (Last 30 days):
- Days tracked: ${analyticsData.totalDays}
- Average productivity score: ${Math.round(analyticsData.avgProductivityScore)}%
- Total work time: ${Math.round(analyticsData.totalWorkMinutes / 60)} hours
- Average daily work: ${Math.round(analyticsData.avgWorkMinutes)} minutes
- Tasks completed: ${analyticsData.tasksCompleted}
- Tasks created: ${analyticsData.tasksCreated}
- Pomodoro sessions: ${analyticsData.pomodoroSessions}
- Task distribution: ${analyticsData.taskCategories.assignment} assignments, ${analyticsData.taskCategories.exam} exams, ${analyticsData.taskCategories.project} projects, ${analyticsData.taskCategories.personal} personal
- Recent tasks: ${analyticsData.recentTasks.map(t => `${t.title} (${t.category}, ${t.priority} priority, ${t.status})`).join('; ')}

Please provide EXACTLY 3-5 insights and 3-5 actionable recommendations in this JSON format:
{
  "insights": [
    "insight 1 with emoji",
    "insight 2 with emoji", 
    "insight 3 with emoji"
  ],
  "recommendations": [
    "recommendation 1 with emoji",
    "recommendation 2 with emoji",
    "recommendation 3 with emoji"
  ]
}

Focus on:
- Study patterns and productivity trends
- Work-life balance
- Task management efficiency
- Subject/category focus
- Time management skills
- Areas for improvement
- Positive reinforcement for good habits

Keep insights encouraging and recommendations specific and actionable. Use emojis to make it engaging.`;

        try {
            // Get AI-generated insights from Gemini
            const geminiResponse = await getGeminiRecommendation(prompt);

            // Parse the response
            let aiData;
            try {
                // Try to extract JSON from the response
                const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.log('Error parsing Gemini response, using fallback');
                // Fallback to manual parsing or default insights
                aiData = {
                    insights: [geminiResponse.split('\n').filter(line => line.trim().length > 0)[0] || '🎯 Keep building your productivity habits!'],
                    recommendations: ['📈 Continue tracking your progress for better insights!']
                };
            }

            res.json({
                insights: aiData.insights || ['🎯 Keep building your productivity habits!'],
                recommendations: aiData.recommendations || ['📈 Continue tracking your progress for better insights!'],
                stats: {
                    avgProductivity: Math.round(analyticsData.avgProductivityScore),
                    avgWorkMinutes: Math.round(analyticsData.avgWorkMinutes),
                    completionRate: analyticsData.tasksCreated > 0 ? Math.round((analyticsData.tasksCompleted / analyticsData.tasksCreated) * 100) : 0,
                    pomodoroSessions: analyticsData.pomodoroSessions
                },
                source: 'gemini-ai'
            });

        } catch (geminiError) {
            console.log('Gemini API error, falling back to rule-based insights:', geminiError.message);

            // Fallback to original rule-based insights
            const insights = [];
            const recommendations = [];

            // Calculate average productivity score
            const avgProductivity = analyticsData.avgProductivityScore;

            if (avgProductivity >= 80) {
                insights.push(`🌟 Excellent! Your average productivity score is ${Math.round(avgProductivity)}%`);
            } else if (avgProductivity >= 60) {
                insights.push(`👍 Good work! Your average productivity score is ${Math.round(avgProductivity)}%`);
                recommendations.push('🧩 Try breaking down large tasks into smaller, manageable chunks');
            } else {
                insights.push(`📊 Your average productivity score is ${Math.round(avgProductivity)}%. There's room for improvement!`);
                recommendations.push('🍅 Consider using the Pomodoro technique to improve focus');
                recommendations.push('🎯 Set realistic daily goals and priorities');
            }

            // Analyze work patterns
            if (analyticsData.avgWorkMinutes < 60) {
                recommendations.push('⏰ Try to dedicate at least 1 hour per day to focused work');
            } else if (analyticsData.avgWorkMinutes > 480) {
                insights.push('⚡ You\'re putting in long work hours. Make sure to take breaks!');
                recommendations.push('🧘 Remember to schedule breaks and maintain work-life balance');
            }

            // Analyze task completion patterns
            if (analyticsData.tasksCreated > analyticsData.tasksCompleted * 2) {
                insights.push('📝 You create more tasks than you complete. Consider setting smaller, achievable goals.');
                recommendations.push('✅ Focus on completing existing tasks before adding new ones');
            }

            res.json({
                insights,
                recommendations,
                stats: {
                    avgProductivity: Math.round(analyticsData.avgProductivityScore),
                    avgWorkMinutes: Math.round(analyticsData.avgWorkMinutes),
                    completionRate: analyticsData.tasksCreated > 0 ? Math.round((analyticsData.tasksCompleted / analyticsData.tasksCreated) * 100) : 0,
                    pomodoroSessions: analyticsData.pomodoroSessions
                },
                source: 'rule-based'
            });
        }

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
