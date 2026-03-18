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

    // Contextual, helpful reply (placeholder when no external LLM is configured).
    const lower = prompt.toLowerCase();
    let guidance = '';
    if (/\b(job|posting|requisition|hire|recruit)\b/.test(lower)) {
      guidance =
        'Job postings & recruiting: Use MOxE Recruiter (or Track) to create job postings, set up pipelines, and move candidates through stages. Create a job from the Recruiter or Track tab, then add pipeline stages and start receiving applications.';
    } else if (/\b(track|board|sprint|agile|backlog|issue)\b/.test(lower)) {
      guidance =
        'Track & Agile: Use MOxE Track for job requisitions and pipelines, and Agile for project boards, sprints, and issues. Create a project, add issues to the backlog, and run sprints from the Agile tab.';
    } else if (/\b(code|repo|source|search)\b/.test(lower)) {
      guidance =
        'Code & search: Use Code for repos and Code Search to find code across your Job workspace. Link repos to projects in Track/Agile for traceability.';
    } else if (/\b(doc|know|wiki|page)\b/.test(lower)) {
      guidance =
        '**Docs & Know:** Use **MOxE Know** for spaces and pages (wiki-style), and **Docs** for real-time collaborative documents. Create a space, then add pages or invite others to edit.';
    } else if (/\b(flow|work|chat|ticket)\b/.test(lower)) {
      guidance =
        'Flow, Work & Chat: Flow is for lightweight boards; Work for tasks and time; Chat for support-style tickets and conversations. Pick the tool that matches how your team works.';
    } else {
      guidance =
        `You asked: "${prompt.slice(0, 200)}${prompt.length > 200 ? '…' : ''}"\n\n` +
        'Quick tips:\n' +
        '• Track — Job postings, pipelines, applications.\n' +
        '• Agile — Projects, sprints, issues, board view.\n' +
        '• Know — Spaces and pages (wiki).\n' +
        '• Code / Code Search — Repos and code search.\n' +
        '• Docs — Real-time documents.\n\n' +
        'Tell me what you want to do (e.g. create a job, set up a sprint, or find code), and I can give step-by-step guidance.';
    }
    const responseText =
      'Here’s how MOxE can help:\n\n' + guidance + "\n\nTo get deeper, model-generated answers, configure an AI provider in your environment.";

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

