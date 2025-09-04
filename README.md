# BrainyBalance - Intelligent Task Planner for Students

A comprehensive full-stack web application designed to help students manage their tasks, track productivity, and optimize their study schedule using AI-powered intelligent features and advanced time management tools.

## ✨ Key Features

### 🔐 **Authentication & User Management**
- Secure JWT-based authentication system
- User registration with email verification (OTP)
- Profile management with customizable preferences
- Password hashing with bcryptjs for security

### 📋 **Advanced Task Management**
- Create, edit, and organize tasks with priorities (low, medium, high, urgent)
- Task status tracking (pending, in-progress, completed, cancelled)
- Category-based task organization
- Deadline management with visual indicators
- Bulk task operations and filtering

### 🎯 **Smart Dashboard**
- Real-time analytics and productivity insights
- Today's Tasks (filtered by current date)
- Overdue Tasks tracking with alerts
- Upcoming Tasks preview and planning
- Past Tasks history and analysis
- Quick statistics and progress visualization

### ⏰ **Pomodoro Timer Integration**
- Built-in Pomodoro technique timer
- Session tracking and analytics
- Productivity intervals logging
- Break reminders and session history

### 📅 **Advanced Schedule Management**
- Integrated calendar system for time planning
- Google Calendar synchronization
- Schedule conflict detection
- Event creation and management

### 🤖 **AI-Powered Recommendations**
- Google Gemini AI integration for intelligent suggestions
- Personalized task planning recommendations
- Study schedule optimization
- Productivity pattern analysis

### 🔔 **Smart Notification System**
- Real-time notifications and alerts
- Email-based reminders (via Nodemailer)
- Automated task deadline notifications
- Customizable notification preferences

### 📊 **Analytics & Insights**
- Comprehensive productivity tracking
- Performance trends and patterns
- Task completion analytics
- Time management insights
- Visual data representation with charts

### 🎨 **Modern User Interface**
- Responsive design for all devices
- Dark theme with elegant styling
- Intuitive navigation and user experience
- Mobile-optimized interface
- Accessibility-focused design

## 🛠 Technology Stack

### Backend
- **Node.js (ES6+ Modules)** - Runtime environment
- **Express.js 4.19.2** - Web application framework
- **MongoDB with Mongoose 8.17.1** - NoSQL database with ODM
- **JWT (jsonwebtoken 9.0.2)** - Secure authentication
- **bcryptjs 3.0.2** - Password hashing
- **Google APIs (googleapis 156.0.0)** - Calendar integration
- **Google Auth Library 10.2.1** - OAuth authentication
- **Nodemailer 7.0.5** - Email service for notifications
- **Node-cron 4.2.1** - Scheduled task automation
- **Cloudinary 2.7.0** - File upload and management
- **Multer 1.4.5** - File handling middleware
- **CORS 2.8.5** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup structure
- **CSS3 with Tailwind CSS** - Modern responsive styling
- **Vanilla JavaScript (ES6+)** - Client-side functionality
- **Chart.js** - Data visualization and analytics
- **Font Awesome** - Comprehensive icon library
- **Fetch API** - Modern HTTP client for API communication

### Development Tools
- **Nodemon 3.1.10** - Development server with hot reload
- **dotenv 17.2.1** - Environment variable management
- **Git** - Version control system

## 📁 Project Architecture

