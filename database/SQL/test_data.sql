--Fake data for testing queries
INSERT INTO websites (web_url, title, file_path)
VALUES  
('www.google.com', 'Google', './google'),
('www.wikipedia.org', 'Wikipedia', './folder/subfolder/wikipedia'),
('www.youtube.com', 'YouTube', './folder/youtube'),
('www.ebay.com', 'Ebay', './ebay'),
('www.amazon.com', 'Amazon', './folder/amazon');

--Refresh SQLite Explorer after running the query if the data doesn't appear