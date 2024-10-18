import React, { useState, useEffect } from 'react';
import { 
  Container,
  Card,
  CardContent,
  Typography,
  Link,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import styles from './LoadPage.module.css';

const LoadPage = () => {
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/get-links');
      const data = await response.json();
      
      if (response.ok) {
        setWebsites(data);
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
      
      <Stack spacing={2}>
        {websites.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No websites saved yet
          </Typography>
        ) : (
          websites.map((website, index) => (
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