import express from 'express';
import cors from 'cors';
import "dotenv/config";

// Import routes
import authRoutes from '../routes/authRoutes.js';
import taskRoutes from '../routes/taskRoutes.js';
import scheduleRoutes from '../routes/scheduleRoutes.js';
import pomodoroRoutes from '../routes/pomodoroRoutes.js';
import analyticsRoutes from '../routes/analyticsRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';

// Import database connection
import { connectDB } from '../lib/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "BrainyBalance API is running",
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Global error handler:", error);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    connectDB();
});