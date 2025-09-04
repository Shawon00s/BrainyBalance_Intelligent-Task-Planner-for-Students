// Schedule Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Double-check authentication with the proper function
    if (!isAuthenticated()) {
        console.log('Authentication validation failed, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Initialize schedule page
    initializeSchedulePage();
    setupEventListeners();
    loadScheduleData();
    updateCurrentWeek();
});

// API Configuration
const API_BASE = 'http://localhost:3000/api';
// Set current date to September 3, 2025 for testing
const currentDate = new Date('2025-09-03');
let currentWeekStart = getWeekStart(currentDate);
let scheduleData = [];
let tasksData = [];

// Debug: Log current week information
console.log('Current date:', currentDate);
console.log('Current week start:', currentWeekStart);
console.log('Current week end:', new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

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

    // Export button
    const exportBtn = document.getElementById('exportSchedule');
    if (exportBtn) exportBtn.addEventListener('click', exportSchedule);

    // Modal close buttons
    const closeTaskModal = document.getElementById('closeTaskModal');
    if (closeTaskModal) {
        closeTaskModal.addEventListener('click', () => {
            const modal = document.getElementById('taskDetailsModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    const closeEditModal = document.getElementById('closeEditScheduleModal');
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            const modal = document.getElementById('editScheduleModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    // View buttons
    const dayView = document.getElementById('dayView');
    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');

    if (dayView) dayView.addEventListener('click', () => switchView('day'));
    if (weekView) weekView.addEventListener('click', () => switchView('week'));
    if (monthView) monthView.addEventListener('click', () => switchView('month'));
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
        console.log('Current week start for data loading:', currentWeekStart);

        // Load schedule entries and tasks in parallel
        const [scheduleResponse, tasksResponse] = await Promise.all([
            loadScheduleEntries(startDate, endDateStr),
            loadTasksForWeek(startDate, endDateStr)
        ]);

        scheduleData = scheduleResponse || [];
        tasksData = tasksResponse || [];

        console.log('Schedule data loaded:', scheduleData);
        console.log('Tasks data loaded:', tasksData);

        // Render the schedule
        renderScheduleGrid();
        updateScheduleStats();

        // Load task summary for the bottom section
        loadTaskSummary();

        console.log(`Loaded ${scheduleData.length} schedule entries and ${tasksData.length} tasks`);

    } catch (error) {
        console.error('Error loading schedule data:', error);
        showErrorState('Failed to load schedule data');
    }
}

// Load schedule entries from API
async function loadScheduleEntries(startDate, endDate) {
    console.log('Loading schedule entries for date range:', startDate, 'to', endDate);

    try {
        const response = await apiCall(`/schedule?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET'
        });

        const entries = response.schedules || [];
        console.log('API returned schedule entries:', entries);
        return entries;
    } catch (error) {
        console.log('API failed, using demo schedule data. Error:', error.message);

        // Return demo schedule entries for current week
        return [
            {
                id: 'demo-schedule-1',
                title: 'Study Session',
                description: 'CSE327 Project Work',
                date: '2025-09-04',  // September 4, 2025 - Thursday
                startTime: '09:00',
                endTime: '11:00',
                type: 'study'
            },
            {
                id: 'demo-schedule-2',
                title: 'Mathematics Class',
                description: 'Calculus Review',
                date: '2025-09-05',  // September 5, 2025 - Friday
                startTime: '14:00',
                endTime: '16:00',
                type: 'class'
            },
            {
                id: 'demo-schedule-3',
                title: 'Lab Session',
                description: 'Programming Lab',
                date: '2025-09-03',  // September 3, 2025 - Tuesday
                startTime: '10:00',
                endTime: '12:00',
                type: 'lab'
            }
        ];
    }
}

// Load tasks for the current week
async function loadTasksForWeek(startDate, endDate) {
    console.log('Loading tasks for date range:', startDate, 'to', endDate);

    try {
        const response = await apiCall('/tasks', {
            method: 'GET'
        });

        const allTasks = response.tasks || response || [];
        console.log('API returned all tasks:', allTasks);

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
        console.log('API failed, using demo task data. Error:', error.message);

        // Return demo data for current week (September 2-8, 2025)
        const demoTasks = [
            {
                id: 'demo-1',
                title: 'CSE327 Project Defense',
                description: 'Project Defense Presentation',
                priority: 'medium',
                category: 'Project',
                deadline: '2025-09-04T07:15:00.000Z',  // September 4, 2025 - Thursday
                createdAt: '2025-09-01T09:30:00.000Z',
                status: 'pending'
            },
            {
                id: 'demo-2',
                title: 'Mathematics Assignment',
                description: 'Complete calculus problems',
                priority: 'high',
                category: 'Assignment',
                deadline: '2025-09-03T13:03:00.000Z',  // September 3, 2025 - Tuesday
                createdAt: '2025-08-30T14:22:00.000Z',
                status: 'pending'
            },
            {
                id: 'demo-3',
                title: 'Research Paper',
                description: 'AI in Education research',
                priority: 'high',
                category: 'Research',
                deadline: '2025-09-05T16:45:00.000Z',  // September 5, 2025 - Friday
                createdAt: '2025-08-28T11:15:00.000Z',
                status: 'pending'
            },
            {
                id: 'demo-4',
                title: 'Team Meeting',
                description: 'Weekly project sync',
                priority: 'low',
                category: 'Meeting',
                deadline: '2025-09-02T10:30:00.000Z',  // September 2, 2025 - Monday
                createdAt: '2025-09-01T16:00:00.000Z',
                status: 'pending'
            },
            {
                id: 'demo-5',
                title: 'Database Assignment',
                description: 'SQL query optimization',
                priority: 'medium',
                category: 'Assignment',
                deadline: '2025-09-06T14:20:00.000Z',  // September 6, 2025 - Saturday
                createdAt: '2025-09-01T11:45:00.000Z',
                status: 'pending'
            }
        ];

        console.log('Returning demo tasks:', demoTasks);
        return demoTasks;
    }
}

// Render the complete schedule grid
function renderScheduleGrid() {
    console.log('Rendering schedule grid...');
    const scheduleGridContainer = document.querySelector('.divide-y.divide-dark-border');
    if (!scheduleGridContainer) {
        console.error('Schedule grid container not found');
        return;
    }

    // Create the hour rows (6 AM to 11 PM)
    scheduleGridContainer.innerHTML = '';

    for (let hour = 6; hour <= 23; hour++) {
        const hourRow = createHourRow(hour);
        scheduleGridContainer.appendChild(hourRow);
    }

    console.log('Grid structure created, adding data...');

    // Add schedule entries to the grid
    if (scheduleData && scheduleData.length > 0) {
        console.log('Adding schedule entries:', scheduleData.length);
        scheduleData.forEach(entry => addScheduleEntryToGrid(entry));
    }

    // Add tasks as schedule items
    if (tasksData && tasksData.length > 0) {
        console.log('Adding tasks to grid:', tasksData.length);
        tasksData.forEach(task => addTaskToGrid(task));
    }

    console.log('Schedule grid rendering complete');
}

// Create a row for a specific hour
function createHourRow(hour) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-8 divide-x divide-dark-border auto-rows-auto';
    row.setAttribute('data-hour', hour);
    row.style.minHeight = '80px'; // Increased minimum height

    // Time label
    const timeLabel = document.createElement('div');
    timeLabel.className = 'p-3 text-sm text-gray-400 bg-dark-bg flex items-start pt-4';
    timeLabel.textContent = formatHour(hour);
    row.appendChild(timeLabel);

    // 7 day cells
    for (let day = 0; day < 7; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'p-2 relative hover:bg-gray-800/20 transition-colors cursor-pointer flex flex-col space-y-1';
        dayCell.setAttribute('data-day', day);
        dayCell.setAttribute('data-hour', hour);
        dayCell.style.minHeight = '80px'; // Increased minimum height
        dayCell.style.overflow = 'visible'; // Allow content to overflow if needed

        // Add click handler for adding new entries
        dayCell.addEventListener('click', (e) => {
            // Only trigger if clicking on empty space
            if (e.target === dayCell) {
                const date = new Date(currentWeekStart);
                date.setDate(date.getDate() + day);
                openQuickAddModal(date, hour);
            }
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

    // Get priority color for the entry
    const priorityColors = {
        'high': 'red',
        'medium': 'yellow',
        'low': 'green'
    };

    const color = priorityColors[entry.priority] || 'blue';

    // Create schedule item element using flexible layout
    const scheduleItem = document.createElement('div');
    scheduleItem.className = `w-full bg-${color}-500/20 border border-${color}-500/50 rounded px-2 py-2 text-xs hover:bg-${color}-500/30 transition-colors cursor-pointer mb-1 flex-shrink-0 group`;
    scheduleItem.innerHTML = `
        <div class="font-medium text-${color}-400 text-xs leading-tight mb-1">${entry.title}</div>
        <div class="text-gray-400 text-xs flex items-center mb-1">
            <i class="fas fa-clock mr-1"></i>
            ${entry.startTime} - ${entry.endTime}
        </div>
        ${entry.description ? `<div class="text-gray-500 text-xs">${entry.description}</div>` : ''}
        <div class="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <button class="delete-btn text-red-400 hover:text-red-300 text-xs">
                <i class="fas fa-times mr-1"></i>Delete
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

    // Adjust cell height if needed
    const itemCount = dayCell.children.length;
    if (itemCount > 1) {
        dayCell.style.minHeight = `${80 + (itemCount - 1) * 40}px`;
        // Also adjust the parent row height
        const parentRow = dayCell.parentElement;
        if (parentRow) {
            parentRow.style.minHeight = `${80 + (itemCount - 1) * 40}px`;
        }
    }
}

// Add task to grid as a visual reminder
function addTaskToGrid(task) {
    console.log('Adding task to grid:', task.title, 'Deadline:', task.deadline);

    const taskDate = new Date(task.deadline);
    const dayIndex = getDayIndexFromDate(taskDate);

    console.log('Task date:', taskDate, 'Day index:', dayIndex);
    console.log('Current week start:', currentWeekStart);

    if (dayIndex === -1) {
        console.log('Task not in current week, skipping:', task.title);
        return; // Task not in current week
    }

    // Get the actual hour from the task deadline
    const taskHour = taskDate.getHours();
    console.log('Task actual hour from deadline:', taskHour);

    // Find the exact time slot for the task
    let targetHour = taskHour;

    // Ensure the hour is within our schedule grid (6 AM to 11 PM)
    if (targetHour < 6) {
        targetHour = 6; // Show early morning tasks at 6 AM
        console.log('Task is too early, showing at 6 AM instead');
    } else if (targetHour > 23) {
        targetHour = 23; // Show late night tasks at 11 PM
        console.log('Task is too late, showing at 11 PM instead');
    }

    console.log('Final target hour for task:', targetHour);

    // Find the appropriate cell for this exact time
    const hourRow = document.querySelector(`[data-hour="${targetHour}"]`);
    if (hourRow) {
        const dayCell = hourRow.querySelector(`[data-day="${dayIndex}"]`);
        if (dayCell) {
            // With flexbox layout, multiple tasks can coexist in the same cell
            console.log('Adding task to time slot at hour:', targetHour, 'day:', dayIndex);
            addTaskItemToCell(dayCell, task, targetHour);
        }
    }
}

// Add task item to a specific cell
function addTaskItemToCell(cell, task, hour, allowOverlap = false) {
    const priorityColors = {
        'high': 'red',
        'medium': 'yellow',
        'low': 'green'
    };

    const color = priorityColors[task.priority] || 'blue';
    const taskDate = new Date(task.deadline);
    const actualTime = formatTime(task.deadline);

    const taskItem = document.createElement('div');

    // Use flex layout instead of absolute positioning to prevent overlap
    taskItem.className = `w-full bg-${color}-500/20 border border-${color}-500/50 rounded px-2 py-2 text-xs hover:bg-${color}-500/30 transition-colors cursor-pointer mb-1 flex-shrink-0`;

    // Show task title and actual deadline time in a more readable format
    taskItem.innerHTML = `
        <div class="font-medium text-${color}-400 text-xs leading-tight mb-1" title="${task.title}">
            ${task.title}
        </div>
        <div class="text-xs text-gray-400 flex items-center">
            <i class="fas fa-clock mr-1"></i>
            ${actualTime}
        </div>
        <div class="text-xs text-gray-500 mt-1 capitalize">
            ${task.priority} priority
        </div>
    `;

    // Add click handler to view full task details
    taskItem.addEventListener('click', (e) => {
        e.stopPropagation();
        showTaskDetails(task);
    });

    // Add the task item to the cell (it will stack naturally with flexbox)
    cell.appendChild(taskItem);

    // Adjust cell height if needed
    const taskCount = cell.children.length;
    if (taskCount > 1) {
        cell.style.minHeight = `${80 + (taskCount - 1) * 40}px`;
        // Also adjust the parent row height
        const parentRow = cell.parentElement;
        if (parentRow) {
            parentRow.style.minHeight = `${80 + (taskCount - 1) * 40}px`;
        }
    }
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

        if (text.includes('study') || text.includes('learning')) {
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

    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    container.innerHTML = `
        <div class="space-y-3">
            ${Object.entries(distribution).map(([key, value]) => {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        const colors = {
            study: 'bg-blue-500',
            assignments: 'bg-yellow-500',
            projects: 'bg-purple-500',
            meetings: 'bg-green-500',
            free: 'bg-gray-500'
        };
        return `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-3 h-3 ${colors[key]} rounded-full"></div>
                            <span class="text-sm capitalize">${key}</span>
                        </div>
                        <div class="text-sm text-gray-400">${percentage}%</div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Update weekly tasks section
async function updateWeeklyTasks() {
    const container = document.getElementById('weeklyTasks');
    if (!container) return;

    const tasksByPriority = {
        high: tasksData.filter(task => task.priority === 'high'),
        medium: tasksData.filter(task => task.priority === 'medium'),
        low: tasksData.filter(task => task.priority === 'low')
    };

    container.innerHTML = `
        <div class="space-y-3">
            ${Object.entries(tasksByPriority).map(([priority, tasks]) => {
        const colors = {
            high: 'text-red-400',
            medium: 'text-yellow-400',
            low: 'text-green-400'
        };
        return `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-2 h-2 ${colors[priority].replace('text-', 'bg-')} rounded-full"></div>
                            <span class="text-sm capitalize ${colors[priority]}">${priority} Priority</span>
                        </div>
                        <div class="text-sm text-gray-400">${tasks.length}</div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Update schedule insights section
async function updateScheduleInsights() {
    const container = document.getElementById('scheduleInsights');
    if (!container) return;

    const insights = [];

    // Check for busy days
    const dailyTaskCounts = {};
    tasksData.forEach(task => {
        const day = new Date(task.deadline).toDateString();
        dailyTaskCounts[day] = (dailyTaskCounts[day] || 0) + 1;
    });

    const busiestDay = Object.entries(dailyTaskCounts).reduce((max, [day, count]) =>
        count > max.count ? { day, count } : max, { count: 0 });

    if (busiestDay.count > 2) {
        insights.push({
            type: 'warning',
            text: `${new Date(busiestDay.day).toLocaleDateString('en-US', { weekday: 'long' })} looks busy with ${busiestDay.count} tasks`
        });
    }

    // Check for high priority tasks
    const highPriorityTasks = tasksData.filter(task => task.priority === 'high');
    if (highPriorityTasks.length > 0) {
        insights.push({
            type: 'info',
            text: `You have ${highPriorityTasks.length} high priority task(s) this week`
        });
    }

    // Default insight if no specific insights
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            text: 'Your schedule looks balanced this week!'
        });
    }

    container.innerHTML = insights.map(insight => {
        const icons = {
            warning: 'fa-exclamation-triangle text-yellow-400',
            info: 'fa-info-circle text-blue-400',
            success: 'fa-check-circle text-green-400'
        };
        return `
            <div class="flex items-start space-x-3">
                <i class="fas ${icons[insight.type]} mt-0.5"></i>
                <span class="text-sm text-gray-300">${insight.text}</span>
            </div>
        `;
    }).join('');
}

// Show task details
function showTaskDetails(task) {
    console.log('Showing task details for:', task.title);

    const modal = document.getElementById('taskDetailsModal');
    if (!modal) {
        console.error('Task details modal not found');
        return;
    }

    // Get priority colors
    const priorityColors = {
        'high': { text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
        'medium': { text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' },
        'low': { text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' }
    };

    const colors = priorityColors[task.priority] || priorityColors['medium'];

    // Format deadline
    const taskDate = new Date(task.deadline);
    const formattedDate = formatDateTime(taskDate);

    // Update modal content
    document.getElementById('modalTaskTitle').textContent = task.title;
    document.getElementById('modalTaskDescription').textContent = task.description || 'No description provided';

    const priorityElement = document.getElementById('modalTaskPriority');
    priorityElement.innerHTML = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.badge} capitalize">${task.priority}</span>`;

    document.getElementById('modalTaskCategory').textContent = task.category || 'General';
    document.getElementById('modalTaskDeadline').textContent = formattedDate;

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Setup close handlers
    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // Close button handlers
    const closeBtn = document.getElementById('closeTaskModal');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }

    // Edit button handler
    document.getElementById('editTaskFromModal').onclick = () => {
        closeModal();
        // Could open edit task modal here if needed
        console.log('Edit task clicked for:', task.title);
    };

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

// Format time for display
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Format date and time for display
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const dateOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };

    return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

// Quick add modal handler
function openQuickAddModal(date, hour) {
    console.log('Quick add clicked for:', date, 'at hour:', hour);
    // Could implement quick add functionality here
}

// Error state display
function showErrorState(message) {
    const scheduleGridContainer = document.querySelector('.divide-y.divide-dark-border');
    if (scheduleGridContainer) {
        scheduleGridContainer.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center text-red-400">
                    <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                    <p class="text-lg">${message}</p>
                    <button onclick="loadScheduleData()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
}

// Switch view function
function switchView(view) {
    console.log('Switching to view:', view);

    // Update active button
    document.querySelectorAll('#dayView, #weekView, #monthView').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('text-gray-400');
    });

    const activeBtn = document.getElementById(view + 'View');
    if (activeBtn) {
        activeBtn.classList.add('bg-indigo-600', 'text-white');
        activeBtn.classList.remove('text-gray-400');
    }

    if (view === 'month') {
        showNotification('Month view coming soon!', 'info');
    } else if (view === 'day') {
        showNotification('Day view coming soon!', 'info');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 transform translate-x-full opacity-0';
        document.body.appendChild(notification);
    }

    // Set message and style based on type
    notification.textContent = message;
    notification.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 transform';

    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-black');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }

    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        notification.classList.remove('translate-x-0', 'opacity-100');
    }, 3000);
}
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
        minute: '2-digit',
        hour12: true  // Add AM/PM format
    });
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

// Placeholder functions for missing functionality
function editScheduleEntry(entry) {
    console.log('Edit schedule entry:', entry.title);

    const modal = document.getElementById('editScheduleModal');
    if (!modal) {
        console.error('Edit schedule modal not found');
        showNotification('Edit modal not found!', 'error');
        return;
    }

    // Store the current entry being edited
    window.currentEditingEntry = entry;

    // Populate the form with current values
    document.getElementById('editScheduleTitle').value = entry.title || '';
    document.getElementById('editScheduleDescription').value = entry.description || '';
    document.getElementById('editScheduleStartTime').value = entry.startTime || '';
    document.getElementById('editScheduleEndTime').value = entry.endTime || '';
    document.getElementById('editScheduleDate').value = entry.date || '';
    document.getElementById('editScheduleType').value = entry.type || 'other';

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Setup event listeners for this modal session
    setupEditScheduleEventListeners();
}

function setupEditScheduleEventListeners() {
    const modal = document.getElementById('editScheduleModal');

    // Close modal handlers
    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        window.currentEditingEntry = null;
    };

    // Remove any existing listeners to prevent duplicates
    const closeBtn = document.getElementById('closeEditScheduleModal');
    const cancelBtn = document.getElementById('cancelEditSchedule');
    const saveBtn = document.getElementById('saveScheduleChanges');

    // Close button
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Save changes button
    saveBtn.onclick = async () => {
        await saveScheduleChanges();
        closeModal();
    };

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Form validation
    const form = document.getElementById('editScheduleForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveScheduleChanges();
        closeModal();
    };
}

async function saveScheduleChanges() {
    const entry = window.currentEditingEntry;
    if (!entry) {
        showNotification('No entry selected for editing!', 'error');
        return;
    }

    // Get form values
    const title = document.getElementById('editScheduleTitle').value.trim();
    const description = document.getElementById('editScheduleDescription').value.trim();
    const startTime = document.getElementById('editScheduleStartTime').value;
    const endTime = document.getElementById('editScheduleEndTime').value;
    const date = document.getElementById('editScheduleDate').value;
    const type = document.getElementById('editScheduleType').value;

    // Validation
    if (!title || !startTime || !endTime || !date) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Validate time range
    if (startTime >= endTime) {
        showNotification('End time must be after start time!', 'error');
        return;
    }

    // Create updated entry
    const updatedEntry = {
        ...entry,
        title,
        description,
        startTime,
        endTime,
        date,
        type
    };

    try {
        // Try to update via API
        await updateScheduleEntryAPI(updatedEntry);

        // Update local data
        const index = scheduleData.findIndex(item => item.id === entry.id);
        if (index !== -1) {
            scheduleData[index] = updatedEntry;
        }

        // Re-render the schedule
        renderScheduleGrid();

        showNotification('Schedule entry updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating schedule entry:', error);

        // For demo purposes, update locally even if API fails
        const index = scheduleData.findIndex(item => item.id === entry.id);
        if (index !== -1) {
            scheduleData[index] = updatedEntry;
        }

        // Re-render the schedule
        renderScheduleGrid();

        showNotification('Schedule entry updated locally (API unavailable)', 'info');
    }
}

async function updateScheduleEntryAPI(entry) {
    try {
        const response = await apiCall(`/schedule/${entry.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });

        return response;
    } catch (error) {
        console.log('API update failed:', error.message);
        throw error;
    }
}

function deleteScheduleEntry(entry) {
    console.log('Delete schedule entry:', entry.title);
    showNotification('Schedule deletion coming soon!', 'info');
}

// Export Schedule Functionality
function exportSchedule() {
    try {
        // Create CSV content
        let csvContent = "Date,Time,Title,Description,Type,Priority\n";

        scheduleData.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString();
            const startTime = entry.startTime || '';
            const endTime = entry.endTime || '';
            const timeRange = startTime && endTime ? `${startTime}-${endTime}` : startTime;
            const title = entry.title || '';
            const description = (entry.description || '').replace(/"/g, '""');
            const type = entry.type || '';
            const priority = entry.priority || '';

            csvContent += `"${date}","${timeRange}","${title}","${description}","${type}","${priority}"\n`;
        });

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `schedule_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Schedule exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed. Please try again.', 'error');
    }
}

// Load Task Summary Data
async function loadTaskSummary() {
    try {
        const response = await apiCall('/tasks');
        const tasks = response.tasks || [];

        // Count tasks by type
        const counts = {
            assignments: 0,
            projects: 0,
            exams: 0
        };

        tasks.forEach(task => {
            const type = task.type?.toLowerCase() || '';
            if (type.includes('assignment')) {
                counts.assignments++;
            } else if (type.includes('project')) {
                counts.projects++;
            } else if (type.includes('exam') || type.includes('test')) {
                counts.exams++;
            }
        });

        // Update UI
        document.getElementById('assignmentCount').textContent = counts.assignments;
        document.getElementById('projectCount').textContent = counts.projects;
        document.getElementById('examCount').textContent = counts.exams;

    } catch (error) {
        console.log('Failed to load task summary, using sample data:', error.message);

        // Fallback to sample data
        document.getElementById('assignmentCount').textContent = '5';
        document.getElementById('projectCount').textContent = '2';
        document.getElementById('examCount').textContent = '1';
    }
}
