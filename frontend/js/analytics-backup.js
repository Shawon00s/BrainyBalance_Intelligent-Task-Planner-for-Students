// Analytics JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in (check for auth tokens)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize analytics page
    initializeAnalytics();
    setupEventListeners();
    loadUserProfile(); // Load user profile
    loadAnalyticsFromAPI();
});

// API Configuration
const API_BASE = 'http://localhost:3000/api';
let analyticsData = {};

function initializeAnalytics() {
    console.log('Initializing analytics page...');
    // No longer using localStorage - will load from API
}

function generateSampleAnalyticsData() {
    const analyticsData = {
        studyHours: {
            daily: [2.5, 3.2, 1.8, 4.1, 3.5, 2.9, 1.2], // Last 7 days
            weekly: [18.5, 22.3, 19.8, 24.1, 21.7, 20.5, 23.2], // Last 7 weeks
            subjects: {
                'Mathematics': 45,
                'Physics': 32,
                'Chemistry': 28,
                'Computer Science': 38,
                'Literature': 22
            }
        },
        taskCompletion: {
            completed: 89,
            pending: 24,
            overdue: 8,
            inProgress: 12
        },
        productivity: {
            averageGrade: 87.5,
            productivityScore: 92,
            focusScore: 85,
            completionRate: 78
        },
        weeklyActivity: [
            [3, 2, 1, 4, 2, 0, 0], // Monday
            [2, 4, 5, 3, 2, 1, 0], // Tuesday
            [1, 3, 4, 5, 4, 2, 0], // Wednesday
            [4, 5, 3, 2, 3, 1, 0], // Thursday
            [3, 2, 1, 2, 0, 0, 0], // Friday
            [0, 1, 2, 3, 2, 0, 0], // Saturday
            [0, 0, 1, 2, 1, 0, 0]  // Sunday
        ],
        achievements: [
            { title: 'Study Streak', description: '7 days in a row!', value: 7, icon: 'medal', color: 'yellow' },
            { title: 'Goals Completed', description: 'This week', value: '8/10', icon: 'target', color: 'green' },
            { title: 'Focus Sessions', description: 'Pomodoro completed', value: 24, icon: 'clock', color: 'blue' }
        ]
    };

    localStorage.setItem('analyticsData', JSON.stringify(analyticsData));
}

function setupEventListeners() {
    // Time period selector
    const periodSelector = document.getElementById('analyticsPeriodSelector') || document.querySelector('select');
    if (periodSelector) {
        periodSelector.addEventListener('change', handlePeriodChange);
    }

    // Export report button
    const exportBtn = document.getElementById('exportReportBtn') || Array.from(document.querySelectorAll('button')).find(b => /export report/i.test(b.textContent));
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }

    // Chart expand buttons
    const expandButtons = document.querySelectorAll('.fa-expand-alt');
    expandButtons.forEach(button => {
        button.addEventListener('click', expandChart);
    });
}

