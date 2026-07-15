# 🗳️ Voting System - Project Documentation

## Executive Summary

A full-stack web-based voting platform with **Admin** and **User** roles, enabling elections management, voting, and results tracking. The system supports multiple contests, candidate management, voting control, and comprehensive activity logging.

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Key Features](#key-features)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Security Features](#security-features)
8. [Data Flow](#data-flow)
9. [Recent Enhancements](#recent-enhancements)

---

## 🛠️ Technology Stack

### Backend

| Technology     | Version | Purpose                  |
| -------------- | ------- | ------------------------ |
| **Node.js**    | -       | Runtime environment      |
| **Express.js** | 5.1.0   | REST API framework       |
| **MongoDB**    | 8.8.4   | Database (with Mongoose) |
| **Mongoose**   | 8.8.4   | MongoDB ODM              |
| **Nodemailer** | 6.9.7   | Email verification       |
| **CORS**       | 2.8.5   | Cross-origin requests    |
| **dotenv**     | 17.2.3  | Environment variables    |
| **Nodemon**    | 3.1.11  | Development auto-reload  |

### Frontend

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| **React**        | 19.2.0  | UI framework            |
| **React Router** | 7.9.4   | Navigation & routing    |
| **React Icons**  | 5.5.0   | UI icons (Font Awesome) |
| **Recharts**     | 3.6.0   | Data visualization      |
| **Vite**         | 7.1.12  | Build tool              |

### Deployment & Tools

- **localStorage** - Client-side data persistence
- **Session Management** - Browser-based auth
- **REST API** - Client-Server communication

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VOTING SYSTEM                          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   FRONTEND (React)       │     BACKEND (Node.js/Express)   │
│  ┌──────────────────┐    │    ┌────────────────────────┐   │
│  │ User Dashboard   │────┼───→│ API Routes             │   │
│  │ Voting Page      │    │    │ Controllers            │   │
│  │ Results Page     │◄───┼────│ Middleware             │   │
│  │ Admin Dashboard  │    │    │ Auth Layer             │   │
│  │ Contestant View  │    │    └────────────────────────┘   │
│  └──────────────────┘    │              ↓                  │
│         ↓                │    ┌────────────────────────┐   │
│   localStorage          │    │  MongoDB Database       │   │
│   (Data Cache)          │    │  ├─ Users              │   │
│                         │    │  ├─ Contests           │   │
│                         │    │  ├─ Contestants        │   │
│                         │    │  ├─ Votes              │   │
│                         │    │  └─ Logs               │   │
│                         │    └────────────────────────┘   │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 🔗 API Endpoints

### **Authentication & Voter Management**

| Method | Endpoint               | Purpose            | Protected |
| ------ | ---------------------- | ------------------ | --------- |
| `POST` | `/api/voters/register` | Register new voter | ❌        |
| `POST` | `/api/voters/login`    | Login voter        | ❌        |
| `GET`  | `/api/voters/:id`      | Get voter profile  | ✅        |

### **Election/Contest Management**

| Method   | Endpoint             | Purpose              | Protected  |
| -------- | -------------------- | -------------------- | ---------- |
| `POST`   | `/api/elections`     | Create new election  | ✅ (Admin) |
| `GET`    | `/api/elections`     | Get all elections    | ❌         |
| `GET`    | `/api/elections/:id` | Get election details | ❌         |
| `PATCH`  | `/api/elections/:id` | Update election      | ✅ (Admin) |
| `DELETE` | `/api/elections/:id` | Delete election      | ✅ (Admin) |

### **Candidate/Contestant Management**

| Method   | Endpoint                   | Purpose                 | Protected  |
| -------- | -------------------------- | ----------------------- | ---------- |
| `POST`   | `/api/candidates`          | Add candidate           | ✅ (Admin) |
| `GET`    | `/api/candidates/:id`      | Get candidate           | ❌         |
| `DELETE` | `/api/candidates/:id`      | Remove candidate        | ✅ (Admin) |
| `POST`   | `/api/candidates/:id/vote` | Cast vote for candidate | ✅ (User)  |

### **Results & Analytics**

| Method | Endpoint                        | Purpose                    | Protected |
| ------ | ------------------------------- | -------------------------- | --------- |
| `GET`  | `/api/results`                  | Get all election results   | ❌        |
| `GET`  | `/api/elections/:id/candidates` | Get candidates of election | ❌        |
| `GET`  | `/api/elections/:id/voters`     | Get voters of election     | ❌        |

### **Email Verification**

| Method | Endpoint                      | Purpose                   | Protected |
| ------ | ----------------------------- | ------------------------- | --------- |
| `POST` | `/api/send-verification-code` | Send OTP to email         | ❌        |
| `POST` | `/api/verify-code`            | Verify OTP code           | ❌        |
| `GET`  | `/api/debug-code`             | Get debug code (Dev only) | ❌        |

### **Admin Analytics**

| Method | Endpoint             | Purpose                   | Protected  |
| ------ | -------------------- | ------------------------- | ---------- |
| `GET`  | `/api/admin/summary` | Get admin dashboard stats | ✅ (Admin) |

---

## 📊 Database Models

### **User (Voter)**

```javascript
{
  id: String,
  name: String,
  email: String,
  password: String (hashed),
  department: String,
  isAdmin: Boolean,
  status: String, // 'active', 'inactive', 'banned'
  createdAt: Date,
  emailVerified: Boolean
}
```

### **Contest (Election)**

```javascript
{
  id: String,
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String, // 'draft', 'active', 'completed'
  votingEnabled: Boolean, // Per-contest voting control
  resultsPublished: Boolean,
  resultsLocked: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Contestant (Candidate)**

```javascript
{
  id: String,
  contestId: String,
  userId: String,
  name: String,
  email: String,
  profilePicture: String (URL),
  statement: String,
  votes: Number,
  createdAt: Date
}
```

### **Vote**

```javascript
{
  id: String,
  voterId: String,
  contestId: String,
  candidateId: String,
  confidence: Number, // 1-5 scale
  timestamp: Date
}
```

### **Contestant Request**

```javascript
{
  id: String,
  userId: String,
  contestId: String,
  status: String, // 'pending', 'approved', 'rejected'
  statement: String,
  requestDate: Date,
  responseDate: Date
}
```

### **Activity Log**

```javascript
{
  id: String,
  userId: String,
  action: String,
  details: String,
  timestamp: Date,
  ipAddress: String
}
```

---

## ✨ Key Features

### **1. User Features**

- ✅ User registration with email verification (OTP)
- ✅ Secure login/logout with session management
- ✅ Vote in available contests (one vote per contest)
- ✅ Apply as contestant/candidate for contests
- ✅ View voting history and results
- ✅ Receive notifications on contest updates
- ✅ Profile management
- ✅ Activity tracking

### **2. Admin Features**

- ✅ Create/edit/delete elections (contests)
- ✅ Add/remove candidates (contestants)
- ✅ User management and accreditation
- ✅ Control voting per contest (Start/Stop voting)
- ✅ Publish/lock results
- ✅ View real-time analytics and statistics
- ✅ Activity logging and audit trail
- ✅ Manage contestant applications
- ✅ Post announcements to users
- ✅ Compare contestant performance

### **3. Security Features**

- ✅ Email verification for new users
- ✅ Admin-only routes protected by middleware
- ✅ Session-based authentication
- ✅ One-vote-per-contest enforcement
- ✅ Contestants cannot vote in their own contests
- ✅ Voting disabled for locked/completed contests
- ✅ Activity audit trail

### **4. Advanced Features**

- ✅ Multi-contestant comparison with rankings (1st, 2nd, 3rd, etc.)
- ✅ Per-contest voting enablement (not just global)
- ✅ Confidence ratings for votes
- ✅ Real-time vote counting
- ✅ Detailed contestant information display
- ✅ Responsive design for all devices
- ✅ Comparison statistics (total votes, leading contestant, average)

---

## 👥 User Roles & Permissions

### **Regular User**

| Permission            | Allowed           |
| --------------------- | ----------------- |
| Register              | ✅                |
| Login                 | ✅                |
| View Profile          | ✅                |
| Cast Vote             | ✅ (if eligible)  |
| View Results          | ✅ (if published) |
| Apply as Contestant   | ✅                |
| View Notifications    | ✅                |
| View Activity History | ✅                |

### **Admin User**

| Permission         | Allowed |
| ------------------ | ------- |
| Create Elections   | ✅      |
| Manage Candidates  | ✅      |
| Manage Users       | ✅      |
| Control Voting     | ✅      |
| Publish Results    | ✅      |
| View Analytics     | ✅      |
| Access Admin Panel | ✅      |
| Post Announcements | ✅      |

---

## 🔐 Security Features

### **Authentication**

1. **Email Verification**: OTP sent to email during registration
2. **Session Management**: User stored in localStorage with `isAdmin` flag
3. **Protected Routes**: Admin endpoints require `requireAdmin` middleware

### **Voting Security**

1. **One Vote Per Contest**: Backend checks prevent duplicate votes
2. **Contestant Protection**: Contestants cannot vote in their own contests
3. **Voting Window Control**: Votes only accepted during open window
4. **Per-Contest Enablement**: Admins control voting per contest
5. **Vote Confidence**: Users rate confidence level (1-5) in their vote

### **Data Protection**

1. **CORS Enabled**: Configured for frontend domain
2. **Input Validation**: Middleware validates all requests
3. **Error Handling**: Centralized error middleware
4. **Audit Logging**: All actions logged with timestamp

---

## 📈 Data Flow

### **Voting Flow**

```
1. User selects contest → Loads contestants
2. User selects contestant → Shows confirmation modal
3. User confirms vote → Vote submitted to backend
4. Backend validates:
   - User hasn't already voted in contest
   - User is not a contestant in contest
   - Voting window is open
   - Contest voting is enabled
5. Vote recorded in database
6. Vote count incremented for contestant
7. User sees success message
8. Redirected to dashboard
```

### **Contestant Comparison Flow**

```
1. Admin enters ContestantsView
2. Clicks "Compare" button
3. Selects 2 or more contestants (no limit)
4. Comparison modal opens
5. System ranks contestants by votes:
   - 1st place (Gold badge)
   - 2nd place (Silver badge)
   - 3rd place (Bronze badge)
   - 4th+ place (Purple badge)
6. Shows comparison summary:
   - Total votes
   - Leading contestant
   - Average votes
```

### **Results Publishing Flow**

```
1. Admin navigates to Results page
2. Selects contest to review
3. Reviews vote counts and percentages
4. Clicks "Publish Results"
5. System sets resultsPublished = true
6. Users notified of results
7. Users can view full statistics
8. Admin can lock results to prevent changes
```

---

## 🚀 Recent Enhancements

### **Recent Updates (Latest Session)**

#### **1. Contestant Comparison Enhancement**

- ✅ Support for comparing 2, 3, 4+ contestants (unlimited)
- ✅ Automatic ranking badges (1st, 2nd, 3rd, etc.)
- ✅ Dynamic grid layout for any number of contestants
- ✅ Visual ranking with color-coded badges:
  - Gold for 1st place
  - Silver for 2nd place
  - Bronze for 3rd place
  - Purple for 4th+

#### **2. Vote Confirmation Fix**

- ✅ Fixed modal displaying repeatedly after voting
- ✅ Immediate state updates to prevent flickering
- ✅ Proper cleanup before vote submission
- ✅ Success page displays correctly

#### **3. Per-Contest Voting Control**

- ✅ Each contest has independent `votingEnabled` flag
- ✅ Users only see voting enabled for selected contest
- ✅ Clear status messages showing voting availability
- ✅ Contest dropdown shows voting status (✓ or "Not Started")

---

## 💡 Technical Highlights

### **Frontend Architecture**

- **Component-based**: React functional components with hooks
- **State Management**: React Context API (AppContext)
- **Routing**: React Router v7 for SPA navigation
- **Data Persistence**: localStorage for client-side data caching
- **UI/UX**: Responsive design with inline CSS and Font Awesome icons

### **Backend Architecture**

- **MVC Pattern**: Controllers handle business logic
- **Middleware**: Auth, error handling, CORS
- **API Design**: RESTful endpoints with standard HTTP methods
- **Error Handling**: Centralized error middleware
- **Optional Database**: MongoDB optional; works with in-memory storage

### **Performance Features**

- **Lazy Loading**: Components load data on demand
- **Efficient State Updates**: Minimal re-renders
- **Optimized Queries**: Filtered and sorted data
- **Auto-redirect**: Users navigated after voting
- **Responsive Grid**: Dynamic layout for any number of items

---

## 📝 Configuration

### **Environment Variables** (.env)

```
PORT=5000
MONGO_URL=mongodb://... (optional)
```

### **Frontend Configuration**

- Proxy: `http://localhost:5000`
- CORS Origins: `localhost:3000`, `localhost:5173`, `localhost:5174`

---

## 🎯 Usage Examples

### **How Admins Use the System**

**Creating a Contest:**

1. Navigate to Admin → Contests
2. Click "Create New Contest"
3. Fill in title, description, dates
4. Set status to "Active"
5. Save contest

**Managing Contestants:**

1. Navigate to Admin → Contestants
2. View all contestants for a contest
3. Click "Compare" to compare 2+ contestants
4. View ranking badges and statistics
5. Remove contestants if needed

**Starting/Stopping Voting:**

1. Navigate to Admin → Contests
2. Find the contest
3. Click "Start Voting" to enable voting for that contest
4. Users can now vote
5. Click "Stop Voting" when done

**Publishing Results:**

1. Navigate to Admin → Results
2. Select contest
3. Review vote counts
4. Click "Publish Results"
5. Users notified and can view results

### **How Users Use the System**

**Voting:**

1. Register and verify email
2. Login to dashboard
3. Click "Vote" on available contest
4. Select contestant
5. Review selection
6. Rate confidence (1-5)
7. Confirm vote
8. See success message

**Comparing Contestants:**

- Admins can select multiple contestants
- View side-by-side comparison
- See rankings (1st, 2nd, 3rd, etc.)
- View statistics (total votes, leader, average)

---

## 🔄 Workflow Diagram

```
┌─────────────────┐
│ User Registers  │
│  & Verifies     │
│     Email       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Creates  │
│  Contest        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Adds     │
│  Contestants    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Starts   │
│  Voting         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Users Vote     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Stops    │
│  Voting         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Reviews  │
│  & Publishes    │
│    Results      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Users View     │
│   Results       │
└─────────────────┘
```

---

## 📞 Support & Monitoring

### **Key Metrics to Monitor**

- Active contests and voting status
- User registration rate
- Voting participation rate
- Vote distribution across contestants
- System uptime and API response times
- Error logs from activity tracking

### **Admin Dashboard Shows**

- Total registered users
- Active contests
- Total votes cast
- Pending requests
- Recent activity logs
- System statistics

---

## 🎓 Learning Points for Supervisor

### **Technical Achievements**

1. **Full-stack Development**: React + Node.js/Express
2. **Database Design**: Proper data models with relationships
3. **API Design**: RESTful endpoints with proper HTTP methods
4. **Authentication**: Session-based security
5. **UI/UX**: Responsive design with modern patterns
6. **State Management**: React Context API
7. **Real-time Updates**: Live vote counting
8. **Data Visualization**: Charts and statistics
9. **Error Handling**: Comprehensive error management
10. **Scalability**: Modular architecture

### **Business Features**

1. **Multi-contest Support**: Handle multiple elections
2. **Role-based Access**: Admin vs. User permissions
3. **Audit Trail**: Complete activity logging
4. **Email Verification**: Security and authenticity
5. **Flexible Voting Control**: Per-contest enablement
6. **Results Management**: Publish and lock results
7. **Contestant Management**: Application and approval workflow
8. **Analytics**: Detailed statistics and comparison

---

## 📚 Project Structure

```
voting-app/
├── server/                    # Backend (Node.js/Express)
│   ├── controllers/          # Business logic
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, error handling
│   ├── models/              # Database models
│   └── index.js             # Server entry point
│
├── client/                    # Frontend (React)
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   └── user/        # User pages
│   │   ├── components/      # Reusable components
│   │   ├── store/           # Context API
│   │   └── utils/           # Helper functions
│   └── public/              # Static files
│
├── package.json             # Dependencies
└── README.md               # Documentation
```

---

## ✅ Conclusion

This is a **production-ready voting system** with:

- Secure authentication and authorization
- Scalable architecture supporting multiple contests
- Comprehensive admin controls
- Real-time voting and results
- Advanced features like contestant comparison with rankings
- Complete audit trail and activity logging
- Responsive UI/UX for all devices

The system is well-suited for **internal elections, polls, surveys, and democratic processes** in organizations, schools, and institutions.

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2026  
**Status**: Production Ready
