import React from 'react';
import { FaTimes, FaDownload, FaFileAlt } from 'react-icons/fa';
import './FilePreview.css';

const FilePreview = ({ fileUrl, fileName, onClose }) => {
    if (!fileUrl) return null;

    // Detectar el tipo de archivo por extensión
    const getFileType = (url) => {
        if (!url) return 'unknown';
        const extension = url.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        } else {
            return 'other';
        }
    };

    const fileType = getFileType(fileUrl);

    const handleDownload = () => {
        window.open(fileUrl, '_blank');
    };

    return (
        <div className="file-preview-overlay" onClick={onClose}>
            <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="file-preview-header">
                    <div className="file-preview-title">
                        <FaFileAlt />
                        <span>{fileName || 'Vista Previa'}</span>
                    </div>
                    <div className="file-preview-actions">
                        <button
                            className="file-preview-btn download-btn"
                            onClick={handleDownload}
                            title="Descargar archivo"
                        >
                            <FaDownload /> Descargar
                        </button>
                        <button
                            className="file-preview-btn close-btn"
                            onClick={onClose}
                            title="Cerrar"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="file-preview-content">
                    {fileType === 'image' && (
                        <img
                            src={fileUrl}
                            alt={fileName || 'Preview'}
                            className="file-preview-image"
                        />
                    )}

                    {fileType === 'pdf' && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                            className="file-preview-iframe"
                            title={fileName || 'PDF Preview'}
                        />
                    )}

                    {fileType === 'other' && (
                        <div className="file-preview-not-supported">
                            <FaFileAlt className="file-icon-large" />
                            <h3>Vista previa no disponible</h3>
                            <p>Este tipo de archivo no puede ser visualizado en el navegador.</p>
                            <p className="file-name-display">{fileName}</p>
                            <button
                                className="download-btn-large"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Descargar Archivo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreview;
