import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    deadline: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    category: {
        type: String,
        enum: ['assignment', 'exam', 'personal', 'project'],
        default: 'personal'
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 60
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ deadline: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
