// Schedule Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize schedule page
    initializeSchedulePage();
    setupEventListeners();
    loadUserProfile();
    loadScheduleData();
    updateCurrentWeek();
});

// API Configuration
const API_BASE = 'http://localhost:3000/api';
let currentWeekStart = getWeekStart(new Date());
let scheduleData = [];
let tasksData = [];

function initializeSchedulePage() {
    console.log('Initializing schedule page...');
    showLoadingState();
}

function showLoadingState() {
    // Show loading indicators in all main sections
    const scheduleGrid = document.querySelector('.divide-y.divide-dark-border');
    if (scheduleGrid) {
        scheduleGrid.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center text-gray-400">
                    <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
                    <p class="text-lg">Loading your schedule...</p>
                </div>
            </div>
        `;
    }
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
    loadScheduleData();
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

            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();

            cell.innerHTML = `
                <div class="${isToday ? 'text-indigo-400' : 'text-gray-300'}">${dayName.substring(0, 3)}</div>
                <div class="text-sm ${isToday ? 'text-indigo-400' : 'text-gray-400'}">${month} ${dayNum}</div>
            `;
        }
    });
}

// Load all schedule data from API
async function loadScheduleData() {
    try {
        showLoadingState();

        const startDate = currentWeekStart.toISOString().split('T')[0];
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`Loading schedule for week: ${startDate} to ${endDateStr}`);

        // Load schedule entries and tasks in parallel
        const [scheduleResponse, tasksResponse] = await Promise.all([
            loadScheduleEntries(startDate, endDateStr),
            loadTasksForWeek(startDate, endDateStr)
        ]);

        scheduleData = scheduleResponse || [];
        tasksData = tasksResponse || [];

        // Render the schedule
        renderScheduleGrid();
        updateScheduleStats();

        console.log(`Loaded ${scheduleData.length} schedule entries and ${tasksData.length} tasks`);

    } catch (error) {
        console.error('Error loading schedule data:', error);
        showErrorState('Failed to load schedule data');
    }
}

// Load schedule entries from API
async function loadScheduleEntries(startDate, endDate) {
    try {
        const response = await apiCall(`/schedule?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET'
        });

        return response.schedules || [];
    } catch (error) {
        console.log('No schedule entries found or error loading:', error.message);
        return [];
    }
}

// Load tasks for the current week
async function loadTasksForWeek(startDate, endDate) {
    try {
        const response = await apiCall('/tasks', {
            method: 'GET'
        });

        const allTasks = response.tasks || response || [];

        // Filter tasks by deadline within the week
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const weekTasks = allTasks.filter(task => {
            if (!task.deadline) return false;
            const taskDate = new Date(task.deadline);
            return taskDate >= start && taskDate <= end;
        });

        console.log(`Found ${weekTasks.length} tasks with deadlines in current week`);
        return weekTasks;

    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
}

// Render the complete schedule grid
function renderScheduleGrid() {
    const scheduleGridContainer = document.querySelector('.divide-y.divide-dark-border');
    if (!scheduleGridContainer) return;

    // Create the hour rows (6 AM to 11 PM)
    scheduleGridContainer.innerHTML = '';

    for (let hour = 6; hour <= 23; hour++) {
        const hourRow = createHourRow(hour);
        scheduleGridContainer.appendChild(hourRow);
    }

    // Add schedule entries to the grid
    scheduleData.forEach(entry => addScheduleEntryToGrid(entry));

    // Add tasks as schedule items
    tasksData.forEach(task => addTaskToGrid(task));
}

// Create a row for a specific hour
function createHourRow(hour) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-8 divide-x divide-dark-border min-h-16';
    row.setAttribute('data-hour', hour);

    // Time label
    const timeLabel = document.createElement('div');
    timeLabel.className = 'p-3 text-sm text-gray-400 bg-dark-bg flex items-center';
    timeLabel.textContent = formatHour(hour);
    row.appendChild(timeLabel);

    // 7 day cells
    for (let day = 0; day < 7; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'p-2 relative min-h-16 hover:bg-gray-800/20 transition-colors cursor-pointer';
        dayCell.setAttribute('data-day', day);
        dayCell.setAttribute('data-hour', hour);

        // Add click handler for adding new entries
        dayCell.addEventListener('click', () => {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + day);
            openQuickAddModal(date, hour);
        });

        row.appendChild(dayCell);
    }

    return row;
}

