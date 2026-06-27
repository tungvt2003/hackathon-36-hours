import { Intent } from '../types';

// Interface NLU — team AI implement sau bằng LLM hoặc Rasa, v.v.
export interface NluProvider {
  parse(transcript: string): Promise<Intent>;
}

export const NLU_PROVIDER = 'NLU_PROVIDER';
