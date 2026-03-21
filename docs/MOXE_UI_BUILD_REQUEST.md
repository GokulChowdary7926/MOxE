# MOxE — Complete UI Build Request by Account Type

This document is a **UI build request** listing every **component**, **sub-component**, **function**, **sub-function**, **feature**, and **sub-feature** for the MOxE platform, organized by **common (all accounts)** and by **account type**: **Personal**, **Business**, **Creator**. Job account is listed separately as a fourth account type with its own tools.

Use this as the single source of truth for implementing or auditing the MOxE user interface (web and/or mobile).

---

## Design System (Applies to All)

| Item | Type | Description |
|------|------|-------------|
| ThemeContext | Component | Provides `instagram` (dark) and `atlassian` (light) themes; `useTheme()` hook. |
| Theme tokens | Sub-component | Colors (background, surface, primary, text, border, success, danger, warning), spacing scale, radius, typography sizes. |
| ThemedView | Component | Container that uses theme background. |
| ThemedText | Component | Text that uses theme color and typography. |
| ThemedSurface | Component | Card-like surface with theme border and radius. |
| ThemedButton | Component | Primary, secondary, danger variants; accepts label, onPress, style. |
| ThemedInput | Component | Text input with theme placeholder and border. |
| ThemedHeader | Component | App/screen header with title, optional left (back), right (actions). |
| ThemedTabBar | Component | Bottom tab bar (MOxE-style) or top tabs; theme-aware. |
| Avatar | Component | Circular image; optional size, story ring, online indicator. |
| Badge | Component | Status/priority label (neutral, success, danger, warning). |
| SkeletonLoader | Component | Loading placeholder with theme height/style. |
| Modal | Component | Overlay with title, body, close; focus trap and accessibility. |
| setTheme(mode) | Function | Switches theme (instagram | atlassian). |
| toggleTheme() | Sub-function | Toggles between the two themes. |

---

# Part 1 — Common Features (All Account Types)

These features and their UI exist for **every** MOxE account (Personal, Business, Creator, Job). Build them once and reuse; visibility may depend on account type or tier.

---

## 1.1 Onboarding & Account Setup

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Splash / Launch** | Logo and loading | SplashScreen | Logo, progress indicator | loadApp() | checkAuth(), loadConfig() |
| **Phone entry** | Phone number input | PhoneEntryScreen | CountryPicker, PhoneInput, SubmitButton | submitPhone() | validatePhone(), sendVerificationCode() |
| **OTP verification** | Code input | OTPScreen | DigitInput (6), ResendButton, Timer | verifyCode() | validateCode(), resendCode() |
| **Email addition** | Optional email | EmailAdditionScreen | EmailInput, SkipButton, SubmitButton | addEmail() | validateEmail(), sendVerificationEmail() |
| **Username selection** | Unique username | UsernameSelectionScreen | UsernameInput, AvailabilityCheck, Suggestions | setUsername() | checkAvailability(), validateFormat() |
| **Display name** | Full name | DisplayNameSetupScreen | TextInput, SubmitButton | setDisplayName() | validateLength() |
| **Date of birth** | DOB picker | DOBEntryScreen | DatePicker, SubmitButton | setDOB() | validateAge(), setMinorsPrivacy() |
| **Profile photo** | Upload/camera/crop | ProfilePhotoUploadScreen | ImagePicker, CameraButton, CropOverlay, Filters | uploadPhoto() | pickImage(), capturePhoto(), crop(), applyFilter() |
| **Bio** | Short bio | BioCreationScreen | TextArea (char count), SubmitButton | setBio() | validateLength(150) |
| **Link in bio** | Single/multiple links | LinkInBioScreen | UrlInput, AddLinkButton, ReorderList | setLinks() | validateUrl(), addLink(), removeLink(), reorder() |
| **Pronouns** | Optional pronouns | PronounsScreen | PronounPicker, CustomInput | setPronouns() | selectPreset(), setCustom() |
| **Account type selection** | Choose account | AccountTypeSelectionScreen | Card(Personal), Card(Business), Card(Creator), Card(Job) | selectAccountType() | setAccountType(), persistChoice() |

---

## 1.2 Authentication

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Login** | Password login | LoginScreen | EmailOrPhoneInput, PasswordInput, ForgotLink, SubmitButton | login() | validateInput(), requestToken(), persistToken() |
| **Forgot password** | Reset flow | ForgotPasswordScreen | EmailInput, SendCodeButton, OTPScreen, NewPasswordScreen | resetPassword() | sendResetCode(), verifyCode(), setNewPassword() |
| **Logout** | Sign out | (in Settings/Profile) | LogoutButton | logout() | clearToken(), clearStorage(), redirectToLogin() |

