import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db, { initializeDatabase } from './db.js';

// Input validation utilities
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required and must be a string' };
    }
    if (username.length < 3 || username.length > 30) {
        return { valid: false, error: 'Username must be between 3 and 30 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    return { valid: true, sanitized: username.trim() };
};

const validateMoodId = (moodId) => {
    if (!moodId || typeof moodId !== 'string') {
        return { valid: false, error: 'Mood ID is required and must be a string' };
    }
    const validMoods = ['happy', 'chill', 'energetic', 'sad', 'romantic'];
    if (!validMoods.includes(moodId.toLowerCase())) {
        return { valid: false, error: 'Invalid mood ID' };
    }
    return { valid: true, sanitized: moodId.toLowerCase() };
};

const validateRoomId = (roomId) => {
    if (!roomId || typeof roomId !== 'string') {
        return { valid: false, error: 'Room ID is required and must be a string' };
    }
    // Allow mood rooms
    const moodValidation = validateMoodId(roomId);
    if (moodValidation.valid) {
        return moodValidation;
    }
    // Allow private rooms: private_<id>
    if (/^private_\d+$/.test(roomId)) {
        return { valid: true, sanitized: roomId };
    }
    return { valid: false, error: 'Invalid room ID' };
};

const validateUserId = (userId) => {
    console.log('Validating user ID:', userId, 'type:', typeof userId);
    const id = parseInt(userId);
    console.log('Parsed ID:', id);
    
    if (isNaN(id) || id <= 0) {
        console.log('User ID validation failed:', { isNaN: isNaN(id), id: id });
        return { valid: false, error: 'Invalid user ID' };
    }
    
    console.log('User ID validation passed:', { valid: true, id: id });
    return { valid: true, sanitized: id };
};

const validateJournalText = (text) => {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Journal text is required and must be a string' };
    }
    if (text.length > 2000) {
        return { valid: false, error: 'Journal text cannot exceed 2000 characters' };
    }
    return { valid: true, sanitized: text.trim() };
};

const validateMessageText = (text) => {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Message text is required and must be a string' };
    }
    if (text.length > 500) {
        return { valid: false, error: 'Message text cannot exceed 500 characters' };
    }
    return { valid: true, sanitized: text.trim() };
};

const validateHeartNotification = (senderId, receiverId) => {
    if (!senderId || !receiverId) {
        return { valid: false, error: 'Both sender and receiver IDs are required' };
    }
    if (senderId === receiverId) {
        return { valid: false, error: 'Cannot send heart to yourself' };
    }
    return { valid: true };
};

const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required and must be a string' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, sanitized: email.trim().toLowerCase() };
};

const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required and must be a string' };
    }
    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    if (password.length > 100) {
        return { valid: false, error: 'Password cannot exceed 100 characters' };
    }
    return { valid: true };
};

// JWT Secret - use environment variable or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'mood-mingle-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

export const app = express();
export const httpServer = createServer(app);

const port = process.env.PORT || 3002;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

// CORS configuration - allow localhost and network IPs
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost and network IPs
        const allowedOrigins = [
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            frontendUrl,
        ];
        
        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.includes(origin) ||
            /^http:\/\/192\.168\.\d+\.\d+:5174$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+:5174$/.test(origin) ||
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5174$/.test(origin);
        
        if (isAllowed || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Initialize Database with SQLite
export const initializeDatabaseTables = async () => {
    try {
        console.log('Initializing SQLite database...');
        
        // Remove existing database file for clean start (manual)
        console.log('Note: Remove moodapp.db manually for clean database');
        
        await initializeDatabase();

        // Define tables with SQLite syntax
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            avatar TEXT,
            status TEXT,
            current_mood_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add email and password_hash columns if they don't exist
        // SQLite doesn't support adding UNIQUE constraints directly, so we add the column first
        // and then create a unique index if needed
        try {
            // Check if email column exists
            const emailCheck = await db.query(`PRAGMA table_info(users)`);
            const hasEmail = emailCheck.rows.some(col => col.name === 'email');
            
            if (!hasEmail) {
                await db.query(`ALTER TABLE users ADD COLUMN email VARCHAR(255)`);
                // Create unique index for email
                try {
                    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
                } catch (idxErr) {
                    console.warn('Could not create email index:', idxErr.message);
                }
            }
        } catch (err) {
            // Column might already exist, ignore error
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                console.warn('Migration note (email):', err.message);
            }
        }

        try {
            // Check if password_hash column exists
            const pwdCheck = await db.query(`PRAGMA table_info(users)`);
            const hasPasswordHash = pwdCheck.rows.some(col => col.name === 'password_hash');
            
            if (!hasPasswordHash) {
                await db.query(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
            }
        } catch (err) {
            // Column might already exist, ignore error
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                console.warn('Migration note (password_hash):', err.message);
            }
        }

        await db.query(`CREATE TABLE IF NOT EXISTS mood_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            mood_id VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            text TEXT,
            date VARCHAR(50),
            time VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id VARCHAR(50),
            user_id INTEGER,
            "user" VARCHAR(255),
            text TEXT,
            time VARCHAR(50),
            client_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: add target_user_id for system messages scoped to a user
        try {
            const msgTableInfo = await db.query(`PRAGMA table_info(messages)`);
            const hasTargetUserId = msgTableInfo.rows.some(col => col.name === 'target_user_id');
            if (!hasTargetUserId) {
                await db.query(`ALTER TABLE messages ADD COLUMN target_user_id INTEGER`);
            }
        } catch (err) {
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                console.warn('Migration note (messages.target_user_id):', err.message);
            }
        }

        // Migration: add client_id for message de-duplication
        try {
            const msgTableInfo = await db.query(`PRAGMA table_info(messages)`);
            const hasClientId = msgTableInfo.rows.some(col => col.name === 'client_id');
            if (!hasClientId) {
                await db.query(`ALTER TABLE messages ADD COLUMN client_id TEXT`);
            }
        } catch (err) {
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                console.warn('Migration note (messages.client_id):', err.message);
            }
        }

        await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_room_client ON messages(room_id, client_id)`);

        await db.query(`CREATE TABLE IF NOT EXISTS message_deliveries (
            message_id INTEGER,
            user_id INTEGER,
            delivered_at TIMESTAMP,
            PRIMARY KEY (message_id, user_id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER,
            reported_id INTEGER,
            reason TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS blocked_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blocker_id INTEGER,
            blocked_id INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(blocker_id, blocked_id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS heart_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            receiver_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE,
            UNIQUE(sender_id, receiver_id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS private_chat_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_id INTEGER,
            requested_id INTEGER,
            status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(requester_id, requested_id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS private_chat_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_name TEXT UNIQUE,
            user1_id INTEGER,
            user2_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        )`);

        console.log('Database tables initialized successfully');
    } catch (err) {
        console.error(`Database initialization failed: ${err.message}`);
        process.exit(1);
    }
};






