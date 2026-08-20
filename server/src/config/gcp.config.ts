import { registerAs } from '@nestjs/config';

export const gcpConfig = registerAs('gcp', () => ({
  projectId: process.env.GCP_PROJECT_ID || 'stockpulse-prod',
  location: process.env.GCP_LOCATION || 'europe-west3',
  docAiProcessorId: process.env.GCP_DOCAI_PROCESSOR_ID || '',
}));
