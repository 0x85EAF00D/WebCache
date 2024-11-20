import React, { useState } from "react";
import { Upload } from "lucide-react";
import Notification from "./Notification";

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files).filter(
      (file) =>
        file.name.endsWith(".html") ||
        file.name.endsWith(".htm") ||
        file.name.endsWith(".pdf")
    );
    setFiles(fileList);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setNotification({
        message: "Please select HTML or PDF files to upload",
        type: "error",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://localhost:3000/api/upload-files", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({
          message: "Files uploaded successfully",
          type: "success",
        });
        setFiles([]);
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Upload Files</h1>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="mb-4">
                <label htmlFor="fileInput" className="form-label">
                  Select HTML or PDF Files
                </label>
                <div className="input-group">
                  <input
                    type="file"
                    className="form-control"
                    id="fileInput"
                    multiple
                    accept=".html,.htm,.pdf"
                    onChange={handleFileChange}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0}
                  >
                    {uploading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="me-2" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-3">
                  <h6>Selected Files:</h6>
                  <ul className="list-group">
                    {files.map((file, index) => (
                      <li key={index} className="list-group-item">
                        <span
                          className="d-inline-block text-truncate"
                          style={{ maxWidth: "100%" }}
                        >
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <small className="text-muted ms-2">
                          {file.name.endsWith(".pdf") ? "PDF" : "HTML"}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
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

export default UploadPage;
