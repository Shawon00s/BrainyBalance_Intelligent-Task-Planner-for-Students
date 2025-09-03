// Pomodoro Timer JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in (check for auth tokens)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Pomodoro timer
    initializePomodoroTimer();
    setupEventListeners();
    loadUserProfile(); // Load user profile
    loadSettings();
    loadTodayStats();
    loadSessionHistory();

    // Check authentication before loading tasks
    if (isAuthenticated()) {
        loadUserTasks(); // Load tasks from database
    } else {
        console.log('User not authenticated, redirecting to login');
        window.location.href = 'login.html';
    }
});

// Timer state
let timerState = {
    isRunning: false,
    isPaused: false,
    currentSession: 'focus', // 'focus', 'shortBreak', 'longBreak'
    timeRemaining: 25 * 60, // 25 minutes in seconds
    sessionCount: 0,
    currentTask: null, // Will be loaded from database
    currentTaskId: null, // Task ID for database operations
    activePomodoroSession: null, // Current pomodoro session ID
    userTasks: [] // Array of user tasks from database
};

// Timer settings
let timerSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 30,
    sessionsUntilLongBreak: 4,
    notifications: {
        sound: true,
        browser: true,
        autoStartBreaks: false
    }
};

let timerInterval;

function initializePomodoroTimer() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        timerSettings = { ...timerSettings, ...JSON.parse(savedSettings) };
    }

    // Load timer state
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Only restore if the session was recent (within 1 hour)
        if (Date.now() - state.lastUpdate < 60 * 60 * 1000) {
            timerState = { ...timerState, ...state };
        }
    }

    updateTimerDisplay();
    updateSessionButtons();

    // Load user tasks from database
    loadUserTasks();

    // Check for active Pomodoro session
    checkActiveSession();
}


