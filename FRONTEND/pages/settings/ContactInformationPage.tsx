import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

export default function ContactInformationPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const contactInfo = account?.user?.phoneNumber ?? account?.contactPhone ?? 'Not added';

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Contact information</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-24">
          <p className="text-[#a8a8a8] text-sm px-4 pt-4 pb-4">
            Manage your mobile numbers and email addresses, and who can see your contact info. Use any of them to access any profiles or devices in this Accounts Centre.
          </p>

          <div className="border-t border-[#262626]">
            <Link to="/settings/account-centre/contact-information/mobile" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
              <Phone className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
              <span className="flex-1 font-medium">{contactInfo}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb">
          <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">
            Add new contact
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
