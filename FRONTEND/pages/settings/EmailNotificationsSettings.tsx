import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function EmailNotificationsSettings() {
  const [feedback, setFeedback] = useState<'off' | 'on'>('on');
  const [reminder, setReminder] = useState<'off' | 'on'>('on');
  const [product, setProduct] = useState<'off' | 'on'>('on');
  const [news, setNews] = useState<'off' | 'on'>('on');
  const [support, setSupport] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Email notifications" backTo="/settings/notifications">
      <p className="text-[#a8a8a8] text-sm px-4 py-2">See notifications that you may have missed.</p>
      <SettingsRadioSection name="feedback" title="Feedback emails" value={feedback} onChange={(v) => setFeedback(v as 'off' | 'on')} exampleText="Give feedback on MOxE." />
      <SettingsRadioSection name="reminder" title="Reminder emails" value={reminder} onChange={(v) => setReminder(v as 'off' | 'on')} exampleText="See notifications that you may have missed." />
      <SettingsRadioSection name="product" title="Product emails" value={product} onChange={(v) => setProduct(v as 'off' | 'on')} exampleText="Get tips and resources about MOxE's tools." />
      <SettingsRadioSection name="news" title="News emails" value={news} onChange={(v) => setNews(v as 'off' | 'on')} exampleText="Learn about new MOxE features." />
      <SettingsRadioSection name="support" title="Support emails" value={support} onChange={(v) => setSupport(v as 'off' | 'on')} exampleText="Get updates on reports and violations of our Community Standards." />
    </SettingsPageShell>
  );
}
