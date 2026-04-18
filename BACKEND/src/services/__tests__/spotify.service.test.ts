import { getSpotifyAccessToken, searchTracks } from '../spotify.service';

describe('spotify.service', () => {
  const envBackup = { ...process.env };
  const fetchBackup = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  afterAll(() => {
    process.env = envBackup;
    global.fetch = fetchBackup;
  });

  it('getSpotifyAccessToken throws when credentials missing', async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    await expect(getSpotifyAccessToken()).rejects.toThrow('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  });

  it('searchTracks returns empty for blank query', async () => {
    const rows = await searchTracks('   ', 'token');
    expect(rows).toEqual([]);
  });

  it('searchTracks maps spotify response items', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tracks: {
          items: [
            {
              id: 't1',
              name: 'Track 1',
              artists: [{ name: 'Artist A' }],
              album: { name: 'Album A', images: [{ url: 'https://i.scdn.co/image/small' }] },
              duration_ms: 1000,
              preview_url: 'http://x',
            },
          ],
        },
      }),
    } as any);

    const rows = await searchTracks('track', 'token', 5);
    expect(rows[0]).toMatchObject({ id: 't1', artists: 'Artist A', album_image_url: 'https://i.scdn.co/image/small' });
  });
});