---

## 1.3 Home Feed (Social)

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Feed container** | Scrollable feed | HomeFeedScreen | StoryTray, FeedList, PullToRefresh | loadFeed() | fetchPosts(), prependStories() |
| **Story tray** | Horizontal stories | StoryTray | StoryCircle (Your story + list) | openStory() | loadStories(), markViewed() |
| **Story circle** | Avatar + ring + label | StoryCircle | Avatar (gradient ring), UsernameText | onPress() | navigateToStoryViewer() |
| **Feed list** | Vertical posts | FeedList | FeedPost[], SkeletonLoader, EmptyState | renderPost() | paginate(), refresh() |
| **Feed post** | Single post | FeedPost | PostHeader, PostMedia, PostActions, Caption, CommentsPreview | like(), comment(), share(), save() | toggleLike(), openComments(), openShareSheet(), toggleSave() |
| **Post header** | Author row | PostHeader | Avatar, Username, Location, MoreButton | openProfile(), openMenu() | navigateToUser(), showOptions() |
| **Post media** | Image/video/carousel | PostMedia | ImageSlider, VideoPlayer, CarouselDots | onDoubleTapLike(), onSwipe() | triggerLike(), nextSlide() |
| **Post actions** | Like, comment, share, save | PostActions | LikeButton, CommentButton, ShareButton, SaveButton | (see Feed post) | (see Feed post) |
| **Caption** | Text + hashtags | Caption | TextWithMentions, ExpandButton | expandCaption(), openHashtag() | setExpanded(), navigateToTag() |
| **Comments preview** | First N comments | CommentsPreview | CommentItem[], ViewAllCommentsLink | openComments() | loadComments(), navigateToPostDetail() |

---

## 1.4 Story Viewer

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Full-screen story** | Story playback | StoryViewerScreen | ProgressBars, MediaView, StickerOverlays, NavHint | playStory(), next(), previous() | loadStory(), advanceSegment(), tapLeft(), tapRight() |
| **Progress bars** | Segment progress | ProgressBars | Bar (per segment), Timer | updateProgress() | startTimer(), pauseOnTap() |
| **Sticker overlays** | Poll, Q&A, etc. | StickerOverlays | PollSticker, QuestionSticker, EmojiSlider, Countdown, AddYours, Music, GIF, Link, Donation | vote(), submitAnswer(), etc. | sendVote(), sendReply(), submitCountdown() |
| **Swipe down** | Close | (gesture) | — | close() | dismissModal() |

---

## 1.5 Explore / Search

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Explore home** | Search + discovery | ExploreScreen | SearchBar, TopicChips, DiscoverGrid | loadExplore() | search(), loadTrending(), loadGrid() |
| **Search bar** | Global search | SearchBar | Input, ClearButton, VoiceButton | search() | debounce(), submitQuery(), clear() |
| **Topic chips** | Trending topics | TopicChips | Chip (hashtag), HorizontalScroll | selectChip() | filterByTopic(), loadTopics() |
| **Discover grid** | Grid of posts | DiscoverGrid | GridItem (image), SkeletonLoader | openPost() | loadGridItems(), navigateToPost() |

---

## 1.6 Notifications

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Notification list** | All activity | NotificationsScreen | Tabs (All, Likes, Comments, Follows, Mentions), NotificationList, MarkAllReadButton | loadNotifications(), markAllRead() | fetchByType(), markRead(), markAllRead() |
| **Notification item** | Single row | NotificationItem | Avatar, Icon, Text, Timestamp, Link | onPress() | markRead(), navigateToTarget() |
| **Tabs** | Filter by type | Tabs | Tab (All, Likes, …) | setActiveTab() | filterList() |

---

