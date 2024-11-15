import React, { useState, useEffect, useRef } from "react";
import { PlusCircle } from "lucide-react";
import Notification from "./Notification";

const SavePage = () => {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [queue, setQueue] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const loadingLinks = useRef(new Set());

  useEffect(() => {
    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Apply data-bs-theme attribute to body when dark mode changes
    document.body.setAttribute("data-bs-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Format the URL before proceeding
  const formatURL = (url) => {
    let formattedURL = url.trim();

    if (
      formattedURL.startsWith("https://") ||
      formattedURL.startsWith("http://")
    ) {
      return formattedURL;
    } else if (formattedURL.startsWith("www")) {
      formattedURL = `https://${formattedURL}`;
    } else {
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
    e.preventDefault();

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      setError("Please enter a website address!");
      return;
    }

    // Format the URL before proceeding
    const formattedLink = formatURL(trimmedLink);

    // Block further submissions if duplicate exists in queue
    if (isLinkInQueue(formattedLink)) {
      setError("This link is already in the queue or is being processed.");
      return;
    }

    // Add link to queue
    setError("");
    setQueue((prevQueue) => [
      ...prevQueue,
      { link: formattedLink, status: "queued" },
    ]);
    setLink("");
  };

  // Process the next link in the queue (FIFO)
  useEffect(() => {
    const processNextLink = async () => {
      if (queue.length === 0) return;

      // Find the first link with a queued status
      const firstQueuedItem = queue.find(
        (item, index) => item.status === "queued" && index === 0
      );
      if (!firstQueuedItem) return;

      // Set the first items' status to processing
      loadingLinks.current.add(firstQueuedItem.link);
      updateLinkStatus(firstQueuedItem.link, "processing");

      try {
        const response = await fetch("http://localhost:3000/api/save-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ link: firstQueuedItem.link }),
        });

        const result = await response.json();

        if (response.ok) {
          setNotification({ message: result.message, type: "success" });
        } else {
          setNotification({
            message: `Error: ${result.message}`,
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        setNotification({
          message: "Failed to submit the link",
          type: "error",
        });
      } finally {
        // Remove the link from the loading set and queue
        loadingLinks.current.delete(firstQueuedItem.link);
        setQueue((prevQueue) =>
          prevQueue.filter((item) => item.link !== firstQueuedItem.link)
        );
      }
    };

    // Start processing if there are queued links
    if (
      queue.some(
        (item) =>
          item.status === "queued" && !loadingLinks.current.has(item.link)
      )
    ) {
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
    <div className="container py-4">
      <h1 className="text-center mb-4">Save a Website</h1>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="urlInput" className="form-label">
                    Enter a website URL:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0 bg-body">
                      <PlusCircle size={20} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      id="urlInput"
                      placeholder="example.com"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <div className="text-danger mt-2 small">{error}</div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Add to Queue
                </button>
              </form>
            </div>
          </div>

          {queue.length > 0 && (
            <div className="card mt-4 border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="card-title mb-3">Queue Status</h5>
                <div className="list-group list-group-flush">
                  {queue.map((item, index) => (
                    <div key={index} className="list-group-item border-0 px-0">
                      <div className="d-flex align-items-center">
                        {item.status === "processing" ? (
                          <div
                            className="spinner-border spinner-border-sm text-primary me-2"
                            role="status"
                          >
                            <span className="visually-hidden">
                              Processing...
                            </span>
                          </div>
                        ) : (
                          <div
                            className="spinner-grow spinner-grow-sm text-secondary me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Queued...</span>
                          </div>
                        )}
                        <div className="ms-2">
                          <div className="small fw-medium">
                            {item.status === "processing"
                              ? "Processing"
                              : "Queued"}
                          </div>
                          <div className="small text-body-secondary text-break">
                            {item.link}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default SavePage;
