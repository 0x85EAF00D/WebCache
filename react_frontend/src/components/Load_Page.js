import React, { useState, useEffect } from "react";
import { Search, Trash2, Edit2 } from "lucide-react";

const LoadPage = () => {
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [sortOption, setSortOption] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    websiteId: null,
    websiteTitle: "",
  });
  const [titleEdit, setTitleEdit] = useState({
    show: false,
    websiteId: null,
    currentTitle: "",
    newTitle: "",
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
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

    if (sortOption === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "dateAdded") {
      filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    
    setFilteredWebsites(filtered);
  }, [searchQuery, websites, sortOption]);

  const fetchWebsites = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/get-links");
      if (!response.ok) {
        throw new Error(`Failed to load websites: ${response.status}`);
      }
      const data = await response.json();
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

  const handleDeleteClick = (websiteId, websiteTitle) => {
    setDeleteConfirmation({
      show: true,
      websiteId,
      websiteTitle,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/delete-website/${deleteConfirmation.websiteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete website: ${response.status}`);
      }

      const updatedWebsites = websites.filter(
        (website) => website.id !== deleteConfirmation.websiteId
      );
      setWebsites(updatedWebsites);
      setDeleteConfirmation({ show: false, websiteId: null, websiteTitle: "" });
    } catch (error) {
      console.error("Error deleting website:", error);
      setError("Failed to delete website. Please try again.");
    }
  };

  const handleFileOpen = async (website) => {
    try {
      const url = `/api/saved-page?path=${encodeURIComponent(
        website.file_path
      )}`;
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

  const handleTitleEditClick = (websiteId, currentTitle) => {
    setTitleEdit({
      show: true,
      websiteId,
      currentTitle,
      newTitle: currentTitle,
    });
  };

  const handleTitleEditChange = (event) => {
    setTitleEdit({
      ...titleEdit,
      newTitle: event.target.value,
    });
  };

  const handleTitleEditSubmit = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/website/${titleEdit.websiteId}/update-title`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: titleEdit.newTitle,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update title: ${response.status}`);
      }

      const updatedWebsite = await response.json();

      // Update local state with response from server
      const updatedWebsites = websites.map((website) =>
        website.id === titleEdit.websiteId
          ? { ...website, title: updatedWebsite.title }
          : website
      );

      setWebsites(updatedWebsites);
      setTitleEdit({
        show: false,
        websiteId: null,
        currentTitle: "",
        newTitle: "",
      });
    } catch (error) {
      console.error("Error updating title:", error);
      setError("Failed to update title. Please try again.");
    }
  };

  // Allows the user to sort A-Z or by date added
  const handleSortChange = (event) => {
    const option = event.target.value;
    setSortOption(option);
  
    let sortedWebsites = [...websites];
    if (option === "alphabetical") {
      sortedWebsites.sort((a, b) => a.title.localeCompare(b.title));
    } else if (option === "dateAdded") {
      sortedWebsites.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
  
    setFilteredWebsites(sortedWebsites);
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

      {/* Dropdown menu */}
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 d-flex justify-content-between">
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
          <select
            className="form-select ms-2"
            value={sortOption}
            onChange={handleSortChange}
          >
            <option value="">Sort By</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="dateAdded">Date Added</option>
          </select>
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
              {filteredWebsites.map((website) => (
                <div
                  key={website.id}
                  className="list-group-item list-group-item-action p-3"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1" style={{ cursor: "pointer" }}>
                      <div className="d-flex align-items-center mb-1">
                        <button
                          className="btn btn-link btn-sm text-secondary p-0 me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTitleEditClick(website.id, website.title);
                          }}
                          aria-label="Edit title"
                        >
                          <Edit2 size={16} />
                        </button>
                        <h5
                          className="mb-0 text-primary"
                          onClick={() => handleFileOpen(website)}
                        >
                          {website.title || "Untitled"}
                        </h5>
                      </div>
                      <div onClick={() => handleFileOpen(website)}>
                        <p className="mb-1 text-break small">
                          {website.web_url}
                        </p>
                        <div className="mt-2">
                          <small className="text-body-secondary">
                            Saved on:{" "}
                            {new Date(website.created).toLocaleDateString()}
                          </small>
                        </div>
                        <small className="text-body-secondary mt-1 text-break">
                          File: {website.file_path}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className={`badge ${
                          website.exists
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }`}
                      >
                        {website.exists ? "Available" : "Missing"}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDeleteClick(website.id, website.title)
                        }
                        aria-label="Delete website"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title Edit Modal */}
      {titleEdit.show && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Title</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setTitleEdit({
                      show: false,
                      websiteId: null,
                      currentTitle: "",
                      newTitle: "",
                    })
                  }
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="newTitle" className="form-label">
                    Website Title
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="newTitle"
                    value={titleEdit.newTitle}
                    onChange={handleTitleEditChange}
                    placeholder="Enter new title"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setTitleEdit({
                      show: false,
                      websiteId: null,
                      currentTitle: "",
                      newTitle: "",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleTitleEditSubmit}
                  disabled={!titleEdit.newTitle.trim()}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      websiteId: null,
                      websiteTitle: "",
                    })
                  }
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete "
                  {deleteConfirmation.websiteTitle}"?
                </p>
                <p className="text-danger mb-0">
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      websiteId: null,
                      websiteTitle: "",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default LoadPage;