// Map user IDs to socket IDs for targeted notifications
const userSocketMap = new Map(); // userId -> Set of socketIds

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    let currentRoom = null;
    let currentUserId = null;

    // Register user ID when they identify themselves
    socket.on('register_user', (data) => {
        const userId = typeof data === 'object' ? data.userId : data;
        if (userId) {
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, new Set());
            }
            userSocketMap.get(userId).add(socket.id);
            currentUserId = userId;
            // Also join a user-specific room for easier targeting
            socket.join(`user_${userId}`);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        }
    });

    socket.on('join_room', (data) => {
        const roomId = typeof data === 'string' ? data : data.roomId;
        const userId = typeof data === 'object' ? data.userId : null;

        if (currentRoom) {
            socket.leave(currentRoom);
        }

        socket.join(roomId);
        currentRoom = roomId;
        
        // Register user ID if provided
        if (userId) {
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, new Set());
            }
            userSocketMap.get(userId).add(socket.id);
            currentUserId = userId;
            // Join user-specific room
            socket.join(`user_${userId}`);
        }
        
        console.log(`User ${socket.id} (${userId}) joined room: ${roomId} `);
    });

    socket.on('typing_start', (data) => {
        const { roomId, userId, username } = data;
        socket.to(roomId).emit('user_typing', { userId, username });
    });

    socket.on('typing_stop', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit('user_stopped_typing', { userId });
    });

    socket.on('send_message', async (data, callback) => {
        try {
            // Validate input data
            const { roomId, userId, user, text, time, clientId } = data;

            // Validate message text
            const textValidation = validateMessageText(text);
            if (!textValidation.valid) {
                socket.emit('error', { message: textValidation.error });
                return;
            }

            // Validate user ID
            const userIdValidation = validateUserId(userId);
            if (!userIdValidation.valid) {
                socket.emit('error', { message: userIdValidation.error });
                return;
            }

            // Validate room ID (mood or private room)
            const roomValidation = validateRoomId(roomId);
            if (!roomValidation.valid) {
                socket.emit('error', { message: roomValidation.error });
                return;
            }

            const sanitizedText = textValidation.sanitized;
            const sanitizedUserId = userIdValidation.sanitized;
            const sanitizedRoomId = roomValidation.sanitized;
            const sanitizedUser = user ? user.toString().trim().substring(0, 30) : 'Anonymous';

            if (clientId) {
                const { rows: existingRows } = await db.query(`
                    SELECT m.*, u.avatar
                    FROM messages m
                    LEFT JOIN users u ON m.user_id = u.id
                    WHERE m.room_id = ? AND m.client_id = ?
                    LIMIT 1
                `, [sanitizedRoomId, clientId]);

                if (existingRows.length > 0) {
                    const row = existingRows[0];
                    const existingMsg = {
                        id: row.id,
                        roomId: row.room_id,
                        userId: row.user_id,
                        user: row.user,
                        text: row.text,
                        time: row.time,
                        avatar: row.avatar || null,
                        clientId: row.client_id || null,
                        timestamp: row.timestamp
                    };

                    io.to(sanitizedRoomId).emit('receive_message', existingMsg);
                    if (sanitizedRoomId.startsWith('private_')) {
                        const privateRoomId = parseInt(sanitizedRoomId.replace('private_', ''), 10);
                        if (!Number.isNaN(privateRoomId)) {
                            const { rows: roomRows } = await db.query(
                                'SELECT user1_id, user2_id FROM private_chat_rooms WHERE id = ?',
                                [privateRoomId]
                            );
                            const roomRow = roomRows[0];
                            if (roomRow?.user1_id) {
                                io.to(`user_${roomRow.user1_id}`).emit('receive_message', existingMsg);
                            }
                            if (roomRow?.user2_id) {
                                io.to(`user_${roomRow.user2_id}`).emit('receive_message', existingMsg);
                            }
                        }
                    }

                    if (typeof callback === 'function') {
                        callback({ ok: true, id: row.id, clientId: row.client_id || null });
                    }
                    return;
                }
            }

        await db.query(
            'INSERT INTO messages (room_id, user_id, "user", text, time, client_id) VALUES (?, ?, ?, ?, ?, ?)',
            [sanitizedRoomId, sanitizedUserId, sanitizedUser, sanitizedText, time, clientId || null]
        );

        let savedRow = null;
        if (clientId) {
            const { rows: byClientRows } = await db.query(`
                SELECT m.*, u.avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ? AND m.client_id = ?
                ORDER BY m.id DESC
                LIMIT 1
            `, [sanitizedRoomId, clientId]);
            savedRow = byClientRows[0] || null;
        }
        if (!savedRow) {
            const { rows: lastRows } = await db.query(`
                SELECT m.*, u.avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ?
                ORDER BY m.id DESC
                LIMIT 1
            `, [sanitizedRoomId]);
            savedRow = lastRows[0] || null;
        }

            const savedMsg = {
                id: savedRow?.id,
                roomId: sanitizedRoomId,
                userId: sanitizedUserId,
                user: sanitizedUser,
                text: sanitizedText,
                time,
                avatar: savedRow?.avatar || null,
                clientId: clientId || null,
                timestamp: savedRow?.timestamp || null
            };
            // Broadcast to everyone in the room INCLUDING sender (simplifies frontend state)
            io.to(sanitizedRoomId).emit('receive_message', savedMsg);

            // Fallback for private rooms: deliver directly to both users' rooms
            if (sanitizedRoomId.startsWith('private_')) {
                const privateRoomId = parseInt(sanitizedRoomId.replace('private_', ''), 10);
                if (!Number.isNaN(privateRoomId)) {
                    const { rows: roomRows } = await db.query(
                        'SELECT user1_id, user2_id FROM private_chat_rooms WHERE id = ?',
                        [privateRoomId]
                    );
                    const roomRow = roomRows[0];
                    if (roomRow?.user1_id && savedMsg.id) {
                        await db.query(
                            'INSERT OR IGNORE INTO message_deliveries (message_id, user_id) VALUES (?, ?)',
                            [savedMsg.id, roomRow.user1_id]
                        );
                    }
                    if (roomRow?.user2_id && savedMsg.id) {
                        await db.query(
                            'INSERT OR IGNORE INTO message_deliveries (message_id, user_id) VALUES (?, ?)',
                            [savedMsg.id, roomRow.user2_id]
                        );
                    }
                    if (sanitizedUserId && savedMsg.id) {
                        await db.query(
                            'UPDATE message_deliveries SET delivered_at = CURRENT_TIMESTAMP WHERE message_id = ? AND user_id = ?',
                            [savedMsg.id, sanitizedUserId]
                        );
                    }
                    if (roomRow?.user1_id) {
                        io.to(`user_${roomRow.user1_id}`).emit('receive_message', savedMsg);
                    }
                    if (roomRow?.user2_id) {
                        io.to(`user_${roomRow.user2_id}`).emit('receive_message', savedMsg);
                    }
                }
            }
            if (typeof callback === 'function') {
                callback({ ok: true, id: savedMsg?.id ?? null, clientId: clientId || null });
            }
        } catch (err) {
            console.error('Socket error:', err.message);
            socket.emit('error', { message: 'Failed to send message' });
            if (typeof callback === 'function') {
                callback({ ok: false, error: 'Failed to send message' });
            }
        }
    });

    socket.on('send_heart', async (data) => {
        try {
            const { senderId, receiverId } = data;

            // Validate user ID
            const senderValidation = validateUserId(senderId);
            if (!senderValidation.valid) {
                socket.emit('error', { message: senderValidation.error });
                return;
            }

            const receiverValidation = validateUserId(receiverId);
            if (!receiverValidation.valid) {
                socket.emit('error', { message: receiverValidation.error });
                return;
            }

            const heartValidation = validateHeartNotification(senderId, receiverId);
            if (!heartValidation.valid) {
                socket.emit('error', { message: heartValidation.error });
                return;
            }

            const sanitizedSenderId = senderValidation.sanitized;
            const sanitizedReceiverId = receiverValidation.sanitized;

            // Insert heart notification
            try {
                await db.query(`
                    INSERT OR REPLACE INTO heart_notifications (sender_id, receiver_id, is_read) 
                    VALUES (?, ?, FALSE)
                `, [sanitizedSenderId, sanitizedReceiverId]);
            } catch (err) {
                await db.query(`
                    UPDATE heart_notifications 
                    SET is_read = FALSE, created_at = CURRENT_TIMESTAMP 
                    WHERE sender_id = ? AND receiver_id = ?
                `, [sanitizedSenderId, sanitizedReceiverId]);
            }

            // Get user info for notification
            const { rows: receiverRows } = await db.query('SELECT username FROM users WHERE id = ?', [sanitizedReceiverId]);
            const { rows: senderRows } = await db.query('SELECT username FROM users WHERE id = ?', [sanitizedSenderId]);
            
            if (receiverRows.length > 0 && senderRows.length > 0) {
                const notification = {
                    type: 'heart',
                    senderId: sanitizedSenderId,
                    senderUsername: senderRows[0].username,
                    receiverId: sanitizedReceiverId,
                    message: `${senderRows[0].username} sent you a heart! ❤️`,
                    timestamp: new Date().toISOString()
                };
                
                // Send to specific user via room
                io.to(`user_${sanitizedReceiverId}`).emit(`heart_notification_${sanitizedReceiverId}`, notification);
                // Also emit globally as fallback
                io.emit(`heart_notification_${sanitizedReceiverId}`, notification);
                
                // Send confirmation to sender
                socket.emit('heart_sent', { receiverId: sanitizedReceiverId, success: true });
            }
        } catch (err) {
            console.error('Heart notification error:', err);
            socket.emit('error', { message: 'Failed to send heart notification' });
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.to(currentRoom).emit('user_left', { userId: currentUserId });
        }
        
        // Remove socket from user mapping
        if (currentUserId) {
            const userSockets = userSocketMap.get(currentUserId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    userSocketMap.delete(currentUserId);
                }
            }
        }
        
        console.log('User disconnected:', socket.id, 'userId:', currentUserId);
    });
});