function setupEventListeners() {
    // Session type buttons
    const focusBtn = document.getElementById('focusBtn');
    const shortBreakBtn = document.getElementById('shortBreakBtn');
    const longBreakBtn = document.getElementById('longBreakBtn');

    if (focusBtn) focusBtn.addEventListener('click', () => switchSession('focus'));
    if (shortBreakBtn) shortBreakBtn.addEventListener('click', () => switchSession('shortBreak'));
    if (longBreakBtn) longBreakBtn.addEventListener('click', () => switchSession('longBreak'));

    // Control buttons
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    // Task selection
    const selectTaskBtn = document.getElementById('selectTaskBtn');
    const refreshTasksBtn = document.getElementById('refreshTasksBtn');

    console.log('selectTaskBtn found:', selectTaskBtn); // Debug log

    if (selectTaskBtn) {
        selectTaskBtn.addEventListener('click', function (e) {
            console.log('Select Task button clicked!'); // Debug log
            e.preventDefault();
            openTaskSelectionModal();
        });
    } else {
        console.error('selectTaskBtn element not found!');
    }

    if (refreshTasksBtn) refreshTasksBtn.addEventListener('click', loadUserTasks);

    // Modal controls
    const closeTaskModal = document.getElementById('closeTaskModal');
    const cancelTaskSelection = document.getElementById('cancelTaskSelection');
    const confirmTaskSelection = document.getElementById('confirmTaskSelection');
    const taskSelectionModal = document.getElementById('taskSelectionModal');

    if (closeTaskModal) closeTaskModal.addEventListener('click', closeTaskSelectionModalFunc);
    if (cancelTaskSelection) cancelTaskSelection.addEventListener('click', closeTaskSelectionModalFunc);
    if (confirmTaskSelection) {
        confirmTaskSelection.addEventListener('click', (e) => {
            console.log('Confirm button clicked!'); // Debug log
            confirmTaskSelectionFunc();
        });
    }
    if (taskSelectionModal) {
        taskSelectionModal.addEventListener('click', (e) => {
            if (e.target === taskSelectionModal) closeTaskSelectionModalFunc();
        });
    }

    // Task option selection - multiple event handlers for reliability
    document.addEventListener('click', (e) => {
        if (e.target.closest('.task-option')) {
            e.preventDefault();
            e.stopPropagation();
            selectTaskOption(e.target.closest('.task-option'));
        }
    });

    // Additional event handler specifically for the modal container
    document.addEventListener('click', (e) => {
        const taskOption = e.target.closest('#taskListContainer .task-option');
        if (taskOption) {
            e.preventDefault();
            e.stopPropagation();
            selectTaskOption(taskOption);
        }
    });

    // Settings sliders
    setupSettingsListeners();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function setupSettingsListeners() {
    // Duration sliders
    const focusDurationSlider = document.getElementById('focusDuration');
    const shortBreakSlider = document.getElementById('shortBreakDuration');
    const longBreakSlider = document.getElementById('longBreakDuration');
    const sessionsSlider = document.getElementById('sessionsUntilLongBreak');

    if (focusDurationSlider) {
        focusDurationSlider.addEventListener('input', (e) => {
            timerSettings.focusDuration = parseInt(e.target.value);
            document.getElementById('focusValue').textContent = `${e.target.value} min`;
            if (timerState.currentSession === 'focus') {
                resetTimer();
            }
            saveSettings();
        });
    }

    if (shortBreakSlider) {
        shortBreakSlider.addEventListener('input', (e) => {
            timerSettings.shortBreakDuration = parseInt(e.target.value);
            document.getElementById('shortBreakValue').textContent = `${e.target.value} min`;
            if (timerState.currentSession === 'shortBreak') {
                resetTimer();
            }
            saveSettings();
        });
    }

    if (longBreakSlider) {
        longBreakSlider.addEventListener('input', (e) => {
            timerSettings.longBreakDuration = parseInt(e.target.value);
            document.getElementById('longBreakValue').textContent = `${e.target.value} min`;
            if (timerState.currentSession === 'longBreak') {
                resetTimer();
            }
            saveSettings();
        });
    }

    if (sessionsSlider) {
        sessionsSlider.addEventListener('input', (e) => {
            timerSettings.sessionsUntilLongBreak = parseInt(e.target.value);
            document.getElementById('sessionsValue').textContent = e.target.value;
            saveSettings();
        });
    }

    // Notification checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            // Handle notification settings
            if (e.target.parentNode.textContent.includes('notification sound')) {
                timerSettings.notifications.sound = e.target.checked;
            } else if (e.target.parentNode.textContent.includes('browser notifications')) {
                timerSettings.notifications.browser = e.target.checked;
            } else if (e.target.parentNode.textContent.includes('Auto-start breaks')) {
                timerSettings.notifications.autoStartBreaks = e.target.checked;
            }
            saveSettings();
        });
    });
}

function loadSettings() {
    // Update slider values
    const focusDurationSlider = document.getElementById('focusDuration');
    const shortBreakSlider = document.getElementById('shortBreakDuration');
    const longBreakSlider = document.getElementById('longBreakDuration');
    const sessionsSlider = document.getElementById('sessionsUntilLongBreak');

    if (focusDurationSlider) {
        focusDurationSlider.value = timerSettings.focusDuration;
        document.getElementById('focusValue').textContent = `${timerSettings.focusDuration} min`;
    }

    if (shortBreakSlider) {
        shortBreakSlider.value = timerSettings.shortBreakDuration;
        document.getElementById('shortBreakValue').textContent = `${timerSettings.shortBreakDuration} min`;
    }

    if (longBreakSlider) {
        longBreakSlider.value = timerSettings.longBreakDuration;
        document.getElementById('longBreakValue').textContent = `${timerSettings.longBreakDuration} min`;
    }

    if (sessionsSlider) {
        sessionsSlider.value = timerSettings.sessionsUntilLongBreak;
        document.getElementById('sessionsValue').textContent = timerSettings.sessionsUntilLongBreak;
    }

    // Update current task display
    updateCurrentTaskDisplay();
}