## 1.7 Direct Messages

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Inbox** | Thread list | MessagesScreen | SearchBar, RequestFolderLink, PinnedSection, ThreadList, NewMessageButton | loadThreads(), openThread() | fetchThreads(), sortPinned(), navigateToThread() |
| **Thread list item** | One conversation | ThreadListItem | Avatar, Name, LastMessagePreview, Timestamp, UnreadBadge | onPress() | navigateToThread() |
| **Message thread** | Chat view | MessageThreadScreen | Header (name, info), MessageList, InputBar (text, emoji, GIF, voice, gallery) | sendMessage(), loadMessages() | sendText(), sendVoice(), sendMedia(), sendGif(), loadMore() |
| **Message bubble** | Single message | MessageBubble | Bubble (sent/received), Timestamp, Reactions, ReplyPreview | react(), delete(), reply() | addReaction(), deleteMessage(), quoteReply() |
| **Input bar** | Compose | InputBar | TextInput, EmojiButton, GifButton, VoiceButton, GalleryButton, SendButton | (see Message thread) | (see Message thread) |
| **Message requests** | Requests folder | MessageRequestsScreen | RequestListItem (accept/decline) | acceptRequest(), declineRequest() | approve(), reject() |
| **Group chat** | Create / view group | CreateGroupScreen, GroupThreadScreen | MemberPicker, GroupNameInput, GroupAvatar; same as thread + group info | createGroup(), addMembers() | validateMembers(), setGroupName(), uploadAvatar() |
| **Pinned chats** | Pinned list | (subsection in Inbox) | PinButton, UnpinButton | togglePin() | pin(), unpin() |

---

## 1.8 Create Post

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Create post flow** | Multi-step | CreatePostScreen | StepGallery, StepEdit, StepCaption, StepLocation, StepTags, StepAdvanced | nextStep(), submitPost() | validateStep(), uploadMedia(), createPost() |
| **Gallery step** | Select media | StepGallery | GalleryGrid, MultiSelect, ReorderStrip, CameraButton | selectMedia(), reorder() | pickMultiple(), openCamera(), reorderItems() |
| **Edit step** | Filters/crop | StepEdit | FilterStrip, CropTool, RotateTool, AdjustSliders | applyFilter(), crop(), rotate() | selectFilter(), setCrop(), setRotation() |
| **Caption step** | Caption + hashtags | StepCaption | TextArea, HashtagSuggestions, LocationTag, TagPeopleButton | setCaption(), addHashtag(), tagPeople() | validateLength(), suggestHashtags(), openPeoplePicker() |
| **Location step** | Add location | StepLocation | LocationSearch, MapPreview, SelectButton | setLocation() | searchPlace(), selectPlace() |
| **Advanced settings** | Hide likes, etc. | StepAdvanced | Toggle(hideLikes), Toggle(disableComments), AudienceSelector, ScreenshotProtectionToggle | setAdvanced() | toggleHideLikes(), toggleComments(), setAudience(), toggleScreenshotProtection() |
| **Submit** | Publish | (footer) | ShareButton, ScheduleButton | shareNow(), schedule() | createPost(), schedulePost() |

---

## 1.9 Create Story

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Create story flow** | Camera / upload | CreateStoryScreen | CameraView, ModeSelector (photo, video, boomerang, layout, hands-free, live), GalleryPicker | capture(), upload() | takePhoto(), recordVideo(), pickFromGallery() |
| **Editing tools** | Text, draw, stickers | StoryEditOverlay | TextTool, DrawTool, StickerPicker, Filters | addText(), draw(), addSticker(), applyFilter() | setTextStyle(), setBrush(), browseStickers() |
| **Audience** | Who can see | AudienceSelector | CloseFriendsOnly, HideFromList, ReplyControls | setAudience() | setCloseFriendsOnly(), setHideFrom(), setReplies() |
| **Post story** | Publish | PostStoryButton | — | postStory() | uploadStory(), navigateBack() |

---

## 1.10 Profile (Unified)

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Profile view** | Public profile | ProfileScreen | ProfileHeader, StatsRow, Bio, Link, HighlightsStrip, PostGrid, Tabs (Posts, Reels, Tagged) | loadProfile(), openPost() | fetchProfile(), fetchPosts(), navigateToPost() |
| **Profile header** | Avatar, name, badge | ProfileHeader | Avatar, DisplayName, Username, AccountTypeBadge, VerifiedBadge, EditProfileButton, SettingsButton | openEdit(), openSettings() | navigateToEdit(), navigateToSettings() |
| **Stats row** | Posts, followers, following | StatsRow | StatItem (count, label) | openFollowers(), openFollowing() | navigateToFollowers(), navigateToFollowing() |
| **Highlights** | Story highlights | HighlightsStrip | HighlightCircle (cover, title) | openHighlight() | loadHighlights(), navigateToHighlightViewer() |
| **Post grid** | Posts / reels / tagged | PostGrid | GridItem (thumbnail) | openPost() | loadGrid(), navigateToPostDetail() |
| **Edit profile** | Edit all fields | EditProfileScreen | PhotoEditor, DisplayNameInput, UsernameInput, BioInput, LinkEditor, PronounsPicker, SubmitButton | saveProfile() | uploadPhoto(), validateUsername(), PATCH account |

