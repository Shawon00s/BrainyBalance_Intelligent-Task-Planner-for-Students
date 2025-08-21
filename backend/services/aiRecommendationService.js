import Analytics from '../models/Analytics.js';
import Task from '../models/Task.js';
import Schedule from '../models/Schedule.js';
import AIRecommendation from '../models/AIRecommendation.js';
import UserPreferences from '../models/UserPreferences.js';

class AIRecommendationEngine {

    /**
     * Generate comprehensive AI recommendations for a user
     */
    static async generateRecommendations(userId) {
        try {
            // Get user data
            const [analytics, tasks, schedules, preferences] = await Promise.all([
                this.getUserAnalytics(userId),
                this.getUserTasks(userId),
                this.getUserSchedules(userId),
                this.getUserPreferences(userId)
            ]);

            const recommendations = [];

            // 1. Task Priority Recommendations
            const priorityRecs = await this.generateTaskPriorityRecommendations(userId, tasks, analytics, preferences);
            recommendations.push(...priorityRecs);

            // 2. Optimal Study Time Recommendations
            const studyTimeRecs = await this.generateStudyTimeRecommendations(userId, analytics, preferences);
            recommendations.push(...studyTimeRecs);

            // 3. Workload Balancing Recommendations
            const workloadRecs = await this.generateWorkloadRecommendations(userId, tasks, preferences);
            recommendations.push(...workloadRecs);

            // 4. Deadline Management Recommendations
            const deadlineRecs = await this.generateDeadlineRecommendations(userId, tasks, preferences);
            recommendations.push(...deadlineRecs);

            // 5. Pattern-based Suggestions
            const patternRecs = await this.generatePatternRecommendations(userId, analytics, preferences);
            recommendations.push(...patternRecs);

            // 6. Schedule Optimization Recommendations
            const scheduleRecs = await this.generateScheduleOptimizations(userId, tasks, schedules, preferences);
            recommendations.push(...scheduleRecs);

            // Save recommendations to database
            await this.saveRecommendations(userId, recommendations);

            return recommendations;
        } catch (error) {
            console.error('AI Recommendation Generation Error:', error);
            throw error;
        }
    }

    /**
     * Generate task priority recommendations using AI algorithms
     */
    static async generateTaskPriorityRecommendations(userId, tasks, analytics, preferences) {
        const recommendations = [];
        const pendingTasks = tasks.filter(task => task.status === 'pending');

        if (pendingTasks.length === 0) return recommendations;

        // Priority scoring algorithm
        const scoredTasks = pendingTasks.map(task => {
            const score = this.calculatePriorityScore(task, analytics, preferences);
            return { task, score };
        });

        // Sort by priority score
        scoredTasks.sort((a, b) => b.score - a.score);

        // Generate recommendations for top priority tasks
        const topTasks = scoredTasks.slice(0, 3);

        topTasks.forEach((item, index) => {
            const confidence = Math.min(95, 70 + (item.score * 25));

            recommendations.push({
                type: 'task_priority',
                title: `High Priority: ${item.task.title}`,
                description: `Based on deadline, difficulty, and your performance patterns, this task should be prioritized. Priority score: ${Math.round(item.score * 100)}%`,
                priority: index === 0 ? 'urgent' : 'high',
                confidence: Math.round(confidence),
                data: {
                    taskId: item.task._id,
                    priorityScore: item.score,
                    suggestedTimeSlot: this.suggestOptimalTimeSlot(item.task, analytics, preferences),
                    estimatedDuration: this.estimateTaskDuration(item.task, analytics, preferences)
                },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });
        });

        return recommendations;
    }

