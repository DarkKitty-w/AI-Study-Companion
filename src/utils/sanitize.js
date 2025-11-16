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