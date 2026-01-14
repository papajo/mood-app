# 🚀 Quick Start: Running Servers for iPhone Testing

## Start Both Servers

### Option 1: Automated (Easiest)
```bash
npm run test:pwa
```

### Option 2: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Verify Servers Are Running

```bash
# Check if servers are listening
lsof -i :5173  # Frontend
lsof -i :3001  # Backend

# Test locally
curl http://localhost:5173
curl http://localhost:3001/api/users
```

## Access from iPhone

1. **Make sure iPhone and Mac are on same WiFi**
2. **Get your Mac's IP:**
   ```bash
   ./scripts/get-mac-ip.sh
   ```
3. **On iPhone Safari:**
   - Go to: `http://YOUR_MAC_IP:5173`
   - Example: `http://192.168.254.150:5173`
4. **Add to Home Screen** (Share → Add to Home Screen)

## Troubleshooting

### "Can't connect to server"
- ✅ Check both servers are running
- ✅ Check Mac and iPhone on same WiFi
- ✅ Check Mac firewall (allow Node.js)
- ✅ Try accessing from Mac browser first: `http://localhost:5173`

### "Empty page"
- ✅ Wait a few seconds for Vite to compile
- ✅ Check browser console for errors
- ✅ Verify API_URL is correct (should use Mac IP, not localhost)

### "API calls fail"
- ✅ Backend must be running on port 3001
- ✅ Update `.env` file:
  ```bash
  echo "VITE_API_URL=http://192.168.254.150:3001" > .env
  ```
- ✅ Rebuild: `npm run build && npm run dev`

## Current Status

After running `npm run dev`, you should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.254.150:5173/
```

Use the **Network** URL on your iPhone!
