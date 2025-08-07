// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!localStorage.getItem('userLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    setupEventListeners();
    loadQuickStats();
    loadRecentActivity();
    loadAIRecommendations();
});

function initializeDashboard() {
    // Update user name in navigation
    const userName = localStorage.getItem('userName') || 'Student';
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(element => {
        element.textContent = userName;
    });

    // Set current date/time
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute
}

function setupEventListeners() {
    // Quick task form
    const quickTaskForm = document.getElementById('quickTaskForm');
    if (quickTaskForm) {
        quickTaskForm.addEventListener('submit', handleQuickTaskSubmit);
    }

    // Logout functionality
    const logoutButtons = document.querySelectorAll('[href="login.html"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', handleLogout);
    });

    // Generate schedule button
    const generateScheduleBtn = document.querySelector('button:contains("Generate New Schedule")');
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', generateNewSchedule);
    }
}

function handleQuickTaskSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title') || e.target.querySelector('input[type="text"]').value,
        priority: formData.get('priority') || e.target.querySelector('select').value,
        dueDate: formData.get('dueDate') || e.target.querySelector('input[type="datetime-local"]').value,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Validate required fields
    if (!taskData.title.trim()) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    if (!taskData.priority) {
        showNotification('Please select a priority level', 'error');
        return;
    }

    // Save task to localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(taskData);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Show success message
    showNotification('Task added successfully!', 'success');

    // Reset form
    e.target.reset();

    // Update stats
    updateQuickStats();

    // Add to recent activity
    addToRecentActivity('Added new task: ' + taskData.title, 'plus', 'blue');
}

function handleLogout(e) {
    e.preventDefault();

    // Clear user session
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userUniversity');

    showNotification('Logged out successfully', 'info');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function loadQuickStats() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const today = new Date().toDateString();

    // Calculate stats
    const tasksToday = tasks.filter(task => {
        const taskDate = new Date(task.dueDate).toDateString();
        return taskDate === today;
    }).length;

    const completedTasks = tasks.filter(task => task.status === 'completed').length;

    // Update UI
    updateStatCard('Tasks Due Today', tasksToday, 'red');
    updateStatCard('Completed Tasks', completedTasks, 'green');

    // Simulate other stats
    updateStatCard('Study Hours', '6.5', 'blue');
    updateStatCard('Productivity', '85%', 'purple');
}

function updateStatCard(label, value, color) {
    const cards = document.querySelectorAll('.bg-gradient-card');
    cards.forEach(card => {
        const labelElement = card.querySelector('.text-gray-400');
        if (labelElement && labelElement.textContent === label) {
            const valueElement = card.querySelector('.text-2xl');
            if (valueElement) {
                valueElement.textContent = value;
                valueElement.className = `text-2xl font-bold text-${color}-400`;
            }
        }
    });
}

function loadRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('recentActivity') || '[]');
    const activityContainer = document.querySelector('.space-y-4:has(.fa-history)');

    if (activityContainer && activities.length > 0) {
        activityContainer.innerHTML = activities.slice(0, 3).map(activity => `
            <div class="flex items-center space-x-4">
                <div class="bg-${activity.color}-500/20 p-2 rounded-full">
                    <i class="fas fa-${activity.icon} text-${activity.color}-400"></i>
                </div>
                <div class="flex-1">
                    <p class="text-white">${activity.text}</p>
                    <p class="text-gray-400 text-sm">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
}

function addToRecentActivity(text, icon, color) {
    let activities = JSON.parse(localStorage.getItem('recentActivity') || '[]');

    const newActivity = {
        text,
        icon,
        color,
        time: getTimeAgo(new Date()),
        timestamp: Date.now()
    };

    activities.unshift(newActivity);
    activities = activities.slice(0, 10); // Keep only last 10 activities

    localStorage.setItem('recentActivity', JSON.stringify(activities));
    loadRecentActivity();
}

function loadAIRecommendations() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const now = new Date();

    const recommendations = [];

    // Check for upcoming deadlines
    const urgentTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        const timeDiff = taskDate - now;
        return timeDiff > 0 && timeDiff < 72 * 60 * 60 * 1000; // Next 3 days
    });

    if (urgentTasks.length > 0) {
        recommendations.push({
            type: 'deadline',
            icon: 'exclamation-circle',
            color: 'orange',
            title: 'Deadline Alert',
            text: `${urgentTasks[0].title} is due soon. Consider starting today!`
        });
    }

    // Study time recommendation
    const currentHour = now.getHours();
    if (currentHour >= 9 && currentHour <= 11) {
        recommendations.push({
            type: 'study',
            icon: 'lightbulb',
            color: 'yellow',
            title: 'Study Tip',
            text: 'Morning hours are great for complex subjects. Perfect time for Math or Science!'
        });
    }

    // Schedule suggestion
    recommendations.push({
        type: 'schedule',
        icon: 'calendar-plus',
        color: 'green',
        title: 'Schedule Suggestion',
        text: 'You have a free slot at 3 PM today. Great for review sessions!'
    });

    // Update recommendations in UI
    updateAIRecommendations(recommendations);
}

function updateAIRecommendations(recommendations) {
    const container = document.querySelector('.space-y-4:has(.fa-lightbulb)');
    if (container && recommendations.length > 0) {
        container.innerHTML = recommendations.slice(0, 3).map(rec => `
            <div class="bg-${rec.color}-500/10 border border-${rec.color}-500/30 rounded-lg p-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-${rec.icon} text-${rec.color}-400 mr-2"></i>
                    <span class="font-medium text-${rec.color}-400">${rec.title}</span>
                </div>
                <p class="text-gray-300 text-sm">${rec.text}</p>
            </div>
        `).join('');
    }
}

function generateNewSchedule() {
    showNotification('Generating optimized schedule...', 'info');

    // Simulate AI processing
    setTimeout(() => {
        showNotification('New schedule generated successfully!', 'success');

        // Add to recent activity
        addToRecentActivity('Generated new AI schedule', 'magic', 'purple');

        // Could redirect to schedule page or update current view
        // window.location.href = 'schedule.html';
    }, 2000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update any time displays if they exist
    const timeElements = document.querySelectorAll('[data-current-time]');
    timeElements.forEach(element => {
        element.textContent = timeString;
    });

    const dateElements = document.querySelectorAll('[data-current-date]');
    dateElements.forEach(element => {
        element.textContent = dateString;
    });
}

function updateQuickStats() {
    // Refresh the stats after changes
    setTimeout(loadQuickStats, 100);
}

function getTimeAgo(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Utility function to show notifications (same as auth.js)
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
