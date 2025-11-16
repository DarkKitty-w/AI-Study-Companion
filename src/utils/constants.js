export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-3.5-turbo'
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-haiku-20240307'
  },
  google: {
    name: 'Google AI',
    models: ['gemini-pro', 'gemini-flash'],
    defaultModel: 'gemini-pro'
  },
  huggingface: {
    name: 'HuggingFace',
    models: ['custom models'],
    defaultModel: 'microsoft/DialoGPT-large'
  },
  groq: {
    name: 'Groq',
    models: ['llama2-70b-4096', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    defaultModel: 'llama2-70b-4096'
  },
  deepseek: {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat'
  }
};

export const TOOLS = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Convert long notes into concise bullet points',
    icon: 'FileText',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Quick'
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Generate Q&A flashcards in JSON format',
    icon: 'Cards',
    color: 'from-green-500 to-emerald-500',
    badge: 'Study'
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Create multiple-choice questions',
    icon: 'HelpCircle',
    color: 'from-purple-500 to-pink-500',
    badge: 'Test'
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Generate hierarchical mind maps',
    icon: 'MindMap',
    color: 'from-orange-500 to-red-500',
    badge: 'Visual'
  },
  {
    id: 'dataextractor',
    name: 'Data Extractor',
    description: 'Extract key stats and definitions',
    icon: 'Database',
    color: 'from-indigo-500 to-purple-500',
    badge: 'Advanced'
  }
];

export const EXPORT_FORMATS = [
  { value: 'text', label: 'Text', extension: '.txt' },
  { value: 'pdf', label: 'PDF', extension: '.pdf' },
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'markdown', label: 'Markdown', extension: '.md' }
];

export const RATE_LIMIT_CONFIG = {
  maxRequests: 15,
  timeWindow: 60000, // 1 minute
  userIdentifier: 'ai-study-companion-user'
};

export const SECURITY_CONFIG = {
  encryptionKey: 'ai-study-companion-secure-key-v1',
  storageKey: 'ai_study_companion_api_keys'
};