import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import server app
let app;
let testDbPath;

beforeAll(async () => {
    // Set test database path BEFORE importing server
    process.env.DB_PATH = path.join(__dirname, '../test-notifications.db');
    testDbPath = process.env.DB_PATH;
    
    // Remove existing test database for clean start
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
    
    // Import server after setting env - this will use the test DB
    const serverModule = await import('../index.js');
    app = serverModule.app;
    
    if (!app) {
        throw new Error('Could not import app from server/index.js');
    }
    
    // Initialize database tables
    await serverModule.initializeDatabaseTables();
});

afterAll(async () => {
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
});

describe('Notification API Integration Tests', () => {
    let user1Id, user2Id;

    beforeEach(async () => {
        // Create test users for each test
        const user1Res = await request(app)
            .post('/api/users')
            .send({ username: `TestUser1_${Date.now()}` });
        user1Id = parseInt(user1Res.body.id);

        const user2Res = await request(app)
            .post('/api/users')
            .send({ username: `TestUser2_${Date.now()}` });
        user2Id = parseInt(user2Res.body.id);
    });

    describe('Heart Notifications', () => {
        it('should send a heart notification', async () => {
            const res = await request(app)
                .post('/api/heart')
                .send({
                    senderId: user1Id,
                    receiverId: user2Id
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should retrieve heart notifications for a user', async () => {
            // First send a heart
            await request(app)
                .post('/api/heart')
                .send({
                    senderId: user1Id,
                    receiverId: user2Id
                });

            // Then retrieve notifications
            const res = await request(app)
                .get(`/api/hearts/${user2Id}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('senderId', user1Id);
        });

        it('should mark heart notifications as read', async () => {
            // Send a heart first
            await request(app)
                .post('/api/heart')
                .send({
                    senderId: user1Id,
                    receiverId: user2Id
                });

            // Mark as read
            const res = await request(app)
                .patch(`/api/hearts/${user2Id}/read`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify they're marked as read
            const notificationsRes = await request(app)
                .get(`/api/hearts/${user2Id}`);

            expect(notificationsRes.body.every(n => n.isRead === true)).toBe(true);
        });

        it('should delete all heart notifications for a user', async () => {
            // Send multiple hearts
            await request(app)
                .post('/api/heart')
                .send({
                    senderId: user1Id,
                    receiverId: user2Id
                });

            // Delete all notifications
            const res = await request(app)
                .delete(`/api/hearts/${user2Id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify they're deleted
            const notificationsRes = await request(app)
                .get(`/api/hearts/${user2Id}`);

            expect(notificationsRes.body.length).toBe(0);
        });

        it('should filter notifications to last 24 hours', async () => {
            // This test would require manipulating timestamps in the database
            // For now, we'll just verify the endpoint returns recent notifications
            await request(app)
                .post('/api/heart')
                .send({
                    senderId: user1Id,
                    receiverId: user2Id
                });

            const res = await request(app)
                .get(`/api/hearts/${user2Id}`);

            expect(res.statusCode).toBe(200);
            // Verify all returned notifications are recent
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            res.body.forEach(notification => {
                const createdAt = new Date(notification.createdAt).getTime();
                expect(createdAt).toBeGreaterThan(oneDayAgo);
            });
        });
    });

    describe('Chat Requests', () => {
        it('should create a private chat request', async () => {
            const res = await request(app)
                .post('/api/private-chat/request')
                .send({
                    requesterId: user1Id,
                    requestedId: user2Id
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.requestId).toBeDefined();
        });

        it('should retrieve pending chat requests for a user', async () => {
            // Create a request first
            await request(app)
                .post('/api/private-chat/request')
                .send({
                    requesterId: user1Id,
                    requestedId: user2Id
                });

            // Retrieve requests
            const res = await request(app)
                .get(`/api/private-chat/requests/${user2Id}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('requesterId', user1Id);
        });

        it('should accept a chat request', async () => {
            // Create a request
            const requestRes = await request(app)
                .post('/api/private-chat/request')
                .send({
                    requesterId: user1Id,
                    requestedId: user2Id
                });

            const requestId = requestRes.body.requestId;

            // Accept the request
            const res = await request(app)
                .post('/api/private-chat/respond')
                .send({
                    requestId: requestId,
                    userId: user2Id,
                    response: 'accept'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.roomId).toBeDefined();

            // Verify request is no longer pending
            const requestsRes = await request(app)
                .get(`/api/private-chat/requests/${user2Id}`);

            expect(requestsRes.body.length).toBe(0);
        });

        it('should reject a chat request', async () => {
            // Create a request
            const requestRes = await request(app)
                .post('/api/private-chat/request')
                .send({
                    requesterId: user1Id,
                    requestedId: user2Id
                });

            expect(requestRes.statusCode).toBe(200);
            const requestId = requestRes.body.requestId;
            expect(requestId).toBeDefined();

            // Reject the request
            const res = await request(app)
                .post('/api/private-chat/respond')
                .send({
                    requestId: parseInt(requestId),
                    userId: user2Id,
                    response: 'reject'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify request is no longer pending
            const requestsRes = await request(app)
                .get(`/api/private-chat/requests/${user2Id}`);

            expect(requestsRes.body.length).toBe(0);
        });

        it('should delete all pending chat requests for a user', async () => {
            // Create multiple requests
            await request(app)
                .post('/api/private-chat/request')
                .send({
                    requesterId: user1Id,
                    requestedId: user2Id
                });

            // Delete all requests
            const res = await request(app)
                .delete(`/api/private-chat/requests/${user2Id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify they're deleted
            const requestsRes = await request(app)
                .get(`/api/private-chat/requests/${user2Id}`);

            expect(requestsRes.body.length).toBe(0);
        });
    });
});