// --- API Endpoints ---

// Authentication Endpoints
// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate inputs
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            res.status(400).json({ error: usernameValidation.error });
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            res.status(400).json({ error: emailValidation.error });
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            res.status(400).json({ error: passwordValidation.error });
            return;
        }

        const sanitizedUsername = usernameValidation.sanitized;
        const sanitizedEmail = emailValidation.sanitized;

        // Check if username already exists
        const { rows: usernameRows } = await db.query('SELECT id FROM users WHERE username = ?', [sanitizedUsername]);
        if (usernameRows.length > 0) {
            res.status(400).json({ error: 'Username already taken' });
            return;
        }

        // Check if email already exists
        const { rows: emailRows } = await db.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
        if (emailRows.length > 0) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const defaultAvatar = `https://i.pravatar.cc/150?u=${sanitizedEmail}`;
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash, avatar, status) VALUES (?, ?, ?, ?, ?)',
            [sanitizedUsername, sanitizedEmail, passwordHash, defaultAvatar, 'Just joined!']
        );
        const newId = result.rows[0]?.id;

        // Generate JWT token
        const token = jwt.sign(
            { userId: newId, username: sanitizedUsername, email: sanitizedEmail },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            token,
            user: {
                id: newId,
                username: sanitizedUsername,
                email: sanitizedEmail,
                avatar: defaultAvatar,
                status: 'Just joined!',
                currentMoodId: null
            }
        });
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate inputs
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            res.status(400).json({ error: emailValidation.error });
            return;
        }

        if (!password || typeof password !== 'string') {
            res.status(400).json({ error: 'Password is required' });
            return;
        }

        const sanitizedEmail = emailValidation.sanitized;

        // Find user by email
        const { rows } = await db.query('SELECT * FROM users WHERE email = ?', [sanitizedEmail]);
        if (rows.length === 0) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const user = rows[0];

        // Check if user has a password (authenticated user)
        if (!user.password_hash) {
            res.status(401).json({ error: 'This account was created without a password. Please sign up again.' });
            return;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Update last_active
        await db.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                currentMoodId: user.current_mood_id
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify token (for checking if user is still authenticated)
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { rows } = await db.query(
            'SELECT id, username, email, avatar, status, current_mood_id FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = rows[0];
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                currentMoodId: user.current_mood_id
            }
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        res.status(500).json({ error: err.message });
    }
});

