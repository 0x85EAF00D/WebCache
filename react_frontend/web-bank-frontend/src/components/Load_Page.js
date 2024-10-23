import React, { useState, useEffect } from 'react';
import { 
  Container,
  Card,
  CardContent,
  Typography,
  Link,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from 'lucide-react';
import styles from './LoadPage.module.css';

const LoadPage = () => {
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    // Filter websites whenever search query changes
    const filtered = websites.filter(website => 
      website.link.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWebsites(filtered);
  }, [searchQuery, websites]);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/get-links');
      const data = await response.json();
      
      if (response.ok) {
        setWebsites(data);
        setFilteredWebsites(data); // Initialize filtered results with all websites
      } else {
        setError('Failed to load websites');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to fetch websites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" className={styles.container}>
        <div className={styles.loading}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" className={styles.container}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className={styles.container}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Saved Websites
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search websites..."
        value={searchQuery}
        onChange={handleSearchChange}
        className={styles.searchField}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          ),
        }}
      />
      
      <Stack spacing={2} className={styles.websiteList}>
        {filteredWebsites.length === 0 ? (
          <Typography color="text.secondary" align="center">
            {websites.length === 0 ? 'No websites saved yet' : 'No matching websites found'}
          </Typography>
        ) : (
          filteredWebsites.map((website, index) => (
            <Card key={index} className={styles.card}>
              <CardContent>
                <Link
                  href={website.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  className={styles.link}
                >
                  {website.link}
                </Link>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  className={styles.date}
                >
                  Saved on: {new Date(website.savedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  );
};

export default LoadPage;