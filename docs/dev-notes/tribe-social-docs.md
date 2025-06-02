-----------|------|----------|-------------|
| ContentId | integer | Yes | The ID of the content that was viewed |

**Example**:
```json
{
  "ContentId": 123
}
```

**Response:**

**Success Response:**

**Code**: 201 Created

No content is returned in the response body.

**Error Response:**

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint should be called whenever a user views content
- Views are tracked for analytics purposes and may affect content recommendations
- Multiple views from the same user within a short time period may be deduplicated
- Both authenticated and anonymous views are recorded, but authenticated views provide more valuable analytics
- This endpoint is designed for high-volume usage and is optimized for performance

**Example:**
```
# Authenticated view
curl -X POST "https://api.tribesocial.io/api/view-data" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"ContentId": 123}'

# Anonymous view
curl -X POST "https://api.tribesocial.io/api/view-data" \
-H "Content-Type: application/json" \
-d '{"ContentId": 123}'
```

### Video Analytics

Records detailed analytics about video watch events, including duration and playback position.

**Endpoint:**
```
POST /api/video-analytics
```

**Authentication:**
Authentication is optional. If provided, the analytics will be associated with the authenticated user. If not provided, the analytics will be recorded anonymously.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| videoId | integer | Yes | The ID of the video content that was watched |
| watchedDuration | number | Yes | The duration (in seconds) that the user watched the video |
| currentTime | number | Yes | The current playback position (in seconds) when the analytics event was recorded |

**Example**:
```json
{
  "videoId": 123,
  "watchedDuration": 45,
  "currentTime": 120
}
```

**Response:**

**Success Response:**

**Code**: 200 OK

A success response object is returned.

**Error Response:**

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint is specifically designed for tracking video engagement
- Analytics events are typically logged at regular intervals (approximately every 15 seconds)
- The system may filter out events where the user is seeking through the video
- Both the total watched duration and the current playback position are tracked to provide comprehensive analytics
- This data helps content creators understand how users engage with their videos, including drop-off points and most-watched segments
- Video analytics are more detailed than standard view events and provide insights into content quality and user engagement

**Example:**
```
curl -X POST "https://api.tribesocial.io/api/video-analytics" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "videoId": 123,
  "watchedDuration": 45,
  "currentTime": 120
}'
```

### Total Views by Content

This page provides a SQL query example for retrieving total view counts for content items within a specific platform and date range.

**Overview:**

For advanced analytics needs, you may need to query the database directly. This example shows how to retrieve the total number of views for each content item within a platform, sorted by popularity.

**Prerequisites:**

To use this SQL query, you'll need:

1. Database access credentials (name, username, password, and hostname)
2. Your Platform ID (can be found in the Platform table)
3. The desired date range for analysis

**SQL Query:**
```sql
SELECT
  Contents.Title AS 'Content Title',
  COUNT(Analytics.id) AS 'Total Views'
FROM
  Contents
INNER JOIN
  Analytics ON Contents.id = Analytics.ContentId
WHERE
  Contents.PlatformId = 100 AND
  Analytics.type = 'view' AND
  Contents.createdAt BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY
  Contents.Title
ORDER BY
  'Total Views' DESC;
```

**Query Explanation:**

This query:

1. Selects the content title and counts the number of analytics records (views)
2. Joins the Contents and Analytics tables on the content ID
3. Filters for a specific platform (replace 100 with your platform ID)
4. Filters for analytics records of type 'view'
5. Filters for content created within a specific date range (adjust as needed)
6. Groups the results by content title
7. Orders the results by view count in descending order (most popular first)

**Notes:**
- This query provides a direct way to analyze content performance
- Modify the date range to focus on specific time periods
- The query can be adapted for other analytics needs by changing the selected columns, filters, or joins
- For very large datasets, consider adding additional filters to improve query performance
- This query requires direct database access and is typically used by platform administrators or for generating reports

**Security Considerations:**
- Database credentials should be kept secure
- Access to raw analytics data should be restricted to authorized personnel
- Consider creating read-only database users for analytics purposes
- For production environments, it's recommended to use a database replica to avoid impacting application performance

## Chat

### Get Chat Messages

Retrieves all chat messages associated with a specific content item.

**Endpoint:**
```
GET /api/chat/:id
```

**Authentication:**
No authentication required. This endpoint is publicly accessible.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | The ID of the content item to retrieve chat for |

**Query Parameters:**
None

**Response:**

**Success Response:**

**Status Code**: 200 OK

**Response Body**: An array of chat message objects, each containing:

```json
[
  {
    "id": 1693,
    "message": "So glad to hear that Jacqueline!",
    "messagePlain": "So glad to hear that Jacqueline!",
    "deleted": false,
    "createdAt": "2022-04-03T19:34:05.000Z",
    "updatedAt": "2022-04-03T19:34:05.000Z",
    "ContentId": 2775,
    "UserId": 6604,
    "User": {
      "id": 6604,
      "name": "Bruce van Zyl",
      "photoUrl": "1639671861952.png",
      "banned": false
    }
  },
  // Additional chat messages...
]
```

**Error Response:**

**Status Code**: 400 Bad Request

**Response Body**:
```json
{
  "error": "Error message"
}
```

**Notes:**
- This endpoint returns all chat messages for a specific content item, ordered by creation date.
- Deleted messages are included in the response but have the deleted flag set to true.
- Each message includes information about the user who posted it.
- The response includes both top-level messages and replies.

**Example:**

**Request:**
```
curl -X GET "https://api.tribesocial.io/api/chat/2775" \
-H "Content-Type: application/json"
```

**Response:**
```json
[
  {
    "id": 1693,
    "message": "So glad to hear that Jacqueline!",
    "messagePlain": "So glad to hear that Jacqueline!",
    "deleted": false,
    "createdAt": "2022-04-03T19:34:05.000Z",
    "updatedAt": "2022-04-03T19:34:05.000Z",
    "ContentId": 2775,
    "UserId": 6604,
    "User": {
      "id": 6604,
      "name": "Bruce van Zyl",
      "photoUrl": "1639671861952.png",
      "banned": false
    }
  },
  {
    "id": 1694,
    "message": "Thanks for sharing this valuable information!",
    "messagePlain": "Thanks for sharing this valuable information!",
    "deleted": false,
    "createdAt": "2022-04-03T20:15:22.000Z",
    "updatedAt": "2022-04-03T20:15:22.000Z",
    "ContentId": 2775,
    "UserId": 6605,
    "User": {
      "id": 6605,
      "name": "Jane Smith",
      "photoUrl": "1639672045123.png",
      "banned": false
    }
  }
]
```

### Create Chat Message

Creates a new chat message associated with a specific content item.

**Endpoint:**
```
POST /api/chat/
```

**Authentication:**
Authentication is required. The request must include a valid authentication token.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | The content of the chat message |
| ContentId | integer | Yes | The ID of the content item to associate the message with |
| UserId | string | Yes | The ID of the user creating the message |
| parentCommentId | integer | No | The ID of the parent comment if this is a reply |

**Example Request Body:**
```json
{
  "message": "This is a great post!",
  "ContentId": 4212,
  "UserId": "9846"
}
```

**Example Reply Request Body:**
```json
{
  "message": "I agree with your comment!",
  "ContentId": 4212,
  "UserId": "9846",
  "parentCommentId": 123
}
```

**Response:**

**Success Response:**

**Status Code**: 200 OK

**Response Body**: An array containing the created message instance and a success flag:

```json
[
  {
    "id": 5678,
    "message": "This is a great post!",
    "deleted": false,
    "createdAt": "2023-08-15T14:22:33.000Z",
    "updatedAt": "2023-08-15T14:22:33.000Z",
    "ContentId": 4212,
    "UserId": "9846"
  },
  true
]
```

**Error Response:**

**Status Code**: 400 Bad Request or 500 Internal Server Error

**Response Body**:
```json
{
  "error": "Error message"
}
```

**Notes:**
- When a chat message is created, a WebSocket notification is sent to all users viewing the same content.
- The response includes the newly created chat message object with all its properties.
- If the message is a reply to another comment, include the parentCommentId parameter.
- The system supports rich text in the message field, but also stores a plain text version internally.

**Example:**

**Request:**
```
curl -X POST "https://api.tribesocial.io/api/chat/" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-d '{
  "message": "This is a great post!",
  "ContentId": 4212,
  "UserId": "9846"
}'
```

**Response:**
```json
[
  {
    "id": 5678,
    "message": "This is a great post!",
    "deleted": false,
    "createdAt": "2023-08-15T14:22:33.000Z",
    "updatedAt": "2023-08-15T14:22:33.000Z",
    "ContentId": 4212,
    "UserId": "9846"
  },
  true
]
```

### Delete Chat Message

Marks a chat message as deleted. Note that this is a soft delete - the message is not removed from the database but is marked as deleted.

**Endpoint:**
```
DELETE /api/chat/:id/:delete/
```

**Authentication:**
Authentication is required. The request must include a valid authentication token. Only the message author or an administrator can delete a message.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | The ID of the chat message to delete |
| delete | string | Must be set to "true" to confirm deletion |

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The ID of the chat message to delete |
| delete | boolean | Yes | Must be set to true to confirm deletion |

**Example Request Body:**
```json
{
  "id": 4212,
  "delete": true
}
```

**Response:**

**Success Response:**

**Status Code**: 200 OK

**Response Body**:
```json
{
  "success": true
}
```

**Error Response:**

**Status Code**: 400 Bad Request or 403 Forbidden

**Response Body**:
```json
{
  "error": "Error message"
}
```

**Notes:**
- This endpoint performs a soft delete - the message is not removed from the database but is marked as deleted.
- When a message is deleted, it will still appear in the chat history but with the deleted flag set to true.
- The message content may be replaced with a placeholder like "[Message deleted]" when displayed to users.
- Only the message author or an administrator can delete a message.
- When a parent message is deleted, its replies remain visible.

**Example:**

**Request:**
```
curl -X DELETE "https://api.tribesocial.io/api/chat/4212/true/" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-d '{
  "id": 4212,
  "delete": true
}'
```

**Response:**
```json
{
  "success": true
}
```

### Firebase Chat Messages

In addition to the REST API endpoints, Tribe provides real-time chat functionality through Firebase Firestore. This is primarily used in the mobile application to enable real-time messaging.

**Collection Structure:**

The Firebase chatMessages collection stores chat messages with the following structure:

