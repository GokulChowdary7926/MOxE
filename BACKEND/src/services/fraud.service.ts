import { prisma } from '../server';

export class FraudService {
  /**
   * Record a low-level fraud signal for an ad event (impression or click)
   * and, based on simple heuristics, optionally create a temporary block.
   */
  async recordAdEventSignal(input: {
    campaignId: string;
    advertiserAccountId: string;
    viewerAccountId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    eventType: 'IMPRESSION' | 'CLICK';
  }) {
    const { campaignId, advertiserAccountId, viewerAccountId, ip, userAgent, eventType } = input;

    const baseScore = eventType === 'CLICK' ? 2 : 1;

    await prisma.adFraudSignal.create({
      data: {
        campaignId,
        advertiserAccountId,
        viewerAccountId: viewerAccountId ?? null,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        eventType,
        score: baseScore,
      },
    });

    // Simple heuristic: too many clicks from same viewer or IP in a short window
    if (eventType === 'CLICK') {
      const windowMinutes = 10;
      const now = new Date();
      const since = new Date(now.getTime() - windowMinutes * 60 * 1000);

      const [viewerClicks, ipClicks] = await Promise.all([
        viewerAccountId
          ? prisma.adFraudSignal.count({
              where: {
                campaignId,
                viewerAccountId,
                eventType: 'CLICK',
                createdAt: { gte: since },
              },
            })
          : Promise.resolve(0),
        ip
          ? prisma.adFraudSignal.count({
              where: {
                campaignId,
                ip,
                eventType: 'CLICK',
                createdAt: { gte: since },
              },
            })
          : Promise.resolve(0),
      ]);

      const abusiveViewer = viewerClicks > 10;
      const abusiveIp = ipClicks > 30;

      if (abusiveViewer || abusiveIp) {
        const reason = abusiveViewer
          ? `High click volume from single viewer in ${windowMinutes}m`
          : `High click volume from single IP in ${windowMinutes}m`;

        await prisma.adFraudBlock.upsert({
          where: {
            campaignId_advertiserAccountId_level: {
              campaignId,
              advertiserAccountId,
              level: 'CAMPAIGN',
            } as any,
          },
          create: {
            campaignId,
            advertiserAccountId,
            level: 'CAMPAIGN',
            reason,
            active: true,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour cooldown
          },
          update: {
            active: true,
            reason,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          },
        });
      }
    }
  }

  /**
   * Check whether a campaign is currently blocked for fraud/abuse.
   */
  async isCampaignBlocked(campaignId: string, advertiserAccountId: string): Promise<boolean> {
    const now = new Date();
    const block = await prisma.adFraudBlock.findFirst({
      where: {
        level: 'CAMPAIGN',
        campaignId,
        advertiserAccountId,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return !!block;
  }
}

