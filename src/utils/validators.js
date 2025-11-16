export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateFileType = (file, allowedTypes) => {
  if (!file) return false;
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(`.${fileExtension}`);
};

export const validateFileSize = (file, maxSizeMB) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const isJsonString = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};