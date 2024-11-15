import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

const LoadPage = () => {
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

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

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    const filtered = websites.filter(
      (website) =>
        website.web_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWebsites(filtered);
  }, [searchQuery, websites]);

  const fetchWebsites = async () => {
    try {
      console.log("Fetching websites...");
      const response = await fetch("http://localhost:3000/api/get-links");

      if (!response.ok) {
        throw new Error(`Failed to load websites: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      setWebsites(data);
      setFilteredWebsites(data);
    } catch (error) {
      console.error("Error during fetch:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFileOpen = async (website) => {
    try {
      const url = `/api/saved-page?path=${encodeURIComponent(
        website.file_path
      )}`;
      console.log("Opening saved page:", url);

      const newWindow = window.open(url, "_blank");
      if (newWindow === null) {
        throw new Error(
          "Popup blocked or failed to open. Please allow popups for this site."
        );
      }
    } catch (error) {
      console.error("Error opening file:", error);
      setDebugInfo({
        error: {
          message: error.message,
          stack: error.stack,
          type: error.name,
        },
        filePath: website.file_path,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="d-flex flex-column align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Saved Websites</h1>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {debugInfo && (
        <div className="card mb-4 border-0">
          <div className="card-body">
            <h5 className="card-title">Debug Info:</h5>
            <pre className="small overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8">
          <div className="input-group">
            <span className="input-group-text border-end-0 bg-body">
              <Search size={20} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search websites..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-10">
          {filteredWebsites.length === 0 ? (
            <div className="text-center text-muted">
              <p>
                {websites.length === 0
                  ? "No websites saved yet"
                  : "No matching websites found"}
              </p>
            </div>
          ) : (
            <div className="list-group">
              {filteredWebsites.map((website, index) => (
                <div
                  key={index}
                  className="list-group-item list-group-item-action p-3"
                  onClick={() => handleFileOpen(website)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex flex-column">
                    <h5 className="mb-1 text-primary">
                      {website.title || "Untitled"}
                    </h5>
                    <p className="mb-1 text-break small">{website.web_url}</p>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-body-secondary">
                        Saved on:{" "}
                        {new Date(website.created).toLocaleDateString()}
                      </small>
                      <span
                        className={`badge ${
                          website.exists
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }`}
                      >
                        {website.exists ? "Available" : "Missing"}
                      </span>
                    </div>
                    <small className="text-body-secondary mt-1 text-break">
                      File: {website.file_path}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadPage;
