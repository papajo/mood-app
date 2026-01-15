import 'dotenv/config';
import bcrypt from 'bcrypt';
import db, { initializeDatabase } from './db.js';

async function createDemoUser() {
    try {
        await initializeDatabase();
        
        const username = 'demo';
        const email = 'demo@moodapp.com';
        const password = 'demo123';
        
        // Check if demo user already exists
        const { rows: existingUsers } = await db.query(
            'SELECT id, username, email FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existingUsers.length > 0) {
            console.log('Demo user already exists:');
            console.log(`  ID: ${existingUsers[0].id}`);
            console.log(`  Username: ${existingUsers[0].username}`);
            console.log(`  Email: ${existingUsers[0].email}`);
            console.log(`  Password: ${password}`);
            return;
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create demo user
        const defaultAvatar = `https://i.pravatar.cc/150?u=${email}`;
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash, avatar, status) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, defaultAvatar, 'Demo user - ready to test! 🎉']
        );
        
        const userId = result.rows[0]?.id;
        
        console.log('✅ Demo user created successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log(`  Email: ${email}`);
        console.log(`  Password: ${password}`);
        console.log(`  User ID: ${userId}`);
        console.log('');
        console.log('You can now use these credentials to test the authentication system.');
        
    } catch (err) {
        console.error('❌ Error creating demo user:', err);
        process.exit(1);
    }
}

createDemoUser().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