// Format hour for display
function formatHour(hour) {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
}

// Add schedule entry to grid
function addScheduleEntryToGrid(entry) {
    const entryDate = new Date(entry.date);
    const dayIndex = getDayIndexFromDate(entryDate);

    if (dayIndex === -1) return; // Entry not in current week

    const startHour = parseInt(entry.startTime.split(':')[0]);
    const endHour = parseInt(entry.endTime.split(':')[0]);

    // Find the appropriate cell
    const hourRow = document.querySelector(`[data-hour="${startHour}"]`);
    if (!hourRow) return;

    const dayCell = hourRow.querySelector(`[data-day="${dayIndex}"]`);
    if (!dayCell) return;

    // Create schedule item element
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'absolute inset-1 bg-indigo-500/20 border border-indigo-500/50 rounded p-2 text-xs hover:bg-indigo-500/30 transition-colors group cursor-pointer';
    scheduleItem.innerHTML = `
        <div class="font-medium text-indigo-400 truncate">${entry.title}</div>
        <div class="text-gray-400 text-xs">${entry.startTime} - ${entry.endTime}</div>
        ${entry.description ? `<div class="text-gray-500 text-xs mt-1 truncate">${entry.description}</div>` : ''}
        <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="delete-btn text-red-400 hover:text-red-300 text-xs">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add event handlers
    scheduleItem.addEventListener('click', (e) => {
        e.stopPropagation();
        editScheduleEntry(entry);
    });

    const deleteBtn = scheduleItem.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteScheduleEntry(entry);
        });
    }

    dayCell.appendChild(scheduleItem);
}

// Add task to grid as a visual reminder
function addTaskToGrid(task) {
    const taskDate = new Date(task.deadline);
    const dayIndex = getDayIndexFromDate(taskDate);

    if (dayIndex === -1) return; // Task not in current week

    // Find a suitable time slot (prefer afternoon for deadline reminders)
    let targetHour = 15; // 3 PM default

    if (task.priority === 'high') targetHour = 10; // Morning for high priority
    else if (task.priority === 'low') targetHour = 18; // Evening for low priority

    // Find available slot around target hour
    while (targetHour <= 22) {
        const hourRow = document.querySelector(`[data-hour="${targetHour}"]`);
        if (hourRow) {
            const dayCell = hourRow.querySelector(`[data-day="${dayIndex}"]`);
            if (dayCell && !dayCell.querySelector('.absolute')) {
                // Slot is available
                addTaskItemToCell(dayCell, task, targetHour);
                break;
            }
        }
        targetHour++;
    }
}

// Add task item to a specific cell
function addTaskItemToCell(cell, task, hour) {
    const priorityColors = {
        'high': 'red',
        'medium': 'yellow',
        'low': 'green'
    };

    const color = priorityColors[task.priority] || 'blue';

    const taskItem = document.createElement('div');
    taskItem.className = `absolute inset-1 bg-${color}-500/20 border border-${color}-500/50 rounded p-2 text-xs hover:bg-${color}-500/30 transition-colors group cursor-pointer`;
    taskItem.innerHTML = `
        <div class="flex items-center justify-between mb-1">
            <div class="font-medium text-${color}-400 truncate flex-1">${task.title}</div>
            <i class="fas fa-exclamation-triangle text-${color}-400 text-xs ml-1" title="Task Deadline"></i>
        </div>
        <div class="text-gray-400 text-xs">Due: ${formatDate(task.deadline)}</div>
        ${task.description ? `<div class="text-gray-500 text-xs mt-1 truncate">${task.description}</div>` : ''}
        <div class="text-xs text-${color}-300 mt-1">Priority: ${task.priority}</div>
    `;

    // Add click handler to view task details
    taskItem.addEventListener('click', (e) => {
        e.stopPropagation();
        showTaskDetails(task);
    });

    cell.appendChild(taskItem);
}

// Helper function to get day index from date
function getDayIndexFromDate(date) {
    const itemDate = new Date(date);
    const weekStart = new Date(currentWeekStart);

    const diffTime = itemDate.getTime() - weekStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return (diffDays >= 0 && diffDays < 7) ? diffDays : -1;
}

// Update schedule statistics
async function updateScheduleStats() {
    try {
        await updateTimeDistribution();
        await updateWeeklyTasks();
        await updateScheduleInsights();
    } catch (error) {
        console.error('Error updating schedule stats:', error);
    }
}

// Update time distribution section
async function updateTimeDistribution() {
    const container = document.getElementById('timeDistribution');
    if (!container) return;

    // Calculate time distribution from schedule data
    const distribution = {
        study: 0,
        assignments: 0,
        projects: 0,
        meetings: 0,
        free: 0
    };

    scheduleData.forEach(entry => {
        const duration = calculateDuration(entry.startTime, entry.endTime);
        const text = (entry.title + ' ' + (entry.description || '')).toLowerCase();

        if (text.includes('study') || text.includes('review') || text.includes('learn')) {
            distribution.study += duration;
        } else if (text.includes('assignment') || text.includes('homework')) {
            distribution.assignments += duration;
        } else if (text.includes('project')) {
            distribution.projects += duration;
        } else if (text.includes('meeting') || text.includes('class')) {
            distribution.meetings += duration;
        } else {
            distribution.free += duration;
        }
    });

    container.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-300">Study Time</span>
                <span class="text-blue-400 font-medium">${distribution.study.toFixed(1)}h</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-300">Assignments</span>
                <span class="text-green-400 font-medium">${distribution.assignments.toFixed(1)}h</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-300">Projects</span>
                <span class="text-purple-400 font-medium">${distribution.projects.toFixed(1)}h</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-300">Meetings/Classes</span>
                <span class="text-orange-400 font-medium">${distribution.meetings.toFixed(1)}h</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-300">Other Activities</span>
                <span class="text-yellow-400 font-medium">${distribution.free.toFixed(1)}h</span>
            </div>
        </div>
    `;
}

