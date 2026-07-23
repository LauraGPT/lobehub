import { ModelProvider } from 'model-bank';

import type { OpenAICompatibleFactoryOptions } from '../../core/openaiCompatibleFactory';
import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';

export const params = {
  apiKey: 'funasr-local',
  baseURL: 'http://localhost:8000/v1',
  provider: ModelProvider.FunASR,
} satisfies OpenAICompatibleFactoryOptions;

export const LobeFunASRAI = createOpenAICompatibleRuntime(params);
