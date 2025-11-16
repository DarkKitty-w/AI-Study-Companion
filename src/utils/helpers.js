export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const getReadableTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateScore = (correct, total) => {
  return Math.round((correct / total) * 100);
};

export const getPerformanceLabel = (score) => {
  if (score >= 90) return { label: 'Excellent!', color: 'text-green-600', bg: 'bg-green-100' };
  if (score >= 80) return { label: 'Great!', color: 'text-green-500', bg: 'bg-green-50' };
  if (score >= 70) return { label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (score >= 60) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-50' };
  return { label: 'Needs Practice', color: 'text-red-600', bg: 'bg-red-100' };
};