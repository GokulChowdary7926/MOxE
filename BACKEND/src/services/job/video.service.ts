import { prisma } from '../../server';

export type VideoVisibility = 'private' | 'unlisted' | 'public';

export interface CreateVideoInput {
  title: string;
  description?: string;
  url: string;
  fileSize: number;
  durationSeconds?: number;
  visibility?: VideoVisibility;
}

export class JobVideoService {
  async listVideos(accountId: string) {
    return prisma.video.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVideo(accountId: string, id: string) {
    const video = await prisma.video.findFirst({
      where: { id, accountId },
    });
    if (!video) {
      throw new Error('Video not found');
    }
    return video;
  }

  async createVideo(accountId: string, input: CreateVideoInput) {
    const { title, description, url, fileSize, durationSeconds, visibility } = input;
    if (!title?.trim()) {
      throw new Error('Title is required');
    }
    if (!url?.trim()) {
      throw new Error('Video URL is required');
    }
    if (!fileSize || fileSize <= 0) {
      throw new Error('fileSize must be > 0');
    }

    const vis: VideoVisibility =
      visibility === 'public' || visibility === 'unlisted' || visibility === 'private'
        ? visibility
        : 'private';

    return prisma.video.create({
      data: {
        accountId,
        title: title.trim(),
        description: description?.trim() || null,
        url: url.trim(),
        fileSize,
        durationSeconds: durationSeconds && durationSeconds > 0 ? Math.round(durationSeconds) : null,
        visibility: vis,
      },
    });
  }
}

