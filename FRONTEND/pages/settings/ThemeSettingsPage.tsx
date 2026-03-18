import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { setAppTheme, type AppTheme } from '../../store/settingsSlice';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Check } from 'lucide-react';

const OPTIONS: { value: AppTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'default', label: 'Default' },
];

export default function ThemeSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const current = useSelector((s: RootState) => s.settings.appTheme);

  return (
    <SettingsPageShell title="Theme" backTo="/settings">
      <div className="px-4 py-2">
        <p className="text-[#a8a8a8] text-sm mb-4">
          Choose how MOxE looks. Default uses the app default (dark).
        </p>
        <div className="divide-y divide-[#262626]">
          {OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                dispatch(setAppTheme(value));
                navigate(-1);
              }}
              className="w-full flex items-center justify-between py-3 text-left active:bg-white/5"
            >
              <span className="text-white font-medium">{label}</span>
              {current === value && (
                <Check className="w-5 h-5 text-[#0095f6]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
