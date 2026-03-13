// backend/src/services/post.service.ts

import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { uploadToS3 } from '../utils/storage';
import { PrivacyLevel } from '@prisma/client';

export class PostService {
  /**
   * Create a new post
   */
  async createPost(accountId: string, data: any, files: any[]) {
    // Upload media to S3
    const media = await Promise.all(
      files.map(async (file, index) => {
        const url = await uploadToS3(file, `posts/${accountId}/${Date.now()}_${index}`);
        return {
          url,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          width: file.width,
          height: file.height,
          duration: file.duration,
        };
      })
    );

    // Process hashtags
    const hashtags = this.extractHashtags(data.caption || '');
    
    const post = await prisma.post.create({
      data: {
        accountId,
        media,
        caption: data.caption,
        location: data.location,
        privacy: data.privacy as PrivacyLevel || 'PUBLIC',
        allowComments: data.allowComments !== false,
        hideLikeCount: data.hideLikeCount || false,
        screenshotProtection: data.screenshotProtection || false,
        isCarousel: media.length > 1,
        carouselItems: media.length > 1 ? media.map((m, i) => ({ ...m, order: i })) : null,
      },
    });

    // Create hashtag associations
    if (hashtags.length > 0) {
      await Promise.all(
        hashtags.map(async (tag) => {
          let hashtag = await prisma.hashtag.findUnique({
            where: { name: tag },
          });
          
          if (!hashtag) {
            hashtag = await prisma.hashtag.create({
              data: { name: tag },
            });
          }

          await prisma.postHashtag.create({
            data: {
              postId: post.id,
              hashtagId: hashtag.id,
            },
          });

          await prisma.hashtag.update({
            where: { id: hashtag.id },
            data: { postCount: { increment: 1 } },
          });
        })
      );
    }

    // Create notifications for mentioned users
    const mentions = this.extractMentions(data.caption || '');
    if (mentions.length > 0) {
      await Promise.all(
        mentions.map(async (username) => {
          const mentionedAccount = await prisma.account.findUnique({
            where: { username },
          });
          
          if (mentionedAccount) {
            await prisma.mention.create({
              data: {
                accountId: mentionedAccount.id,
                postId: post.id,
              },
            });

            await prisma.notification.create({
              data: {
                recipientId: mentionedAccount.id,
                senderId: accountId,
                type: 'MENTION',
                data: { postId: post.id },
              },
            });
          }
        })
      );
    }

    return post;
  }

