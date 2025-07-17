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
Returns the created user (without password). Email must be unique.

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
Redirects to Google OAuth consent screen.

#### Apple OAuth  
**GET** `/api/auth/signin/apple`  
Redirects to Apple OAuth consent screen.

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

---

## Profile Management

### Update User Profile
**PATCH** `/api/user/profile`

**Body (JSON):**
```json
{
  "userId": "USER_ID", // (in production, this comes from session)
  "username": "newDisplayName", // optional
  "avatar": "newAvatarUrl"      // optional
}
```

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
- Requires authentication (userId must be present; in production, use session).
- Updates the user's display name and/or avatar.
- Propagates changes to all reviews and comments by that user (updates `userName` and `userAvatar` fields for instant feed reflection).
- Returns the updated user object.

---

## Reviews (Updated)

### Create a Review (Authenticated, Anonymous Optional)
**POST** `/api/reviews`
**Body (JSON):**
```json
{
  "userId": "USER_ID",
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
**If not logged in:** Returns `{ "error": "You must login to update a review." }`

---

### Delete a Review
**DELETE** `/api/reviews/{id}`  
**Auth:** Session cookie required (must be author or admin)
**If not logged in:** Returns `{ "error": "You must login to delete a review." }`

---

## Comments (Updated)

### Create a Comment (Authenticated, Anonymous Optional)
**POST** `/api/comments`
**Body (JSON):**
```json
{
  "reviewId": "REVIEW_ID",
  "userId": "USER_ID",
  "isAnonymous": true,
  "content": "Comment text",
  "parentId": null
}
```
**Auth:** Required (must be logged in)

**Behavior:**
- Stores `userId` for all comments
- If `isAnonymous` is true, user's name/avatar are not shown publicly
- `userName` and `userAvatar` are denormalized for instant feed updates

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
**If not logged in:** Returns `{ "error": "You must login to update a comment." }`

---

### Delete a Comment
**DELETE** `/api/comments/{id}`  
**Auth:** Session cookie required (must be author or admin)
**If not logged in:** Returns `{ "error": "You must login to delete a comment." }`

---

## Voting

### Vote on a Review or Comment
**POST** `/api/votes`  
**Body (JSON):**
```json
{
  "userId": "USER_ID",
  "reviewId": "REVIEW_ID",   // or "commentId": "COMMENT_ID"
  "commentId": null,         // null if voting on a review
  "value": 1                 // 1 for upvote, -1 for downvote
}
```
**Auth:** Session cookie required
- Only one vote per user per review or comment (enforced by unique constraints)

---

## Notes

- All endpoints that modify data (create, update, delete, vote) require the user to be authenticated (session cookie), except for anonymous review/comment creation.
- Only the original author or an admin can update or delete reviews/comments.
- For image uploads, first upload the image, then use the returned `filePath` in your review or comment creation.
- Use the returned IDs from create endpoints for update/delete/vote requests.
- Email is unique for user registration. 