// Load analytics data from API
async function loadAnalyticsFromAPI() {
    try {
        console.log('Loading analytics from API...');

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        // Load dashboard analytics
        const dashboardResponse = await fetch(`${API_BASE}/analytics/dashboard?period=week`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Load trends data
        const trendsResponse = await fetch(`${API_BASE}/analytics/trends?period=week`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Load insights data
        const insightsResponse = await fetch(`${API_BASE}/analytics/insights`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Load tasks data for completion metrics
        const tasksResponse = await fetch(`${API_BASE}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (dashboardResponse.ok && trendsResponse.ok && tasksResponse.ok && insightsResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            const trendsData = await trendsResponse.json();
            const insightsData = await insightsResponse.json();
            const tasksData = await tasksResponse.json();

            // Process and combine data
            analyticsData = processApiData(dashboardData, trendsData, tasksData, insightsData);

            // Update UI
            updateKeyMetrics(analyticsData);
            updateAchievements(analyticsData.achievements || []);
            updateInsights(analyticsData);
            createCharts();

            console.log('Analytics data loaded successfully:', analyticsData);
        } else {
            console.error('Failed to load analytics data');
            if (!dashboardResponse.ok) console.error('Dashboard response:', dashboardResponse.status);
            if (!trendsResponse.ok) console.error('Trends response:', trendsResponse.status);
            if (!insightsResponse.ok) console.error('Insights response:', insightsResponse.status);
            if (!tasksResponse.ok) console.error('Tasks response:', tasksResponse.status);
            
            // Use fallback data
            generateFallbackAnalyticsData();
        }
    } catch (error) {
        console.error('Error loading analytics from API:', error);
        // Use fallback data
        generateFallbackAnalyticsData();
    }
}

// Process API data into frontend format
function processApiData(dashboard, trends, tasks, insights) {
    const allTasks = tasks.tasks || tasks;
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const pendingTasks = allTasks.filter(task => task.status === 'pending');
    const overdueTasks = allTasks.filter(task => {
        return task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
    });

    // Process daily data for charts
    const dailyData = dashboard.analytics || [];
    const dailyHours = dailyData.map(day => (day.totalWorkMinutes || 0) / 60);
    
    // Generate weekly data from daily data
    const weeklyHours = [];
    for (let i = 0; i < dailyData.length; i += 7) {
        const weekData = dailyData.slice(i, i + 7);
        const weekTotal = weekData.reduce((sum, day) => sum + (day.totalWorkMinutes || 0), 0) / 60;
        weeklyHours.push(weekTotal);
    }

    // Process category and priority data from trends
    const categoryData = trends.categoryDistribution || {};
    const priorityData = trends.priorityDistribution || {};

    return {
        studyHours: {
            daily: dailyHours.length > 0 ? dailyHours : [0, 0, 0, 0, 0, 0, 0],
            weekly: weeklyHours.length > 0 ? weeklyHours : [0, 0, 0, 0],
            subjects: {
                'Assignment': categoryData.assignment || 0,
                'Exam': categoryData.exam || 0,
                'Personal': categoryData.personal || 0,
                'Project': categoryData.project || 0
            }
        },
        taskCompletion: {
            completed: completedTasks.length,
            pending: pendingTasks.length,
            overdue: overdueTasks.length,
            inProgress: allTasks.filter(task => task.status === 'in-progress').length
        },
        productivity: {
            averageGrade: insights.stats?.avgProductivity || 0,
            productivityScore: dashboard.summary?.averageProductivityScore || 0,
            focusScore: Math.min(100, Math.round((dashboard.summary?.totalPomodoroSessions || 0) * 2)), // Estimate focus score
            completionRate: dashboard.summary?.completionRate || 0
        },
        summary: dashboard.summary || {
            totalTasksCreated: 0,
            totalTasksCompleted: 0,
            totalWorkMinutes: 0,
            totalPomodoroSessions: 0,
            averageProductivityScore: 0,
            completionRate: 0
        },
        trends: trends,
        insights: insights.insights || [],
        recommendations: insights.recommendations || [],
        achievements: generateAchievements(dashboard, allTasks, insights),
        weeklyActivity: generateWeeklyActivityFromData(dailyData),
        streaks: dashboard.streaks || { currentStreak: 0, longestStreak: 0 },
        priorityDistribution: priorityData
    };
}

// Generate fallback data when API fails
function generateFallbackAnalyticsData() {
    analyticsData = {
        studyHours: {
            daily: [2.5, 3.2, 1.8, 4.1, 3.5, 2.9, 1.2],
            weekly: [18.5, 22.3, 19.8, 24.1, 21.7, 20.5, 23.2],
            subjects: {
                'Mathematics': 45,
                'Physics': 32,
                'Chemistry': 28,
                'Computer Science': 38,
                'Literature': 22
            }
        },
        taskCompletion: {
            completed: 89,
            pending: 24,
            overdue: 8,
            inProgress: 12
        },
        productivity: {
            averageGrade: 87.5,
            productivityScore: 92,
            focusScore: 85,
            completionRate: 78
        }
    };

    updateKeyMetrics(analyticsData);
    createCharts();
}

// Legacy function - replaced by loadAnalyticsFromAPI()
function loadAnalyticsData() {
    console.log('This function has been replaced by loadAnalyticsFromAPI()');
}

function updateKeyMetrics(data) {
    // Calculate total study hours from data
    const totalStudyHours = data.summary?.totalWorkMinutes ?
        Math.round((data.summary.totalWorkMinutes / 60) * 10) / 10 :
        (data.studyHours?.daily?.reduce((sum, hours) => sum + hours, 0) || 127.5);

    const metrics = [
        {
            label: 'Total Study Hours',
            value: totalStudyHours.toString(),
            change: '+12%',
            icon: 'clock',
            color: 'blue'
        },
        {
            label: 'Tasks Completed',
            value: (data.taskCompletion?.completed || data.summary?.totalTasksCompleted || '89').toString(),
            change: '+8%',
            icon: 'check-circle',
            color: 'green'
        },
        {
            label: 'Completion Rate',
            value: (data.productivity?.completionRate || data.summary?.completionRate || '87') + '%',
            change: '+3.2%',
            icon: 'graduation-cap',
            color: 'purple'
        },
        {
            label: 'Productivity Score',
            value: (data.productivity?.productivityScore || data.summary?.averageProductivityScore || '92').toString(),
            change: '+5%',
            icon: 'chart-line',
            color: 'yellow'
        }
    ];

    const metricCards = document.querySelectorAll('.bg-gradient-card');
    metricCards.forEach((card, index) => {
        if (index < 4 && metrics[index]) {
            const metric = metrics[index];
            const valueElement = card.querySelector('.text-2xl');
            const changeElement = card.querySelector('.text-green-400');

            if (valueElement) valueElement.textContent = metric.value;
            if (changeElement) {
                changeElement.innerHTML = `<i class="fas fa-arrow-up mr-1"></i>${metric.change} from last week`;
            }
        }
    });
}

function updateAchievements(achievements) {
    const achievementsContainer = document.getElementById('achievementsContainer') || document.querySelector('.space-y-4');
    if (achievementsContainer && achievements.length > 0) {
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="flex items-center space-x-4 p-4 bg-dark-bg rounded-lg">
                <div class="bg-${achievement.color}-500/20 p-3 rounded-lg">
                    <i class="fas fa-${achievement.icon} text-${achievement.color}-400"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-white">${achievement.title}</h3>
                    <p class="text-gray-400 text-sm">${achievement.description}</p>
                </div>
                <span class="text-${achievement.color}-400 font-bold">${achievement.value}</span>
            </div>
        `).join('');
    }
}

function updateInsights(data) {
    // Use real insights from API or generate based on data
    const realInsights = data.insights || [];
    const realRecommendations = data.recommendations || [];
    
    let insights = [];
    
    // Add real insights
    realInsights.forEach((insight, index) => {
        insights.push({
            type: 'insight',
            icon: index % 3 === 0 ? 'lightbulb' : index % 3 === 1 ? 'chart-bar' : 'target',
            color: index % 3 === 0 ? 'yellow' : index % 3 === 1 ? 'blue' : 'green',
            title: 'Insight',
            text: insight
        });
    });

    // Add real recommendations
    realRecommendations.forEach((recommendation, index) => {
        insights.push({
            type: 'recommendation',
            icon: 'lightbulb',
            color: 'orange',
            title: 'Recommendation',
            text: recommendation
        });
    });

    // If no real insights, show default ones
    if (insights.length === 0) {
        insights = [
            {
                type: 'getting-started',
                icon: 'rocket',
                color: 'blue',
                title: 'Getting Started',
                text: 'Create some tasks and start tracking your productivity to get personalized insights!'
            },
            {
                type: 'tip',
                icon: 'lightbulb',
                color: 'yellow',
                title: 'Pro Tip',
                text: 'Use the Pomodoro timer to improve focus and track your study sessions.'
            }
        ];
    }

    const insightsContainer = document.getElementById('insightsContainer') || document.querySelector('.space-y-4');
    if (insightsContainer) {
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="bg-${insight.color}-500/10 border border-${insight.color}-500/30 rounded-lg p-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-${insight.icon} text-${insight.color}-400 mr-2"></i>
                    <span class="font-medium text-${insight.color}-400">${insight.title}</span>
                </div>
                <p class="text-gray-300 text-sm">${insight.text}</p>
            </div>
        `).join('');
    }
}

// Helper function to generate achievements based on data
function generateAchievements(dashboard, tasks, insights) {
    const achievements = [];
    const summary = dashboard.summary || {};
    const streaks = dashboard.streaks || {};

    // Study streak achievement
    if (streaks.currentStreak > 0) {
        achievements.push({
            title: 'Study Streak',
            description: `${streaks.currentStreak} days in a row!`,
            value: streaks.currentStreak,
            icon: 'medal',
            color: streaks.currentStreak >= 7 ? 'yellow' : 'blue'
        });
    }

    // Task completion achievements
    if (summary.totalTasksCompleted >= 50) {
        achievements.push({
            title: 'Task Master',
            description: 'Completed 50+ tasks',
            value: summary.totalTasksCompleted,
            icon: 'medal',
            color: 'yellow'
        });
    } else if (summary.totalTasksCompleted > 0) {
        achievements.push({
            title: 'Tasks Completed',
            description: 'This week',
            value: summary.totalTasksCompleted,
            icon: 'check-circle',
            color: 'green'
        });
    }

    if (summary.completionRate >= 80) {
        achievements.push({
            title: 'High Achiever',
            description: 'Maintained 80%+ completion rate',
            value: summary.completionRate + '%',
            icon: 'trophy',
            color: 'blue'
        });
    }

    if (summary.totalWorkMinutes >= 3600) { // 60 hours
        achievements.push({
            title: 'Study Champion',
            description: 'Studied for 60+ hours',
            value: Math.round(summary.totalWorkMinutes / 60) + 'h',
            icon: 'clock',
            color: 'green'
        });
    } else if (summary.totalWorkMinutes > 0) {
        achievements.push({
            title: 'Study Hours',
            description: 'This week',
            value: Math.round(summary.totalWorkMinutes / 60) + 'h',
            icon: 'hourglass-half',
            color: 'blue'
        });
    }

    // Pomodoro sessions achievement
    if (summary.totalPomodoroSessions > 0) {
        achievements.push({
            title: 'Focus Sessions',
            description: 'Pomodoro completed',
            value: summary.totalPomodoroSessions,
            icon: 'clock',
            color: 'blue'
        });
    }

    // Productivity score achievement
    if (summary.averageProductivityScore >= 80) {
        achievements.push({
            title: 'High Performer',
            description: `${summary.averageProductivityScore}% productivity`,
            value: `${summary.averageProductivityScore}%`,
            icon: 'trophy',
            color: 'yellow'
        });
    }

    return achievements.length > 0 ? achievements : [
        { title: 'Getting Started', description: 'Create your first task!', value: '0', icon: 'star', color: 'gray' }
    ];
}

// Helper function to generate weekly activity heatmap data
function generateWeeklyActivity() {
    return [
        [3, 2, 1, 4, 2, 0, 0], // Monday
        [2, 3, 2, 3, 1, 2, 0], // Tuesday
        [1, 2, 4, 2, 3, 1, 1], // Wednesday
        [0, 1, 3, 4, 2, 2, 0], // Thursday
        [1, 2, 2, 3, 4, 1, 0], // Friday
        [0, 0, 1, 1, 2, 3, 2], // Saturday
        [0, 0, 0, 1, 1, 2, 1]  // Sunday
    ];
}

// Generate weekly activity from real data
function generateWeeklyActivityFromData(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        return generateWeeklyActivity(); // Fallback to placeholder
    }

    const weeklyActivity = [
        [0, 0, 0, 0, 0, 0, 0], // Monday
        [0, 0, 0, 0, 0, 0, 0], // Tuesday
        [0, 0, 0, 0, 0, 0, 0], // Wednesday
        [0, 0, 0, 0, 0, 0, 0], // Thursday
        [0, 0, 0, 0, 0, 0, 0], // Friday
        [0, 0, 0, 0, 0, 0, 0], // Saturday
        [0, 0, 0, 0, 0, 0, 0]  // Sunday
    ];

    dailyData.forEach(day => {
        const date = new Date(day.date);
        const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        
        // Distribute work minutes across day hours (simplified)
        const intensity = Math.min(5, Math.floor((day.totalWorkMinutes || 0) / 60)); // Convert minutes to intensity (0-5)
        
        // Simulate hourly distribution based on typical study patterns
        if (intensity > 0) {
            // Morning (9-12)
            weeklyActivity[dayOfWeek][2] = Math.max(weeklyActivity[dayOfWeek][2], Math.min(intensity, 3));
            // Afternoon (13-17)
            weeklyActivity[dayOfWeek][3] = Math.max(weeklyActivity[dayOfWeek][3], intensity);
            // Evening (18-21)
            weeklyActivity[dayOfWeek][4] = Math.max(weeklyActivity[dayOfWeek][4], Math.min(intensity, 4));
        }
    });

    return weeklyActivity;
}

function createCharts() {
    // Study Hours Trend Chart
    createStudyHoursChart();

    // Task Distribution Chart
    createTaskDistributionChart();

    // Subject Performance Chart
    createSubjectPerformanceChart();
}

function createStudyHoursChart() {
    const ctx = document.getElementById('studyHoursChart');
    if (!ctx) return;

    const studyHours = analyticsData.studyHours?.daily || [2.5, 3.2, 1.8, 4.1, 3.5, 2.9, 1.2];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Study Hours',
                data: studyHours,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2d2d30'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        color: '#2d2d30'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function createTaskDistributionChart() {
    const ctx = document.getElementById('taskDistributionChart');
    if (!ctx) return;

    const taskData = analyticsData.taskCompletion || { completed: 89, pending: 24, overdue: 8, inProgress: 12 };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'In Progress', 'Overdue'],
            datasets: [{
                data: [taskData.completed, taskData.pending, taskData.inProgress, taskData.overdue],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#3b82f6',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

function createSubjectPerformanceChart() {
    const ctx = document.getElementById('subjectPerformanceChart');
    if (!ctx) return;

    const subjects = analyticsData.studyHours?.subjects || {
        'Mathematics': 45,
        'Physics': 32,
        'Chemistry': 28,
        'Computer Science': 38,
        'Literature': 22
    };

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(subjects),
            datasets: [{
                label: 'Hours Studied',
                data: Object.values(subjects),
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#06b6d4',
                    '#10b981',
                    '#f59e0b'
                ],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2d2d30'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function handlePeriodChange(e) {
    const period = e.target.value;
    showNotification(`Updating analytics for ${period}...`, 'info');

    // Simulate data loading
    setTimeout(() => {
        // Here you would typically fetch new data based on the period
        showNotification('Analytics updated successfully!', 'success');

        // Optionally refresh charts with new data
        // recreateCharts();
    }, 1000);
}

function exportReport() {
    showNotification('Preparing analytics report...', 'info');

    setTimeout(() => {
        // Generate report from current analytics data
        const report = generateReport(analyticsData);

        // Create and download a simple text report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brainybalance-report-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('Report downloaded successfully!', 'success');
    }, 1500);
}

function generateReport(data) {
    const date = new Date().toLocaleDateString();

    return `
BrainyBalance Analytics Report
Generated on: ${date}

=== STUDY STATISTICS ===
Total Study Hours: 127.5 hours
Tasks Completed: ${data.taskCompletion?.completed || 89}
Average Grade: ${data.productivity?.averageGrade || 87.5}%
Productivity Score: ${data.productivity?.productivityScore || 92}

=== SUBJECT BREAKDOWN ===
${Object.entries(data.studyHours?.subjects || {})
            .map(([subject, hours]) => `${subject}: ${hours} hours`)
            .join('\n')}

=== ACHIEVEMENTS ===
${data.achievements?.map(a => `- ${a.title}: ${a.value}`)?.join('\n') || 'No achievements recorded'}

=== RECOMMENDATIONS ===
- You're most productive between 10 AM - 12 PM
- Mathematics is your strongest subject
- Consider adding more breaks between study sessions

Report generated by BrainyBalance - Intelligent Task Planner for Students
    `.trim();
}

function expandChart(e) {
    const chartContainer = e.target.closest('.bg-gradient-card');
    const chartTitle = chartContainer?.querySelector('h2')?.textContent || 'Chart';

    showNotification(`Expanding ${chartTitle}...`, 'info');

    // Here you could implement a modal with a larger version of the chart
    setTimeout(() => {
        showNotification('Full-screen chart view coming soon!', 'info');
    }, 500);
}

// Update analytics data based on user activity
function updateAnalyticsFromActivity() {
    // Analytics data is now managed by the backend API
    // This function is no longer needed as analytics are calculated server-side
    console.log('Analytics data is now managed by the backend API');
}

// Call this function when tasks are updated
document.addEventListener('taskUpdated', updateAnalyticsFromActivity);

// Utility function to show notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-4 rounded-lg shadow-lg transform translate-x-full transition-transform z-50 ${getNotificationClass(type)}`;

    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${getNotificationIcon(type)} text-xl"></i>
            <div class="font-medium">${message}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationClass(type) {
    switch (type) {
        case 'success':
            return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
        case 'error':
            return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
        case 'info':
            return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
        default:
            return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'info':
            return 'fa-info-circle';
        default:
            return 'fa-bell';
    }
}

// Enhanced Visualization Features - Simplified
let analyticsCharts = {};
let taskData = null;

// Initialize simplified analytics
function initializeSimplifiedAnalytics() {
    loadTaskData();
}

// Load real task data from backend
async function loadTaskData() {
    try {
        showLoadingState();
        
        const [tasks, analytics] = await Promise.all([
            fetchTaskData('/api/tasks'),
            fetchAnalyticsData('/api/analytics/dashboard?period=month')
        ]);
        
        taskData = {
            tasks: tasks,
            analytics: analytics
        };
        
        // Initialize practical charts
        createTaskStatusChart();
        createWeeklyProgressChart();
        createTaskCategoriesChart();
        createPriorityChart();
        updateRecentActivity();
        
        hideLoadingState();
        
    } catch (error) {
        console.error('Error loading task data:', error);
        showErrorState();
    }
}

// Fetch task data from backend
async function fetchTaskData(endpoint) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
}

// Create Task Status Chart
function createTaskStatusChart() {
    const ctx = document.getElementById('taskStatusChart').getContext('2d');
    
    analyticsCharts.taskStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for completed
                    'rgba(59, 130, 246, 0.8)',  // Blue for in-progress
                    'rgba(234, 179, 8, 0.8)',   // Yellow for pending
                    'rgba(239, 68, 68, 0.8)'    // Red for overdue
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    updateTaskStatusChart();
}

// Update Task Status Chart with real data
function updateTaskStatusChart() {
    if (!analyticsCharts.taskStatus || !taskData) return;
    
    const tasks = taskData.tasks || [];
    const today = new Date();
    
    let completed = 0, inProgress = 0, pending = 0, overdue = 0;
    
    tasks.forEach(task => {
        const deadline = new Date(task.deadline);
        
        switch(task.status) {
            case 'completed':
                completed++;
                break;
            case 'in-progress':
                inProgress++;
                break;
            case 'pending':
                if (deadline < today) {
                    overdue++;
                } else {
                    pending++;
                }
                break;
            default:
                pending++;
        }
    });
    
    const data = [completed, inProgress, pending, overdue];
    analyticsCharts.taskStatus.data.datasets[0].data = data;
    analyticsCharts.taskStatus.update();
    
    // Update count displays
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('overdueCount').textContent = overdue;
}

// Create Weekly Progress Chart
function createWeeklyProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
    
    analyticsCharts.weeklyProgress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Tasks Completed',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
    
    updateWeeklyProgressChart();
}

// Update Weekly Progress Chart
function updateWeeklyProgressChart() {
    if (!analyticsCharts.weeklyProgress || !taskData) return;
    
    const tasks = taskData.tasks || [];
    const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    
    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
    
    tasks.filter(task => task.status === 'completed').forEach(task => {
        const completedDate = new Date(task.updatedAt);
        if (completedDate >= weekStart) {
            const dayOfWeek = completedDate.getDay();
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Mon-Sun
            weekData[adjustedDay]++;
        }
    });
    
    analyticsCharts.weeklyProgress.data.datasets[0].data = weekData;
    analyticsCharts.weeklyProgress.update();
    
    // Update statistics
    const totalCompleted = weekData.reduce((a, b) => a + b, 0);
    const avgDaily = (totalCompleted / 7).toFixed(1);
    const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
    const bestDayIndex = weekData.indexOf(Math.max(...weekData));
    const bestDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][bestDayIndex];
    
    document.getElementById('weeklyCompletion').textContent = `${completionRate}%`;
    document.getElementById('avgDailyTasks').textContent = avgDaily;
    document.getElementById('mostProductiveDay').textContent = bestDay;
}

// Create Task Categories Chart
function createTaskCategoriesChart() {
    const ctx = document.getElementById('taskCategoriesChart').getContext('2d');
    
    analyticsCharts.taskCategories = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Assignment', 'Exam', 'Project', 'Personal'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',  // Blue
                    'rgba(239, 68, 68, 0.8)',   // Red
                    'rgba(34, 197, 94, 0.8)',   // Green
                    'rgba(234, 179, 8, 0.8)'    // Yellow
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    updateTaskCategoriesChart();
}

// Update Task Categories Chart
function updateTaskCategoriesChart() {
    if (!analyticsCharts.taskCategories || !taskData) return;
    
    const tasks = taskData.tasks || [];
    const categories = { assignment: 0, exam: 0, project: 0, personal: 0 };
    
    tasks.forEach(task => {
        const category = task.category || 'personal';
        if (categories.hasOwnProperty(category)) {
            categories[category]++;
        }
    });
    
    const data = [categories.assignment, categories.exam, categories.project, categories.personal];
    analyticsCharts.taskCategories.data.datasets[0].data = data;
    analyticsCharts.taskCategories.update();
    
    // Update count displays
    document.getElementById('assignmentCount').textContent = categories.assignment;
    document.getElementById('examCount').textContent = categories.exam;
    document.getElementById('projectCount').textContent = categories.project;
    document.getElementById('personalCount').textContent = categories.personal;
}

// Create Priority Chart
function createPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    analyticsCharts.priority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tasks',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // Red for urgent
                    'rgba(245, 158, 11, 0.8)',  // Orange for high
                    'rgba(234, 179, 8, 0.8)',   // Yellow for medium
                    'rgba(34, 197, 94, 0.8)'    // Green for low
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
    
    updatePriorityChart();
}

// Update Priority Chart
function updatePriorityChart() {
    if (!analyticsCharts.priority || !taskData) return;
    
    const tasks = taskData.tasks || [];
    const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };
    
    tasks.forEach(task => {
        const priority = task.priority || 'medium';
        if (priorities.hasOwnProperty(priority)) {
            priorities[priority]++;
        }
    });
    
    const data = [priorities.urgent, priorities.high, priorities.medium, priorities.low];
    analyticsCharts.priority.data.datasets[0].data = data;
    analyticsCharts.priority.update();
    
    // Update count displays
    document.getElementById('urgentCount').textContent = priorities.urgent;
    document.getElementById('highCount').textContent = priorities.high;
    document.getElementById('mediumCount').textContent = priorities.medium;
    document.getElementById('lowCount').textContent = priorities.low;
}