  /**
   * Get feed posts
   */
  async getFeed(accountId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get accounts the user follows
    const following = await prisma.follow.findMany({
      where: { followerId: accountId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(accountId); // Include own posts

    // Get muted and blocked users
    const muted = await prisma.mute.findMany({
      where: { muterId: accountId, mutePosts: true },
      select: { mutedId: true },
    });
    const mutedIds = muted.map(m => m.mutedId);

    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true },
    });
    const blockedIds = blocked.map(b => b.blockedId);

    // Get posts
    const posts = await prisma.post.findMany({
      where: {
        accountId: {
          in: followingIds,
          notIn: [...mutedIds, ...blockedIds],
        },
        isArchived: false,
        isDeleted: false,
        privacy: 'PUBLIC',
      },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            verifiedBadge: true,
          },
        },
        likes: {
          where: { accountId },
          select: { id: true },
        },
        saves: {
          where: { accountId },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const formattedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      isSaved: post.saves.length > 0,
      likes: undefined,
      saves: undefined,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      _count: undefined,
    }));

    const total = await prisma.post.count({
      where: {
        accountId: { in: followingIds },
        isArchived: false,
        isDeleted: false,
        privacy: 'PUBLIC',
      },
    });

    return {
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get posts by account
   */
  async getAccountPosts(accountId: string, viewerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Check privacy
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { isPrivate: true },
    });

    if (account?.isPrivate) {
      // Check if viewer follows
      const follows = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: accountId,
          },
        },
      });

      if (!follows && viewerId !== accountId) {
        throw new AppError('This account is private', 403);
      }
    }

    const posts = await prisma.post.findMany({
      where: {
        accountId,
        isArchived: false,
        isDeleted: false,
        privacy: 'PUBLIC',
      },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            verifiedBadge: true,
          },
        },
        likes: {
          where: { accountId: viewerId },
          select: { id: true },
        },
        saves: {
          where: { accountId: viewerId },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      isSaved: post.saves.length > 0,
      likes: undefined,
      saves: undefined,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      _count: undefined,
    }));

    const total = await prisma.post.count({
      where: {
        accountId,
        isArchived: false,
        isDeleted: false,
        privacy: 'PUBLIC',
      },
    });

    return {
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single post
   */
  async getPost(postId: string, viewerId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            verifiedBadge: true,
          },
        },
        likes: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        comments: {
          where: { parentId: null, isHidden: false },
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
                verifiedBadge: true,
              },
            },
            replies: {
              include: {
                account: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    profilePhoto: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: { likes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        tags: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        mentions: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
          },
        },
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check privacy
    if (post.privacy !== 'PUBLIC') {
      // Check if viewer can see
      if (post.privacy === 'FOLLOWERS_ONLY') {
        const follows = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: post.accountId,
            },
          },
        });
        if (!follows && viewerId !== post.accountId) {
          throw new AppError('You cannot view this post', 403);
        }
      } else if (post.privacy === 'CLOSE_FRIENDS_ONLY') {
        const isCloseFriend = await prisma.closeFriend.findUnique({
          where: {
            accountId_friendId: {
              accountId: post.accountId,
              friendId: viewerId,
            },
          },
        });
        if (!isCloseFriend && viewerId !== post.accountId) {
          throw new AppError('You cannot view this post', 403);
        }
      }
    }

    // Check if viewer is blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: post.accountId },
          { blockerId: post.accountId, blockedId: viewerId },
        ],
      },
    });

    if (blocked) {
      throw new AppError('You cannot view this post', 403);
    }

    // Add view
    await prisma.view.create({
      data: {
        accountId: viewerId,
        postId: post.id,
      },
    });

    // Check if viewer liked/saved
    const isLiked = await prisma.like.findUnique({
      where: {
        accountId_postId: {
          accountId: viewerId,
          postId: post.id,
        },
      },
    });

    const isSaved = await prisma.savedPost.findUnique({
      where: {
        accountId_postId: {
          accountId: viewerId,
          postId: post.id,
        },
      },
    });

    return {
      ...post,
      isLiked: !!isLiked,
      isSaved: !!isSaved,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      saveCount: post._count.saves,
      _count: undefined,
    };
  }

  /**
   * Update post
   */
  async updatePost(postId: string, accountId: string, data: any) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.accountId !== accountId) {
      throw new AppError('Post not found or unauthorized', 404);
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        caption: data.caption,
        location: data.location,
        privacy: data.privacy,
        allowComments: data.allowComments,
        hideLikeCount: data.hideLikeCount,
      },
    });

    return updatedPost;
  }

  /**
   * Delete post (soft delete)
   */
  async deletePost(postId: string, accountId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.accountId !== accountId) {
      throw new AppError('Post not found or unauthorized', 404);
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Archive post
   */
  async archivePost(postId: string, accountId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.accountId !== accountId) {
      throw new AppError('Post not found or unauthorized', 404);
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isArchived: !post.isArchived,
      },
    });

    return { success: true };
  }

  /**
   * Like post
   */
  async likePost(postId: string, accountId: string) {
    const existing = await prisma.like.findUnique({
      where: {
        accountId_postId: {
          accountId,
          postId,
        },
      },
    });

    if (existing) {
      return { liked: true };
    }

    await prisma.like.create({
      data: {
        accountId,
        postId,
      },
    });

    // Get post owner
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { accountId: true },
    });

    if (post && post.accountId !== accountId) {
      await prisma.notification.create({
        data: {
          recipientId: post.accountId,
          senderId: accountId,
          type: 'LIKE',
          data: { postId },
        },
      });
    }

    return { liked: true };
  }

  /**
   * Unlike post
   */
  async unlikePost(postId: string, accountId: string) {
    await prisma.like.delete({
      where: {
        accountId_postId: {
          accountId,
          postId,
        },
      },
    });

    return { liked: false };
  }

  /**
   * Add comment
   */
  async addComment(postId: string, accountId: string, content: string, parentId?: string) {
    // Check if comments are allowed
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { allowComments: true, accountId: true },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (!post.allowComments) {
      throw new AppError('Comments are disabled on this post', 403);
    }

    const comment = await prisma.comment.create({
      data: {
        accountId,
        postId,
        content,
        parentId,
      },
    });

    // Create notification
    if (post.accountId !== accountId) {
      await prisma.notification.create({
        data: {
          recipientId: post.accountId,
          senderId: accountId,
          type: 'COMMENT',
          data: { postId, commentId: comment.id },
        },
      });
    }

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, accountId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Allow if user owns comment or owns the post
    if (comment.accountId !== accountId && comment.post.accountId !== accountId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  /**
   * Pin comment
   */
  async pinComment(commentId: string, accountId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment || comment.post.accountId !== accountId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: true },
    });

    return { success: true };
  }

  /**
   * Save post to collection
   */
  async savePost(postId: string, accountId: string, collectionId?: string) {
    const existing = await prisma.savedPost.findUnique({
      where: {
        accountId_postId: {
          accountId,
          postId,
        },
      },
    });

    if (existing) {
      return { saved: true };
    }

    await prisma.savedPost.create({
      data: {
        accountId,
        postId,
        collectionId,
      },
    });

    return { saved: true };
  }

  /**
   * Remove saved post
   */
  async unsavePost(postId: string, accountId: string) {
    await prisma.savedPost.delete({
      where: {
        accountId_postId: {
          accountId,
          postId,
        },
      },
    });

    return { saved: false };
  }

  /**
   * Create collection
   */
  async createCollection(accountId: string, name: string, coverImage?: string) {
    const collection = await prisma.collection.create({
      data: {
        accountId,
        name,
        coverImage,
      },
    });

    return collection;
  }

  /**
   * Get collections
   */
  async getCollections(accountId: string) {
    const collections = await prisma.collection.findMany({
      where: { accountId },
      include: {
        savedPosts: {
          include: {
            post: {
              select: {
                id: true,
                media: true,
                account: {
                  select: {
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
          take: 4, // Preview images
        },
        _count: {
          select: { savedPosts: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return collections;
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): string[] {
    const regex = /@(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  }
}