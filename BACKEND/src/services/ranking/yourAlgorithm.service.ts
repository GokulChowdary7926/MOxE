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
    const topics = Array.isArray(embedding?.topics) ? [...embedding.topics] : [];
    let found = false;
    const updated = topics.map((t: any) => {
      if (t.topic === topicToUpRank) {
        found = true;
        return { ...t, score: Math.min((t.score || 1) * 1.5, 5) };
      }
      return t;
    });
    if (!found) updated.push({ topic: topicToUpRank, score: 1.2 });
    await this.updateUserTopics(userId, updated);
  }

  /** Clear learned topic weights (explore/feed personalization baseline). */
  async resetSuggestedTopics(userId: string): Promise<void> {
    await this.updateUserTopics(userId, []);
  }
}

