import React, { useEffect } from "react";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationClass = () => {
    switch (type) {
      case "error":
        return "alert-danger";
      case "success":
        return "alert-success";
      default:
        return "alert-info";
    }
  };

  return (
    <div
      className={`alert ${getNotificationClass()} position-fixed top-0 end-0 m-3`}
      style={{ zIndex: 1050, maxWidth: "300px", opacity: 0.95 }}
      role="alert"
    >
      {message}
    </div>
  );
};

export default Notification;
