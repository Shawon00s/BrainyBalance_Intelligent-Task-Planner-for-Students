// Schedule Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in (check for auth tokens)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize schedule page
    initializeSchedulePage();
    setupEventListeners();
    loadUserProfile(); // Load user profile
    loadScheduleFromAPI();
    updateCurrentWeek();
});

// API Configuration
const API_BASE = 'http://localhost:3000/api';
let currentWeekStart = getWeekStart(new Date());
let scheduleData = [];

function initializeSchedulePage() {
    // No longer creating default schedule - will load from API
    console.log('Initializing schedule page...');
}

function setupEventListeners() {
    // Week navigation
    const prevWeek = document.getElementById('prevWeek');
    const nextWeek = document.getElementById('nextWeek');

    if (prevWeek) prevWeek.addEventListener('click', () => navigateWeek(-1));
    if (nextWeek) nextWeek.addEventListener('click', () => navigateWeek(1));

    // View buttons
    const dayView = document.getElementById('dayView');
    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');

    if (dayView) dayView.addEventListener('click', () => switchView('day'));
    if (weekView) weekView.addEventListener('click', () => switchView('week'));
    if (monthView) monthView.addEventListener('click', () => switchView('month'));

    // Generate schedule button
    const generateScheduleBtn = document.getElementById('generateScheduleBtn');
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', generateOptimizedSchedule);
    }

    // Add time block button
    const addTimeBlockBtn = document.getElementById('addTimeBlockBtn');
    if (addTimeBlockBtn) {
        addTimeBlockBtn.addEventListener('click', openTimeBlockModal);
    }

    // Time block modal controls
    const closeTimeBlockModal = document.getElementById('closeTimeBlockModal');
    const cancelTimeBlock = document.getElementById('cancelTimeBlock');
    const timeBlockModal = document.getElementById('timeBlockModal');

    if (closeTimeBlockModal) closeTimeBlockModal.addEventListener('click', closeTimeBlockModalFunc);
    if (cancelTimeBlock) cancelTimeBlock.addEventListener('click', closeTimeBlockModalFunc);
    if (timeBlockModal) {
        timeBlockModal.addEventListener('click', (e) => {
            if (e.target === timeBlockModal) closeTimeBlockModalFunc();
        });
    }

    // Time block form
    const timeBlockForm = document.getElementById('timeBlockForm');
    if (timeBlockForm) {
        timeBlockForm.addEventListener('submit', handleAddTimeBlock);
    }
}

function navigateWeek(direction) {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    currentWeekStart = new Date(currentWeekStart.getTime() + (direction * oneWeek));
    updateCurrentWeek();
    loadScheduleFromAPI(); // Use API loading instead of localStorage
}

function updateCurrentWeek() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const options = { month: 'long', day: 'numeric' };
    const startStr = currentWeekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', options);
    const year = currentWeekStart.getFullYear();

    const currentWeekElement = document.getElementById('currentWeek');
    if (currentWeekElement) {
        currentWeekElement.textContent = `${startStr} - ${endStr}, ${year}`;
    }

    // Update calendar header
    updateCalendarHeader();
}

function updateCalendarHeader() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const headerCells = document.querySelectorAll('.grid-cols-8 .p-4:not(:first-child)');

    headerCells.forEach((cell, index) => {
        if (index < 7) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + index);

            const dayName = days[index];
            const dayNum = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });

            // Check if it's today
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();

            cell.innerHTML = `
                <div class="${isToday ? 'text-indigo-400' : 'text-gray-300'}">${dayName.substring(0, 3)}</div>
                <div class="text-sm ${isToday ? 'text-indigo-400' : 'text-gray-400'}">${month} ${dayNum}</div>
            `;
        }
    });
}

