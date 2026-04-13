import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { assertNotLimitedIncomingInteraction, shouldLimitIncomingInteraction } from './limitInteractionEnforcement.service';

type TagMentionFromMode = 'everyone' | 'following' | 'off';

export function readTagsMentionPrefs(clientSettings: unknown): {
  tagsFrom: TagMentionFromMode;
  mentionsFrom: TagMentionFromMode;
  manualTagApproval: boolean;
} {
  const cs =
    clientSettings && typeof clientSettings === 'object' && !Array.isArray(clientSettings)
      ? (clientSettings as Record<string, unknown>)
      : {};
  const t =
    cs.tagsAndMentions && typeof cs.tagsAndMentions === 'object' && !Array.isArray(cs.tagsAndMentions)
      ? (cs.tagsAndMentions as Record<string, unknown>)
      : {};
  const tagsFrom: TagMentionFromMode =
    t.tagsFrom === 'following' || t.tagsFrom === 'off' ? (t.tagsFrom as TagMentionFromMode) : 'everyone';
  const mentionsFrom: TagMentionFromMode =
    t.mentionsFrom === 'following' || t.mentionsFrom === 'off'
      ? (t.mentionsFrom as TagMentionFromMode)
      : 'everyone';
  return { tagsFrom, mentionsFrom, manualTagApproval: !!t.manualTagApproval };
}

export async function loadTagsMentionPrefs(accountId: string) {
  const row = await prisma.account.findUnique({
    where: { id: accountId },
    select: { clientSettings: true },
  });
  return readTagsMentionPrefs(row?.clientSettings);
}

export async function assertActorMayMention(actorId: string, targetId: string): Promise<void> {
  if (actorId === targetId) return;
  await assertNotLimitedIncomingInteraction(targetId, actorId, 'mention_or_tag');
  const prefs = await loadTagsMentionPrefs(targetId);
  if (prefs.mentionsFrom === 'off') {
    throw new AppError('This person does not allow mentions', 403);
  }
  if (prefs.mentionsFrom === 'following') {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: targetId, followingId: actorId } },
    });
    if (!f) throw new AppError('This person does not allow mentions from you', 403);
  }
}

export async function canActorTag(actorId: string, targetId: string): Promise<boolean> {
  if (actorId === targetId) return true;
  if (await shouldLimitIncomingInteraction(targetId, actorId, 'mention_or_tag')) return false;
  const prefs = await loadTagsMentionPrefs(targetId);
  if (prefs.tagsFrom === 'off') return false;
  if (prefs.tagsFrom === 'following') {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: targetId, followingId: actorId } },
    });
    return !!f;
  }
  return true;
}

/** @mention must not be inside an email (e.g. skip user@gmail.com). */
/** Usernames are lowercase a–z only (3–30); match @handle in captions. */
const HANDLE_IN_TEXT = /(?<![A-Za-z0-9_.])@([a-z]{3,30})\b/g;

export function extractAtHandlesFromText(content: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = new RegExp(HANDLE_IN_TEXT.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const raw = m[1];
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

export async function resolveHandlesToAccountIds(handles: string[]): Promise<string[]> {
  const unique = [...new Set(handles.map((h) => h.trim()).filter(Boolean))];
  if (!unique.length) return [];
  const accounts = await prisma.account.findMany({
    where: {
      isActive: true,
      OR: unique.map((u) => ({ username: { equals: u, mode: 'insensitive' } })),
    },
    select: { id: true },
  });
  return [...new Set(accounts.map((a) => a.id))];
}

/** Enforce clientSettings.tagsAndMentions.mentionsFrom for @handles in comment (or story reply) text. */
export async function assertCommentMentionsAllowed(actorId: string, content: string): Promise<void> {
  const handles = extractAtHandlesFromText(content);
  if (!handles.length) return;
  const targetIds = await resolveHandlesToAccountIds(handles);
  for (const targetId of targetIds) {
    if (targetId === actorId) continue;
    await assertActorMayMention(actorId, targetId);
  }
}

export async function syncMentionsForPostComment(postId: string, commentId: string, content: string): Promise<void> {
  await prisma.mention.deleteMany({ where: { commentId } });
  const handles = extractAtHandlesFromText(content);
  if (!handles.length) return;
  const targetIds = await resolveHandlesToAccountIds(handles);
  if (!targetIds.length) return;
  await prisma.mention.createMany({
    data: targetIds.map((accountId) => ({ accountId, postId, commentId })),
  });
}
