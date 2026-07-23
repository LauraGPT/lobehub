import { Composio } from '@composio/core';

import { getServerComposioApiKey } from '@/config/composio';

let composioClientInstance: { apiKey: string; client: Composio } | undefined;

const deduplicateRawToolLookups = (client: Composio) => {
  // tools.execute resolves tool metadata on every call; concurrent Gmail searches can share it.
  const getRawTool = client.tools.getRawComposioToolBySlug.bind(client.tools);
  const pending = new Map<string, ReturnType<typeof getRawTool>>();

  client.tools.getRawComposioToolBySlug = ((slug, options) => {
    if (options?.modifySchema) return getRawTool(slug, options);

    const key = `${slug}\0${options?.version ?? ''}`;
    const existing = pending.get(key);
    if (existing) return existing;

    const request = getRawTool(slug, options);
    pending.set(key, request);
    const clear = () => {
      if (pending.get(key) === request) pending.delete(key);
    };
    void request.then(clear, clear);
    return request;
  }) as typeof client.tools.getRawComposioToolBySlug;
};

export const getComposioClient = (): Composio => {
  const apiKey = getServerComposioApiKey();

  if (!apiKey) {
    throw new Error('Composio API key is not configured on server');
  }

  if (!composioClientInstance || composioClientInstance.apiKey !== apiKey) {
    const client = new Composio({ apiKey, disableVersionCheck: true });
    deduplicateRawToolLookups(client);
    composioClientInstance = {
      apiKey,
      client,
    };
  }

  return composioClientInstance.client;
};

export const isComposioClientAvailable = (): boolean => {
  return !!getServerComposioApiKey();
};
