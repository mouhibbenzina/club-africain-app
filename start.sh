#!/bin/bash
# Club Africain Fan App - Start Script
# Starts both the API server and Expo development server

echo "=============================="
echo "  Club Africain Fan App"
echo "  Starting development server"
echo "=============================="

# Start API server
echo ""
echo "[1/2] Starting API server (port 3001)..."
cd server
node index.js &
API_PID=$!
cd ..

sleep 2

# Check if API is running
if kill -0 $API_PID 2>/dev/null; then
  echo "  ✅ API server running on http://localhost:3001"
else
  echo "  ❌ API server failed to start"
  exit 1
fi

# Start Expo
echo ""
echo "[2/2] Starting Expo (port 8081)..."
echo ""
echo "  Scan QR code with Expo Go app on your phone"
echo "  Or press 'a' for Android / 'i' for iOS"
echo ""
npx expo start

# Cleanup on exit
kill $API_PID 2>/dev/null
echo "Server stopped."
