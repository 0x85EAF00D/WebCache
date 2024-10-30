import React, { useState } from 'react';
import styles from './SavePage.module.css'; // Import the CSS module

const SavePage = () => {
  const [link, setLink] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(new Set()); // Track IP links
  const [error, setError] = useState(''); // store errors
  const [isSubmitting, setIsSubmitting] = useState(false); // Use state to track submission status

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      alert("Please enter a valid link!");
      return;
    }

    // Block further submissions if a submission is IP
    if (isSubmitting || loadingLinks.has(trimmedLink)) {
      setError('This link is already being processed. Please wait.');
      return;
    }

    try {
      setIsSubmitting(true); // Block further submissions
      setLoadingLinks((prev) => new Set(prev).add(trimmedLink));
      setError(''); // Clear any previous errors

      const response = await fetch('http://localhost:3000/api/save-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: trimmedLink }),
      });

      const result = await response.json();

      if (response.ok) {
        // alert('Link saved successfully!');
        alert(`${result.message}`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit the link.');
    } finally {
      // Remove the link from loading state once HTTrack process is completed
      setLoadingLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trimmedLink);
        return newSet;
      });
      setIsSubmitting(false); // Set back to F to allow future submissions
      setLink(''); // Clear input
    }
  };

  return (
    <div className={styles.form}>
      <h1>Save a Link</h1>
      <form onSubmit={handleSubmit}>
        <label className={styles.label}>
          Paste a link:
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com"
            required
            className={styles.input}
          />
        </label>
        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting || loadingLinks.has(link.trim())}
        >
          {loadingLinks.has(link.trim()) ? 'Processing...' : 'Save Link'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SavePage;
