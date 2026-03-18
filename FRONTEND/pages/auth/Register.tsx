import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { AUTH } from './authStyles';

/** Sign-up entry: primary path is phone verification (/verify). Account type is chosen after verification. */
export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<'type' | 'phone'>('type');
  const [accountType, setAccountType] = useState<string>('PERSONAL');

  const handleContinueWithPhone = () => {
    navigate('/verify');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-8 ${AUTH.bg} safe-area-pt safe-area-pb`}>
      <div className={AUTH.container}>
        <div className={AUTH.logoWrapper}>
          <img src="/logo.png" alt="MOxE" className="w-14 h-14 rounded-xl object-cover" />
        </div>

        {step === 'type' ? (
          <>
            <div className={AUTH.card}>
              <p className="text-[#737373] text-sm text-center mb-4">
                Choose your account type. You can add more accounts later.
              </p>
              <div className="w-full space-y-2">
                {(ACCOUNT_TYPES as unknown as string[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setAccountType(type);
                      setStep('phone');
                    }}
                    className={`w-full p-4 rounded-lg border text-left ${
                      accountType === type
                        ? 'border-[#0095f6] bg-[#0095f6]/5'
                        : 'border-[#dbdbdb] bg-[#fafafa] text-black'
                    }`}
                  >
                    <span className="font-semibold text-sm text-black">
                      {ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS]}
                    </span>
                    <p className="text-[#737373] text-xs mt-1">
                      {type === 'PERSONAL' && 'Feed, posts, stories, DMs.'}
                      {type === 'BUSINESS' && 'Commerce, live, analytics.'}
                      {type === 'CREATOR' && 'Live, supporters, gifts, analytics.'}
                      {type === 'JOB' && 'Track, Know, Flow, job feed.'}
                    </p>
                  </button>
                ))}
              </div>
              <div className={`mt-4 ${AUTH.divider}`}>
                <span className={AUTH.dividerLine} />
                <span className={AUTH.dividerText}>Then</span>
                <span className={AUTH.dividerLine} />
              </div>
              <button
                type="button"
                onClick={handleContinueWithPhone}
                className={AUTH.btnPrimary}
              >
                Sign up with phone
              </button>
              <p className="text-[#737373] text-xs text-center mt-3">
                We&apos;ll send a 6-digit code to your phone to create your account.
              </p>
            </div>
            <div className={AUTH.footerCard}>
              <p className={`${AUTH.footerText} text-center`}>
                Have an account? <Link to="/login" className={AUTH.link}>Log in</Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={AUTH.card}>
              <p className="text-[#737373] text-sm text-center mb-4">
                You chose <span className="font-medium text-[#262626]">{ACCOUNT_TYPE_LABELS[accountType as keyof typeof ACCOUNT_TYPE_LABELS]}</span>. Sign up with your phone to continue.
              </p>
              <button
                type="button"
                onClick={handleContinueWithPhone}
                className={AUTH.btnPrimary}
              >
                Sign up with phone
              </button>
              <button
                type="button"
                onClick={() => setStep('type')}
                className="w-full mt-3 text-[#0095f6] text-sm font-semibold"
              >
                ← Change account type
              </button>
            </div>
            <div className={AUTH.footerCard}>
              <p className={`${AUTH.footerText} text-center`}>
                Have an account? <Link to="/login" className={AUTH.link}>Log in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
