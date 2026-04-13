import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export class JobAccessService {
  /**
   * Resolve or create an Org associated with this Job account.
   * For now we create a dedicated Org per account when none exists.
   */
  async getOrCreateOrgForAccount(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, displayName: true, username: true },
    });
    if (!account) throw new AppError('Account not found', 404);

    // If this account is already an OrgUser somewhere, reuse that org.
    const existingOrgUser = await prisma.orgUser.findFirst({
      where: { accountId },
      include: { org: true },
    });
    if (existingOrgUser) {
      return existingOrgUser.org;
    }

    // Otherwise, create a new org for this Job account.
    const baseName =
      (account.displayName || account.username || 'Job Org').slice(0, 190) || 'Job Org';
    let name = baseName;
    let suffix = 0;
    // Ensure unique org name.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.org.findUnique({ where: { name } });
      if (!existing) break;
      name = `${baseName}-${++suffix}`;
    }

    const org = await prisma.org.create({
      data: {
        name,
      },
    });

    // Create an OrgUser entry linking this account to the org.
    const email = `${account.id}@job.moxe.local`;
    await prisma.orgUser.create({
      data: {
        orgId: org.id,
        accountId: account.id,
        email,
        displayName: account.displayName || account.username || 'Job user',
      },
    });

    try {
      await prisma.orgAuditLog.create({
        data: {
          orgId: org.id,
          actorAccountId: account.id,
          action: 'ORG_PROVISIONED',
          summary: 'Organization created for MOxE Job / Access',
        },
      });
    } catch {
      // OrgAuditLog table may not exist until migration applied
    }

    return org;
  }
}

