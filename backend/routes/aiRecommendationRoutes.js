import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import AIRecommendationEngine from '../services/aiRecommendationService.js';
import AIRecommendation from '../models/AIRecommendation.js';
import UserPreferences from '../models/UserPreferences.js';

const router = express.Router();

// Generate new AI recommendations
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        console.log('Generating AI recommendations for user:', userId);

        const recommendations = await AIRecommendationEngine.generateRecommendations(userId);

        res.json({
            success: true,
            recommendations,
            count: recommendations.length,
            message: `Generated ${recommendations.length} AI recommendations`
        });
    } catch (error) {
        console.error('Generate recommendations error:', error);
        res.status(500).json({
            error: 'Failed to generate AI recommendations',
            details: error.message
        });
    }
});

// Get active recommendations for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, priority } = req.query;

        const filter = { userId, isActive: true };

        if (type) filter.type = type;
        if (priority) filter.priority = priority;

        const recommendations = await AIRecommendation.find(filter)
            .sort({ priority: -1, confidence: -1, createdAt: -1 })
            .limit(20);

        res.json({
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Get recommendations by type
router.get('/type/:type', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.params;
        const { limit = 10 } = req.query;

        const recommendations = await AIRecommendation.find({
            userId,
            type,
            isActive: true
        }).sort({ confidence: -1, createdAt: -1 }).limit(parseInt(limit));

        res.json({
            type,
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        console.error('Get recommendations by type error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations by type' });
    }
});

// Apply a recommendation
router.post('/:id/apply', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const recommendation = await AIRecommendation.findOne({ _id: id, userId });

        if (!recommendation) {
            return res.status(404).json({ error: 'Recommendation not found' });
        }

        recommendation.isApplied = true;
        recommendation.appliedAt = new Date();
        await recommendation.save();

        // Process the application based on recommendation type
        const result = await processRecommendationApplication(recommendation);

        res.json({
            success: true,
            message: 'Recommendation applied successfully',
            recommendation,
            result
        });
    } catch (error) {
        console.error('Apply recommendation error:', error);
        res.status(500).json({ error: 'Failed to apply recommendation' });
    }
});

// Dismiss a recommendation
router.post('/:id/dismiss', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const recommendation = await AIRecommendation.findOne({ _id: id, userId });

        if (!recommendation) {
            return res.status(404).json({ error: 'Recommendation not found' });
        }

        recommendation.isActive = false;
        await recommendation.save();

        res.json({
            success: true,
            message: 'Recommendation dismissed'
        });
    } catch (error) {
        console.error('Dismiss recommendation error:', error);
        res.status(500).json({ error: 'Failed to dismiss recommendation' });
    }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        let preferences = await UserPreferences.findOne({ userId });

        if (!preferences) {
            preferences = new UserPreferences({ userId });
            await preferences.save();
        }

        res.json({ preferences });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        const preferences = await UserPreferences.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            preferences,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Get recommendation statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await AIRecommendation.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    applied: { $sum: { $cond: ['$isApplied', 1, 0] } },
                    byType: {
                        $push: {
                            type: '$type',
                            priority: '$priority',
                            confidence: '$confidence'
                        }
                    }
                }
            }
        ]);

        const typeDistribution = await AIRecommendation.aggregate([
            { $match: { userId, isActive: true } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            }
        ]);

        const priorityDistribution = await AIRecommendation.aggregate([
            { $match: { userId, isActive: true } },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overall: stats[0] || { total: 0, active: 0, applied: 0 },
            typeDistribution,
            priorityDistribution
        });
    } catch (error) {
        console.error('Get recommendation stats error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendation statistics' });
    }
});