function switchSession(sessionType) {
    if (timerState.isRunning) {
        pauseTimer();
    }

    timerState.currentSession = sessionType;

    // Set duration based on session type
    switch (sessionType) {
        case 'focus':
            timerState.timeRemaining = timerSettings.focusDuration * 60;
            break;
        case 'shortBreak':
            timerState.timeRemaining = timerSettings.shortBreakDuration * 60;
            break;
        case 'longBreak':
            timerState.timeRemaining = timerSettings.longBreakDuration * 60;
            break;
    }

    updateTimerDisplay();
    updateSessionButtons();
    updateProgressCircle();
    saveTimerState();
}

function updateSessionButtons() {
    const buttons = {
        focus: document.getElementById('focusBtn'),
        shortBreak: document.getElementById('shortBreakBtn'),
        longBreak: document.getElementById('longBreakBtn')
    };

    // Reset all buttons
    Object.values(buttons).forEach(btn => {
        if (btn) {
            btn.classList.remove('bg-gradient-to-r', 'from-red-500', 'to-pink-600', 'text-white');
            btn.classList.add('text-gray-400');
        }
    });

    // Highlight active button
    const activeButton = buttons[timerState.currentSession];
    if (activeButton) {
        activeButton.classList.add('bg-gradient-to-r', 'from-red-500', 'to-pink-600', 'text-white');
        activeButton.classList.remove('text-gray-400');
    }

    // Update session label
    const sessionLabel = document.getElementById('sessionLabel');
    if (sessionLabel) {
        const labels = {
            focus: 'Focus Session',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        sessionLabel.textContent = labels[timerState.currentSession];
    }
}

async function startTimer() {
    if (timerState.isPaused) {
        // Resume timer
        timerState.isPaused = false;

        // Resume the Pomodoro session in the database if there's an active session
        if (timerState.activePomodoroSession?.id) {
            try {
                await resumePomodoroSession(timerState.activePomodoroSession.id);
            } catch (error) {
                console.error('Failed to resume Pomodoro session in database:', error);
            }
        }
    } else {
        // Start new timer
        timerState.isRunning = true;

        // Start a new Pomodoro session in the database if it's a focus session
        if (timerState.currentSession === 'focus' && timerState.currentTaskId) {
            try {
                const sessionData = await startPomodoroSession(timerState.currentTaskId, timerSettings.focusDuration);
                // Store session with proper ID structure from backend response
                timerState.activePomodoroSession = {
                    id: sessionData.session._id,
                    session: sessionData.session,
                    currentInterval: sessionData.currentInterval
                };
                console.log('Active Pomodoro session set:', timerState.activePomodoroSession);
            } catch (error) {
                console.error('Failed to start Pomodoro session in database:', error);
                showNotification('Warning: Session not saved to database', 'warning');
            }
        }
    }

    // Update button visibility
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (startBtn) startBtn.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');

    // Start countdown
    timerInterval = setInterval(() => {
        timerState.timeRemaining--;
        updateTimerDisplay();
        updateProgressCircle();

        if (timerState.timeRemaining <= 0) {
            timerComplete();
        }

        saveTimerState();
    }, 1000);

    saveTimerState();
}

function pauseTimer() {
    timerState.isPaused = true;
    clearInterval(timerInterval);

    // Pause the Pomodoro session in the database if there's an active session
    if (timerState.activePomodoroSession?.id) {
        pausePomodoroSession(timerState.activePomodoroSession.id)
            .catch(error => {
                console.error('Failed to pause Pomodoro session in database:', error);
            });
    }

    // Update button visibility
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');

    saveTimerState();
}

function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    clearInterval(timerInterval);

    // Reset time based on current session
    switchSession(timerState.currentSession);

    // Update button visibility
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');

    updateTimerDisplay();
    updateProgressCircle();
    saveTimerState();
}

