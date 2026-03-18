import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function AddEmergencyContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');

  return (
    <SettingsPageShell title="Add Emergency Contact" backTo="/map/sos/contacts" right={<Link to="/map/sos/contacts" className="text-white p-1" aria-label="Close"><span className="text-xl leading-none">×</span></Link>}>
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-white font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email (optional)" className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Relationship</label>
          <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g., Family, Friend" className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
        <Link to="/map/sos/contacts" className="block w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-center mt-6">Add Contact</Link>
      </div>
    </SettingsPageShell>
  );
}
