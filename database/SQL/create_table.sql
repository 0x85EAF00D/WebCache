--Query to initialize the database
--If websites.db is ever deleted by accident, create a new websites.db and run this query to restore the table
CREATE TABLE websites(
    web_url TEXT PRIMARY KEY,
    title TEXT,
    file_path TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
)