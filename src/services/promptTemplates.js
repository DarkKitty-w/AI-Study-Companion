export const PROMPT_TEMPLATES = {
  summarize: (text) => `
Please provide a comprehensive summary of the following text. Focus on extracting the main ideas, key points, and essential information. Format your response as follows:

**Summary:**
- Provide 5-7 bullet points covering the main concepts
- Keep each point concise but informative
- Focus on the most important information

**Key Takeaways:**
- List 3-4 most crucial insights
- Highlight any surprising or counter-intuitive findings
- Note any practical applications

Text to summarize:
${text}
  `.trim(),

  flashcards: (text) => `
Generate educational flashcards from the following text. Create question-answer pairs that test understanding of the main concepts, definitions, and key ideas.

Requirements:
- Create 10-15 high-quality flashcards
- Questions should test comprehension, not just recall
- Answers should be accurate and informative
- Include a mix of difficulty levels
- Format as valid JSON

JSON Structure:
{
  "flashcards": [
    {
      "id": 1,
      "question": "Clear question about the content",
      "answer": "Comprehensive answer",
      "category": "General",
      "difficulty": "Easy|Medium|Hard"
    }
  ]
}

Text for flashcards:
${text}
  `.trim(),

  quiz: (text) => `
Create a multiple-choice quiz based on the following text. Generate 7 questions that test deep understanding of the material.

Requirements:
- 7 questions total
- 4 options per question (A, B, C, D)
- Only one correct answer per question
- Include explanations for answers
- Questions should test analysis and application, not just facts
- Format as valid JSON

JSON Structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Thought-provoking question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct option text",
      "explanation": "Why this answer is correct"
    }
  ]
}

Text for quiz:
${text}
  `.trim(),

  mindmap: (text) => `
Analyze the following text and create a hierarchical mind map structure. Identify the central concept and break it down into main topics and subtopics.

Requirements:
- Identify 1 central idea
- 3-5 main topics that support the central idea
- 2-3 subtopics for each main topic
- Show relationships between concepts
- Format as valid JSON

JSON Structure:
{
  "centralIdea": "Main concept",
  "topics": [
    {
      "name": "Main topic name",
      "subtopics": [
        {
          "name": "Subtopic name",
          "details": "Brief description"
        }
      ]
    }
  ]
}

Text for mind map:
${text}
  `.trim(),

  dataextractor: (text) => `
Extract structured data from the following text. Identify and categorize different types of information:

1. STATISTICS: Numbers, percentages, measurements, data points
2. DEFINITIONS: Key terms, concepts, explanations
3. FINDINGS: Research results, conclusions, discoveries

Requirements:
- Extract 5-7 items for each category
- Provide context for statistics
- Ensure definitions are accurate
- Note confidence levels for findings
- Format as valid JSON

JSON Structure:
{
  "statistics": [
    {
      "id": 1,
      "value": "Numerical value",
      "context": "Where and how this statistic appears",
      "type": "statistic"
    }
  ],
  "definitions": [
    {
      "id": 1,
      "term": "Key term",
      "definition": "Clear definition",
      "type": "definition"
    }
  ],
  "findings": [
    {
      "id": 1,
      "finding": "Key finding or conclusion",
      "confidence": "High|Medium|Low or percentage",
      "type": "finding"
    }
  ]
}

Text for data extraction:
${text}
  `.trim()
};

export const getPrompt = (toolType, text) => {
  const template = PROMPT_TEMPLATES[toolType];
  if (!template) {
    throw new Error(`No prompt template found for tool type: ${toolType}`);
  }
  return template(text);
};