    /**
     * Generate optimal study time recommendations
     */
    static async generateStudyTimeRecommendations(userId, analytics, preferences) {
        const recommendations = [];

        // Analyze productivity patterns from analytics
        const productivityPattern = this.analyzeProductivityPatterns(analytics);

        if (productivityPattern.peakHours.length > 0) {
            const peakHour = productivityPattern.peakHours[0];

            recommendations.push({
                type: 'study_time',
                title: 'Optimal Study Time Detected',
                description: `Your productivity peaks at ${this.formatHour(peakHour)}. Schedule important tasks during this time for maximum efficiency.`,
                priority: 'high',
                confidence: productivityPattern.confidence,
                data: {
                    peakHours: productivityPattern.peakHours,
                    lowEnergyHours: productivityPattern.lowEnergyHours,
                    suggestedSchedule: this.generateOptimalSchedule(productivityPattern, preferences)
                },
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        }

        // Check for study session length optimization
        if (analytics.length > 7) {
            const avgSessionLength = this.calculateAverageSessionLength(analytics);
            const optimalLength = preferences.studyPatterns.maxConsecutiveStudyHours * 60;

            if (Math.abs(avgSessionLength - optimalLength) > 30) {
                recommendations.push({
                    type: 'study_time',
                    title: 'Study Session Length Optimization',
                    description: `Your current average study session is ${Math.round(avgSessionLength)} minutes. Consider ${avgSessionLength > optimalLength ? 'shorter' : 'longer'} sessions with breaks for better retention.`,
                    priority: 'medium',
                    confidence: 75,
                    data: {
                        currentAverage: avgSessionLength,
                        suggestedLength: optimalLength,
                        suggestedBreaks: preferences.studyPatterns.preferredBreakDuration
                    },
                    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
                });
            }
        }

        return recommendations;
    }

    /**
     * Generate workload balancing recommendations
     */
    static async generateWorkloadRecommendations(userId, tasks, preferences) {
        const recommendations = [];
        const pendingTasks = tasks.filter(task => task.status === 'pending');

        // Analyze daily workload distribution
        const dailyWorkload = this.calculateDailyWorkload(pendingTasks, preferences);

        const overloadedDays = Object.entries(dailyWorkload).filter(
            ([day, load]) => load > preferences.workloadBalance.maxDailyTasks
        );

        if (overloadedDays.length > 0) {
            const overloadedDay = overloadedDays[0];

            recommendations.push({
                type: 'workload_balance',
                title: 'Workload Redistribution Needed',
                description: `${overloadedDay[0]} has ${overloadedDay[1]} tasks (${Math.round(overloadedDay[1] - preferences.workloadBalance.maxDailyTasks)} over limit). Consider redistributing tasks to maintain balance.`,
                priority: 'high',
                confidence: 85,
                data: {
                    overloadedDays: overloadedDays,
                    redistributionSuggestions: this.generateRedistributionSuggestions(dailyWorkload, preferences),
                    workloadAnalysis: dailyWorkload
                },
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
            });
        }

        // Check for subject balance
        const subjectDistribution = this.analyzeSubjectDistribution(pendingTasks);
        const imbalance = this.detectSubjectImbalance(subjectDistribution);

        if (imbalance.isImbalanced) {
            recommendations.push({
                type: 'workload_balance',
                title: 'Subject Balance Optimization',
                description: `You have ${imbalance.dominantCategory} tasks (${imbalance.percentage}% of workload). Consider balancing with other subjects.`,
                priority: 'medium',
                confidence: 70,
                data: {
                    subjectDistribution,
                    imbalanceDetails: imbalance,
                    balancingSuggestions: this.generateSubjectBalancingSuggestions(subjectDistribution)
                },
                expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
            });
        }

        return recommendations;
    }

    /**
     * Generate deadline management recommendations
     */
    static async generateDeadlineRecommendations(userId, tasks, preferences) {
        const recommendations = [];
        const now = new Date();

        // Find urgent tasks (deadline within threshold)
        const urgentTasks = tasks.filter(task => {
            const deadline = new Date(task.deadline);
            const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
            return daysUntilDeadline <= preferences.priorityPreferences.urgentThreshold && task.status === 'pending';
        });

        if (urgentTasks.length > 0) {
            urgentTasks.forEach(task => {
                const deadline = new Date(task.deadline);
                const hoursLeft = Math.round((deadline - now) / (1000 * 60 * 60));

                recommendations.push({
                    type: 'deadline_alert',
                    title: `Urgent: ${task.title}`,
                    description: `This task is due in ${hoursLeft < 24 ? hoursLeft + ' hours' : Math.round(hoursLeft / 24) + ' days'}. Immediate action required!`,
                    priority: 'urgent',
                    confidence: 95,
                    data: {
                        taskId: task._id,
                        deadline: task.deadline,
                        hoursRemaining: hoursLeft,
                        suggestedActions: this.generateUrgentTaskActions(task, hoursLeft),
                        requiredFocus: this.calculateRequiredFocus(task, hoursLeft)
                    },
                    expiresAt: deadline
                });
            });
        }

        // Find tasks that might become problematic
        const riskTasks = tasks.filter(task => {
            const deadline = new Date(task.deadline);
            const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
            return daysUntilDeadline <= preferences.priorityPreferences.highThreshold &&
                daysUntilDeadline > preferences.priorityPreferences.urgentThreshold &&
                task.status === 'pending';
        });

        if (riskTasks.length > 2) {
            recommendations.push({
                type: 'deadline_alert',
                title: 'Multiple Deadlines Approaching',
                description: `You have ${riskTasks.length} tasks due within ${preferences.priorityPreferences.highThreshold} days. Consider creating a focused schedule.`,
                priority: 'high',
                confidence: 80,
                data: {
                    riskTasks: riskTasks.map(task => ({
                        id: task._id,
                        title: task.title,
                        deadline: task.deadline,
                        priority: task.priority
                    })),
                    suggestedSchedule: this.generateFocusedSchedule(riskTasks, preferences)
                },
                expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
            });
        }

        return recommendations;
    }

    /**
     * Generate pattern-based suggestions
     */
    static async generatePatternRecommendations(userId, analytics, preferences) {
        const recommendations = [];

        if (analytics.length < 7) return recommendations;

        // Analyze completion patterns
        const completionPattern = this.analyzeCompletionPatterns(analytics);

        if (completionPattern.weekdayPerformance > completionPattern.weekendPerformance + 20) {
            recommendations.push({
                type: 'pattern_suggestion',
                title: 'Weekend Productivity Opportunity',
                description: `Your weekday productivity (${completionPattern.weekdayPerformance}%) is significantly higher than weekends (${completionPattern.weekendPerformance}%). Consider light study sessions on weekends.`,
                priority: 'medium',
                confidence: 75,
                data: {
                    weekdayPerformance: completionPattern.weekdayPerformance,
                    weekendPerformance: completionPattern.weekendPerformance,
                    suggestedWeekendTasks: this.suggestWeekendTasks(completionPattern)
                },
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        }

        // Analyze procrastination patterns
        const procrastinationRisk = this.calculateProcrastinationRisk(analytics);

        if (procrastinationRisk.score > 70) {
            recommendations.push({
                type: 'pattern_suggestion',
                title: 'Procrastination Prevention',
                description: `Analysis shows ${procrastinationRisk.score}% procrastination risk. Try the Pomodoro technique and break tasks into smaller chunks.`,
                priority: 'high',
                confidence: procrastinationRisk.confidence,
                data: {
                    riskScore: procrastinationRisk.score,
                    triggerPatterns: procrastinationRisk.triggers,
                    preventionStrategies: this.generateProcrastinationStrategies(procrastinationRisk)
                },
                expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
            });
        }

        return recommendations;
    }

    /**
     * Generate schedule optimization recommendations
     */
    static async generateScheduleOptimizations(userId, tasks, schedules, preferences) {
        const recommendations = [];

        // Analyze schedule efficiency
        const scheduleAnalysis = this.analyzeScheduleEfficiency(schedules, tasks, preferences);

        if (scheduleAnalysis.efficiencyScore < 70) {
            recommendations.push({
                type: 'schedule_optimization',
                title: 'Schedule Optimization Available',
                description: `Your current schedule efficiency is ${scheduleAnalysis.efficiencyScore}%. AI suggests optimizations for better time utilization.`,
                priority: 'medium',
                confidence: 80,
                data: {
                    currentEfficiency: scheduleAnalysis.efficiencyScore,
                    optimizationSuggestions: scheduleAnalysis.suggestions,
                    proposedSchedule: this.generateOptimizedSchedule(tasks, preferences),
                    timeSlotRecommendations: scheduleAnalysis.timeSlotRecommendations
                },
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        }

        // Check for schedule gaps
        const scheduleGaps = this.findScheduleGaps(schedules, preferences);

        if (scheduleGaps.length > 0) {
            recommendations.push({
                type: 'schedule_optimization',
                title: 'Utilize Free Time Slots',
                description: `Found ${scheduleGaps.length} unused time slots that could be optimized for productivity.`,
                priority: 'low',
                confidence: 65,
                data: {
                    availableSlots: scheduleGaps,
                    suggestedActivities: this.suggestActivitiesForGaps(scheduleGaps, tasks, preferences)
                },
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
            });
        }

        return recommendations;
    }

    // Helper methods for calculations and analysis

    static calculatePriorityScore(task, analytics, preferences) {
        const now = new Date();
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

        // Deadline urgency factor (0-1)
        const urgencyFactor = Math.max(0, Math.min(1, 1 - (daysUntilDeadline / 14)));

        // Priority weight
        const priorityWeights = { low: 0.25, medium: 0.5, high: 0.75, urgent: 1.0 };
        const priorityFactor = priorityWeights[task.priority] || 0.5;

        // Category difficulty factor
        const difficultyFactor = preferences.difficultyWeights[task.category] || 1.0;

        // Calculate composite score
        const score = (
            urgencyFactor * preferences.workloadBalance.balanceFactors.deadline +
            priorityFactor * preferences.workloadBalance.balanceFactors.priority +
            (difficultyFactor / 2) * preferences.workloadBalance.balanceFactors.difficulty
        );

        return Math.max(0, Math.min(1, score));
    }

    static analyzeProductivityPatterns(analytics) {
        // Simplified productivity pattern analysis
        const hourlyProductivity = {};
        let totalSessions = 0;

        analytics.forEach(day => {
            if (day.productivityScore > 60) {
                // Assuming peak hours are 9-17 for simplification
                for (let hour = 9; hour <= 17; hour++) {
                    hourlyProductivity[hour] = (hourlyProductivity[hour] || 0) + day.productivityScore;
                    totalSessions++;
                }
            }
        });

        const avgProductivity = Object.values(hourlyProductivity).reduce((a, b) => a + b, 0) / totalSessions;
        const peakHours = Object.entries(hourlyProductivity)
            .filter(([hour, score]) => score > avgProductivity)
            .map(([hour]) => parseInt(hour))
            .sort((a, b) => hourlyProductivity[b] - hourlyProductivity[a]);

        return {
            peakHours: peakHours.slice(0, 3),
            lowEnergyHours: [13, 14, 15], // Common post-lunch dip
            confidence: Math.min(95, 50 + (analytics.length * 2))
        };
    }

    static calculateDailyWorkload(tasks, preferences) {
        const dailyWorkload = {
            Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
            Friday: 0, Saturday: 0, Sunday: 0
        };

        tasks.forEach(task => {
            const deadline = new Date(task.deadline);
            const dayName = deadline.toLocaleDateString('en-US', { weekday: 'long' });
            if (dailyWorkload[dayName] !== undefined) {
                dailyWorkload[dayName] += 1;
            }
        });

        return dailyWorkload;
    }

    static formatHour(hour) {
        return hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
    }

    // Additional helper methods would be implemented here...
    static async getUserAnalytics(userId) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 29);
        return await Analytics.find({ userId, date: { $gte: last30Days } }).sort({ date: -1 });
    }

    static async getUserTasks(userId) {
        return await Task.find({ userId }).sort({ deadline: 1 });
    }

    static async getUserSchedules(userId) {
        return await Schedule.find({ userId }).sort({ date: 1 });
    }

    static async getUserPreferences(userId) {
        let preferences = await UserPreferences.findOne({ userId });
        if (!preferences) {
            preferences = new UserPreferences({ userId });
            await preferences.save();
        }
        return preferences;
    }

    static async saveRecommendations(userId, recommendations) {
        // Remove old recommendations of the same type
        await AIRecommendation.deleteMany({ userId, isActive: true });

        // Save new recommendations
        const docs = recommendations.map(rec => ({
            userId,
            ...rec,
            isActive: true
        }));

        if (docs.length > 0) {
            await AIRecommendation.insertMany(docs);
        }
    }

    // Placeholder implementations for complex algorithms
    static suggestOptimalTimeSlot(task, analytics, preferences) {
        return `${preferences.studyPatterns.optimalStudyHours.start}:00 - ${preferences.studyPatterns.optimalStudyHours.start + 2}:00`;
    }

    static estimateTaskDuration(task, analytics, preferences) {
        const baseDuration = 60; // minutes
        const difficultyMultiplier = preferences.difficultyWeights[task.category] || 1.0;
        return Math.round(baseDuration * difficultyMultiplier);
    }

    static generateOptimalSchedule(productivityPattern, preferences) {
        return productivityPattern.peakHours.map(hour => ({
            time: this.formatHour(hour),
            activity: 'High-focus tasks',
            duration: preferences.studyPatterns.maxConsecutiveStudyHours * 60
        }));
    }

    static calculateAverageSessionLength(analytics) {
        const totalMinutes = analytics.reduce((sum, day) => sum + day.totalWorkMinutes, 0);
        return totalMinutes / analytics.length;
    }

    static generateRedistributionSuggestions(dailyWorkload, preferences) {
        return ['Move non-urgent tasks to less busy days', 'Break large tasks into smaller chunks'];
    }

    static analyzeSubjectDistribution(tasks) {
        const distribution = {};
        tasks.forEach(task => {
            distribution[task.category] = (distribution[task.category] || 0) + 1;
        });
        return distribution;
    }

    static detectSubjectImbalance(distribution) {
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        const maxEntry = Object.entries(distribution).reduce((max, entry) =>
            entry[1] > max[1] ? entry : max, ['', 0]);

        const percentage = Math.round((maxEntry[1] / total) * 100);

        return {
            isImbalanced: percentage > 60,
            dominantCategory: maxEntry[0],
            percentage,
            total
        };
    }

    static generateSubjectBalancingSuggestions(distribution) {
        return ['Diversify your study subjects', 'Allocate time to underrepresented categories'];
    }

    static generateUrgentTaskActions(task, hoursLeft) {
        if (hoursLeft < 6) {
            return ['Focus immediately', 'Eliminate distractions', 'Break into micro-tasks'];
        } else if (hoursLeft < 24) {
            return ['Schedule focused session today', 'Prepare materials', 'Set reminders'];
        } else {
            return ['Create detailed plan', 'Schedule work sessions', 'Gather resources'];
        }
    }

    static calculateRequiredFocus(task, hoursLeft) {
        return Math.min(100, Math.round((48 - hoursLeft) * 2));
    }

    static generateFocusedSchedule(tasks, preferences) {
        return tasks.map((task, index) => ({
            task: task.title,
            suggestedTime: `${preferences.studyPatterns.optimalStudyHours.start + index}:00`,
            duration: this.estimateTaskDuration(task, [], preferences)
        }));
    }

    static analyzeCompletionPatterns(analytics) {
        const weekdayData = analytics.filter((_, index) => index % 7 < 5);
        const weekendData = analytics.filter((_, index) => index % 7 >= 5);

        const weekdayAvg = weekdayData.reduce((sum, day) => sum + day.productivityScore, 0) / weekdayData.length;
        const weekendAvg = weekendData.reduce((sum, day) => sum + day.productivityScore, 0) / weekendData.length;

        return {
            weekdayPerformance: Math.round(weekdayAvg || 0),
            weekendPerformance: Math.round(weekendAvg || 0)
        };
    }

    static suggestWeekendTasks(pattern) {
        return ['Light review sessions', 'Organizing notes', 'Planning upcoming week'];
    }

    static calculateProcrastinationRisk(analytics) {
        const recentProductivity = analytics.slice(0, 7).reduce((sum, day) => sum + day.productivityScore, 0) / 7;
        const overallProductivity = analytics.reduce((sum, day) => sum + day.productivityScore, 0) / analytics.length;

        const riskScore = Math.max(0, Math.round((overallProductivity - recentProductivity) * 2));

        return {
            score: riskScore,
            confidence: 75,
            triggers: ['Deadline pressure', 'Task complexity', 'Lack of clear goals']
        };
    }

    static generateProcrastinationStrategies(risk) {
        return [
            'Use 25-minute Pomodoro sessions',
            'Break large tasks into 15-minute chunks',
            'Set up accountability systems',
            'Remove distractions from workspace'
        ];
    }

    static analyzeScheduleEfficiency(schedules, tasks, preferences) {
        return {
            efficiencyScore: 65,
            suggestions: ['Consolidate similar tasks', 'Add buffer time between sessions'],
            timeSlotRecommendations: ['9-11 AM: High-focus work', '2-4 PM: Routine tasks']
        };
    }

    static generateOptimizedSchedule(tasks, preferences) {
        return tasks.slice(0, 5).map((task, index) => ({
            time: `${preferences.studyPatterns.optimalStudyHours.start + index}:00`,
            task: task.title,
            duration: this.estimateTaskDuration(task, [], preferences)
        }));
    }

    static findScheduleGaps(schedules, preferences) {
        return [
            { day: 'Monday', time: '11:00-12:00', duration: 60 },
            { day: 'Wednesday', time: '15:00-16:00', duration: 60 }
        ];
    }

    static suggestActivitiesForGaps(gaps, tasks, preferences) {
        return gaps.map(gap => ({
            gap,
            suggestions: ['Quick review', 'Organize notes', 'Plan next session']
        }));
    }
}

export default AIRecommendationEngine;