// Update weekly tasks section
async function updateWeeklyTasks() {
    const container = document.getElementById('weeklyTasks');
    if (!container) return;

    if (tasksData.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-4">
                <i class="fas fa-calendar-check text-2xl mb-2"></i>
                <p>No tasks due this week</p>
            </div>
        `;
        return;
    }

    // Sort tasks by priority and deadline
    const sortedTasks = [...tasksData].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    const tasksHtml = sortedTasks.slice(0, 5).map(task => {
        const priorityColors = {
            'high': 'text-red-400',
            'medium': 'text-yellow-400',
            'low': 'text-green-400'
        };

        const statusIcons = {
            'completed': 'fas fa-check text-green-400',
            'in-progress': 'fas fa-clock text-yellow-400',
            'pending': 'fas fa-circle text-gray-400'
        };

        return `
            <div class="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <i class="${statusIcons[task.status] || statusIcons.pending}"></i>
                        <span class="text-gray-300 text-sm truncate">${task.title}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Due: ${formatDate(task.deadline)} | Priority: 
                        <span class="${priorityColors[task.priority] || 'text-gray-400'}">${task.priority}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="space-y-2">${tasksHtml}</div>`;
}

// Update schedule insights section
async function updateScheduleInsights() {
    const container = document.getElementById('scheduleInsights');
    if (!container) return;

    const insights = generateScheduleInsights();

    if (insights.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-4">
                <i class="fas fa-lightbulb text-2xl mb-2"></i>
                <p>Add more schedule entries to get insights</p>
            </div>
        `;
        return;
    }

    const insightsHtml = insights.map(insight => `
        <div class="bg-${insight.color}-500/10 border border-${insight.color}-500/30 rounded-lg p-3">
            <p class="text-${insight.color}-400 font-medium mb-1">${insight.title}</p>
            <p class="text-gray-300">${insight.message}</p>
        </div>
    `).join('');

    container.innerHTML = insightsHtml;
}

