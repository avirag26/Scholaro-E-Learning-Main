/**
 * Sanitize filename for download
 */
export const sanitizeFilename = (filename, extension = '') => {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();
  
  return extension ? `${sanitized}.${extension}` : sanitized;
};

/**
 * Download file with proper filename
 */
export const downloadFile = async (url, filename, onSuccess, onError) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = sanitizeFilename(filename);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
    
    if (onSuccess) {
      setTimeout(() => onSuccess(filename), 100);
    }
  } catch (error) {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = sanitizeFilename(filename);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onSuccess) {
        setTimeout(() => onSuccess(filename), 100);
      }
    } catch (fallbackError) {
      if (onError) {
        onError(error);
      }
    }
  }
};



/**
 * Open PDF in new tab
 */
export const viewPDF = (url, title = 'PDF Document') => {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    window.location.href = url;
  }
};

/**
 * Get file size from URL
 */
export const getFileSize = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
    }
    
    return 'Unknown size';
  } catch (error) {
    return 'Unknown size';
  }
};