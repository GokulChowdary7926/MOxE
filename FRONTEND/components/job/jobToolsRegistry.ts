import type { LucideIcon } from "lucide-react";
import {
  Home,
  Briefcase,
  Users,
  LayoutGrid,
  Code,
  Video,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  BarChart3,
  User,
  Plug,
  UsersRound,
  FileText,
  Shield,
  BookOpen,
  GitBranch,
  ClipboardList,
  Bell,
  Wrench,
  Compass,
  Trophy,
  ListTodo,
} from "lucide-react";

export type JobToolEntry = {
  path: string;
  label: string;
  /** Short line shown on the Job overview grid */
  description: string;
  Icon: LucideIcon;
};

/** Bottom navigation – primary three destinations */
export const JOB_MAIN_NAV: readonly JobToolEntry[] = [
  { path: "/job/overview/home", label: "Home", description: "Snapshot & metrics", Icon: Home },
  { path: "/job/track", label: "Track", description: "Applications & pipeline", Icon: Briefcase },
  { path: "/job/recruiter", label: "Recruit", description: "Talent & requisitions", Icon: Users },
] as const;

/** “More” drawer + overview grid – remaining tools */
export const JOB_MORE_TOOLS: readonly JobToolEntry[] = [
  { path: "/job/agile", label: "Agile", description: "Boards & backlog", Icon: LayoutGrid },
  { path: "/job/scrum", label: "Scrum", description: "Standups & flow", Icon: ClipboardList },
  { path: "/job/code", label: "Code", description: "Repositories", Icon: Code },
  { path: "/job/video", label: "Video", description: "Recordings", Icon: Video },
  { path: "/job/chat", label: "Chat", description: "Messages & tickets", Icon: MessageCircle },
  { path: "/job/source", label: "Source", description: "Changes & sync", Icon: GitBranch },
  { path: "/job/code-search", label: "Code Search", description: "Search codebase", Icon: Search },
  { path: "/job/ai", label: "AI", description: "Assist & generate", Icon: Sparkles },
  { path: "/job/strategy", label: "Strategy", description: "Plans & delivery", Icon: Target },
  { path: "/job/analytics", label: "Analytics", description: "Insights & KPIs", Icon: BarChart3 },
  { path: "/job/profile", label: "Profile", description: "Job presence", Icon: User },
  { path: "/job/integrations", label: "Integrations", description: "Connected apps", Icon: Plug },
  { path: "/job/teams", label: "Teams", description: "People & groups", Icon: UsersRound },
  { path: "/job/docs", label: "Docs", description: "Documents", Icon: FileText },
  { path: "/job/access", label: "Access", description: "Permissions", Icon: Shield },
  { path: "/job/status", label: "Status", description: "Service health", Icon: BarChart3 },
  { path: "/job/know", label: "Know", description: "Knowledge base", Icon: BookOpen },
  { path: "/job/flow", label: "Flow", description: "Delivery pipeline", Icon: GitBranch },
  { path: "/job/work", label: "Tasks", description: "Tasks & queue", Icon: ListTodo },
  { path: "/job/alert", label: "Alert", description: "On-call & incidents", Icon: Bell },
  { path: "/job/build", label: "Build", description: "CI/CD pipelines", Icon: Wrench },
  { path: "/job/compass", label: "Compass", description: "Operations map", Icon: Compass },
  { path: "/job/atlas", label: "Goals", description: "Objectives & OKRs", Icon: Trophy },
] as const;

/** All tools in display order (overview grid, audits) */
export const JOB_ALL_TOOLS: readonly JobToolEntry[] = [...JOB_MAIN_NAV, ...JOB_MORE_TOOLS];