---

## 1.11 Settings (Common)

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Settings home** | Menu sections | SettingsScreen | SearchBar, Section(Account), Section(Privacy), Section(Notifications), Section(Content), Section(Help), Section(About) | openSection() | navigateToSubScreen() |
| **Account settings** | Email, phone, password | AccountSettingsScreen | EmailRow, PhoneRow, PasswordRow, DeactivateButton | updateEmail(), updatePhone(), changePassword(), deactivate() | sendVerification(), verifyCode(), setNewPassword(), confirmDeactivate() |
| **Privacy settings** | Privacy toggles | PrivacySettingsScreen | AccountPrivacyToggle, FollowRequestToggle, RemoveFollowerLink, SearchVisibility, ActivityStatus, StoryPrivacySection, BlockedLink, RestrictedLink, MutedLink, HiddenWordsLink | setPrivacy() | togglePrivate(), toggleFollowRequest(), setSearchVisibility(), setActivityStatus(), setStoryPrivacy() |
| **Story privacy** | Sub-screen | StoryPrivacyScreen | HideFromList, ReplyControls, ReshareToggle, ArchiveToggle | setStoryPrivacy() | setHideFrom(), setReplies(), setReshare(), setArchive() |
| **Blocked / Muted / Restricted** | Lists | BlockedAccountsScreen, MutedAccountsScreen, RestrictedAccountsScreen | UserList (avatar, name, Unblock/Unmute/Unrestrict) | unblock(), unmute(), unrestrict() | removeBlock(), removeMute(), removeRestrict() |
| **Hidden words** | Filter words | HiddenWordsScreen | WordList, AddWordInput, Toggle(comments), Toggle(DM requests), ReviewHiddenLink | addWord(), removeWord(), toggleFilter(), openReview() | validateWord(), saveList(), loadHiddenContent() |
| **Notification settings** | Per-type toggles | NotificationSettingsScreen | Toggle (likes, comments, follows, mentions, DMs, etc.), QuietModeSection | setNotificationPref() | toggleType(), setQuietModeSchedule() |
| **Quiet mode** | Schedule | QuietModeScreen | Toggle, StartTime, EndTime, DaysSelector | setQuietMode() | setEnabled(), setStart(), setEnd(), setDays() |
| **Saved & collections** | Saved posts | SavedScreen | CollectionsList, CollectionDetail (grid of saved posts), CreateCollectionButton | openCollection(), createCollection() | loadCollections(), loadSaved(), createCollection(), addToCollection() |
| **Archive** | Archived posts | ArchiveScreen | ArchiveList (posts/stories), RestoreButton | openArchive(), restore() | loadArchive(), restorePost() |
| **Followers / Following** | Lists | FollowersScreen, FollowingScreen | SearchBar, UserList (avatar, name, Follow/Remove/Requested) | follow(), unfollow(), removeFollower() | sendFollow(), sendUnfollow(), removeFollower() |

---

## 1.12 Platform-Wide (Common)

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Nearby messaging** | Map / list nearby | NearbyMessagingScreen | MapView, RadiusSlider, UserList, SendMessageButton | loadNearby(), sendMessage() | getLocation(), queryNearby(), openThread() |
| **SOS safety** | Emergency | SOSSafetyScreen | EmergencyContactsList, AddContactButton, ActivateSOSButton, CountdownOverlay | addContact(), triggerSOS() | saveContact(), startCountdown(), sendAlert() |
| **Proximity alert** | Alert when contact nearby | ProximityAlertsScreen | AlertList (contact, radius), AddAlertButton, Toggle(enable) | addAlert(), removeAlert(), toggle() | setContact(), setRadius(), save(), delete() |
| **Anonymous spaces** | Anonymous discussions | AnonymousSpacesScreen | SpaceList, CreateSpaceButton, SpaceDetail (anonymous posts, vote, report) | joinSpace(), createSpace(), post(), vote() | loadSpaces(), createSpace(), submitPost(), submitVote() |
| **Lifestyle streaks** | Check-in streaks | LifestyleStreaksScreen | ActivitySelector, CheckInButton, StreakView (calendar, badge), ShareToStoryButton | checkIn(), loadStreaks(), share() | submitCheckIn(), loadStreakData(), shareToStory() |
| **One-time view media** | View once in DM | OneTimeViewMediaViewer | MediaDisplay, ExpiredState | view() | markViewed(), expireContent() |
| **Switch account** | Multi-account | SwitchAccountScreen | AccountCard (Personal/Business/Creator/Job), AddAccountButton | switchAccount(), addAccount() | setActiveAccount(), navigateToAddAccount() |