async function timerComplete() {
    clearInterval(timerInterval);
    timerState.isRunning = false;
    timerState.isPaused = false;

    // Update button visibility
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');

    // Send notifications
    if (timerSettings.notifications.sound) {
        playNotificationSound();
    }

    if (timerSettings.notifications.browser && Notification.permission === 'granted') {
        const sessionNames = {
            focus: 'Focus session',
            shortBreak: 'Short break',
            longBreak: 'Long break'
        };

        new Notification('BrainyBalance Timer', {
            body: `${sessionNames[timerState.currentSession]} completed!`,
            icon: '/favicon.ico'
        });
    }

    // Show completion notification and handle database operations
    if (timerState.currentSession === 'focus') {
        showNotification('Focus session completed! Great job!', 'success');
        timerState.sessionCount++;

        // Complete the Pomodoro session in the database
        if (timerState.activePomodoroSession) {
            try {
                await completePomodoroSession(timerState.activePomodoroSession.id);
                await savePomodoroInterval(
                    timerState.activePomodoroSession.id,
                    'work',
                    timerSettings.focusDuration
                );
                timerState.activePomodoroSession = null;
            } catch (error) {
                console.error('Failed to complete Pomodoro session in database:', error);
                showNotification('Warning: Session completion not saved to database', 'warning');
            }
        }

        // Record session (fallback to localStorage)
        recordPomodoroSession();

        // Auto-suggest break
        if (timerState.sessionCount % timerSettings.sessionsUntilLongBreak === 0) {
            if (timerSettings.notifications.autoStartBreaks) {
                switchSession('longBreak');
                startTimer();
            } else {
                showNotification('Time for a long break!', 'info');
                switchSession('longBreak');
            }
        } else {
            if (timerSettings.notifications.autoStartBreaks) {
                switchSession('shortBreak');
                startTimer();
            } else {
                showNotification('Time for a short break!', 'info');
                switchSession('shortBreak');
            }
        }
    } else {
        // Handle break completion - save break intervals if we have an active session
        if (timerState.activePomodoroSession) {
            try {
                const breakType = timerState.currentSession === 'longBreak' ? 'long_break' : 'short_break';
                const breakDuration = timerState.currentSession === 'longBreak' ?
                    timerSettings.longBreakDuration : timerSettings.shortBreakDuration;

                await savePomodoroInterval(
                    timerState.activePomodoroSession.id,
                    breakType,
                    breakDuration
                );
            } catch (error) {
                console.error('Failed to save break interval to database:', error);
                showNotification('Warning: Break time not saved to database', 'warning');
            }
        }

        showNotification('Break completed! Ready to focus?', 'info');
        if (timerSettings.notifications.autoStartBreaks) {
            switchSession('focus');
            startTimer();
        } else {
            switchSession('focus');
        }
    }

    // Show toast notification
    showToastNotification();

    saveTimerState();
    loadTodayStats();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerState.timeRemaining / 60);
    const seconds = timerState.timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = display;
    }

    // Update document title
    document.title = `${display} - BrainyBalance Pomodoro`;
}

function updateProgressCircle() {
    const progressCircle = document.getElementById('progressCircle');
    if (!progressCircle) return;

    let totalTime;
    switch (timerState.currentSession) {
        case 'focus':
            totalTime = timerSettings.focusDuration * 60;
            break;
        case 'shortBreak':
            totalTime = timerSettings.shortBreakDuration * 60;
            break;
        case 'longBreak':
            totalTime = timerSettings.longBreakDuration * 60;
            break;
    }

    const progress = (totalTime - timerState.timeRemaining) / totalTime;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (progress * circumference);

    progressCircle.style.strokeDashoffset = offset;
}

// Make functions globally available for onclick handlers
window.openTaskSelectionModal = openTaskSelectionModal;
window.closeTaskSelectionModalFunc = closeTaskSelectionModalFunc;
window.handleTaskClick = handleTaskClick;

