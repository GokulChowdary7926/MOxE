import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

type AIModel = 'gpt-4' | 'claude-3' | 'local';

export interface JobAIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export class JobAIService {
  /**
   * In a production system this would call an external LLM provider or
   * an internal AI orchestration layer. For now, we implement a basic,
   * deterministic placeholder that echoes back structured guidance while
   * persisting messages for audit/history per Job account.
   */
  async chat(
    accountId: string,
    input: {
      prompt: string;
      model?: AIModel;
      metadata?: Record<string, any>;
    },
  ) {
    const prompt = (input.prompt || '').trim();
    if (!prompt) throw new AppError('Prompt is required', 400);
    if (prompt.length > 8000) throw new AppError('Prompt is too long', 400);

    // Persist the user message for basic history.
    const userMessage = await prisma.jobAIAudit.create({
      data: {
        accountId,
        role: 'user',
        content: prompt.slice(0, 16000),
        model: input.model || 'gpt-4',
        metadata: input.metadata || {},
      },
    });

    // Very simple deterministic "AI" response as placeholder.
    const responseText =
      'MOxE AI (Job) received your prompt and is not yet wired to a live model. ' +
      'Here is a structured echo you can use for planning:\n\n' +
      '---\n' +
      `Prompt summary: ${prompt.slice(0, 280)}\n\n` +
      'Next actions:\n' +
      '- Clarify the specific objective and constraints.\n' +
      '- Identify the MOxE Job tools and data involved.\n' +
      '- Break the work into small, testable steps.\n\n' +
      'When a real AI backend is configured, this endpoint will return model-generated guidance instead of this placeholder.';

    const assistantMessage = await prisma.jobAIAudit.create({
      data: {
        accountId,
        role: 'assistant',
        content: responseText,
        model: input.model || 'gpt-4',
        metadata: input.metadata || {},
        parentId: userMessage.id,
      },
    });

    return {
      message: {
        id: assistantMessage.id,
        role: 'assistant' as const,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  async history(accountId: string, limit = 50): Promise<JobAIMessage[]> {
    const rows = await prisma.jobAIAudit.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
    return rows.map((r) => ({
      id: r.id,
      role: r.role as 'user' | 'assistant' | 'system',
      content: r.content,
      createdAt: r.createdAt,
    }));
  }
}

