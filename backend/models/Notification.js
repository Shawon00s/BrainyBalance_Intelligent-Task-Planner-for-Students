import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['task_reminder', 'deadline_warning', 'task_completed', 'schedule_reminder', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    readAt: {
        type: Date
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedEntityType: {
        type: String,
        enum: ['task', 'schedule', 'pomodoro']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, {
    timestamps: true
});

// Index for better query performance
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