---

# Part 2 — Personal Account

Features and UI specific to or emphasized for **Personal** accounts. Many are available to other accounts as well (e.g. Star tier); the build request is the same.

---

## 2.1 Personal-Only Features (Including Star Tier)

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Star subscription** | Upgrade / manage | StarSubscriptionScreen | TierCard (benefits), UpgradeButton, ManageSubscriptionLink, BillingHistory | upgrade(), manageBilling() | selectTier(), openBillingPortal(), loadHistory() |
| **Profile visitors** | Who viewed profile | ProfileVisitorsScreen | VisitorList (avatar, name, timestamp), HideVisitorsToggle | loadVisitors(), hideVisitors() | fetchProfileViews(), toggleHide() |
| **Anonymous story viewer** | Watch without appearing | AnonymousStoryViewerScreen | StoryViewer (same as 1.4), DailyLimitBadge, WatchButton | watchAnonymously() | checkLimit(), decrementLimit(), playStory() |
| **Download protection** | Per-post toggle | (in Post detail / Create) | DownloadProtectionToggle, ScreenshotNotifyToggle | setProtection() | toggleDownload(), toggleScreenshotNotify() |
| **Voice commands** | Hands-free | VoiceCommandsOverlay | MicButton, CommandHintList, ListeningIndicator | startListening(), executeCommand() | listen(), parseIntent(), navigateByVoice() |
| **Priority support** | Support tickets | PrioritySupportScreen | TicketList, CreateTicketButton, TicketDetail (messages, priority badge) | createTicket(), reply() | submitTicket(), loadThread(), sendReply() |
| **Message blocked user** | Limited message | MessageBlockedUserScreen | ComposeForm (limit notice), SendButton, CharCount | sendLimitedMessage() | validateLength(150), submitMessage() |
| **Close friends** | List + add | CloseFriendsScreen, CloseFriendsAddScreen | FriendList (add/remove), SearchToAdd | addCloseFriend(), removeCloseFriend() | toggleCloseFriend(), searchUsers() |
| **Favorites** | Favorite accounts | (in Profile / Follow) | FavoriteButton, FavoritesFeedLink | addToFavorites(), removeFromFavorites() | setFavorite(), loadFavoritesFeed() |

---

# Part 3 — Business Account

Features and UI for **Business** accounts (commerce, analytics, promotions, team, verification).

---

## 3.1 Business Setup & Verification

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Business profile setup** | Category, contact | BusinessProfileSetupScreen | CategoryPicker, ContactEmail, ContactPhone, Address, HoursEditor, ActionButtonsEditor, LinksEditor | saveBusinessProfile() | setCategory(), setContact(), setHours(), setActions(), setLinks() |
| **Business verification** | Documents + status | BusinessVerificationScreen | DocumentUpload (PAN, GSTIN, bank, business proof), StatusBadge, ResubmitButton | uploadDocument(), checkStatus() | uploadFile(), submitVerification(), refreshStatus() |
| **Blue badge** | Verified badge | (in ProfileHeader, PostCard) | VerifiedBadge (blue) | — | display when verified |

---

## 3.2 Customer Reviews & Analytics

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Customer reviews** | List + reply | CustomerReviewsScreen | ReviewList (rating, text, photo, reply), ReplyModal, FilterByRating | loadReviews(), replyToReview(), reportReview() | fetchReviews(), submitReply(), report() |
| **Business analytics** | Overview dashboard | BusinessAnalyticsScreen | OverviewCards (reach, profile visits, website clicks, button taps), ContentPerformanceSection, AudienceDemographicsSection, ExportButton | loadAnalytics(), exportData() | fetchInsights(), fetchDemographics(), exportCSV() |

---

## 3.3 Promotions & Ads

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Promotions & ads** | Campaigns | PromotionsScreen | ActiveCampaignsList, CreateCampaignButton, BoostPostButton (from any post) | createCampaign(), boostPost() | openWizard(), selectPost(), setAudience(), setBudget() |
| **Campaign wizard** | Create campaign | CampaignWizardScreen | StepObjective, StepAudience, StepBudget, StepCreative, ReviewStep | nextStep(), submitCampaign() | setObjective(), setAudience(), setBudget(), uploadCreative(), launch() |

---

