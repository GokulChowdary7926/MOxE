import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Splash from '../pages/auth/Splash';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Onboarding from '../pages/auth/Onboarding';
import PhoneVerification from '../pages/auth/PhoneVerification';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Home from '../pages/home/Home';
import Profile from '../pages/profile/Profile';
import Followers from '../pages/profile/Followers';
import Explore from '../pages/explore/Explore';
import Messages from '../pages/messages/Messages';
import Notifications from '../pages/notifications/Notifications';
import Settings from '../pages/settings/Settings';
import Create from '../pages/create/Create';
import CreatePost from '../pages/create/CreatePost';
import CreateStory from '../pages/create/CreateStory';
import CreateReel from '../pages/create/CreateReel';
import Reels from '../pages/reels/Reels';
import Live from '../pages/live/Live';
import LiveReplay from '../pages/live/LiveReplay';
import LiveWatch from '../pages/live/LiveWatch';
import CreateStoryPage from '../pages/stories/CreateStory';
import StoryViewer from '../pages/stories/StoryViewer';
import HighlightViewer from '../pages/stories/HighlightViewer';
import ManageHighlights from '../pages/stories/ManageHighlights';
import Map from '../pages/map/Map';
import Job from '../pages/job/Job';
import Admin from '../pages/admin/Admin';
import Commerce from '../pages/commerce/Commerce';
import Checkout from '../pages/commerce/Checkout';
import Analytics from '../pages/analytics/Analytics';
import AdsCampaigns from '../pages/ads/AdsCampaigns';
import SwitchAccount from '../pages/settings/SwitchAccount';
import StubSetting from '../pages/settings/StubSetting';
import SavedCollections from '../pages/saved/SavedCollections';
import SharedCollection from '../pages/saved/SharedCollection';
import Archive from '../pages/archive/Archive';
import AccountSettings from '../pages/settings/AccountSettings';
import AccountEmailUsername from '../pages/settings/AccountEmailUsername';
import PrivacySettings from '../pages/settings/PrivacySettings';
import AccountPrivacy from '../pages/settings/AccountPrivacy';
import NotificationsSettings from '../pages/settings/NotificationsSettings';
import PostsStoriesCommentsSettings from '../pages/settings/PostsStoriesCommentsSettings';
import FollowingFollowersSettings from '../pages/settings/FollowingFollowersSettings';
import MessagesNotificationsSettings from '../pages/settings/MessagesNotificationsSettings';
import EmailNotificationsSettings from '../pages/settings/EmailNotificationsSettings';
import FromInstagramSettings from '../pages/settings/FromInstagramSettings';
import LiveReelsSettings from '../pages/settings/LiveReelsSettings';
import YourActivityDailyLimit from '../pages/settings/YourActivityDailyLimit';
import TimeSpent from '../pages/settings/your-activity/TimeSpent';
import WatchHistory from '../pages/settings/your-activity/WatchHistory';
import AccountHistory from '../pages/settings/your-activity/AccountHistory';
import RecentSearches from '../pages/settings/your-activity/RecentSearches';
import LinkHistory from '../pages/settings/your-activity/LinkHistory';
import LanguageSettings from '../pages/settings/LanguageSettings';
import HelpSettings from '../pages/settings/HelpSettings';
import ReportProblem from '../pages/settings/ReportProblem';
import BlockedList from '../pages/blocked/BlockedList';
import RestrictedList from '../pages/restricted/RestrictedList';
import MutedList from '../pages/muted/MutedList';
import CloseFriendsList from '../pages/close-friends/CloseFriendsList';
import CloseFriendsAdd from '../pages/close-friends/CloseFriendsAdd';
import SearchResults from '../pages/search/SearchResults';
import SafetySettings from '../pages/settings/SafetySettings';
import AdvancedSettings from '../pages/settings/AdvancedSettings';
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
import CommentThread from '../pages/comments/CommentThread';
import PostDetail from '../pages/post/PostDetail';
import HashtagPage from '../pages/hashtag/HashtagPage';
import LocationPage from '../pages/location/LocationPage';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import MobileHeader from '../components/layout/MobileHeader';
import { MobileShell } from '../components/layout/MobileShell';
import BottomNav from '../components/layout/BottomNav';

