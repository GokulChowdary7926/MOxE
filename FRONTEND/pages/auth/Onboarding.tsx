import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AUTH } from './authStyles';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';

const STEPS = [
  'phone',
  'verification',
  'email',
  'username',
  'displayName',
  'dob',
  'photo',
  'bio',
  'link',
  'pronouns',
] as const;

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  phone: 'Phone number',
  verification: 'Verify code',
  email: 'Add email',
  username: 'Choose username',
  displayName: 'Display name',
  dob: 'Date of birth',
  photo: 'Profile photo',
  bio: 'Bio',
  link: 'Link in bio',
  pronouns: 'Pronouns',
};

/** Multi-step onboarding: phone → verification → email → username → display name → DOB → photo → bio → link → pronouns */
export default function Onboarding() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [pronouns, setPronouns] = useState('');

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/login', { replace: true });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-black safe-area-pt safe-area-pb ${AUTH.bg}`}>
      <header className="flex items-center justify-between h-12 px-4 border-b border-[#262626]">
        <button type="button" onClick={handleBack} className="text-white text-sm font-medium">
          Back
        </button>
        <span className="text-[#737373] text-xs">
          {stepIndex + 1} of {STEPS.length}
        </span>
        <span className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className={AUTH.container}>
          <h1 className="text-xl font-semibold text-white text-center mb-1">{STEP_LABELS[step]}</h1>
          <p className="text-[#737373] text-sm text-center mb-6">
            {step === 'phone' && 'We’ll send you a code to verify your number.'}
            {step === 'verification' && 'Enter the 6-digit code we sent.'}
            {step === 'email' && 'Add an email for account recovery. You can skip.'}
            {step === 'username' && 'Pick a unique username (3–30 characters).'}
            {step === 'displayName' && 'This is how your name appears on your profile.'}
            {step === 'dob' && 'You must be 18+ to use MOxE.'}
            {step === 'photo' && 'Add a profile photo so friends can find you.'}
            {step === 'bio' && 'Write a short bio (up to 150 characters).'}
            {step === 'link' && 'Add a link to show on your profile.'}
            {step === 'pronouns' && 'Optional: how you’d like to be referred to.'}
          </p>

          {step === 'phone' && (
            <>
              <label className={AUTH.label}>Country code + number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className={AUTH.input}
              />
            </>
          )}
          {step === 'verification' && (
            <>
              <label className={AUTH.label}>6-digit code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className={AUTH.input}
              />
              <button type="button" className="mt-2 text-[#0095f6] text-sm font-semibold">
                Resend code
              </button>
            </>
          )}
          {step === 'email' && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={AUTH.input}
              />
              <Link to="/login" className="block text-center text-[#737373] text-sm mt-2">Skip</Link>
            </>
          )}
          {step === 'username' && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="username"
                className={AUTH.input}
              />
              <p className="text-[#737373] text-xs mt-1">{username.length}/30</p>
            </>
          )}
          {step === 'displayName' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="Display name"
              className={AUTH.input}
            />
          )}
          {step === 'dob' && (
            <>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={AUTH.input}
              />
              <p className="text-[#737373] text-xs mt-2">Your birthday is used for age verification.</p>
            </>
          )}
          {step === 'photo' && (
            <div className="w-24 h-24 rounded-full bg-[#262626] border-2 border-dashed border-[#363636] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-[#737373]">+</span>
            </div>
          )}
          {step === 'bio' && (
            <>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Write a short bio..."
                rows={3}
                className={AUTH.input}
              />
              <p className="text-[#737373] text-xs mt-1">{bio.length}/150</p>
            </>
          )}
          {step === 'link' && (
            <>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className={AUTH.input}
              />
              <input
                type="text"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Display text (optional)"
                className={`${AUTH.input} mt-2`}
              />
            </>
          )}
          {step === 'pronouns' && (
            <div className="flex flex-wrap gap-2 justify-center">
              {['She/her', 'He/him', 'They/them', 'Custom'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPronouns(p)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${pronouns === p ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-white border border-[#363636]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 w-full">
            <PrimaryButton onClick={handleNext}>
              {isLast ? 'Finish' : 'Next'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