## 3.4 MOxE Shop & Commerce

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Shop setup** | Enable shop, layout | MoxeShopSetupScreen | EnableShopToggle, CollectionsEditor, BannerUpload, FeaturedProductsPicker, CustomDomainInput | saveShopSetup() | setEnabled(), createCollection(), uploadBanner(), setFeatured(), setDomain() |
| **Product tagging** | Tag in post/story | (in CreatePost / CreateStory) | ProductTagPicker (from catalog, max 5), TagPositionOverlay | addProductTag(), removeTag() | loadCatalog(), placeTag(), saveTags() |
| **Order management** | Orders list + detail | OrderManagementScreen | OrderList (status, buyer, date), OrderDetail (items, status, tracking, contact buyer), BulkActions, StatusUpdateDropdown | loadOrders(), updateStatus(), addTracking() | fetchOrders(), setStatus(), setTrackingNumber(), contactBuyer() |
| **Returns management** | Return requests | ReturnsManagementScreen | ReturnRequestList (approve/deny), ApproveFlow (prepaid label, track return) | approveReturn(), denyReturn(), generateLabel() | approve(), deny(), createLabel(), trackReturn() |
| **Seller dashboard** | Sales overview | SellerDashboardScreen | SalesOverview, OrderStats, TopProducts, SellerRating, FulfillmentRate, ResponseTime, ReturnRate | loadDashboard() | fetchSales(), fetchOrders(), fetchProducts(), fetchMetrics() |
| **Payouts & settlements** | History + breakdown | PayoutsScreen | SettlementHistoryList, CycleBreakdown, CommissionDetails, ExportButton | loadPayouts(), export() | fetchSettlements(), fetchBreakdown(), exportCSV() |
| **Seller help center** | Guides + support | SellerHelpCenterScreen | GuideList, FAQAccordion, CommunityLink, SupportTicketButton | openGuide(), openTicket() | loadGuides(), loadFAQ(), navigateToForum(), createTicket() |
| **Live shopping** | Schedule + go live | LiveShoppingScreen | ScheduleEventForm, ProductTray (add, pin, discount), GoLiveButton, LiveView (comments, product tray, end stream) | scheduleLive(), goLive(), endStream() | createEvent(), addProducts(), startStream(), endStream(), saveReplay() |

---

## 3.5 Business Inbox & Team

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Business inbox** | Labels, quick replies | (in Messages) | LabelFilters (Brands, Fans, etc.), QuickReplyTemplates, AssignLabelButton | filterByLabel(), sendQuickReply(), assignLabel() | setLabel(), insertTemplate(), addLabelToThread() |
| **Team** | Members | TeamScreen | MemberList (avatar, name, role), InviteButton, RoleDropdown | inviteMember(), changeRole(), removeMember() | sendInvite(), updateRole(), removeMember() |

---

# Part 4 — Creator Account

Features and UI for **Creator** accounts (subscriptions, live badges, gifts, content tools, collaboration, inbox).

---

## 4.1 Creator Setup & Monetization

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Creator dashboard** | Overview | CreatorDashboardScreen | EarningsCard, FollowersCard, TopContentCard, QuickActions (subscriber post, schedule, insights) | loadDashboard() | fetchEarnings(), fetchFollowers(), fetchTopContent() |
| **Subscriptions management** | Tiers + subscribers | SubscriptionsManagementScreen | TierEditor (price, perks, welcome message), SubscriberList (tier, since), BroadcastButton, ExportButton | setTiers(), loadSubscribers(), broadcast() | saveTiers(), fetchSubscribers(), sendBroadcast(), exportList() |
| **Subscriber-only content** | Gate content | (in CreatePost / CreateStory) | AudienceSelector (Subscribers only), TierSelector (which tiers) | setSubscriberOnly() | setAudience(), setTierKeys() |
| **Live badges** | Badge tiers | LiveBadgesConfigScreen | BadgeTierEditor (name, price, perks), AnalyticsLink (earnings, top supporters) | saveBadges(), viewAnalytics() | saveTiers(), fetchBadgeAnalytics() |
| **Gifts management** | Enable + analytics | GiftsManagementScreen | EnableGiftsToggle, GiftRevenueCard, TopGiversList | toggleGifts(), loadAnalytics() | setEnabled(), fetchGiftAnalytics() |
| **Bonuses program** | Invite-only | BonusesProgramScreen | MonthlyTargetCard, ProgressBar, ProjectedBonus | loadBonuses() | fetchBonusStatus() |
| **Branded content** | Tag brand, disclosure | BrandedContentSetupScreen | EnableToggle, BrandTagPicker, DisclosureOptions, PastCampaignsList | enableBrandedContent(), tagBrand() | setEnabled(), selectBrand(), setDisclosure(), loadCampaigns() |

