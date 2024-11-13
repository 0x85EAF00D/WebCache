/* This code will display a notification after each URL is processed that will automatically disappear
within 3 seconds */

import React, { useEffect } from 'react';
import styles from './Notification.module.css';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    // Set the notification on a timer to disappear after 3s
    const timer = setTimeout(() => {
      onClose();
    }, 3000); 

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.notification} ${type === 'error' ? styles.error : styles.success}`}>
      {message}
    </div>
  );
};

export default Notification;
