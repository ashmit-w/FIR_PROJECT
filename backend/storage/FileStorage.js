const fs = require('fs');
const path = require('path');

// Simple file-based storage for users
const USERS_FILE = path.join(__dirname, 'users.json');

class FileStorage {
  constructor() {
    this.users = new Map();
    this.loadUsers();
  }

  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const usersArray = JSON.parse(data);
        usersArray.forEach(user => {
          this.users.set(user.username, user);
        });
        console.log(`📁 Loaded ${this.users.size} users from file storage`);
      }
    } catch (error) {
      console.error('Error loading users from file:', error.message);
    }
  }

  saveUsers() {
    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('Error saving users to file:', error.message);
    }
  }

  set(username, user) {
    this.users.set(username, user);
    this.saveUsers();
  }

  get(username) {
    return this.users.get(username);
  }

  has(username) {
    return this.users.has(username);
  }

  values() {
    return this.users.values();
  }

  size() {
    return this.users.size;
  }
}

module.exports = FileStorage;
