export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value, total) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return `${percentage.toFixed(1)}%`;
};

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatProviderName = (provider) => {
  const names = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
    huggingface: 'HuggingFace',
    groq: 'Groq',
    deepseek: 'DeepSeek'
  };
  return names[provider] || capitalizeFirst(provider);
};