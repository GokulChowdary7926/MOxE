import { prisma } from '../../server';

export class YourAlgorithmService {
  async getUserTopics(userId: string): Promise<unknown> {
    const embedding = await prisma.userEmbedding
      .findUnique({ where: { userId } })
      .catch(() => null);
    return embedding?.topics || [];
  }

  async updateUserTopics(userId: string, topics: unknown): Promise<void> {
    await prisma.userEmbedding.upsert({
      where: { userId },
      update: { topics: topics as any, lastUpdated: new Date() },
      create: {
        userId,
        topics: topics as any,
        embedding: {} as any,
        lastUpdated: new Date(),
      },
    });
  }

  async downRankTopic(userId: string, topicToDownRank: string): Promise<void> {
    const embedding = await prisma.userEmbedding
      .findUnique({ where: { userId } })
      .catch(() => null);
    const topics = Array.isArray(embedding?.topics) ? embedding?.topics : [];
    const updated = topics.map((t: any) =>
      t.topic === topicToDownRank ? { ...t, score: (t.score || 1) * 0.1 } : t,
    );
    await this.updateUserTopics(userId, updated);
  }

  async upRankTopic(userId: string, topicToUpRank: string): Promise<void> {
    const embedding = await prisma.userEmbedding
      .findUnique({ where: { userId } })
      .catch(() => null);
    const topics = Array.isArray(embedding?.topics) ? embedding?.topics : [];
    const updated = topics.map((t: any) =>
      t.topic === topicToUpRank ? { ...t, score: Math.min((t.score || 1) * 1.5, 5) } : t,
    );
    await this.updateUserTopics(userId, updated);
  }
}

