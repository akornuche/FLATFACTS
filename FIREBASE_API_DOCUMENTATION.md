# FlatFacts Firebase API Documentation

## Overview
This document describes the backend endpoints for the FlatFacts Firebase-based authentication and onboarding system.

## Base URL
```
http://localhost:3000/api
```

## Authentication Flow

### 1. Send OTP
**POST** `/send-otp`

Sends a 6-digit OTP to the user's email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "error": "Email is required"
}
```

**Notes:**
- OTP expires after 10 minutes
- OTP is stored in Firestore collection `otp`
- Email is sent using nodemailer (configure SMTP settings in environment variables)

---

### 2. Verify OTP and Create User
**POST** `/verify-otp`

Verifies the OTP and creates a Firebase Auth user with profile in Firestore.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "securepassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "uid": "firebase-user-uid",
  "email": "user@example.com"
}
```

**Error Responses:**
```json
{
  "error": "OTP not found or expired"
}
```
```json
{
  "error": "Invalid OTP"
}
```
```json
{
  "error": "Email, OTP, and password are required"
}
```

**Notes:**
- Creates Firebase Auth user
- Stores user profile in Firestore with `onboardingComplete: false`
- Deletes OTP from Firestore after successful verification

---

### 3. Complete Onboarding
**POST** `/onboarding`

Completes user onboarding by setting username and avatar.

**Request Body:**
```json
{
  "uid": "firebase-user-uid",
  "username": "chosenUsername",
  "avatar": "avatar1"
}
```

**Success Response:**
```json
{
  "success": true
}
```

**Error Responses:**
```json
{
  "error": "Username already taken"
}
```
```json
{
  "error": "uid, username, and avatar are required"
}
```
```json
{
  "error": "User not found"
}
```

**Notes:**
- Username must be unique across all users
- Sets `onboardingComplete: true` in Firestore
- Cannot be skipped - required for app access

---

### 4. Get User Profile
**GET** `/user-profile?uid=USER_UID`

Retrieves user profile from Firestore.

**Request:**
```
GET /user-profile?uid=firebase-user-uid
```

**Success Response:**
```json
{
  "user": {
    "uid": "firebase-user-uid",
    "email": "user@example.com",
    "username": "chosenUsername",
    "avatar": "avatar1",
    "onboardingComplete": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "error": "User not found"
}
```

---

### 5. Prelaunch Username (Waitlist MongoDB)
**GET** `/prelaunch-username?email=EMAIL`

Checks the waitlist MongoDB `waitlist` collection for a user by email.

**Request:**
```
GET /prelaunch-username?email=test@example.com
```

**Success Response (found):**
```json
{
  "found": true,
  "username": "@exampleuser",
  "email": "test@example.com"
}
```

**Success Response (not found):**
```json
{
  "found": false
}
```

**Error Response:**
```json
{
  "error": "email is required as a query parameter"
}
```

**Notes:**
- Used to check if a waitlist user exists by email before onboarding.
- Returns the username as stored in the waitlist database.
- Connects to the `test` database, `waitlist` collection in MongoDB Atlas.

---

## User Profile Schema (Firestore)

### Users Collection
```json
{
  "uid": "firebase-user-uid",
  "email": "user@example.com",
  "username": "chosenUsername",
  "avatar": "avatar1",
  "onboardingComplete": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### OTP Collection
```json
{
  "otp": "123456",
  "expiresAt": 1704067200000
}
```

---

## Environment Variables Required

```env
# Email Configuration (for OTP sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@flatfacts.com
```

---

## Frontend Integration Guide

### 1. Signup Flow
```javascript
// Step 1: Send OTP
const sendOTP = async (email) => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Step 2: Verify OTP and create user
const verifyOTP = async (email, otp, password) => {
  const response = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password })
  });
  return response.json();
};

// Step 3: Complete onboarding
const completeOnboarding = async (uid, username, avatar) => {
  const response = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, username, avatar })
  });
  return response.json();
};
```

### 2. Login Flow
```javascript
// Use Firebase Auth SDK for login
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();

// Email/Password login
const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Google login
const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
};
```

### 3. Check Onboarding Status
```javascript
const checkOnboardingStatus = async (uid) => {
  const response = await fetch(`/api/user-profile?uid=${uid}`);
  const { user } = await response.json();
  return user.onboardingComplete;
};
```

---

## Testing Methods

- **Browser-based tester (`test-endpoints.html`)**: Quick way to test all endpoints in your browser. Sends real HTTP requests and shows responses.
- **Postman**: You can import the endpoints into Postman and test them with custom payloads, headers, and authentication. This is more advanced and useful for complex workflows.
- **Manual scripts**: Node.js or PowerShell scripts can also be used for automated or batch testing.

All methods are valid for verifying endpoint functionality. The browser-based tester is equivalent to Postman for basic endpoint checks.

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (user not found)
- `409` - Conflict (username already taken, user already exists)
- `500` - Internal Server Error

---

## Security Notes

- OTPs expire after 10 minutes
- Passwords are handled by Firebase Auth (secure)
- Usernames must be unique
- User profiles are stored in Firestore with proper access rules
- All endpoints validate required fields 