export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.txt',
  '.rtf',
  '.pptx',
  '.ppt',
  '.jpg',
  '.jpeg',
  '.png'
];

export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileExtension = (filename = '') => {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex).toLowerCase();
};

export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes). Please select a valid document.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 25 MB.`
    };
  }

  const ext = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format '${ext || 'unknown'}'. Supported formats are PDF (.pdf), Word (.docx, .doc), PowerPoint (.pptx, .ppt), Text (.txt, .rtf), and Images (.jpg, .png).`
    };
  }

  return { valid: true };
};