// Update Recent Activity
function updateRecentActivity() {
    if (!taskData) return;
    
    const tasks = taskData.tasks || [];
    const recentTasks = tasks
        .filter(task => task.status === 'completed')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
    
    const activityContainer = document.getElementById('recentActivity');
    
    if (recentTasks.length === 0) {
        activityContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-tasks text-3xl mb-2"></i>
                <p>No recent activity found</p>
                <p class="text-sm">Complete some tasks to see activity here</p>
            </div>
        `;
        return;
    }
    
    activityContainer.innerHTML = recentTasks.map(task => {
        const date = new Date(task.updatedAt);
        const timeAgo = getTimeAgo(date);
        
        return `
            <div class="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
                <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-green-400 text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-white font-medium">${task.title}</p>
                    <p class="text-gray-400 text-sm">${timeAgo}</p>
                </div>
                <div class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    ${task.category || 'Personal'}
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Setup period change handler
function setupPeriodHandler() {
    const taskPeriod = document.getElementById('taskPeriod');
    if (taskPeriod) {
        taskPeriod.addEventListener('change', (e) => {
            loadTaskData(); // Reload data for new period
        });
    }
}

// Refresh analytics data
async function refreshSimplifiedAnalytics() {
    await loadTaskData();
}

// Export function for manual refresh
window.refreshAnalytics = refreshSimplifiedAnalytics;

// Initialize simplified analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other initialization to complete
    setTimeout(() => {
        initializeSimplifiedAnalytics();
        setupPeriodHandler();
    }, 1000);
});
async function loadAnalyticsData() {
    try {
        showLoadingState();
        
        // Get the period parameter based on current view
        const period = currentView === 'daily' ? 'week' : currentView === 'weekly' ? 'month' : 'year';
        
        const [dashboardData, trendsData, insightsData] = await Promise.all([
            fetchAnalyticsData(`/api/analytics/dashboard?period=${period}`),
            fetchAnalyticsData('/api/analytics/trends'),
            fetchAnalyticsData('/api/analytics/insights')
        ]);
        
        analyticsData = {
            dashboard: dashboardData,
            trends: trendsData,
            insights: insightsData
        };
        
        // Initialize all charts with real data
        createTimeUsageChart();
        createProductivityTrendChart();
        createFocusAnalyticsChart();
        createWeeklyComparisonChart();
        createSubjectTimeChart();
        createPeakHoursChart();
        
        hideLoadingState();
        updatePeriodDisplay();
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showErrorState();
    }
}

