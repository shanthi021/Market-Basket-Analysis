import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Trash2, Download } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

/* ------------------- 🎨 Styled Components ------------------- */
const UploadContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
`;

const FileInput = styled.input`
  margin: 16px 0;
  display: block;
  width: 100%;
`;

const Button = styled.button`
  background: ${(props) => (props.disabled ? "#9ca3af" : "#3b82f6")};
  color: white;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background 0.2s ease;
  margin: 8px;

  &:hover {
    background: ${(props) => (props.disabled ? "#9ca3af" : "#2563eb")};
  }
`;

const Message = styled.p`
  margin-top: 16px;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${(props) => (props.error ? "#ef4444" : "#10b981")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0;
  text-align: left;
`;

const FileItem = styled.li`
  background: #f9fafb;
  padding: 10px 14px;
  margin-bottom: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #374151;
`;

/* ------------------- 🧠 Component ------------------- */
const DataUpload = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter((f) => f.type === "text/csv");

    if (validFiles.length !== selectedFiles.length) {
      setError(true);
      setMessage("Some files were not CSV and were ignored.");
    } else {
      setMessage("");
      setError(false);
    }

    setFiles(validFiles);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one CSV file.");
      setError(true);
      return;
    }

    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append("files", file); // backend should handle multiple files
    });

    try {
      setLoading(true);
      setMessage("");
      setError(false);

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/upload-data`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setMessage(res.data.message || "Files uploaded successfully!");
      setError(false);
      setFiles([]);
    } catch (err) {
      console.error("Upload error:", err.response ? err.response.data : err.message);
      setMessage("Upload failed: " + (err.response?.data?.message || err.message));
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await axios.get(`${API_BASE}/download-results`, {
        responseType: "blob", // ensures CSV file download
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mba_results.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      setMessage("Download failed: " + (err.response?.data?.message || err.message));
      setError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <UploadContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Title>📂 Upload CSV Files</Title>
      <FileInput type="file" accept=".csv" multiple onChange={handleFileChange} />

      {files.length > 0 && (
        <FileList>
          {files.map((file, index) => (
            <FileItem key={index}>
              <span>
                <FileSpreadsheet size={16} style={{ marginRight: "6px" }} />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <Trash2
                size={18}
                color="#ef4444"
                style={{ cursor: "pointer" }}
                onClick={() => handleRemoveFile(index)}
              />
            </FileItem>
          ))}
        </FileList>
      )}

      <Button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload All"}
      </Button>

      <Button onClick={handleDownload} disabled={downloading}>
        <Download size={16} style={{ marginRight: "6px" }} />
        {downloading ? "Downloading..." : "Download MBA Results (CSV)"}
      </Button>

      {message && (
        <Message error={error}>
          {error ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {message}
        </Message>
      )}
    </UploadContainer>
  );
};

export default DataUpload;
