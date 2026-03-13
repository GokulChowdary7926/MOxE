// backend/tests/unit/post.service.test.ts

import { PostService } from '../../src/services/post.service';
import { prisma } from '../../src/server';

jest.mock('../../src/server', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    hashtag: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postHashtag: {
      create: jest.fn(),
    },
    mention: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    view: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/storage', () => ({
  uploadToS3: jest.fn().mockResolvedValue('https://s3.amazonaws.com/test.jpg'),
}));

describe('PostService', () => {
  let postService: PostService;

  beforeEach(() => {
    postService = new PostService();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const accountId = 'account123';
    const mockFiles = [
      {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      },
    ];
    const mockData = {
      caption: 'Test post with #hashtag and @mention',
      location: 'New York',
      privacy: 'PUBLIC',
    };

    it('should create post successfully', async () => {
      const mockPost = {
        id: 'post123',
        accountId,
        media: [{ url: 'https://s3.amazonaws.com/test.jpg', type: 'image' }],
        caption: mockData.caption,
        createdAt: new Date(),
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);
      
      // Mock hashtag creation
      (prisma.hashtag.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.hashtag.create as jest.Mock).mockResolvedValue({ id: 'hashtag123', name: 'hashtag' });

      const result = await postService.createPost(accountId, mockData, mockFiles);

      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalled();
      expect(prisma.hashtag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'hashtag' },
        })
      );
    });

    it('should extract hashtags from caption', () => {
      const caption = 'This is a #test with multiple #hashtags in #caption';
      const hashtags = (postService as any).extractHashtags(caption);
      
      expect(hashtags).toEqual(['test', 'hashtags', 'caption']);
    });

    it('should extract mentions from caption', () => {
      const caption = 'Hey @john and @jane, check this out!';
      const mentions = (postService as any).extractMentions(caption);
      
      expect(mentions).toEqual(['john', 'jane']);
    });
  });

  describe('getFeed', () => {
    const accountId = 'account123';

    it('should return feed posts', async () => {
      const mockFollowing = [
        { followingId: 'user1' },
        { followingId: 'user2' },
      ];
      
      (prisma.follow.findMany as jest.Mock).mockResolvedValue(mockFollowing);
      (prisma.mute.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.block.findMany as jest.Mock).mockResolvedValue([]);
      
      const mockPosts = [
        {
          id: 'post1',
          accountId: 'user1',
          media: [],
          caption: 'Post 1',
          account: { username: 'user1', displayName: 'User 1' },
          likes: [],
          saves: [],
          _count: { likes: 10, comments: 5, shares: 2 },
        },
      ];
      
      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      const result = await postService.getFeed(accountId, 1, 10);

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.posts[0]).toHaveProperty('isLiked', false);
      expect(result.posts[0]).toHaveProperty('likeCount', 10);
    });
  });
});