// Load schedule from API
async function loadScheduleFromAPI() {
    try {
        console.log('Loading schedule from API...');

        // Get current week date range
        const startDate = currentWeekStart.toISOString().split('T')[0];
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/schedule?startDate=${startDate}&endDate=${endDateStr}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            scheduleData = data.schedules || [];
            console.log('Loaded schedule data:', scheduleData);

            // If backend returned no schedule items for this week,
            // fall back to tasks (map tasks with deadlines into calendar)
            if ((!scheduleData || scheduleData.length === 0)) {
                const tasks = await fetchTasksForWeek(startDate, endDateStr);
                if (tasks && tasks.length) {
                    const mapped = tasksToScheduleItems(tasks);
                    // mark items as coming from tasks (no _id)
                    scheduleData = mapped;
                }
            }

            // Clear existing schedule items and render new ones
            clearScheduleGrid();
            renderScheduleItems();
            updateScheduleStats();
        } else {
            console.error('Failed to load schedule:', response.status);
            // Use fallback empty schedule -> try tasks
            scheduleData = [];
            const tasks = await fetchTasksForWeek(startDate, endDateStr);
            if (tasks && tasks.length) {
                scheduleData = tasksToScheduleItems(tasks);
            }
            clearScheduleGrid();
            renderScheduleItems();
            updateScheduleStats();
        }
    } catch (error) {
        console.error('Error loading schedule from API:', error);
        // Use fallback empty schedule
        scheduleData = [];
        clearScheduleGrid();
        updateScheduleStats();
    }
}

// Render schedule items on the grid
function renderScheduleItems() {
    scheduleData.forEach(item => {
        addScheduleItemToGrid(item);
    });
}

function loadSchedule() {
    // Redirect to API loading function
    loadScheduleFromAPI();
}

function clearScheduleGrid() {
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => item.remove());
}