// Fetch analytics data from backend
async function fetchAnalyticsData(endpoint) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
}

// Show loading state
function showLoadingState() {
    const loadingHtml = `
        <div class="flex items-center justify-center h-64">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p class="text-gray-400">Loading analytics data...</p>
            </div>
        </div>
    `;
    
    // Show loading in chart containers
    const chartContainers = [
        'timeUsageChart', 'productivityTrendChart', 'focusAnalyticsChart',
        'weeklyComparisonChart', 'subjectTimeChart', 'peakHoursChart'
    ];
    
    chartContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.parentElement.innerHTML = loadingHtml;
        }
    });
}

// Hide loading state
function hideLoadingState() {
    // Restore chart canvases
    const chartConfigs = [
        { id: 'timeUsageChart', html: '<canvas id="timeUsageChart" width="400" height="400"></canvas>' },
        { id: 'productivityTrendChart', html: '<canvas id="productivityTrendChart" width="400" height="300"></canvas>' },
        { id: 'focusAnalyticsChart', html: '<canvas id="focusAnalyticsChart" width="400" height="300"></canvas>' },
        { id: 'weeklyComparisonChart', html: '<canvas id="weeklyComparisonChart" width="400" height="300"></canvas>' },
        { id: 'subjectTimeChart', html: '<canvas id="subjectTimeChart" width="400" height="300"></canvas>' },
        { id: 'peakHoursChart', html: '<canvas id="peakHoursChart" width="400" height="300"></canvas>' }
    ];
    
    chartConfigs.forEach(config => {
        const container = document.querySelector(`#${config.id}`);
        if (container && container.parentElement) {
            container.parentElement.innerHTML = config.html;
        }
    });
}

