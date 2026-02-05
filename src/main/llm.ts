import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../shared/types';

let client: Anthropic | null = null;
let apiKey: string | null = null;

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
      const diagnostics = [
        `Status: ${error.status ?? 'unknown'}`,
        `Type: ${error.type ?? 'unknown'}`,
        `Request ID: ${error.request_id ?? 'unknown'}`,
        `Message: ${error.message}`
      ].join('\n');
      throw new Error(
        `Anthropic API error (${error.status ?? 'unknown'}). ${error.message}\n\nDiagnostics:\n${diagnostics}`
      );
    }
    const fallbackMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unexpected error while contacting Anthropic.\n\nDiagnostics:\n${fallbackMessage}`);
  }
}