import { RootState, store } from '../store';
import { initializeSocket } from '../services/socket';
import { setCurrentAccount, setCapabilities } from '../store/accountSlice';
import { fetchMe, logoutThunk } from '../store/authSlice';

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <Router>
        <MobileShell>
          {isAuthenticated && <MobileHeader />}

          <main className="flex-1 flex flex-col pb-20 safe-area-pb min-h-0">
            <Routes>
              <Route path="/splash" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<PhoneVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                <Route path="/hashtag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
                <Route path="/location/:id" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/group/:groupId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile/:username/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
                <Route path="/profile/:username?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/accounts" element={<ProtectedRoute><SwitchAccount /></ProtectedRoute>} />
                <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                <Route path="/settings/account/email-username" element={<ProtectedRoute><AccountEmailUsername /></ProtectedRoute>} />
                <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
                <Route path="/settings/account-privacy" element={<ProtectedRoute><AccountPrivacy /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/posts-stories-comments" element={<ProtectedRoute><PostsStoriesCommentsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/following-followers" element={<ProtectedRoute><FollowingFollowersSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/messages" element={<ProtectedRoute><MessagesNotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/email" element={<ProtectedRoute><EmailNotificationsSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/from-instagram" element={<ProtectedRoute><FromInstagramSettings /></ProtectedRoute>} />
                <Route path="/settings/notifications/live-reels" element={<ProtectedRoute><LiveReelsSettings /></ProtectedRoute>} />
                <Route path="/settings/your-activity/time" element={<ProtectedRoute><YourActivityDailyLimit /></ProtectedRoute>} />
                <Route path="/settings/your-activity/time-spent" element={<ProtectedRoute><TimeSpent /></ProtectedRoute>} />
                <Route path="/settings/your-activity/watch-history" element={<ProtectedRoute><WatchHistory /></ProtectedRoute>} />
                <Route path="/settings/your-activity/account-history" element={<ProtectedRoute><AccountHistory /></ProtectedRoute>} />
                <Route path="/settings/your-activity/recent-searches" element={<ProtectedRoute><RecentSearches /></ProtectedRoute>} />
                <Route path="/settings/your-activity/link-history" element={<ProtectedRoute><LinkHistory /></ProtectedRoute>} />
                <Route path="/settings/language" element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>} />
                <Route path="/settings/help" element={<ProtectedRoute><HelpSettings /></ProtectedRoute>} />
                <Route path="/settings/help/report" element={<ProtectedRoute><ReportProblem /></ProtectedRoute>} />
                <Route path="/blocked" element={<ProtectedRoute><BlockedList /></ProtectedRoute>} />
                <Route path="/restricted" element={<ProtectedRoute><RestrictedList /></ProtectedRoute>} />
                <Route path="/muted" element={<ProtectedRoute><MutedList /></ProtectedRoute>} />
                <Route path="/close-friends/add" element={<ProtectedRoute><CloseFriendsAdd /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
                <Route path="/audio/stub" element={<ProtectedRoute><StubSetting title="Audio" /></ProtectedRoute>} />
                <Route path="/settings/safety" element={<ProtectedRoute><SafetySettings /></ProtectedRoute>} />
                <Route path="/settings/safety-center" element={<ProtectedRoute><SafetyCenter /></ProtectedRoute>} />
                <Route path="/settings/hidden-comments" element={<ProtectedRoute><HiddenComments /></ProtectedRoute>} />
                <Route path="/settings/emergency-contacts" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />
                <Route path="/settings/advanced" element={<ProtectedRoute><AdvancedSettings /></ProtectedRoute>} />
                <Route path="/settings/crossposting" element={<ProtectedRoute><StubSetting title="Crossposting" /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedCollections /></ProtectedRoute>} />
                <Route path="/collections/shared/:token" element={<SharedCollection />} />
                <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/time-management" element={<ProtectedRoute><StubSetting title="Time management" /></ProtectedRoute>} />
                <Route path="/close-friends" element={<ProtectedRoute><CloseFriendsList /></ProtectedRoute>} />

                <Route path="/business-dashboard" element={<ProtectedRoute requiredType="BUSINESS"><BusinessDashboard /></ProtectedRoute>} />
                <Route path="/creator-studio" element={<ProtectedRoute requiredType="CREATOR"><CreatorStudio /></ProtectedRoute>} />
                <Route path="/creator-studio/subscription-tiers" element={<ProtectedRoute requiredType="CREATOR"><CreatorSubscriptionTiers /></ProtectedRoute>} />
                <Route path="/job-hub" element={<ProtectedRoute requiredType="JOB"><JobHub /></ProtectedRoute>} />

                <Route path="/commerce" element={<ProtectedRoute requiredType="BUSINESS"><Commerce /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute requiredType="BUSINESS"><Checkout /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/ads" element={<ProtectedRoute><AdsCampaigns /></ProtectedRoute>} />

                <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
                <Route path="/create/post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/create/story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
                <Route path="/stories/create" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
                <Route path="/stories/:username" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
                <Route path="/comments/:commentId/replies" element={<ProtectedRoute><CommentThread /></ProtectedRoute>} />
                <Route path="/highlights/:highlightId" element={<ProtectedRoute><HighlightViewer /></ProtectedRoute>} />
                <Route path="/highlights/manage" element={<ProtectedRoute><ManageHighlights /></ProtectedRoute>} />
                <Route path="/create/reel" element={<ProtectedRoute><CreateReel /></ProtectedRoute>} />
                <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
                <Route path="/live/replay/:liveId" element={<ProtectedRoute><LiveReplay /></ProtectedRoute>} />
                <Route path="/live/:liveId" element={<ProtectedRoute><LiveWatch /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                <Route path="/anonymous" element={<ProtectedRoute><AnonymousSpaces /></ProtectedRoute>} />
                <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
                <Route path="/follow/requests" element={<ProtectedRoute><FollowRequests /></ProtectedRoute>} />

                <Route path="/job/*" element={<ProtectedRoute requiredType="JOB"><Job /></ProtectedRoute>} />
                <Route path="/admin/*" element={<ProtectedRoute requiredRole="ADMIN"><Admin /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {isAuthenticated && currentAccount && <BottomNav />}
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
  );
}

export default App;
