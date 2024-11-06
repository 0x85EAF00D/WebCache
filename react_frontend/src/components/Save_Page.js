import React, { useState } from 'react';
import styles from './SavePage.module.css';

const SavePage = () => {
  const [link, setLink] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(new Set());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatURL = (url) => {
    let formattedURL = url.trim();
    
    // If URL already starts with http:// or https://, return it as is
    if (formattedURL.match(/^https?:\/\//)) {
      return formattedURL;
    }
    
    // Add https:// if missing
    formattedURL = `https://${formattedURL}`;
    
    return formattedURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      alert("Please enter a website address!");
      return;
    }

    // Format the URL before proceeding
    const formattedLink = formatURL(trimmedLink);

    // Block further submissions if a submission is in progress
    if (isSubmitting || loadingLinks.has(formattedLink)) {
      setError('This link is already being processed. Please wait.');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadingLinks((prev) => new Set(prev).add(formattedLink));
      setError('');

      const response = await fetch('http://localhost:3000/api/save-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: formattedLink }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${result.message}`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit the link.');
    } finally {
      setLoadingLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(formattedLink);
        return newSet;
      });
      setIsSubmitting(false);
      setLink('');
    }
  };

  return (
    <div className={styles.form}>
      <h1>Save a Link</h1>
      <form onSubmit={handleSubmit}>
        <label className={styles.label}>
          Enter a website:
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="example.com"
            required
            className={styles.input}
          />
        </label>
        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting || loadingLinks.has(formatURL(link.trim()))}
        >
          {loadingLinks.has(formatURL(link.trim())) ? 'Processing...' : 'Save Link'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SavePage;