```
BrainyBalance_Intelligent-Task-Planner-for-Students/
├── 📁 backend/                    # Server-side application
│   ├── 📁 lib/
│   │   └── db.js                  # MongoDB connection and configuration
│   ├── 📁 middleware/
│   │   └── auth.js                # JWT authentication middleware
│   ├── 📁 models/                 # Mongoose data models
│   │   ├── User.js                # User authentication and profile
│   │   ├── Task.js                # Task management with priorities
│   │   ├── Schedule.js            # Calendar and scheduling
│   │   ├── Pomodoro.js            # Pomodoro session tracking
│   │   ├── Analytics.js           # Productivity analytics data
│   │   ├── Notification.js        # Notification system
│   │   ├── AIRecommendation.js    # AI-generated recommendations
│   │   ├── CalendarIntegration.js # Google Calendar sync
│   │   ├── Reminder.js            # Automated reminders
│   │   └── UserPreferences.js     # User settings and preferences
│   ├── 📁 routes/                 # API endpoint definitions
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── taskRoutes.js          # Task CRUD operations
│   │   ├── scheduleRoutes.js      # Schedule management
│   │   ├── pomodoroRoutes.js      # Pomodoro timer endpoints
│   │   ├── analyticsRoutes.js     # Analytics and insights
│   │   ├── notificationRoutes.js  # Notification management
│   │   ├── calendarRoutes.js      # Calendar integration
│   │   └── aiRecommendationRoutes.js # AI recommendation endpoints
│   ├── 📁 services/               # Business logic and external integrations
│   │   ├── aiRecommendationService.js # AI recommendation logic
│   │   ├── emailService.js        # Email notification service
│   │   ├── geminiService.js       # Google Gemini AI integration
│   │   ├── googleCalendarService.js # Google Calendar API
│   │   ├── otpService.js          # OTP generation and verification
│   │   └── reminderService.js     # Automated reminder scheduler
│   ├── 📁 src/
│   │   └── index.js               # Main server application
│   ├── .env-example               # Environment variables template
│   ├── package.json               # Dependencies and scripts
│   └── package-lock.json          # Dependency lock file
├── 📁 frontend/                   # Client-side application
│   ├── 📁 js/                     # JavaScript modules
│   │   ├── auth.js                # Authentication logic
│   │   ├── dashboard.js           # Dashboard functionality
│   │   ├── tasks.js               # Task management interface
│   │   ├── schedule.js            # Schedule management UI
│   │   ├── pomodoro.js            # Pomodoro timer interface
│   │   ├── analytics.js           # Analytics visualization
│   │   ├── aiRecommendations.js   # AI recommendations interface
│   │   ├── googleCalendar.js      # Google Calendar integration
│   │   ├── profile.js             # User profile management
│   │   ├── verifyOtp.js           # OTP verification
│   │   └── script.js              # Common utilities
│   ├── index.html                 # Landing page
│   ├── login.html                 # Authentication page
│   ├── verify-otp.html            # OTP verification page
│   ├── dashboard.html             # Main dashboard
│   ├── tasks.html                 # Task management interface
│   ├── schedule.html              # Schedule management
│   ├── pomodoro.html              # Pomodoro timer
│   ├── analytics.html             # Analytics dashboard
│   ├── ai-recommendations.html    # AI recommendations page
│   ├── calendar.html              # Calendar integration
│   ├── profile.html               # User profile settings
│   ├── auth-test.html             # Authentication testing
│   └── test-tasks.html            # Task testing interface
├── 📁 Others/                     # Documentation and resources
│   ├── CSE327_Intelligent_Task_Planner_Term_Project.pdf
│   ├── Software Requirements Specification.pdf
│   └── System Modeling Diagrams.pdf
├── LICENSE                        # MIT License
└── README.md                      # Project documentation
```

