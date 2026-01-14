import 'dotenv/config';
import bcrypt from 'bcrypt';
import db, { initializeDatabase } from './db.js';

async function resetTestAccount() {
    try {
        await initializeDatabase();
        
        const email = process.argv[2] || 'test@test.com';
        const newPassword = process.argv[3] || 'test123';
        
        // Find user by email
        const { rows } = await db.query('SELECT id, username, email FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            console.log(`❌ No user found with email: ${email}`);
            console.log('Usage: node reset_test_account.js <email> <new_password>');
            process.exit(1);
        }
        
        const user = rows[0];
        console.log(`Found user: ${user.username} (ID: ${user.id})`);
        
        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
        
        console.log('✅ Password reset successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log(`  Email: ${email}`);
        console.log(`  Password: ${newPassword}`);
        console.log(`  Username: ${user.username}`);
        
    } catch (err) {
        console.error('❌ Error resetting password:', err);
        process.exit(1);
    }
}

resetTestAccount().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