function addScheduleItemToGrid(item) {
    // Convert date to day index (0 = Monday, 1 = Tuesday, etc.)
    const itemDate = new Date(item.date);
    const dayIndex = getDayIndexFromDate(itemDate);

    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    const duration = endHour - startHour;

    // Find the correct grid cell
    const timeRows = document.querySelectorAll('.grid-cols-8.divide-x.divide-dark-border.min-h-16');
    const hourRowIndex = startHour - 8; // Assuming schedule starts at 8 AM

    if (hourRowIndex >= 0 && hourRowIndex < timeRows.length && dayIndex >= 0) {
        const row = timeRows[hourRowIndex];
        const cells = row.querySelectorAll('.p-2');

        if (dayIndex < cells.length) {
            const cell = cells[dayIndex];

            // Determine color based on task or default
            const color = getScheduleItemColor(item);

            const scheduleElement = document.createElement('div');
            scheduleElement.className = `schedule-item bg-${color}-500/20 border border-${color}-500/50 rounded p-2 text-xs cursor-pointer hover:bg-${color}-500/30 transition-colors relative group`;
            scheduleElement.innerHTML = `
                <div class="font-medium text-${color}-400">${item.title}</div>
                <div class="text-gray-400">${item.startTime} - ${item.endTime}</div>
                ${item.description ? `<div class="text-gray-500 text-xs mt-1">${item.description}</div>` : ''}
                <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="delete-btn text-red-400 hover:text-red-300 text-xs">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            // Add click event for editing
            scheduleElement.addEventListener('click', () => editScheduleItem(item));

            // Add delete button event
            const deleteBtn = scheduleElement.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteScheduleItem(item);
                });
            }

            cell.appendChild(scheduleElement);
        }
    }
}

// Helper function to get day index from date (relative to current week)
function getDayIndexFromDate(date) {
    const itemDate = new Date(date);
    const weekStart = new Date(currentWeekStart);

    // Calculate days difference from week start
    const diffTime = itemDate.getTime() - weekStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Return day index (0-6 for Mon-Sun), or -1 if outside current week
    return (diffDays >= 0 && diffDays < 7) ? diffDays : -1;
}

// Helper function to determine color for schedule item
function getScheduleItemColor(item) {
    if (item.taskId && item.taskId.priority) {
        switch (item.taskId.priority) {
            case 'high': return 'red';
            case 'medium': return 'yellow';
            case 'low': return 'green';
        }
    }
    return 'blue'; // default color
}

async function editScheduleItem(item) {
    // Create a simple prompt-based edit for now
    // In a real app, this would open a proper edit modal
    const newTitle = prompt('Edit title:', item.title);
    if (newTitle === null) return; // User cancelled

    const newDescription = prompt('Edit description:', item.description || '');
    if (newDescription === null) return; // User cancelled

    const newStartTime = prompt('Edit start time (HH:MM):', item.startTime);
    if (newStartTime === null) return; // User cancelled

    const newEndTime = prompt('Edit end time (HH:MM):', item.endTime);
    if (newEndTime === null) return; // User cancelled

    // Validation
    if (newStartTime >= newEndTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    try {
        const updatedData = {
            title: newTitle || item.title,
            description: newDescription,
            startTime: newStartTime || item.startTime,
            endTime: newEndTime || item.endTime
        };

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/schedule/${item._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            showNotification('Schedule item updated successfully!', 'success');
            await loadScheduleFromAPI(); // Reload to show changes
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to update schedule item', 'error');
        }
    } catch (error) {
        console.error('Error updating schedule item:', error);
        showNotification('Failed to update schedule item', 'error');
    }
}

// Add delete functionality
async function deleteScheduleItem(item) {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/schedule/${item._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Schedule item deleted successfully!', 'success');
            await loadScheduleFromAPI(); // Reload to show changes
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to delete schedule item', 'error');
        }
    } catch (error) {
        console.error('Error deleting schedule item:', error);
        showNotification('Failed to delete schedule item', 'error');
    }
}

async function generateOptimizedSchedule() {
    showNotification('Generating AI-optimized schedule...', 'info');

    try {
        // Get pending tasks from API
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const tasksResponse = await fetch(`${API_BASE}/tasks?status=pending`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!tasksResponse.ok) {
            throw new Error('Failed to fetch tasks');
        }

        const tasksData = await tasksResponse.json();
        const pendingTasks = tasksData.tasks || tasksData;

        // Generate schedule items for pending tasks
        const optimizedScheduleItems = generateScheduleFromTasks(pendingTasks);

        // Create schedule items via API
        let createdCount = 0;
        for (const item of optimizedScheduleItems) {
            try {
                const response = await fetch(`${API_BASE}/schedule`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: item.date,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        title: item.title,
                        description: item.description
                    })
                });

                if (response.ok) {
                    createdCount++;
                }
            } catch (error) {
                console.error('Error creating schedule item:', error);
            }
        }

        // Reload schedule to show new items
        await loadScheduleFromAPI();
        showNotification(`Generated schedule with ${createdCount} new time blocks!`, 'success');

    } catch (error) {
        console.error('Error generating optimized schedule:', error);
        showNotification('Failed to generate optimized schedule', 'error');
    }
}

function generateScheduleFromTasks(tasks) {
    const schedule = [];
    const workingHours = [9, 10, 11, 14, 15, 16]; // Preferred study hours
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    tasks.slice(0, 3).forEach((task, index) => {
        const day = days[index % days.length];
        const hour = workingHours[index % workingHours.length];

        schedule.push({
            id: `generated_${Date.now()}_${index}`,
            title: task.title,
            description: task.description,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
            day: day,
            date: calculateDateForDay(day).toISOString().split('T')[0],
            type: 'study',
            color: getColorForPriority(task.priority),
            generated: true
        });
    });

    return schedule;
}

function openTimeBlockModal() {
    const modal = document.getElementById('timeBlockModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeTimeBlockModalFunc() {
    const modal = document.getElementById('timeBlockModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('timeBlockForm');
        if (form) form.reset();
    }
}

async function handleAddTimeBlock(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const day = formData.get('day');
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');
    const title = formData.get('label') || 'Available Time';
    const description = formData.get('description') || '';

    // Validation
    if (!day || !startTime || !endTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (startTime >= endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    try {
        // Calculate the date for the selected day
        const scheduleDate = calculateDateForDay(day);

        const scheduleData = {
            date: scheduleDate.toISOString().split('T')[0],
            startTime,
            endTime,
            title,
            description
        };

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/schedule`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Schedule item created:', result);

            closeTimeBlockModalFunc();
            showNotification('Schedule item added successfully!', 'success');

            // Reload schedule to show new item
            await loadScheduleFromAPI();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to add schedule item', 'error');
        }
    } catch (error) {
        console.error('Error adding schedule item:', error);
        showNotification('Failed to add schedule item', 'error');
    }
}

// Helper function to calculate date for a day name relative to current week
function calculateDateForDay(dayName) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(dayName.toLowerCase());

    if (dayIndex === -1) return new Date(); // fallback

    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
}

