import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateOtp, hashOtp, sendOtpEmail, verifyOtpHash } from '../services/otpService.js';

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            isVerified: false  // User starts as unverified
        });

        // Save user as unverified
        await user.save();

        // Generate OTP and send via email
        const { otp, expires } = generateOtp();
        const otpHash = await hashOtp(otp);

        // Update user with OTP data
        user.otpHash = otpHash;
        user.otpExpires = expires;
        user.otpAttempts = 0;
        user.otpResendCount = 0;
        await user.save();

        console.log(`Generated OTP for user ${user.email}: expires at ${expires}`);

        // Send OTP email
        try {
            await sendOtpEmail(user.email, otp);
            console.log(`OTP email sent successfully to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Don't fail the registration if email fails
        }

        // Don't auto-issue JWT until verified
        res.status(201).json({
            message: 'User registered. OTP sent to email for verification.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ error: 'User ID and OTP are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User already verified' });
        }

        // Handle users created before OTP system was implemented
        if (!user.otpHash || !user.otpExpires) {
            console.log(`User ${userId} has no OTP data (created before OTP system). Generating new OTP...`);

            // Generate new OTP for this user
            const { otp, expires } = generateOtp();
            const otpHash = await hashOtp(otp);

            user.otpHash = otpHash;
            user.otpExpires = expires;
            user.otpAttempts = 0;
            user.otpResendCount = 0;
            await user.save();

            // Send OTP email
            try {
                await sendOtpEmail(user.email, otp);
                console.log(`New OTP generated and sent to ${user.email}`);
            } catch (emailError) {
                console.error('Failed to send new OTP email:', emailError);
            }

            return res.status(400).json({
                error: 'No verification code found. A new code has been sent to your email.'
            });
        }

        if (new Date() > user.otpExpires) {
            console.log(`OTP expired for user ${userId}: current=${new Date()}, expires=${user.otpExpires}`);
            return res.status(400).json({ error: 'OTP has expired. Please request a new verification code.' });
        }

        if (user.otpAttempts >= 5) {
            return res.status(429).json({ error: 'Too many OTP attempts. Please request a new code.' });
        }

        const isValidOtp = await verifyOtpHash(otp, user.otpHash);
        if (!isValidOtp) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP verified successfully
        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.otpResendCount = 0;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Server error during OTP verification' });
    }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User already verified' });
        }

        // Initialize OTP fields for users created before OTP system
        if (user.otpResendCount === undefined) {
            user.otpResendCount = 0;
        }

        if (user.otpResendCount >= 3) {
            return res.status(429).json({ error: 'Maximum resend attempts reached. Please try again later.' });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpHash = await hashOtp(otp);

        // Update user with new OTP
        user.otpHash = otpHash;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpAttempts = 0;
        user.otpResendCount += 1;
        await user.save();

        // Send OTP email
        await sendOtpEmail(user.email, otp, user.name);

        res.json({ message: 'New OTP sent to your email' });
    } catch (error) {
        console.error('OTP resend error:', error);
        res.status(500).json({ error: 'Server error during OTP resend' });
    }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                lastLogin: req.user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password' }
        );

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error during profile update' });
    }
});

export default router;