function openTaskSelectionModal() {
    console.log('openTaskSelectionModal called'); // Debug log

    // Reset selection state
    timerState.selectedTaskId = null;
    timerState.selectedTask = null;

    const modal = document.getElementById('taskSelectionModal');
    console.log('Modal element found:', modal); // Debug log

    if (modal) {
        console.log('Modal classes before:', modal.className); // Debug log
        modal.classList.remove('hidden');
        console.log('Modal classes after:', modal.className); // Debug log
        loadTaskOptions();
        console.log('Modal opened and loadTaskOptions called'); // Debug log
    } else {
        console.error('Task selection modal not found!');
    }
}

function closeTaskSelectionModalFunc() {
    const modal = document.getElementById('taskSelectionModal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear selections
        document.querySelectorAll('.task-option').forEach(option => {
            option.classList.remove('bg-indigo-600');
        });
    }
}

function loadTaskOptions() {
    // Use the tasks loaded from database
    const pendingTasks = (timerState.userTasks || []).filter(task => task.status === 'pending');

    console.log('Loading task options, pending tasks:', pendingTasks); // Debug log

    const modalTaskList = document.getElementById('taskListContainer');
    if (modalTaskList) {
        if (pendingTasks.length > 0) {
            modalTaskList.innerHTML = pendingTasks.map((task, index) => {
                console.log('Processing task:', task); // Debug individual task
                const priorityColors = { high: 'red', medium: 'yellow', low: 'green' };
                const color = priorityColors[task.priority] || 'blue';

                // Handle date formatting safely
                let dueDateText = 'No due date';
                try {
                    if (task.deadline || task.dueDate) {
                        const dateField = task.deadline || task.dueDate;
                        const taskDate = new Date(dateField);
                        if (!isNaN(taskDate.getTime())) {
                            dueDateText = formatDueDate(taskDate);
                        }
                    }
                } catch (error) {
                    console.error('Error formatting date for task:', task.title, error);
                }

                return `
                    <div class="task-option p-3 bg-dark-bg hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border border-gray-600" 
                         data-task-id="${task._id}" 
                         data-task="${task.title}"
                         onclick="handleTaskClick('${task._id}', '${task.title.replace(/'/g, "\\'")}'); return false;">
                        <div class="flex items-center space-x-3">
                            <div class="w-3 h-3 bg-${color}-500 rounded-full"></div>
                            <span class="text-white">${task.title}</span>
                        </div>
                        <p class="text-gray-400 text-sm ml-6">${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'} Priority • ${dueDateText}</p>
                    </div>
                `;
            }).join('');

            console.log('Task list HTML generated, length:', modalTaskList.innerHTML.length); // Debug log
        } else {
            modalTaskList.innerHTML = `
                <div class="text-center py-6">
                    <p class="text-gray-400">No pending tasks found</p>
                    <p class="text-sm text-gray-500 mt-2">Create some tasks first to use with Pomodoro sessions</p>
                    <a href="tasks.html" class="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                        Go to Tasks
                    </a>
                </div>
            `;
        }
    } else {
        console.error('Task list container not found!');
    }
}

// Direct task click handler to bypass event delegation issues
function handleTaskClick(taskId, taskTitle) {
    console.log('handleTaskClick called directly:', { taskId, taskTitle }); // Debug log

    // Clear previous selections
    document.querySelectorAll('.task-option').forEach(opt => {
        opt.classList.remove('bg-indigo-600', 'ring-2', 'ring-indigo-500');
    });

    // Find and select the clicked task
    const clickedTask = document.querySelector(`[data-task-id="${taskId}"]`);
    if (clickedTask) {
        clickedTask.classList.add('bg-indigo-600', 'ring-2', 'ring-indigo-500');
        console.log('Visual selection applied to task element'); // Debug log
    }

    // Store selection
    timerState.selectedTaskId = taskId;
    timerState.selectedTask = taskTitle;

    console.log('Task selection stored:', {
        selectedTaskId: timerState.selectedTaskId,
        selectedTask: timerState.selectedTask
    }); // Debug log
}

