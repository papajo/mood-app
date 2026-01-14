import 'dotenv/config';
import db, { initializeDatabase } from './db.js';

async function renameTestUsers() {
    try {
        await initializeDatabase();
        
        // Get all users with synthetic names (exclude authenticated users with emails)
        const { rows: users } = await db.query(`
            SELECT id, username, email
            FROM users 
            WHERE (username LIKE 'MoodTest%' 
               OR username LIKE 'TestUser%' 
               OR username LIKE 'GetTest%')
            AND (email IS NULL OR email = '')
            ORDER BY id
        `);
        
        if (users.length === 0) {
            console.log('No synthetic test users found to rename.');
            return;
        }
        
        console.log(`Found ${users.length} synthetic users to rename...`);
        
        let userNumber = 1;
        for (const user of users) {
            const newUsername = `User${userNumber}`;
            
            // Check if username already exists
            const { rows: existing } = await db.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [newUsername, user.id]
            );
            
            if (existing.length > 0) {
                console.log(`⚠️  Skipping ${user.username} (ID: ${user.id}) - User${userNumber} already exists`);
                userNumber++;
                continue;
            }
            
            // Update username
            await db.query(
                'UPDATE users SET username = ? WHERE id = ?',
                [newUsername, user.id]
            );
            
            console.log(`✅ Renamed ${user.username} (ID: ${user.id}) → ${newUsername}`);
            userNumber++;
        }
        
        console.log(`\n✅ Renamed ${userNumber - 1} users successfully!`);
        
    } catch (err) {
        console.error('❌ Error renaming users:', err);
        process.exit(1);
    }
}

renameTestUsers().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
