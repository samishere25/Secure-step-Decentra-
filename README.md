# 🛡️ SecureStep - Decentralized Society Safety & Verification System

<div align="center">

![SecureStep Banner](https://img.shields.io/badge/SecureStep-Safety%20System-blue?style=for-the-badge)
![Flutter](https://img.shields.io/badge/Flutter-3.38.5-02569B?style=for-the-badge&logo=flutter)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)
![Blockchain](https://img.shields.io/badge/Blockchain-Verified-FFD700?style=for-the-badge)

**A comprehensive real-time safety and verification system for residential societies with blockchain integration, face recognition, offline QR verification, and multi-role access control.**

[Features](#-key-features) • [Installation](#-installation--setup) • [Tech Stack](#-tech-stack) • [Architecture](#-system-architecture) • [Developers](#-developers)

</div>

---

## 👨‍💻 Developers

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/samishere25.png" width="100px;" alt="Samiksha Channawar"/><br />
      <sub><b>Samiksha Channawar</b></sub><br />
      <a href="https://github.com/samishere25">🔗 GitHub Profile</a>
    </td>
    <td align="center">
      <img src="https://github.com/swapnilchidrawar.png" width="100px;" alt="Swapnil Chidrawar"/><br />
      <sub><b>Swapnil Chidrawar</b></sub><br />
      <a href="https://github.com/swapnilchidrawar">🔗 GitHub Profile</a>
    </td>
  </tr>
</table>

---

## 📖 Overview

**SecureStep** is an enterprise-grade, decentralized safety and verification platform designed for modern residential societies. It provides comprehensive security through blockchain-verified records, real-time emergency response, face recognition, offline QR verification, and multi-stakeholder coordination via mobile apps and web portals.

### 🎯 Problem Statement

Traditional society management systems lack:
- Real-time emergency response coordination
- Secure, tamper-proof verification records
- Offline access during network outages
- Multi-role access control for different stakeholders
- Blockchain-verified audit trails

### ✨ Our Solution

SecureStep addresses these challenges through:
- **Real-time SOS System**: Instant emergency alerts with police/admin dispatch
- **Blockchain Verification**: Immutable, cryptographically secure verification records
- **Offline QR System**: Network-independent verification using encrypted QR codes
- **Face Recognition**: AI-powered facial verification for enhanced security
- **Multi-Role Support**: Dedicated interfaces for 10 user types (Residents, Guards, Agents, Police, Admin, Maid, Delivery, Service Workers, Visitors, Guests)
- **Real-time Updates**: WebSocket-powered live notifications and status updates

---

## 🚀 Key Features

### 🆘 Emergency SOS System
- **One-Tap Emergency Alert**: Residents can trigger SOS with location tracking
- **Real-time Police Dispatch**: Live map showing SOS locations with police acknowledgment
- **Auto-Escalation**: Unacknowledged alerts escalate to higher authorities
- **Status Tracking**: Real-time updates from triggered → acknowledged → resolved
- **SOS History**: Complete audit trail of all emergency incidents
- **WebSocket Integration**: Instant notifications to police/admin portals

### 🔐 Blockchain Verification System
- **Immutable Records**: All verifications stored on-chain with cryptographic hashing
- **Tamper-Proof**: Blockchain ensures no modification of historical records
- **Instant Verification**: Police/Admin can verify authenticity via blockchain explorer
- **Decentralized Storage**: Distributed ledger prevents single point of failure
- **Audit Trail**: Complete verification history with timestamps and signatures
- **Smart Contracts**: Automated verification workflows

### 📱 Offline QR Code System
- **Network-Independent**: Works without internet connectivity
- **Encrypted QR Codes**: AES-256 encryption for sensitive data
- **Expiry Management**: Time-limited QR codes with configurable validity
- **Offline Verification**: Guards can verify residents during network outages
- **Secure Storage**: Encrypted offline database on guard devices
- **Central Verification**: Backup verification via backend API

### 👤 Face Recognition System
- **AI-Powered Matching**: Deep learning-based facial recognition
- **Registration Flow**: Residents register face data during onboarding
- **Live Verification**: Real-time face matching for gate entry
- **Anti-Spoofing**: Liveness detection to prevent photo attacks
- **MongoDB Persistence**: Face embeddings stored securely in database
- **High Accuracy**: 95%+ matching accuracy

### 🏢 Multi-Portal Architecture
1. **Admin Portal** (Web - Port 8080)
   - Society management dashboard
   - User role management (10 roles)
   - SOS monitoring and response
   - Analytics and reporting
   - System configuration

2. **Police Portal** (Web - Port 8080)
   - Real-time SOS alerts on interactive map (Leaflet.js + OpenStreetMap)
   - Custom pin markers with pulse animations
   - Blockchain verification interface
   - Emergency dispatch system
   - Status acknowledgment and updates
   - Real-time WebSocket notifications

3. **Agent Portal** (Web - Port 8080)
   - Resident verification management
   - QR code generation
   - Entry/Exit logging
   - Society analytics

4. **Mobile App** (Flutter - Android/iOS)
   - **Resident Module**: SOS trigger, QR access, profile management
   - **Guard Module**: QR scanning, face verification, entry logging, central verification
   - **Agent Module**: Verification processing, society management
   - **Generic User Module**: Support for Maid, Delivery, Service Workers, Visitors, Guests

### 🎨 Advanced UI/UX
- **Animated Role Selection**: Smooth, modern card animations with 7 role options
- **Real-time Notifications**: Socket.IO-powered live updates
- **Responsive Design**: Works on all screen sizes
- **Custom Map Markers**: Large pin-style markers with pulse animations
- **Material Design 3**: Modern, clean interface
- **Dark/Light Themes**: User-customizable themes

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Flutter Mobile App          │  Web Portals (HTML/CSS/JS)       │
│  - Resident                  │  - Admin Portal (Port 8080)      │
│  - Guard                     │  - Police Portal (Port 8080)     │
│  - Agent                     │  - Agent Portal (Port 8080)      │
│  - Maid/Delivery/Visitor     │                                  │
│  - Service Worker/Guest      │                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Node.js/Express Server (Port 5001)                             │
│  - RESTful API Endpoints                                        │
│  - JWT Authentication                                           │
│  - Socket.IO WebSocket Server                                   │
│  - Middleware (Auth, CORS, Rate Limiting)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service  │  SOS Service  │  QR Service  │  Face Service   │
│  Blockchain    │  Socket.IO    │  OCR Service │  Notification   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Atlas          │  Blockchain Network                   │
│  - User Collections     │  - Verification Records               │
│  - SOS Events           │  - Immutable Ledger                   │
│  - Face Data            │  - Smart Contracts                    │
│  - Verification Logs    │                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
SecureStep/
├── 📱 lib/                          # Flutter mobile app
│   ├── config/                      # App configuration
│   ├── models/                      # Data models (User, SOS, etc.)
│   ├── screens/                     # UI screens
│   │   ├── agent/                   # Agent module screens
│   │   ├── guard/                   # Guard module screens
│   │   │   └── guard_qr_scanner_screen.dart  # QR scanner with central verification
│   │   ├── resident/                # Resident module screens
│   │   ├── role_selection_screen.dart  # 7 role options
│   │   ├── login_screen_unified.dart   # Unified login for all roles
│   │   └── generic_user_home_screen.dart  # Maid/Delivery/Visitor/Service Worker/Guest
│   ├── services/                    # API services
│   │   ├── auth_service.dart
│   │   ├── sos_service.dart
│   │   ├── offline_qr_service.dart
│   │   └── face_verification_service.dart
│   ├── utils/                       # Utilities & constants
│   │   └── constants.dart           # IP configuration for mobile
│   └── widgets/                     # Reusable widgets
│
├── 🌐 backend/                      # Node.js backend
│   ├── src/
│   │   ├── config/                  # Server configuration
│   │   ├── controllers/             # Route controllers
│   │   ├── models/                  # MongoDB schemas
│   │   │   ├── User.js              # User model (10 roles)
│   │   │   ├── Visit.js             # Visit model (6 person types)
│   │   │   ├── SOSEvent.js
│   │   │   ├── FaceData.js
│   │   │   └── VerificationResult.js
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── sos.routes.js       # Public acknowledge endpoint
│   │   │   ├── face.routes.js
│   │   │   └── verification.routes.js
│   │   ├── services/                # Business logic
│   │   │   ├── blockchain.service.js
│   │   │   ├── socket.service.js
│   │   │   └── ocrService.js
│   │   ├── middleware/              # Auth, validation
│   │   └── server.js                # Entry point (static file serving)
│   ├── portal-server.js             # Portal server (Port 8080)
│   └── package.json
│
├── 🎨 admin_portal/                 # Admin web portal
│   ├── index.html
│   ├── script.js
│   └── styles.css
│
├── 👮 police_portal/                # Police web portal
│   ├── index.html
│   ├── script.js                    # Leaflet map integration, real-time SOS
│   └── styles.css                   # Custom pin markers with pulse
│
├── 🛡️ agent_portal/                 # Agent web portal
│   ├── index.html
│   ├── script.js
│   └── styles.css
│
└── 📚 Documentation/
    ├── ADMIN_PANEL_WORKING.md
    ├── SOS_IMPLEMENTATION_SUMMARY.md
    ├── BLOCKCHAIN_VERIFICATION_SUMMARY.md
    ├── OFFLINE_QR_SUMMARY.md
    ├── FACE_RECOGNITION_FEATURE.md
    └── INTEGRATION_GUIDE.md
```

---

## 🛠️ Tech Stack

### Frontend
- **Flutter 3.38.5** - Cross-platform mobile framework
- **Dart 3.10.4** - Programming language
- **mobile_scanner** - QR code scanning
- **http** - REST API calls
- **socket_io_client** - Real-time WebSocket
- **sqflite** - Offline database
- **crypto** - Encryption utilities
- **Material Design 3** - Modern UI components

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18+** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose 7.0+** - ODM for MongoDB
- **Socket.IO 4.5+** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Web3.js** - Blockchain integration

### Web Portals
- **HTML5/CSS3** - Markup & styling
- **JavaScript ES6+** - Client-side logic
- **Leaflet.js 1.9.4** - Interactive maps (replaced Google Maps)
- **OpenStreetMap** - Free map tiles
- **Bootstrap 5** - UI components
- **Socket.IO Client** - Real-time updates

### DevOps & Tools
- **Git** - Version control
- **Android Studio** - Android development
- **VS Code** - Code editor
- **Postman** - API testing
- **Android Gradle Plugin 8.11.1** - Build automation

---

## 📦 Installation & Setup

### Prerequisites
- **Flutter SDK** >= 3.38.5
- **Dart SDK** >= 3.10.4
- **Node.js** >= 18.0.0
- **MongoDB Atlas** account (or local MongoDB)
- **Git**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/samishere25/Secure-step-Decentra-.git
cd Secure-step-Decentra-
```

### 2️⃣ Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**
```env
PORT=5001
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
BLOCKCHAIN_NETWORK=http://localhost:8545
```

### 3️⃣ Flutter App Setup
```bash
cd ..  # Back to root

# Install Flutter dependencies
flutter pub get

# Check Flutter setup
flutter doctor

# Update IP address in constants.dart
# Edit lib/utils/constants.dart and set your backend IP
```

**Update `lib/utils/constants.dart`:**
```dart
static String get baseUrl {
  if (kIsWeb) {
    return 'http://localhost:5001';
  } else {
    return 'http://YOUR_COMPUTER_IP:5001';  // Update this
  }
}
```

### 4️⃣ MongoDB Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user with read/write permissions
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string and update `.env`

---

## 🚀 Running the Application

### Option 1: Run All Servers (Windows)
```bash
# Start backend and portals
start-servers.bat
```

### Option 2: Manual Start

**Backend Server:**
```bash
cd backend
node src/server.js
# Server runs on http://localhost:5001
```

**Portal Server:**
```bash
cd backend
node portal-server.js
# Portals run on http://localhost:8080
```

**Flutter App (Android Device):**
```bash
# Connect Android device via USB
adb devices

# Run app
flutter run

# Or build APK
flutter build apk --release
```

**Flutter App (Web):**
```bash
flutter run -d chrome
```

### Accessing Portals
- **Admin Portal**: http://localhost:8080/admin_portal/index.html
- **Police Portal**: http://localhost:8080/police_portal/index.html
- **Agent Portal**: http://localhost:8080/agent_portal/index.html

---

## 🔑 User Roles & Access

| Role | Access Level | Features |
|------|-------------|----------|
| **Resident** | User | SOS trigger, QR access, profile management |
| **Guard** | Security | QR scanning, face verification, entry logging, central verification |
| **Agent** | Management | Verification processing, society management |
| **Admin** | Full Control | All features, user management, analytics |
| **Police** | Emergency Response | SOS monitoring, dispatch, blockchain verification |
| **Maid** | Service Access | Entry logging, scheduled access |
| **Delivery** | Temporary Access | Package delivery, time-limited entry |
| **Service Worker** | Maintenance | Repair access, work order management |
| **Visitor** | Guest Access | Temporary entry, host approval |
| **Guest** | Limited Access | One-time entry passes |

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user (all 10 roles)
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/verify-token      # Verify JWT token
```

### SOS Emergency
```
POST   /api/sos/trigger            # Trigger SOS alert with location
GET    /api/sos/user/:userId       # Get user's SOS history
GET    /api/sos/police/dashboard   # Get all SOS alerts (Police)
PUT    /api/sos/:sosId/acknowledge # Acknowledge SOS (PUBLIC - Police)
PUT    /api/sos/:sosId/resolve     # Resolve SOS
```

### Face Recognition
```
POST   /api/face/register          # Register face data
POST   /api/face/verify            # Verify face
GET    /api/face/user/:userId      # Get user's face data
DELETE /api/face/:faceId           # Delete face data
```

### Verification
```
POST   /api/verification/verify    # Verify resident
POST   /api/verification/blockchain # Store on blockchain
GET    /api/verification/history   # Get verification history
```

### QR Code
```
POST   /api/qr/generate            # Generate QR code
POST   /api/qr/verify              # Verify QR code (offline + central)
GET    /api/qr/offline/:userId     # Get offline QR data
```

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **bcrypt Hashing**: Password encryption (12 rounds)
- **Role-Based Access Control**: Fine-grained permissions for 10 roles
- **Token Expiry**: Auto-logout after 7 days

### Data Security
- **AES-256 Encryption**: QR code data encryption
- **HTTPS/TLS**: Encrypted data transmission
- **MongoDB Encryption**: At-rest encryption via Atlas
- **Input Validation**: SQL injection & XSS prevention

### Blockchain Security
- **Immutable Ledger**: Tamper-proof records
- **Cryptographic Hashing**: SHA-256 verification
- **Smart Contracts**: Automated, trustless operations
- **Decentralized Storage**: No single point of failure

---

## 🌟 Advanced Features

### Real-time Communication (Socket.IO)
- **Live SOS Alerts**: Instant notifications to police/admin portals
- **Status Updates**: Real-time verification status
- **User Presence**: Online/offline status tracking
- **Bidirectional Communication**: Server-client real-time sync

### Offline Capabilities
- **Offline QR Verification**: Works without internet
- **Local Database**: SQLite for offline storage
- **Sync on Reconnect**: Auto-sync when connection restored
- **Cached Data**: Recent verifications cached locally
- **Central Verification Fallback**: Backup verification via backend

### Map Integration
- **Leaflet.js Maps**: OpenStreetMap integration (no API key required)
- **Custom Markers**: Large pin-style markers with pulse animation
- **Location Tracking**: GPS coordinates for SOS alerts
- **Geofencing**: Society boundary detection
- **Interactive UI**: Click markers for SOS details

### Analytics & Reporting
- **SOS Metrics**: Response time, resolution rate
- **Verification Stats**: Daily/weekly/monthly reports
- **User Activity**: Login history, access patterns
- **Export to CSV**: Download reports for analysis

---

## 🧪 Testing

### API Testing (Postman/Thunder Client)
```bash
# Test SOS trigger
POST http://localhost:5001/api/sos/trigger
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "userId": "user123",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

### Mobile App Testing
```bash
# Run tests
flutter test

# Integration tests
flutter drive --target=test_driver/app.dart
```

### Backend Testing
```bash
cd backend
npm test
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start - "Port 5001 already in use"**
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

**2. Flutter build fails**
```bash
flutter clean
flutter pub get
flutter pub upgrade
```

**3. MongoDB connection error**
- Check MongoDB Atlas whitelist (0.0.0.0/0 for dev)
- Verify connection string in `.env`
- Ensure database user has read/write permissions

**4. Mobile app shows "Connection timeout"**
- Update `lib/utils/constants.dart` with correct IP (use `ipconfig` on Windows)
- Ensure phone and computer on same WiFi
- Check Windows Firewall allows port 5001

**5. Face recognition not working**
- Verify MongoDB persistence enabled
- Check face data collection exists
- Ensure proper lighting during face capture

**6. New user roles not showing**
- Rebuild Flutter app: `flutter clean && flutter pub get`
- Restart backend server to load updated User model
- Clear app cache on mobile device

---

## 📝 Documentation

Comprehensive documentation available in repository:
- [Admin Panel Guide](ADMIN_PANEL_WORKING.md)
- [SOS Implementation](SOS_IMPLEMENTATION_SUMMARY.md)
- [Blockchain Verification](BLOCKCHAIN_VERIFICATION_SUMMARY.md)
- [Offline QR System](OFFLINE_QR_SUMMARY.md)
- [Face Recognition](FACE_RECOGNITION_FEATURE.md)
- [Integration Guide](INTEGRATION_GUIDE.md)
- [Guard Features](GUARD_FEATURES_COMPLETE.md)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Follow Flutter/Dart style guide
- ESLint for JavaScript
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Flutter Team** - Amazing cross-platform framework
- **MongoDB** - Scalable database solution
- **Leaflet.js** - Open-source mapping library
- **Socket.IO** - Real-time communication
- **OpenStreetMap** - Free map data
- **Face Recognition Libraries** - AI-powered verification

---

## 📞 Contact & Support

### Developers
- **Samiksha Channawar** - [GitHub](https://github.com/samishere25)
- **Swapnil Chidrawar** - [GitHub](https://github.com/swapnilchidrawar)

### Project Links
- **Repository**: [https://github.com/samishere25/Secure-step-Decentra-](https://github.com/samishere25/Secure-step-Decentra-)
- **Issues**: [Report a bug](https://github.com/samishere25/Secure-step-Decentra-/issues)
- **Discussions**: [Join the conversation](https://github.com/samishere25/Secure-step-Decentra-/discussions)

---

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] Core authentication system (10 user roles)
- [x] SOS emergency system with real-time police dispatch
- [x] Blockchain verification
- [x] Offline QR codes with central verification fallback
- [x] Face recognition with MongoDB persistence
- [x] Multi-role support (Resident, Guard, Agent, Police, Admin, Maid, Delivery, Service Worker, Visitor, Guest)
- [x] Web portals (Admin, Police with Leaflet maps, Agent)
- [x] Real-time Socket.IO integration
- [x] Custom map markers with pulse animations
- [x] Guard QR scanner with central verification

### Phase 2 (In Progress) 🚧
- [ ] Push notifications (FCM)
- [ ] Email alerts for SOS
- [ ] SMS integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app for iOS

### Phase 3 (Planned) 📅
- [ ] AI-powered threat detection
- [ ] Video surveillance integration
- [ ] Smart home device integration
- [ ] Multi-society support
- [ ] White-label solution for enterprises

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ by Samiksha Channawar & Swapnil Chidrawar**

[![GitHub stars](https://img.shields.io/github/stars/samishere25/Secure-step-Decentra-?style=social)](https://github.com/samishere25/Secure-step-Decentra-)
[![GitHub forks](https://img.shields.io/github/forks/samishere25/Secure-step-Decentra-?style=social)](https://github.com/samishere25/Secure-step-Decentra-/fork)

</div>
