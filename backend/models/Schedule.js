import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    reminderSet: {
        type: Boolean,
        default: false
    },
    reminderTime: {
        type: Date
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }
}, {
    timestamps: true
});

// Index for better query performance
scheduleSchema.index({ userId: 1, date: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
