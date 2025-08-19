import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    tasksCompleted: {
        type: Number,
        default: 0
    },
    tasksCreated: {
        type: Number,
        default: 0
    },
    totalWorkMinutes: {
        type: Number,
        default: 0
    },
    pomodoroSessions: {
        type: Number,
        default: 0
    },
    productivityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    tasksByPriority: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        urgent: { type: Number, default: 0 }
    },
    tasksByCategory: {
        assignment: { type: Number, default: 0 },
        exam: { type: Number, default: 0 },
        personal: { type: Number, default: 0 },
        project: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Ensure one analytics record per user per day
analyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
