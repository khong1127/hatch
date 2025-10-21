---
timestamp: 'Sun Oct 19 2025 08:46:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_084644.ee72e126.md]]'
content_id: e0b2e662a4d4fcf03b3f51fbbe28d66c7d94b9eeca401f7295c4ddcbbe1d5adc
---

# API Specification: Friending Concept

**Purpose:** allow users to add each other as friends to share information with

***

## API Endpoints

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from one user to another.

**Requirements:**

* sender is not the receiver
* friend request from sender to receiver or vice versa does not already exist

**Effects:**

* creates a new friend request from sender to receiver

**Request Body:**

```json
{
  "sender": "User",
  "receiver": "User"
}
```

**Success Response Body (Action):**

```json
{
  "request": "FriendRequest"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/acceptRequest

**Description:** Accepts an existing friend request, establishing a friendship between the users.

**Requirements:**

* request from sender to receiver to exist

**Effects:**

* removes friend request
* records friendship between sender and receiver

**Request Body:**

```json
{
  "sender": "User",
  "receiver": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/denyRequest

**Description:** Denies an existing friend request.

**Requirements:**

* request from sender to receiver to exist

**Effects:**

* removes friend request

**Request Body:**

```json
{
  "sender": "User",
  "receiver": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/removeFriend

**Description:** Removes an existing friendship between two users.

**Requirements:**

* friendship between user and to\_be\_removed\_friend must exist

**Effects:**

* removes friendship between user and to\_be\_removed\_friend

**Request Body:**

```json
{
  "user": "User",
  "to_be_removed_friend": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