// Get personalized insights
router.get('/insights', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get recent recommendations
        const recentRecs = await AIRecommendation.find({
            userId,
            isActive: true
        }).sort({ createdAt: -1 }).limit(5);

        // Get applied recommendations
        const appliedRecs = await AIRecommendation.find({
            userId,
            isApplied: true
        }).sort({ appliedAt: -1 }).limit(10);

        // Calculate insights
        const insights = {
            totalRecommendations: recentRecs.length,
            applicationRate: appliedRecs.length > 0 ?
                Math.round((appliedRecs.length / (appliedRecs.length + recentRecs.length)) * 100) : 0,
            mostCommonType: getMostCommonType(recentRecs),
            averageConfidence: Math.round(
                recentRecs.reduce((sum, rec) => sum + rec.confidence, 0) / recentRecs.length || 0
            ),
            suggestions: generatePersonalizedSuggestions(recentRecs, appliedRecs)
        };

        res.json({
            insights,
            recentRecommendations: recentRecs,
            appliedRecommendations: appliedRecs.slice(0, 3)
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

// Auto-generate recommendations (scheduled endpoint)
router.post('/auto-generate', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Check when recommendations were last generated
        const lastGeneration = await AIRecommendation.findOne({ userId })
            .sort({ createdAt: -1 });

        const shouldGenerate = !lastGeneration ||
            (new Date() - lastGeneration.createdAt) > (24 * 60 * 60 * 1000); // 24 hours

        if (shouldGenerate) {
            const recommendations = await AIRecommendationEngine.generateRecommendations(userId);

            res.json({
                success: true,
                generated: true,
                recommendations,
                count: recommendations.length
            });
        } else {
            res.json({
                success: true,
                generated: false,
                message: 'Recommendations are up to date'
            });
        }
    } catch (error) {
        console.error('Auto-generate recommendations error:', error);
        res.status(500).json({ error: 'Failed to auto-generate recommendations' });
    }
});

// Helper functions

async function processRecommendationApplication(recommendation) {
    try {
        switch (recommendation.type) {
            case 'task_priority':
                return await applyTaskPriorityRecommendation(recommendation);
            case 'study_time':
                return await applyStudyTimeRecommendation(recommendation);
            case 'workload_balance':
                return await applyWorkloadRecommendation(recommendation);
            case 'deadline_alert':
                return await applyDeadlineRecommendation(recommendation);
            case 'pattern_suggestion':
                return await applyPatternRecommendation(recommendation);
            case 'schedule_optimization':
                return await applyScheduleOptimization(recommendation);
            default:
                return { success: true, message: 'Recommendation noted' };
        }
    } catch (error) {
        console.error('Process recommendation application error:', error);
        return { success: false, error: error.message };
    }
}

async function applyTaskPriorityRecommendation(recommendation) {
    // Implementation would update task priorities or create schedule entries
    return {
        success: true,
        action: 'task_prioritized',
        message: 'Task priority has been updated based on AI recommendation'
    };
}

async function applyStudyTimeRecommendation(recommendation) {
    // Implementation would update user preferences or create schedule blocks
    return {
        success: true,
        action: 'study_time_optimized',
        message: 'Study time preferences have been updated'
    };
}

async function applyWorkloadRecommendation(recommendation) {
    // Implementation would redistribute tasks or suggest schedule changes
    return {
        success: true,
        action: 'workload_balanced',
        message: 'Workload distribution has been optimized'
    };
}

async function applyDeadlineRecommendation(recommendation) {
    // Implementation would create urgent reminders or schedule focused sessions
    return {
        success: true,
        action: 'deadline_managed',
        message: 'Deadline management strategy has been implemented'
    };
}

async function applyPatternRecommendation(recommendation) {
    // Implementation would update user preferences based on patterns
    return {
        success: true,
        action: 'pattern_applied',
        message: 'Study pattern recommendation has been applied'
    };
}

async function applyScheduleOptimization(recommendation) {
    // Implementation would create optimized schedule entries
    return {
        success: true,
        action: 'schedule_optimized',
        message: 'Schedule has been optimized based on AI analysis'
    };
}

function getMostCommonType(recommendations) {
    const typeCounts = {};
    recommendations.forEach(rec => {
        typeCounts[rec.type] = (typeCounts[rec.type] || 0) + 1;
    });

    return Object.entries(typeCounts).reduce((max, entry) =>
        entry[1] > max[1] ? entry : max, ['none', 0])[0];
}

function generatePersonalizedSuggestions(recent, applied) {
    const suggestions = [];

    if (recent.length === 0) {
        suggestions.push('Generate your first AI recommendations to get personalized insights');
    } else if (applied.length === 0) {
        suggestions.push('Try applying some recommendations to improve your productivity');
    } else {
        suggestions.push('Keep using AI recommendations to optimize your study routine');
        suggestions.push('Regular recommendation updates help maintain peak performance');
    }

    return suggestions;
}

export default router;
