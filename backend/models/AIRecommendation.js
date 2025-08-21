import mongoose from "mongoose";

const aiRecommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['task_priority', 'study_time', 'workload_balance', 'deadline_alert', 'pattern_suggestion', 'schedule_optimization'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isApplied: {
        type: Boolean,
        default: false
    },
    appliedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
aiRecommendationSchema.index({ userId: 1, isActive: 1, type: 1 });
aiRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AIRecommendation = mongoose.model('AIRecommendation', aiRecommendationSchema);

export default AIRecommendation;
