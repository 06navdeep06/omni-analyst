import OpenAI from 'openai';

const apiKey = process.env.FIREWORKS_API_KEY;
const baseURL = 'https://api.fireworks.ai/inference/v1';

if (!apiKey) {
  console.warn('FIREWORKS_API_KEY is not set in environment variables');
}

export const ai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
