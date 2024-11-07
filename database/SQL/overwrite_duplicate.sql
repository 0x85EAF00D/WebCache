UPDATE websites
SET title = ?, file_path = ?, created = CURRENT_TIMESTAMP
WHERE web_url = ?;