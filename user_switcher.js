// MoodMingle User Switcher - Testing Helper
// Copy and paste this into your browser console on http://localhost:5174

const users = [
  { id: 1, username: 'Luna_Starlight', avatar: 'https://i.pravatar.cc/150?u=Luna_Starlight', mood: 'happy' },
  { id: 2, username: 'Cosmic_Waves', avatar: 'https://i.pravatar.cc/150?u=Cosmic_Waves', mood: 'happy' },
  { id: 3, username: 'Thunder_Bolt', avatar: 'https://i.pravatar.cc/150?u=Thunder_Bolt', mood: 'happy' },
  { id: 4, username: 'Mystic_Dreams', avatar: 'https://i.pravatar.cc/150?u=Mystic_Dreams', mood: 'happy' },
  { id: 5, username: 'Phoenix_Rising', avatar: 'https://i.pravatar.cc/150?u=Phoenix_Rising', mood: 'happy' },
  { id: 6, username: 'Chill_Vibes', avatar: 'https://i.pravatar.cc/150?u=Chill_Vibes', mood: 'chill' }
];

// Verify users exist before allowing switching
const verifyUsersExist = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/users/match/happy');
    const users = await response.json();
    const userMap = {};
    
    users.forEach(user => {
      userMap[user.id] = user.name;
    });
    
    console.log('🔍 Available users:');
    Object.entries(userMap).forEach(([id, name]) => {
      console.log(`  ID ${id}: ${name}`);
    });
    
    return users.map(user => user.id in userMap);
  } catch (err) {
    console.error('Could not verify users:', err);
    return users.map(user => true); // Assume all exist
  }
};

// Get the user context
function getUserContext() {
  // Find the React app instance
  const app = document.querySelector('#root')._reactInternalInstance;
  if (app && app.child && app.child.child) {
    return app.child.child.memoizedProps;
  }
  return null;
}

// Safe user switching with verification
window.switchUser = async (userId) => {
  const user = users.find(u => u.id === userId);
  if (!user) {
    console.error('❌ User not found:', userId);
    console.log('💡 Available users:');
    users.forEach(u => console.log(`  ID ${u.id}: ${u.username}`));
    return;
  }
  
  console.log(`✅ Switching to: ${user.username} (ID: ${user.id})`);
  
  // Verify user exists on backend first
  try {
    const response = await fetch(`http://localhost:3002/api/users/${userId}`);
    if (!response.ok) {
      console.error('❌ User verification failed:', response.status);
      console.error('Response text:', await response.text());
      alert(`❌ User ${user.username} (ID: ${userId}) not found on server. Status: ${response.status}`);
      return;
    }
    
    const userData = await response.json();
    console.log('✅ User verified on server:', userData);
    
  } catch (err) {
    console.error('❌ Error verifying user:', err);
    alert(`Failed to verify ${user.username}. Please try again.`);
    return;
  }
  
  // Update localStorage
  localStorage.setItem('userId', user.id);
  localStorage.setItem('username', user.username);
  localStorage.setItem('mood mingle-user', JSON.stringify({
    id: user.id,
    username: user.username,
    avatar: user.avatar
  }));
  
  console.log('🔄 Reloading to apply user change...');
  
  // Reload page
  window.location.reload();
};

// Display user switching interface
function showUserSwitcher() {
  if (document.getElementById('user-switcher')) {
    return; // Already exists
  }
  
  const switcher = document.createElement('div');
  switcher.id = 'user-switcher';
  switcher.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 10px;
    z-index: 9999;
    font-family: system-ui;
    font-size: 12px;
    max-width: 200px;
    backdrop-filter: blur(10px);
  `;
  
  switcher.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">🎭 User Switcher (Testing)</div>
    ${users.map(user => `
      <button onclick="switchUser(${user.id})" style="
        display: block;
        width: 100%;
        padding: 8px;
        margin: 3px 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 11px;
      ">${user.username}</button>
    `).join('')}
    <button onclick="this.parentElement.remove()" style="
      display: block;
      width: 100%;
      padding: 8px;
      margin: 10px 0 0 0;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 11px;
    ">Close</button>
  `;
  
  document.body.appendChild(switcher);
}

// Auto-show the switcher
showUserSwitcher();

console.log(`
🎭 MOODMINGLE TEST USERS LOADED 🎭
${users.map((user, i) => `${i + 1}. ${user.username} (ID: ${user.id})`).join('\n')}

🎯 USAGE:
switchUser(1);  // Switch to Luna_Starlight (Happy Room)
switchUser(2);  // Switch to Cosmic_Waves (Happy Room)
switchUser(3);  // Switch to Thunder_Bolt (Happy Room)
switchUser(6);  // Switch to Chill_Vibes (Chill Room)

📱 MOBILE TESTING TIPS:
• Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
• Or use ngrok: ngrok http 5174
• If still fails, test on computer first!

💡 TIP: Open multiple browser tabs and switch users in each tab to test multi-user chat!
`);