---

## 4.2 Creator Insights & Content Tools

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Creator insights** | Detailed analytics | CreatorInsightsScreen | FollowerGrowthChart, ContentPerformanceTable, AudienceDemographics, BestPostingTimes | loadInsights() | fetchGrowth(), fetchContent(), fetchDemographics(), fetchBestTimes() |
| **Content calendar** | Schedule view | ContentCalendarScreen | MonthView, ScheduledItem (post/story/reel), DragToReschedule, CreateScheduledButton | loadCalendar(), reschedule(), createScheduled() | fetchCalendar(), updateScheduledTime(), openCreateScheduled() |
| **Trending audio** | Library | TrendingAudioScreen | AudioList (preview, usage count), SaveButton, SearchBar | loadTrending(), saveAudio() | fetchTrending(), saveToLibrary() |
| **Content ideas generator** | AI suggestions | ContentIdeasScreen | NicheInput, IdeasList (topic, format), RegenerateButton | getIdeas() | fetchIdeas(), regenerate() |
| **Schedule posts/stories/reels** | Batch schedule | ScheduleContentScreen | ContentPicker, DateTimePicker, ScheduleList, PublishNowButton | schedule(), publishNow() | addToSchedule(), setPublishTime(), submitSchedule() |

---

## 4.3 Collaboration & Inbox

| Feature | Sub-Feature | Component | Sub-Component | Function | Sub-Function |
|---------|-------------|-----------|---------------|----------|--------------|
| **Collaboration tools** | Collab post, network | CollaborationScreen | CollabPostInviteButton, CreatorNetworkList, BrandMarketplaceLink | inviteCollab(), openNetwork(), openMarketplace() | sendInvite(), loadNetwork(), loadCampaigns() |
| **Creator inbox** | Categorized DMs | CreatorInboxScreen | Tabs (Brands, Fans, Collaborators), ThreadList, QuickRepliesButton, AutoResponseRulesLink, LabelsLink | (same as 1.7 + labels/quick replies) | filterByLabel(), openQuickReplies(), openAutoResponses() |
| **Quick replies** | Templates | QuickRepliesScreen | TemplateList (shortcut, text), AddButton, EditButton | addTemplate(), editTemplate(), deleteTemplate() | saveTemplate(), updateTemplate(), deleteTemplate() |
| **Auto-response rules** | Rules | AutoResponseRulesScreen | RuleList (type: keyword, first message, after hours, vacation), AddRuleButton | addRule(), editRule(), toggleRule() | saveRule(), updateRule(), setEnabled() |
| **Advanced comment filter** | Sensitivity + blocklist | AdvancedCommentFilterScreen | SensitivitySlider, CustomBlocklist, ReviewHiddenLink | setSensitivity(), addWord(), openReview() | setLevel(), addToBlocklist(), loadHiddenComments() |
| **Harassment protection** | Auto-restrict, reports | HarassmentProtectionScreen | AutoRestrictToggle, BlockNetworksToggle, ReportsList | toggleAutoRestrict(), viewReports() | setAutoRestrict(), setBlockNetworks(), loadReports() |

---

# Part 5 — Job Account (Reference)

Job account has **common + personal** features plus **24 professional tools**. Below is a compact list of **tools and their main UI components/functions** for the UI build request. Each tool can be expanded into full component/function tables like above.

