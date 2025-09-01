# BrainyBalance - Intelligent Task Planner for Students

A comprehensive full-stack web application designed to help students manage their tasks, track productivity, and optimize their study schedule using intelligent features.

## 🚀 Features

- **User Authentication** - Secure registration and login system with JWT
- **Task Management** - Create, edit, and organize tasks with priorities and categories
- **Smart Dashboard** - Real-time analytics and productivity insights with:
  - Today's Tasks (filtered by current date)
  - Overdue Tasks tracking
  - Upcoming Tasks preview
  - Past Tasks history
- **Pomodoro Timer** - Built-in time tracking and productivity sessions
- **Schedule Management** - Calendar integration for better time planning
- **Analytics & Insights** - Track productivity patterns and performance
- **Notification System** - Smart reminders and alerts with real-time updates
- **Responsive Design** - Modern dark theme with mobile support
- **AI Recommendations** - Intelligent task planning suggestions
- **Calendar Integration** - External calendar sync capabilities

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.19.2** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Tailwind CSS
- **Vanilla JavaScript** - ES6+ features
- **Chart.js** - Data visualization
- **Font Awesome** - Icon library

## 📁 Project Structure

```
BrainyBalance_Intelligent-Task-Planner-for-Students/
├── backend/
│   ├── lib/
│   │   └── db.js                 # Database connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema and model
│   │   ├── Task.js               # Task schema and model
│   │   ├── Schedule.js           # Schedule schema and model
│   │   ├── Pomodoro.js           # Pomodoro session model
│   │   ├── Analytics.js          # Analytics data model
│   │   ├── Notification.js       # Notification model
│   │   ├── AIRecommendation.js   # AI recommendation model
│   │   ├── CalendarIntegration.js # Calendar sync model
│   │   └── UserPreferences.js    # User preferences model
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── taskRoutes.js         # Task management endpoints
│   │   ├── scheduleRoutes.js     # Schedule management endpoints
│   │   ├── pomodoroRoutes.js     # Pomodoro timer endpoints
│   │   ├── analyticsRoutes.js    # Analytics endpoints
│   │   ├── notificationRoutes.js # Notification endpoints
│   │   ├── calendarRoutes.js     # Calendar integration endpoints
│   │   └── aiRecommendationRoutes.js # AI recommendation endpoints
│   ├── src/
│   │   └── index.js              # Main server file
│   ├── .env                      # Environment variables
│   ├── package.json              # Backend dependencies
│   └── package-lock.json         # Lock file
├── frontend/
│   ├── js/
│   │   ├── auth.js               # Authentication logic
│   │   ├── dashboard.js          # Dashboard functionality
│   │   ├── tasks.js              # Task management UI
│   │   ├── schedule.js           # Schedule management UI
│   │   ├── pomodoro.js           # Pomodoro timer UI
│   │   └── analytics.js          # Analytics visualization
│   ├── index.html                # Landing page
│   ├── login.html                # Login/Register page
│   ├── dashboard.html            # Main dashboard
│   ├── tasks.html                # Task management page
│   ├── schedule.html             # Schedule page
│   ├── pomodoro.html             # Pomodoro timer page
│   ├── analytics.html            # Analytics page
│   └── script.js                 # Common scripts
├── Others/
│   ├── CSE327_Intelligent_Task_Planner_Term_Project.pdf
│   └── Software Requirements Specification.pdf
├── LICENSE                       # MIT License
└── README.md                     # Project documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the backend directory with:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the backend server:
```bash
npm run dev
```
or for production:
```bash
npm start
```

**Note**: The server runs on port 3000 by default and includes:
- Health check endpoint: `http://localhost:3000/api/health`
- Database connection monitoring
- Automatic error handling and logging

### Frontend Setup

The frontend is a static web application that can be served directly or through the backend.

**Option 1: Access through Backend (Recommended)**
1. Start the backend server as described above
2. Open your browser and navigate to `http://localhost:3000`
3. The backend serves the frontend files automatically

**Option 2: Serve Frontend Separately**
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Serve using a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

3. Access the application at `http://localhost:8000`

## 🚀 Usage

