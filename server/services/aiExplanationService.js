const axios = require('axios');

/**
 * Service to generate AI-powered error explanations using Groq API
 */
class AIExplanationService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    // Updated to use current model - llama-3.1-8b-instant (fast and available)
    // Alternative models: 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'
    // Can be overridden via GROQ_MODEL environment variable
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    
    // Debug logging
    if (this.apiKey) {
      console.log('[AI Service] Groq API key loaded (length:', this.apiKey.length, ')');
      console.log('[AI Service] Using model:', this.model);
    } else {
      console.warn('[AI Service] ⚠️  GROQ_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate AI explanation for an error
   * @param {Object} errorLog - The error log object
   * @returns {Promise<Object>} - AI explanation response
   */
  async generateExplanation(errorLog) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured in environment variables');
    }

    try {
      // Build context from error log
      const context = this.buildContext(errorLog);

      // Create prompt for AI
      const prompt = this.createPrompt(context);

      // Call Groq API
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful software debugging assistant. Analyze error logs and provide clear, concise explanations that help developers understand what went wrong. Focus on explaining the error in simple terms, what likely caused it, and general guidance on how to fix it. Do not provide full code solutions, but rather explain the issue and suggest approaches.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const explanation = response.data.choices[0].message.content.trim();
        return {
          success: true,
          explanation: explanation,
          model: this.model
        };
      } else {
        throw new Error('Invalid response from Groq API');
      }
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY environment variable.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('Unable to connect to Groq API. Please check your internet connection.');
      } else {
        throw new Error(error.response?.data?.error?.message || error.message || 'Failed to generate AI explanation');
      }
    }
  }

  /**
   * Build context string from error log
   */
  buildContext(errorLog) {
    let context = `Error Message: ${errorLog.message}\n`;
    context += `Severity: ${errorLog.severity}\n`;
    context += `Service: ${errorLog.service}\n`;
    context += `Error Type: ${errorLog.errorType}\n`;
    
    if (errorLog.url) {
      context += `URL: ${errorLog.url}\n`;
    }

    if (errorLog.metadata) {
      if (errorLog.metadata.method) {
        context += `HTTP Method: ${errorLog.metadata.method}\n`;
      }
      if (errorLog.metadata.status) {
        context += `HTTP Status: ${errorLog.metadata.status}\n`;
      }
      if (errorLog.metadata.path) {
        context += `Path: ${errorLog.metadata.path}\n`;
      }
      if (errorLog.metadata.body) {
        context += `Request Body: ${JSON.stringify(errorLog.metadata.body)}\n`;
      }
    }

    if (errorLog.stackTrace) {
      // Truncate stack trace if too long (keep first 1000 chars)
      const stackTrace = errorLog.stackTrace.length > 1000 
        ? errorLog.stackTrace.substring(0, 1000) + '... (truncated)'
        : errorLog.stackTrace;
      context += `\nStack Trace:\n${stackTrace}`;
    }

    return context;
  }

  /**
   * Create prompt for AI
   */
  createPrompt(context) {
    return `Please analyze the following error log and provide a clear explanation:

${context}

Please provide:
1. A brief summary of what the error is
2. What likely caused this error
3. General guidance on how to fix or prevent it

Keep the explanation concise and developer-friendly. Do not provide full code solutions, but explain the issue clearly.`;
  }
}

// Export singleton instance
const aiExplanationService = new AIExplanationService();

module.exports = aiExplanationService;