| # | Tool | Main Features / Sub-Features | Key Components | Key Functions |
|---|------|------------------------------|----------------|---------------|
| 1 | **MOxE TRACK** | Projects, issues, sprints, boards, backlog, labels, attachments | ProjectList, ProjectBoard (Kanban), BacklogView, SprintPlanning, IssueDetail, IssueForm | createProject(), moveIssue(), createSprint(), assignIssue(), filterExport(), bulkEdit() |
| 2 | **MOxE TRACK Recruiter** | Requisitions, candidate pipeline, interview scheduler | RequisitionList, PipelineBoard (candidates), InterviewScheduler | createRequisition(), moveCandidate(), scheduleInterview() |
| 3 | **MOxE WORK** | Business projects, task lists, Gantt | ProjectList, ProjectDetail (tasks, Gantt, dependencies) | createProject(), addTask(), updateGantt(), setDependency() |
| 4 | **MOxE KNOW** | Spaces, pages, search | SpaceList, PageView, PageEditor (rich text), Comments | createSpace(), createPage(), editPage(), comment() |
| 5 | **MOxE CODE** | Repos, branches, PRs, code review | RepoList, RepoView (files, branches), PRDetail (diff, comments), CodeReviewView | createRepo(), createPR(), commentOnLine(), mergePR() |
| 6 | **MOxE STATUS** | Status page, incidents | StatusPageEditor, IncidentList, IncidentDetail, NotifyButton | editPage(), createIncident(), updateIncident(), notify() |
| 7 | **MOxE FLOW** | Boards, columns, cards | BoardList, BoardView (columns, drag-drop cards), CardDetail | createBoard(), moveCard(), editCard() |
| 8 | **MOxE ACCESS** | User directory, SSO, MFA | UserDirectory, UserDetail, SSOConfigForm, MFAEnforcementForm | addUser(), configureSSO(), setMFAPolicy() |
| 9 | **MOxE ALERT** | Schedules, rules, incidents | ScheduleCalendar, AlertRulesList, IncidentTimeline | createSchedule(), createRule(), createIncident(), escalate() |
| 10 | **MOxE BUILD** | Pipelines, runs | PipelineList, PipelineRunView (logs, stages) | createPipeline(), runPipeline(), viewLogs() |
| 11 | **MOxE COMPASS** | Service catalog | ServiceList, ServiceDetail (health, dependencies) | registerService(), viewHealth() |
| 12 | **MOxE ATLAS** | OKRs | OKRTreeView, ObjectiveDetail (key results, check-ins) | createObjective(), addKeyResult(), checkIn() |
| 13 | **MOxE VIDEO** | Recording library, recorder, editor | LibraryList, RecorderScreen, EditorView (trim, captions) | record(), save(), trim(), addCaptions() |
| 14 | **MOxE CHAT** | Chat + ticketing | ChatView, ConvertToTicketButton, TicketDetail | sendMessage(), convertToTicket(), updateTicket() |
| 15 | **MOxE SOURCE** | Git GUI | CommitGraph, StagingArea, DiffView | stage(), commit(), push() |
| 16 | **MOxE CODE SEARCH** | Code search | SearchInput, ResultsList (snippets, context) | search(), openFile() |
| 17 | **MOxE AI** | Assistant | ChatInput, ResponseStream | sendPrompt(), getSuggestions() |
| 18 | **MOxE STRATEGY** | Portfolio | PortfolioView (initiatives), InitiativeDetail (timeline, links) | createInitiative(), linkProject() |
| 19 | **MOxE ANALYTICS** | Reports | ReportBuilder (drag-drop metrics), ScheduleReport | addMetric(), buildReport(), schedule() |
| 20 | **MOxE PROFILE** | Unified identity | (Same as 1.10; Job-specific professional/personal sections) | (Same as 1.10) |
| 21 | **MOxE INTEGRATION** | Integrations | IntegrationList, CreateIntegrationButton | connect(), disconnect() |
| 22 | **MOxE SCRUM** | Sprint assistant | StandupBotView, RetroBoardView, SprintPlanningAssistant | runStandup(), openRetro(), suggestSprint() |
| 23 | **MOxE TEAMS** | Team hub | TeamDashboard (activity, metrics) | loadActivity(), loadMetrics() |
| 24 | **MOxE DOCS** | Documents | DocLibrary (folders), DocEditor (real-time, comments) | createDoc(), editDoc(), comment() |

---

# Summary

- **Part 1 (Common):** Onboarding, auth, feed, story viewer, explore, notifications, DMs, create post/story, profile, settings, platform-wide (nearby, SOS, proximity, anonymous spaces, streaks, one-time view, switch account).  
- **Part 2 (Personal):** Star subscription, profile visitors, anonymous story viewer, download protection, voice commands, priority support, message blocked user, close friends, favorites.  
- **Part 3 (Business):** Business setup & verification, reviews, analytics, promotions & ads, shop & commerce (orders, returns, seller dashboard, payouts, live shopping), business inbox, team.  
- **Part 4 (Creator):** Creator dashboard, subscriptions, live badges, gifts, bonuses, branded content, insights, content calendar, trending audio, content ideas, schedule content, collaboration, creator inbox (quick replies, auto-responses), comment filter, harassment protection.  
- **Part 5 (Job):** 24 tools with main components and functions listed for TRACK, WORK, KNOW, CODE, STATUS, FLOW, ACCESS, ALERT, BUILD, COMPASS, ATLAS, VIDEO, CHAT, SOURCE, CODE SEARCH, AI, STRATEGY, ANALYTICS, PROFILE, INTEGRATION, SCRUM, TEAMS, DOCS.

Use this document to generate tickets, estimate UI work, and ensure every component, sub-component, function, and sub-function is implemented and tested per account type.
