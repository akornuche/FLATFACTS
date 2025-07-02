# FlatFacts API Documentation (Updated)

## Authentication

### Register a User
**POST** `/api/users`  
**Body (JSON):**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password"
}
```
**Response:**  
Returns the created user (without password). Email must be unique.

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

## Reviews

### Create a Review (Anonymous Allowed)
**POST** `/api/reviews`  
**Body (JSON):**
```json
{
  "title": "Review Title",
  "content": "Review content",
  "tags": "tag1,tag2",
  "location": "Location",
  "image": "/uploads/your-uploaded-file.jpg"
}
```
**Auth:** Not required (anonymous allowed)

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

## Comments

### Create a Comment (Anonymous Allowed)
**POST** `/api/comments`  
**Body (JSON):**
```json
{
  "reviewId": "REVIEW_ID",
  "content": "Comment text",
  "parentId": null,
  "image": "/uploads/your-uploaded-file.jpg"
}
```
**Auth:** Not required (anonymous allowed)

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