function updateScheduleStats() {
    // Use loaded schedule data instead of localStorage
    const schedule = scheduleData || [];

    // Calculate time distribution
    const timeDistribution = {
        study: 0,
        assignment: 0,
        project: 0,
        other: 0
    };

    let totalHours = 0;

    schedule.forEach(item => {
        const duration = calculateDuration(item.startTime, item.endTime);
        totalHours += duration;

        // Categorize based on title/description content
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        if (text.includes('study') || text.includes('review') || text.includes('learn')) {
            timeDistribution.study += duration;
        } else if (text.includes('assignment') || text.includes('homework')) {
            timeDistribution.assignment += duration;
        } else if (text.includes('project')) {
            timeDistribution.project += duration;
        } else {
            timeDistribution.other += duration;
        }
    });

    // Update UI
    const totalHoursElement = document.getElementById('totalHours');
    const studyHoursElement = document.getElementById('studyHours');
    const projectsElement = document.getElementById('projects');
    const freeHoursElement = document.getElementById('freeHours');

    if (totalHoursElement) totalHoursElement.textContent = `${totalHours}h`;
    if (studyHoursElement) studyHoursElement.textContent = `${timeDistribution.study}h`;
    if (projectsElement) projectsElement.textContent = schedule.length;
    if (freeHoursElement) {
        const totalWeekHours = 7 * 12; // 7 days * 12 hours (8AM-8PM)
        const freeHours = Math.max(0, totalWeekHours - totalHours);
        freeHoursElement.textContent = `${freeHours}h`;
    }
}

function updateTimeDistribution(distribution) {
    const distributionElements = {
        'Study Time': `${distribution.study} hours`,
        'Assignments': `${distribution.assignment} hours`,
        'Projects': `${distribution.project} hours`,
        'Free Time': `${distribution.other + 10} hours` // Add some base free time
    };

    Object.entries(distributionElements).forEach(([label, value]) => {
        const elements = document.querySelectorAll('.text-gray-300');
        elements.forEach(element => {
            if (element.textContent === label) {
                const valueElement = element.parentNode.querySelector('span:last-child');
                if (valueElement) {
                    valueElement.textContent = value;
                }
            }
        });
    });
}

function switchView(view) {
    // Update active button
    const viewButtons = document.querySelectorAll('#dayView, #weekView, #monthView');
    viewButtons.forEach(button => {
        button.classList.remove('bg-indigo-600', 'text-white');
        button.classList.add('text-gray-400');
    });

    const activeButton = document.getElementById(`${view}View`);
    if (activeButton) {
        activeButton.classList.add('bg-indigo-600', 'text-white');
        activeButton.classList.remove('text-gray-400');
    }

    // Here you would implement different view layouts
    if (view === 'month') {
        showNotification('Month view coming soon!', 'info');
    } else if (view === 'day') {
        showNotification('Day view coming soon!', 'info');
    }
}

// Utility functions
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getDayIndex(dayName) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.indexOf(dayName.toLowerCase());
}

function getDateForDay(dayName) {
    const dayIndex = getDayIndex(dayName);
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString();
}

function calculateDuration(startTime, endTime) {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return end - start;
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}

function getColorForPriority(priority) {
    const colors = {
        high: 'red',
        medium: 'yellow',
        low: 'green'
    };
    return colors[priority] || 'blue';
}

// Fetch pending tasks whose deadline falls within the current week
async function fetchTasksForWeek(startDate, endDate) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/tasks?status=pending&startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch tasks for week', response.status);
            return [];
        }

        const data = await response.json();
        return data.tasks || data || [];
    } catch (err) {
        console.error('Error fetching tasks for week:', err);
        return [];
    }
}

// Convert tasks into schedule items for display. Use task.deadline as date and allocate a 1-2 hour block.
function tasksToScheduleItems(tasks) {
    const items = [];
    const preferredStart = 9; // default start hour if none provided

    tasks.forEach((task, idx) => {
        // Use task.deadline if present, else skip
        const deadline = task.deadline ? new Date(task.deadline) : null;
        if (!deadline) return;

        // If deadline falls within current week
        const dayIndex = getDayIndexFromDate(deadline);
        if (dayIndex === -1) return;

        // Assign a start hour based on index to avoid overlaps
        const startHour = preferredStart + (idx % 6); // slot across day
        const endHour = startHour + Math.min(2, Math.max(1, Math.ceil((task.estimatedTime || 60) / 60)));

        items.push({
            // no _id since these are not stored schedule items yet
            title: task.title,
            description: task.description || '',
            date: deadline.toISOString().split('T')[0],
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            taskId: task, // keep task object for priority/color mapping
            generatedFromTask: true
        });
    });

    return items;
}

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