// Generate schedule insights based on current data
function generateScheduleInsights() {
    const insights = [];

    // Check for schedule density
    if (scheduleData.length > 10) {
        insights.push({
            title: 'Busy Week',
            message: 'You have a packed schedule. Consider adding breaks between activities.',
            color: 'orange'
        });
    } else if (scheduleData.length < 3) {
        insights.push({
            title: 'Light Schedule',
            message: 'You have some free time. Consider adding study sessions or personal goals.',
            color: 'blue'
        });
    }

    // Check for high priority tasks without schedule time
    const highPriorityTasks = tasksData.filter(task => task.priority === 'high' && task.status !== 'completed');
    if (highPriorityTasks.length > 0) {
        insights.push({
            title: 'High Priority Tasks',
            message: `You have ${highPriorityTasks.length} high priority task(s) due this week. Schedule time for them.`,
            color: 'red'
        });
    }

    // Check for good work-life balance
    const workEntries = scheduleData.filter(entry =>
        entry.title.toLowerCase().includes('study') ||
        entry.title.toLowerCase().includes('work') ||
        entry.title.toLowerCase().includes('assignment')
    ).length;

    const personalEntries = scheduleData.filter(entry =>
        entry.title.toLowerCase().includes('break') ||
        entry.title.toLowerCase().includes('personal') ||
        entry.title.toLowerCase().includes('free')
    ).length;

    if (workEntries > personalEntries * 3) {
        insights.push({
            title: 'Work-Life Balance',
            message: 'Consider scheduling some personal time and breaks to maintain balance.',
            color: 'purple'
        });
    }

    return insights.slice(0, 3); // Limit to 3 insights
}

