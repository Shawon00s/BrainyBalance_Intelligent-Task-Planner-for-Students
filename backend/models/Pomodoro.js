import mongoose from "mongoose";

const pomodoroSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    totalWorkDuration: {
        type: Number, // in minutes
        default: 0
    },
    totalBreakDuration: {
        type: Number, // in minutes
        default: 0
    },
    sessionsCompleted: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

const pomodoroIntervalSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PomodoroSession',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    type: {
        type: String,
        enum: ['work', 'shortBreak', 'longBreak'],
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
pomodoroSessionSchema.index({ userId: 1, createdAt: -1 });
pomodoroIntervalSchema.index({ sessionId: 1, startTime: 1 });

const PomodoroSession = mongoose.model('PomodoroSession', pomodoroSessionSchema);
const PomodoroInterval = mongoose.model('PomodoroInterval', pomodoroIntervalSchema);

export { PomodoroSession, PomodoroInterval };
