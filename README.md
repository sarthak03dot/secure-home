# Secure IoT Home Automation - SPARK OS

This project is a comprehensive Smart Home and Security system using ESP32, Node.js, and React.

## 📁 Project Structure
- `backend/`: Node.js server handling MQTT and API requests.
- `frontend/`: React dashboard for real-time control and monitoring.
- `firmware/`: ESP32 source code for sensors and relays.

---

## 🚀 Getting Started

### 1. Start the Backend
```powershell
cd backend
npm install
node index.js
```
*Wait for "Connected to MQTT Broker" in the terminal.*

### 2. Start the Frontend
```powershell
cd frontend
npm install
npm run dev
```
*Open the provided URL (usually http://localhost:5173) in your browser.*

### 3. Flash the Firmware
- Open `firmware/main/main.ino` in **Arduino IDE**.
- Update `ssid` and `password` with your WiFi credentials.
- Connect your **ESP32** and upload the code.

---

## 🏗️ Hardware Setup
Refer to [WIRING_GUIDE.md](WIRING_GUIDE.md) for full pin-to-pin connections.

---

## ✅ Functional Verification
1.  **Light/Fan**: Use the SPARK OS dashboard to toggle relays.
2.  **Security**: Wave hand near PIR sensor to trigger the buzzer and dashboard alert.
3.  **Entry**: Open the door to see the real-time status update on the dashboard.

---

## 🛡️ Security Features (WNS)
- Wireless Intrusion detection using PIR and Magnetic sensors.
- Real-time logging and terminal-style intel feed.
- Tactical UI for project presentation.

---

## 🎯 Conclusion
Developed for NITRA Technical Campus, Year 2025-26.
By Sarthak Singh & Ankit Kumar Dixit.
Under the Guidance of Mr. Saurabh Jain.
