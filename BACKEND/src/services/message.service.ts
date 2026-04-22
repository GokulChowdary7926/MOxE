/**
 * Message workflow: thread list, requests, get thread, send, mark read, delete, reactions, pinned.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { getIo } from '../sockets';
import { MediaExpirationService } from './mediaExpiration.service';
import { addAccountActivityLog } from './activity.service';
import { shouldLimitIncomingInteraction } from './limitInteractionEnforcement.service';
import { normalizeMessageMediaForApi, normalizeStoredMediaUrl } from '../utils/mediaUrl';

const DEFAULT_LIMIT = 50;

function contentMatchesHiddenWords(content: string, words: string[]): boolean {
  const lower = content.toLowerCase();
  return words.some((w) => typeof w === 'string' && w.length > 0 && lower.includes(w.toLowerCase()));
}

function contentMatchesRegex(content: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (!p) return false;
    try {
      return new RegExp(p, 'i').test(content);
    } catch {
      return false;
    }
  });
}

function parseHiddenWordsConfig(raw: unknown): { regexPatterns: string[]; allowListAccountIds: string[] } {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  return {
    regexPatterns: Array.isArray(obj.regexPatterns) ? obj.regexPatterns.filter((x): x is string => typeof x === 'string') : [],
    allowListAccountIds: Array.isArray(obj.allowListAccountIds) ? obj.allowListAccountIds.filter((x): x is string => typeof x === 'string') : [],
  };
}

const MUTE_DURATION_MS: Record<string, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  always: 100 * 365 * 24 * 60 * 60 * 1000,
};
type ThreadItem = { otherId: string; other?: { id: string; username: string; displayName: string; profilePhoto: string | null }; lastMessage: string; lastTime: Date; unread: number; mutedUntil?: string | null; labels?: string[] };

const mediaTTLService = new MediaExpirationService();

export class MessageService {
  private async assertCanAccessMessage(accountId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { recipients: { select: { recipientId: true } } },
    });
    if (!message) throw new AppError('Message not found', 404);

    if (message.groupId) {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_accountId: { groupId: message.groupId, accountId } },
      });
      if (!member) throw new AppError('Not allowed to access this message', 403);
      return message;
    }

    const recipientIds = message.recipients.map((r) => r.recipientId);
    const isParticipant = message.senderId === accountId || recipientIds.includes(accountId);
    if (!isParticipant) throw new AppError('Not allowed to access this message', 403);
    return message;
  }

  /**
   * Thread list + message requests. Requests = threads where I don't follow the other person.
   */
  async getThreads(accountId: string, labelFilter?: string): Promise<{ threads: ThreadItem[]; requests: ThreadItem[]; pinnedIds: string[] }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { hiddenWordsDMFilter: true, hiddenWords: true, clientSettings: true },
    });
    const hiddenWords = (account?.hiddenWordsDMFilter && Array.isArray(account?.hiddenWords))
      ? (account!.hiddenWords as string[])
      : [];
    const hiddenWordsCfg = parseHiddenWordsConfig(
      (account?.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
    );
    const hiddenRegexPatterns = account?.hiddenWordsDMFilter ? hiddenWordsCfg.regexPatterns : [];
    const allowListAccountIds = new Set(hiddenWordsCfg.allowListAccountIds);

    const sent = await prisma.message.findMany({
      where: { senderId: accountId, groupId: null, deletedBySenderAt: null },
      orderBy: { createdAt: 'desc' },
      include: { recipients: { where: { recipientId: { not: accountId } }, include: { recipient: { select: { id: true, username: true, displayName: true, profilePhoto: true } } } } },
    });
    const received = await prisma.message.findMany({
      where: {
        recipients: { some: { recipientId: accountId, isHidden: false } },
        groupId: null,
        deletedByReceiverAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } }, recipients: true },
    });

    const otherIds = new Set<string>();
    sent.forEach((m) => m.recipients.forEach((r) => r.recipientId !== accountId && otherIds.add(r.recipientId)));
    received.forEach((m) => m.senderId !== accountId && otherIds.add(m.senderId));

    const followingSet = new Set(
      (await prisma.follow.findMany({
        where: { followerId: accountId },
        select: { followingId: true },
      })).map((r) => r.followingId)
    );

    /** People I restricted: keep their DMs in requests (not main inbox), even if I still follow them. */
    const restrictedByMe = new Set(
      (
        await prisma.restrict.findMany({
          where: { restrictorId: accountId },
          select: { restrictedId: true },
        })
      ).map((r) => r.restrictedId),
    );

    const pinned = await prisma.pinnedChat.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
      select: { otherId: true },
    });
    const pinnedIds = pinned.map((p) => p.otherId);

    const muteMap = new Map<string, Date>();
    const mutes = await prisma.conversationMute.findMany({
      where: { accountId },
      select: { peerId: true, mutedUntil: true },
    });
    mutes.forEach((m) => { if (m.mutedUntil > new Date()) muteMap.set(m.peerId, m.mutedUntil); });

    const labelsByPeer = await prisma.conversationLabel.findMany({
      where: { accountId },
      select: { peerId: true, label: true },
    });
    const labelMap = new Map<string, string[]>();
    labelsByPeer.forEach((l) => {
      const arr = labelMap.get(l.peerId) ?? [];
      arr.push(l.label);
      labelMap.set(l.peerId, arr);
    });

    const threads: ThreadItem[] = [];
    const requests: ThreadItem[] = [];
    for (const otherId of otherIds) {
      const threadLabels = labelMap.get(otherId) ?? [];
      if (labelFilter && !threadLabels.includes(labelFilter)) continue;
      const last = await prisma.message.findFirst({
        where: {
          OR: [
            {
              senderId: accountId,
              deletedBySenderAt: null,
              recipients: { some: { recipientId: otherId } },
            },
            {
              senderId: otherId,
              deletedByReceiverAt: null,
              recipients: { some: { recipientId: accountId, isHidden: false } },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      });
      if (!last) continue;
      const unread = await prisma.messageRecipient.count({
        where: {
          recipientId: accountId,
          message: { senderId: otherId, deletedByReceiverAt: null },
          isRead: false,
          isHidden: false,
        },
      });
      const other = last.senderId === accountId
        ? await prisma.account.findUnique({ where: { id: otherId }, select: { id: true, username: true, displayName: true, profilePhoto: true } })
        : last.sender;
      const mutedUntil = muteMap.get(otherId);
      const item: ThreadItem = {
        otherId,
        other: other || undefined,
        lastMessage: last.content.slice(0, 80),
        lastTime: last.createdAt,
        unread,
        mutedUntil: mutedUntil ? mutedUntil.toISOString() : null,
        labels: threadLabels.length ? threadLabels : undefined,
      };
      const isRequesterThread = !followingSet.has(otherId) || restrictedByMe.has(otherId);
      // If I just sent the latest message, keep the conversation in main threads so it stays visible.
      if (!isRequesterThread || last.senderId === accountId) {
        threads.push(item);
      } else {
        // Hidden words (1.6.5): filter DM requests whose last message contains hidden words
        if (
          allowListAccountIds.has(otherId)
          || (
            !contentMatchesHiddenWords(item.lastMessage, hiddenWords)
            && !contentMatchesRegex(item.lastMessage, hiddenRegexPatterns)
          )
        ) {
          requests.push(item);
        }
      }
    }
    threads.sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
    requests.sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
    return { threads, requests, pinnedIds };
  }

  /** Business inbox labels (2.46). */
  async addConversationLabel(accountId: string, peerId: string, label: string) {
    const trimmed = label.trim().slice(0, 50);
    if (!trimmed) throw new AppError('Label required', 400);
    await prisma.conversationLabel.upsert({
      where: { accountId_peerId_label: { accountId, peerId, label: trimmed } },
      create: { accountId, peerId, label: trimmed },
      update: {},
    });
    return { ok: true, label: trimmed };
  }

  async removeConversationLabel(accountId: string, peerId: string, label: string) {
    await prisma.conversationLabel.deleteMany({
      where: { accountId, peerId, label: label.trim().slice(0, 50) },
    });
    return { ok: true };
  }

  private async sanitizeViewOnce(messages: any[], accountId: string) {
    return Promise.all(
      messages.map(async (m) => {
        const normalizedMedia = await normalizeMessageMediaForApi(m.media);
        const isMine = m.senderId === accountId;
        const recipients = Array.isArray(m.recipients) ? m.recipients : [];
        const seenByEveryone = isMine
          ? recipients
              .filter((r: any) => r.recipientId !== accountId)
              .every((r: any) => r.isRead)
          : false;

        let next: any = { ...m, media: normalizedMedia };
        if (m.isVanish) {
          const rec = recipients.find((r: any) => r.recipientId === accountId);
          if (rec?.isRead) {
            next = { ...next, media: null, content: 'Photo has been viewed' };
          }
        }

        return { ...next, isMine, seenByEveryone };
      }),
    );
  }

  async getThread(accountId: string, otherId: string, cursor?: string, limit: number = DEFAULT_LIMIT) {
    const messages = await prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          {
            senderId: accountId,
            deletedBySenderAt: null,
            recipients: { some: { recipientId: otherId } },
          },
          {
            senderId: otherId,
            deletedByReceiverAt: null,
            recipients: { some: { recipientId: accountId, isHidden: false } },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        recipients: true,
        reactions: { include: { account: { select: { id: true, username: true } } } },
        pollVotes: true,
      },
    });
    const nextCursor = messages.length > limit ? messages[limit - 1].id : null;
    const items = await this.sanitizeViewOnce(
      this.enrichPollResults(messages.slice(0, limit).reverse(), accountId),
      accountId,
    );
    return { items, nextCursor };
  }

  async getThreadByGroup(accountId: string, groupId: string, cursor?: string, limit: number = DEFAULT_LIMIT) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_accountId: { groupId, accountId } },
    });
    if (!member) throw new AppError('Not a member of this group', 403);
    const messages = await prisma.message.findMany({
      where: { groupId, isGroupMessage: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        recipients: true,
        reactions: { include: { account: { select: { id: true, username: true } } } },
        pollVotes: true,
      },
    });
    const nextCursor = messages.length > limit ? messages[limit - 1].id : null;
    const items = await this.sanitizeViewOnce(this.enrichPollResults(messages.slice(0, limit).reverse(), accountId), accountId);
    return { items, nextCursor };
  }

  private enrichPollResults(messages: any[], viewerId: string) {
    return messages.map((m) => {
      if (m.messageType !== 'POLL' || !m.pollVotes) return m;
      const options = (m.media && Array.isArray((m.media as any).options)) ? (m.media as any).options as string[] : [];
      const counts = options.map((_: string, i: number) => m.pollVotes.filter((v: any) => v.optionIndex === i).length);
      const myVote = m.pollVotes.find((v: any) => v.accountId === viewerId);
      return {
        ...m,
        pollResults: counts,
        myVote: myVote != null ? myVote.optionIndex : null,
      };
    });
  }

  async votePoll(messageId: string, accountId: string, optionIndex: number): Promise<{ messageId: string; optionIndex: number }> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { pollVotes: true, recipients: { select: { recipientId: true } } },
    });
    if (!message) throw new AppError('Message not found', 404);
    if (message.messageType !== 'POLL') throw new AppError('Not a poll message', 400);
    const options = (message.media && Array.isArray((message.media as any).options)) ? (message.media as any).options as string[] : [];
    if (optionIndex < 0 || optionIndex >= options.length) throw new AppError('Invalid option index', 400);
    const recipientIds = message.recipients.map((r: any) => r.recipientId);
    const canVote = message.groupId
      ? await prisma.groupMember.findUnique({ where: { groupId_accountId: { groupId: message.groupId, accountId } } })
      : message.senderId === accountId || recipientIds.includes(accountId);
    if (!canVote) throw new AppError('You cannot vote in this poll', 403);
    await prisma.pollVote.upsert({
      where: { messageId_accountId: { messageId, accountId } },
      create: { messageId, accountId, optionIndex },
      update: { optionIndex },
    });
    return { messageId, optionIndex };
  }

  async send(
    accountId: string,
    recipientId: string,
    content: string,
    messageType: string = 'TEXT',
    opts?: { media?: { url?: string; [k: string]: unknown }; isVanish?: boolean; groupId?: string }
  ) {
    const isGroup = !!opts?.groupId;
    const hasContent = (content?.trim()?.length ?? 0) > 0;
    const hasMedia = !!opts?.media?.url;
    if (!hasContent && !hasMedia) throw new AppError('Content or media required', 400);
    const text = (content?.trim() ?? '').slice(0, 1000);
    const vanishAt = opts?.isVanish ? (() => { const d = new Date(); d.setHours(d.getHours() + 24); return d; })() : null;

    if (hasMedia) {
      const raw = String(opts!.media!.url).trim();
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw) && !raw.startsWith('data:')) {
        throw new AppError('Invalid media URL', 400);
      }
      const url = await normalizeStoredMediaUrl(raw);
      if (!url) {
        throw new AppError('Invalid media URL', 400);
      }
      opts = { ...opts, media: { ...opts!.media!, url } };
    }

    if (!isGroup) {
      const blocked = await prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: recipientId, blockedId: accountId } },
        select: { expiresAt: true },
      });
      if (blocked && (blocked.expiresAt == null || blocked.expiresAt > new Date()))
        throw new AppError('Recipient has blocked you', 403);

      const blockedByYou = await prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: accountId, blockedId: recipientId } },
        select: { expiresAt: true },
      });
      if (blockedByYou && (blockedByYou.expiresAt == null || blockedByYou.expiresAt > new Date()))
        throw new AppError('You have blocked this recipient', 403);

      const senderAccount = await prisma.account.findUnique({
        where: { id: accountId },
        include: { user: { select: { dateOfBirth: true } } },
      });
      const recipientAccount = await prisma.account.findUnique({
        where: { id: recipientId },
        select: {
          user: { select: { dateOfBirth: true } },
          hiddenWordsDMFilter: true,
          hiddenWords: true,
          clientSettings: true,
        },
      });
      const age = (dob: Date | null) =>
        dob ? (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 999;
      const senderAge = age(senderAccount?.user?.dateOfBirth ?? null);
      const recipientAge = age(recipientAccount?.user?.dateOfBirth ?? null);
      const senderIsMinor = senderAge < 18;
      const recipientIsMinor = recipientAge < 18;
      if (recipientIsMinor) {
        const recipientFollowsSender = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: recipientId, followingId: accountId } },
        });
        if (!recipientFollowsSender)
          throw new AppError('This user can only receive messages from people they follow.', 403);
      }
      if (senderIsMinor) {
        const senderFollowsRecipient = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: accountId, followingId: recipientId } },
        });
        if (!senderFollowsRecipient)
          throw new AppError('You can only message people you follow.', 403);
      }
      const [recipientFollowsSender, restrictedByRecipient] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: recipientId, followingId: accountId } },
          select: { followerId: true },
        }),
        typeof (prisma.restrict as any).findUnique === 'function'
          ? (prisma.restrict as any).findUnique({
              where: {
                restrictorId_restrictedId: { restrictorId: recipientId, restrictedId: accountId },
              },
              select: { restrictedId: true },
            })
          : null,
      ]);
      const isRequestThread = !recipientFollowsSender || !!restrictedByRecipient;

      const recipientConfig = parseHiddenWordsConfig(
        (recipientAccount?.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
      );
      const recipientAllowList = new Set(recipientConfig.allowListAccountIds);
      const recipientHiddenWords = (recipientAccount?.hiddenWordsDMFilter && Array.isArray(recipientAccount.hiddenWords))
        ? (recipientAccount.hiddenWords as string[])
        : [];
      const recipientRegex = recipientAccount?.hiddenWordsDMFilter ? recipientConfig.regexPatterns : [];
      const shouldHideByFilter = !!recipientAccount?.hiddenWordsDMFilter
        && !recipientAllowList.has(accountId)
        && (
          contentMatchesHiddenWords(text, recipientHiddenWords)
          || contentMatchesRegex(text, recipientRegex)
        );
      const shouldHideByLimit = await shouldLimitIncomingInteraction(recipientId, accountId, 'dm');
      const isHiddenForRecipient = shouldHideByFilter || shouldHideByLimit;
      if (shouldHideByFilter) {
        await addAccountActivityLog(recipientId, {
          type: 'hidden_word_filter_dm',
          title: 'DM filtered',
          description: 'A DM request was hidden by your Hidden words filter.',
          metadata: { senderId: accountId, messageType, at: new Date().toISOString() },
        });
      }

      const message = await prisma.message.create({
        data: {
          senderId: accountId,
          content: text || (messageType === 'VOICE' ? 'Voice message' : messageType === 'GIF' ? 'GIF' : 'Photo'),
          messageType,
          media: (opts?.media ?? undefined) as Prisma.InputJsonValue | undefined,
          isVanish: !!opts?.isVanish,
          vanishAt,
          recipients: { create: [{ recipientId, isHidden: isHiddenForRecipient }] },
        },
        include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } }, recipients: true },
      });
      if (shouldHideByLimit) {
        await addAccountActivityLog(recipientId, {
          type: 'limit_interaction_dm',
          title: 'DM hidden',
          description: 'A message was hidden because you have Limit interactions on.',
          metadata: { senderId: accountId, messageId: message.id, messageType, at: new Date().toISOString() },
        });
      }
      if (opts?.isVanish && opts.media?.url) {
        const deleteAt = vanishAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
        await mediaTTLService.schedule(message.id, opts.media.url, deleteAt);
      }
      const io = getIo();
      if (io) {
        const dm = io.of('/dm');
        // DM requests/restricted/filtered messages are intentionally silent.
        if (!isRequestThread && !isHiddenForRecipient) {
          dm.to(recipientId).emit('message', { message });
        }
      }
      return message;
    }

    if (messageType === 'POLL') {
      const options = opts?.media && Array.isArray((opts.media as any).options) ? ((opts.media as any).options as string[]) : [];
      if (options.length < 2 || options.length > 4) throw new AppError('POLL must have 2–4 options in media.options', 400);
      if (!text) throw new AppError('POLL content is the question', 400);
    }

    if (isGroup && opts?.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: opts.groupId, isActive: true },
        include: { members: { select: { accountId: true } } },
      });
      if (!group) throw new AppError('Group not found', 404);
      const memberIds = group.members.map((m) => m.accountId);
      if (!memberIds.includes(accountId)) throw new AppError('You are not in this group', 403);
      const recipientIds = memberIds.filter((id) => id !== accountId);
      const message = await prisma.message.create({
        data: {
          senderId: accountId,
          content: text || (messageType === 'VOICE' ? 'Voice message' : messageType === 'GIF' ? 'GIF' : 'Photo'),
          messageType,
          media: (opts?.media ?? undefined) as Prisma.InputJsonValue | undefined,
          isVanish: !!opts?.isVanish,
          vanishAt,
          groupId: opts.groupId,
          isGroupMessage: true,
          recipients: { create: recipientIds.map((recipientId) => ({ recipientId })) },
        },
        include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } }, recipients: true },
      });
      if (opts?.isVanish && opts.media?.url) {
        const deleteAt = vanishAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
        await mediaTTLService.schedule(message.id, opts.media.url, deleteAt);
      }
      return message;
    }

    const message = await prisma.message.create({
      data: {
        senderId: accountId,
        content: text || (messageType === 'VOICE' ? 'Voice message' : messageType === 'GIF' ? 'GIF' : 'Photo'),
        messageType,
        media: (opts?.media ?? undefined) as Prisma.InputJsonValue | undefined,
        isVanish: !!opts?.isVanish,
        vanishAt,
        recipients: { create: [{ recipientId }] },
      },
      include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } }, recipients: true },
    });
    if (opts?.isVanish && opts.media?.url) {
      const deleteAt = vanishAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
      await mediaTTLService.schedule(message.id, opts.media.url, deleteAt);
    }
    const io = getIo();
    if (io) {
      const dm = io.of('/dm');
      // Only notify recipient; sender already has the HTTP response.
      dm.to(recipientId).emit('message', { message });
    }
    return message;
  }

  async markThreadRead(accountId: string, otherId: string) {
    await prisma.messageRecipient.updateMany({
      where: { recipientId: accountId, message: { senderId: otherId } },
      data: { isRead: true, readAt: new Date() },
    });
    const io = getIo();
    if (io) {
      const dm = io.of('/dm');
      dm.to(otherId).emit('read', { from: accountId });
    }
    return { ok: true };
  }

  async deleteMessage(accountId: string, messageId: string, forMeOnly?: boolean) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { recipients: true },
    });
    if (!message) throw new AppError('Message not found', 404);
    const isSender = message.senderId === accountId;
    if (forMeOnly || !isSender) {
      if (isSender) {
        await prisma.message.update({
          where: { id: messageId },
          data: { deletedBySenderAt: new Date() },
        });
        return { ok: true, deletedForMe: true };
      }
      if (message.groupId) {
        await prisma.messageRecipient.updateMany({
          where: { messageId, recipientId: accountId },
          data: { isHidden: true },
        });
        return { ok: true, deletedForMe: true };
      }
      await prisma.messageRecipient.updateMany({
        where: { messageId, recipientId: accountId },
        data: { isHidden: true },
      });
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedByReceiverAt: new Date() },
      });
      return { ok: true, deletedForMe: true };
    }
    // Delete for everyone: hard delete immediately.
    await prisma.reaction.deleteMany({ where: { messageId } });
    await prisma.messageRecipient.deleteMany({ where: { messageId } });
    await prisma.message.delete({ where: { id: messageId } });
    return { ok: true, deletedForEveryone: true };
  }

  async addReaction(accountId: string, messageId: string, emoji: string) {
    await this.assertCanAccessMessage(accountId, messageId);
    const em = (emoji || '❤').slice(0, 10);
    await prisma.reaction.upsert({
      where: { accountId_messageId: { accountId, messageId } },
      create: { accountId, messageId, emoji: em },
      update: { emoji: em },
    });
    const reactions = await prisma.reaction.findMany({
      where: { messageId },
      include: { account: { select: { id: true, username: true } } },
    });
    return { reactions };
  }

  async removeReaction(accountId: string, messageId: string) {
    await this.assertCanAccessMessage(accountId, messageId);
    await prisma.reaction.deleteMany({
      where: { accountId, messageId },
    });
    return { ok: true };
  }

  async pinChat(accountId: string, otherId: string) {
    await prisma.pinnedChat.upsert({
      where: { accountId_otherId: { accountId, otherId } },
      create: { accountId, otherId },
      update: {},
    });
    return { ok: true };
  }

  async unpinChat(accountId: string, otherId: string) {
    await prisma.pinnedChat.deleteMany({
      where: { accountId, otherId },
    });
    return { ok: true };
  }

  async muteConversation(accountId: string, peerId: string, duration: string) {
    const ms = MUTE_DURATION_MS[duration] ?? MUTE_DURATION_MS['24h'];
    const mutedUntil = new Date(Date.now() + ms);
    await prisma.conversationMute.upsert({
      where: { accountId_peerId: { accountId, peerId } },
      create: { accountId, peerId, mutedUntil },
      update: { mutedUntil },
    });
    return { ok: true, mutedUntil: mutedUntil.toISOString() };
  }

  async unmuteConversation(accountId: string, peerId: string) {
    await prisma.conversationMute.deleteMany({
      where: { accountId, peerId },
    });
    return { ok: true };
  }

  /** Hide conversation with peer (all messages from them). Removes thread from list if only received. */
  async hideConversation(accountId: string, peerId: string) {
    await prisma.messageRecipient.updateMany({
      where: { recipientId: accountId, message: { senderId: peerId } },
      data: { isHidden: true },
    });
    return { ok: true };
  }

  /**
   * Accept a DM request from another account: mark all messages from them as visible to me.
   */
  async acceptRequest(accountId: string, otherId: string) {
    await prisma.messageRecipient.updateMany({
      where: {
        recipientId: accountId,
        message: { senderId: otherId },
      },
      data: { isHidden: false },
    });
    return { ok: true };
  }

  /**
   * Decline a DM request from another account: hide all messages from them for me.
   */
  async declineRequest(accountId: string, otherId: string) {
    await prisma.messageRecipient.updateMany({
      where: {
        recipientId: accountId,
        message: { senderId: otherId },
      },
      data: { isHidden: true },
    });
    return { ok: true };
  }

  /** Share a post to a DM: create Share record and send a message with post ref. */
  async sharePostToDM(accountId: string, recipientId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, accountId: true } });
    if (!post) throw new AppError('Post not found', 404);
    const blocked = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: recipientId, blockedId: accountId } },
      select: { expiresAt: true },
    });
    if (blocked && (blocked.expiresAt == null || blocked.expiresAt > new Date()))
      throw new AppError('Recipient has blocked you', 403);
    await prisma.share.create({
      data: { accountId, postId, sharedTo: 'DM', recipientId },
    });
    const baseUrl = process.env.APP_BASE_URL || 'https://moxe.app';
    const content = `Shared a post: ${baseUrl}/p/${postId}`;
    return this.send(accountId, recipientId, content, 'TEXT', {
      media: { sharedPostId: postId },
    });
  }
}