function selectTaskOption(option) {
    console.log('selectTaskOption called with:', option); // Debug log
    console.log('Option dataset:', option.dataset); // Debug dataset

    // Clear previous selections
    document.querySelectorAll('.task-option').forEach(opt => {
        opt.classList.remove('bg-indigo-600', 'ring-2', 'ring-indigo-500');
    });

    // Select current option with visual feedback
    option.classList.add('bg-indigo-600', 'ring-2', 'ring-indigo-500');

    // Store selected task ID and name
    const taskId = option.dataset.taskId || option.getAttribute('data-task-id');
    const taskName = option.dataset.task || option.getAttribute('data-task');

    console.log('Selected task:', { taskId, taskName }); // Debug log

    if (taskId && taskName) {
        timerState.selectedTaskId = taskId;
        timerState.selectedTask = taskName;
        console.log('Task selection stored successfully'); // Debug log
    } else {
        console.error('Failed to get task data from option:', option);
    }
}

function confirmTaskSelectionFunc() {
    console.log('confirmTaskSelectionFunc called, current state:', {
        selectedTask: timerState.selectedTask,
        selectedTaskId: timerState.selectedTaskId
    }); // Debug log

    if (timerState.selectedTask && timerState.selectedTaskId) {
        // Update current task
        timerState.currentTask = timerState.selectedTask;
        timerState.currentTaskId = timerState.selectedTaskId;

        console.log('Task confirmed, updating display:', {
            currentTask: timerState.currentTask,
            currentTaskId: timerState.currentTaskId
        }); // Debug log

        updateCurrentTaskDisplay();
        closeTaskSelectionModalFunc();
        showNotification(`Selected task: ${timerState.currentTask}`, 'success');
        saveTimerState();

        // Clear selection state
        timerState.selectedTask = null;
        timerState.selectedTaskId = null;

        console.log('Task selection completed successfully'); // Debug log
    } else {
        console.log('No task selected, showing error'); // Debug log
        showNotification('Please select a task first', 'error');
    }
}

function updateCurrentTaskDisplay() {
    console.log('updateCurrentTaskDisplay called with task:', timerState.currentTask); // Debug log

    const currentTaskElement = document.querySelector('#currentTask span');
    if (currentTaskElement) {
        currentTaskElement.textContent = timerState.currentTask || 'No task selected';
        console.log('Updated task display to:', timerState.currentTask); // Debug log
    } else {
        console.error('Current task element not found!');
    }
}

function recordPomodoroSession() {
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');

    const session = {
        id: Date.now().toString(),
        task: timerState.currentTask,
        duration: timerSettings.focusDuration,
        completedAt: new Date().toISOString(),
        type: 'focus'
    };

    sessions.push(session);

    // Keep only last 50 sessions
    if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
    }

    localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
}

function loadTodayStats() {
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');
    const today = new Date().toDateString();

    const todaySessions = sessions.filter(session =>
        new Date(session.completedAt).toDateString() === today
    );

    // Update stats
    const pomodoroCount = todaySessions.length;
    const focusTime = pomodoroCount * timerSettings.focusDuration / 60; // in hours

    // Update UI
    updateStatValue('Pomodoros', pomodoroCount);
    updateStatValue('Focus Time', `${focusTime.toFixed(1)}h`);

    // Simulate other stats
    updateStatValue('Tasks Done', Math.min(pomodoroCount, 6));
    updateStatValue('Efficiency', `${Math.min(92, 75 + pomodoroCount * 2)}%`);
}

