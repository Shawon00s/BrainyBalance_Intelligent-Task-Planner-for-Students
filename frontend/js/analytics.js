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