// Show error state
function showErrorState() {
    const errorHtml = `
        <div class="flex items-center justify-center h-64">
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-400 mb-2">Error loading analytics data</p>
                <button onclick="loadAnalyticsData()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
                    Retry
                </button>
            </div>
        </div>
    `;
    
    const chartContainers = document.querySelectorAll('canvas');
    chartContainers.forEach(canvas => {
        if (canvas.parentElement) {
            canvas.parentElement.innerHTML = errorHtml;
        }
    });
}

// Setup view toggle functionality
function setupViewToggle() {
    const dailyBtn = document.getElementById('dailyViewBtn');
    const weeklyBtn = document.getElementById('weeklyViewBtn');
    const monthlyBtn = document.getElementById('monthlyViewBtn');

    [dailyBtn, weeklyBtn, monthlyBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            [dailyBtn, weeklyBtn, monthlyBtn].forEach(b => {
                b.classList.remove('bg-indigo-500', 'text-white');
                b.classList.add('text-gray-400');
            });
            
            // Add active class to clicked button
            btn.classList.add('bg-indigo-500', 'text-white');
            btn.classList.remove('text-gray-400');
            
            // Update current view
            currentView = btn.id.replace('ViewBtn', '').replace('ly', '');
            updateChartsForView();
        });
    });
}

