import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { JobMobileLayout } from "../../components/job/JobMobileLayout";
import { useHasJobTools } from "../../hooks/useCapabilities";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import Overview from "./Overview";
import Track from "./Track";
import Recruiter from "./Recruiter";
import Agile from "./Agile";
import Code from "./Code";
import Status from "./Status";
import Video from "./Video";
import Chat from "./Chat";
import Source from "./Source";
import CodeSearch from "./CodeSearch";
import Ai from "./Ai";
import Strategy from "./Strategy";
import JobAnalytics from "./Analytics";
import JobProfileTool from "./Profile";
import Scrum from "./Scrum";
import Integration from "./Integration";
import Docs from "./Docs";
import Teams from "./Teams";
import Access from "./Access";
import Know from "./Know";
import Flow from "./Flow";
import Atlas from "./Atlas";
import Work from "./Work";
import Compass from "./Compass";
import Alert from "./Alert";
import Build from "./Build";

export default function Job() {
  const hasJobTools = useHasJobTools();
  const account = useSelector((s: RootState) => s.account.currentAccount);
  const navigate = useNavigate();

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (!hasJobTools) {
    return (
      <div className="min-h-screen bg-[#1D2125] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-[#E6EDF3] mb-4">Job Tools Required</h1>
        <p className="text-[#8C9BAB] mb-6 max-w-sm">
          You need a Job Professional subscription to access these tools.
        </p>
        <button
          type="button"
          onClick={() => navigate("/settings/subscription")}
          className="px-6 py-3 bg-[#6554C0] text-white rounded-xl font-semibold"
        >
          Upgrade to Job Professional ($10/month)
        </button>
      </div>
    );
  }

  return (
    <JobMobileLayout>
      <Routes>
        {/* Mobile-style nested routes: each tool owns its sub-pages under */ }
        <Route path="overview/*" element={<Overview />} />
        <Route path="track/*" element={<Track />} />
        <Route path="recruiter/*" element={<Recruiter />} />
        <Route path="agile/*" element={<Agile />} />
        <Route path="code/*" element={<Code />} />
        <Route path="video/*" element={<Video />} />
        <Route path="chat/*" element={<Chat />} />
        <Route path="source/*" element={<Source />} />
        <Route path="code-search/*" element={<CodeSearch />} />
        <Route path="ai/*" element={<Ai />} />
        <Route path="strategy/*" element={<Strategy />} />
        <Route path="analytics/*" element={<JobAnalytics />} />
        <Route path="profile/*" element={<JobProfileTool />} />
        <Route path="integrations/*" element={<Integration />} />
        <Route path="scrum/*" element={<Scrum />} />
        <Route path="teams/*" element={<Teams />} />
        <Route path="docs/*" element={<Docs />} />
        <Route path="access/*" element={<Access />} />
        <Route path="status/*" element={<Status />} />
        <Route path="know/*" element={<Know />} />
        <Route path="flow/*" element={<Flow />} />
        <Route path="work/*" element={<Work />} />
        <Route path="alert/*" element={<Alert />} />
        <Route path="build/*" element={<Build />} />
        <Route path="compass/*" element={<Compass />} />
        <Route path="atlas/*" element={<Atlas />} />
        <Route path="/" element={<Navigate to="/job/overview" replace />} />
        <Route path="*" element={<Navigate to="/job/overview" replace />} />
      </Routes>
    </JobMobileLayout>
  );
}
