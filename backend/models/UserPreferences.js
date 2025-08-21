import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    studyPatterns: {
        optimalStudyHours: {
            start: { type: Number, default: 9 }, // 9 AM
            end: { type: Number, default: 17 }   // 5 PM
        },
        preferredBreakDuration: {
            type: Number,
            default: 15 // minutes
        },
        maxConsecutiveStudyHours: {
            type: Number,
            default: 2
        },
        weekendStudyPreference: {
            type: Boolean,
            default: false
        }
    },
    difficultyWeights: {
        assignment: { type: Number, default: 1.0 },
        exam: { type: Number, default: 1.5 },
        project: { type: Number, default: 1.2 },
        personal: { type: Number, default: 0.8 }
    },
    priorityPreferences: {
        urgentThreshold: { type: Number, default: 1 }, // days before deadline
        highThreshold: { type: Number, default: 3 },
        mediumThreshold: { type: Number, default: 7 }
    },
    workloadBalance: {
        maxDailyTasks: { type: Number, default: 5 },
        maxDailyStudyHours: { type: Number, default: 8 },
        balanceFactors: {
            difficulty: { type: Number, default: 0.4 },
            deadline: { type: Number, default: 0.35 },
            priority: { type: Number, default: 0.25 }
        }
    },
    learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
        default: 'visual'
    },
    subjectPerformance: {
        type: Map,
        of: {
            averageScore: { type: Number, default: 0 },
            completionRate: { type: Number, default: 0 },
            timeToComplete: { type: Number, default: 0 }, // average minutes
            difficulty: { type: Number, default: 1 } // 1-5 scale
        },
        default: new Map()
    }
}, {
    timestamps: true
});

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;
