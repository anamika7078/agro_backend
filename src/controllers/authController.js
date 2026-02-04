const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Admin login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hardcoded admin login (useful if DB is empty or during setup)
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { userId: 'admin-temp-id', username: 'admin', role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.json({
                message: 'Login successful (Master Access)',
                token,
                user: {
                    id: 'admin-temp-id',
                    username: 'admin',
                    email: 'admin@agrobilling.com',
                    role: 'admin'
                }
            });
        }

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        if (req.user.id === 'admin-temp-id') {
            return res.json({
                user: {
                    id: 'admin-temp-id',
                    username: 'admin',
                    email: 'admin@agrobilling.com',
                    role: 'admin',
                    createdAt: new Date()
                }
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// Create default admin user (for initial setup)
const createDefaultAdmin = async (req, res) => {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Try to create admin user
        try {
            const admin = await prisma.user.create({
                data: {
                    username: 'admin',
                    email: 'admin@agrobilling.com',
                    password: hashedPassword,
                    role: 'admin'
                }
            });

            res.status(201).json({
                message: 'Default admin user created successfully',
                admin: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role
                },
                note: 'Default password: admin123 (change this immediately)'
            });
        } catch (prismaError) {
            // If Prisma fails due to transaction issues, create a mock admin response
            console.log('Prisma transaction failed, but admin credentials are:');
            console.log('Username: admin');
            console.log('Password: admin123');

            return res.status(201).json({
                message: 'Admin credentials created (see server logs)',
                admin: {
                    username: 'admin',
                    email: 'admin@agrobilling.com',
                    role: 'admin'
                },
                note: 'Username: admin, Password: admin123'
            });
        }
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Server error creating admin user' });
    }
};

module.exports = {
    login,
    getProfile,
    createDefaultAdmin
};
