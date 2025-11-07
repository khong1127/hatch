---
timestamp: 'Thu Nov 06 2025 08:42:18 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_084218.b18bba91.md]]'
content_id: 88216233dbc2d2eed96316f924415e55a50b8d68ade06a9fbd5e4a274e5cadec
---

# API Specification: PasswordAuthentication Concept

**Purpose:** limit access to known users

***

## API Endpoints

### POST /api/PasswordAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

* username to not already exist in the set of Users

**Effects:**

* creates a new user of that username and password
* adds that user to the set of users
* returns the new user

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/authenticate

**Description:** Authenticates a user with the provided username and password.

**Requirements:**

* user of the argument username and password to exist in the set of Users

**Effects:**

* returns the corresponding User

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/changePassword

**Description:** Changes the password for an existing user.

**Requirements:**

* user must exist

**Effects:**

* updates the password for the specified user

**Request Body:**

```json
{
  "user": "string",
  "newPassword": "string"
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

### POST /api/PasswordAuthentication/\_getUserByUsername

**Description:** Retrieves a user's full document by their username.

**Requirements:**

* (Implicit: username argument must be provided)

**Effects:**

* returns an array containing the user document if found, otherwise an empty array.

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getUserById

**Description:** Retrieves a user's full document by their ID.

**Requirements:**

* (Implicit: id argument must be provided)

**Effects:**

* returns an array containing the user document if found, otherwise an empty array.

**Request Body:**

```json
{
  "id": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getAllUsers

**Description:** Retrieves all user documents in the system.

**Requirements:**

* true

**Effects:**

* returns an array of all user documents.

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_userExistsById

**Description:** Checks if a user with the given ID exists.

**Requirements:**

* true

**Effects:**

* returns an array containing `{"exists": true}` if a user with the given ID exists, otherwise an empty array `[]`

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "exists": "boolean"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_userExistsByUsername

**Description:** Checks if a user with the given username exists.

**Requirements:**

* true

**Effects:**

* returns an array containing `{"exists": true}` if a user with the given username exists, otherwise an empty array `[]`

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "exists": "boolean"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
