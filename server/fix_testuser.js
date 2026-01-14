import 'dotenv/config';
import db, { initializeDatabase } from './db.js';

async function fixTestUser() {
    try {
        await initializeDatabase();
        
        // Restore testuser username and set mood
        const { rows } = await db.query('SELECT id, username, email, current_mood_id FROM users WHERE email = ?', ['test@test.com']);
        
        if (rows.length === 0) {
            console.log('❌ testuser not found');
            process.exit(1);
        }
        
        const user = rows[0];
        console.log(`Found user: ${user.username} (ID: ${user.id})`);
        
        // Restore username to testuser
        await db.query('UPDATE users SET username = ? WHERE id = ?', ['testuser', user.id]);
        console.log(`✅ Restored username to: testuser`);
        
        // Set mood to happy (same as demo)
        await db.query('UPDATE users SET current_mood_id = ? WHERE id = ?', ['happy', user.id]);
        console.log(`✅ Set mood to: happy`);
        
        // Add mood log entry
        const { rows: existingLog } = await db.query(
            'SELECT id FROM mood_logs WHERE user_id = ? AND mood_id = ? ORDER BY id DESC LIMIT 1',
            [user.id, 'happy']
        );
        
        if (existingLog.length === 0) {
            await db.query('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [user.id, 'happy']);
            console.log(`✅ Added mood log entry`);
        } else {
            console.log(`ℹ️  Mood log entry already exists`);
        }
        
        // Verify
        const { rows: updated } = await db.query(
            'SELECT id, username, email, current_mood_id FROM users WHERE id = ?',
            [user.id]
        );
        
        console.log('\n✅ testuser fixed!');
        console.log('Updated user:', updated[0]);
        console.log('\nNow testuser should:');
        console.log('  - Display as "testuser" (not User31)');
        console.log('  - See other users in the feed (with happy mood)');
        console.log('  - Be visible to demo user in the feed');
        
    } catch (err) {
        console.error('❌ Error fixing testuser:', err);
        process.exit(1);
    }
}

fixTestUser().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
