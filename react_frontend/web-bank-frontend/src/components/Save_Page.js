import React, { useState } from 'react';
import styles from './SavePage.module.css'; // Import the CSS module

const SavePage = () => {
  const [link, setLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!link.trim()) {
      alert("Please enter a valid link!");
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/save-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: link.trim() }),
      });
  
      const result = await response.json();
      
      if (response.ok) {
        alert('Link saved successfully!');
      } else {
        alert(`Error: ${result.message}`);
      }
  
      setLink('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit the link.');
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
        <button type="submit" className={styles.button}>Save Link</button>
      </form>
    </div>
  );
};

export default SavePage;