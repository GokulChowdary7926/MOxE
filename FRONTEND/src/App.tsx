import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Splash from '../pages/auth/Splash';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Onboarding from '../pages/auth/Onboarding';
import PhoneVerification from '../pages/auth/PhoneVerification';
import ForgotPassword from '../pages/auth/ForgotPassword';
import AuthCallback from '../pages/auth/AuthCallback';
import ComingSoonPage from '../pages/ComingSoonPage';
import Home from '../pages/home/Home';
import Profile from '../pages/profile/Profile';
import EditProfile from '../pages/profile/EditProfile';
import Followers from '../pages/profile/Followers';
import Explore from '../pages/explore/Explore';
import Messages from '../pages/messages/Messages';
import MessageRequests from '../pages/messages/MessageRequests';
import Notifications from '../pages/notifications/Notifications';
import Settings from '../pages/settings/Settings';
import AlgorithmPreferencesPage from '../pages/settings/AlgorithmPreferences';
import Create from '../pages/create/Create';
import NewPostPage from '../pages/create/NewPostPage';
import PostEditPage from '../pages/create/PostEditPage';
import PostSharePage from '../pages/create/PostSharePage';
import CreateStory from '../pages/create/CreateStory';
import CreateReel from '../pages/create/CreateReel';
import NewReelPage from '../pages/create/NewReelPage';
import ReelEditPage from '../pages/create/ReelEditPage';
import ReelSharePage from '../pages/create/ReelSharePage';
import ReelMoreOptionsPage from '../pages/create/ReelMoreOptionsPage';
import PartnershipLabelAdsPage from '../pages/create/PartnershipLabelAdsPage';
import AddPartnershipLabelPage from '../pages/create/AddPartnershipLabelPage';
import ReelTagPeoplePage from '../pages/create/ReelTagPeoplePage';
import ReelLocationPage from '../pages/create/ReelLocationPage';
import ReelAudiencePage from '../pages/create/ReelAudiencePage';
import ReelFundraiserPage from '../pages/create/ReelFundraiserPage';
import Reels from '../pages/reels/Reels';
import Live from '../pages/live/Live';
import LiveReplay from '../pages/live/LiveReplay';
import LiveWatch from '../pages/live/LiveWatch';
import CreateStoryPage from '../pages/stories/CreateStory';
import AddStoryPage from '../pages/stories/AddStoryPage';
import CameraPage from '../pages/stories/CameraPage';
import StoryEffectsPage from '../pages/stories/StoryEffectsPage';
import StoryMusicPage from '../pages/stories/StoryMusicPage';
import StorySearchStickersPage from '../pages/stories/StorySearchStickersPage';
import CameraSettings from '../pages/settings/CameraSettings';
import StoryViewer from '../pages/stories/StoryViewer';
import HighlightViewer from '../pages/stories/HighlightViewer';
import ManageHighlights from '../pages/stories/ManageHighlights';
import Map from '../pages/map/Map';
import MapFullScreen from '../pages/map/MapFullScreen';
import NearbyPlacesPage from '../pages/map/NearbyPlacesPage';
import NearbyMessagingPage from '../pages/map/NearbyMessagingPage';
import NearbyMessagingSettingsPage from '../pages/map/NearbyMessagingSettingsPage';
import SOSPage from '../pages/map/SOSPage';
import ManageContactsPage from '../pages/map/ManageContactsPage';
import AddEmergencyContactPage from '../pages/map/AddEmergencyContactPage';
import SafetyCheckinPage from '../pages/map/SafetyCheckinPage';
import SafeConfirmPage from '../pages/map/SafeConfirmPage';
import ProximityAlertsPage from '../pages/map/ProximityAlertsPage';
import Job from '../pages/job/Job';
import Admin from '../pages/admin/Admin';
import Commerce from '../pages/commerce/Commerce';
import Checkout from '../pages/commerce/Checkout';
import MyOrdersPage from '../pages/commerce/MyOrdersPage';
import OrderDetailPage from '../pages/commerce/OrderDetailPage';
import Analytics from '../pages/analytics/Analytics';
import AdsCampaigns from '../pages/ads/AdsCampaigns';
import SwitchAccount from '../pages/settings/SwitchAccount';
import SavedCollections from '../pages/saved/SavedCollections';
import FavoritesFeed from '../pages/feed/FavoritesFeed';
import SharedCollection from '../pages/saved/SharedCollection';
import Archive from '../pages/archive/Archive';
import AccountSettings from '../pages/settings/AccountSettings';
import AccountEmailUsername from '../pages/settings/AccountEmailUsername';
import AccountsCentre from '../pages/settings/AccountsCentre';
import ProfilesAndPersonalDetails from '../pages/settings/ProfilesAndPersonalDetails';
import ProfileDetailsPage from '../pages/settings/ProfileDetailsPage';
import NamePage from '../pages/settings/NamePage';
import EditUsernamePage from '../pages/settings/EditUsernamePage';
import ContactInformationPage from '../pages/settings/ContactInformationPage';
import MobileNumberPage from '../pages/settings/MobileNumberPage';
import DateOfBirthPage from '../pages/settings/DateOfBirthPage';
import PasswordAndSecurityPage from '../pages/settings/PasswordAndSecurityPage';
import ChangePasswordPage1 from '../pages/settings/ChangePasswordPage1';
import ChangePasswordPage2 from '../pages/settings/ChangePasswordPage2';
import TwoFactorAuthSettings from '../pages/settings/TwoFactorAuthSettings';
import SavedLoginSettings from '../pages/settings/SavedLoginSettings';
import WhereLoggedInPage from '../pages/settings/WhereLoggedInPage';
import LoginAlertsSettings from '../pages/settings/LoginAlertsSettings';
import SecurityCheckupPage from '../pages/settings/SecurityCheckupPage';
import ConnectedExperiencesSettings from '../pages/settings/ConnectedExperiencesSettings';
import AdPreferencesSettings from '../pages/settings/AdPreferencesSettings';
import InformationPermissionsSettings from '../pages/settings/InformationPermissionsSettings';
import MoxePaySettings from '../pages/settings/MoxePaySettings';
import VerificationSelfieSettings from '../pages/settings/VerificationSelfieSettings';
import RecentEmailsSettings from '../pages/settings/RecentEmailsSettings';
import HelpCentrePage from '../pages/settings/HelpCentrePage';
import PrivacyTopicsPage from '../pages/settings/PrivacyTopicsPage';
import SensitiveContentSettings from '../pages/settings/SensitiveContentSettings';
import PoliticalContentSettings from '../pages/settings/PoliticalContentSettings';
import NotInterestedSettings from '../pages/settings/NotInterestedSettings';
import HelpPaymentsPage from '../pages/settings/HelpPaymentsPage';
import HelpOrdersPage from '../pages/settings/HelpOrdersPage';
import HelpContactPaymentPage from '../pages/settings/HelpContactPaymentPage';
import HelpTermsPage from '../pages/settings/HelpTermsPage';
import DontTranslateSettings from '../pages/settings/DontTranslateSettings';
import CrosspostingSettings from '../pages/settings/CrosspostingSettings';
import DevicePermissionDetailPage from '../pages/settings/DevicePermissionDetailPage';
import AppsAndWebsitesPage from '../pages/settings/AppsAndWebsitesPage';
import MessageLinksPage from '../pages/settings/MessageLinksPage';
import SpotifyPage from '../pages/settings/SpotifyPage';
import SwitchProfessionalPage from '../pages/settings/SwitchProfessionalPage';
import AccountToolsLivePage from '../pages/settings/AccountToolsLivePage';
import AccountToolsAdsPage from '../pages/settings/AccountToolsAdsPage';
import AccountToolsMonetisationPage from '../pages/settings/AccountToolsMonetisationPage';
import AccountToolsMessagingPage from '../pages/settings/AccountToolsMessagingPage';
import ReviewTagsPage from '../pages/settings/ReviewTagsPage';
import BlockCommentsFromPage from '../pages/settings/BlockCommentsFromPage';
import HideUnwantedCommentsPage from '../pages/settings/HideUnwantedCommentsPage';
import BlockStoryCommentsFromPage from '../pages/settings/BlockStoryCommentsFromPage';
import FollowCreatorsPage from '../pages/settings/FollowCreatorsPage';
import FacebookCreatorsPage from '../pages/settings/FacebookCreatorsPage';
import AudioSettingsPage from '../pages/audio/AudioSettingsPage';
import BrandedContentStatusPage from '../pages/insights/BrandedContentStatusPage';
import RunAdPage from '../pages/ads/RunAdPage';
import BoostPreviewPage from '../pages/boost/BoostPreviewPage';
import CompareTwoPostsPage from '../pages/ads/CompareTwoPostsPage';
import AddTaxInfoPage from '../pages/payouts/AddTaxInfoPage';
import PayoutSettingsPage from '../pages/payouts/PayoutSettingsPage';
import ApproximateEarningsPage from '../pages/insights/ApproximateEarningsPage';
import NewSavedReplyPage from '../pages/messages/NewSavedReplyPage';
import PrivacySettings from '../pages/settings/PrivacySettings';
import AccountPrivacy from '../pages/settings/AccountPrivacy';
import NotificationsSettings from '../pages/settings/NotificationsSettings';
import PostsStoriesCommentsSettings from '../pages/settings/PostsStoriesCommentsSettings';
import FollowingFollowersSettings from '../pages/settings/FollowingFollowersSettings';
import MessagesNotificationsSettings from '../pages/settings/MessagesNotificationsSettings';
import EmailNotificationsSettings from '../pages/settings/EmailNotificationsSettings';
import FromInstagramSettings from '../pages/settings/FromInstagramSettings';
import LiveReelsSettings from '../pages/settings/LiveReelsSettings';
import BirthdaysSettings from '../pages/settings/BirthdaysSettings';
import FundraisersSettings from '../pages/settings/FundraisersSettings';
import FromAccountsYouFollowSettings from '../pages/settings/FromAccountsYouFollowSettings';
import ShoppingSettings from '../pages/settings/ShoppingSettings';
import VotingRemindersSettings from '../pages/settings/VotingRemindersSettings';
import CallsSettings from '../pages/settings/CallsSettings';
import QuietModeSettings from '../pages/settings/QuietModeSettings';
import MapSettings from '../pages/settings/MapSettings';
import StoryLiveLocationSettings from '../pages/settings/StoryLiveLocationSettings';
import MapWhoCanSeeLocation from '../pages/settings/MapWhoCanSeeLocation';
import ActivityInFriendsTabSettings from '../pages/settings/ActivityInFriendsTabSettings';
import MessageAndStoryReplySettings from '../pages/settings/MessageAndStoryReplySettings';
import MessageRequestSettings from '../pages/settings/MessageRequestSettings';
import StoryReplySettings from '../pages/settings/StoryReplySettings';
import ShowActivityStatusSettings from '../pages/settings/ShowActivityStatusSettings';
import ShowReadReceiptSetting from '../pages/settings/ShowReadReceiptSettings';
import NudityProtectionSettings from '../pages/settings/NudityProtectionSettings';
import PreviewsSettings from '../pages/settings/PreviewsSettings';
import TagsAndMentionsSettings from '../pages/settings/TagsAndMentionsSettings';
import CommentsSettingsPage from '../pages/settings/CommentsSettingsPage';
import AllowCommentsFromSettings from '../pages/settings/AllowCommentsFromSettings';
import SharingSettings from '../pages/settings/SharingSettings';
import RestrictedAccountsSettings from '../pages/settings/RestrictedAccountsSettings';
import LimitInteractionSettings from '../pages/settings/LimitInteractionSettings';
import LimitInteractionWhatPage from '../pages/settings/LimitInteractionWhatPage';
import LimitInteractionWhoPage from '../pages/settings/LimitInteractionWhoPage';
import LimitInteractionReminderPage from '../pages/settings/LimitInteractionReminderPage';
import HiddenWordsSettings from '../pages/settings/HiddenWordsSettings';
import FollowingAndInvitationsSettings from '../pages/settings/FollowingAndInvitationsSettings';
import ContactAccessSettings from '../pages/settings/ContactAccessSettings';
import YourActivityDailyLimit from '../pages/settings/YourActivityDailyLimit';
import TimeSpent from '../pages/settings/your-activity/TimeSpent';
import WatchHistory from '../pages/settings/your-activity/WatchHistory';
import AccountHistory from '../pages/settings/your-activity/AccountHistory';
import RecentSearches from '../pages/settings/your-activity/RecentSearches';
import LinkHistory from '../pages/settings/your-activity/LinkHistory';
import LanguageSettings from '../pages/settings/LanguageSettings';
import LanguageTranslationsSettings from '../pages/settings/LanguageTranslationsSettings';
import TranslateToSettings from '../pages/settings/TranslateToSettings';
import DevicePermissionsSettings from '../pages/settings/DevicePermissionsSettings';
import ArchivingDownloadingSettings from '../pages/settings/ArchivingDownloadingSettings';
import DownloadYourDataPage from '../pages/settings/DownloadYourDataPage';
import AccessibilitySettings from '../pages/settings/AccessibilitySettings';
import MediaQualitySettings from '../pages/settings/MediaQualitySettings';
import AppWebsitePermissionsSettings from '../pages/settings/AppWebsitePermissionsSettings';
import TeenAccountSettings from '../pages/settings/TeenAccountSettings';
import AccountTypeAndToolsSettings from '../pages/settings/AccountTypeAndToolsSettings';
import AccountTypeSettings from '../pages/settings/AccountTypeSettings';
import RequestVerificationSettings from '../pages/settings/RequestVerificationSettings';
import ContentPreferencesSettings from '../pages/settings/ContentPreferencesSettings';
import LikeShareCountsSettings from '../pages/settings/LikeShareCountsSettings';
import SubscriptionsSettings from '../pages/settings/SubscriptionsSettings';
import SubscriptionPlansPage from '../pages/settings/SubscriptionPlansPage';
import OrdersAndPaymentsSettings from '../pages/settings/OrdersAndPaymentsSettings';
import SecurityPaymentsSettings from '../pages/settings/SecurityPaymentsSettings';
import AutoDetectionSettings from '../pages/settings/AutoDetectionSettings';
import PrivacyCentrePage from '../pages/settings/PrivacyCentrePage';
import HelpSettings from '../pages/settings/HelpSettings';
import ReportProblem from '../pages/settings/ReportProblem';
import NotFound from '../pages/NotFound';
import AnonymousReport from '../pages/report/AnonymousReport';
import SupportTickets from '../pages/support/SupportTickets';
import SupportTicketDetail from '../pages/support/SupportTicketDetail';
import CreateSupportTicket from '../pages/support/CreateSupportTicket';
import BlockedList from '../pages/blocked/BlockedList';
import RestrictedList from '../pages/restricted/RestrictedList';
import MutedList from '../pages/muted/MutedList';
import CloseFriendsList from '../pages/close-friends/CloseFriendsList';
import CloseFriendsAdd from '../pages/close-friends/CloseFriendsAdd';
import SearchResults from '../pages/search/SearchResults';
import SafetySettings from '../pages/settings/SafetySettings';
import AdvancedSettings from '../pages/settings/AdvancedSettings';
import ScreenshotNotificationsSettings from '../pages/settings/ScreenshotNotificationsSettings';
import StorySettings from '../pages/settings/StorySettings';
import AllowStoryCommentsFrom from '../pages/settings/AllowStoryCommentsFrom';
import HideStoryFrom from '../pages/settings/HideStoryFrom';
import SafetyCenter from '../pages/settings/SafetyCenter';
import HiddenComments from '../pages/settings/HiddenComments';
import EmergencyContacts from '../pages/settings/EmergencyContacts';
import BusinessDashboard from '../pages/dashboard/BusinessDashboard';
import CreatorStudio from '../pages/dashboard/CreatorStudio';
import CreatorSubscriptionTiers from '../pages/dashboard/CreatorSubscriptionTiers';
import JobHub from '../pages/dashboard/JobHub';
import AnonymousSpaces from '../pages/anonymous/AnonymousSpaces';
import Streaks from '../pages/streaks/Streaks';
import FollowRequests from '../pages/follow/FollowRequests';
import Activity from '../pages/activity/Activity';
import RepostsPage from '../pages/activity/RepostsPage';
import TaggedPage from '../pages/activity/TaggedPage';
import StickerResponsesPage from '../pages/activity/StickerResponsesPage';
import ProfileVisitorsPage from '../pages/activity/ProfileVisitorsPage';
import ReviewsPage from '../pages/activity/ReviewsPage';
import RecentlyDeletedPage from '../pages/activity/RecentlyDeletedPage';
import NotInterestedPage from '../pages/activity/NotInterestedPage';
import PostsActivityPage from '../pages/activity/PostsActivityPage';
import ReelsActivityPage from '../pages/activity/ReelsActivityPage';
import HighlightsActivityPage from '../pages/activity/HighlightsActivityPage';
import LikesActivityPage from '../pages/activity/LikesActivityPage';
import CommentsActivityPage from '../pages/activity/CommentsActivityPage';
import TimeManagementPage from '../pages/settings/your-activity/TimeManagementPage';
import SleepModePage from '../pages/settings/your-activity/SleepModePage';
import CommentThread from '../pages/comments/CommentThread';
import PostDetail from '../pages/post/PostDetail';
import HashtagPage from '../pages/hashtag/HashtagPage';
import LocationPage from '../pages/location/LocationPage';
import InsightsHub from '../pages/insights/InsightsHub';
import InsightsContentPage from '../pages/insights/InsightsContentPage';
import InsightsInteractionPage from '../pages/insights/InsightsInteractionPage';
import InsightsFollowersPage from '../pages/insights/InsightsFollowersPage';
import InsightsContentSharedPage from '../pages/insights/InsightsContentSharedPage';
import InsightsMonthlyRecapPage from '../pages/insights/InsightsMonthlyRecapPage';
import InsightsMonthlyRecapDetailPage from '../pages/insights/InsightsMonthlyRecapDetailPage';
import InsightsBestPracticesPage from '../pages/insights/InsightsBestPracticesPage';
import InsightsBestPracticesCategoryPage from '../pages/insights/InsightsBestPracticesCategoryPage';
import InsightsInspirationPage from '../pages/insights/InsightsInspirationPage';
import InsightsBrandedContentPage from '../pages/insights/InsightsBrandedContentPage';
import InsightsMonetisationStatusPage from '../pages/insights/InsightsMonetisationStatusPage';
import InsightsCommunityPaymentsTermsPage from '../pages/insights/InsightsCommunityPaymentsTermsPage';
import PartnershipAdPermissionsPage from '../pages/insights/PartnershipAdPermissionsPage';
import RequestApprovalPage from '../pages/insights/RequestApprovalPage';
import InsightsBestPracticesMonetisationPage from '../pages/insights/InsightsBestPracticesMonetisationPage';
import PartnershipAdsPage from '../pages/ads/PartnershipAdsPage';
import ActiveAdsPage from '../pages/ads/ActiveAdsPage';
import InactiveAdsPage from '../pages/ads/InactiveAdsPage';
import AdToolsPage from '../pages/ads/AdToolsPage';
import PayoutsPage from '../pages/payouts/PayoutsPage';
import SetUpPayoutAccountPage from '../pages/payouts/SetUpPayoutAccountPage';
import GiftsPage from '../pages/payouts/GiftsPage';
import PayoutsPaperlessPage from '../pages/payouts/PayoutsPaperlessPage';
import SavedRepliesPage from '../pages/messages/SavedRepliesPage';
import TrendingAudioPage from '../pages/audio/TrendingAudioPage';
import HelpfulResourcesPage from '../pages/settings/HelpfulResourcesPage';
import MessageFilterSettings from '../pages/messages/MessageFilterSettings';
import BoostGoalPage from '../pages/boost/BoostGoalPage';
import BoostAudiencePage from '../pages/boost/BoostAudiencePage';
import BoostCreateAudiencePage from '../pages/boost/BoostCreateAudiencePage';
import BoostLocationPage from '../pages/boost/BoostLocationPage';
import BoostAddressPage from '../pages/boost/BoostAddressPage';
import BoostAgeGenderPage from '../pages/boost/BoostAgeGenderPage';
import BoostInterestsPage from '../pages/boost/BoostInterestsPage';
import BoostBudgetPage from '../pages/boost/BoostBudgetPage';
import BoostReviewPage from '../pages/boost/BoostReviewPage';
import EditHighlightPage from '../pages/stories/EditHighlightPage';
import LikesPage from '../pages/activity/LikesPage';
import PostDescriptionPage from '../pages/post/PostDescriptionPage';
import CollaboratesListPage from '../pages/post/CollaboratesListPage';
import SharePage from '../pages/share/SharePage';
import MessageSharePage from '../pages/share/MessageSharePage';
import ContentSettingsPage from '../pages/content/ContentSettingsPage';
import FollowingPage from '../pages/profile/FollowingPage';
import LiveMessagePage from '../pages/live/LiveMessagePage';
import NotesPage from '../pages/notes/NotesPage';
import NoteNewPage from '../pages/notes/NoteNewPage';
import NoteLocationPage from '../pages/notes/NoteLocationPage';
import NoteSongPage from '../pages/notes/NoteSongPage';
import NoteShareWithPage from '../pages/notes/NoteShareWithPage';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import MobileHeader from '../components/layout/MobileHeader';
import { MobileShell } from '../components/layout/MobileShell';
import BottomNav from '../components/layout/BottomNav';
import { ThemeProvider } from '../components/ThemeProvider';
import { ThemeRouter } from './theme/ThemeRouter';
import ThemeSettingsPage from '../pages/settings/ThemeSettingsPage';

