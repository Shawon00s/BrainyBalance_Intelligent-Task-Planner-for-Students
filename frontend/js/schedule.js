// Schedule Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!localStorage.getItem('userLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize schedule page
    initializeSchedulePage();
    setupEventListeners();
    loadSchedule();
    updateCurrentWeek();
});

let currentWeekStart = getWeekStart(new Date());

function initializeSchedulePage() {
    // Create default schedule if none exists
    const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
    if (schedule.length === 0) {
        createDefaultSchedule();
    }
}

function createDefaultSchedule() {
    const defaultSchedule = [
        {
            id: '1',
            title: 'Physics Study',
            description: 'Quantum Mechanics Review',
            startTime: '08:00',
            endTime: '10:00',
            day: 'tuesday',
            date: getDateForDay('tuesday'),
            type: 'study',
            color: 'blue'
        },
        {
            id: '2',
            title: 'Chemistry Lab',
            description: 'Organic Synthesis Experiment',
            startTime: '09:00',
            endTime: '11:00',
            day: 'monday',
            date: getDateForDay('monday'),
            type: 'class',
            color: 'green'
        },
        {
            id: '3',
            title: 'Math Assignment',
            description: 'Calculus Problem Set',
            startTime: '11:00',
            endTime: '13:00',
            day: 'wednesday',
            date: getDateForDay('wednesday'),
            type: 'assignment',
            color: 'purple'
        },
        {
            id: '4',
            title: 'Literature Reading',
            description: 'Shakespeare Analysis',
            startTime: '14:00',
            endTime: '15:30',
            day: 'thursday',
            date: getDateForDay('thursday'),
            type: 'study',
            color: 'yellow'
        },
        {
            id: '5',
            title: 'CS Project',
            description: 'Frontend Development',
            startTime: '13:00',
            endTime: '16:00',
            day: 'friday',
            date: getDateForDay('friday'),
            type: 'project',
            color: 'red'
        },
        {
            id: '6',
            title: 'Study Group',
            description: 'Physics Discussion',
            startTime: '15:00',
            endTime: '17:00',
            day: 'saturday',
            date: getDateForDay('saturday'),
            type: 'group',
            color: 'cyan'
        },
        {
            id: '7',
            title: 'Exercise',
            description: 'Gym Session',
            startTime: '17:00',
            endTime: '18:00',
            day: 'sunday',
            date: getDateForDay('sunday'),
            type: 'personal',
            color: 'orange'
        }
    ];

    localStorage.setItem('schedule', JSON.stringify(defaultSchedule));
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
    loadSchedule();
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

function loadSchedule() {
    const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');

    // Clear existing schedule items
    clearScheduleGrid();

    // Add schedule items to grid
    schedule.forEach(item => {
        addScheduleItemToGrid(item);
    });

    // Update statistics
    updateScheduleStats();
}

function clearScheduleGrid() {
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => item.remove());
}

function addScheduleItemToGrid(item) {
    const dayIndex = getDayIndex(item.day);
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    const duration = endHour - startHour;

    // Find the correct grid cell
    const timeRows = document.querySelectorAll('.grid-cols-8.divide-x.divide-dark-border.min-h-16');
    const hourRowIndex = startHour - 8; // Assuming schedule starts at 8 AM

    if (hourRowIndex >= 0 && hourRowIndex < timeRows.length) {
        const row = timeRows[hourRowIndex];
        const cells = row.querySelectorAll('.p-2');

        if (dayIndex < cells.length) {
            const cell = cells[dayIndex];

            const scheduleElement = document.createElement('div');
            scheduleElement.className = `schedule-item bg-${item.color}-500/20 border border-${item.color}-500/50 rounded p-2 text-xs cursor-pointer hover:bg-${item.color}-500/30 transition-colors`;
            scheduleElement.innerHTML = `
                <div class="font-medium text-${item.color}-400">${item.title}</div>
                <div class="text-gray-400">${item.startTime} - ${item.endTime}</div>
            `;

            // Add click event for editing
            scheduleElement.addEventListener('click', () => editScheduleItem(item));

            cell.appendChild(scheduleElement);
        }
    }
}

function editScheduleItem(item) {
    showNotification(`Editing ${item.title}`, 'info');
    // Here you could open an edit modal or inline editing
}

function generateOptimizedSchedule() {
    showNotification('Generating AI-optimized schedule...', 'info');

    // Simulate AI processing
    setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const pendingTasks = tasks.filter(task => task.status === 'pending');

        // Create optimized schedule based on tasks
        const optimizedSchedule = generateScheduleFromTasks(pendingTasks);

        // Merge with existing schedule
        const existingSchedule = JSON.parse(localStorage.getItem('schedule') || '[]');
        const newSchedule = [...existingSchedule, ...optimizedSchedule];

        localStorage.setItem('schedule', JSON.stringify(newSchedule));
        loadSchedule();

        showNotification(`Generated schedule with ${optimizedSchedule.length} new time blocks!`, 'success');
    }, 2000);
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
            date: getDateForDay(day),
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

function handleAddTimeBlock(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const timeBlock = {
        id: Date.now().toString(),
        day: formData.get('day'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        label: formData.get('label') || 'Available Time',
        type: 'available',
        color: 'gray'
    };

    // Validation
    if (!timeBlock.day || !timeBlock.startTime || !timeBlock.endTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (timeBlock.startTime >= timeBlock.endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    // Save time block
    const timeBlocks = JSON.parse(localStorage.getItem('timeBlocks') || '[]');
    timeBlocks.push(timeBlock);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));

    closeTimeBlockModalFunc();
    showNotification('Time block added successfully!', 'success');
}

function updateScheduleStats() {
    const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');

    // Calculate time distribution
    const timeDistribution = {
        study: 0,
        assignment: 0,
        project: 0,
        other: 0
    };

    schedule.forEach(item => {
        const duration = calculateDuration(item.startTime, item.endTime);
        if (item.type === 'study') {
            timeDistribution.study += duration;
        } else if (item.type === 'assignment') {
            timeDistribution.assignment += duration;
        } else if (item.type === 'project') {
            timeDistribution.project += duration;
        } else {
            timeDistribution.other += duration;
        }
    });

    // Update time distribution display
    updateTimeDistribution(timeDistribution);
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