function updateStatValue(label, value) {
    const statCards = document.querySelectorAll('.bg-dark-bg.rounded-lg.p-4.text-center');
    statCards.forEach(card => {
        const labelElement = card.querySelector('.text-gray-400');
        if (labelElement && labelElement.textContent === label) {
            const valueElement = card.querySelector('.text-2xl');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    });
}

function loadSessionHistory() {
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');
    const recentSessions = sessions.slice(-3).reverse();

    const historyContainer = document.querySelector('.space-y-3:has(.bg-dark-bg.rounded-lg)');
    if (historyContainer && recentSessions.length > 0) {
        historyContainer.innerHTML = recentSessions.map(session => {
            const colors = ['red', 'green', 'blue', 'purple', 'yellow'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return `
                <div class="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-${color}-500 rounded-full"></div>
                        <span class="text-gray-300">${session.task}</span>
                    </div>
                    <span class="text-gray-400 text-sm">${session.duration} min</span>
                </div>
            `;
        }).join('');
    }
}

function playNotificationSound() {
    // Create audio context for notification sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

function showToastNotification() {
    const toast = document.getElementById('notificationToast');
    if (toast) {
        toast.classList.remove('translate-x-full');

        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 3000);
    }
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(timerSettings));
}

function saveTimerState() {
    const stateToSave = {
        ...timerState,
        lastUpdate: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
}

function formatDueDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
        return 'Due today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
        return 'Due tomorrow';
    } else {
        return `Due ${date.toLocaleDateString()}`;
    }
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

// ===== DATABASE INTEGRATION FUNCTIONS =====

// Load user tasks from database
// Load user's tasks from the database
async function loadUserTasks() {
    try {
        console.log('Loading user tasks...'); // Debug log

        // Check if authenticated first
        if (!isAuthenticated()) {
            console.log('User not authenticated');
            return;
        }

        const response = await apiCall('/tasks');
        console.log('API response:', response); // Debug log

        const tasks = response.tasks || response; // Handle both response formats

        // Filter for active tasks (not completed)
        timerState.userTasks = tasks.filter(task =>
            task.status !== 'completed' && task.status !== 'cancelled'
        );

        console.log('Loaded tasks:', timerState.userTasks); // Debug log

        // If no current task selected, select the first available task
        if (!timerState.currentTask && timerState.userTasks.length > 0) {
            const firstTask = timerState.userTasks[0];
            timerState.currentTask = firstTask.title;
            timerState.currentTaskId = firstTask._id;
            console.log('Auto-selected first task:', firstTask.title);
        }

        updateCurrentTaskDisplay();
        updateTaskSelectionModal();

    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks from database. Please check if you are logged in.', 'error');

        // Fallback: Initialize empty task array
        if (!timerState.userTasks || timerState.userTasks.length === 0) {
            timerState.userTasks = [];
            timerState.currentTask = 'No task selected - Focus Session';
            timerState.currentTaskId = null;
            updateCurrentTaskDisplay();
        }
    }
}

// Start a new Pomodoro session in the database
async function startPomodoroSession(taskId, duration) {
    try {
        const sessionData = {
            taskId: taskId,
            workDuration: duration,
            shortBreak: timerSettings.shortBreakDuration,
            longBreak: timerSettings.longBreakDuration
        };

        const response = await apiCall('/pomodoro/sessions/start', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });

        console.log('Pomodoro session started:', response);
        return response;

    } catch (error) {
        console.error('Error starting Pomodoro session:', error);
        throw error;
    }
}

// Complete a Pomodoro session in the database
async function completePomodoroSession(sessionId) {
    if (!sessionId) return;

    try {
        const response = await apiCall(`/pomodoro/sessions/${sessionId}/end`, {
            method: 'PUT'
        });

        console.log('Pomodoro session completed:', response);

        // Reset session ID
        timerState.activePomodoroSession = null;

    } catch (error) {
        console.error('Error completing Pomodoro session:', error);
        throw error;
    }
}

