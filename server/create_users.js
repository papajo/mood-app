import db from './db.js';

async function createActiveUsers() {
  await db.initializeDatabase();
  
  // Create several active users with SAME mood for testing
  const users = [
    { username: 'Luna_Starlight', mood: 'happy', status: 'Shining bright today! ✨' },
    { username: 'Cosmic_Waves', mood: 'happy', status: 'Riding the good vibes! 🌊' },
    { username: 'Thunder_Bolt', mood: 'happy', status: 'Electric energy! ⚡' },
    { username: 'Mystic_Dreams', mood: 'happy', status: 'Lost in good thoughts 🌙' },
    { username: 'Phoenix_Rising', mood: 'happy', status: 'Rising from the ashes! 🔥' }
  ];
  
  console.log('🎭 Creating ACTIVE test users for Rooms testing...');
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    try {
      // Create user
      const userResult = await db.query('INSERT INTO users (username, avatar, status) VALUES (?, ?, ?)', 
        [user.username, `https://i.pravatar.cc/150?u=${user.username}`, user.status]);
      const userId = userResult.rows[0]?.id;
      
      // Set mood
      await db.query('UPDATE users SET current_mood_id = ?, last_active = datetime("now", "-5 minutes") WHERE id = ?', 
        [user.mood, userId]);
      await db.query('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [userId, user.mood]);
      
      console.log(`✅ Created: ${user.username} (ID: ${userId}) - Mood: ${user.mood}`);
      
      // Add some sample messages to make rooms feel alive
      const sampleMessages = [
        `Hey everyone! ${user.status}`,
        `This mood room is amazing!`,
        `Anyone else feeling ${user.mood} today? 😊`,
        `Let's make this chat awesome! 🎉`,
        `Good vibes all around! ✨`
      ];
      
      // Add 2-3 messages per user with realistic timestamps
      for (let j = 0; j < 3; j++) {
        const time = new Date(Date.now() - (j * 10 * 60 * 1000)); // 10 minutes apart
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        await db.query('INSERT INTO messages (room_id, user_id, "user", text, time) VALUES (?, ?, ?, ?, ?)', 
          [user.mood, userId, user.username, sampleMessages[j], timeStr]);
      }
      
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        console.log(`⚠️  ${user.username} already exists, updating mood...`);
        // Try to update existing user
        const existingUser = await db.query('SELECT id FROM users WHERE username = ?', [user.username]);
        if (existingUser.rows.length > 0) {
          const existingId = existingUser.rows[0].id;
          await db.query('UPDATE users SET current_mood_id = ?, status = ?, last_active = datetime("now", "-5 minutes") WHERE id = ?', 
            [user.mood, user.status, existingId]);
          await db.query('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [existingId, user.mood]);
          console.log(`🔄 Updated: ${user.username} (ID: ${existingId}) - Mood: ${user.mood}`);
        }
      } else {
        console.error(`❌ Error with ${user.username}:`, err.message);
      }
    }
  }
  
  // Create one user in a different mood to show room switching
  try {
    await db.query('INSERT INTO users (username, avatar, status, current_mood_id) VALUES (?, ?, ?, ?)', 
      ['Chill_Vibes', 'https://i.pravatar.cc/150?u=chill', 'Feeling peaceful today 😌', 'chill']);
    console.log('✅ Created: Chill_Vibes - Mood: chill (for Room switching test)');
  } catch (err) {
    if (!err.message.includes('UNIQUE')) {
      console.error('❌ Error creating Chill_Vibes:', err.message);
    }
  }
  
  // Show final stats
  const { rows: happyUsers } = await db.query('SELECT COUNT(*) as count FROM users WHERE current_mood_id = ?', ['happy']);
  const { rows: chillUsers } = await db.query('SELECT COUNT(*) as count FROM users WHERE current_mood_id = ?', ['chill']);
  const { rows: totalMessages } = await db.query('SELECT COUNT(*) as count FROM messages WHERE room_id = ?', ['happy']);
  
  console.log('\n🎯 TESTING SETUP COMPLETE!');
  console.log('='.repeat(40));
  console.log(`📊 Happy Room: ${happyUsers[0].count} active users`);
  console.log(`📊 Chill Room: ${chillUsers[0].count} active users`);
  console.log(`💬 Happy Room Messages: ${totalMessages[0].count} total`);
  
  console.log('\n🎪 HOW TO TEST:');
  console.log('1. Open http://localhost:5174');
  console.log('2. You will see an auto-created user');
  console.log('3. Open another browser tab/incognito');
  console.log('4. In the NEW tab, enter these credentials:');
  console.log('');
  console.log('🎭 AVAILABLE TEST USERS:');
  console.log('   • Luna_Starlight (happy mood)');
  console.log('   • Cosmic_Waves (happy mood)'); 
  console.log('   • Thunder_Bolt (happy mood)');
  console.log('   • Mystic_Dreams (happy mood)');
  console.log('   • Phoenix_Rising (happy mood)');
  console.log('   • Chill_Vibes (chill mood)');
  console.log('');
  console.log('🎯 BEST TEST: Use Luna_Starlight and Cosmic_Waves in different tabs!');
  
  process.exit(0);
}

createActiveUsers().catch(console.error);