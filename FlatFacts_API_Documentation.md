# FlatFacts API Documentation (Updated)

## Authentication

### Register a User
**POST** `/api/users`  
**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password",
  "confirmPassword": "password"
}
```
**Response:**  
Returns the created user (without password). Email must be unique. After user creation, the system attempts to migrate any reviews associated with their email from the waitlist database.

**Validation:**
- Email, password, and confirm password are required
- Passwords must match
- Password must be at least 6 characters long
- Email must be unique (409 error if already exists)

---

### Login (Session-based)
**POST** `/api/auth/callback/credentials`  
**Body (x-www-form-urlencoded):**
- `csrfToken`: (get from `/api/auth/csrf`)
- `email`: user email
- `password`: user password

**Response:**  
Sets a session cookie for authenticated requests.

---

### OAuth Authentication

#### Google OAuth
**GET** `/api/auth/signin/google`  
Redirects to Google OAuth consent screen. On new user creation, the system attempts to migrate any reviews associated with their email from the waitlist database.

#### Apple OAuth  
**GET** `/api/auth/signin/apple`  
Redirects to Apple OAuth consent screen. On new user creation, the system attempts to migrate any reviews associated with their email from the waitlist database.

#### OAuth Callbacks
- **Google**: `/api/auth/callback/google`
- **Apple**: `/api/auth/callback/apple`

**Response:**  
Sets a session cookie for authenticated requests.

---

### Logout
**POST** `/api/auth/logout`  
Clears the session cookie and logs out the user.
**Response:**
```json
{ "message": "Logged out" }
```

---

## Profile Management

### Update User Profile
**PATCH** `/api/user/profile`

**Body (JSON):**
```json
{
  "username": "newDisplayName", // optional
  "avatar": "newAvatarUrl"      // optional
}
```
**Auth:** Session cookie required.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "USER_ID",
    "name": "newDisplayName",
    "image": "newAvatarUrl",
    ...
  }
}
```

**Behavior:**
- Updates the user's display name and/or avatar.
- Propagates changes to all reviews and comments by that user (updates `userName` and `userAvatar` fields for instant feed reflection).
- Returns the updated user object.

---

## Settings

### Get User Settings
**GET** `/api/settings`
**Auth:** Session cookie required.
**Response:**
```json
{
  "email": "user@example.com",
  "hasPassword": true
}
```
**Behavior:**
- Returns the logged-in user's email.
- `hasPassword` is `true` if the user registered with a password, and `false` if they used an OAuth provider. This is used to conditionally show a "Change Password" option on the frontend.

---

### Change Password
**POST** `/api/settings/change-password`
**Auth:** Session cookie required.
**Body (JSON):**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-secure-password",
  "confirmNewPassword": "new-secure-password"
}
```
**Response:**
```json
{ "success": true, "message": "Password changed successfully" }
```
**Behavior:**
- Only works for users who have a password (i.e., did not register via OAuth).
- Verifies the `currentPassword` before updating.
- Returns an error if passwords don't match or meet length requirements.

---

### Submit Support Message
**POST** `/api/settings/support`
**Auth:** Optional. If logged in, the `userId` is associated with the message.
**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "message": "I need help with..."
}
```
**Response:**
```json
{ "success": true, "message": "Support message received. We will get back to you shortly." }
```

---

### Get Terms and Conditions
**GET** `/api/settings/terms`
**Auth:** None.
**Response:**
- Returns a PDF file (`application/pdf`) containing the terms and conditions.

---

## Authentication (Updated)

### Verify OTP
**POST** `/api/auth/verify-otp`
**Body (JSON):**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
**Auth:** None.
**Response:**
```json
{ "success": true, "message": "Email verified successfully" }
```

**Behavior:**
- Verifies the OTP entered by the user against the stored value in Firestore.
- If the OTP is valid and hasn't expired, marks the user's email as verified in the Prisma database.
- Returns an error if the OTP is invalid or expired.

---

## Reviews (Updated)

### Create a Review (Authenticated, Anonymous Optional)
**POST** `/api/reviews`
**Body (JSON):**
```json
{
  "isAnonymous": true,
  "title": "Review Title",
  "content": "Review content",
  "tags": "tag1,tag2",
  "location": "GooglePlaceID",
  "image": "/uploads/your-uploaded-file.jpg",
  "star": 2
}
```
**Auth:** Required (must be logged in)

**Validation:**
- `star` must be 1, 2, or 3
- Max 5 tags
- `location` must be a valid Google Places ID

**Behavior:**
- Stores `userId` for all reviews
- If `isAnonymous` is true, user's name/avatar are not shown publicly
- `userName` and `userAvatar` are denormalized for instant feed updates

---

### Get All Reviews
**GET** `/api/reviews`  
**Response:**  
Array of reviews with user, comments, and votes.

---

### Get My Reviews
**GET** `/api/reviews/mine`
**Auth:** Session cookie required.
**Query Parameters (Optional):**
- `q`: Search keyword (searches title and content).
- `tag`: Filter by a specific tag.
- `rating`: Filter by a star rating (e.g., `3`).
- `dateFrom`: ISO date string for start of date range.
- `dateTo`: ISO date string for end of date range.
- `page`: Page number for pagination (default: `1`).
- `limit`: Number of items per page (default: `10`).
**Response:**
```json
{
  "reviews": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```
**Behavior:**
- Returns a paginated list of reviews for the logged-in user.
- Excludes soft-deleted reviews.

---

### Update a Review
**PATCH** `/api/reviews/{id}`  
**Body (JSON):** (any updatable fields)
```json
{
  "title": "New Title",
  "content": "Updated content"
}
```
**Auth:** Session cookie required (must be author or admin)

---

### Delete a Review
**DELETE** `/api/reviews/{id}`  
**Auth:** Session cookie required (must be author or admin)
**Behavior:**
- Performs a **soft delete** by setting the `deletedAt` timestamp on the review. The review is hidden from user-facing lists but remains in the database.
- A scheduled job is required to permanently delete reviews after a retention period (e.g., 30 days).

---

## Comments (Updated)

### Create a Comment (Authenticated, Anonymous Optional)
**POST** `/api/comments`
**Body (JSON):**
```json
{
  "reviewId": "REVIEW_ID",
  "isAnonymous": true,
  "content": "Comment text",
  "parentId": null
}
```
**Auth:** Required (must be logged in)

---

### Get All Comments
**GET** `/api/comments`  
**Response:**  
Array of comments with user, review, votes, and replies.

---

### Update a Comment
**PATCH** `/api/comments/{id}`  
**Body (JSON):**
```json
{
  "content": "Updated comment"
}
```
**Auth:** Session cookie required (must be author or admin)

---

### Delete a Comment
**DELETE** `/api/comments/{id}`  
**Auth:** Session cookie required (must be author or admin)

---

## Voting

### Vote on a Review or Comment
**POST** `/api/votes`  
**Body (JSON):**
```json
{
  "reviewId": "REVIEW_ID",   // or "commentId": "COMMENT_ID"
  "value": 1                 // 1 for upvote, -1 for downvote
}
```
**Auth:** Session cookie required
- Only one vote per user per review or comment (enforced by unique constraints)

---

## Image Upload

### Upload an Image
**POST** `/api/upload`  
**Body:** `form-data`  
- Key: `file` (type: File)

**Response:**
```json
{ "filePath": "/uploads/your-uploaded-file.jpg" }
```
Use this `filePath` in review or comment creation.
