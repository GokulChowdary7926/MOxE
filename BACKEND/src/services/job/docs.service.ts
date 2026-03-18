import { prisma } from '../../server';

export class JobDocsService {
  async listDocuments(accountId: string) {
    const docs = await prisma.jobDocument.findMany({
      where: { accountId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        content: false,
      },
    });
    return docs;
  }

  async getDocument(accountId: string, documentId: string) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 20,
          include: {
            createdBy: { select: { id: true, username: true, displayName: true } },
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            account: { select: { id: true, username: true, displayName: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                account: { select: { id: true, username: true, displayName: true } },
              },
            },
          },
        },
      },
    });
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  async createDocument(accountId: string, data: { title: string; content?: string }) {
    const title = (data.title || 'Untitled').trim().slice(0, 500);
    const content = (data.content || '').trim();
    const doc = await prisma.jobDocument.create({
      data: { accountId, title, content },
    });
    await prisma.jobDocumentVersion.create({
      data: {
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        versionNumber: 1,
        createdById: accountId,
      },
    });
    return doc;
  }

  async updateDocument(
    accountId: string,
    documentId: string,
    data: { title?: string; content?: string }
  ) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
    });
    if (!doc) throw new Error('Document not found');

    const nextVersion = await prisma.jobDocumentVersion.count({
      where: { documentId },
    });

    const updateData: { title?: string; content?: string } = {};
    if (data.title !== undefined) updateData.title = data.title.trim().slice(0, 500);
    if (data.content !== undefined) updateData.content = data.content;

    const [updated] = await prisma.$transaction([
      prisma.jobDocument.update({
        where: { id: documentId },
        data: updateData,
      }),
      prisma.jobDocumentVersion.create({
        data: {
          documentId,
          title: updateData.title ?? doc.title,
          content: updateData.content ?? doc.content,
          versionNumber: nextVersion + 1,
          createdById: accountId,
        },
      }),
    ]);
    return updated;
  }

  async deleteDocument(accountId: string, documentId: string) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
    });
    if (!doc) throw new Error('Document not found');
    await prisma.jobDocument.delete({ where: { id: documentId } });
    return { deleted: true };
  }

  async listVersions(accountId: string, documentId: string) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
    });
    if (!doc) throw new Error('Document not found');
    const versions = await prisma.jobDocumentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: {
        createdBy: { select: { id: true, username: true, displayName: true } },
      },
    });
    return versions;
  }

  async addComment(
    accountId: string,
    documentId: string,
    data: { content: string; parentId?: string }
  ) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
    });
    if (!doc) throw new Error('Document not found');
    const comment = await prisma.jobDocumentComment.create({
      data: {
        documentId,
        accountId,
        content: (data.content || '').trim(),
        parentId: data.parentId || null,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true } },
      },
    });
    return comment;
  }

  async resolveComment(accountId: string, documentId: string, commentId: string, resolved: boolean) {
    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, accountId },
    });
    if (!doc) throw new Error('Document not found');
    const comment = await prisma.jobDocumentComment.findFirst({
      where: { id: commentId, documentId },
    });
    if (!comment) throw new Error('Comment not found');
    const updated = await prisma.jobDocumentComment.update({
      where: { id: commentId },
      data: { resolvedAt: resolved ? new Date() : null },
      include: {
        account: { select: { id: true, username: true, displayName: true } },
      },
    });
    return updated;
  }
}
