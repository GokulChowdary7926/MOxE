import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { JobMobileLayout } from "../../components/job/JobMobileLayout";
import { useHasJobTools } from "../../hooks/useCapabilities";
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
import JobAccountProfilePage from "./JobAccountProfilePage";
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
import { JOB_MOBILE } from "../../components/job/jobMobileStyles";

export default function Job() {
  const hasJobTools = useHasJobTools();
  const navigate = useNavigate();

  if (!hasJobTools) {
    return (
      <JobMobileLayout>
        <div className={`${JOB_MOBILE.content} flex flex-1 flex-col items-center justify-center text-center`}>
          <div className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container p-6 shadow-2xl">
            <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-primary">MOxE TRACK</p>
            <h1 className="font-headline mt-1 mb-3 text-2xl font-extrabold tracking-tight text-on-surface">
              Job Tools Required
            </h1>
            <p className="mb-6 text-sm text-on-surface-variant">
              You need a Job Professional subscription to access these tools.
            </p>
            <button
              type="button"
              onClick={() => navigate("/settings/subscription")}
              className={JOB_MOBILE.btnPrimary}
            >
              Upgrade to Job Professional ($10/month)
            </button>
          </div>
        </div>
      </JobMobileLayout>
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
        <Route path="profile/edit" element={<JobProfileTool />} />
        <Route path="profile" element={<JobAccountProfilePage />} />
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
        <Route path="integration" element={<Navigate to="/job/integrations" replace />} />
        <Route path="/" element={<Navigate to="/job/overview/home" replace />} />
        <Route path="*" element={<Navigate to="/job/overview/home" replace />} />
      </Routes>
    </JobMobileLayout>
  );
}
