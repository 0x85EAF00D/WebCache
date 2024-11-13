import React, { useState, useEffect, useRef } from 'react';
import styles from './SavePage.module.css';
import Notification from './Notification';

const SavePage = () => {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [notification, setNotification] = useState(null);
  const loadingLinks = useRef(new Set());

  // Format the URL before proceeding
  const formatURL = (url) => {
    let formattedURL = url.trim();
  
    // If the URL starts with "https://" or "http://", return it as is
    if (formattedURL.startsWith("https://") || formattedURL.startsWith("http://")) {
      return formattedURL;
    } else if (formattedURL.startsWith("www")) {
      // Add "https://" if the URL does not start with a protocol
      formattedURL = `https://${formattedURL}`;
    }else{
      formattedURL = `https://www.${formattedURL}`;
    }
  
    return formattedURL;
  };

  // Check if link is already in queue or is being processed
  const isLinkInQueue = (formattedLink) => {
    return queue.some((item) => item.link === formattedLink);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents pg from refreshing

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      alert("Please enter a website address!");
      return;
    }

    // Format the URL before proceeding
    const formattedLink = formatURL(trimmedLink);

    // Block further submissions if a submission is in progress or duplicate exists in queue
    if (isLinkInQueue(formattedLink)) {
      setError('This link is already in the queue or is being processed.');
      return;
    }

    // Add link to queue
    setError('');
    setQueue((prevQueue) => [...prevQueue, { link: formattedLink, status: 'queued' }]);
    setLink('');
  };


  // Process the next link in the queue (FIFO)
  useEffect(() => {
    const processNextLink = async () => {
      if (queue.length === 0) return;

      // Find the first link with a queued status
      const firstQueuedItem = queue.find((item, index) => item.status === 'queued' && index === 0);
      if (!firstQueuedItem) return;

      // Set the first items' status to processing
      loadingLinks.current.add(firstQueuedItem.link);
      updateLinkStatus(firstQueuedItem.link, 'processing');

      try {
        const response = await fetch('http://localhost:3000/api/save-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ link: firstQueuedItem.link }),
        });

        const result = await response.json();

        if (response.ok) {
          setNotification({ message: result.message, type: 'success' });
        } else {
          setNotification({ message: `Error: ${result.message}`, type: 'error' });
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit the link.');
      } finally {
        // Remove the link from the loading set and queue
        loadingLinks.current.delete(firstQueuedItem.link);
        setQueue((prevQueue) => prevQueue.filter((item) => item.link !== firstQueuedItem.link));
      }
    };

    // Start processing if there are queued links
    if (queue.some((item) => item.status === 'queued' && !loadingLinks.current.has(item.link))) {
      processNextLink();
    }
  }, [queue]);

  // Update the status of a link in the queue
  const updateLinkStatus = (link, status) => {
    setQueue((prevQueue) =>
      prevQueue.map((item) => (item.link === link ? { ...item, status } : item))
    );
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
        <button type="submit" className={styles.button}>
          Add to Queue
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className={styles.queueList}>
        <h2>Queue Status</h2>
        {queue.length === 0 ? (
          <p>No links in the queue.</p>
        ) : (
          queue.map((item, index) => (
            <p key={index} style={{ color: item.status === 'processing' ? 'blue' : 'gray' }}>
              {item.status === 'processing' ? 'Processing' : 'Queued'}: {item.link}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default SavePage;