```json
{
  "AuthorImg": "https://firebasestorage.googleapis.com/v0/b/tribe-master-app.appspot.com/o/users%2FB7xbW9IZGDP9wY73TGyd8tRuhik2%2Fuploads%2F1720646253046000.jpg?alt=media&token=734069d1-6a08-4e32-9939-f999f26cbb3f",
  "AuthorName": "Bruce van Zyl",
  "broadcastRef": {
    "__ref__": "broadcasts/i5Nz7Ci7N2neBg7Nr44b"
  },
  "contentID": 0,
  "date": {
    "__time__": "2024-07-18T22:27:35.486Z"
  },
  "deleted": false,
  "message": "We are working to resolve this!",
  "user": {
    "__ref__": "user/B7xbW9IZGDP9wY73TGyd8tRuhik2"
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| AuthorImg | string | URL to the author's profile image |
| AuthorName | string | Display name of the message author |
| broadcastRef | reference | Reference to the broadcast document in the broadcasts collection |
| contentID | integer | ID of the associated content (if applicable) |
| date | timestamp | When the message was sent |
| deleted | boolean | Whether the message has been deleted |
| message | string | The content of the chat message |
| user | reference | Reference to the user document in the user collection |
| replies | array | Optional array of reply messages (see structure below) |

**Reply Structure:**

Replies are stored as an array within the parent message document:

```json
"replies": [
  {
    "AuthorImg": "https://firebasestorage.googleapis.com/v0/b/tribe-master-app.appspot.com/o/users%2FDfQstdwZ8U2GojCV1gNS%2Fuploads%2F1719014918793446.jpg?alt=media&token=008984a2-1763-4fab-bed0-5d4eaa155045",
    "AuthorName": "Teresa Gwaltney",
    "comment": "Thanks",
    "deleted": false,
    "postDate": {
      "__time__": "2024-07-19T04:12:58.068Z"
    },
    "userref": {
      "__ref__": "user/DfQstdwZ8U2GojCV1gNS"
    }
  }
]
```

**Reading Chat Messages:**

To read chat messages for a specific broadcast, query the chatMessages collection where the broadcastRef field matches the broadcast reference:

```javascript
const chatMessagesRef = firebase.firestore().collection('chatMessages');
const query = chatMessagesRef.where('broadcastRef', '==',
  firebase.firestore().doc('broadcasts/i5Nz7Ci7N2neBg7Nr44b'));

query.orderBy('date', 'asc').onSnapshot((snapshot) => {
  const messages = [];
  snapshot.forEach((doc) => {
    messages.push({
      id: doc.id,
      ...doc.data()
    });
  });
  // Use the messages array
});
```

**Creating Chat Messages:**

To create a new chat message:

```javascript
const chatMessagesRef = firebase.firestore().collection('chatMessages');
await chatMessagesRef.add({
  AuthorImg: 'https://example.com/profile.jpg',
  AuthorName: 'John Doe',
  broadcastRef: firebase.firestore().doc('broadcasts/i5Nz7Ci7N2neBg7Nr44b'),
  contentID: 0,
  date: firebase.firestore.FieldValue.serverTimestamp(),
  deleted: false,
  message: 'Hello, world!',
  user: firebase.firestore().doc('user/USER_ID')
});
```

**Adding Replies:**

To add a reply to an existing message:

```javascript
const messageRef = firebase.firestore().collection('chatMessages').doc('MESSAGE_ID');
await messageRef.update({
  replies: firebase.firestore.FieldValue.arrayUnion({
    AuthorImg: 'https://example.com/profile.jpg',
    AuthorName: 'Jane Smith',
    comment: 'Great point!',
    deleted: false,
    postDate: firebase.firestore.FieldValue.serverTimestamp(),
    userref: firebase.firestore().doc('user/USER_ID')
  })
});
```

**Deleting Messages:**

To mark a message as deleted:

```javascript
const messageRef = firebase.firestore().collection('chatMessages').doc('MESSAGE_ID');
await messageRef.update({
  deleted: true
});
```

**Security Rules:**

Ensure your Firestore security rules are properly configured to control access to chat messages:

```
match /chatMessages/{messageId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    (resource.data.user == request.auth.uid ||
    get(/databases/$(database)/documents/user/$(request.auth.uid)).data.role == 'admin');
  allow delete: if false; // Use soft delete instead
}
```

**Notes:**
- The Firebase chat system is primarily used in the mobile application.
- Messages are never physically deleted; they are marked with deleted: true.
- For high-volume chats, consider implementing pagination or limiting the number of messages loaded.
- The broadcastRef field is used to associate messages with a specific broadcast or live event.
- The contentID field can be used to associate messages with specific content items.

## Push Notifications

### Overview

Push notifications are an essential feature of the Tribe platform, allowing administrators to send timely updates and announcements to users through their mobile devices. This functionality is particularly useful for increasing user engagement, delivering important information, and driving users back to the platform.

**Architecture:**

The Tribe API's push notification system is built on Firebase Cloud Messaging (FCM) and consists of:

1. **REST API Endpoints** - For managing notifications through the Tribe API
2. **Firebase Integration** - For delivering notifications to mobile devices
3. **Scheduled Notifications** - Support for sending notifications at a future date

**Available Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/push-notifications | GET | Retrieve push notifications |
| /api/push-notifications | POST | Send a new push notification |
| /api/push-notification/:id | DELETE | Delete a scheduled push notification |

**Common Use Cases:**

- **Announcements** - Inform users about new content or features
- **Reminders** - Notify users about upcoming events or deadlines
- **Engagement** - Re-engage inactive users with personalized messages
- **Updates** - Alert users about changes to content they follow

**Authentication:**

All push notification endpoints require authentication with admin privileges. This ensures that only authorized platform administrators can send notifications to users.

**Best Practices:**

1. **Keep messages concise** - Push notification messages should be clear and to the point
2. **Use appropriate timing** - Consider user time zones when scheduling notifications
3. **Personalize when possible** - Target specific user groups for more relevant messaging
4. **Don't overuse** - Excessive notifications can lead to users disabling them
5. **Include action items** - Give users a clear next step when they receive a notification

**Implementation Notes:**

- Push notifications are delivered through Firebase Cloud Messaging to mobile devices
- Notifications can be sent immediately or scheduled for a future date
- Scheduled notifications can be deleted before they are sent
- The system supports targeting specific user groups
- Custom destination pages and parameter data can be included for deep linking

### Get Push Notifications

This endpoint retrieves a list of push notifications for a platform. It provides information about both sent and scheduled notifications, allowing administrators to monitor and manage their notification campaigns.

**Endpoint:**
- **URL**: /api/push-notifications
- **Method**: GET
- **Authentication**: Required (Admin access)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of items per page (default: 10) |
| sort | string | No | Field to sort by (default: "createdAt") |
| order | string | No | Sort order, either "ASC" or "DESC" (default: "DESC") |
| PlatformId | integer | No | Filter notifications by platform ID |
| GroupId | integer | No | Filter notifications by group ID |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**:

```json
{
  "count": 2,
  "rows": [
    {
      "id": 123,
      "GroupId": 456,
      "PlatformId": 789,
      "title": "New Feature Announcement",
      "message": "We've just launched a new feature! Check it out now.",
      "status": "sent",
      "scheduledFor": "2023-11-15T10:00:00.000Z",
      "createdAt": "2023-11-10T08:30:00.000Z",
      "updatedAt": "2023-11-15T10:01:00.000Z",
      "parameterData": "{}",
      "destinationPage": "Home"
    },
    {
      "id": 124,
      "GroupId": 456,
      "PlatformId": 789,
      "title": "Upcoming Maintenance",
      "message": "The platform will be down for maintenance on Saturday.",
      "status": "scheduled",
      "scheduledFor": "2023-11-20T08:00:00.000Z",
      "createdAt": "2023-11-10T09:15:00.000Z",
      "updatedAt": "2023-11-10T09:15:00.000Z",
      "parameterData": "{}",
      "destinationPage": "Settings"
    }
  ]
}
```

**Error Response:**
- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- The response includes both sent and scheduled notifications
- The status field can be one of: "draft", "scheduled", "sent", or "error"
- Notifications with a scheduledFor date in the past and a status of "scheduled" have already been sent
- The parameterData field contains JSON data that can be used by the mobile app for deep linking
- The destinationPage field specifies which page in the mobile app should be opened when the notification is tapped

**Example:**
```
curl -X GET "https://api.example.com/api/push-notifications?PlatformId=789&limit=10" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Send Push Notification

This endpoint allows administrators to send push notifications to users' mobile devices. Notifications can be sent immediately or scheduled for a future date, and can target specific user groups within a platform.

**Endpoint:**
- **URL**: /api/push-notifications
- **Method**: POST
- **Authentication**: Required (Admin access)

**Request Body:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| GroupId | integer | Yes | - | The ID of the group to send the notification to |
| PlatformId | integer | Yes | - | The ID of the platform |
| title | string | No | "Default Title" | The title of the notification |
| message | string | No | "Default Message" | The message content of the notification |
| scheduledFor | string (ISO date) | No | - | Date and time to send the notification (if not provided, sends immediately) |
| parameterData | string (JSON) | No | "" | JSON string with additional data for the mobile app |
| destinationPage | string | No | "Settings" | The page to navigate to when the notification is tapped |
| recipients | array of integers | No | [] | Array of user IDs to receive the notification (if empty, sends to all users in the group) |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: "Notification sent"

**Error Response:**
- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- Notifications are delivered through Firebase Cloud Messaging to mobile devices
- If scheduledFor is provided, the notification will be queued and sent at the specified time
- The parameterData field can contain any JSON data needed by the mobile app for deep linking
- The destinationPage field should match a valid page name in the mobile app
- For large groups, recipients are processed in batches of 500 users
- If the platform is not connected to a Firebase project, the notification will be created but not delivered

**Example:**

**Immediate Notification to All Group Members:**
```
curl -X POST "https://api.example.com/api/push-notifications" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "GroupId": 456,
  "PlatformId": 789,
  "title": "New Content Available",
  "message": "Check out our latest video series on mobile development!",
  "destinationPage": "Content",
  "parameterData": "{\"contentId\": 12345}"
}'
```

**Scheduled Notification to Specific Users:**
```
curl -X POST "https://api.example.com/api/push-notifications" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "GroupId": 456,
  "PlatformId": 789,
  "title": "Reminder: Upcoming Event",
  "message": "Don't forget about tomorrow's live session!",
  "scheduledFor": "2023-11-20T18:00:00.000Z",
  "destinationPage": "Events",
  "parameterData": "{\"eventId\": 789}",
  "recipients": [1001, 1002, 1003]
}'
```

### Delete Push Notification

This endpoint allows administrators to delete a scheduled push notification that has not yet been sent. This is useful for canceling notifications that are no longer relevant or were created in error.

**Endpoint:**
- **URL**: /api/push-notification/:id
- **Method**: DELETE
- **Authentication**: Required (Admin access)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The ID of the notification to delete |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: "Notification deleted"

**Error Responses:**

**Notification Not Found:**
- **Code**: 404 Not Found
- **Content**:

```json
{
  "error": "Notification not found"
}
```

**Notification Already Sent:**
- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": "Cannot delete a notification that's already sent"
}
```

**Other Errors:**
- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint can only delete notifications that have a scheduledFor date in the future
- Notifications that have already been sent (or have a scheduledFor date in the past) cannot be deleted
- When a notification is deleted, it is removed from both the database and the Firebase collection
- This operation is permanent and cannot be undone

**Example:**
```
curl -X DELETE "https://api.example.com/api/push-notification/123" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Firebase Cloud Messaging Integration

The Tribe platform uses Firebase Cloud Messaging (FCM) to deliver push notifications to mobile devices. This document explains how the integration works and provides information for developers working with the mobile application.

**Overview:**

When a push notification is sent through the Tribe API, the following process occurs:

1. A notification record is created in the Tribe database
2. The notification is added to the Firebase Cloud Messaging ff_push_notifications collection
3. Firebase Cloud Messaging delivers the notification to user devices
4. Users can interact with the notification to navigate to specific pages in the app

**Firebase Cloud Messaging Collection Structure:**

Push notifications are stored in the ff_push_notifications collection with the following structure:

```json
{
  tribe_notification_id: 123, // ID from the Tribe database
  initial_page_name: "Content", // Page to navigate to when tapped
  notification_sound: "default", // Sound to play
  notification_text: "Check out our latest content!", // Message body
  notification_title: "New Content Available", // Notification title
  parameter_data: "{\"contentId\": 456}", // JSON string with additional data
  target_audience: "All", // Target audience (always "All")
  timestamp: Timestamp, // When the notification was created
  user_refs: "/user/uid1,/user/uid2,/user/uid3", // Comma-separated list of user references
  scheduled_time: Timestamp, // Optional: when to send the notification
  tribeGroupId: 789, // Optional: associated group ID
  groupRef: DocumentReference // Optional: reference to the group document
}
```

**Mobile App Implementation:**

**Handling Notifications in Flutter:**

The mobile app should implement FCM handlers to process incoming notifications:

```dart
// Initialize Firebase Messaging
final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

// Request permission
Future<void> requestNotificationPermissions() async {
  NotificationSettings settings = await _firebaseMessaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  print('User granted permission: ${settings.authorizationStatus}');
}

// Set up message handlers
void setupMessaging() {
  // Handle messages when the app is in the foreground
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');
    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      // Show an in-app notification
      showLocalNotification(message);
    }
  });

  // Handle when a user taps on a notification to open the app
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('A new onMessageOpenedApp event was published!');
    // Navigate to the appropriate page
    navigateBasedOnNotification(message);# TribeSocial API Documentation

## Introduction

Welcome to the Tribe Social API documentation. This guide will help you integrate with the Tribe Social platform and build amazing social experiences for your users.

## Getting Started

Tribe Social provides a comprehensive API that enables you to:

- Manage users and authentication
- Create and manage content
- Handle social interactions
- Process media and streaming
- Track analytics
- Configure platform settings

## Quick Start

1. **Authentication**
   - Get your API credentials
   - Make your first authenticated request

2. **Core Concepts**
   - Users and roles
   - Content management
   - Social features
   - Media handling

3. **Integration Guide**
   - API endpoints
   - WebSocket connections
   - Web hooks
   - SDKs and libraries

## API Structure

Our API is organized into several main sections:

- **Authentication & Users** - User management and authentication
- **Content Management** - Create and manage content
- **Social Features** - Groups, chat, and interactions
- **Media & Streaming** - Handle media uploads and streaming
- **Analytics & Reporting** - Track usage and performance
- **Platform Management** - Configure platform settings

## Authentication

### Overview

Tribe Social uses JWT (JSON Web Token) based authentication. All authenticated requests should include the JWT token either as:

- A signed cookie named token
- A header named token
- A cookie named token

### Authentication Flow

1. **User Authentication**
   - Email/password authentication
   - OTP (One-Time Password) authentication
   - Social provider authentication
   - SSO integration for enterprise customers

2. **Token Management**
   - Tokens are valid for 30 days
   - Tokens should be included in all authenticated requests
   - Tokens can be refreshed before expiration

### Authentication Levels

1. **Public Access**
   - No authentication required
   - Limited to public content and platform information

2. **User Authentication**
   - Required for most API endpoints
   - Access to user-specific content and features
   - Managed via isAuthenticated middleware

3. **Creator Access**
   - Enhanced privileges for content creators
   - Access to creator-specific features
   - Managed via isAdminOrCreator middleware

4. **Admin Access**
   - Full platform access
   - Administrative capabilities
   - Managed via isAdmin middleware

### Sign In

Sign in with email and password to receive an authentication token.

**Endpoint:** `POST /api/user/signin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "PlatformId": "123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active"
  }
}
```

**Error Responses:**
```
// 401 Unauthorized
{
  "error": "Invalid credentials"
}

// 400 Bad Request
{
  "error": "Email and password are required"
}
```

### OTP Authentication

#### Request OTP

Request a one-time password for authentication.

**Endpoint:** `POST /api/user/signin-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "PlatformId": "123"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300 // seconds
}
```

#### Verify OTP

Verify the one-time password and receive an authentication token.

**Endpoint:** `POST /api/user/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "PlatformId": "123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active"
  }
}
```

### Sign Out

Invalidate the current authentication token.

**Endpoint:** `POST /api/user/signout`

**Headers:**
```
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Successfully signed out"
}
```

### Authentication Status

Verify if the current token is valid and get user information.

**Endpoint:** `GET /api/user/status`

**Headers:**
```
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active"
  }
}
```

### Password Management

#### Request Password Reset

Request a password reset link to be sent to the user's email.

**Endpoint:** `POST /api/user/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "PlatformId": "123"
}
```

**Response:**
```json
{
  "message": "Password reset instructions sent"
}
```

#### Reset Password

Reset the user's password using the reset token.

**Endpoint:** `POST /api/user/reset-password`

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password successfully reset"
}
```

### Authentication Errors & Rate Limits

#### Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - User not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

#### Rate Limiting

Authentication endpoints have the following rate limits:

- Authentication attempts: 5 requests per minute per IP
- Password reset requests: 3 attempts per hour per email
- Failed login attempts may trigger temporary account lockouts

## Content

### Overview

Content in Tribe Social represents any type of media or information that can be shared with users. Content can be organized and shared with specific groups.

#### Real-time Updates

All content changes are synchronized in real-time using Firebase, ensuring that users always see the latest updates without needing to refresh their browser.

#### Content Types

- Text Posts
- Videos
- Live Streams
- Links
- Files

#### Content Organization

1. **Groups**
   - Content can be shared with specific groups
   - Controls content visibility and access
   - Supports public and private groups

2. **Tags**
   - Content can be tagged for better organization
   - Enables content discovery and filtering
   - Supports trending content features

#### Content Visibility

- **Public**: Visible to all users
- **Private**: Visible only to specific groups
- **Hidden**: Only visible to admins and content creators

#### Content Management

Content can be managed through:

- Dashboard interface for admins and creators
- API endpoints for programmatic access
- Firebase real-time updates
- Content moderation tools for administrators

#### Content Features

- Like/Unlike content
- Comment on content
- Track completion status
- Content embedding
- Featured images
- Rich text content
- Analytics tracking

### Error Handling

All content endpoints use standard HTTP status codes and may return the following errors:

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Content not found |
| 500 | Internal server error |

### Get Content by ID

Retrieve a specific content item by its ID.

**Endpoint:** `GET /api/content/:id`

**Response:**
```json
{
  "id": "number",
  "title": "string",
  "slug": "string",
  "description": "string",
  "descriptionPlain": "string",
  "likeCount": "number",
  "commentCount": "number",
  "hasCurrentUserLiked": "boolean",
  "featuredImage": "string?",
  "type": "link" | "video" | "post",
  "contentURI": "string?",
  "video": "string?",
  "chatEnabled": "boolean",
  "visibility": "public" | "private",
  "expireDate": "string?",
  "publishedDate": "string?",
  "featured": "boolean",
  "createdAt": "string",
  "updatedAt": "string",
  "PlatformId": "number",
  "UserId": "number",
  "Groups": [
    {
      "id": "number",
      "name": "string",
      "slug": "string",
      "description": "string",
      "visibility": "string",
      "coverImg": "string?",
      "PlatformId": "number",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "User": {}
}
```

### Add or Edit Content

Add new content or update existing content.

**Endpoint:** `POST /api/content`

**Request Body:**
```json
{
  "id": "number?", // Optional: if present, update that content
  "title": "string",
  "description": "string",
  "type": "article" | "video" | "post",
  "visibility": "public" | "private" | "members",
  "GroupIds": ["number"], // Optional: assign content to these groups
  "TagIds": ["number"], // Optional: assign tags to content
  "featuredImage": "string?",
  "video": "string?",
  "chatEnabled": "boolean",
  "featured": "boolean",
  "publishedDate": "string?",
  "expireDate": "string?"
}
```

