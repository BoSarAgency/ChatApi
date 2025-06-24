const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Create database file in the project root
      const dbPath = path.join(__dirname, "messages.db");

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          reject(err);
          return;
        }
        console.log("Connected to SQLite database");
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createMessagesTable = `
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    thread_id TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

      this.db.run(createMessagesTable, (err) => {
        if (err) {
          console.error("Error creating messages table:", err.message);
          reject(err);
          return;
        }
        console.log("Messages table created or already exists");
        resolve();
      });
    });
  }

  async saveMessage(threadId, role, content) {
    return new Promise((resolve, reject) => {
      const query = `
                INSERT INTO messages (thread_id, role, content)
                VALUES (?, ?, ?)
            `;

      this.db.run(query, [threadId, role, content], function (err) {
        if (err) {
          console.error("Error saving message:", err.message);
          reject(err);
          return;
        }
        // console.log(`Message saved with ID: ${this.lastID}`);
        resolve(this.lastID);
      });
    });
  }

  async getMessagesByThread(threadId) {
    return new Promise((resolve, reject) => {
      const query = `
                SELECT * FROM messages 
                WHERE thread_id = ? 
                ORDER BY created_at ASC
            `;

      this.db.all(query, [threadId], (err, rows) => {
        if (err) {
          console.error("Error fetching messages:", err.message);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err.message);
            reject(err);
            return;
          }
          console.log("Database connection closed");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
