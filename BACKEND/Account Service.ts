// backend/src/services/account.service.ts

import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { AccountType, SubscriptionTier } from '@prisma/client';

export class AccountService {
  /**
   * Get account by ID
   */
  async getAccountById(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            isVerified: true,
          },
        },
        links: {
          orderBy: { order: 'asc' },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
        following: {
          include: {
            following: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
        closeFriends: {
          include: {
            friend: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
        blockedUsers: {
          include: {
            blocked: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        mutedUsers: {
          include: {
            muted: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    return account;
  }

  /**
   * Get account by username
   */
  async getAccountByUsername(username: string) {
    const account = await prisma.account.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            isVerified: true,
          },
        },
        links: {
          orderBy: { order: 'asc' },
        },
        posts: {
          where: { isArchived: false, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        highlights: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              include: {
                story: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    return account;
  }

  /**
   * Create a new account
   */
  async createAccount(userId: string, data: any) {
    // Check if user can create another account (max 3)
    const existingAccounts = await prisma.account.count({
      where: { userId },
    });

    if (existingAccounts >= 3) {
      throw new AppError('Maximum 3 accounts per user', 400);
    }

    // Check username availability
    const existingUsername = await prisma.account.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('Username already taken', 400);
    }

    // Validate account type combinations
    if (!this.isValidAccountCombination(userId, data.accountType)) {
      throw new AppError('Invalid account type combination', 400);
    }

    const account = await prisma.account.create({
      data: {
        userId,
        username: data.username,
        displayName: data.displayName,
        accountType: data.accountType as AccountType,
        subscriptionTier: 'FREE' as SubscriptionTier,
        bio: data.bio,
        profilePhoto: data.profilePhoto,
        pronouns: data.pronouns,
        isPrivate: data.isPrivate || false,
        businessCategory: data.businessCategory,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        actionButtons: data.actionButtons,
        professionalHeadline: data.professionalHeadline,
        professionalSection: data.professionalSection,
        personalSection: data.personalSection,
        skills: data.skills || [],
      },
    });

    // Add links if provided
    if (data.links && data.links.length > 0) {
      await Promise.all(
        data.links.map((link: any, index: number) =>
          prisma.link.create({
            data: {
              accountId: account.id,
              url: link.url,
              title: link.title,
              displayText: link.displayText,
              order: index,
            },
          })
        )
      );
    }

    return account;
  }

  /**
   * Update account
   */
  async updateAccount(accountId: string, data: any) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Check username uniqueness if changing
    if (data.username && data.username !== account.username) {
      const existing = await prisma.account.findUnique({
        where: { username: data.username },
      });
      if (existing) {
        throw new AppError('Username already taken', 400);
      }
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
        profilePhoto: data.profilePhoto,
        coverPhoto: data.coverPhoto,
        pronouns: data.pronouns,
        location: data.location,
        website: data.website,
        isPrivate: data.isPrivate,
        businessCategory: data.businessCategory,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        actionButtons: data.actionButtons,
        professionalHeadline: data.professionalHeadline,
        professionalSection: data.professionalSection,
        personalSection: data.personalSection,
        skills: data.skills,
        openToOpportunities: data.openToOpportunities,
      },
    });

    // Update links
    if (data.links) {
      // Delete existing links
      await prisma.link.deleteMany({
        where: { accountId },
      });

      // Create new links
      await Promise.all(
        data.links.map((link: any, index: number) =>
          prisma.link.create({
            data: {
              accountId,
              url: link.url,
              title: link.title,
              displayText: link.displayText,
              order: index,
            },
          })
        )
      );
    }

    return updatedAccount;
  }

  /**
   * Switch account type
   */
  async switchAccountType(accountId: string, newType: AccountType) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        posts: true,
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Validate type switch
    const validTransitions: Record<AccountType, AccountType[]> = {
      PERSONAL: ['BUSINESS', 'CREATOR', 'JOB'],
      BUSINESS: ['PERSONAL', 'CREATOR', 'JOB'],
      CREATOR: ['PERSONAL', 'BUSINESS', 'JOB'],
      JOB: ['PERSONAL', 'BUSINESS', 'CREATOR'],
    };

    if (!validTransitions[account.accountType].includes(newType)) {
      throw new AppError('Invalid account type transition', 400);
    }

    // Handle data migration based on type change
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        accountType: newType,
        // Reset type-specific fields as needed
        businessCategory: newType === 'BUSINESS' ? account.businessCategory : null,
        professionalSection: newType === 'JOB' ? account.professionalSection : null,
        personalSection: newType === 'JOB' ? account.personalSection : null,
        skills: newType === 'JOB' ? account.skills : [],
      },
    });

    return updatedAccount;
  }

  /**
   * Upgrade subscription tier
   */
  async upgradeSubscription(accountId: string, tier: SubscriptionTier) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Validate tier upgrade
    const tierOrder = {
      FREE: 0,
      STAR: 1,
      THICK: 2,
    };

    if (tierOrder[tier] <= tierOrder[account.subscriptionTier]) {
      throw new AppError('Cannot downgrade to same or lower tier', 400);
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        subscriptionTier: tier,
        // Enable features based on tier
        ...(tier === 'STAR' && {
          // Star tier features
        }),
        ...(tier === 'THICK' && {
          // Thick tier features
          subscriptionsEnabled: true,
          badgesEnabled: true,
          giftsEnabled: true,
        }),
      },
    });

    return updatedAccount;
  }

  /**
   * Validate account type combinations
   */
  private async isValidAccountCombination(userId: string, newType: AccountType): Promise<boolean> {
    const existingAccounts = await prisma.account.findMany({
      where: { userId },
      select: { accountType: true },
    });

    const types = existingAccounts.map(a => a.accountType);
    types.push(newType);

    // Must have at least one personal account
    if (!types.includes('PERSONAL')) {
      return false;
    }

    // Count business and creator accounts
    const businessCount = types.filter(t => t === 'BUSINESS').length;
    const creatorCount = types.filter(t => t === 'CREATOR').length;
    const jobCount = types.filter(t => t === 'JOB').length;

    // Validate combinations
    if (businessCount > 2) return false;
    if (creatorCount > 2) return false;
    if (jobCount > 2) return false;
    if (businessCount + creatorCount + jobCount > 3) return false;

    return true;
  }

  /**
   * Follow/unfollow account
   */
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('Cannot follow yourself', 400);
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existing.id,
        },
      });
      return { following: false };
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          recipientId: followingId,
          senderId: followerId,
          type: 'FOLLOW',
          data: { followerId },
        },
      });

      return { following: true };
    }
  }

  /**
   * Add to close friends
   */
  async addCloseFriend(accountId: string, friendId: string) {
    const existing = await prisma.closeFriend.findUnique({
      where: {
        accountId_friendId: {
          accountId,
          friendId,
        },
      },
    });

    if (existing) {
      throw new AppError('Already in close friends', 400);
    }

    // Check limit (100 close friends)
    const count = await prisma.closeFriend.count({
      where: { accountId },
    });

    if (count >= 100) {
      throw new AppError('Maximum 100 close friends', 400);
    }

    await prisma.closeFriend.create({
      data: {
        accountId,
        friendId,
      },
    });

    return { success: true };
  }

  /**
   * Remove from close friends
   */
  async removeCloseFriend(accountId: string, friendId: string) {
    await prisma.closeFriend.delete({
      where: {
        accountId_friendId: {
          accountId,
          friendId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Block user
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new AppError('Cannot block yourself', 400);
    }

    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existing) {
      throw new AppError('User already blocked', 400);
    }

    // Remove any follow relationship
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    return { success: true };
  }

  /**
   * Unblock user
   */
  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Mute user
   */
  async muteUser(muterId: string, mutedId: string, options: any = {}) {
    const existing = await prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId,
          mutedId,
        },
      },
    });

    if (existing) {
      // Update existing mute
      await prisma.mute.update({
        where: { id: existing.id },
        data: {
          mutePosts: options.mutePosts ?? true,
          muteStories: options.muteStories ?? true,
        },
      });
    } else {
      // Create new mute
      await prisma.mute.create({
        data: {
          muterId,
          mutedId,
          mutePosts: options.mutePosts ?? true,
          muteStories: options.muteStories ?? true,
        },
      });
    }

    return { success: true };
  }

  /**
   * Unmute user
   */
  async unmuteUser(muterId: string, mutedId: string) {
    await prisma.mute.delete({
      where: {
        muterId_mutedId: {
          muterId,
          mutedId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Restrict user
   */
  async restrictUser(restrictorId: string, restrictedId: string) {
    const existing = await prisma.restrict.findUnique({
      where: {
        restrictorId_restrictedId: {
          restrictorId,
          restrictedId,
        },
      },
    });

    if (existing) {
      throw new AppError('User already restricted', 400);
    }

    await prisma.restrict.create({
      data: {
        restrictorId,
        restrictedId,
      },
    });

    return { success: true };
  }

  /**
   * Unrestrict user
   */
  async unrestrictUser(restrictorId: string, restrictedId: string) {
    await prisma.restrict.delete({
      where: {
        restrictorId_restrictedId: {
          restrictorId,
          restrictedId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get followers
   */
  async getFollowers(accountId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const followers = await prisma.follow.findMany({
      where: { followingId: accountId },
      skip,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            bio: true,
            isPrivate: true,
            verifiedBadge: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({
      where: { followingId: accountId },
    });

    return {
      followers: followers.map(f => f.follower),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get following
   */
  async getFollowing(accountId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const following = await prisma.follow.findMany({
      where: { followerId: accountId },
      skip,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            bio: true,
            isPrivate: true,
            verifiedBadge: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({
      where: { followerId: accountId },
    });

    return {
      following: following.map(f => f.following),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get close friends
   */
  async getCloseFriends(accountId: string) {
    const closeFriends = await prisma.closeFriend.findMany({
      where: { accountId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return closeFriends.map(cf => cf.friend);
  }
}