**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "slug": "string",
    "description": "string",
    "featuredImage": "string?",
    "type": "article" | "video" | "post",
    "contentURI": "string?",
    "video": "string?",
    "chatEnabled": "boolean",
    "options": "object?",
    "visibility": "public" | "private" | "members",
    "expireDate": "string?",
    "publishedDate": "string?",
    "featured": "boolean",
    "createdAt": "string",
    "updatedAt": "string",
    "PlatformId": "number",
    "UserId": "number",
    "Groups": [],
    "Tags": [],
    "User": {
      // User details
    }
  },
  true // isNewRecord boolean
]
```

### Delete Content

Remove content by its ID.

**Endpoint:** `DELETE /api/content/:id`

**Response:**
```json
{
  "message": "Content deleted successfully"
}
```

### Search Content

Search for content across the platform by title, description, or author name.

**Search Endpoints:**

There are two ways to search for content:

`GET /api/content/search`

or with platform ID:

`GET /api/content/:PlatformId`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query to match against title, description, or author name |

**Example Request:**

```
GET /api/content/search?q=tribe
```

or

```
GET /api/content/search/36?q=tribe
```

**Response:**
```json
{
  "items": [
    {
      "id": "number",
      "title": "string",
      "description": "string",
      "type": "string",
      "visibility": "string",
      "author": {
        "id": "number",
        "name": "string"
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**Authentication:**
Authentication token is optional for this endpoint.

**Error Handling:**

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request parameters |
| 500 | Internal server error |

## Collections

### Overview

Collections in Tribe Social are containers that group related content together. They provide a way to organize content into meaningful categories, making it easier for users to discover and consume related materials.

### Collection Model

A collection in Tribe Social has the following key properties:

| Property | Type | Description |
|----------|------|-------------|
| id | Integer | Unique identifier for the collection |
| name | String | Display name of the collection |
| description | String | Rich text description of the collection (can contain HTML) |
| descriptionPlain | String | Plain text version of the description |
| descriptionHtml | String | HTML version of the description |
| slug | String | URL-friendly identifier for the collection |
| collectionBGImage | String | Background image filename for the collection |
| position | Integer | Order position for display (lower numbers appear first) |
| expireDate | Date | Date when the collection expires (optional) |
| publishedDate | Date | Date when the collection was published (optional) |
| collectionType | String | Type of collection (e.g., "default") |
| sortPreference | String | How content within the collection should be sorted (e.g., "most recent first", "chronological") |
| PlatformId | Integer | ID of the platform this collection belongs to |
| UserId | Integer | ID of the user who created this collection (optional) |
| showOnHomepage | Boolean | Whether the collection should be displayed on the homepage |

### Collection Relationships

Collections have relationships with other entities in the system:

- **Platform**: Each collection belongs to a specific platform
- **Contents**: Collections contain multiple content items
- **Groups**: Collections can be associated with specific groups
- **Ads**: Collections can have associated advertisements
- **User**: Collections are created by a specific user

### Firebase Integration

Collections are synchronized with Firebase Firestore for use in the mobile application. When collections are created, updated, or deleted, the corresponding data is also updated in Firestore.

### Collection Types

Collections can be of different types, with the default being "default". The collection type determines how the collection is displayed and behaves in the user interface.

### Collection Sorting

Content within collections can be sorted according to different preferences:

- **Most recent first**: Content is sorted by creation date, newest first
- **Chronological**: Content is sorted by date in chronological order
- **Custom order**: Content is manually ordered by position

### Collection Visibility

Collections can be shown or hidden from the homepage using the `showOnHomepage` property. This allows for creating collections that are only accessible via direct links or through groups.

### API Endpoints

The Collections API provides endpoints for managing collections, including:

- Creating and updating collections
- Retrieving collections by ID or slug
- Listing collections for a platform
- Reordering collections
- Deleting collections

See the individual endpoint documentation for more details on how to use these APIs.

### Get Collections by Platform

This endpoint retrieves all collections associated with a specific platform.

**Endpoint:** `GET /api/collection/:PlatformId`

**Authentication:** No authentication required.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| PlatformId | Integer | ID of the platform to retrieve collections for |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| showHidden | String | Set to "true" to include hidden collections |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Array of collection objects with their associated platform, content, and ad information

```json
[
  {
    "id": 541,
    "name": "Monthly Coaching Sessions",
    "description": null,
    "slug": "Monthly-Coaching-Sessions",
    "collectionBGImage": null,
    "position": 0,
    "expireDate": null,
    "publishedDate": null,
    "collectionType": "default",
    "sortPreference": "most recent first",
    "createdAt": "2022-04-01T21:23:32.000Z",
    "updatedAt": "2022-04-01T21:23:32.000Z",
    "PlatformId": 36,
    "UserId": 4816,
    "Platform": {
      "id": 36,
      "name": "KingdomMessenger Tv",
      "slug": "kmw",
      "description": "Welcome to the Kingdom Messenger Workshop membership site."
      // Additional platform properties...
    },
    "Contents": [
      {
        "id": 4473,
        "title": "Roadmap Open Coaching - March 3, 2022",
        "slug": "Roadmap-Open-Coaching-March-3-2022",
        // Additional content properties...
        "User": {
          // User properties...
        }
      }
      // Additional content items...
    ],
    "Ads": [
      // Ad objects if present
    ]
  }
  // Additional collections...
]
```

**Error Response:**
- **Status Code**: 500 Internal Server Error
- **Content**: Error message

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint returns potentially large amounts of data, especially for platforms with many collections and content items.
- By default, content with visibility set to "hidden" is excluded unless the showHidden parameter is set to "true".
- The response includes the full platform information (excluding sensitive credentials) and all content items within each collection.
- Content items include the associated user information.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/collection/36"
```

### Get Public Collections

This endpoint retrieves public collections for a specific platform, optimized for display on the platform's homepage.

**Endpoint:** `GET /api/collection/public/:PlatformId`

**Authentication:**
Optional authentication. If authenticated, the response may include user-specific data such as whether the current user has liked content items.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| PlatformId | Integer | ID of the platform to retrieve public collections for |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| itemsPerPage | Integer | Number of items to return per page |
| currentPage | Integer | Page number to retrieve |
| searchTerm | String | Term to search for in collection names |
| filters | Object | JSON object with filter criteria |
| sort | String | Field and direction to sort by (e.g., "name:asc") |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Paginated collection objects with their associated content and ad information

```json
{
  "items": [
    {
      "id": 509,
      "name": "Events",
      "slug": "Events",
      "position": -99,
      "sortPreference": "chronological",
      "updatedAt": "2022-03-16T01:40:44.000Z",
      "Contents": [
        {
          "id": 4473,
          "title": "Upcoming Workshop - March 3, 2022",
          "slug": "upcoming-workshop-march-3-2022",
          "visibility": "public",
          "duration": 3600,
          "contentURI": "https://example.com/video.mp4",
          "type": "video",
          "featuredImage": "image.jpg",
          "publishedDate": "2022-03-01T00:00:00.000Z",
          "expireDate": null,
          "User": {
            "id": 123,
            "name": "John Doe"
          },
          "ContentCollection": {
            "position": 1
          }
        }
      ],
      "Ads": [],
      "contentTotal": 5
    }
  ],
  "currentPage": 1,
  "itemsPerPage": 25,
  "totalItems": 10,
  "totalPages": 1,
  "firstItem": 1,
  "lastItem": 10
}
```

**Error Response:**
- **Status Code**: 500 Internal Server Error
- **Content**: Error message

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint is optimized for public display and only returns collections marked with showOnHomepage: true.
- Content items are filtered to exclude:
  - Hidden content
  - Expired content (where the current date is after the expireDate)
  - Unpublished content (where the current date is before the publishedDate)
- The response includes only essential collection and content attributes to minimize payload size.
- Content within each collection is ordered according to the collection's sortPreference.
- Only the first 20 content items for each collection are returned, with the total count provided in contentTotal.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/collection/public/36?itemsPerPage=10&currentPage=1"
```

### Get Collection by ID

This endpoint retrieves detailed information about a specific collection by its unique identifier.

**Endpoint:** `GET /api/collection-by-id/:id`

**Authentication:**
Authentication is required. Any authenticated user can access this endpoint.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | Integer | Unique identifier of the collection to retrieve |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Detailed collection object with its associated content items

```json
{
  "id": 110,
  "name": "Jan 2021 Workshop Sessions",
  "description": "<p><br></p>",
  "descriptionPlain": "",
  "descriptionHtml": "",
  "slug": "workshop-sessions",
  "collectionBGImage": "1631554500904-Facebook-Cover_centered.png",
  "position": -2,
  "expireDate": null,
  "publishedDate": null,
  "collectionType": "default",
  "sortPreference": "most recent first",
  "createdAt": "2021-02-03T19:24:52.000Z",
  "updatedAt": "2022-03-03T06:42:31.000Z",
  "PlatformId": 36,
  "UserId": null,
  "Contents": [
    {
      "id": 32,
      "likeCount": 1,
      "commentCount": 0,
      "currentUserHasLiked": true,
      "ContentCollection": {
        "CollectionId": 231,
        "ContentId": 32,
        "position": 0,
        "createdAt": "2022-10-20T17:29:50.000Z",
        "updatedAt": "2022-10-20T17:29:50.000Z"
      },
      "ContentCollectionCollectionId": null,
      "MediaUUID": null,
      "PlatformId": 123,
      "TopicCollectionCollectionId": null,
      "User": null,
      "UserId": null,
      "chatEnabled": false,
      "contentURI": null,
      "description": "Test Content Description",
      "descriptionPlain": "Test Content Description",
      "descriptionHtml": "<p>Test Content Description</p>",
      "featured": false,
      "featuredImage": null,
      "featuredImageAlt": null,
      "ingestEndpoint": null,
      "options": null,
      "playbackId": null,
      "position": 0,
      "publishedDate": null,
      "expireDate": null,
      "slug": "test-content",
      "title": "Test Content",
      "type": "video",
      "visibility": "public",
      "createdAt": "2022-10-20T17:29:50.000Z",
      "updatedAt": "2022-10-20T17:29:50.000Z"
    }
    // Additional content items...
  ]
}
```

**Error Response:**
- **Status Code**: 404 Not Found
- **Content**: Error message if the collection doesn't exist

```json
{
  "error": "Collection not found"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint returns the complete collection information including all associated content items.
- The response includes user-specific information such as whether the current user has liked content items.
- Content items include their position within the collection via the ContentCollection object.
- The collection's content is returned in the order specified by the collection's sortPreference.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/collection-by-id/110" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Get Collection by Slug

This endpoint retrieves detailed information about a specific collection by its slug and platform ID.

**Endpoint:** `GET /api/collection-by-slug/:slug/:PlatformId`

**Authentication:**
No authentication required.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | String | URL-friendly identifier of the collection |
| PlatformId | Integer | ID of the platform the collection belongs to |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | Integer | Optional. Maximum number of content items to return |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Detailed collection object with its associated content items

```json
{
  "id": 110,
  "name": "Workshop Sessions",
  "description": "<p>All workshop sessions from our recent event.</p>",
  "slug": "workshop-sessions",
  "collectionBGImage": "background-image.png",
  "position": 1,
  "expireDate": null,
  "publishedDate": null,
  "collectionType": "default",
  "sortPreference": "most recent first",
  "createdAt": "2022-01-15T19:24:52.000Z",
  "updatedAt": "2022-03-03T06:42:31.000Z",
  "PlatformId": 36,
  "UserId": 123,
  "Contents": [
    {
      "id": 456,
      "title": "Introduction to Tribe Social",
      "slug": "introduction-to-tribe-social",
      "visibility": "public",
      "type": "video",
      "contentURI": "https://example.com/video.mp4",
      "featuredImage": "thumbnail.jpg",
      "publishedDate": "2022-01-20T00:00:00.000Z",
      "expireDate": null,
      "User": {
        "id": 789,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "admin"
      }
    }
    // Additional content items...
  ],
  "contentTotal": 25
}
```

**Error Response:**
- **Status Code**: 404 Not Found
- **Content**: Error message if the collection doesn't exist

```json
{
  "message": "Collection not found"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

**Notes:**
- This endpoint filters content to exclude:
  - Hidden content
  - Expired content (where the current date is after the expireDate)
  - Unpublished content (where the current date is before the publishedDate)
- The collection's content is returned in the order specified by the collection's sortPreference.
- If the limit parameter is provided, only that number of content items will be returned, and the total count will be included in the contentTotal field.
- This endpoint is commonly used for public-facing collection pages.

**Example:**
```
# Get a collection with limited content items
curl -X GET "https://api.tribesocial.io/api/collection-by-slug/workshop-sessions/36?limit=10"

# Get a collection with all content items
curl -X GET "https://api.tribesocial.io/api/collection-by-slug/workshop-sessions/36"
```

### Get Collections for Dashboard

This endpoint retrieves collections for use in the admin dashboard, with pagination, filtering, and search capabilities.

**Endpoint:** `GET /api/admin/collections`

Alternative endpoint (legacy, will be deprecated):

`GET /api/collection`

**Authentication:**
Authentication is required. User must have admin or creator role.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| itemsPerPage | Integer | Number of items to return per page |
| currentPage | Integer | Page number to retrieve |
| searchTerm | String | Term to search for in collection names |
| filters | Object | JSON object with filter criteria |
| sort | String | Field and direction to sort by (e.g., "name:asc") |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Paginated collection objects with their associated platform and group information

```json
{
  "items": [
    {
      "id": 509,
      "name": "Events",
      "description": "[{\"id\":\"zyrh9AM2pK\",\"type\":\"paragraph\",\"data\":{\"text\":\"All upcoming events available to our Community.\"}}]",
      "slug": "Events",
      "collectionBGImage": null,
      "position": -99,
      "expireDate": null,
      "publishedDate": null,
      "collectionType": "default",
      "sortPreference": "chronological",
      "createdAt": "2022-03-09T19:54:14.000Z",
      "updatedAt": "2022-03-16T01:40:44.000Z",
      "PlatformId": 36,
      "UserId": 6604,
      "Platform": {
        "id": 36,
        "name": "KingdomMessenger TV",
        "slug": "kmw",
        "description": "Welcome to the membership site."
        // Additional platform properties...
      },
      "Groups": []
    }
    // Additional collections...
  ],
  "currentPage": 1,
  "itemsPerPage": 25,
  "totalItems": 10,
  "totalPages": 1,
  "firstItem": 1,
  "lastItem": 10,
  "sort": "position:asc",
  "filters": null
}
```

**Error Response:**
- **Status Code**: 403 Forbidden
- **Content**: Error message if the user doesn't have permission

```json
{
  "error": "Access denied"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint is intended for administrative use in the dashboard.
- For creator users, only collections created by that user are returned.
- For admin users, all collections for the platform are returned.
- The response includes the platform information (excluding sensitive credentials) and associated groups.
- The default sort order is by position in ascending order.
- This endpoint does not return the content items within collections to keep the response size manageable.

**Example:**
```
# Get the first page of collections with 10 items per page
curl -X GET "https://api.tribesocial.io/api/admin/collections?itemsPerPage=10&currentPage=1" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Search for collections with "workshop" in the name
curl -X GET "https://api.tribesocial.io/api/admin/collections?searchTerm=workshop" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Sort collections by name in descending order
curl -X GET "https://api.tribesocial.io/api/admin/collections?sort=name:desc" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Get Collection Options

This endpoint retrieves a simplified list of collections for use in dropdown menus and selection interfaces.

**Endpoint:** `GET /api/collection-options`

**Authentication:**
Authentication is required. User must have admin or creator role.

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Array of simplified collection objects

```json
[
  {
    "id": 123,
    "name": "Workshop Sessions",
    "UserId": 456
  },
  {
    "id": 124,
    "name": "Monthly Webinars",
    "UserId": 789
  },
  {
    "id": 125,
    "name": "Course Materials",
    "UserId": 456
  }
]
```

**Error Response:**
- **Status Code**: 403 Forbidden
- **Content**: Error message if the user doesn't have permission

```json
{
  "error": "Access denied"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint returns only the essential collection information needed for selection interfaces.
- Collections are returned for the platform associated with the authenticated user.
- The response is ordered by the collection's position in ascending order.
- This endpoint is commonly used when creating or editing content to select which collection(s) the content should belong to.
- The UserId field can be used to identify collections created by the current user.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/collection-options" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Create or Update Collection

This endpoint creates a new collection or updates an existing one.

**Endpoint:** `POST /api/collection`

**Authentication:**
Authentication is required. User must have admin or creator role.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | Integer | No | Collection ID (include for updates, omit for creation) |
| name | String | Yes | Display name of the collection |
| description | String | No | Rich text description of the collection |
| slug | String | Yes | URL-friendly identifier for the collection |
| collectionBGImage | String | No | Background image filename |
| position | Integer | No | Order position for display |
| expireDate | Date | No | Date when the collection expires |
| publishedDate | Date | No | Date when the collection is published |
| collectionType | String | No | Type of collection (default: "default") |
| sortPreference | String | No | How content should be sorted (e.g., "most recent first") |
| PlatformId | Integer | Yes | ID of the platform this collection belongs to |
| UserId | Integer | No | ID of the user creating this collection |
| showOnHomepage | Boolean | No | Whether to show on homepage |
| GroupIds | Array | No | Array of group IDs to associate with this collection |
| ContentIds | Array | No | Array of content IDs to set positions for |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Array containing the collection object and a boolean indicating if it's a new record

```json
[
  {
    "id": 123,
    "name": "Workshop Sessions",
    "description": "<p>All workshop sessions from our recent event.</p>",
    "slug": "workshop-sessions",
    "collectionBGImage": "background-image.png",
    "position": 1,
    "expireDate": null,
    "publishedDate": null,
    "collectionType": "default",
    "sortPreference": "most recent first",
    "createdAt": "2022-01-15T19:24:52.000Z",
    "updatedAt": "2022-03-03T06:42:31.000Z",
    "PlatformId": 36,
    "UserId": 456,
    "Platform": {
      "id": 36,
      "name": "Example Platform",
      "slug": "example"
      // Additional platform properties...
    }
  },
  true // Indicates this is a new record (false for updates)
]
```

**Error Response:**
- **Status Code**: 403 Forbidden
- **Content**: Error message if the user doesn't have permission

```json
{
  "error": "Access denied"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- When updating a collection, the user must be an admin or the creator of the collection.
- When creating a collection, the PlatformId must match the user's platform.
- If GroupIds is provided, the collection will be associated with those groups.
- If ContentIds is provided, the positions of those content items within the collection will be updated.
- The collection is also synchronized with Firebase Firestore for use in the mobile application.
- Content positions are determined by the order of IDs in the ContentIds array.

**Example:**
```
# Create a new collection
curl -X POST "https://api.tribesocial.io/api/collection" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "New Workshop Series",
  "description": "<p>Our latest workshop series.</p>",
  "slug": "new-workshop-series",
  "PlatformId": 36,
  "sortPreference": "most recent first",
  "showOnHomepage": true,
  "GroupIds": [1, 2, 3]
}'

# Update an existing collection
curl -X POST "https://api.tribesocial.io/api/collection" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "id": 123,
  "name": "Updated Workshop Series",
  "description": "<p>Our updated workshop series.</p>",
  "slug": "updated-workshop-series",
  "PlatformId": 36,
  "ContentIds": [101, 102, 103]
}'
```

### Reorder Collections

This endpoint updates the display order of multiple collections.

**Endpoint:** `POST /api/collections/reorder`

**Authentication:**
Authentication is required. User must have admin or creator role.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| collectionIds | Array | Yes | Array of collection IDs in the desired order |

**Response:**

**Success Response:**
- **Status Code**: 200 OK
- **Content**: Success message

```json
{
  "success": true
}
```

**Error Response:**
- **Status Code**: 404 Not Found
- **Content**: Error message if a collection is not found

```json
{
  "error": "Collection not found"
}
```

- **Status Code**: 403 Forbidden
- **Content**: Error message if the user doesn't have permission

```json
{
  "error": "Access denied"
}
```

- **Status Code**: 500 Internal Server Error
- **Content**: Error message for server errors

```json
{
  "error": "Something went wrong"
}
```

**Notes:**
- This endpoint updates the position field of each collection based on its index in the collectionIds array.
- The first collection in the array will have position 1, the second will have position 2, and so on.
- All collections in the array must belong to the same platform.
- The order is also synchronized with Firebase Firestore for use in the mobile application.
- This operation is performed within a database transaction to ensure consistency.
- If the transaction fails, all changes are rolled back.

**Example:**
```
curl -X POST "https://api.tribesocial.io/api/collections/reorder" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "collectionIds": [123, 456, 789]
}'
```

## Groups API

### Overview

Groups in Tribe Social allow users to create and join communities around shared interests, content, or purposes. The Groups API provides endpoints for creating, managing, and interacting with groups within the Tribe Social platform.

#### Key Features

- Create and manage groups
- Control group visibility and access
- Add and remove group members
- Manage group content and collections
- Retrieve group information

#### Group Types

Groups in Tribe Social can have different visibility settings:

- **Public**: Visible to all users, anyone can join
- **Private**: Visible in listings, but requires approval to join
- **Hidden**: Not visible in listings, users must be invited

#### Common Use Cases

- Creating community spaces for specific topics or interests
- Organizing content for different audience segments
- Building exclusive spaces for premium content
- Managing team collaboration areas

#### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/my-groups | GET | Get groups where the user is a member |
| /api/group/:slug | GET | Get a specific group by its slug |
| /api/group | POST | Create or update a group |
| /api/group/:slug/contents | GET | Get contents belonging to a group |
| /api/group/:slug/collections | GET | Get collections belonging to a group |
| /api/group/:id/user/:userId | DELETE | Remove a user from a group |
| /api/groups/platform/:platformId | GET | Get groups by platform ID |

#### Authentication Requirements

Most group endpoints require authentication with a valid token. The required role varies by endpoint:

- Group creation requires creator privileges
- Group management typically requires admin role
- Viewing group information may be available to any authenticated user depending on group visibility

### Get My Groups

This endpoint retrieves all groups in which the requesting user is a member or admin.

**Endpoint Details:**
- **URL**: /api/my-groups (Alias: /api/user/groups)
- **Method**: GET
- **Authentication**: Required (any role)

**Request Parameters:**
No URL parameters are required for this endpoint.

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Array of group objects

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier for the group |
| name | string | Name of the group |
| description | string | Description of the group (can be null) |
| slug | string | URL-friendly identifier for the group |
| coverImage | string | Filename of the group's cover image |
| visibility | string | Privacy setting of the group (public, private, etc.) |
| purchaseLink | string | Optional link for purchasing access to the group |
| createdAt | string | ISO timestamp of when the group was created |
| updatedAt | string | ISO timestamp of when the group was last updated |
| PlatformId | integer | ID of the platform the group belongs to |
| groupCreatorId | integer | ID of the user who created the group |
| userCount | integer | Number of users in the group |
| isMember | boolean | Whether the requesting user is a member of the group |
| Users | array | Array of user objects associated with the group |

**Example Response:**
```json
[
  {
    "id": 134,
    "name": "private group",
    "description": null,
    "slug": "private-group",
    "coverImage": "1652800675986.jpg",
    "visibility": "private",
    "purchaseLink": null,
    "createdAt": "2022-05-17T04:51:15.000Z",
    "updatedAt": "2022-05-17T15:18:06.000Z",
    "PlatformId": 36,
    "groupCreatorId": 9846,
    "userCount": 3,
    "isMember": true,
    "Users": [
      {
        "id": 9846,
        "UserGroup": {
          "role": "admin",
          "createdAt": "2022-05-17T04:51:15.000Z",
          "updatedAt": "2022-05-17T04:51:15.000Z",
          "GroupId": 134,
          "UserId": 9846
        }
      }
    ]
  }
]
```

**Error Response:**
- **Code**: 400 Bad Request
- **Content**: { error: "Error message" }

**Code Examples:**

**JavaScript:**
```javascript
const fetchMyGroups = async () => {
  try {
    const response = await fetch('https://api.tribesocial.io/api/my-groups', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    
    const groups = await response.json();
    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};
```

### Get Group by Slug

This endpoint retrieves detailed information about a specific group using its slug identifier.

**Endpoint Details:**
- **URL**: /api/group/:slug
- **Method**: GET
- **Authentication**: Optional (affects response content based on user permissions)

**Request Parameters:**

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | The URL-friendly identifier for the group |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Group object with detailed information

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier for the group |
| name | string | Name of the group |
| description | string | Description of the group (can be null) |
| slug | string | URL-friendly identifier for the group |
| coverImage | string | Filename of the group's cover image |
| visibility | string | Privacy setting of the group (public, private, etc.) |
| purchaseLink | string | Optional link for purchasing access to the group |
| createdAt | string | ISO timestamp of when the group was created |
| updatedAt | string | ISO timestamp of when the group was last updated |
| PlatformId | integer | ID of the platform the group belongs to |
| groupCreatorId | integer | ID of the user who created the group |
| Users | array | Array of user objects associated with the group |
| myRole | string | Role of the requesting user in the group (if authenticated) |
| userCount | integer | Number of users in the group |
| requests | array | Array of pending access requests (for admins) |
| hasRequestedAccess | boolean | Whether the requesting user has requested access |

**Example Response:**
```json
{
  "id": 134,
  "name": "private group",
  "description": null,
  "slug": "private-group",
  "coverImage": "1652800675986.jpg",
  "visibility": "private",
  "purchaseLink": null,
  "createdAt": "2022-05-17T04:51:15.000Z",
  "updatedAt": "2022-05-17T15:18:06.000Z",
  "PlatformId": 36,
  "groupCreatorId": 9846,
  "Users": [
    {
      "id": 9846,
      "name": "Andrew njoo",
      "photoUrl": "1653064636313.jpeg",
      "UserGroup": {
        "role": "admin",
        "createdAt": "2022-05-17T04:51:15.000Z"
      }
    }
  ],
  "myRole": "admin",
  "userCount": 1,
  "requests": [],
  "hasRequestedAccess": false
}
```

**Error Responses:**
- **Code**: 400 Bad Request
  - **Content**: { error: "Error message" }

- **Code**: 404 Not Found
  - **Content**: "Group not found"

**Notes:**
- The response will include different information based on the authentication status and role of the requesting user.
- For private groups, non-members will see limited information.
- Group admins will see additional information such as pending access requests.

**Code Examples:**

**JavaScript:**
```javascript
const getGroupBySlug = async (slug) => {
  try {
    const response = await fetch(`https://api.tribesocial.io/api/group/${slug}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 404) {
      throw new Error('Group not found');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch group');
    }
    
    const group = await response.json();
    return group;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};
```

### Create or Update Group

This endpoint allows you to create a new group or update an existing group's information.

**Endpoint Details:**
- **URL**: /api/group
- **Method**: POST
- **Authentication**: Required (creator role)

**Request Parameters:**

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | No | Group ID (include to update an existing group, omit to create a new one) |
| name | string | Yes | Name of the group |
| description | string | No | Description of the group |
| visibility | string | Yes | Privacy setting of the group (public, private, hidden) |
| coverImage | string | No | Filename of the group's cover image |
| purchaseLink | string | No | Optional link for purchasing access to the group |
| adminIds | array | No | Array of user IDs to be assigned as group admins |

**Example Request:**
```json
{
  "name": "New Group",
  "description": "This is a description of the new group",
  "visibility": "private",
  "adminIds": [23, 25]
}
```

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: The created or updated group object

**Example Response:**
```json
{
  "id": 135,
  "name": "New Group",
  "description": "This is a description of the new group",
  "slug": "new-group",
  "visibility": "private",
  "purchaseLink": null,
  "createdAt": "2022-05-18T10:30:45.000Z",
  "updatedAt": "2022-05-18T10:30:45.000Z",
  "PlatformId": 36,
  "groupCreatorId": 9846
}
```

**Error Response:**
- **Code**: 400 Bad Request
- **Content**: { error: "Error message" }

**Notes:**
- When updating a group, only include the fields you want to change.
- The adminIds array will replace all existing admins with the new list.
- The group slug is automatically generated from the name.
- Only users with creator privileges can create or update groups.

**Code Examples:**

**JavaScript:**
```javascript
const createOrUpdateGroup = async (groupData) => {
  try {
    const response = await fetch('https://api.tribesocial.io/api/group', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groupData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create/update group');
    }
    
    const group = await response.json();
    return group;
  } catch (error) {
    console.error('Error creating/updating group:', error);
    throw error;
  }
};

// Example usage for creating a new group
const newGroup = {
  name: "New Group",
  description: "This is a description of the new group",
  visibility: "private",
  adminIds: [23, 25]
};

// Example usage for updating an existing group
const updatedGroup = {
  id: 135,
  name: "Updated Group Name",
  visibility: "public"
};
```

### Get Group Contents

This endpoint retrieves content items that belong to a specific group, identified by the group's slug.

**Endpoint Details:**
- **URL**: /api/group/:slug/contents
- **Method**: GET
- **Authentication**: Optional (affects content visibility based on user permissions)

**Request Parameters:**

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | The URL-friendly identifier for the group |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of items per page (default: 25) |
| search | string | No | Search term to filter content items |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Paginated list of content items belonging to the group

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| items | array | Array of content objects |
| itemsPerPage | integer | Number of items per page |
| currentPage | integer | Current page number |
| totalItems | integer | Total number of items across all pages |
| totalPages | integer | Total number of pages |
| searchTerm | string | Search term used (if any) |
| hasMore | boolean | Whether there are more pages available |

**Content Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier for the content |
| title | string | Title of the content |
| slug | string | URL-friendly identifier for the content |
| description | string | Description of the content (can be null) |
| descriptionPlain | string | Plain text description |
| descriptionHtml | string | HTML formatted description |
| likeCount | integer | Number of likes the content has received |
| commentCount | integer | Number of comments on the content |
| currentUserHasLiked | boolean | Whether the requesting user has liked the content |
| featuredImage | string | Filename of the content's featured image |
| type | string | Type of content (video, article, etc.) |
| video | string | Path to video file (for video content) |
| chatEnabled | boolean | Whether chat is enabled for this content |
| visibility | string | Privacy setting of the content |
| publishedDate | string | ISO timestamp of when the content was published |
| featured | boolean | Whether the content is featured |
| createdAt | string | ISO timestamp of when the content was created |
| updatedAt | string | ISO timestamp of when the content was last updated |
| PlatformId | integer | ID of the platform the content belongs to |
| UserId | integer | ID of the user who created the content |
| Groups | array | Array of groups the content belongs to |
| User | object | Information about the content creator |
| Collections | array | Array of collections the content belongs to |

**Example Response:**
```json
{
  "items": [
    {
      "id": 4481,
      "title": "How To Protect Your Kingdom Content - Masterclass with Peter Nieves",
      "slug": "How-To-Protect-Your-Kingdom-Content-Masterclass-with-Peter-Nieves",
      "description": null,
      "descriptionPlain": "",
      "descriptionHtml": "",
      "likeCount": 2,
      "commentCount": 0,
      "currentUserHasLiked": false,
      "featuredImage": "1649083201463.png",
      "type": "video",
      "ingestEndpoint": null,
      "contentURI": null,
      "video": "videos/1649082625439.mp4",
      "chatEnabled": false,
      "options": null,
      "visibility": "premium",
      "expireDate": null,
      "publishedDate": "2022-03-17T04:00:00.000Z",
      "transcodingDataSJ": null,
      "featured": false,
      "createdAt": "2022-04-04T14:38:15.000Z",
      "updatedAt": "2022-04-04T14:40:09.000Z",
      "PlatformId": 36,
      "UserId": 6604,
      "Groups": [],
      "User": {},
      "Collections": []
    }
  ],
  "itemsPerPage": 25,
  "currentPage": 1,
  "totalItems": 78,
  "totalPages": 4,
  "searchTerm": "",
  "hasMore": true
}
```

**Error Responses:**
- **Code**: 400 Bad Request
  - **Content**: { error: "Error message" }

- **Code**: 403 Forbidden
  - **Content**: "Insufficient role"

- **Code**: 404 Not Found
  - **Content**: "Group not found" or "User not found in group"

**Notes:**
- Only group admins can remove users from a group.
- Users can remove themselves from a group (leave the group).
- Group creators cannot be removed from their own groups.
- When a user is removed, they lose access to all group content and collections.

**Code Examples:**

**JavaScript:**
```javascript
const removeUserFromGroup = async (groupId, userId) => {
  try {
    const response = await fetch(`https://api.tribesocial.io/api/group/${groupId}/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions to remove user from group');
    }
    
    if (response.status === 404) {
      throw new Error('Group or user not found');
    }
    
    if (!response.ok) {
      throw new Error('Failed to remove user from group');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing user from group:', error);
    throw error;
  }
};
```

### Get Groups by Platform ID

This endpoint retrieves all groups that belong to a specific platform, identified by the platform's ID.

**Endpoint Details:**
- **URL**: /api/groups/platform/:platformId
- **Method**: GET
- **Authentication**: Required (admin role for the platform)

**Request Parameters:**

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platformId | integer | Yes | The unique identifier for the platform |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of items per page (default: 25) |
| search | string | No | Search term to filter groups |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Paginated list of groups belonging to the platform

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| items | array | Array of group objects |
| itemsPerPage | integer | Number of items per page |
| currentPage | integer | Current page number |
| totalItems | integer | Total number of items across all pages |
| totalPages | integer | Total number of pages |
| searchTerm | string | Search term used (if any) |
| hasMore | boolean | Whether there are more pages available |

**Group Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier for the group |
| name | string | Name of the group |
| description | string | Description of the group (can be null) |
| slug | string | URL-friendly identifier for the group |
| coverImage | string | Filename of the group's cover image |
| visibility | string | Privacy setting of the group |
| purchaseLink | string | Optional link for purchasing access to the group |
| createdAt | string | ISO timestamp of when the group was created |
| updatedAt | string | ISO timestamp of when the group was last updated |
| PlatformId | integer | ID of the platform the group belongs to |
| groupCreatorId | integer | ID of the user who created the group |
| userCount | integer | Number of users in the group |

**Example Response:**
```json
{
  "items": [
    {
      "id": 134,
      "name": "private group",
      "description": null,
      "slug": "private-group",
      "coverImage": "1652800675986.jpg",
      "visibility": "private",
      "purchaseLink": null,
      "createdAt": "2022-05-17T04:51:15.000Z",
      "updatedAt": "2022-05-17T15:18:06.000Z",
      "PlatformId": 36,
      "groupCreatorId": 9846,
      "userCount": 3
    },
    {
      "id": 135,
      "name": "public group",
      "description": "This is a public group",
      "slug": "public-group",
      "coverImage": "1652800675987.jpg",
      "visibility": "public",
      "purchaseLink": null,
      "createdAt": "2022-05-17T05:30:20.000Z",
      "updatedAt": "2022-05-17T15:20:10.000Z",
      "PlatformId": 36,
      "groupCreatorId": 9846,
      "userCount": 15
    }
  ],
  "itemsPerPage": 25,
  "currentPage": 1,
  "totalItems": 2,
  "totalPages": 1,
  "searchTerm": "",
  "hasMore": false
}
```

**Error Responses:**
- **Code**: 400 Bad Request
  - **Content**: { error: "Error message" }

- **Code**: 403 Forbidden
  - **Content**: "Insufficient role"

- **Code**: 404 Not Found
  - **Content**: "Platform not found"

**Notes:**
- This endpoint is typically used by platform administrators to manage all groups within their platform.
- The response includes all groups regardless of visibility settings.
- The response is paginated, with a default of 25 items per page.

**Code Examples:**

**JavaScript:**
```javascript
const getGroupsByPlatformId = async (platformId, page = 1, limit = 25, search = '') => {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search })
    }).toString();
    
    const response = await fetch(`https://api.tribesocial.io/api/groups/platform/${platformId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions to access platform groups');
    }
    
    if (response.status === 404) {
      throw new Error('Platform not found');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch platform groups');
    }
    
    const groups = await response.json();
    return groups;
  } catch (error) {
    console.error('Error fetching platform groups:', error);
    throw error;
  }
};
```

## User Management

### Overview

User management in Tribe Social allows you to create, update, and manage user accounts across your platform. Users can have different roles and permissions, and can be associated with specific platforms and groups.

**User Roles:**
- **User**: Regular platform user
- **Admin**: Platform administrator with elevated privileges
- **Creator**: Content creator with specific content management permissions

**User Features:**
- User authentication and authorization
- Platform-specific user management
- Group membership management
- Role-based access control
- Profile customization

**User Properties:**
- Basic information (name, email)
- Profile details (photo, banner image)
- Platform association
- Group memberships
- Role and permissions
- Authentication status

**Database Fields:**

| Field Name | Type | Description | Default | Constraints |
|------------|------|-------------|---------|------------|
| name | STRING | User's full name | - | Not empty |
| email | STRING | User's email address | - | Required, Not empty |
| password | STRING | Hashed password | - | Optional |
| salt | STRING | Password salt | - | - |
| chatModerator | BOOLEAN | Whether user can moderate chats | false | Required |
| role | ENUM | User role | - | Required, One of: "free", "basic", "premium", "admin", "creator" |
| status | ENUM | Account status | "active" | Required, One of: "active", "pending" |
| resetToken | STRING | Password reset token | - | - |
| resetTokenUpdatedAt | STRING | Reset token timestamp | - | - |
| otp | STRING | One-time password | - | - |
| otpExpiry | DATE | OTP expiration date | - | - |
| photoUrl | STRING | Profile photo URL | - | - |
| bannerImageUrl | STRING | Profile banner URL | - | - |
| notes | TEXT | User notes/bio | - | - |
| city | STRING | User's city | - | - |
| state | TEXT | User's state(s) | - | - |
| platform | STRING | Platform identifier | - | - |
| providerId | ENUM | OAuth provider | - | One of: "google.com", "facebook.com" |
| providerEmail | STRING | OAuth email | - | - |
| providerPhotoUrl | STRING | OAuth profile photo | - | - |
| stripeCustomerId | STRING | Stripe customer ID | - | - |
| firebase_uid | STRING | Firebase user ID | - | - |
| customAnalyticsUrl | STRING | Analytics dashboard URL | - | - |
| banned | BOOLEAN | Whether user is banned | false | Required |
| additionalInfo | JSON | Additional user data | - | Optional |
| position | INTEGER | User's position/order | - | - |

**Error Handling:**

All user endpoints use standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | User not found |
| 500 | Internal server error |

### Add or Edit User

Create a new user or update an existing user's information.

**Endpoint:**

```
POST /api/user
```

**Request Body:**
```json
{
  "id": "string", // Optional - Include for updates
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "platformId": "string",
  "profileImage": "string",
  "bannerImage": "string",
  "bio": "string",
  "groupIds": ["string"],
  "isActive": boolean,
  "isVerified": boolean
}
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "platformId": "string",
  "profileImage": "string",
  "bannerImage": "string",
  "bio": "string",
  "groups": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "isActive": boolean,
  "isVerified": boolean,
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Notes:**
- If an id is provided in the request body, the endpoint will update the existing user
- If no id is provided, a new user will be created
- The role field must be one of: "user", "admin", "creator"
- Email addresses must be unique within a platform

### Delete User

Remove a user from the platform.

**Endpoint:**
```
DELETE /api/user/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The unique identifier of the user to delete |

**Response:**
```json
{
  "message": "User successfully deleted",
  "id": "string"
}
```

**Notes:**
- This action is permanent and cannot be undone
- Only platform administrators can delete users
- All associated user data will be removed
- Active sessions for the deleted user will be terminated

### Get Platform Admins

Retrieve a list of all administrators for a specific platform.

**Endpoint:**
```
GET /api/platform/:platformId/admins
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| platformId | string | The unique identifier of the platform |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number for pagination (optional) |
| limit | number | Number of results per page (optional) |

**Response:**
```json
{
  "admins": [
    {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "admin",
      "profileImage": "string",
      "isActive": boolean,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

**Notes:**
- Only platform administrators can access this endpoint
- Returns all admin users for the platform
- Results are paginated by default (20 items per page)
- Admins are sorted by creation date in descending order

## Platforms

### Overview

Platforms are the top-level organizational entities in the Tribe API. Each platform represents a distinct community or application instance with its own users, content, collections, groups, and settings.

**Platform Concepts:**

A platform in Tribe Social:
- Serves as a container for all other resources (users, content, collections, groups)
- Has its own unique configuration and settings
- Can be customized with white-labeling and custom domains
- Has platform-specific analytics and metrics
- Can have multiple administrators with different permission levels

**Available Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/platform/:id | GET | Get platform by ID |
| /api/platform/info | GET | Get platform information for the authenticated user |
| /api/platform/homepage/:url | GET | Get platform by homepage URL |
| /api/platform/slug/:slug | GET | Get platform by slug |
| /api/platform | POST | Create or update a platform |
| /api/platform/:id | DELETE | Delete a platform |
| /api/platforms/dashboard | GET | Get all platforms for dashboard (admin only) |
| /api/platform/analytics | GET | Get platform analytics |

**Platform Object Structure:**

A typical platform object includes the following properties:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Example Community",
  "slug": "example-community",
  "description": "A community for example purposes",
  "homepageURL": "https://example.tribesocial.io",
  "customDomain": "community.example.com",
  "logoURL": "https://example.com/logo.png",
  "faviconURL": "https://example.com/favicon.ico",
  "primaryColor": "#4A90E2",
  "secondaryColor": "#50E3C2",
  "tertiaryColor": "#F5A623",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-15T00:00:00.000Z",
  "settings": {
    "allowPublicRegistration": true,
    "requireEmailVerification": true,
    "defaultUserRole": "member"
  }
}
```

**Authentication Requirements:**

Most platform endpoints require authentication. Platform management operations (create, update, delete) typically require admin privileges. Some read-only endpoints may be accessible to authenticated users with various roles depending on the platform's configuration.

**Common Use Cases:**
- **Platform Creation**: Setting up a new community or application instance
- **Platform Configuration**: Customizing appearance, settings, and behavior
- **White Labeling**: Applying custom branding and domain settings
- **Platform Analytics**: Monitoring usage, engagement, and performance metrics
- **Platform Management**: Administrative operations for platform maintenance

### Get Platform by ID

This endpoint retrieves detailed information about a specific platform using its unique identifier.

**Endpoint:**
```
GET /api/platform/:id
```

**Authentication:**
No authentication required. This endpoint is publicly accessible.

**Parameters:**

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The unique identifier of the platform to retrieve |

**Response:**

**Success Response:**

**Code**: 200 OK

**Content Example**:
```json
{
  "id": 90,
  "name": "Tribe Social Members",
  "slug": "tribe",
  "description": "Training and Resources to turn you into a Tribe Social Expert!",
  "upgradeBtn": null,
  "heroImage": "1646920255868.png",
  "favIconImage": null,
  "heroBGColor": "#091235",
  "heroTextColor": "#fff",
  "primaryColor": "#307FE2",
  "secondaryColor": "#307FE2",
  "darkColor": "#091235",
  "lightColor": null,
  "heroImgOnly": false,
  "fathomAnalytics": null,
  "homepageUrl": "members.tribesocial.io",
  "upgradeUrl": "tribesocial.io",
  "logo": "1646920680134.svg",
  "premiumToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFzaWMiLCJpYXQiOjE2NDY5MjAzMTF9.qXqr4ko0kx5IO8_bG9e4ntB_EYGBNbhMEYxOg_Yvs_4",
  "basicToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicHJlbWl1bSIsImlhdCI6MTY0NjkyMDMxMX0._V-55OaUsbnB2udeHBd3mf5NrKIk0XusqwV4Bu5pGsU",
  "hideSignin": null,
  "timezone": "(UTC-05:00) Eastern Time (US & Canada)",
  "createdAt": "2022-03-10T13:51:51.000Z",
  "updatedAt": "2022-03-10T13:58:03.000Z"
}
```

**Error Response:**

**Condition**: If the platform with the specified ID does not exist.

**Code**: 404 Not Found

**Content**: "Not found"

**Notes:**
- This endpoint returns the complete platform object with all its properties.
- The response includes branding information such as colors, images, and URLs.
- The platform tokens included in the response should be handled securely.
- This endpoint is useful for retrieving platform details for display or configuration purposes.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/platform/90" \
-H "Content-Type: application/json"
```

### Get Platform Info

This endpoint retrieves comprehensive information about a platform, including associated content, creators, and configuration data. It's primarily designed for mobile app use.

**Caution:**
This is an internal endpoint primarily intended for mobile app integration. It returns a large amount of data in a single request and may not be suitable for all use cases.

**Endpoint:**
```
GET /api/platform/info
```

**Authentication:**
No authentication required. This endpoint is publicly accessible.

**Parameters:**

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platformId | string | Yes | The unique identifier of the platform to retrieve information for |

**Response:**

**Success Response:**

**Code**: 200 OK

**Content Example**:
```json
{
  "followingCreatorsContent": [...],
  "featuredChurches": [...],
  "featuredContent": null,
  "trendingContent": [...],
  "topics": [...],
  "ads": [...],
  "platformdata": {...}
}
```

The response includes several key sections:
- followingCreatorsContent: Content from creators the user is following
- featuredChurches: Featured groups or organizations on the platform
- featuredContent: Highlighted content (if available)
- trendingContent: Popular content on the platform
- topics: Available topics or categories
- ads: Advertisements configured for the platform
- platformdata: Complete platform configuration and settings

**Error Response:**
No specific error responses are documented for this endpoint. Standard HTTP error codes may apply.

**Notes:**
- This endpoint aggregates multiple data sources into a single response.
- It's optimized for mobile applications that need to load comprehensive platform data.
- The response size can be large due to the inclusion of content and configuration data.
- Consider using more specific endpoints for targeted data retrieval in web applications.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/platform/info?platformId=36" \
-H "Content-Type: application/json"
```

### Get Platform by Homepage URL

This endpoint retrieves platform information using its homepage URL.

**Deprecation Notice:**
This endpoint will be deprecated soon. Consider using alternative platform lookup methods.

**Endpoint:**
```
GET /api/platform/homepage/:url
```

**Authentication:**
No authentication required. This endpoint is publicly accessible.

**Parameters:**

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The homepage URL of the platform to retrieve |

**Response:**

**Success Response:**

**Code**: 200 OK

**Content Example**:
```json
{
  "id": 10,
  "name": "100x",
  "slug": "100x",
  "description": null,
  "upgradeBtn": null,
  "heroImage": null,
  "favIconImage": null,
  "heroBGColor": null,
  "heroTextColor": null,
  "primaryColor": null,
  "secondaryColor": null,
  "darkColor": null,
  "lightColor": null,
  "heroImgOnly": false,
  "fathomAnalytics": null,
  "homepageUrl": "100x.com",
  "upgradeUrl": "100x.com/upgrade",
  "logo": "1602032429041-brilliant.png",
  "premiumToken": null,
  "basicToken": null,
  "hideSignin": null,
  "timezone": "US/Eastern",
  "createdAt": "2020-10-02T08:15:17.000Z",
  "updatedAt": "2020-10-07T01:00:31.000Z"
}
```

**Error Response:**

**Condition**: If the platform with the specified homepage URL does not exist or another error occurs.

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint is useful for retrieving platform information when only the homepage URL is known.
- The URL parameter should be provided without the protocol (http:// or https://).
- This endpoint will be deprecated in a future API version.
- Consider using platform ID or slug for more reliable platform identification.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/platform/homepage/100x.com" \
-H "Content-Type: application/json"
```

### Get Platform by Slug

This endpoint retrieves detailed platform information using its unique slug identifier.

**Endpoint:**
```
GET /api/platform/slug/:slug
```

**Authentication:**
Authentication is optional. Authenticated requests may receive additional information based on user permissions.

**Parameters:**

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | The unique slug identifier of the platform (e.g., "inovo") |

**Response:**

**Success Response:**

**Code**: 200 OK

**Content Example**:
```json
{
  "id": 8,
  "name": "Tech Advice for Founders - Inovo",
  "slug": "inovo",
  "description": "",
  "upgradeBtn": null,
  "heroImage": "1645754926775.png",
  "favIconImage": null,
  "heroBGColor": "#091235",
  "heroTextColor": "#fff",
  "primaryColor": "#FF524B",
  "secondaryColor": null,
  "darkColor": "#091235",
  "lightColor": null,
  "heroImgOnly": true,
  "fathomAnalytics": null,
  "homepageUrl": "members.inovo.io",
  "upgradeUrl": "",
  "logo": "1645722042710.png",
  "premiumToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicHJlbWl1bSIsImlhdCI6MTY0NTc1MTIyM30.4CxMU6EN6vlYCwkI2gfjsPTeqVfkE6BEgRgOko8xSqk",
  "basicToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFzaWMiLCJpYXQiOjE2NDU3NTEyMjN9.ouAYseNMqwIO4wEFo5Es5c6mMNZVihgKKuXN8oGH2uM",
  "hideSignin": null,
  "timezone": "US/Eastern",
  "createdAt": "2020-10-01T12:25:11.000Z",
  "updatedAt": "2022-02-25T14:30:49.000Z",
  "Links": [
    {
      "id": 1,
      "title": "Google",
      "url": "https://google.com",
      "position": 1,
      "createdAt": "2020-10-03T19:27:28.000Z",
      "updatedAt": "2020-10-04T22:37:34.000Z",
      "PlatformId": 8
    },
    {
      "id": 3,
      "title": "Facebook",
      "url": "https://facebook.com",
      "position": 2,
      "createdAt": "2020-10-03T19:32:41.000Z",
      "updatedAt": "2020-10-04T22:37:21.000Z",
      "PlatformId": 8
    }
  ],
  "tags": [
    {
      "id": 256,
      "title": "GoDaddy"
    },
    {
      "id": 257,
      "title": "Domain Name"
    }
  ]
}
```

**Error Response:**

**Condition**: If the platform with the specified slug does not exist or another error occurs.

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint returns the complete platform object with all its properties.
- The response includes related data such as platform links and tags.
- The platform tokens included in the response should be handled securely.
- This is one of the most commonly used endpoints for retrieving platform information, as slugs are often used in URLs and are human-readable.

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/platform/slug/inovo" \
-H "Content-Type: application/json"
```

## Analytics

### Overview

The Tribe API provides several endpoints for tracking and retrieving analytics data about your platform, content, and users. These endpoints allow you to monitor engagement, track views, and analyze user behavior.

**Available Analytics Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/platform/analytics/:id | GET | Get user count by role for a platform |
| /api/view-data/week | GET | Get view data aggregated by week |
| /api/view-data | POST | Record a content view event |
| /api/video-analytics | POST | Record video watch analytics |

**Analytics Data Types:**

The Tribe API tracks several types of analytics data:

1. **User Analytics** - Information about user counts, roles, and engagement
2. **Content Analytics** - View counts and engagement metrics for content
3. **Video Analytics** - Specialized metrics for video content, including watch duration
4. **Platform Analytics** - Overall platform usage and performance metrics

**Custom Analytics:**

Platform administrators and creators can also:
- Access custom analytics dashboards in the web interface
- Configure custom analytics URLs for specialized tracking
- Export analytics data for further analysis in external tools

**Database Analytics:**

For advanced analytics needs, direct SQL queries can be executed against the database to retrieve detailed analytics information. Examples include:

- Total views by content
- User engagement over time
- Content performance metrics

**Notes:**
- Analytics data is collected automatically when users interact with content
- View events can be recorded for both authenticated and anonymous users
- Analytics endpoints typically require admin or creator authentication
- Data is typically aggregated to protect user privacy while providing meaningful insights

### Get Platform Analytics

Retrieves user count statistics by role for a specific platform.

**Endpoint:**
```
GET /api/platform/analytics/:id
```

**Authentication:**
Authentication is required. The user must have an **admin** role.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The ID of the platform to retrieve analytics for |

**Response:**

**Success Response:**

**Code**: 200 OK

**Content**:
```json
{
  "free": 88,
  "premium": 52,
  "basic": 281,
  "admin": 6
}
```

The response contains a count of users for each role type:
- free: Number of users with the free role
- premium: Number of users with the premium role
- basic: Number of users with the basic role
- admin: Number of users with the admin role

**Error Response:**

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint is primarily used for dashboard displays and administrative reporting
- The counts represent the current state of user roles, not historical data
- Only platform administrators can access this data to protect user privacy
- The data is retrieved directly from the database and is not cached

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/platform/analytics/36" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json"
```

### View Data by Week

Retrieves aggregated view data organized by week for the authenticated creator's content.

**Endpoint:**
```
GET /api/view-data/week
```

**Authentication:**
Authentication is required. The user must have a **creator** role.

**Query Parameters:**
None

**Response:**

**Success Response:**

**Code**: 200 OK

**Content**:
```json
[
  {
    "date": "06/07/2022",
    "count": 0
  },
  {
    "date": "06/13/2022",
    "count": 1
  }
]
```

The response is an array of objects, each containing:
- date: The start date of the week in MM/DD/YYYY format
- count: The number of views recorded during that week

**Error Response:**

**Code**: 400 Bad Request

**Content**: {error}

**Notes:**
- This endpoint returns view data for all content owned by the authenticated creator
- The data is aggregated by week to provide a time-series view of engagement
- Weeks typically start on Monday and end on Sunday
- The response includes a series of consecutive weeks, even those with zero views
- This endpoint is commonly used for generating trend charts in creator dashboards

**Example:**
```
curl -X GET "https://api.tribesocial.io/api/view-data/week" \
-H "Authorization: Bearer YOUR_AUTH_TOKEN" \
-H "Content-Type: application/json"
```

### Create View Event

Records that a specific content item was viewed by a user.

**Endpoint:**
```
POST /api/view-data
```

**Authentication:**
Authentication is optional. If provided, the view will be associated with the authenticated user. If not provided, the view will be recorded as anonymous.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|---

**Notes:**
- Content visibility depends on the user's role and the group's visibility settings.
- For private groups, only members can view the content.
- The response is paginated, with a default of 25 items per page.

**Code Examples:**

**JavaScript:**
```javascript
const getGroupContents = async (slug, page = 1, limit = 25, search = '') => {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search })
    }).toString();
    
    const response = await fetch(`https://api.tribesocial.io/api/group/${slug}/contents?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions to access this group');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch group contents');
    }
    
    const contents = await response.json();
    return contents;
  } catch (error) {
    console.error('Error fetching group contents:', error);
    throw error;
  }
};
```

### Get Group Collections

This endpoint retrieves collections that belong to a specific group, identified by the group's slug.

**Endpoint Details:**
- **URL**: /api/group/:slug/collections
- **Method**: GET
- **Authentication**: Optional (affects collection visibility based on user permissions)

**Request Parameters:**

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | The URL-friendly identifier for the group |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of items per page (default: 25) |
| search | string | No | Search term to filter collections |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Paginated list of collections belonging to the group

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| items | array | Array of collection objects |
| itemsPerPage | integer | Number of items per page |
| currentPage | integer | Current page number |
| totalItems | integer | Total number of items across all pages |
| totalPages | integer | Total number of pages |
| searchTerm | string | Search term used (if any) |
| hasMore | boolean | Whether there are more pages available |

**Collection Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier for the collection |
| name | string | Name of the collection |
| slug | string | URL-friendly identifier for the collection |
| description | string | Description of the collection (can be null) |
| featuredImage | string | Filename of the collection's featured image |
| visibility | string | Privacy setting of the collection |
| createdAt | string | ISO timestamp of when the collection was created |
| updatedAt | string | ISO timestamp of when the collection was last updated |
| PlatformId | integer | ID of the platform the collection belongs to |
| UserId | integer | ID of the user who created the collection |
| contentCount | integer | Number of content items in the collection |
| Groups | array | Array of groups the collection belongs to |

**Example Response:**
```json
{
  "items": [
    {
      "id": 245,
      "name": "Marketing Strategies",
      "slug": "marketing-strategies",
      "description": "A collection of marketing strategy resources",
      "featuredImage": "1649083201463.png",
      "visibility": "premium",
      "createdAt": "2022-04-04T14:38:15.000Z",
      "updatedAt": "2022-04-04T14:40:09.000Z",
      "PlatformId": 36,
      "UserId": 6604,
      "contentCount": 12,
      "Groups": [
        {
          "id": 134,
          "name": "private group",
          "slug": "private-group"
        }
      ]
    }
  ],
  "itemsPerPage": 25,
  "currentPage": 1,
  "totalItems": 5,
  "totalPages": 1,
  "searchTerm": "",
  "hasMore": false
}
```

**Error Responses:**
- **Code**: 400 Bad Request
  - **Content**: { error: "Error message" }

- **Code**: 403 Forbidden
  - **Content**: "Insufficient role"

**Notes:**
- Collection visibility depends on the user's role and the group's visibility settings.
- For private groups, only members can view the collections.
- The response is paginated, with a default of 25 items per page.

**Code Examples:**

**JavaScript:**
```javascript
const getGroupCollections = async (slug, page = 1, limit = 25, search = '') => {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search })
    }).toString();
    
    const response = await fetch(`https://api.tribesocial.io/api/group/${slug}/collections?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions to access this group');
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch group collections');
    }
    
    const collections = await response.json();
    return collections;
  } catch (error) {
    console.error('Error fetching group collections:', error);
    throw error;
  }
};
```

### Remove User from Group

This endpoint allows you to remove a user from a specific group.

**Endpoint Details:**
- **URL**: /api/group/:id/user/:userId
- **Method**: DELETE
- **Authentication**: Required (admin role for the group)

**Request Parameters:**

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The unique identifier for the group |
| userId | integer | Yes | The unique identifier for the user to remove |

**Response:**

**Success Response:**
- **Code**: 200 OK
- **Content**: Success message

**Example Response:**
```json
{
  "message": "User removed from group successfully"
}
```

**Error Responses:**
- **Code**: 400 Bad Request
  - **Content**: { error: "Error message" }

- **Code**: 403 Forbidden
  - **Content**: "Insufficient role"