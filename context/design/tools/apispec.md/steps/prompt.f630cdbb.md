---
timestamp: 'Mon Oct 20 2025 23:23:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_232301.5975e77a.md]]'
content_id: f630cdbbc40e7193c429ac42a14225213845e363630735f60e65460dd9212de6
---

# prompt: Please extract an API for this app from the following five concepts:

## PasswordAuthentication

Specification:

**Concept: PasswordAuthentication (User)**

* **purpose** limit access to known users
* **principle** after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user
* **state**
  * a set of Users with
    * a username String
    * a password String
* **actions**
  * register (username: String, password: String): (user: User)
    * *requires* username to not already exist in the set of Users
    * *effects* creates a new user of that username and password, adds that user to the set of users, and returns the new user
  * authenticate (username: String, password: String): (user: User)
    * *requires* user of the argument username and password to exist in the set of Users
    * *effects* returns the corresponding User

Code:
