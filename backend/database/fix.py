import sqlite3
import json
from datetime import datetime

def fix_database():
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check existing database structure
    print("Checking database structure...")

    # Check if reviews table exists
    reviews_table = cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'"
    ).fetchone()

    if reviews_table:
        print("Reviews table exists, checking columns...")
        columns = cursor.execute("PRAGMA table_info(reviews)").fetchall()
        column_names = [col['name'] for col in columns]
        print(f"Columns in reviews table: {column_names}")

        # Check if rating column exists
        if 'rating' not in column_names:
            print("Adding 'rating' column to reviews table...")
            try:
                cursor.execute("ALTER TABLE reviews ADD COLUMN rating INTEGER NOT NULL DEFAULT 3")
                print("Rating column added successfully")
            except sqlite3.Error as e:
                print(f"Error adding rating column: {e}")
    else:
        print("Reviews table doesn't exist, creating it...")
        try:
            cursor.execute('''
                CREATE TABLE reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId TEXT NOT NULL,
                    postId INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(userId, postId)
                )
            ''')
            print("Reviews table created successfully")
        except sqlite3.Error as e:
            print(f"Error creating reviews table: {e}")

    # Commit changes
    conn.commit()
    conn.close()
    print("Database check/fix completed")

if __name__ == "__main__":
    fix_database()