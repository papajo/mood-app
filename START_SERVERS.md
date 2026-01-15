# 🚀 Start Servers for iPhone Testing

## Quick Start Commands

### Start Both Servers (Recommended)

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

You should see:
```
VITE v7.2.4  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: http://192.168.254.150:5174/
```

## ✅ Current Status

- ✅ Vite config updated to listen on all interfaces (0.0.0.0)
- ✅ Frontend accessible at: `http://192.168.254.150:5174`
- ✅ Backend accessible at: `http://192.168.254.150:3002`
- ✅ .env file configured with Mac IP

## 📱 On Your iPhone

1. **Open Safari**
2. **Go to**: `http://192.168.254.150:5174`
3. **Wait for page to load** (may take 10-20 seconds first time)
4. **Tap Share button** (square with arrow)
5. **Tap "Add to Home Screen"**
6. **Launch from home screen**

## 🔧 If Still Not Working

### Check Servers Are Running
```bash
# Should show processes
lsof -i :5174
lsof -i :3002
```

### Check Firewall
```bash
# System Preferences → Security & Privacy → Firewall
# Make sure Node.js is allowed
```

### Test from Mac Browser First
```bash
# Should work on Mac
open http://localhost:5174
```

### Restart Servers
```bash
# Kill all
pkill -f vite
pkill -f "node.*server/index.js"

# Restart
cd server && npm start &
npm run dev &
```

## 📝 Important Notes

1. **Both servers must be running** (frontend AND backend)
2. **Same WiFi network** required
3. **First load takes time** - Vite needs to compile
4. **API URL is configured** - Uses Mac IP, not localhost

## 🎯 Expected Behavior

When you open `http://192.168.254.150:5174` on iPhone:
- Page should load (may take 10-20 seconds)
- You should see the MoodMingle app
- If you see "Loading..." that's normal - wait for it
- If you see errors, check browser console

---

**Servers are now configured correctly!** Try accessing `http://192.168.254.150:5174` on your iPhone again.