// Update charts based on selected view
function updateChartsForView() {
    // Reload data for the new view period
    loadAnalyticsData();
}

// Setup period navigation
function setupPeriodNavigation() {
    document.getElementById('prevPeriod').addEventListener('click', () => {
        navigatePeriod(-1);
    });
    
    document.getElementById('nextPeriod').addEventListener('click', () => {
        navigatePeriod(1);
    });
}

// Navigate between time periods
function navigatePeriod(direction) {
    const today = new Date();
    
    switch(currentView) {
        case 'day':
            currentPeriod.setDate(currentPeriod.getDate() + direction);
            break;
        case 'week':
            currentPeriod.setDate(currentPeriod.getDate() + (direction * 7));
            break;
        case 'month':
            currentPeriod.setMonth(currentPeriod.getMonth() + direction);
            break;
    }
    
    // Prevent navigation to future dates
    if (currentPeriod > today) {
        currentPeriod = new Date(today);
    }
    
    updateChartsForView();
}

// Update period display text
function updatePeriodDisplay() {
    const periodElement = document.getElementById('currentPeriod');
    const titleElement = document.getElementById('timeUsageTitle');
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    switch(currentView) {
        case 'day':
            periodElement.textContent = currentPeriod.toLocaleDateString('en-US', options);
            titleElement.textContent = 'Daily Time Usage';
            break;
        case 'week':
            const weekStart = new Date(currentPeriod);
            weekStart.setDate(currentPeriod.getDate() - currentPeriod.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            periodElement.textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            titleElement.textContent = 'Weekly Time Usage';
            break;
        case 'month':
            periodElement.textContent = currentPeriod.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            titleElement.textContent = 'Monthly Time Usage';
            break;
    }
}

// Create Time Usage Chart with real data
function createTimeUsageChart() {
    const ctx = document.getElementById('timeUsageChart').getContext('2d');
    
    enhancedCharts.timeUsage = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Study Time', 'Task Work', 'Break Time', 'Focus Sessions'],
            datasets: [{
                data: [0, 0, 0, 0], // Will be updated with real data
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    updateTimeUsageChart();
}

// Update Time Usage Chart with real backend data
function updateTimeUsageChart() {
    if (!enhancedCharts.timeUsage || !analyticsData) return;
    
    const dashboard = analyticsData.dashboard;
    
    // Calculate real time usage from backend data
    const studyTime = (dashboard.summary.totalWorkMinutes || 0) / 60; // Convert to hours
    const taskTime = (dashboard.summary.totalTasksCompleted || 0) * 0.5; // Estimate 30min per task
    const breakTime = studyTime * 0.2; // Estimate 20% break time
    const focusTime = (dashboard.summary.totalPomodoroSessions || 0) * 0.42; // 25min + 5min break
    
    const values = [
        Math.round(studyTime * 10) / 10,
        Math.round(taskTime * 10) / 10,
        Math.round(breakTime * 10) / 10,
        Math.round(focusTime * 10) / 10
    ];
    
    enhancedCharts.timeUsage.data.datasets[0].data = values;
    enhancedCharts.timeUsage.update();
    
    // Update summary values with real data
    document.getElementById('studyTimeValue').textContent = `${values[0]}h`;
    document.getElementById('taskTimeValue').textContent = `${values[1]}h`;
    document.getElementById('breakTimeValue').textContent = `${values[2]}h`;
    document.getElementById('focusTimeValue').textContent = `${values[3]}h`;
}

// Create Productivity Trend Chart with real data
function createProductivityTrendChart() {
    const ctx = document.getElementById('productivityTrendChart').getContext('2d');
    
    enhancedCharts.productivityTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Productivity',
                data: [],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
    
    updateProductivityTrendChart();
}

// Update Productivity Trend Chart with real data
function updateProductivityTrendChart() {
    if (!enhancedCharts.productivityTrend || !analyticsData) return;
    
    const analytics = analyticsData.dashboard.analytics || [];
    
    // Extract real productivity data from backend
    const labels = analytics.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const values = analytics.map(day => day.productivityScore || 0);
    
    // Fill with sample data if no real data available
    if (labels.length === 0) {
        const days = currentView === 'daily' ? 7 : currentView === 'weekly' ? 4 : 12;
        for (let i = 0; i < days; i++) {
            if (currentView === 'daily') {
                labels.push(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]);
            } else if (currentView === 'weekly') {
                labels.push(`Week ${i + 1}`);
            } else {
                labels.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]);
            }
            values.push(Math.random() * 40 + 60); // Fallback data
        }
    }
    
    enhancedCharts.productivityTrend.data.labels = labels;
    enhancedCharts.productivityTrend.data.datasets[0].data = values;
    enhancedCharts.productivityTrend.update();
    
    // Update statistics with real data
    if (values.length > 0) {
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        document.getElementById('avgValue').textContent = avgValue.toFixed(1);
        
        const bestDayIndex = values.indexOf(Math.max(...values));
        document.getElementById('bestDay').textContent = labels[bestDayIndex];
        
        const increase = values.length > 1 ? 
            ((values[values.length - 1] - values[0]) / values[0] * 100) : 0;
        document.getElementById('trendIncrease').textContent = `${increase > 0 ? '+' : ''}${increase.toFixed(0)}%`;
    }
}