## � Quick Start Guide

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB Atlas** account or local MongoDB installation - [Get started](https://www.mongodb.com/atlas)
- **Google Cloud Console** account (for Calendar and AI features) - [Console](https://console.cloud.google.com/)
- **Git** - [Download here](https://git-scm.com/)

### 🔧 Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Shawon00s/BrainyBalance_Intelligent-Task-Planner-for-Students.git
cd BrainyBalance_Intelligent-Task-Planner-for-Students
```

#### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
Create a `.env` file in the backend directory based on `.env-example`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Google Gemini AI API
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration (for OTP verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` with:
- ✅ Health check endpoint: `http://localhost:3000/api/health`
- ✅ Frontend served automatically
- ✅ Hot reload enabled with Nodemon

#### 3. Frontend Access

**Option 1: Integrated Serving (Recommended)**
- The backend automatically serves the frontend files
- Simply navigate to `http://localhost:3000` in your browser
- All features work seamlessly with this setup

**Option 2: Separate Frontend Development**
If you need to modify frontend files extensively:
```bash
cd frontend
# Using Python (if available)
python -m http.server 8000
# OR using Node.js http-server
npx http-server -p 8000
```

### 🌐 Environment Configuration

#### MongoDB Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Copy the connection string to your `.env` file

#### Google Services Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Generative Language API (for Gemini)
4. Create credentials (OAuth 2.0 Client ID and API Key)
5. Add your credentials to the `.env` file

#### Email Service Setup (Optional)
For OTP verification features:
1. Use Gmail with App Password or any SMTP service
2. Configure email settings in `.env` file
3. Enable 2-factor authentication for Gmail
4. Generate an App Password for the application

## 🎯 Usage Guide

### Getting Started
1. **Create Account**: Register with email verification via OTP
2. **Complete Profile**: Set up your preferences and study goals
3. **Dashboard Overview**: Get familiar with your productivity dashboard
4. **Create Tasks**: Start by adding your first tasks with deadlines and priorities
5. **Schedule Time**: Use the calendar to plan your study sessions
6. **Track Progress**: Monitor your productivity with analytics

### Core Features Walkthrough

#### 📋 Task Management
- **Create Tasks**: Add tasks with titles, descriptions, deadlines, and priorities
- **Organize**: Use categories and priority levels (low, medium, high, urgent)
- **Track Status**: Monitor progress through pending → in-progress → completed
- **Filter & Sort**: View tasks by status, priority, or deadline
- **Bulk Operations**: Manage multiple tasks efficiently

#### 🎯 Smart Dashboard
- **Today's Focus**: View tasks due today with visual priority indicators
- **Overdue Alerts**: Immediate visibility of missed deadlines
- **Upcoming Preview**: Plan ahead with upcoming task visibility
- **Progress Analytics**: Real-time completion rates and productivity scores

#### ⏱️ Pomodoro Timer
- **Focus Sessions**: 25-minute focused work periods
- **Break Reminders**: Automatic short and long break notifications
- **Session Tracking**: Monitor your focused work time
- **Analytics Integration**: Pomodoro data feeds into productivity insights

#### 🤖 AI Recommendations
- **Smart Suggestions**: Get AI-powered task prioritization recommendations
- **Schedule Optimization**: Receive suggestions for optimal study times
- **Productivity Insights**: AI analysis of your work patterns
- **Personalized Tips**: Custom advice based on your productivity data

#### 📅 Calendar Integration
- **Google Calendar Sync**: Two-way synchronization with Google Calendar
- **Event Management**: Create and manage study sessions
- **Conflict Detection**: Avoid scheduling conflicts automatically
- **Timeline View**: Visual representation of your schedule

#### � Notifications
- **Real-time Alerts**: Instant notifications for important updates
- **Email Reminders**: Email notifications for upcoming deadlines
- **Custom Settings**: Personalize your notification preferences
- **Smart Timing**: Intelligent notification scheduling

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register          # Register new user with email verification
POST /api/auth/login             # User authentication
POST /api/auth/verify-otp        # Email verification via OTP
GET  /api/auth/profile           # Get current user profile
PUT  /api/auth/profile           # Update user profile
POST /api/auth/logout            # User logout
```

### Task Management
```
GET    /api/tasks                # Get all user tasks (with filtering)
POST   /api/tasks                # Create new task
GET    /api/tasks/:id            # Get specific task
PUT    /api/tasks/:id            # Update task
DELETE /api/tasks/:id            # Delete task
PATCH  /api/tasks/:id/complete   # Mark task as completed
PATCH  /api/tasks/:id/status     # Update task status
```

### Schedule Management
```
GET    /api/schedule             # Get schedule items
POST   /api/schedule             # Create schedule item
GET    /api/schedule/:id         # Get specific schedule item
PUT    /api/schedule/:id         # Update schedule item
DELETE /api/schedule/:id         # Delete schedule item
```

### Pomodoro Timer
```
GET    /api/pomodoro/sessions    # Get user's pomodoro sessions
POST   /api/pomodoro/sessions    # Start new pomodoro session
PUT    /api/pomodoro/sessions/:id # Update session
POST   /api/pomodoro/intervals   # Log work/break intervals
GET    /api/pomodoro/stats       # Get pomodoro statistics
```

### Analytics & Insights
```
GET    /api/analytics/dashboard  # Get dashboard analytics
GET    /api/analytics/productivity # Get productivity metrics
GET    /api/analytics/trends     # Get trend analysis
GET    /api/analytics/summary    # Get summary statistics
```

### Notifications
```
GET    /api/notifications        # Get user notifications
GET    /api/notifications/unread # Get unread notifications
GET    /api/notifications/unread/count # Get unread count
POST   /api/notifications        # Create notification
PATCH  /api/notifications/:id/read # Mark notification as read
DELETE /api/notifications/:id    # Delete notification
```

### Calendar Integration
```
GET    /api/calendar/integrations # Get calendar integrations
POST   /api/calendar/integrations # Create calendar integration
PUT    /api/calendar/integrations/:id # Update integration
DELETE /api/calendar/integrations/:id # Remove integration
GET    /api/calendar/events       # Get calendar events
POST   /api/calendar/events       # Create calendar event
```

### AI Recommendations
```
GET    /api/ai-recommendations   # Get AI recommendations
POST   /api/ai-recommendations/generate # Generate new recommendations
PUT    /api/ai-recommendations/:id # Update recommendation status
DELETE /api/ai-recommendations/:id # Delete recommendation
```

### System Health
```
GET    /api/health               # System health check
```

## �️ Database Schema

The application uses **MongoDB** with the following optimized collections:

### Core Collections

#### 👤 **Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed with bcryptjs),
  firstName: String,
  lastName: String,
  isVerified: Boolean,
  otp: String,
  otpExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 📋 **Tasks Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String (required),
  description: String,
  deadline: Date (required),
  priority: Enum ['low', 'medium', 'high', 'urgent'],
  status: Enum ['pending', 'in-progress', 'completed', 'cancelled'],
  category: String,
  tags: [String],
  estimatedTime: Number, // in minutes
  actualTime: Number,    // in minutes
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 📅 **Schedules Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String (required),
  description: String,
  startTime: Date (required),
  endTime: Date (required),
  type: Enum ['study', 'break', 'meeting', 'other'],
  taskId: ObjectId (ref: Task), // optional
  recurrence: String,           // daily, weekly, monthly
  createdAt: Date,
  updatedAt: Date
}
```

#### ⏱️ **Pomodoros Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  taskId: ObjectId (ref: Task), // optional
  duration: Number (default: 25), // in minutes
  breakDuration: Number (default: 5),
  status: Enum ['active', 'paused', 'completed', 'cancelled'],
  startTime: Date,
  endTime: Date,
  intervals: [{
    type: Enum ['work', 'break'],
    duration: Number,
    startTime: Date,
    endTime: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Analytics & Insights

#### 📊 **Analytics Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date (required),
  tasksCompleted: Number,
  tasksCreated: Number,
  totalWorkTime: Number,        // in minutes
  pomodoroSessions: Number,
  productivityScore: Number,    // 0-100
  categories: {
    [categoryName]: {
      completed: Number,
      time: Number
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Communication & Integration

#### 🔔 **Notifications Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: Enum ['task_deadline', 'reminder', 'achievement', 'system'],
  title: String (required),
  message: String (required),
  isRead: Boolean (default: false),
  priority: Enum ['low', 'medium', 'high'],
  actionUrl: String,            // optional redirect URL
  metadata: Object,             // additional data
  scheduledFor: Date,           // for scheduled notifications
  sentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 🤖 **AI Recommendations Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: Enum ['task_priority', 'schedule_optimization', 'productivity_tip'],
  title: String (required),
  content: String (required),
  confidence: Number,           // 0-1 AI confidence score
  isApplied: Boolean (default: false),
  isUseful: Boolean,           // user feedback
  metadata: {
    generatedBy: String,        // AI model used
    prompt: String,             // original prompt
    context: Object            // relevant user data
  },
  expiresAt: Date,             // recommendation expiry
  createdAt: Date,
  updatedAt: Date
}
```

#### 📅 **Calendar Integrations Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  provider: Enum ['google', 'outlook', 'apple'],
  accessToken: String,          // encrypted
  refreshToken: String,         // encrypted
  calendarId: String,
  syncEnabled: Boolean (default: true),
  lastSyncAt: Date,
  syncErrors: [String],
  settings: {
    syncTasks: Boolean,
    syncSchedule: Boolean,
    createReminders: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### ⏰ **Reminders Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  taskId: ObjectId (ref: Task),     // optional
  scheduleId: ObjectId (ref: Schedule), // optional
  type: Enum ['task_deadline', 'schedule_start', 'custom'],
  reminderTime: Date (required),
  message: String,
  method: Enum ['notification', 'email', 'both'],
  isRecurring: Boolean,
  recurrenceRule: String,           // cron-like pattern
  status: Enum ['pending', 'sent', 'failed'],
  sentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### ⚙️ **User Preferences Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  theme: Enum ['light', 'dark', 'auto'],
  notifications: {
    email: Boolean,
    push: Boolean,
    taskReminders: Boolean,
    deadlineAlerts: Boolean,
    weeklyReports: Boolean
  },
  pomodoro: {
    workDuration: Number,         // minutes
    shortBreak: Number,           // minutes
    longBreak: Number,            // minutes
    autoStartBreaks: Boolean,
    autoStartPomodoros: Boolean
  },
  timezone: String,
  workingHours: {
    start: String,                // "09:00"
    end: String,                  // "17:00"
    workDays: [Number]            // [1,2,3,4,5] for Mon-Fri
  },
  aiRecommendations: {
    enabled: Boolean,
    frequency: Enum ['daily', 'weekly', 'monthly']
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Database Features
- **Optimized Indexes**: Strategic indexing on userId, dates, and status fields
- **User Data Isolation**: All data is scoped to userId for security
- **Date-based Queries**: Efficient filtering for time-sensitive data
- **Real-time Updates**: Support for live data synchronization
- **Data Validation**: Mongoose schema validation for data integrity

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure stateless authentication using JSON Web Tokens
- **Password Security**: Passwords hashed using bcryptjs with salt rounds
- **Email Verification**: OTP-based email verification for new registrations
- **Protected Routes**: Middleware-based route protection for API endpoints
- **Token Expiration**: Configurable JWT expiration for enhanced security

### Data Protection
- **Input Validation**: Comprehensive request validation and sanitization
- **CORS Configuration**: Proper Cross-Origin Resource Sharing setup
- **Environment Variables**: Sensitive data stored in environment variables
- **User Data Isolation**: All data operations are user-scoped
- **API Rate Limiting**: Protection against brute force attacks

### Privacy & Compliance
- **Data Encryption**: Sensitive tokens and credentials are encrypted
- **Minimal Data Collection**: Only necessary user data is collected
- **Data Retention Policies**: Configurable data cleanup and retention
- **Audit Logging**: Comprehensive logging for security monitoring

## 🛠 Troubleshooting

### Common Issues & Solutions

#### 🚫 **Server fails to start**
```bash
# Check Node.js version (requires v14+)
node --version

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Verify environment variables
cp .env-example .env
# Edit .env with your actual values
```

#### 🔌 **Database connection errors**
```bash
# Test MongoDB connection
# Check if MONGO_URI is correct in .env
# Ensure MongoDB Atlas IP whitelist includes your IP
# Verify database user permissions

# Common MongoDB Atlas connection string format:
# mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority
```

#### 🌐 **Frontend not loading**
```bash
# Ensure backend is running first
npm run dev

# Check if port 3000 is available
netstat -an | findstr 3000  # Windows
lsof -i :3000               # macOS/Linux

# Clear browser cache and localStorage
# Try incognito/private browsing mode
```

#### 📋 **Tasks not displaying correctly**
- Verify JWT token is not expired (check browser dev tools → Application → Local Storage)
- Check network requests in browser dev tools for API errors
- Ensure proper date format in task creation (ISO 8601)
- Verify MongoDB connection and user permissions

#### ⚠️ **Mongoose duplicate index warnings**
```bash
# These warnings are harmless in development
# For production, consider dropping and recreating indexes:
# db.collection.dropIndexes()
```

#### 🔐 **Authentication issues**
```bash
# Check JWT_SECRET in .env file
# Verify email and password are correct
# Check if user account is verified (OTP)
# Clear browser localStorage and try again
```

#### 📧 **Email/OTP not working**
```bash
# Verify email configuration in .env
# Check if Gmail App Password is configured correctly
# Ensure 2-factor authentication is enabled on Gmail
# Test email service independently
```

#### 🤖 **AI recommendations not working**
```bash
# Verify GEMINI_API_KEY in .env
# Check Google Cloud Console for API quota
# Ensure Generative Language API is enabled
# Test API key with a simple request
```

#### 📅 **Google Calendar integration issues**
```bash
# Verify Google Calendar API is enabled
# Check OAuth 2.0 credentials configuration
# Ensure redirect URI matches exactly
# Test authentication flow step by step
```

### Performance Optimization

#### 🚀 **Backend Performance**
- Enable MongoDB connection pooling
- Implement API response caching
- Use database indexes effectively
- Optimize database queries with aggregation

#### 🌐 **Frontend Performance**
- Implement lazy loading for large datasets
- Use efficient DOM manipulation techniques
- Optimize image and asset loading
- Implement client-side caching strategies

### Development Best Practices

#### 🔧 **Code Quality**
- Use ESLint for JavaScript linting
- Implement consistent error handling
- Add comprehensive logging
- Write unit and integration tests

#### 📚 **Documentation**
- Keep API documentation updated
- Document environment variable requirements
- Maintain changelog for version tracking
- Create setup guides for different environments

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Test all API endpoints
- [ ] Verify email service functionality
- [ ] Test Google integrations

## 🎨 Design & User Experience

### Visual Design
- **Modern Dark Theme**: Elegant dark interface optimized for long study sessions
- **Responsive Layout**: Seamless experience across desktop, tablet, and mobile devices
- **Intuitive Navigation**: Clean, accessible interface with logical information architecture
- **Visual Hierarchy**: Clear priority indicators and status colors for better task management
- **Typography**: Carefully chosen fonts for optimal readability and aesthetics

### User Interface Features
- **Interactive Charts**: Real-time data visualization using Chart.js
- **Smooth Animations**: CSS transitions and animations for enhanced user experience
- **Icon System**: Comprehensive Font Awesome icon library for intuitive navigation
- **Color Coding**: Smart use of colors for task priorities and status indicators
- **Loading States**: Proper feedback during data loading and API operations

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Friendly**: Semantic HTML and proper ARIA labels
- **High Contrast**: Dark theme with sufficient color contrast ratios
- **Responsive Text**: Scalable text sizes for different screen resolutions
- **Focus Indicators**: Clear visual focus states for better navigation

## 📊 Analytics & Insights

### Productivity Metrics
- **Daily Scoring**: Comprehensive productivity score calculation (0-100)
- **Task Completion Rates**: Percentage of completed vs. created tasks
- **Time Tracking**: Detailed time analysis for different activities
- **Pattern Recognition**: AI-powered identification of productivity patterns
- **Trend Analysis**: Historical data visualization and trend identification

### Performance Insights
- **Goal Achievement**: Track progress towards personal and academic goals
- **Category Analysis**: Breakdown of productivity by task categories
- **Time Distribution**: Visual representation of time allocation
- **Pomodoro Analytics**: Focus session effectiveness and patterns
- **Weekly/Monthly Reports**: Comprehensive productivity summaries

### Visualization Tools
- **Interactive Charts**: Dynamic charts for data exploration
- **Progress Bars**: Visual progress indicators for goals and tasks
- **Heat Maps**: Activity intensity visualization across time periods
- **Trend Lines**: Long-term productivity trend analysis
- **Comparative Analysis**: Performance comparison across different periods

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help improve BrainyBalance:

### Getting Started
1. **Fork the Repository**
   ```bash
   git fork https://github.com/Shawon00s/BrainyBalance_Intelligent-Task-Planner-for-Students.git
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/BrainyBalance_Intelligent-Task-Planner-for-Students.git
   cd BrainyBalance_Intelligent-Task-Planner-for-Students
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

### Development Guidelines

#### Code Standards
- **JavaScript**: Use ES6+ features and modern syntax
- **File Naming**: Use camelCase for JavaScript files, kebab-case for HTML
- **Comments**: Write clear, descriptive comments for complex logic
- **Error Handling**: Implement comprehensive error handling
- **Testing**: Add tests for new features and bug fixes

#### Pull Request Process
1. **Ensure Quality**: Test your changes thoroughly
2. **Update Documentation**: Update README and API docs if needed
3. **Commit Standards**: Use descriptive commit messages
   ```bash
   git commit -m "feat: add AI-powered task prioritization feature"
   git commit -m "fix: resolve calendar sync authentication issue"
   git commit -m "docs: update API documentation for notification endpoints"
   ```
4. **Submit PR**: Create a detailed pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Testing instructions
   - Related issue numbers

### Areas for Contribution
- 🐛 **Bug Fixes**: Help identify and fix issues
- ✨ **New Features**: Implement new functionality
- 📚 **Documentation**: Improve project documentation
- 🎨 **UI/UX**: Enhance user interface and experience
- 🔧 **Performance**: Optimize application performance
- 🧪 **Testing**: Add comprehensive test coverage
- 🌐 **Localization**: Add support for multiple languages

## 📋 Changelog

### Version 1.2.0 (Current) - September 2025
#### ✨ New Features
- 🤖 **Google Gemini AI Integration**: Intelligent task recommendations and scheduling optimization
- 📧 **Email Verification System**: OTP-based user verification with Nodemailer
- 📅 **Google Calendar Sync**: Two-way synchronization with Google Calendar
- 🔔 **Enhanced Notification System**: Real-time notifications with multiple delivery methods
- ⏰ **Automated Reminder Service**: Scheduled reminders using node-cron
- 🎯 **Advanced Analytics**: Comprehensive productivity tracking and insights
- 📱 **Mobile Optimization**: Improved responsive design for mobile devices

#### 🔧 Improvements
- Enhanced dashboard with better task filtering and categorization
- Improved error handling and user feedback
- Optimized database queries with proper indexing
- Better security with enhanced JWT authentication
- Streamlined API endpoints with consistent response formats

#### 🐛 Bug Fixes
- Fixed task date filtering issues
- Resolved calendar integration authentication problems
- Improved notification delivery reliability
- Fixed responsive design issues on various screen sizes

### Version 1.1.0 - August 2025
#### ✨ New Features
- Pomodoro timer integration with session tracking
- User preference management system
- Basic analytics and productivity insights
- File upload capabilities with Cloudinary integration

#### 🔧 Improvements
- Enhanced task management with priority levels
- Improved user interface with better navigation
- Added data validation and error handling
- Optimized database schema design

### Version 1.0.0 - July 2025
#### 🎉 Initial Release
- Core task management functionality
- User authentication and authorization
- Basic dashboard with task overview
- Responsive web design
- MongoDB database integration
- RESTful API architecture

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### MIT License Summary
- ✅ **Commercial Use**: Use for commercial projects
- ✅ **Modification**: Modify and adapt the code
- ✅ **Distribution**: Distribute original or modified versions
- ✅ **Private Use**: Use for personal projects
- ⚠️ **Liability**: No warranty or liability provided
- ⚠️ **Attribution**: Include original license and copyright notice

## 👥 Authors & Contributors

### Lead Developer
- **Sudipto Roy S'hawon** - *Project Creator & Lead Developer*
  - GitHub: [@Shawon00s](https://github.com/Shawon00s)
  - Email: [Contact via GitHub](https://github.com/Shawon00s)

### Special Thanks
- **CSE327.6 Course Team** - Academic guidance and project supervision
- **Open Source Community** - For the amazing tools and libraries used
- **Beta Testers** - Students who provided valuable feedback during development

## 🙏 Acknowledgments

### Technologies & Services
- **MongoDB Atlas** - Reliable cloud database hosting
- **Google Cloud Platform** - AI services and API infrastructure
- **Tailwind CSS** - Utility-first CSS framework for rapid development
- **Chart.js** - Beautiful and responsive data visualization
- **Font Awesome** - Comprehensive icon library
- **Nodemailer** - Email service integration
- **JWT.io** - JSON Web Token implementation

### Educational Institution
- **North South University** - Academic support and resources
- **CSE327.6 Software Engineering Course** - Project framework and guidance
- **Department of Electrical and Computer Engineering** - Technical resources

### Inspiration
- **Pomodoro Technique** - Time management methodology by Francesco Cirillo
- **Getting Things Done (GTD)** - Productivity system by David Allen
- **Modern Task Management Apps** - UI/UX inspiration from contemporary productivity tools

---

<div align="center">

### 🌟 **Made with ❤️ for Students, by Students** 🌟

*BrainyBalance - Empowering students to achieve their academic goals through intelligent task management and productivity optimization.*

---

**📚 Academic Project** | **🏫 North South University** | **📅 CSE327.6 - Fall 2025**

</div>
