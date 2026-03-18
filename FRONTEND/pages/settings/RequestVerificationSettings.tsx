import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const DOC_TYPES = ['Passport', 'Driver\'s licence', 'National ID', 'Other'];
const CATEGORIES = ['News/Media', 'Sports', 'Government', 'Music', 'Fashion', 'Other'];
const LINK_TYPES = ['Article', 'Social media', 'Official website', 'Other'];

export default function RequestVerificationSettings() {
  const [fullName, setFullName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [audience, setAudience] = useState('');
  const [alsoKnownAs, setAlsoKnownAs] = useState('');
  const [links, setLinks] = useState<{ type: string; url: string }[]>([{ type: '', url: '' }, { type: '', url: '' }, { type: '', url: '' }]);

  return (
    <SettingsPageShell title="Request verification" backTo="/settings/account-type-tools">
      <div className="px-4 py-4">
        <h2 className="text-white font-semibold mb-2">Before you start</h2>
        <p className="text-[#a8a8a8] text-sm mb-2">
          This verification form is for accounts of notable individuals and prominent brands. If you don&apos;t fit into one of these categories, you can still subscribe to get a verified badge and more.
        </p>
        <Link to="/settings/subscriptions" className="text-[#0095f6] text-sm font-medium">Subscribe to Meta Verified</Link>

        <h2 className="text-white font-semibold mt-6 mb-2">Apply for MOxE verification</h2>
        <p className="text-[#a8a8a8] text-sm mb-4">Verified accounts have blue ticks next to their names to show that MOxE has confirmed their authenticity.</p>

        <h3 className="text-white font-medium mt-4 mb-2">Step 1: Confirm authenticity</h3>
        <p className="text-[#a8a8a8] text-sm mb-3">Add 1-2 identification documents for yourself or your business.</p>
        <input
          type="text"
          placeholder="Username"
          readOnly
          className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-[#a8a8a8] text-sm mb-3"
          value="g0kul_ch0wdxryy_7"
        />
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm mb-3"
        />
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm mb-3"
        >
          <option value="">Document type</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="button" className="w-full py-2.5 rounded-lg border border-[#363636] text-[#a8a8a8] text-sm">Add file</button>

        <h3 className="text-white font-medium mt-6 mb-2">Step 2: Confirm notability</h3>
        <p className="text-[#a8a8a8] text-sm mb-3">Show that the public figure, celebrity or brand your account represents is in the public interest.</p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm mb-3"
        >
          <option value="">Category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Country/region"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm mb-3"
        />
        <div className="mb-3">
          <input
            type="text"
            placeholder="Audience (optional)"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
          <p className="text-[#a8a8a8] text-xs mt-1">Describe the people who follow your account. Include who they are, what they&apos;re interested in and why they follow you.</p>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Also known as (optional)"
            value={alsoKnownAs}
            onChange={(e) => setAlsoKnownAs(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
          <p className="text-[#a8a8a8] text-xs mt-1">List all of the names that the person or organisation your account represents is known by.</p>
        </div>

        <h3 className="text-white font-medium mt-6 mb-2">Links (optional)</h3>
        <p className="text-[#a8a8a8] text-sm mb-3">Add articles, social media accounts and other links that show your account is in the public interest. Paid or promotional content won&apos;t be considered.</p>
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 mb-3">
            <select
              value={link.type}
              onChange={(e) => setLinks((prev) => prev.map((l, j) => j === i ? { ...l, type: e.target.value } : l))}
              className="flex-1 px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
            >
              <option value="">Type</option>
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="URL"
              value={link.url}
              onChange={(e) => setLinks((prev) => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
              className="flex-1 px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
          </div>
        ))}
        <button type="button" className="text-[#0095f6] text-sm font-medium mb-4">Add link</button>

        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold">Submit</button>
        <p className="text-[#737373] text-xs text-center mt-3">We&apos;ll only use the information you submit to determine if your account meets our verification criteria.</p>
      </div>
    </SettingsPageShell>
  );
}
