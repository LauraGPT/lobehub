import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiKey: 'test-api-key',
  constructorOptions: vi.fn(),
  getRawTool: vi.fn(),
}));

vi.mock('@composio/core', () => ({
  Composio: class {
    tools = { getRawComposioToolBySlug: mocks.getRawTool };

    constructor(options: unknown) {
      mocks.constructorOptions(options);
    }
  },
}));

vi.mock('@/config/composio', () => ({
  getServerComposioApiKey: () => mocks.apiKey,
}));

describe('getComposioClient', () => {
  it('disables version checks and deduplicates concurrent raw tool lookups', async () => {
    let resolveTool: (tool: { slug: string }) => void;
    mocks.getRawTool.mockImplementation(
      () =>
        new Promise<{ slug: string }>((resolve) => {
          resolveTool = resolve;
        }),
    );
    const { getComposioClient } = await import('./index');
    const client = getComposioClient();

    const first = client.tools.getRawComposioToolBySlug('GMAIL_FETCH_EMAILS', {
      version: '20260721_00',
    });
    const second = client.tools.getRawComposioToolBySlug('GMAIL_FETCH_EMAILS', {
      version: '20260721_00',
    });

    expect(mocks.constructorOptions).toHaveBeenCalledWith({
      apiKey: mocks.apiKey,
      disableVersionCheck: true,
    });
    expect(mocks.getRawTool).toHaveBeenCalledOnce();

    resolveTool!({ slug: 'GMAIL_FETCH_EMAILS' });
    await expect(Promise.all([first, second])).resolves.toEqual([
      { slug: 'GMAIL_FETCH_EMAILS' },
      { slug: 'GMAIL_FETCH_EMAILS' },
    ]);

    mocks.getRawTool.mockResolvedValue({ slug: 'GMAIL_FETCH_EMAILS' });
    const modified = [
      client.tools.getRawComposioToolBySlug('GMAIL_FETCH_EMAILS', {
        modifySchema: vi.fn(),
        version: '20260721_00',
      }),
      client.tools.getRawComposioToolBySlug('GMAIL_FETCH_EMAILS', {
        modifySchema: vi.fn(),
        version: '20260721_00',
      }),
    ];

    expect(mocks.getRawTool).toHaveBeenCalledTimes(3);
    await Promise.all(modified);
  });
});
