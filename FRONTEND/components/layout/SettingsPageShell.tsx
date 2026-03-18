import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../ui/Themed';
import { MobileShell } from './MobileShell';

/** Dark-theme settings page: back + title + optional right, then children. */
export function SettingsPageShell({
  title,
  backTo,
  right,
  children,
}: {
  title: string;
  backTo: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to={backTo} className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">{title}</span>
          <div className="min-w-[80px] flex justify-end">{right ?? <div className="w-10" />}</div>
        </header>
        <div className="flex-1 overflow-auto pb-20">{children}</div>
      </MobileShell>
    </ThemedView>
  );
}

const OFF_ON = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];

/** Section with title, radio options (default Off/On), and optional example text. */
export function SettingsRadioSection({
  title,
  name,
  value,
  onChange,
  exampleText,
  options = OFF_ON,
}: {
  title: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  exampleText?: string;
  options?: { label: string; value: string }[];
}) {
  return (
    <section className="border-b border-[#262626] py-3 px-4">
      <h2 className="text-white font-semibold mb-2">{title}</h2>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center justify-between py-2 active:opacity-80 cursor-pointer">
          <span className="text-white">{opt.label}</span>
          <input type="radio" name={name} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${value === opt.value ? 'border-white' : 'border-[#363636]'}`}>
            {value === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
          </span>
        </label>
      ))}
      {exampleText && <p className="text-[#a8a8a8] text-sm mt-1">{exampleText}</p>}
    </section>
  );
}

/** Single row with label + toggle switch. */
export function SettingsToggleRow({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-[#262626]">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-[#a8a8a8] text-sm mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