// Show error state when data loading fails
function showErrorState(message) {
    const scheduleGrid = document.querySelector('.divide-y.divide-dark-border');
    if (scheduleGrid) {
        scheduleGrid.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center text-gray-400">
                    <i class="fas fa-exclamation-triangle text-3xl mb-4 text-red-400"></i>
                    <p class="text-lg mb-2">Error Loading Schedule</p>
                    <p class="text-sm">${message}</p>
                    <button onclick="loadScheduleData()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
}

// Generate optimized schedule from pending tasks
async function generateOptimizedSchedule() {
    try {
        showNotification('Generating AI-optimized schedule...', 'info');

        // Fetch pending tasks
        const tasksResponse = await apiCall('/tasks?status=pending', {
            method: 'GET'
        });

        const pendingTasks = tasksResponse.tasks || tasksResponse || [];

        if (pendingTasks.length === 0) {
            showNotification('No pending tasks to schedule', 'info');
            return;
        }

        // Generate schedule items for pending tasks
        const optimizedScheduleItems = generateScheduleFromTasks(pendingTasks);

        // Create schedule items via API
        let createdCount = 0;
        for (const item of optimizedScheduleItems) {
            try {
                const response = await apiCall('/schedule', {
                    method: 'POST',
                    body: JSON.stringify({
                        date: item.date,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        title: item.title,
                        description: item.description || `Auto-scheduled time for ${item.title}`
                    })
                });

                if (response) {
                    createdCount++;
                }
            } catch (error) {
                console.error('Error creating schedule item:', error);
            }
        }

        // Reload schedule to show new items
        await loadScheduleData();
        showNotification(`Generated ${createdCount} new schedule blocks!`, 'success');

    } catch (error) {
        console.error('Error generating optimized schedule:', error);
        showNotification('Failed to generate optimized schedule', 'error');
    }
}

// Generate schedule items from tasks using AI-like logic
function generateScheduleFromTasks(tasks) {
    const schedule = [];
    const workingHours = [9, 10, 11, 14, 15, 16, 17]; // Preferred study hours
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Sort tasks by priority and deadline
    const sortedTasks = tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    // Allocate time for each task
    sortedTasks.slice(0, 7).forEach((task, index) => {
        const dayIndex = index % days.length;
        const hourIndex = index % workingHours.length;
        const day = days[dayIndex];
        const hour = workingHours[hourIndex];

        // Determine duration based on estimated time or priority
        let duration = 2; // Default 2 hours
        if (task.estimatedTime) {
            duration = Math.max(1, Math.min(4, Math.ceil(task.estimatedTime / 60)));
        } else if (task.priority === 'high') {
            duration = 3;
        } else if (task.priority === 'low') {
            duration = 1;
        }

        schedule.push({
            title: `Study: ${task.title}`,
            description: `Scheduled time for ${task.title}. ${task.description || ''}`.trim(),
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + duration).toString().padStart(2, '0')}:00`,
            date: calculateDateForDay(day).toISOString().split('T')[0],
            generated: true,
            taskId: task._id
        });
    });

    return schedule;
}

// Open quick add modal for adding schedule entries
function openQuickAddModal(date, hour) {
    const title = prompt('Enter activity title:');
    if (!title) return;

    const description = prompt('Enter description (optional):') || '';
    const duration = parseInt(prompt('Duration in hours (1-4):', '2')) || 2;

    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + duration).toString().padStart(2, '0')}:00`;

    // Create schedule entry
    addScheduleEntry({
        date: date.toISOString().split('T')[0],
        startTime,
        endTime,
        title,
        description
    });
}

// Add new schedule entry via API
async function addScheduleEntry(entryData) {
    try {
        const response = await apiCall('/schedule', {
            method: 'POST',
            body: JSON.stringify(entryData)
        });

        if (response) {
            showNotification('Schedule entry added successfully!', 'success');
            await loadScheduleData();
        }
    } catch (error) {
        console.error('Error adding schedule entry:', error);
        showNotification('Failed to add schedule entry', 'error');
    }
}

// Edit schedule entry
async function editScheduleEntry(entry) {
    const newTitle = prompt('Edit title:', entry.title);
    if (newTitle === null) return;

    const newDescription = prompt('Edit description:', entry.description || '');
    if (newDescription === null) return;

    const newStartTime = prompt('Edit start time (HH:MM):', entry.startTime);
    if (newStartTime === null) return;

    const newEndTime = prompt('Edit end time (HH:MM):', entry.endTime);
    if (newEndTime === null) return;

    if (newStartTime >= newEndTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    try {
        const updatedData = {
            title: newTitle || entry.title,
            description: newDescription,
            startTime: newStartTime || entry.startTime,
            endTime: newEndTime || entry.endTime
        };

        const response = await apiCall(`/schedule/${entry._id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        if (response) {
            showNotification('Schedule entry updated successfully!', 'success');
            await loadScheduleData();
        }
    } catch (error) {
        console.error('Error updating schedule entry:', error);
        showNotification('Failed to update schedule entry', 'error');
    }
}

// Delete schedule entry
async function deleteScheduleEntry(entry) {
    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) {
        return;
    }

    try {
        const response = await apiCall(`/schedule/${entry._id}`, {
            method: 'DELETE'
        });

        if (response !== false) {
            showNotification('Schedule entry deleted successfully!', 'success');
            await loadScheduleData();
        }
    } catch (error) {
        console.error('Error deleting schedule entry:', error);
        showNotification('Failed to delete schedule entry', 'error');
    }
}

// Show task details
function showTaskDetails(task) {
    alert(`Task Details:
Title: ${task.title}
Description: ${task.description || 'No description'}
Priority: ${task.priority}
Status: ${task.status}
Deadline: ${formatDate(task.deadline)}
Created: ${formatDate(task.createdAt)}`);
}

// Time block modal functions
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

// Handle add time block form submission
async function handleAddTimeBlock(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const day = formData.get('day');
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');
    const title = formData.get('label') || 'Available Time';

    if (!day || !startTime || !endTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (startTime >= endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    try {
        const scheduleDate = calculateDateForDay(day);

        const scheduleData = {
            date: scheduleDate.toISOString().split('T')[0],
            startTime,
            endTime,
            title,
            description: `Available time block for ${title}`
        };

        const response = await apiCall('/schedule', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });

        if (response) {
            closeTimeBlockModalFunc();
            showNotification('Time block added successfully!', 'success');
            await loadScheduleData();
        }
    } catch (error) {
        console.error('Error adding time block:', error);
        showNotification('Failed to add time block', 'error');
    }
}

// Switch between different views
function switchView(view) {
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function calculateDateForDay(dayName) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(dayName.toLowerCase());

    if (dayIndex === -1) return new Date();

    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
}

function calculateDuration(startTime, endTime) {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return Math.max(0, end - start);
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + (minutes || 0) / 60;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load user profile
async function loadUserProfile() {
    try {
        const userData = await apiCall('/auth/profile', {
            method: 'GET'
        });

        if (userData && userData.user) {
            // Update user display elements
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(element => {
                element.textContent = userData.user.name || userData.user.email || 'User';
            });
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Notification system
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
