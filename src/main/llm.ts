import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../shared/types';

let client: Anthropic | null = null;
let apiKey: string | null = null;

const SYSTEM_PROMPT = `You are a helpful AI research assistant. You engage thoughtfully with questions and provide detailed, accurate responses. You help users explore ideas, analyze information, and develop their thinking. When appropriate, you suggest related topics or angles the user might want to explore.`;

export function setApiKey(key: string): boolean {
  try {
    apiKey = key;
    client = new Anthropic({ apiKey: key });
    return true;
  } catch (error) {
    console.error('Failed to set API key:', error);
    throw error;
  }
}

export function hasApiKey(): boolean {
  return apiKey !== null && apiKey.length > 0;
}

export async function sendMessage(
  messages: Message[],
  model: string = 'claude-sonnet-4-20250514',
  maxTokens: number = 4096
): Promise<string> {
  if (!client) {
    throw new Error('API key not set. Please configure your Anthropic API key.');
  }

  const anthropicMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: SYSTEM_PROMPT
    });

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

export async function streamMessage(
  messages: Message[],
  onChunk: (text: string) => void,
  model: string = 'claude-sonnet-4-20250514',
  maxTokens: number = 4096
): Promise<string> {
  if (!client) {
    throw new Error('API key not set. Please configure your Anthropic API key.');
  }

  const anthropicMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  let fullText = '';

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: SYSTEM_PROMPT
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text;
        onChunk(chunk.delta.text);
      }
    }

    return fullText;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw error;
  }
}
