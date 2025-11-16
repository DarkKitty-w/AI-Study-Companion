// src/utils/encryption.js
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'ai-study-companion-secure-key-v1';

export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// src/utils/sanitize.js
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
};

export const validateApiKey = (key, provider) => {
  if (!key || typeof key !== 'string') return false;
  
  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9_-]{95}$/,
    google: /^AIza[0-9A-Za-z-_]{35}$/,
    groq: /^gsk_[a-zA-Z0-9]{32}$/,
    huggingface: /^hf_[a-zA-Z0-9]{39}$/,
    deepseek: /^sk-[a-zA-Z0-9]{48}$/
  };
  
  return patterns[provider] ? patterns[provider].test(key) : key.length > 10;
};

// src/utils/rateLimit.js
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  checkLimit(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Clean old requests
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }

  getRemainingRequests(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const globalRateLimiter = new RateLimiter(15, 60000); // 15 requests per minute