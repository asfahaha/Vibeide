import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../shared/types';

let client: Anthropic | null = null;
let apiKey: string | null = null;

export function setApiKey(key: string): void {
  apiKey = key;
  client = new Anthropic({ apiKey: key });
}

export function hasApiKey(): boolean {
  return apiKey !== null && apiKey.length > 0;
}

export async function sendMessage(
  messages: Message[],
  model: string = 'claude-sonnet-4-20250514',
  maxTokens: number = 4096,
  temperature: number = 0.7
): Promise<string> {
  if (!client) {
    throw new Error('API key not set. Please configure your Anthropic API key.');
  }

  // Convert our message format to Anthropic's format
  const anthropicMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: `You are a helpful AI research assistant. You engage thoughtfully with questions and provide detailed, accurate responses. You help users explore ideas, analyze information, and develop their thinking. When appropriate, you suggest related topics or angles the user might want to explore.`
    });

    // Extract text content from the response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return textContent.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw error;
  }
}