// User Management
// Create or get user (for backward compatibility - guest users)
app.post('/api/users', async (req, res) => {
    try {
        const { username, avatar } = req.body;

        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            res.status(400).json({ error: usernameValidation.error });
            return;
        }

        const sanitizedUsername = usernameValidation.sanitized;

        // Try to find existing user
        const { rows } = await db.query('SELECT * FROM users WHERE username = ?', [sanitizedUsername]);
        const row = rows[0];

        if (row) {
            // Update last_active
            await db.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
            res.json({ id: row.id, username: row.username, avatar: row.avatar, status: row.status, currentMoodId: row.current_mood_id });
        } else {
            // Create new user
            const defaultAvatar = avatar || `https://i.pravatar.cc/150?u=${sanitizedUsername}`;
            const result = await db.query(
                'INSERT INTO users (username, avatar, status) VALUES (?, ?, ?)',
                [sanitizedUsername, defaultAvatar, 'Just joined!']
            );
            const newId = result.rows[0]?.id;
            res.json({ id: newId, username: sanitizedUsername, avatar: defaultAvatar, status: 'Just joined!', currentMoodId: null });

        }
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(id);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM users WHERE id = ?', [sanitizedId]);
        const row = rows[0];

        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            id: row.id,
            username: row.username,
            avatar: row.avatar,
            status: row.status,
            currentMoodId: row.current_mood_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user status
app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, avatar } = req.body;

        // Validate user ID
        const userIdValidation = validateUserId(id);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (status !== undefined) {
            if (typeof status !== 'string' || status.length > 100) {
                res.status(400).json({ error: 'Status must be a string with max 100 characters' });
                return;
            }
            updates.push(`status = $${paramIndex++}`);
            values.push(status.trim());
        }
        if (avatar !== undefined) {
            if (typeof avatar !== 'string' || avatar.length > 500) {
                res.status(400).json({ error: 'Avatar must be a string with max 500 characters' });
                return;
            }
            updates.push(`avatar = $${paramIndex++}`);
            values.push(avatar.trim());
        }

        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(id);
        await db.query(`UPDATE users SET ${updates.join(', ')}, last_active = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get users matching current mood
app.get('/api/users/match/:moodId', async (req, res) => {
    try {
        const { moodId } = req.params;

        // Validate mood ID
        const moodValidation = validateMoodId(moodId);
        if (!moodValidation.valid) {
            res.status(400).json({ error: moodValidation.error });
            return;
        }

        const sanitizedMoodId = moodValidation.sanitized;

        // Get users with current mood (remove 1-hour filter for testing)
        const { rows } = await db.query(`
            SELECT id, username, avatar, status, current_mood_id 
            FROM users 
            WHERE current_mood_id = ?
            ORDER BY id DESC
            LIMIT 20`, [sanitizedMoodId]);

        console.log(`Debug: Found ${rows.length} users for mood ${sanitizedMoodId}:`, rows.map(r => ({id: r.id, name: r.username})));

        const users = rows.map(row => ({
            id: row.id,
            name: row.username,
            avatar: row.avatar,
            status: row.status,
            moodId: row.current_mood_id
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get latest mood for a user
app.get('/api/mood/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY id DESC LIMIT 1', [sanitizedUserId]);
        const row = rows[0];
        res.json(row ? { id: row.mood_id } : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set mood for a user
app.post('/api/mood', async (req, res) => {
    try {
        const { userId, moodId } = req.body;

        // Validate inputs
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const moodValidation = validateMoodId(moodId);
        if (!moodValidation.valid) {
            res.status(400).json({ error: moodValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        const sanitizedMoodId = moodValidation.sanitized;

        // Update user's current mood
        await db.query('UPDATE users SET current_mood_id = ?, last_active = datetime("now") WHERE id = ?', [sanitizedMoodId, sanitizedUserId]);

        // Log mood change
        let moodLogId = null;
        try {
            const result = await db.query('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [sanitizedUserId, sanitizedMoodId]);
            moodLogId = result.rows[0]?.id;
        } catch (err) {
            console.error('Failed to log mood change:', err);
            // Continue without logging mood change
        }

        res.json({ id: moodLogId, userId: sanitizedUserId, moodId: sanitizedMoodId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get journal entries for a user
app.get('/api/journal/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC', [sanitizedUserId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save journal entry
app.post('/api/journal', async (req, res) => {
    try {
        const { userId, text, date, time } = req.body;
        // Validate inputs
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const textValidation = validateJournalText(text);
        if (!textValidation.valid) {
            res.status(400).json({ error: textValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        const sanitizedText = textValidation.sanitized;

        const result = await db.query(
            'INSERT INTO journal_entries (user_id, text, date, time) VALUES (?, ?, ?, ?)',
            [sanitizedUserId, sanitizedText, date, time]
        );
        const journalId = result.rows[0]?.id;
        res.json({ id: journalId, userId, text, date, time });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Report a user
app.post('/api/report', async (req, res) => {
    try {
        const { reporterId, reportedId, reason } = req.body;

        // Validate inputs (Basic)
        if (!reporterId || !reportedId || !reason) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        await db.query(
            'INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)',
            [reporterId, reportedId, reason]
        );

        res.json({ success: true, message: 'User reported successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Block a user
app.post('/api/block', async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;

        if (!blockerId || !blockedId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        await db.query(
            'INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, blockedId]
        );

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get blocked users for a user
app.get('/api/blocks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { rows } = await db.query(
            'SELECT blocked_id FROM blocked_users WHERE blocker_id = ?',
            [userId]
        );
        res.json(rows.map(r => r.blocked_id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages for a room (History)
app.get('/api/messages/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { sinceId } = req.query;
        const { userId } = req.query;
        const roomValidation = validateRoomId(roomId);
        if (!roomValidation.valid) {
            res.status(400).json({ error: roomValidation.error });
            return;
        }
        const sanitizedRoomId = roomValidation.sanitized;
        let targetUserId = null;
        if (userId !== undefined) {
            const userIdValidation = validateUserId(userId);
            if (!userIdValidation.valid) {
                res.status(400).json({ error: userIdValidation.error });
                return;
            }
            targetUserId = userIdValidation.sanitized;
        }
        const EPHEMERAL_TTL_MS = 2 * 60 * 1000;
        const isEphemeralSystemText = (row) => {
            if (!row || row.user !== 'System' || !row.text) return false;
            return row.text.includes('sent you a chat request') ||
                row.text.includes('accepted your chat request');
        };
        const parseTimestampMs = (ts) => {
            if (!ts) return null;
            if (typeof ts === 'number') return ts;
            const raw = String(ts);
            const normalized = raw.includes(' ') && !raw.includes('T')
                ? raw.replace(' ', 'T')
                : raw;
            const parsed = Date.parse(normalized);
            return Number.isNaN(parsed) ? null : parsed;
        };
        const isExpiredEphemeral = (row) => {
            if (!isEphemeralSystemText(row)) return false;
            const ms = parseTimestampMs(row.timestamp);
            if (!ms) return true;
            return Date.now() - ms > EPHEMERAL_TTL_MS;
        };

        let rows = [];
        const parsedSinceId = parseInt(sinceId, 10);
        if (Number.isInteger(parsedSinceId) && parsedSinceId > 0) {
            const result = await db.query(`
                SELECT m.*, u.avatar 
                FROM messages m 
                LEFT JOIN users u ON m.user_id = u.id 
                WHERE m.room_id = ? AND m.id > ?
                ${targetUserId ? 'AND (m.target_user_id IS NULL OR m.target_user_id = ?)' : ''}
                ORDER BY m.id ASC`, targetUserId
                    ? [sanitizedRoomId, parsedSinceId, targetUserId]
                    : [sanitizedRoomId, parsedSinceId]);
            rows = result.rows;
        } else {
            const result = await db.query(`
                SELECT m.*, u.avatar 
                FROM messages m 
                LEFT JOIN users u ON m.user_id = u.id 
                WHERE m.room_id = ?
                ${targetUserId ? 'AND (m.target_user_id IS NULL OR m.target_user_id = ?)' : ''}
                ORDER BY m.id ASC`, targetUserId
                    ? [sanitizedRoomId, targetUserId]
                    : [sanitizedRoomId]);
            rows = result.rows;
        }
        rows = rows.filter(row => !isExpiredEphemeral(row));

        try {
            const { rows: countRows } = await db.query(
                'SELECT COUNT(*) as total FROM messages WHERE room_id = ?',
                [sanitizedRoomId]
            );
            const total = countRows[0]?.total ?? rows.length;
            console.log(`[messages] room=${sanitizedRoomId} userId=${targetUserId ?? 'all'} sinceId=${parsedSinceId || 0} returned=${rows.length} total=${total}`);
        } catch (e) {
            console.log(`[messages] room=${sanitizedRoomId} sinceId=${parsedSinceId || 0} returned=${rows.length}`);
        }

            // Transform snake_case to camelCase for frontend
        const messages = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            user: row.user,
            text: row.text,
            time: row.time,
                avatar: row.avatar,
                targetUserId: row.target_user_id ?? null,
                timestamp: row.timestamp,
                clientId: row.client_id || null
        }));
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { roomId, userId, user, text, time, clientId } = req.body;
        const textValidation = validateMessageText(text);
        if (!textValidation.valid) {
            res.status(400).json({ error: textValidation.error });
            return;
        }
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }
        const roomValidation = validateRoomId(roomId);
        if (!roomValidation.valid) {
            res.status(400).json({ error: roomValidation.error });
            return;
        }

        const sanitizedText = textValidation.sanitized;
        const sanitizedUserId = userIdValidation.sanitized;
        const sanitizedRoomId = roomValidation.sanitized;
        const sanitizedUser = user ? user.toString().trim().substring(0, 30) : 'Anonymous';

        if (clientId) {
            const { rows: existingRows } = await db.query(`
                SELECT m.*, u.avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ? AND m.client_id = ?
                LIMIT 1
            `, [sanitizedRoomId, clientId]);
            if (existingRows.length > 0) {
                const row = existingRows[0];
                const existingMsg = {
                    id: row.id,
                    roomId: row.room_id,
                    userId: row.user_id,
                    user: row.user,
                    text: row.text,
                    time: row.time,
                    avatar: row.avatar || null,
                    clientId: row.client_id || null,
                    timestamp: row.timestamp
                };
                io.to(sanitizedRoomId).emit('receive_message', existingMsg);
                if (sanitizedRoomId.startsWith('private_')) {
                    const privateRoomId = parseInt(sanitizedRoomId.replace('private_', ''), 10);
                    if (!Number.isNaN(privateRoomId)) {
                        const { rows: roomRows } = await db.query(
                            'SELECT user1_id, user2_id FROM private_chat_rooms WHERE id = ?',
                            [privateRoomId]
                        );
                        const roomRow = roomRows[0];
                        if (roomRow?.user1_id) {
                            io.to(`user_${roomRow.user1_id}`).emit('receive_message', existingMsg);
                        }
                        if (roomRow?.user2_id) {
                            io.to(`user_${roomRow.user2_id}`).emit('receive_message', existingMsg);
                        }
                    }
                }
                res.json(existingMsg);
                return;
            }
        }

        await db.query(
            'INSERT INTO messages (room_id, user_id, "user", text, time, client_id) VALUES (?, ?, ?, ?, ?, ?)',
            [sanitizedRoomId, sanitizedUserId, sanitizedUser, sanitizedText, time, clientId || null]
        );

        let savedRow = null;
        if (clientId) {
            const { rows: byClientRows } = await db.query(`
                SELECT m.*, u.avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ? AND m.client_id = ?
                ORDER BY m.id DESC
                LIMIT 1
            `, [sanitizedRoomId, clientId]);
            savedRow = byClientRows[0] || null;
        }
        if (!savedRow) {
            const { rows: lastRows } = await db.query(`
                SELECT m.*, u.avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ?
                ORDER BY m.id DESC
                LIMIT 1
            `, [sanitizedRoomId]);
            savedRow = lastRows[0] || null;
        }

        const savedMsg = {
            id: savedRow?.id,
            roomId: sanitizedRoomId,
            userId: sanitizedUserId,
            user: sanitizedUser,
            text: sanitizedText,
            time,
            avatar: savedRow?.avatar || null,
            clientId: clientId || null,
            timestamp: savedRow?.timestamp || null
        };

        io.to(sanitizedRoomId).emit('receive_message', savedMsg);
        if (sanitizedRoomId.startsWith('private_')) {
            const privateRoomId = parseInt(sanitizedRoomId.replace('private_', ''), 10);
            if (!Number.isNaN(privateRoomId)) {
                const { rows: roomRows } = await db.query(
                    'SELECT user1_id, user2_id FROM private_chat_rooms WHERE id = ?',
                    [privateRoomId]
                );
                const roomRow = roomRows[0];
                if (roomRow?.user1_id) {
                    io.to(`user_${roomRow.user1_id}`).emit('receive_message', savedMsg);
                }
                if (roomRow?.user2_id) {
                    io.to(`user_${roomRow.user2_id}`).emit('receive_message', savedMsg);
                }
                if (roomRow?.user1_id && savedMsg.id) {
                    await db.query('INSERT OR IGNORE INTO message_deliveries (message_id, user_id) VALUES (?, ?)', [savedMsg.id, roomRow.user1_id]);
                }
                if (roomRow?.user2_id && savedMsg.id) {
                    await db.query('INSERT OR IGNORE INTO message_deliveries (message_id, user_id) VALUES (?, ?)', [savedMsg.id, roomRow.user2_id]);
                }
                if (savedMsg.id) {
                    await db.query('UPDATE message_deliveries SET delivered_at = CURRENT_TIMESTAMP WHERE message_id = ? AND user_id = ?', [savedMsg.id, sanitizedUserId]);
                }
            }
        }

        res.json(savedMsg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/undelivered/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }
        const sanitizedUserId = userIdValidation.sanitized;
        const EPHEMERAL_TTL_MS = 2 * 60 * 1000;
        const isEphemeralSystemText = (row) => {
            if (!row || row.user !== 'System' || !row.text) return false;
            return row.text.includes('sent you a chat request') ||
                row.text.includes('accepted your chat request');
        };
        const parseTimestampMs = (ts) => {
            if (!ts) return null;
            if (typeof ts === 'number') return ts;
            const raw = String(ts);
            const normalized = raw.includes(' ') && !raw.includes('T')
                ? raw.replace(' ', 'T')
                : raw;
            const parsed = Date.parse(normalized);
            return Number.isNaN(parsed) ? null : parsed;
        };
        const isExpiredEphemeral = (row) => {
            if (!isEphemeralSystemText(row)) return false;
            const ms = parseTimestampMs(row.timestamp);
            if (!ms) return true;
            return Date.now() - ms > EPHEMERAL_TTL_MS;
        };

        const { rows } = await db.query(`
            SELECT m.*, u.avatar
            FROM message_deliveries md
            JOIN messages m ON md.message_id = m.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE md.user_id = ? AND md.delivered_at IS NULL AND m.room_id LIKE 'private_%'
            ORDER BY m.id ASC
        `, [sanitizedUserId]);

        const expiredIds = rows.filter(isExpiredEphemeral).map(row => row.id);
        if (expiredIds.length > 0) {
            const placeholders = expiredIds.map(() => '?').join(',');
            await db.query(
                `UPDATE message_deliveries SET delivered_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND message_id IN (${placeholders})`,
                [sanitizedUserId, ...expiredIds]
            );
        }

        const filteredRows = rows.filter(row => !isExpiredEphemeral(row));
        const messages = filteredRows.map(row => ({
            id: row.id,
            userId: row.user_id,
            user: row.user,
            text: row.text,
            time: row.time,
            avatar: row.avatar,
            targetUserId: row.target_user_id ?? null,
            timestamp: row.timestamp,
            clientId: row.client_id || null,
            roomId: row.room_id
        }));
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages/ack', async (req, res) => {
    try {
        const { userId, messageIds } = req.body;
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            res.status(400).json({ error: 'messageIds must be a non-empty array' });
            return;
        }
        const sanitizedUserId = userIdValidation.sanitized;
        const ids = messageIds.map(id => parseInt(id, 10)).filter(n => Number.isInteger(n) && n > 0);
        if (ids.length === 0) {
            res.status(400).json({ error: 'No valid message IDs' });
            return;
        }
        const placeholders = ids.map(() => '?').join(',');
        await db.query(
            `UPDATE message_deliveries SET delivered_at = CURRENT_TIMESTAMP WHERE user_id = ? AND message_id IN (${placeholders})`,
            [sanitizedUserId, ...ids]
        );
        res.json({ success: true, count: ids.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Heart notification endpoints
app.post('/api/heart', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // Validate input
        const senderValidation = validateUserId(senderId);
        if (!senderValidation.valid) {
            res.status(400).json({ error: senderValidation.error });
            return;
        }

        const receiverValidation = validateUserId(receiverId);
        if (!receiverValidation.valid) {
            res.status(400).json({ error: receiverValidation.error });
            return;
        }

        const heartValidation = validateHeartNotification(senderId, receiverId);
        if (!heartValidation.valid) {
            res.status(400).json({ error: heartValidation.error });
            return;
        }

        const sanitizedSenderId = senderValidation.sanitized;
        const sanitizedReceiverId = receiverValidation.sanitized;

        // Insert or update heart notification
        try {
            await db.query(`
                INSERT OR REPLACE INTO heart_notifications (sender_id, receiver_id, is_read) 
                VALUES (?, ?, FALSE)
            `, [sanitizedSenderId, sanitizedReceiverId]);
        } catch (err) {
            // If unique constraint violation, just update is_read to false
            await db.query(`
                UPDATE heart_notifications 
                SET is_read = FALSE, created_at = CURRENT_TIMESTAMP 
                WHERE sender_id = ? AND receiver_id = ?
            `, [sanitizedSenderId, sanitizedReceiverId]);
        }

        // Send real-time notification to receiver
        const { rows: receiverRows } = await db.query('SELECT username FROM users WHERE id = ?', [sanitizedReceiverId]);
        const { rows: senderRows } = await db.query('SELECT username FROM users WHERE id = ?', [sanitizedSenderId]);
        
        if (receiverRows.length > 0 && senderRows.length > 0) {
            const notification = {
                type: 'heart',
                senderId: sanitizedSenderId,
                senderUsername: senderRows[0].username,
                receiverId: sanitizedReceiverId,
                message: `${senderRows[0].username} sent you a heart! ❤️`
            };
            
            io.emit(`heart_notification_${sanitizedReceiverId}`, notification);
        }

        res.json({ success: true, message: 'Heart sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get heart notifications for a user
app.get('/api/hearts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        const { rows } = await db.query(`
            SELECT hn.*, u.username as sender_username, u.avatar as sender_avatar
            FROM heart_notifications hn
            JOIN users u ON hn.sender_id = u.id
            WHERE hn.receiver_id = ?
            ORDER BY hn.created_at DESC
            LIMIT 20
        `, [sanitizedUserId]);

        const notifications = rows.map(row => ({
            id: row.id,
            senderId: row.sender_id,
            senderUsername: row.sender_username,
            senderAvatar: row.sender_avatar,
            isRead: Boolean(row.is_read),
            createdAt: row.created_at
        }));

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark heart notifications as read
app.patch('/api/hearts/:userId/read', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        await db.query(`
            UPDATE heart_notifications 
            SET is_read = TRUE 
            WHERE receiver_id = ?
        `, [sanitizedUserId]);

        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete all heart notifications for a user
app.delete('/api/hearts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        await db.query(`
            DELETE FROM heart_notifications 
            WHERE receiver_id = ?
        `, [sanitizedUserId]);

        res.json({ success: true, message: 'All heart notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Private chat request endpoints
app.post('/api/private-chat/request', async (req, res) => {
    try {
        const { requesterId, requestedId } = req.body;

        const requesterValidation = validateUserId(requesterId);
        if (!requesterValidation.valid) {
            res.status(400).json({ error: requesterValidation.error });
            return;
        }

        const requestedValidation = validateUserId(requestedId);
        if (!requestedValidation.valid) {
            res.status(400).json({ error: requestedValidation.error });
            return;
        }

        if (requesterId === requestedId) {
            res.status(400).json({ error: 'Cannot request private chat with yourself' });
            return;
        }

        const sanitizedRequesterId = requesterValidation.sanitized;
        const sanitizedRequestedId = requestedValidation.sanitized;

        // Check if request already exists
        const { rows: existingRequests } = await db.query(`
            SELECT id, status FROM private_chat_requests 
            WHERE (requester_id = ? AND requested_id = ?) OR (requester_id = ? AND requested_id = ?)
        `, [sanitizedRequesterId, sanitizedRequestedId, sanitizedRequestedId, sanitizedRequesterId]);

        let requestId = null;
        let shouldNotify = true;
        if (existingRequests.length > 0) {
            const existing = existingRequests[0];
            if (existing.status === 'pending') {
                requestId = existing.id;
                shouldNotify = false;
            }
            // Reset existing request to pending (reuse same row due to unique constraint)
            if (existing.status !== 'pending') {
                await db.query(`
                    UPDATE private_chat_requests
                    SET requester_id = ?, requested_id = ?, status = 'pending',
                        created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [sanitizedRequesterId, sanitizedRequestedId, existing.id]);
                requestId = existing.id;
            }
        } else {
            // Create new chat request
            const result = await db.query(`
                INSERT INTO private_chat_requests (requester_id, requested_id) 
                VALUES (?, ?)
            `, [sanitizedRequesterId, sanitizedRequestedId]);
            requestId = result.rows[0]?.id;
        }

        // Ensure private room exists so sender can enter immediately
        let roomId = null;
        const { rows: existingRooms } = await db.query(`
            SELECT id FROM private_chat_rooms
            WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
            AND is_active = TRUE
        `, [sanitizedRequesterId, sanitizedRequestedId, sanitizedRequestedId, sanitizedRequesterId]);

        if (existingRooms.length > 0) {
            roomId = existingRooms[0].id;
        } else {
            const roomResult = await db.query(`
                INSERT INTO private_chat_rooms (room_name, user1_id, user2_id) 
                VALUES (?, ?, ?)
            `, [`private_${sanitizedRequesterId}_${sanitizedRequestedId}`, sanitizedRequesterId, sanitizedRequestedId]);
            roomId = roomResult.rows[0]?.id;
        }

        const { rows: requesterRows } = await db.query('SELECT username, avatar FROM users WHERE id = ?', [sanitizedRequesterId]);
        
        // Send real-time notification to requested user
        if (shouldNotify && requesterRows.length > 0) {
            const notification = {
                type: 'private_chat_request',
                requestId: requestId,
                requesterId: sanitizedRequesterId,
                requesterUsername: requesterRows[0].username,
                requesterAvatar: requesterRows[0].avatar || null,
                createdAt: new Date().toISOString(),
                message: `${requesterRows[0].username} wants to start a private chat 💬`
            };
            
            console.log(`Emitting chat request notification to user ${sanitizedRequestedId}:`, notification);
            // Send to user-specific room (more reliable than io.emit)
            io.to(`user_${sanitizedRequestedId}`).emit(`private_chat_request_${sanitizedRequestedId}`, notification);
            // Also emit globally as fallback
            io.emit(`private_chat_request_${sanitizedRequestedId}`, notification);
        }

        // Add system message to private room so recipient sees request in history
        if (shouldNotify && roomId && requesterRows.length > 0) {
            const roomKey = `private_${roomId}`;
            const systemText = `${requesterRows[0].username} sent you a chat request.`;
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const { rows: existingSystemRows } = await db.query(
                `SELECT id, timestamp FROM messages
                 WHERE room_id = ? AND "user" = 'System' AND text = ? AND target_user_id = ?
                 ORDER BY id DESC LIMIT 1`,
                [roomKey, systemText, sanitizedRequestedId]
            );
            const existingSystem = existingSystemRows[0];

            if (!existingSystem) {
                const insertResult = await db.query(
                    'INSERT INTO messages (room_id, user_id, "user", text, time, target_user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [roomKey, null, 'System', systemText, time, sanitizedRequestedId]
                );
                const systemMessageId = insertResult.rows[0]?.id;
                let messageTimestamp = null;
                if (systemMessageId) {
                    const { rows: tsRows } = await db.query('SELECT timestamp FROM messages WHERE id = ?', [systemMessageId]);
                    messageTimestamp = tsRows[0]?.timestamp || null;
                }

                io.to(roomKey).emit('receive_message', {
                    id: systemMessageId || Date.now(),
                    roomId: roomKey,
                    userId: null,
                    user: 'System',
                    text: systemText,
                    time,
                    avatar: null,
                    targetUserId: sanitizedRequestedId,
                    timestamp: messageTimestamp
                });
            }
        }

        res.json({ success: true, requestId: requestId, roomId: roomId, status: 'pending' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get or create a private room for two users
app.get('/api/private-chat/room', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.query;
        const user1Validation = validateUserId(user1Id);
        const user2Validation = validateUserId(user2Id);
        if (!user1Validation.valid || !user2Validation.valid) {
            res.status(400).json({ error: 'Invalid user IDs' });
            return;
        }
        const user1 = user1Validation.sanitized;
        const user2 = user2Validation.sanitized;

        const { rows: existingRooms } = await db.query(`
            SELECT id FROM private_chat_rooms
            WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
            AND is_active = TRUE
        `, [user1, user2, user2, user1]);

        let roomId = null;
        if (existingRooms.length > 0) {
            roomId = existingRooms[0].id;
        } else {
            const roomResult = await db.query(`
                INSERT INTO private_chat_rooms (room_name, user1_id, user2_id) 
                VALUES (?, ?, ?)
            `, [`private_${user1}_${user2}`, user1, user2]);
            roomId = roomResult.rows[0]?.id;
        }

        res.json({ success: true, roomId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Respond to private chat request
app.post('/api/private-chat/respond', async (req, res) => {
    try {
        const { requestId, userId, response } = req.body; // response: 'accept' or 'reject'
        
        console.log('Chat respond request received:', { requestId, userId, response, types: { requestId: typeof requestId, userId: typeof userId } });

        if (!['accept', 'reject'].includes(response)) {
            res.status(400).json({ error: 'Invalid response' });
            return;
        }

        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        // Validate and sanitize requestId
        const requestIdValidation = validateUserId(requestId);
        if (!requestIdValidation.valid) {
            res.status(400).json({ error: 'Invalid request ID' });
            return;
        }
        const sanitizedRequestId = requestIdValidation.sanitized;

        // First check if request exists and get its data
        console.log('Checking for request:', { requestId: sanitizedRequestId, userId: sanitizedUserId });
        const { rows: existingRows } = await db.query(`
            SELECT requester_id, requested_id, status FROM private_chat_requests 
            WHERE id = ? AND requested_id = ? AND status = 'pending'
        `, [sanitizedRequestId, sanitizedUserId]);
        
        console.log('Request lookup result:', { 
            found: existingRows.length > 0, 
            rows: existingRows,
            queryParams: [sanitizedRequestId, sanitizedUserId]
        });

        if (existingRows.length === 0) {
            // Check if request exists but with different status
            const { rows: statusRows } = await db.query(`
                SELECT id, requester_id, requested_id, status FROM private_chat_requests 
                WHERE id = ? AND requested_id = ?
            `, [sanitizedRequestId, sanitizedUserId]);
            
            if (statusRows.length > 0) {
                console.log('Request found but wrong status:', statusRows[0]);
                res.status(400).json({ error: `Request already ${statusRows[0].status}` });
            } else {
                // Check if request exists at all
                const { rows: anyRows } = await db.query(`
                    SELECT id, requester_id, requested_id, status FROM private_chat_requests 
                    WHERE id = ?
                `, [sanitizedRequestId]);
                
                if (anyRows.length > 0) {
                    console.log('Request found but userId mismatch:', { 
                        request: anyRows[0], 
                        providedUserId: sanitizedUserId 
                    });
                    res.status(403).json({ error: 'Request not found for this user' });
                } else {
                    console.log('Request not found at all:', { requestId: sanitizedRequestId });
                    res.status(404).json({ error: 'Request not found' });
                }
            }
            return;
        }

        const request = existingRows[0];

        // Update request status
        console.log('Updating request:', { requestId: sanitizedRequestId, userId: sanitizedUserId, response });
        
        await db.query(`
            UPDATE private_chat_requests 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND requested_id = ?
        `, [response === 'accept' ? 'accepted' : 'rejected', sanitizedRequestId, sanitizedUserId]);
        let roomId = null;

        if (response === 'accept') {
            // Check for existing active private room
            const { rows: existingRooms } = await db.query(`
                SELECT id FROM private_chat_rooms
                WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
                AND is_active = TRUE
            `, [request.requester_id, request.requested_id, request.requested_id, request.requester_id]);

            if (existingRooms.length > 0) {
                roomId = existingRooms[0].id;
            } else {
                // Create private chat room
                const roomResult = await db.query(`
                    INSERT INTO private_chat_rooms (room_name, user1_id, user2_id) 
                    VALUES (?, ?, ?)
                `, [`private_${request.requester_id}_${request.requested_id}`, request.requester_id, request.requested_id]);
                
                roomId = roomResult.rows[0]?.id;
            }

            // Notify both users
            const notification = {
                type: 'private_chat_accepted',
                roomId: roomId,
                requesterId: request.requester_id,
                requestedId: request.requested_id,
                createdAt: new Date().toISOString(),
                message: 'Private chat started! 💬'
            };
            
            io.to(`user_${request.requester_id}`).emit(`private_chat_accepted_${request.requester_id}`, notification);
            io.to(`user_${request.requested_id}`).emit(`private_chat_accepted_${request.requested_id}`, notification);
            // Also emit globally as fallback
            io.emit(`private_chat_accepted_${request.requester_id}`, notification);
            io.emit(`private_chat_accepted_${request.requested_id}`, notification);

            // Add system message to the private room
            if (roomId) {
                const roomKey = `private_${roomId}`;
                const { rows: requesterRows } = await db.query('SELECT username FROM users WHERE id = ?', [request.requester_id]);
                const { rows: requestedRows } = await db.query('SELECT username FROM users WHERE id = ?', [request.requested_id]);
                const requesterName = requesterRows[0]?.username || 'User';
                const requestedName = requestedRows[0]?.username || 'User';
                const systemText = `${requestedName} accepted your chat request.`;
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const { rows: existingSystemRows } = await db.query(
                    `SELECT id, timestamp FROM messages
                     WHERE room_id = ? AND "user" = 'System' AND text = ? AND target_user_id = ?
                     ORDER BY id DESC LIMIT 1`,
                    [roomKey, systemText, request.requester_id]
                );
                const existingSystem = existingSystemRows[0];

                if (!existingSystem) {
                    const insertResult = await db.query(
                        'INSERT INTO messages (room_id, user_id, "user", text, time, target_user_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [roomKey, null, 'System', systemText, time, request.requester_id]
                    );
                    const systemMessageId = insertResult.rows[0]?.id;
                    let messageTimestamp = null;
                    if (systemMessageId) {
                        const { rows: tsRows } = await db.query('SELECT timestamp FROM messages WHERE id = ?', [systemMessageId]);
                        messageTimestamp = tsRows[0]?.timestamp || null;
                    }

                    io.to(roomKey).emit('receive_message', {
                        id: systemMessageId || Date.now(),
                        roomId: roomKey,
                        userId: null,
                        user: 'System',
                        text: systemText,
                        time,
                        avatar: null,
                        targetUserId: request.requester_id,
                        timestamp: messageTimestamp
                    });
                }
            }
        } else {
            // Notify requester of rejection
            const notification = {
                type: 'private_chat_rejected',
                message: 'Private chat request was declined'
            };
            
            io.to(`user_${request.requester_id}`).emit(`private_chat_rejected_${request.requester_id}`, notification);
            // Also emit globally as fallback
            io.emit(`private_chat_rejected_${request.requester_id}`, notification);
        }

        res.json({ 
            success: true, 
            status: response,
            roomId: roomId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get pending chat requests for a user
app.get('/api/private-chat/requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        const { rows } = await db.query(`
            SELECT pcr.*, u.username as requester_username, u.avatar as requester_avatar
            FROM private_chat_requests pcr
            JOIN users u ON pcr.requester_id = u.id
            WHERE pcr.requested_id = ? AND pcr.status = 'pending'
            ORDER BY pcr.created_at DESC
            LIMIT 20
        `, [sanitizedUserId]);

        console.log(`Fetched ${rows.length} pending chat requests for user ${sanitizedUserId}`);

        const requests = rows.map(row => {
            // Convert SQLite timestamp to ISO string
            let createdAt = new Date().toISOString();
            if (row.created_at) {
                // SQLite timestamps can be in format "YYYY-MM-DD HH:MM:SS"
                const dateStr = row.created_at.toString();
                // Try parsing as-is first (if already ISO)
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    createdAt = parsed.toISOString();
                } else {
                    // Try SQLite format: "YYYY-MM-DD HH:MM:SS"
                    const sqliteFormat = dateStr.replace(' ', 'T');
                    const parsed2 = new Date(sqliteFormat);
                    if (!isNaN(parsed2.getTime())) {
                        createdAt = parsed2.toISOString();
                    }
                }
            }
            return {
                id: row.id,
                requesterId: row.requester_id,
                requesterUsername: row.requester_username,
                requesterAvatar: row.requester_avatar,
                createdAt: createdAt
            };
        });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete all pending chat requests for a user
app.delete('/api/private-chat/requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        
        await db.query(`
            DELETE FROM private_chat_requests 
            WHERE requested_id = ? AND status = 'pending'
        `, [sanitizedUserId]);

        res.json({ success: true, message: 'All pending chat requests cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Only start server if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    initializeDatabaseTables().then(() => {
        httpServer.listen(port, '0.0.0.0', () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    }).catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
