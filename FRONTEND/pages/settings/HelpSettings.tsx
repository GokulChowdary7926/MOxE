import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle, FileText, Shield, MessageCircle } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

function Row({ to, icon: Icon, label, description }: { to: string; icon: React.ElementType; label: string; description?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {description && <span className="text-[#a8a8a8] text-sm block">{description}</span>}
      </div>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function HelpSettings() {
  return (
    <SettingsPageShell title="Help" backTo="/settings">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">Get support and learn how to use MOxE.</p>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">Support</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/help/centre" icon={HelpCircle} label="Help Centre" description="Get started, orders and support" />
        <Row to="/support/tickets" icon={MessageCircle} label="My support tickets" description="View and reply to your tickets" />
        <Row to="/settings/help/report" icon={MessageCircle} label="Report a problem" />
        <Row to="/settings/helpful-resources" icon={HelpCircle} label="Helpful resources" />
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Payments in MOxE</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/help/payments" icon={FileText} label="Get started with MOxE Pay" description="Payment methods and setup" />
        <Row to="/settings/help/orders" icon={FileText} label="Orders and returns" description="Find order confirmation and returns" />
        <Row to="/settings/help/contact-payment" icon={MessageCircle} label="Contact MOxE about a payment" />
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Policies</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/help/terms" icon={FileText} label="Terms and policies" />
        <Row to="/settings/privacy-centre" icon={Shield} label="Privacy Centre" />
      </div>
    </SettingsPageShell>
  );
}