1. **Registration**: Create a new account on the login page
2. **Dashboard**: View your productivity overview and quick stats
3. **Tasks**: Create, manage, and organize your tasks
4. **Schedule**: Plan your study sessions and deadlines
5. **Pomodoro**: Use the built-in timer for focused work sessions
6. **Analytics**: Track your productivity patterns and performance

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/complete` - Mark task as complete

### Schedule
- `GET /api/schedule` - Get schedule items
- `POST /api/schedule` - Create schedule item
- `PUT /api/schedule/:id` - Update schedule item
- `DELETE /api/schedule/:id` - Delete schedule item

### Pomodoro
- `GET /api/pomodoro/sessions` - Get pomodoro sessions
- `POST /api/pomodoro/sessions` - Create new session
- `PUT /api/pomodoro/sessions/:id` - Update session
- `POST /api/pomodoro/intervals` - Log interval

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/productivity` - Get productivity metrics
- `GET /api/analytics/trends` - Get trend data

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread` - Get unread notifications
- `GET /api/notifications/unread/count` - Get unread notification count
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Calendar Integration
- `GET /api/calendar/integrations` - Get calendar integrations
- `POST /api/calendar/integrations` - Create calendar integration
- `PUT /api/calendar/integrations/:id` - Update integration
- `DELETE /api/calendar/integrations/:id` - Remove integration

### AI Recommendations
- `GET /api/ai-recommendations` - Get AI recommendations
- `POST /api/ai-recommendations/generate` - Generate new recommendations
- `PUT /api/ai-recommendations/:id` - Update recommendation status

## 📝 Database Schema

The application uses MongoDB with the following collections:
- **users** - User accounts and authentication data
- **tasks** - Task management and tracking with deadline filtering
- **schedules** - Calendar and schedule items
- **pomodoros** - Pomodoro sessions and intervals
- **analytics** - Daily productivity metrics and trends
- **notifications** - System notifications and user alerts
- **airecommendations** - AI-generated task recommendations
- **calendarintegrations** - External calendar sync data
- **userpreferences** - User settings and preferences

### Key Features:
- Optimized indexes for performance
- User-scoped data isolation
- Date-based filtering for tasks
- Real-time notification system

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Input validation and sanitization
- CORS configuration

## 🛠 Troubleshooting

### Common Issues

**1. Server fails to start**
- Check if MongoDB connection string is correct in `.env`
- Ensure Node.js version is 14 or higher
- Verify all dependencies are installed with `npm install`

**2. Database connection errors**
- Verify MongoDB Atlas connection string
- Check network connectivity
- Ensure database user has proper permissions

**3. Frontend not loading**
- Start the backend server first
- Check if port 3000 is available
- Clear browser cache and cookies

**4. Tasks not displaying correctly**
- Verify date format in task creation
- Check browser console for JavaScript errors
- Ensure proper authentication token

**5. Mongoose duplicate index warnings**
- This is a harmless warning about database indexes
- Can be ignored in development
- Consider dropping and recreating indexes in production

## 🎨 Design Features

- Modern dark theme with elegant UI
- Responsive design for all devices (mobile, tablet, desktop)
- Intuitive user interface with smooth navigation
- Real-time data updates without page refresh
- Interactive charts and visualizations with Chart.js
- Smooth animations and transitions
- Tailwind CSS for consistent styling
- Font Awesome icons for better UX
- Date-aware task filtering and organization
- Color-coded priority system for tasks

## 📊 Analytics & Insights

- Daily productivity scoring
- Task completion rates
- Time tracking and analysis
- Productivity pattern recognition
- Performance trends
- Goal achievement tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Submit a pull request

## 📋 Changelog

### Version 1.0.0 (Current)
- ✅ Complete task management system
- ✅ User authentication and authorization
- ✅ Dashboard with date-filtered task views
- ✅ Pomodoro timer integration
- ✅ Analytics and productivity tracking
- ✅ Notification system
- ✅ Calendar integration support
- ✅ AI recommendation framework
- ✅ Responsive design implementation

### Recent Improvements
- Enhanced dashboard task filtering by date
- Added separate sections for today's, upcoming, and past tasks
- Improved notification API endpoints
- Better error handling and debugging
- Optimized database queries with proper indexing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Sudipto Roy S'hawon** - Initial work and development

## 🙏 Acknowledgments

- CSE327.6 (MRH1) course project
- MongoDB Atlas for database hosting
- Tailwind CSS for styling framework
- Chart.js for data visualization
- Font Awesome for icons

---

**Note**: This is an academic project for CSE327.6 Software Engineering course.