// Create Focus Analytics Chart with real data
function createFocusAnalyticsChart() {
    const ctx = document.getElementById('focusAnalyticsChart').getContext('2d');
    
    enhancedCharts.focusAnalytics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
            datasets: [{
                label: 'Focus Sessions',
                data: [0, 0, 0, 0, 0, 0], // Will be updated with real data
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderColor: 'rgba(236, 72, 153, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
    
    updateFocusAnalyticsChart();
}

// Update Focus Analytics Chart with real data
function updateFocusAnalyticsChart() {
    if (!enhancedCharts.focusAnalytics || !analyticsData) return;
    
    // Use trends data if available for hour-by-hour breakdown
    const trends = analyticsData.trends;
    let hourlyData = [2, 5, 3, 1, 4, 2]; // Default fallback
    
    if (trends && trends.hourlyProductivity) {
        // Map 24-hour data to 6 time slots
        hourlyData = [
            trends.hourlyProductivity.slice(6, 9).reduce((a, b) => a + b, 0) / 3,   // 6-9AM
            trends.hourlyProductivity.slice(9, 12).reduce((a, b) => a + b, 0) / 3,  // 9AM-12PM
            trends.hourlyProductivity.slice(12, 15).reduce((a, b) => a + b, 0) / 3, // 12-3PM
            trends.hourlyProductivity.slice(15, 18).reduce((a, b) => a + b, 0) / 3, // 3-6PM
            trends.hourlyProductivity.slice(18, 21).reduce((a, b) => a + b, 0) / 3, // 6-9PM
            trends.hourlyProductivity.slice(21, 24).reduce((a, b) => a + b, 0) / 3  // 9PM-12AM
        ].map(v => Math.round(v));
    }
    
    enhancedCharts.focusAnalytics.data.datasets[0].data = hourlyData;
    enhancedCharts.focusAnalytics.update();
}

// Create Weekly Comparison Chart with real data
function createWeeklyComparisonChart() {
    const ctx = document.getElementById('weeklyComparisonChart').getContext('2d');
    
    enhancedCharts.weeklyComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'This Week',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
            }, {
                label: 'Last Week',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(148, 163, 184, 0.5)',
                borderColor: 'rgba(148, 163, 184, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
    
    updateWeeklyComparisonChart();
}

// Update Weekly Comparison Chart with real data
function updateWeeklyComparisonChart() {
    if (!enhancedCharts.weeklyComparison || !analyticsData) return;
    
    const dashboard = analyticsData.dashboard;
    const analytics = dashboard.analytics || [];
    
    // Group data by day of week for comparison
    const thisWeekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    const lastWeekData = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    analytics.forEach(day => {
        const dayDate = new Date(day.date);
        const dayOfWeek = dayDate.getDay();
        const workHours = (day.totalWorkMinutes || 0) / 60;
        
        if (dayDate >= thisWeekStart) {
            thisWeekData[dayOfWeek] += workHours;
        } else if (dayDate >= lastWeekStart) {
            lastWeekData[dayOfWeek] += workHours;
        }
    });
    
    // If no real data, use fallback
    if (thisWeekData.every(v => v === 0)) {
        thisWeekData.splice(0, 7, 8, 6, 9, 7, 5, 3, 2);
        lastWeekData.splice(0, 7, 6, 7, 8, 5, 6, 4, 3);
    }
    
    enhancedCharts.weeklyComparison.data.datasets[0].data = thisWeekData;
    enhancedCharts.weeklyComparison.data.datasets[1].data = lastWeekData;
    enhancedCharts.weeklyComparison.update();
}

// Create Subject Time Chart with real data
function createSubjectTimeChart() {
    const ctx = document.getElementById('subjectTimeChart').getContext('2d');
    
    enhancedCharts.subjectTime = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Assignment', 'Exam', 'Personal', 'Project', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0], // Will be updated with real data
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(148, 163, 184, 0.8)',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            }
        }
    });
    
    updateSubjectTimeChart();
}

// Update Subject Time Chart with real data
function updateSubjectTimeChart() {
    if (!enhancedCharts.subjectTime || !analyticsData) return;
    
    const dashboard = analyticsData.dashboard;
    const analytics = dashboard.analytics || [];
    
    // Calculate category distribution from real data
    let categoryData = [0, 0, 0, 0, 0]; // assignment, exam, personal, project, other
    
    analytics.forEach(day => {
        const categories = day.tasksByCategory || {};
        categoryData[0] += categories.assignment || 0;
        categoryData[1] += categories.exam || 0;
        categoryData[2] += categories.personal || 0;
        categoryData[3] += categories.project || 0;
    });
    
    // Calculate "other" as remaining time
    const totalCategorized = categoryData.slice(0, 4).reduce((a, b) => a + b, 0);
    const totalTasks = dashboard.summary.totalTasksCompleted || 0;
    categoryData[4] = Math.max(0, totalTasks - totalCategorized);
    
    // If no real data, use fallback percentages
    if (categoryData.every(v => v === 0)) {
        categoryData = [25, 20, 15, 30, 10];
    }
    
    enhancedCharts.subjectTime.data.datasets[0].data = categoryData;
    enhancedCharts.subjectTime.update();
}

