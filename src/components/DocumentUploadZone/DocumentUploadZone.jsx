import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatFileSize } from '../../utils/fileValidation';
import './DocumentUploadZone.css';

const DocumentUploadZone = ({
  documents = [],
  onFilesSelected,
  onRemoveDocument,
  onRetryDocument,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

  return (
    <div className="doc-upload-container">
      {/* Accessible Drag & Drop Zone */}
      <div
        className={`doc-dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload document file. Click or drag and drop PDF, Word, PowerPoint, Text, or Image files."
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.rtf,.pptx,.ppt,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <div className="doc-dropzone-icon">
          <Upload size={24} />
        </div>
        <div className="doc-dropzone-title">Click to browse or drag & drop documents</div>
        <div className="doc-dropzone-desc">
          Automated server-verified page counting • Max 25 MB per file
        </div>
        <div className="doc-dropzone-badges">
          <span className="doc-format-badge">.PDF</span>
          <span className="doc-format-badge">.DOCX / .DOC</span>
          <span className="doc-format-badge">.PPTX / .PPT</span>
          <span className="doc-format-badge">.TXT / .RTF</span>
          <span className="doc-format-badge">.JPG / .PNG</span>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="doc-list" aria-live="polite">
          {documents.map((doc) => {
            const isProcessing = doc.status === 'processing';
            const isReady = doc.status === 'ready';
            const isError = doc.status === 'error';

            return (
              <div
                key={doc.id}
                className={`doc-item-card ${isError ? 'has-error' : ''} ${isReady ? 'is-ready' : ''}`}
              >
                <div className="doc-item-main">
                  <div className="doc-item-left">
                    <div className="doc-file-icon-wrap">
                      <FileText size={20} />
                    </div>
                    <div className="doc-info-col">
                      <div className="doc-name" title={doc.name}>
                        Document: <strong>{doc.name}</strong>
                      </div>
                      <div className="doc-meta-row">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.docType && (
                          <span className="doc-type-pill">{doc.docType}</span>
                        )}
                        {isReady && doc.pageCount && (
                          <span className="doc-pages-pill">
                            <CheckCircle2 size={13} />
                            Pages: {doc.pageCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="doc-status-col">
                    {/* Status Pill */}
                    {isProcessing && (
                      <span className="doc-status-badge processing">
                        <Loader2 size={14} className="doc-spin-icon" />
                        Detecting pages...
                      </span>
                    )}

                    {isReady && (
                      <span className="doc-status-badge ready">
                        <CheckCircle2 size={14} />
                        Ready to print
                      </span>
                    )}

                    {isError && (
                      <span className="doc-status-badge error">
                        <AlertTriangle size={14} />
                        Processing failed
                      </span>
                    )}

                    {/* Action buttons */}
                    {isError && onRetryDocument && (
                      <button
                        type="button"
                        className="doc-action-btn"
                        onClick={() => onRetryDocument(doc.id)}
                        title="Retry page detection"
                        aria-label={`Retry processing ${doc.name}`}
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="doc-action-btn delete"
                      onClick={() => onRemoveDocument(doc.id)}
                      title="Remove file"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Error Banner if processing failed */}
                {isError && doc.errorMessage && (
                  <div className="doc-error-banner" role="alert">
                    <AlertTriangle size={16} className="doc-error-banner-icon" />
                    <div>{doc.errorMessage}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;
