// 🧪 MoodMingle Feature Testing Script
// Run this in browser console to test heart notifications and private chat

console.log('🎯 Starting MoodMingle Feature Tests...');
console.log('📋 Make sure you have two users in different browser tabs!');
console.log('💡 Use switchUser(1) and switchUser(2) to set up test users');

// Test 1: Heart Notification
async function testHeartNotification() {
    console.log('❤️ Testing Heart Notification...');
    
    try {
        const response = await fetch('/api/heart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                senderId: 1, 
                receiverId: 2 
            })
        });
        
        const result = await response.json();
        console.log('✅ Heart API Response:', result);
        
        // Test receiving notification
        setTimeout(() => {
            fetch('/api/hearts/2')
                .then(r => r.json())
                .then(hearts => {
                    console.log('✅ Hearts for User 2:', hearts);
                    if (hearts.length > 0) {
                        console.log('🎉 Heart notification test PASSED!');
                    }
                });
        }, 1000);
        
    } catch (error) {
        console.error('❌ Heart notification test FAILED:', error);
    }
}

// Test 2: Private Chat Request
async function testPrivateChatRequest() {
    console.log('💬 Testing Private Chat Request...');
    
    try {
        const response = await fetch('/api/private-chat/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                requesterId: 1, 
                requestedId: 2 
            })
        });
        
        const result = await response.json();
        console.log('✅ Chat Request API Response:', result);
        
        // Test receiving request
        setTimeout(() => {
            fetch('/api/private-chat/requests/2')
                .then(r => r.json())
                .then(requests => {
                    console.log('✅ Chat Requests for User 2:', requests);
                    if (requests.length > 0) {
                        console.log('🎉 Private chat request test PASSED!');
                    }
                });
        }, 1000);
        
    } catch (error) {
        console.error('❌ Private chat request test FAILED:', error);
    }
}

// Test 3: Socket Connection
function testSocketConnection() {
    console.log('🔌 Testing Socket Connection...');
    
    if (window.socket) {
        console.log('✅ Socket exists:', {
            connected: window.socket.connected,
            id: window.socket.id,
            rooms: Object.keys(window.socket.rooms || {})
        });
        
        // Listen for connection events
        const originalEmit = window.socket.emit;
        window.socket.emit = function(event, ...args) {
            console.log(`📡 Socket Emit: ${event}`, args);
            return originalEmit.call(this, event, ...args);
        };
        
        console.log('🔍 Socket monitoring enabled. Check console for socket events.');
        
    } else {
        console.error('❌ Socket not found! Make sure you are in a VibeRoom.');
    }
}

// Test 4: UI Elements
function testUIElements() {
    console.log('🎨 Testing UI Elements...');
    
    // Check notification button
    const notificationBtn = document.querySelector('button[aria-label*="Notification"]');
    if (notificationBtn) {
        console.log('✅ Notification button found:', notificationBtn);
    } else {
        console.error('❌ Notification button not found');
    }
    
    // Check match feed
    const matchFeed = document.querySelector('[class*="Vibing with you"]');
    if (matchFeed) {
        console.log('✅ Match feed found:', matchFeed);
    } else {
        console.error('❌ Match feed not found');
    }
    
    // Check for heart buttons
    const heartButtons = document.querySelectorAll('button svg');
    console.log(`✅ Found ${heartButtons.length} interactive buttons`);
    
    console.log('💡 Manual UI Testing:');
    console.log('  1. Click heart button on a user card');
    console.log('  2. Click notification bell to see panel');
    console.log('  3. Try chat request from MatchFeed');
}

// Test 5: Manual Interactive Test
async function testInteractiveFeatures() {
    console.log('🎮 Starting Interactive Feature Test...');
    console.log('📋 Follow these steps manually:');
    console.log('');
    console.log('🔹 STEP 1: Both users select "Happy" mood');
    console.log('🔹 STEP 2: User 1 clicks heart on User 2');
    console.log('🔹 STEP 3: User 2 checks notification bell');
    console.log('🔹 STEP 4: User 1 clicks chat button on User 2');
    console.log('🔹 STEP 5: User 2 accepts chat request');
    console.log('');
    console.log('🎯 Expected Results:');
    console.log('  ✓ Heart button turns pink');
    console.log('  ✓ Bell shows "1" badge');
    console.log('  ✓ Notification panel opens');
    console.log('  ✓ Chat request appears in panel');
    console.log('  ✓ Accept/reject buttons work');
}

// Main test runner
window.testMoodMingleFeatures = async function() {
    console.clear();
    console.log('🚀 MOODMINGLE FEATURE TESTING STARTED 🚀');
    console.log('=====================================');
    
    await testHeartNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testPrivateChatRequest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testSocketConnection();
    testUIElements();
    testInteractiveFeatures();
    
    console.log('');
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('🎉 Check the results above to verify features are working.');
    console.log('📱 For mobile testing, try different screen sizes in DevTools.');
    console.log('=====================================');
};

// Auto-run tests
console.log('🎯 Ready to test! Run testMoodMingleFeatures() in console to start.');
console.log('💡 Quick test: testMoodMingleFeatures()');

// Monitor socket events
if (window.socket) {
    window.socket.onAny((eventName, ...args) => {
        console.log(`🔔 Socket Event: ${eventName}`, args);
    });
}