// Save Pomodoro interval to database (transition to next interval)
async function savePomodoroInterval(sessionId, type, duration, completed = true) {
    if (!sessionId) return;

    try {
        const intervalData = {
            workDuration: duration,
            shortBreak: timerSettings.shortBreakDuration,
            longBreak: timerSettings.longBreakDuration
        };

        const response = await apiCall(`/pomodoro/sessions/${sessionId}/next-interval`, {
            method: 'POST',
            body: JSON.stringify(intervalData)
        });

        console.log('Pomodoro interval transitioned:', response);
        return response;

    } catch (error) {
        console.error('Error transitioning Pomodoro interval:', error);
        throw error;
    }
}

// Pause a Pomodoro session in the database
async function pausePomodoroSession(sessionId) {
    if (!sessionId) return;

    try {
        const response = await apiCall(`/pomodoro/sessions/${sessionId}/pause`, {
            method: 'PUT'
        });

        console.log('Pomodoro session paused:', response);

    } catch (error) {
        console.error('Error pausing Pomodoro session:', error);
        throw error;
    }
}

// Resume a Pomodoro session in the database
async function resumePomodoroSession(sessionId) {
    if (!sessionId) return;

    try {
        const response = await apiCall(`/pomodoro/sessions/${sessionId}/resume`, {
            method: 'PUT'
        });

        console.log('Pomodoro session resumed:', response);

    } catch (error) {
        console.error('Error resuming Pomodoro session:', error);
        throw error;
    }
}

// Check for active Pomodoro session on page load
async function checkActiveSession() {
    try {
        const response = await apiCall('/pomodoro/active', {
            method: 'GET'
        });

        if (response.activeSession) {
            timerState.activePomodoroSession = {
                id: response.activeSession._id,
                session: response.activeSession,
                currentInterval: response.currentInterval
            };

            // Update UI if there's an active session
            if (response.activeSession.taskId) {
                timerState.currentTaskId = response.activeSession.taskId._id;
                timerState.currentTask = response.activeSession.taskId.title;
                updateCurrentTaskDisplay();
            }

            console.log('Restored active Pomodoro session:', timerState.activePomodoroSession);
        }
    } catch (error) {
        console.error('Error checking for active session:', error);
    }
}

// Update task selection modal with real tasks
function updateTaskSelectionModal() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    if (timerState.userTasks.length === 0) {
        taskList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-tasks text-gray-400 text-3xl mb-4"></i>
                <p class="text-gray-400 mb-4">No active tasks found</p>
                <a href="tasks.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg inline-block">
                    Create Your First Task
                </a>
            </div>
        `;
        return;
    }

    taskList.innerHTML = timerState.userTasks.map(task => {
        const priorityColor = getPriorityColor(task.priority);
        const isSelected = task._id === timerState.currentTaskId;

        return `
            <div class="task-option p-4 bg-dark-card rounded-lg cursor-pointer transition-all hover:bg-gray-600 ${isSelected ? 'ring-2 ring-indigo-500' : ''}" 
                 data-task-id="${task._id}" 
                 data-task-title="${task.title}"
                 onclick="selectTaskFromModal('${task._id}', '${task.title}')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 ${priorityColor} rounded-full"></div>
                        <div>
                            <h4 class="text-white font-medium">${task.title}</h4>
                            <p class="text-gray-400 text-sm">${task.category || 'General'}</p>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        ${task.priority || 'medium'}
                    </div>
                </div>
                ${task.description ? `<p class="text-gray-300 text-sm mt-2">${task.description}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Get priority color class
function getPriorityColor(priority) {
    switch (priority) {
        case 'urgent': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-blue-500';
    }
}

// Select task from modal
function selectTaskFromModal(taskId, taskTitle) {
    timerState.currentTaskId = taskId;
    timerState.currentTask = taskTitle;

    // Update visual selection
    document.querySelectorAll('.task-option').forEach(option => {
        option.classList.remove('ring-2', 'ring-indigo-500');
    });

    const selectedOption = document.querySelector(`[data-task-id="${taskId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('ring-2', 'ring-indigo-500');
    }

    updateCurrentTaskDisplay();
}
