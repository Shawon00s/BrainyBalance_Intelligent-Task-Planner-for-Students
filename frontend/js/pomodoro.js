// Pomodoro Timer JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!localStorage.getItem('userLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Pomodoro timer
    initializePomodoroTimer();
    setupEventListeners();
    loadSettings();
    loadTodayStats();
    loadSessionHistory();
});

// Timer state
let timerState = {
    isRunning: false,
    isPaused: false,
    currentSession: 'focus', // 'focus', 'shortBreak', 'longBreak'
    timeRemaining: 25 * 60, // 25 minutes in seconds
    sessionCount: 0,
    currentTask: 'Mathematics Assignment - Calculus Problems'
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
    if (selectTaskBtn) selectTaskBtn.addEventListener('click', openTaskSelectionModal);

    // Modal controls
    const closeTaskModal = document.getElementById('closeTaskModal');
    const cancelTaskSelection = document.getElementById('cancelTaskSelection');
    const confirmTaskSelection = document.getElementById('confirmTaskSelection');
    const taskSelectionModal = document.getElementById('taskSelectionModal');

    if (closeTaskModal) closeTaskModal.addEventListener('click', closeTaskSelectionModalFunc);
    if (cancelTaskSelection) cancelTaskSelection.addEventListener('click', closeTaskSelectionModalFunc);
    if (confirmTaskSelection) confirmTaskSelection.addEventListener('click', confirmTaskSelectionFunc);
    if (taskSelectionModal) {
        taskSelectionModal.addEventListener('click', (e) => {
            if (e.target === taskSelectionModal) closeTaskSelectionModalFunc();
        });
    }

    // Task option selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.task-option')) {
            selectTaskOption(e.target.closest('.task-option'));
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

function startTimer() {
    if (timerState.isPaused) {
        // Resume timer
        timerState.isPaused = false;
    } else {
        // Start new timer
        timerState.isRunning = true;
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

function timerComplete() {
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

    // Show completion notification
    if (timerState.currentSession === 'focus') {
        showNotification('Focus session completed! Great job!', 'success');
        timerState.sessionCount++;

        // Record session
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

function openTaskSelectionModal() {
    const modal = document.getElementById('taskSelectionModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadTaskOptions();
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
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const pendingTasks = tasks.filter(task => task.status === 'pending');

    const modalTaskList = document.querySelector('#taskSelectionModal .space-y-3');
    if (modalTaskList && pendingTasks.length > 0) {
        modalTaskList.innerHTML = pendingTasks.map(task => {
            const priorityColors = { high: 'red', medium: 'yellow', low: 'green' };
            const color = priorityColors[task.priority] || 'blue';

            return `
                <div class="task-option p-3 bg-dark-bg hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" data-task="${task.title}">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-${color}-500 rounded-full"></div>
                        <span class="text-white">${task.title}</span>
                    </div>
                    <p class="text-gray-400 text-sm ml-6">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority • ${formatDueDate(new Date(task.dueDate))}</p>
                </div>
            `;
        }).join('');
    }
}

function selectTaskOption(option) {
    // Clear previous selections
    document.querySelectorAll('.task-option').forEach(opt => {
        opt.classList.remove('bg-indigo-600');
    });

    // Select current option
    option.classList.add('bg-indigo-600');

    // Store selected task
    const taskName = option.dataset.task;
    timerState.selectedTask = taskName;
}

function confirmTaskSelectionFunc() {
    if (timerState.selectedTask) {
        timerState.currentTask = timerState.selectedTask;
        updateCurrentTaskDisplay();
        closeTaskSelectionModalFunc();
        showNotification(`Selected task: ${timerState.currentTask}`, 'success');
        saveTimerState();
    } else {
        showNotification('Please select a task first', 'error');
    }
}

function updateCurrentTaskDisplay() {
    const currentTaskElement = document.querySelector('#currentTask span');
    if (currentTaskElement) {
        currentTaskElement.textContent = timerState.currentTask;
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
