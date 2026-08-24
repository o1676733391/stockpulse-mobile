import { registerAs } from '@nestjs/config';

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  defaultProvider: process.env.OCR_DEFAULT_PROVIDER || 'gemini_vision',
}));