import { RootState, store } from '../store';
import { initializeSocket } from '../services/socket';
import { setCurrentAccount, setCapabilities } from '../store/accountSlice';
import { fetchMe, logoutThunk } from '../store/authSlice';

const queryClient = new QueryClient();

/** Hide global bottom nav on Job routes so only the Job Atlassian-style bottom nav is visible. */
function ConditionalBottomNav() {
  const location = useLocation();
  if (location.pathname.startsWith('/job')) return null;
  return <BottomNav />;
}

/** Main content area: no bottom padding on Job routes (Job has its own bottom nav). */
function MainWithPadding({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isJob = location.pathname.startsWith('/job');
  return (
    <main className={`flex-1 flex flex-col min-h-0 safe-area-pb ${isJob ? 'pb-0' : 'pb-20'}`}>
      {children}
    </main>
  );
}

/** Renders MobileHeader only on routes that don't have their own header (avoids double header on Home, Messages, Map, Profile). */
function ConditionalAppHeader() {
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const pathname = location.pathname;
  const hasOwnHeader =
    pathname === '/' ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/profile');
  if (!isAuthenticated || hasOwnHeader) return null;
  return <MobileHeader />;
}

function App() {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const { currentAccount } = useSelector((state: RootState) => state.account);

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket(user.id);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    store
      .dispatch(fetchMe())
      .unwrap()
      .then((data) => {
          store.dispatch(setCurrentAccount({ ...data.account, capabilities: data.capabilities }));
          store.dispatch(setCapabilities(data.capabilities ?? null));
      })
      .catch(() => {
        store.dispatch(logoutThunk());
      });
  }, [isAuthenticated, token]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeRouter />
          <MobileShell>
          <ConditionalAppHeader />

          <MainWithPadding>
            <Routes>
              <Route path="/splash" element={<Splash />} />
              <Route path="/report/anonymous" element={<AnonymousReport />} />
              <Route path="/coming-soon" element={<ComingSoonPage />} />
              <Route path="/coming-soon/:feature" element={<ComingSoonPage />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<PhoneVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                <Route path="/hashtag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
                <Route path="/location/:id" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/requests" element={<ProtectedRoute><MessageRequests /></ProtectedRoute>} />
                <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/group/:groupId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                <Route path="/notes/new" element={<ProtectedRoute><NoteNewPage /></ProtectedRoute>} />
                <Route path="/notes/new/location" element={<ProtectedRoute><NoteLocationPage /></ProtectedRoute>} />
                <Route path="/notes/new/song" element={<ProtectedRoute><NoteSongPage /></ProtectedRoute>} />
                <Route path="/notes/new/share" element={<ProtectedRoute><NoteShareWithPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile/:username/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
                <Route path="/profile/:username/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/profile/:username?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/algorithm-preferences" element={<ProtectedRoute><AlgorithmPreferencesPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre" element={<ProtectedRoute><AccountsCentre /></ProtectedRoute>} />
                <Route path="/settings/account-centre/profiles-personal-details" element={<ProtectedRoute><ProfilesAndPersonalDetails /></ProtectedRoute>} />
                <Route path="/settings/account-centre/profile-details" element={<ProtectedRoute><ProfileDetailsPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/name" element={<ProtectedRoute><NamePage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/username" element={<ProtectedRoute><EditUsernamePage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/contact-information" element={<ProtectedRoute><ContactInformationPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/contact-information/mobile" element={<ProtectedRoute><MobileNumberPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/date-of-birth" element={<ProtectedRoute><DateOfBirthPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/password-security" element={<ProtectedRoute><PasswordAndSecurityPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/change-password" element={<ProtectedRoute><ChangePasswordPage1 /></ProtectedRoute>} />
                <Route path="/settings/account-centre/change-password/form" element={<ProtectedRoute><ChangePasswordPage2 /></ProtectedRoute>} />
                <Route path="/settings/account-centre/connected-experiences" element={<ProtectedRoute><ConnectedExperiencesSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/information-permissions" element={<ProtectedRoute><InformationPermissionsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/ad-preferences" element={<ProtectedRoute><AdPreferencesSettings /></ProtectedRoute>} />
                <Route path="/settings/orders-payments" element={<ProtectedRoute><OrdersAndPaymentsSettings /></ProtectedRoute>} />
                <Route path="/settings/orders-payments/auto-detection" element={<ProtectedRoute><AutoDetectionSettings /></ProtectedRoute>} />
                <Route path="/settings/orders-payments/security" element={<ProtectedRoute><SecurityPaymentsSettings /></ProtectedRoute>} />
                <Route path="/settings/orders-payments/meta-pay" element={<ProtectedRoute><MoxePaySettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/meta-pay" element={<ProtectedRoute><OrdersAndPaymentsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/subscriptions" element={<ProtectedRoute><SubscriptionsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/two-factor" element={<ProtectedRoute><TwoFactorAuthSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/verification-selfie" element={<ProtectedRoute><VerificationSelfieSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/saved-login" element={<ProtectedRoute><SavedLoginSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/where-logged-in" element={<ProtectedRoute><WhereLoggedInPage /></ProtectedRoute>} />
                <Route path="/settings/account-centre/login-alerts" element={<ProtectedRoute><LoginAlertsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/recent-emails" element={<ProtectedRoute><RecentEmailsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-centre/security-checkup" element={<ProtectedRoute><SecurityCheckupPage /></ProtectedRoute>} />
                <Route path="/settings/accounts" element={<ProtectedRoute><SwitchAccount /></ProtectedRoute>} />
                <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                <Route path="/settings/account/email-username" element={<ProtectedRoute><AccountEmailUsername /></ProtectedRoute>} />
              <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
                <Route path="/settings/account-privacy" element={<ProtectedRoute><AccountPrivacy /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/quiet-mode" element={<ProtectedRoute><QuietModeSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/posts-stories-comments" element={<ProtectedRoute><PostsStoriesCommentsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/following-followers" element={<ProtectedRoute><FollowingFollowersSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/messages" element={<ProtectedRoute><MessagesNotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/email" element={<ProtectedRoute><EmailNotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/from-instagram" element={<ProtectedRoute><FromInstagramSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/live-reels" element={<ProtectedRoute><LiveReelsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/birthdays" element={<ProtectedRoute><BirthdaysSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/fundraisers" element={<ProtectedRoute><FundraisersSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/from-accounts-you-follow" element={<ProtectedRoute><FromAccountsYouFollowSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/shopping" element={<ProtectedRoute><ShoppingSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/voting-reminders" element={<ProtectedRoute><VotingRemindersSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/calls" element={<ProtectedRoute><CallsSettings /></ProtectedRoute>} />
                <Route path="/settings/map" element={<ProtectedRoute><MapSettings /></ProtectedRoute>} />
                <Route path="/settings/map/who-can-see-location" element={<ProtectedRoute><MapWhoCanSeeLocation /></ProtectedRoute>} />
                <Route path="/settings/story-live-location" element={<ProtectedRoute><StoryLiveLocationSettings /></ProtectedRoute>} />
                <Route path="/settings/your-activity/time" element={<ProtectedRoute><YourActivityDailyLimit /></ProtectedRoute>} />
                <Route path="/settings/your-activity/time-management" element={<ProtectedRoute><TimeManagementPage /></ProtectedRoute>} />
                <Route path="/settings/your-activity/time-spent" element={<ProtectedRoute><TimeSpent /></ProtectedRoute>} />
                <Route path="/settings/your-activity/watch-history" element={<ProtectedRoute><WatchHistory /></ProtectedRoute>} />
                <Route path="/settings/your-activity/account-history" element={<ProtectedRoute><AccountHistory /></ProtectedRoute>} />
                <Route path="/settings/your-activity/recent-searches" element={<ProtectedRoute><RecentSearches /></ProtectedRoute>} />
                <Route path="/settings/your-activity/link-history" element={<ProtectedRoute><LinkHistory /></ProtectedRoute>} />
                <Route path="/settings/language" element={<ProtectedRoute><LanguageTranslationsSettings /></ProtectedRoute>} />
                <Route path="/settings/language/set" element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>} />
                <Route path="/settings/language/translate-to" element={<ProtectedRoute><TranslateToSettings /></ProtectedRoute>} />
                <Route path="/settings/language/dont-translate" element={<ProtectedRoute><DontTranslateSettings /></ProtectedRoute>} />
                <Route path="/settings/help" element={<ProtectedRoute><HelpSettings /></ProtectedRoute>} />
                <Route path="/settings/help/centre" element={<ProtectedRoute><HelpCentrePage /></ProtectedRoute>} />
                <Route path="/settings/help/report" element={<ProtectedRoute><ReportProblem /></ProtectedRoute>} />
                <Route path="/support/tickets" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
                <Route path="/support/tickets/new" element={<ProtectedRoute><CreateSupportTicket /></ProtectedRoute>} />
                <Route path="/support/tickets/:id" element={<ProtectedRoute><SupportTicketDetail /></ProtectedRoute>} />
                <Route path="/settings/help/payments" element={<ProtectedRoute><HelpPaymentsPage /></ProtectedRoute>} />
                <Route path="/settings/help/orders" element={<ProtectedRoute><HelpOrdersPage /></ProtectedRoute>} />
                <Route path="/settings/help/contact-payment" element={<ProtectedRoute><HelpContactPaymentPage /></ProtectedRoute>} />
                <Route path="/settings/help/terms" element={<ProtectedRoute><HelpTermsPage /></ProtectedRoute>} />
                <Route path="/settings/privacy-centre" element={<ProtectedRoute><PrivacyCentrePage /></ProtectedRoute>} />
                <Route path="/settings/privacy-centre/topics" element={<ProtectedRoute><PrivacyTopicsPage /></ProtectedRoute>} />
                <Route path="/blocked" element={<ProtectedRoute><BlockedList /></ProtectedRoute>} />
                <Route path="/restricted" element={<ProtectedRoute><RestrictedList /></ProtectedRoute>} />
                <Route path="/muted" element={<ProtectedRoute><MutedList /></ProtectedRoute>} />
                <Route path="/close-friends/add" element={<ProtectedRoute><CloseFriendsAdd /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
                <Route path="/audio/stub" element={<ProtectedRoute><AudioSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/safety" element={<ProtectedRoute><SafetySettings /></ProtectedRoute>} />
                <Route path="/settings/safety-center" element={<ProtectedRoute><SafetyCenter /></ProtectedRoute>} />
                <Route path="/settings/hidden-comments" element={<ProtectedRoute><HiddenComments /></ProtectedRoute>} />
              <Route path="/settings/emergency-contacts" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />
                <Route path="/settings/advanced" element={<ProtectedRoute><AdvancedSettings /></ProtectedRoute>} />
                <Route path="/settings/screenshot-notifications" element={<ProtectedRoute><ScreenshotNotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/theme" element={<ProtectedRoute><ThemeSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/device-permissions" element={<ProtectedRoute><DevicePermissionsSettings /></ProtectedRoute>} />
                <Route path="/settings/device-permissions/:perm" element={<ProtectedRoute><DevicePermissionDetailPage /></ProtectedRoute>} />
                <Route path="/settings/archiving-downloading" element={<ProtectedRoute><ArchivingDownloadingSettings /></ProtectedRoute>} />
                <Route path="/settings/download-your-data" element={<ProtectedRoute><DownloadYourDataPage /></ProtectedRoute>} />
                <Route path="/settings/accessibility" element={<ProtectedRoute><AccessibilitySettings /></ProtectedRoute>} />
                <Route path="/settings/media-quality" element={<ProtectedRoute><MediaQualitySettings /></ProtectedRoute>} />
                <Route path="/settings/app-website-permissions" element={<ProtectedRoute><AppWebsitePermissionsSettings /></ProtectedRoute>} />
                <Route path="/settings/app-website-permissions/apps" element={<ProtectedRoute><AppsAndWebsitesPage /></ProtectedRoute>} />
                <Route path="/settings/app-website-permissions/message-links" element={<ProtectedRoute><MessageLinksPage /></ProtectedRoute>} />
                <Route path="/settings/app-website-permissions/spotify" element={<ProtectedRoute><SpotifyPage /></ProtectedRoute>} />
                <Route path="/settings/teen-account" element={<ProtectedRoute><TeenAccountSettings /></ProtectedRoute>} />
                <Route path="/settings/account-type-tools" element={<ProtectedRoute><AccountTypeAndToolsSettings /></ProtectedRoute>} />
                <Route path="/settings/account-type" element={<ProtectedRoute><AccountTypeSettings /></ProtectedRoute>} />
                <Route path="/settings/switch-professional" element={<ProtectedRoute><SwitchProfessionalPage /></ProtectedRoute>} />
                <Route path="/settings/account-tools/live" element={<ProtectedRoute><AccountToolsLivePage /></ProtectedRoute>} />
                <Route path="/settings/account-tools/ads" element={<ProtectedRoute><AccountToolsAdsPage /></ProtectedRoute>} />
                <Route path="/settings/account-tools/monetisation" element={<ProtectedRoute><AccountToolsMonetisationPage /></ProtectedRoute>} />
                <Route path="/settings/account-tools/messaging" element={<ProtectedRoute><AccountToolsMessagingPage /></ProtectedRoute>} />
                <Route path="/settings/request-verification" element={<ProtectedRoute><RequestVerificationSettings /></ProtectedRoute>} />
                <Route path="/settings/content-preferences" element={<ProtectedRoute><ContentPreferencesSettings /></ProtectedRoute>} />
                <Route path="/settings/content-preferences/sensitive" element={<ProtectedRoute><SensitiveContentSettings /></ProtectedRoute>} />
                <Route path="/settings/content-preferences/political" element={<ProtectedRoute><PoliticalContentSettings /></ProtectedRoute>} />
                <Route path="/settings/content-preferences/not-interested" element={<ProtectedRoute><NotInterestedSettings /></ProtectedRoute>} />
                <Route path="/settings/like-share-counts" element={<ProtectedRoute><LikeShareCountsSettings /></ProtectedRoute>} />
                <Route path="/settings/subscriptions" element={<ProtectedRoute><SubscriptionsSettings /></ProtectedRoute>} />
                <Route path="/settings/subscriptions/plans" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
                <Route path="/settings/activity-friends-tab" element={<ProtectedRoute><ActivityInFriendsTabSettings /></ProtectedRoute>} />
                <Route path="/settings/messages" element={<ProtectedRoute><MessageAndStoryReplySettings /></ProtectedRoute>} />
                <Route path="/settings/messages/message-requests" element={<ProtectedRoute><MessageRequestSettings /></ProtectedRoute>} />
                <Route path="/settings/messages/story-replies" element={<ProtectedRoute><StoryReplySettings /></ProtectedRoute>} />
                <Route path="/settings/messages/activity-status" element={<ProtectedRoute><ShowActivityStatusSettings /></ProtectedRoute>} />
                <Route path="/settings/messages/read-receipts" element={<ProtectedRoute><ShowReadReceiptSetting /></ProtectedRoute>} />
                <Route path="/settings/messages/nudity-protection" element={<ProtectedRoute><NudityProtectionSettings /></ProtectedRoute>} />
                <Route path="/settings/messages/previews" element={<ProtectedRoute><PreviewsSettings /></ProtectedRoute>} />
                <Route path="/settings/messages/message-filter" element={<ProtectedRoute><MessageFilterSettings /></ProtectedRoute>} />
                <Route path="/settings/tags-mentions" element={<ProtectedRoute><TagsAndMentionsSettings /></ProtectedRoute>} />
                <Route path="/settings/tags/review" element={<ProtectedRoute><ReviewTagsPage /></ProtectedRoute>} />
                <Route path="/settings/comments" element={<ProtectedRoute><CommentsSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/comments/block-from" element={<ProtectedRoute><BlockCommentsFromPage /></ProtectedRoute>} />
                <Route path="/settings/comments/allow-from-posts" element={<ProtectedRoute><AllowCommentsFromSettings /></ProtectedRoute>} />
                <Route path="/settings/comments/allow-from-stories" element={<ProtectedRoute><AllowCommentsFromSettings /></ProtectedRoute>} />
                <Route path="/settings/comments/hide-unwanted" element={<ProtectedRoute><HideUnwantedCommentsPage /></ProtectedRoute>} />
                <Route path="/settings/sharing" element={<ProtectedRoute><SharingSettings /></ProtectedRoute>} />
                <Route path="/settings/restricted" element={<ProtectedRoute><RestrictedAccountsSettings /></ProtectedRoute>} />
                <Route path="/settings/limit-interactions" element={<ProtectedRoute><LimitInteractionSettings /></ProtectedRoute>} />
                <Route path="/settings/limit-interactions/what" element={<ProtectedRoute><LimitInteractionWhatPage /></ProtectedRoute>} />
                <Route path="/settings/limit-interactions/who" element={<ProtectedRoute><LimitInteractionWhoPage /></ProtectedRoute>} />
                <Route path="/settings/limit-interactions/reminder" element={<ProtectedRoute><LimitInteractionReminderPage /></ProtectedRoute>} />
                <Route path="/settings/hidden-words" element={<ProtectedRoute><HiddenWordsSettings /></ProtectedRoute>} />
                <Route path="/settings/following-invitations" element={<ProtectedRoute><FollowingAndInvitationsSettings /></ProtectedRoute>} />
                <Route path="/settings/following-invitations/contacts" element={<ProtectedRoute><ContactAccessSettings /></ProtectedRoute>} />
                <Route path="/settings/following/contacts" element={<ProtectedRoute><ContactAccessSettings /></ProtectedRoute>} />
                <Route path="/settings/story" element={<ProtectedRoute><StorySettings /></ProtectedRoute>} />
                <Route path="/settings/story/allow-comments" element={<ProtectedRoute><AllowStoryCommentsFrom /></ProtectedRoute>} />
                <Route path="/settings/story/block-comments-from" element={<ProtectedRoute><BlockStoryCommentsFromPage /></ProtectedRoute>} />
                <Route path="/settings/story/hide-from" element={<ProtectedRoute><HideStoryFrom /></ProtectedRoute>} />
              <Route path="/settings/crossposting" element={<ProtectedRoute><CrosspostingSettings /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedCollections /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><FavoritesFeed /></ProtectedRoute>} />
                <Route path="/collections/shared/:token" element={<SharedCollection />} />
              <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/activity/likes" element={<ProtectedRoute><LikesActivityPage /></ProtectedRoute>} />
              <Route path="/activity/comments" element={<ProtectedRoute><CommentsActivityPage /></ProtectedRoute>} />
              <Route path="/activity/reposts" element={<ProtectedRoute><RepostsPage /></ProtectedRoute>} />
              <Route path="/activity/tagged" element={<ProtectedRoute><TaggedPage /></ProtectedRoute>} />
              <Route path="/activity/sticker-responses" element={<ProtectedRoute><StickerResponsesPage /></ProtectedRoute>} />
                <Route path="/activity/profile-visitors" element={<ProtectedRoute><ProfileVisitorsPage /></ProtectedRoute>} />
              <Route path="/activity/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
              <Route path="/activity/recently-deleted" element={<ProtectedRoute><RecentlyDeletedPage /></ProtectedRoute>} />
              <Route path="/activity/not-interested" element={<ProtectedRoute><NotInterestedPage /></ProtectedRoute>} />
              <Route path="/activity/posts" element={<ProtectedRoute><PostsActivityPage /></ProtectedRoute>} />
              <Route path="/activity/reels" element={<ProtectedRoute><ReelsActivityPage /></ProtectedRoute>} />
              <Route path="/activity/highlights" element={<ProtectedRoute><HighlightsActivityPage /></ProtectedRoute>} />
                <Route path="/close-friends" element={<ProtectedRoute><CloseFriendsList /></ProtectedRoute>} />

                <Route path="/business-dashboard" element={<ProtectedRoute requiredType="BUSINESS"><BusinessDashboard /></ProtectedRoute>} />
                <Route path="/creator-studio" element={<ProtectedRoute requiredType="CREATOR"><CreatorStudio /></ProtectedRoute>} />
                <Route path="/creator-studio/subscription-tiers" element={<ProtectedRoute requiredType="CREATOR"><CreatorSubscriptionTiers /></ProtectedRoute>} />
                <Route path="/job-hub" element={<ProtectedRoute requiredType="JOB"><JobHub /></ProtectedRoute>} />

                <Route path="/commerce" element={<ProtectedRoute><Commerce /></ProtectedRoute>} />
                <Route path="/commerce/orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                <Route path="/commerce/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><InsightsHub /></ProtectedRoute>} />
                <Route path="/insights/content" element={<ProtectedRoute><InsightsContentPage /></ProtectedRoute>} />
                <Route path="/insights/interaction" element={<ProtectedRoute><InsightsInteractionPage /></ProtectedRoute>} />
                <Route path="/insights/followers" element={<ProtectedRoute><InsightsFollowersPage /></ProtectedRoute>} />
                <Route path="/insights/content-shared" element={<ProtectedRoute><InsightsContentSharedPage /></ProtectedRoute>} />
                <Route path="/insights/monthly-recap" element={<ProtectedRoute><InsightsMonthlyRecapPage /></ProtectedRoute>} />
                <Route path="/insights/monthly-recap/:slug" element={<ProtectedRoute><InsightsMonthlyRecapDetailPage /></ProtectedRoute>} />
                <Route path="/insights/best-practices" element={<ProtectedRoute><InsightsBestPracticesPage /></ProtectedRoute>} />
                <Route path="/insights/best-practices/monetisation" element={<ProtectedRoute><InsightsBestPracticesMonetisationPage /></ProtectedRoute>} />
                <Route path="/insights/best-practices/:slug" element={<ProtectedRoute><InsightsBestPracticesCategoryPage /></ProtectedRoute>} />
                <Route path="/insights/inspiration" element={<ProtectedRoute><InsightsInspirationPage /></ProtectedRoute>} />
                <Route path="/insights/branded-content" element={<ProtectedRoute><InsightsBrandedContentPage /></ProtectedRoute>} />
                <Route path="/insights/branded-content/status" element={<ProtectedRoute><BrandedContentStatusPage /></ProtectedRoute>} />
                <Route path="/insights/branded-content/request-approval" element={<ProtectedRoute><RequestApprovalPage /></ProtectedRoute>} />
                <Route path="/insights/branded-content/approve-creators" element={<ProtectedRoute><PartnershipAdPermissionsPage /></ProtectedRoute>} />
                <Route path="/insights/monetisation-status" element={<ProtectedRoute><InsightsMonetisationStatusPage /></ProtectedRoute>} />
                <Route path="/insights/community-payments-terms" element={<ProtectedRoute><InsightsCommunityPaymentsTermsPage /></ProtectedRoute>} />
                <Route path="/insights/gifts" element={<ProtectedRoute><GiftsPage /></ProtectedRoute>} />
                <Route path="/ads" element={<ProtectedRoute><AdsCampaigns /></ProtectedRoute>} />
                <Route path="/ads/tools" element={<ProtectedRoute><AdToolsPage /></ProtectedRoute>} />
                <Route path="/ads/partnership" element={<ProtectedRoute><PartnershipAdsPage /></ProtectedRoute>} />
                <Route path="/ads/partnership/active" element={<ProtectedRoute><ActiveAdsPage /></ProtectedRoute>} />
                <Route path="/ads/partnership/inactive" element={<ProtectedRoute><InactiveAdsPage /></ProtectedRoute>} />
                <Route path="/ads/partnership/permissions" element={<ProtectedRoute><PartnershipAdPermissionsPage /></ProtectedRoute>} />
                <Route path="/ads/create/standalone" element={<ProtectedRoute><RunAdPage /></ProtectedRoute>} />
                <Route path="/boost" element={<ProtectedRoute><BoostGoalPage /></ProtectedRoute>} />
                <Route path="/boost/goal" element={<ProtectedRoute><BoostGoalPage /></ProtectedRoute>} />
                <Route path="/boost/audience" element={<ProtectedRoute><BoostAudiencePage /></ProtectedRoute>} />
                <Route path="/boost/create-audience" element={<ProtectedRoute><BoostCreateAudiencePage /></ProtectedRoute>} />
                <Route path="/boost/location" element={<ProtectedRoute><BoostLocationPage /></ProtectedRoute>} />
                <Route path="/boost/location/address" element={<ProtectedRoute><BoostAddressPage /></ProtectedRoute>} />
                <Route path="/boost/age-gender" element={<ProtectedRoute><BoostAgeGenderPage /></ProtectedRoute>} />
                <Route path="/boost/interests" element={<ProtectedRoute><BoostInterestsPage /></ProtectedRoute>} />
                <Route path="/boost/budget" element={<ProtectedRoute><BoostBudgetPage /></ProtectedRoute>} />
                <Route path="/boost/review" element={<ProtectedRoute><BoostReviewPage /></ProtectedRoute>} />
                <Route path="/boost/preview" element={<ProtectedRoute><BoostPreviewPage /></ProtectedRoute>} />
                <Route path="/ads/boost/reel" element={<ProtectedRoute><BoostGoalPage /></ProtectedRoute>} />
                <Route path="/ads/boost" element={<ProtectedRoute><BoostGoalPage /></ProtectedRoute>} />
                <Route path="/ads/compare" element={<ProtectedRoute><CompareTwoPostsPage /></ProtectedRoute>} />
                <Route path="/payouts" element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
                <Route path="/payouts/setup" element={<ProtectedRoute><SetUpPayoutAccountPage /></ProtectedRoute>} />
                <Route path="/payouts/setup/tax" element={<ProtectedRoute><AddTaxInfoPage /></ProtectedRoute>} />
                <Route path="/payouts/settings" element={<ProtectedRoute><PayoutSettingsPage /></ProtectedRoute>} />
                <Route path="/payouts/tax/paperless" element={<ProtectedRoute><PayoutsPaperlessPage /></ProtectedRoute>} />
                <Route path="/payouts/gifts/earnings" element={<ProtectedRoute><ApproximateEarningsPage /></ProtectedRoute>} />
                <Route path="/messages/saved-replies" element={<ProtectedRoute><SavedRepliesPage /></ProtectedRoute>} />
                <Route path="/messages/saved-replies/new" element={<ProtectedRoute><NewSavedReplyPage /></ProtectedRoute>} />
                <Route path="/audio/trending" element={<ProtectedRoute><TrendingAudioPage /></ProtectedRoute>} />
                <Route path="/settings/helpful-resources" element={<ProtectedRoute><HelpfulResourcesPage /></ProtectedRoute>} />
                <Route path="/settings/helpful-resources/follow-creators" element={<ProtectedRoute><FollowCreatorsPage /></ProtectedRoute>} />
                <Route path="/settings/helpful-resources/facebook-creators" element={<ProtectedRoute><FacebookCreatorsPage /></ProtectedRoute>} />

                <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
                <Route path="/create/post" element={<ProtectedRoute><NewPostPage /></ProtectedRoute>} />
                <Route path="/create/post/edit" element={<ProtectedRoute><PostEditPage /></ProtectedRoute>} />
                <Route path="/create/post/share" element={<ProtectedRoute><PostSharePage /></ProtectedRoute>} />
                <Route path="/create/post/tag" element={<ProtectedRoute><ReelTagPeoplePage /></ProtectedRoute>} />
                <Route path="/create/post/location" element={<ProtectedRoute><ReelLocationPage /></ProtectedRoute>} />
                <Route path="/create/post/audience" element={<ProtectedRoute><ReelAudiencePage /></ProtectedRoute>} />
                <Route path="/create/post/more" element={<ProtectedRoute><ReelMoreOptionsPage /></ProtectedRoute>} />
                <Route path="/create/post/partnership" element={<ProtectedRoute><PartnershipLabelAdsPage /></ProtectedRoute>} />
                <Route path="/create/post/partnership/add" element={<ProtectedRoute><AddPartnershipLabelPage /></ProtectedRoute>} />
                <Route path="/create/post/music" element={<ProtectedRoute><StoryMusicPage /></ProtectedRoute>} />
                <Route path="/create/post/fundraiser" element={<ProtectedRoute><ReelFundraiserPage /></ProtectedRoute>} />
                <Route path="/create/story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
                <Route path="/stories/create" element={<ProtectedRoute><AddStoryPage /></ProtectedRoute>} />
                <Route path="/stories/create/editor" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
                <Route path="/stories/create/camera" element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
                <Route path="/stories/create/effects" element={<ProtectedRoute><StoryEffectsPage /></ProtectedRoute>} />
                <Route path="/stories/create/music" element={<ProtectedRoute><StoryMusicPage /></ProtectedRoute>} />
                <Route path="/stories/create/search" element={<ProtectedRoute><StorySearchStickersPage /></ProtectedRoute>} />
                <Route path="/settings/camera" element={<ProtectedRoute><CameraSettings /></ProtectedRoute>} />
                <Route path="/stories/:username" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
                <Route path="/comments/:commentId/replies" element={<ProtectedRoute><CommentThread /></ProtectedRoute>} />
                <Route path="/highlights/:highlightId" element={<ProtectedRoute><HighlightViewer /></ProtectedRoute>} />
                <Route path="/highlights/:highlightId/edit" element={<ProtectedRoute><EditHighlightPage /></ProtectedRoute>} />
                <Route path="/highlights/manage" element={<ProtectedRoute><ManageHighlights /></ProtectedRoute>} />
                <Route path="/post/:postId/likes" element={<ProtectedRoute><LikesPage /></ProtectedRoute>} />
                <Route path="/reel/:reelId/likes" element={<ProtectedRoute><LikesPage /></ProtectedRoute>} />
                <Route path="/post/:postId/description" element={<ProtectedRoute><PostDescriptionPage /></ProtectedRoute>} />
                <Route path="/post/:postId/collaborators" element={<ProtectedRoute><CollaboratesListPage /></ProtectedRoute>} />
                <Route path="/reel/:reelId/collaborators" element={<ProtectedRoute><CollaboratesListPage /></ProtectedRoute>} />
                <Route path="/share" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
                <Route path="/share/:contentType" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
                <Route path="/share/:contentType/:id" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
                <Route path="/share/:contentType/:id/message" element={<ProtectedRoute><MessageSharePage /></ProtectedRoute>} />
                <Route path="/post/:postId/settings" element={<ProtectedRoute><ContentSettingsPage /></ProtectedRoute>} />
                <Route path="/reel/:reelId/settings" element={<ProtectedRoute><ContentSettingsPage /></ProtectedRoute>} />
                <Route path="/story/:id/settings" element={<ProtectedRoute><ContentSettingsPage /></ProtectedRoute>} />
                <Route path="/create/reel" element={<ProtectedRoute><NewReelPage /></ProtectedRoute>} />
                <Route path="/create/reel/edit" element={<ProtectedRoute><ReelEditPage /></ProtectedRoute>} />
                <Route path="/create/reel/share" element={<ProtectedRoute><ReelSharePage /></ProtectedRoute>} />
                <Route path="/create/reel/more" element={<ProtectedRoute><ReelMoreOptionsPage /></ProtectedRoute>} />
                <Route path="/create/reel/partnership" element={<ProtectedRoute><PartnershipLabelAdsPage /></ProtectedRoute>} />
                <Route path="/create/reel/partnership/add" element={<ProtectedRoute><AddPartnershipLabelPage /></ProtectedRoute>} />
                <Route path="/create/reel/tag" element={<ProtectedRoute><ReelTagPeoplePage /></ProtectedRoute>} />
                <Route path="/create/reel/location" element={<ProtectedRoute><ReelLocationPage /></ProtectedRoute>} />
                <Route path="/create/reel/audience" element={<ProtectedRoute><ReelAudiencePage /></ProtectedRoute>} />
                <Route path="/create/reel/fundraiser" element={<ProtectedRoute><ReelFundraiserPage /></ProtectedRoute>} />
                <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
                <Route path="/live/replay/:liveId" element={<ProtectedRoute><LiveReplay /></ProtectedRoute>} />
                <Route path="/live/:liveId" element={<ProtectedRoute><LiveWatch /></ProtectedRoute>} />
                <Route path="/live/:liveId/messages" element={<ProtectedRoute><LiveMessagePage /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                <Route path="/map/full" element={<ProtectedRoute><MapFullScreen /></ProtectedRoute>} />
                <Route path="/map/places" element={<ProtectedRoute><NearbyPlacesPage /></ProtectedRoute>} />
                <Route path="/map/nearby-messaging" element={<ProtectedRoute><NearbyMessagingPage /></ProtectedRoute>} />
                <Route path="/map/nearby-messaging/settings" element={<ProtectedRoute><NearbyMessagingSettingsPage /></ProtectedRoute>} />
                <Route path="/map/sos" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />
                <Route path="/map/sos/contacts" element={<ProtectedRoute><ManageContactsPage /></ProtectedRoute>} />
                <Route path="/map/sos/contacts/add" element={<ProtectedRoute><AddEmergencyContactPage /></ProtectedRoute>} />
                <Route path="/map/sos/safe" element={<ProtectedRoute><SafeConfirmPage /></ProtectedRoute>} />
                <Route path="/map/sos/safety-checkin" element={<ProtectedRoute><SafetyCheckinPage /></ProtectedRoute>} />
                <Route path="/map/proximity-alerts" element={<ProtectedRoute><ProximityAlertsPage /></ProtectedRoute>} />
                <Route path="/anonymous" element={<ProtectedRoute><AnonymousSpaces /></ProtectedRoute>} />
                <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
                <Route path="/follow/requests" element={<ProtectedRoute><FollowRequests /></ProtectedRoute>} />

                <Route path="/job/*" element={<ProtectedRoute requiredType="JOB"><Job /></ProtectedRoute>} />
                <Route path="/admin/*" element={<ProtectedRoute requiredRole="ADMIN"><Admin /></ProtectedRoute>} />
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainWithPadding>
          
          {isAuthenticated && currentAccount && <ConditionalBottomNav />}
        </MobileShell>
        
        <Toaster
            position="top-center"
          toastOptions={{
            duration: 4000,
              style: { background: '#262626', color: '#fff' },
          }}
        />
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