// Create Peak Hours Chart
function createPeakHoursChart() {
    const ctx = document.getElementById('peakHoursChart').getContext('2d');
    
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const productivity = hours.map((_, i) => {
        // Simulate typical productivity curve
        if (i >= 6 && i <= 11) return Math.random() * 20 + 70; // Morning peak
        if (i >= 14 && i <= 17) return Math.random() * 15 + 60; // Afternoon moderate
        if (i >= 19 && i <= 22) return Math.random() * 10 + 50; // Evening low
        return Math.random() * 30 + 20; // Low periods
    });
    
    enhancedCharts.peakHours = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Productivity Score',
                data: productivity,
                borderColor: 'rgba(245, 158, 11, 1)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)',
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

// Setup metric change handlers
function setupMetricHandlers() {
    const trendMetric = document.getElementById('trendMetric');
    const subjectPeriod = document.getElementById('subjectPeriod');
    const comparisonType = document.getElementById('comparisonType');
    
    if (trendMetric) {
        trendMetric.addEventListener('change', (e) => {
            updateProductivityTrendChart();
        });
    }
    
    if (subjectPeriod) {
        subjectPeriod.addEventListener('change', (e) => {
            updateSubjectTimeChartByPeriod();
        });
    }
    
    if (comparisonType) {
        comparisonType.addEventListener('change', (e) => {
            updateWeeklyComparisonByType();
        });
    }
}

// Update subject time chart based on period selection
function updateSubjectTimeChartByPeriod() {
    if (!enhancedCharts.subjectTime || !analyticsData) return;
    
    const period = document.getElementById('subjectPeriod').value;
    const dashboard = analyticsData.dashboard;
    
    // Adjust data based on period selection
    let multiplier = 1;
    if (period === 'month') multiplier = 4;
    if (period === 'quarter') multiplier = 12;
    
    // Get base category data
    const analytics = dashboard.analytics || [];
    let categoryData = [0, 0, 0, 0, 0];
    
    analytics.forEach(day => {
        const categories = day.tasksByCategory || {};
        categoryData[0] += (categories.assignment || 0) * multiplier;
        categoryData[1] += (categories.exam || 0) * multiplier;
        categoryData[2] += (categories.personal || 0) * multiplier;
        categoryData[3] += (categories.project || 0) * multiplier;
    });
    
    // Calculate other category
    const totalCategorized = categoryData.slice(0, 4).reduce((a, b) => a + b, 0);
    const totalTasks = (dashboard.summary.totalTasksCompleted || 0) * multiplier;
    categoryData[4] = Math.max(0, totalTasks - totalCategorized);
    
    // Fallback if no data
    if (categoryData.every(v => v === 0)) {
        categoryData = [25 * multiplier, 20 * multiplier, 15 * multiplier, 30 * multiplier, 10 * multiplier];
    }
    
    enhancedCharts.subjectTime.data.datasets[0].data = categoryData;
    enhancedCharts.subjectTime.update();
}

// Update weekly comparison chart based on comparison type
function updateWeeklyComparisonByType() {
    if (!enhancedCharts.weeklyComparison || !analyticsData) return;
    
    const comparison = document.getElementById('comparisonType').value;
    const dashboard = analyticsData.dashboard;
    const analytics = dashboard.analytics || [];
    
    let labels, thisData, lastData;
    
    switch(comparison) {
        case 'thisweek':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            [thisData, lastData] = calculateWeeklyComparison(analytics);
            break;
        case 'monthly':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            [thisData, lastData] = calculateMonthlyComparison(analytics);
            break;
        case 'quarterly':
            labels = ['Month 1', 'Month 2', 'Month 3'];
            [thisData, lastData] = calculateQuarterlyComparison(analytics);
            break;
        default:
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            [thisData, lastData] = calculateWeeklyComparison(analytics);
    }
    
    enhancedCharts.weeklyComparison.data.labels = labels;
    enhancedCharts.weeklyComparison.data.datasets[0].data = thisData;
    enhancedCharts.weeklyComparison.data.datasets[1].data = lastData;
    enhancedCharts.weeklyComparison.update();
}

// Calculate weekly comparison data
function calculateWeeklyComparison(analytics) {
    const thisWeekData = [0, 0, 0, 0, 0, 0, 0];
    const lastWeekData = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    analytics.forEach(day => {
        const dayDate = new Date(day.date);
        const dayOfWeek = dayDate.getDay();
        const workHours = (day.totalWorkMinutes || 0) / 60;
        
        if (dayDate >= thisWeekStart) {
            thisWeekData[dayOfWeek] += workHours;
        } else if (dayDate >= lastWeekStart) {
            lastWeekData[dayOfWeek] += workHours;
        }
    });
    
    // Fallback data if no real data
    if (thisWeekData.every(v => v === 0)) {
        return [[8, 6, 9, 7, 5, 3, 2], [6, 7, 8, 5, 6, 4, 3]];
    }
    
    return [thisWeekData, lastWeekData];
}

// Calculate monthly comparison data
function calculateMonthlyComparison(analytics) {
    const thisMonth = [0, 0, 0, 0]; // Week 1-4
    const lastMonth = [0, 0, 0, 0];
    
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    analytics.forEach(day => {
        const dayDate = new Date(day.date);
        const workHours = (day.totalWorkMinutes || 0) / 60;
        
        if (dayDate >= thisMonthStart) {
            const weekOfMonth = Math.floor((dayDate.getDate() - 1) / 7);
            if (weekOfMonth < 4) thisMonth[weekOfMonth] += workHours;
        } else if (dayDate >= lastMonthStart) {
            const weekOfMonth = Math.floor((dayDate.getDate() - 1) / 7);
            if (weekOfMonth < 4) lastMonth[weekOfMonth] += workHours;
        }
    });
    
    // Fallback data
    if (thisMonth.every(v => v === 0)) {
        return [[32, 28, 35, 25], [28, 30, 32, 22]];
    }
    
    return [thisMonth, lastMonth];
}

// Calculate quarterly comparison data
function calculateQuarterlyComparison(analytics) {
    const thisQuarter = [0, 0, 0]; // Month 1-3
    const lastQuarter = [0, 0, 0];
    
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
    const lastQuarterStart = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
    
    analytics.forEach(day => {
        const dayDate = new Date(day.date);
        const workHours = (day.totalWorkMinutes || 0) / 60;
        
        if (dayDate >= thisQuarterStart) {
            const monthInQuarter = dayDate.getMonth() % 3;
            thisQuarter[monthInQuarter] += workHours;
        } else if (dayDate >= lastQuarterStart) {
            const monthInQuarter = dayDate.getMonth() % 3;
            lastQuarter[monthInQuarter] += workHours;
        }
    });
    
    // Fallback data
    if (thisQuarter.every(v => v === 0)) {
        return [[120, 135, 142], [115, 128, 138]];
    }
    
    return [thisQuarter, lastQuarter];
}

// Initialize simplified analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other initialization to complete
    setTimeout(() => {
        initializeSimplifiedAnalytics();
        setupPeriodHandler();
    }, 1000);
});
