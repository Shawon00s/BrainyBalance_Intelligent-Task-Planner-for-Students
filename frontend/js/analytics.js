// Analytics JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!localStorage.getItem('userLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize analytics page
    initializeAnalytics();
    setupEventListeners();
    loadAnalyticsData();
    createCharts();
});

function initializeAnalytics() {
    // Generate sample analytics data if none exists
    if (!localStorage.getItem('analyticsData')) {
        generateSampleAnalyticsData();
    }
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
    const periodSelector = document.querySelector('select');
    if (periodSelector) {
        periodSelector.addEventListener('change', handlePeriodChange);
    }

    // Export report button
    const exportBtn = document.querySelector('button:contains("Export Report")');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }

    // Chart expand buttons
    const expandButtons = document.querySelectorAll('.fa-expand-alt');
    expandButtons.forEach(button => {
        button.addEventListener('click', expandChart);
    });
}

function loadAnalyticsData() {
    const data = JSON.parse(localStorage.getItem('analyticsData') || '{}');

    // Update key metrics
    updateKeyMetrics(data);

    // Update achievements
    updateAchievements(data.achievements || []);

    // Update insights
    updateInsights(data);
}

function updateKeyMetrics(data) {
    const metrics = [
        { label: 'Total Study Hours', value: '127.5', change: '+12%', icon: 'clock', color: 'blue' },
        { label: 'Tasks Completed', value: data.taskCompletion?.completed || '89', change: '+8%', icon: 'check-circle', color: 'green' },
        { label: 'Average Grade', value: data.productivity?.averageGrade + '%' || '87.5%', change: '+3.2%', icon: 'graduation-cap', color: 'purple' },
        { label: 'Productivity Score', value: data.productivity?.productivityScore || '92', change: '+5%', icon: 'chart-line', color: 'yellow' }
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
    const achievementsContainer = document.querySelector('.space-y-4:has(.fa-medal)');
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
    const insights = [
        {
            type: 'performance',
            icon: 'chart-bar',
            color: 'blue',
            title: 'Peak Performance',
            text: 'You\'re most productive between 10 AM - 12 PM. Schedule important tasks during this time.'
        },
        {
            type: 'strength',
            icon: 'thumbs-up',
            color: 'green',
            title: 'Strength',
            text: 'Mathematics is your strongest subject with 94% average completion rate.'
        },
        {
            type: 'improvement',
            icon: 'exclamation-triangle',
            color: 'orange',
            title: 'Improvement Area',
            text: 'Consider adding more breaks between study sessions to maintain focus.'
        }
    ];

    const insightsContainer = document.querySelector('.space-y-4:has(.fa-lightbulb)');
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

    const data = JSON.parse(localStorage.getItem('analyticsData') || '{}');
    const studyHours = data.studyHours?.daily || [2.5, 3.2, 1.8, 4.1, 3.5, 2.9, 1.2];

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

    const data = JSON.parse(localStorage.getItem('analyticsData') || '{}');
    const taskData = data.taskCompletion || { completed: 89, pending: 24, overdue: 8, inProgress: 12 };

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

    const data = JSON.parse(localStorage.getItem('analyticsData') || '{}');
    const subjects = data.studyHours?.subjects || {
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
        // Simulate report generation
        const data = JSON.parse(localStorage.getItem('analyticsData') || '{}');
        const report = generateReport(data);

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
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const completedTasks = tasks.filter(task => task.status === 'completed');

    // Update task completion data
    const analyticsData = JSON.parse(localStorage.getItem('analyticsData') || '{}');
    if (analyticsData.taskCompletion) {
        analyticsData.taskCompletion.completed = completedTasks.length;
        analyticsData.taskCompletion.pending = tasks.filter(task => task.status === 'pending').length;
        analyticsData.taskCompletion.inProgress = tasks.filter(task => task.status === 'in-progress').length;

        localStorage.setItem('analyticsData', JSON.stringify(analyticsData));
    }
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
