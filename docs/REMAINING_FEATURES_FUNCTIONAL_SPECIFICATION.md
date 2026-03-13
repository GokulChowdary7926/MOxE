# MOxE – Complete Functional Specification for Remaining Features

This document provides a detailed breakdown of every remaining feature for MOxE, including their **sub-features, functions, sub-functions, components, and sub-components**, along with **5+ real-world examples** for each feature. The features covered are:

1. **Photo Editing Tools** (Phase 2)
2. **Video Editing Tools** (Phase 2)
3. **Priority Support** (Phase 2)
4. **Temporary Blocking** (Phase 3)
5. **Nearby Messaging** (Phase 3)
6. **Proximity Alert** (Phase 3)
7. **Anonymous Discussion Spaces** (Phase 3)
8. **Real-Time Call Translation** (Phase 3)

Each section follows the same hierarchical structure as the original functional guide, ensuring completeness and clarity for **engineering, product, and QA teams**.

**Related:** [REMAINING_FEATURES_IMPLEMENTATION_PLAN.md](./REMAINING_FEATURES_IMPLEMENTATION_PLAN.md) for technical implementation specs and effort estimates.

---

# 1. Photo Editing Tools

## Overview
Photo Editing Tools allow users to enhance their images before posting. They include filters, manual adjustments, cropping, rotating, and other creative controls. These tools are integrated into the post creation flow (CreatePost) and are available to all users.

---

## Sub-Features

### 1.1 Filter Library
#### Function 1.1.1: Apply Preset Filters
- **Sub-Functions:**
  - `loadFilterThumbnails()` – Show preview thumbnails of each filter applied to the current image.
  - `selectFilter(filterId)` – Choose a filter from the library.
  - `adjustFilterIntensity(intensity)` – Slide to control filter strength (0–100%).
  - `previewFilter()` – Live preview on the image.
  - `applyFilter()` – Commit the filter to the editing session.

#### Function 1.1.2: Manage Filter Favorites
- **Sub-Functions:**
  - `markAsFavorite(filterId)` – Save a filter to the user's favorites.
  - `removeFavorite(filterId)` – Remove from favorites.
  - `reorderFavorites()` – Drag-and-drop to rearrange the favorite filters list.

**Example 1:** Emma selects a "Vibrant" filter for her brunch photo, then reduces intensity to 70% to make it look natural.

**Example 2:** Lena marks three filters as favorites ("Prom Glow", "Soft Pink", "Golden Hour") so they appear at the top of the filter carousel.

**Example 3:** Mike previews each filter on his cat photo by tapping thumbnails; he chooses "Noir" for a dramatic black-and-white effect.

**Example 4:** A food blogger tries the "Warm" filter on a pasta shot, then adjusts intensity to 50% to keep the original colors slightly visible.

**Example 5:** A business account uses the "Clean" filter on product images to maintain consistent branding across posts.

---

### 1.2 Manual Adjustments
#### Function 1.2.1: Brightness
- **Sub-Functions:** `increaseBrightness()`, `decreaseBrightness()`, `resetBrightness()`

#### Function 1.2.2: Contrast
- **Sub-Functions:** `increaseContrast()`, `decreaseContrast()`, `resetContrast()`

#### Function 1.2.3: Saturation
- **Sub-Functions:** `increaseSaturation()`, `decreaseSaturation()`, `resetSaturation()`

#### Function 1.2.4: Warmth (Temperature)
- **Sub-Functions:** `warmer()`, `cooler()`, `resetWarmth()`

#### Function 1.2.5: Sharpness
- **Sub-Functions:** `sharpen()`, `blur()`, `resetSharpness()`

#### Function 1.2.6: Fade
- **Sub-Functions:** `fadeIn()`, `fadeOut()`, `resetFade()`

#### Function 1.2.7: Highlights
- **Sub-Functions:** `reduceHighlights()`, `restoreHighlights()`, `resetHighlights()`

#### Function 1.2.8: Shadows
- **Sub-Functions:** `liftShadows()`, `deepenShadows()`, `resetShadows()`

#### Function 1.2.9: Vignette
- **Sub-Functions:** `addVignette()`, `removeVignette()`, `adjustVignetteRadius()`

**Example 1:** Emma increases brightness and contrast on a dimly lit restaurant photo to make the food pop.

**Example 2:** Lena adds a slight fade to her selfie for a vintage look, then lifts shadows to brighten her face.

**Example 3:** Mike increases sharpness on a landscape shot to bring out details in the mountains.

**Example 4:** A travel blogger reduces highlights on a beach photo to recover details in the bright sky.

**Example 5:** A business account uses vignette to draw focus to the product in the center of the image.

---

### 1.3 Crop & Rotate
#### Function 1.3.1: Crop to Aspect Ratios
- **Sub-Functions:** `cropToSquare()`, `cropTo4_5()`, `cropTo16_9()`, `freeCrop()`, `applyCrop()`

#### Function 1.3.2: Rotate
- **Sub-Functions:** `rotateLeft()`, `rotateRight()`, `flipHorizontal()`, `flipVertical()`

#### Function 1.3.3: Straighten
- **Sub-Functions:** `straighten(angle)` – slider from -45° to +45°, `autoStraighten()` – AI-based horizon detection.

#### Function 1.3.4: Perspective Correction
- **Sub-Functions:** `adjustVerticalPerspective()`, `adjustHorizontalPerspective()`, `resetPerspective()`

**Example 1:** Emma crops a photo to square format for a consistent feed grid.

**Example 2:** Lena rotates a slightly tilted group photo taken at prom to straighten the horizon.

**Example 3:** Mike uses free crop to remove distracting elements from the edge of a concert photo.

**Example 4:** An architect uses perspective correction to make building lines straight in a photo taken from ground level.

**Example 5:** A food blogger flips a horizontal image to better fit the composition.

---

### 1.4 Text & Drawing Overlays
#### Function 1.4.1: Add Text
- **Sub-Functions:** `selectFont()`, `setTextColor()`, `addBackground()`, `positionText()`, `resizeText()`, `rotateText()`

#### Function 1.4.2: Freehand Drawing
- **Sub-Functions:** `selectBrush(pen, marker, highlighter)`, `setBrushSize()`, `setBrushColor()`, `draw()`, `erase()`, `undo()`, `redo()`

**Example 1:** Emma adds a text overlay "Sunday Brunch ☕" in a cursive font to her story.

**Example 2:** Lena draws hearts and stars around her prom dress photo using a neon brush.

**Example 3:** Mike circles a funny detail in a meme before sharing.

**Example 4:** A teacher highlights key information in a screenshot of an article.

**Example 5:** A business adds a "50% OFF" text with a bold font and red background to a product image.

---

### 1.5 Stickers & Emojis
#### Function 1.5.1: Add Stickers
- **Sub-Functions:** `browseCategories()`, `searchStickers()`, `selectSticker()`, `positionSticker()`, `scaleSticker()`, `rotateSticker()`

#### Function 1.5.2: Add Emojis
- **Sub-Functions:** `openEmojiPicker()`, `selectEmoji()`, `positionEmoji()`, `scaleEmoji()`

**Example 1:** Emma adds a "New Post" sparkler sticker to her story.

**Example 2:** Lena decorates her photo with flower and butterfly stickers.

**Example 3:** Mike adds a laughing emoji next to his cat's funny expression.

**Example 4:** A brand adds their logo sticker to user-generated content when reposting.

**Example 5:** A travel blogger pins location-specific stickers (Eiffel Tower) to their Paris photos.

---

### 1.6 Save & Export
#### Function 1.6.1: Save Edited Copy
- **Sub-Functions:** `saveToGallery()`, `saveToDrafts()`, `shareNow()`

#### Function 1.6.2: Reset Edits
- **Sub-Functions:** `resetAllEdits()`, `undoLastEdit()`, `redoLastEdit()`

**Example 1:** Emma saves her edited brunch photo to her gallery before posting.

**Example 2:** Lena saves a draft of her prom photo with filters applied, planning to post later.

**Example 3:** Mike tries several edits, undoes the last one, and finally resets all to start over.

**Example 4:** A business saves multiple edited versions of a product image for A/B testing.

**Example 5:** A creator shares the edited image directly to their story after finishing.

---

# 2. Video Editing Tools

## Overview
Video Editing Tools allow users to trim, set cover frames, adjust speed, and apply basic filters to videos before posting (in Feed, Reels, or Stories). The tools are integrated into the video upload flow.

---

## Sub-Features

### 2.1 Trim Video
#### Function 2.1.1: Set Start and End Points
- **Sub-Functions:** `dragStartHandle()`, `dragEndHandle()`, `zoomIntoTimeline()`, `previewTrim()`, `applyTrim()`

#### Function 2.1.2: Split Video
- **Sub-Functions:** `splitAt(seconds)` – cut video into two clips, `deleteSegment()`, `reorderSegments()`

**Example 1:** Emma trims a 1-minute cooking video to the best 30 seconds, removing the intro and outro.

**Example 2:** Lena splits her prom dance video at the moment the song changes, then deletes the first part.

**Example 3:** Mike trims a guitar lesson video to focus on the solo section.

**Example 4:** A travel vlogger trims a 5-minute clip into a 45-second highlight reel.

**Example 5:** A business removes the first 3 seconds of a product demo where the camera was adjusting.

---

### 2.2 Cover Frame Selection
#### Function 2.2.1: Choose Cover Frame
- **Sub-Functions:** `scrollFrames()`, `selectFrame()`, `useCurrentFrameAsCover()`, `uploadCustomCover()`

#### Function 2.2.2: Add Text Overlay to Cover
- **Sub-Functions:** `addTitle()`, `addCaption()`, `styleText()`

**Example 1:** Emma scrolls through her recipe video and picks a frame where the dish looks perfect as the cover.

**Example 2:** Lena selects a frame with her and friends smiling for the prom video cover.

**Example 3:** Mike uploads a custom thumbnail image for his guitar tutorial instead of using a video frame.

**Example 4:** A business adds "New Arrival" text on the cover frame of a product video.

**Example 5:** A creator uses a frame with high contrast to make the cover pop in the feed.

---

### 2.3 Speed Adjustment
#### Function 2.3.1: Change Playback Speed
- **Sub-Functions:** `setSpeed(speed)` – options: 0.3x, 0.5x, 1x (normal), 1.5x, 2x, 3x, `previewSpeed()`, `applySpeed()`

**Example 1:** Emma slows down a pouring syrup shot to 0.5x for a dramatic effect.

**Example 2:** Lena speeds up her prom getting-ready footage to 2x to make it fun and fast-paced.

**Example 3:** Mike uses 0.3x slow motion on a skateboard trick video.

**Example 4:** A travel blogger speeds up a sunset timelapse to 3x.

**Example 5:** A business creates a quick-motion assembly video of their product.

---

### 2.4 Mute & Audio
#### Function 2.4.1: Mute Original Audio
- **Sub-Functions:** `muteAudio()`, `unmuteAudio()`

#### Function 2.4.2: Add Music from Library
- **Sub-Functions:** `searchMusic()`, `selectSong()`, `trimSongClip()`, `adjustMusicVolume()`

#### Function 2.4.3: Add Voiceover
- **Sub-Functions:** `recordVoiceover()`, `positionVoiceover()`, `adjustVoiceoverVolume()`

**Example 1:** Emma mutes the noisy background of a coffee shop video and adds a lo-fi beat.

**Example 2:** Lena adds a trending song from the music library to her prom video.

**Example 3:** Mike records a voiceover explaining guitar chords over his video.

**Example 4:** A business mutes original audio and adds a professional voiceover describing product features.

**Example 5:** A creator adjusts music volume to be lower than the voiceover.

---

### 2.5 Video Filters
#### Function 2.5.1: Apply Filters
- **Sub-Functions:** `selectVideoFilter()`, `adjustFilterIntensity()` – same as photo filters.

**Example 1:** Emma applies a "Warm" filter to her sunset video.

**Example 2:** Lena uses a "Vintage" filter on her prom video for an aesthetic look.

**Example 3:** Mike applies "Noir" black-and-white to a dramatic skateboard fail.

**Example 4:** A business uses a "Clean" filter to make product colors pop.

**Example 5:** A travel vlogger applies "Cool" filter to glacier footage.

---

### 2.6 Save & Export
#### Function 2.6.1: Save Draft
- **Sub-Functions:** `saveVideoDraft()`, `loadVideoDraft()`

#### Function 2.6.2: Export Video
- **Sub-Functions:** `renderVideo()`, `compressVideo()`, `shareToFeed()`, `shareToReels()`, `shareToStory()`

**Example 1:** Emma saves her partially edited video draft and finishes it later.

**Example 2:** Lena renders her prom video in high quality and posts it as a Reel.

**Example 3:** Mike compresses a large video to fit within upload limits.

**Example 4:** A business exports a product video and shares it simultaneously to Feed and Story.

**Example 5:** A creator saves the final video to their device for cross-posting on other platforms.

---

# 3. Priority Support (Star Tier)

## Overview
Priority Support gives Star-tier subscribers faster, dedicated help. It includes a ticketing system with guaranteed response times (e.g., 4 hours) and a separate queue for premium users.

---

## Sub-Features

### 3.1 Ticket Creation
#### Function 3.1.1: Open Support Ticket
- **Sub-Functions:** `selectCategory()` (e.g., Billing, Technical, Report User), `writeSubject()`, `writeMessage()`, `attachScreenshots()`, `submitTicket()`

#### Function 3.1.2: Auto-Priority Assignment
- **Sub-Functions:** `detectUserTier()`, `setPriority(priority)` – for Star users, set to `HIGH`, `assignToPremiumQueue()`

**Example 1:** Emma (Star) can't post photos; she opens a ticket with category "Technical" and attaches a screenshot of the error. Her ticket is marked high priority.

**Example 2:** Lena (Free) reports a bug; her ticket goes to the normal queue and may take 24h for first response.

**Example 3:** Mike (Star) has a billing issue; his ticket is routed to a dedicated premium support agent.

**Example 4:** A business (Star) needs help with ad setup; they select "Promotions" category and get a response within 2 hours.

**Example 5:** A creator (Star) reports harassment; the ticket is escalated to the safety team with high priority.

---

### 3.2 Ticket Tracking
#### Function 3.2.1: View Ticket Status
- **Sub-Functions:** `listTickets()`, `filterByStatus(open, inProgress, resolved)`, `viewTicketDetails()`

#### Function 3.2.2: Add Reply to Ticket
- **Sub-Functions:** `writeReply()`, `attachFiles()`, `notifyAgent()`

#### Function 3.2.3: Close/Reopen Ticket
- **Sub-Functions:** `closeTicket()`, `reopenTicket()`

**Example 1:** Emma logs into the support portal and sees her ticket status changed to "In Progress".

**Example 2:** Lena adds a reply with additional information, and the agent responds within an hour.

**Example 3:** Mike receives an email notification when his ticket is resolved; he logs in to confirm.

**Example 4:** A business reopens a ticket because the issue wasn't fully resolved.

**Example 5:** A creator views all their past tickets to reference previous solutions.

---

### 3.3 Admin/Agent Interface
#### Function 3.3.1: Queue Management
- **Sub-Functions:** `viewAllTickets()`, `filterByPriority()`, `assignToSelf()`, `reassign()`

#### Function 3.3.2: Respond to Tickets
- **Sub-Functions:** `writeInternalNote()`, `writePublicReply()`, `changeStatus()`, `mergeTickets()`

#### Function 3.3.3: SLA Enforcement
- **Sub-Functions:** `trackResponseTime()`, `escalateIfOverdue()`, `sendSLAWarning()`

**Example 1:** A support agent sees all high-priority tickets at the top of the queue and assigns the oldest to themselves.

**Example 2:** An agent adds an internal note for another team member before replying publicly.

**Example 3:** The system automatically escalates a ticket that has been waiting 3.5 hours (approaching 4h SLA).

**Example 4:** An agent merges two duplicate tickets from the same user.

**Example 5:** A supervisor reviews SLA compliance reports weekly.

---

### 3.4 Notifications
#### Function 3.4.1: User Notifications
- **Sub-Functions:** `emailOnReply()`, `pushNotificationOnStatusChange()`, `inAppNotification()`

#### Function 3.4.2: Agent Notifications
- **Sub-Functions:** `emailOnNewTicket()`, `soundAlertForPriority()`

**Example 1:** Emma gets a push notification: "Your support ticket #1234 has been updated."

**Example 2:** Lena receives an email when her ticket is closed.

**Example 3:** An agent hears a sound alert when a high-priority ticket arrives.

**Example 4:** Mike sees a red badge on the support icon when he has an unread reply.

**Example 5:** A business user gets an email summary of their open tickets weekly.

---

# 4. Temporary Blocking

## Overview
Temporary Blocking allows users to block someone for a set period (e.g., 24h, 7 days, 30 days) instead of permanently. After the duration expires, the block automatically lifts.

---

## Sub-Features

### 4.1 Initiate Temporary Block
#### Function 4.1.1: Choose Block Duration
- **Sub-Functions:** `selectDuration()` – options: Permanent, 24 hours, 7 days, 30 days, `customDuration()` (if allowed).

#### Function 4.1.2: Confirm Block
- **Sub-Functions:** `showWarning()` – "This user will not be able to interact with you for X days.", `confirmAction()`, `cancel()`

**Example 1:** Emma is annoyed by a friend's excessive tagging; she blocks them for 24 hours to take a break.

**Example 2:** Lena has a disagreement with a classmate; she blocks them for 7 days to cool off.

**Example 3:** Mike receives spam from a bot account; he blocks it permanently.

**Example 4:** A business temporarily blocks a customer who left multiple negative comments, giving them time to resolve the issue offline.

**Example 5:** A creator blocks a persistent troll for 30 days; after that, the troll can attempt to behave appropriately.

---

### 4.2 Block Expiry Handling
#### Function 4.2.1: Automatic Unblock
- **Sub-Functions:** `cronJobCheckExpiredBlocks()` – runs daily, removes blocks where `expiresAt < now()`, `logUnblockEvent()`

#### Function 4.2.2: Notification on Unblock
- **Sub-Functions:** `notifyBlocker()` – "Your temporary block on @username has expired.", `notifyUnblockedUser()` – (optional) "You are no longer blocked by @username."

**Example 1:** After 24 hours, Emma receives a notification that her block on the friend has expired; she can now see their posts again.

**Example 2:** Lena's 7-day block on her classmate expires; she doesn't get a notification, but she notices she can view their profile again.

**Example 3:** The system logs all expired blocks for audit purposes.

**Example 4:** A business sees that a previously blocked customer has been unblocked automatically and may now interact.

**Example 5:** A creator checks their block list and sees that temporary blocks are clearly marked with expiration dates.

---

### 4.3 Block Management Interface
#### Function 4.3.1: View Blocked Users
- **Sub-Functions:** `listBlockedUsers()`, `filterByPermanentOrTemporary()`, `showExpiryDate()`

#### Function 4.3.2: Modify or Cancel Block
- **Sub-Functions:** `extendBlockDuration()`, `convertToPermanent()`, `unblockEarly()`

**Example 1:** Emma views her blocked list and sees "@friend – expires in 23 hours".

**Example 2:** Lena decides to extend her block on the classmate to 30 days after another conflict.

**Example 3:** Mike accidentally blocked someone and unblocks them early.

**Example 4:** A business converts a temporary block to permanent after the customer continues harassment.

**Example 5:** A creator reviews all temporary blocks and decides to let some expire naturally.

---

### 4.4 Interaction Restrictions During Block
#### Function 4.4.1: Enforce Block Rules
- **Sub-Functions:** `isBlocked()` checks both permanent and temporary blocks; `isExpired()` determines if block still active.

#### Function 4.4.2: Hide Content
- **Sub-Functions:** `hidePosts()`, `hideStories()`, `hideComments()`, `blockMessages()`

**Example 1:** During the 24-hour block, Emma cannot see any posts from the blocked friend.

**Example 2:** Lena's classmate cannot send her messages for 7 days.

**Example 3:** Mike's blocked bot cannot comment on his posts.

**Example 4:** A business account's posts are hidden from the temporarily blocked customer.

**Example 5:** A creator's stories are invisible to the blocked troll until the block expires.

---

# 5. Nearby Messaging

## Overview
Nearby Messaging allows users to discover and chat with others within a configurable radius (500m – 5km) based on real-time location. Users must opt in, and they can control their visibility.

---

## Sub-Features

### 5.1 Location Opt-In & Privacy
#### Function 5.1.1: Enable Nearby Discovery
- **Sub-Functions:** `toggleNearbyMode(on/off)`, `setRadius(radius)` – slider from 500m to 5km, `chooseVisibility()` – Everyone, Followers Only, Off

#### Function 5.1.2: Location Sharing Controls
- **Sub-Functions:** `shareWhileUsingApp()`, `shareAlways()`, `neverShare()`, `pauseLocationSharing()`, `clearLocationHistory()`

**Example 1:** Emma enables Nearby Mode at a music festival, sets radius to 1km, and chooses "Everyone" to meet new people.

**Example 2:** Lena enables it but sets visibility to "Followers Only" so only people she follows can see her nearby.

**Example 3:** Mike only shares location while using the app to conserve battery.

**Example 4:** A business enables Nearby Mode during a pop-up event to attract local customers.

**Example 5:** A creator pauses location sharing when leaving an event.

---

### 5.2 Location Updates
#### Function 5.2.1: Send Location to Server
- **Sub-Functions:** `getCurrentLocation()` – uses device GPS, `sendLocationUpdate(lat, lng)` – periodic (e.g., every 5 minutes), `throttleUpdates()` to save battery

#### Function 5.2.2: Store Location
- **Sub-Functions:** `updateAccountLocation()` – store latest coordinates in database (with timestamp), `pruneOldLocations()` – remove entries older than, say, 1 hour.

**Example 1:** Emma's app sends her location every 5 minutes while Nearby Mode is active.

**Example 2:** Lena's location is updated only when she opens the Nearby tab.

**Example 3:** Mike's location is stored with a timestamp; old entries are deleted after 1 hour.

**Example 4:** The server batches location updates to reduce load.

**Example 5:** A business's location is updated only during business hours when the store is open.

---

### 5.3 Discovering Nearby Users
#### Function 5.3.1: Query Nearby Users
- **Sub-Functions:** `GET /api/nearby?radius=2000` – returns list of users within radius, filtered by visibility settings, excludes blocked users, sorted by distance.

#### Function 5.3.2: Display Nearby List
- **Sub-Functions:** `showUserCards()` – profile picture, username, distance, `filterByGender/Age` (optional), `sortByDistance()`, `sortByRecentlyActive()`

**Example 1:** Emma opens the Nearby tab and sees 12 people within 1km, with the closest at 200m away.

**Example 2:** Lena filters to show only followers who are nearby.

**Example 3:** Mike sees a list sorted by distance; the closest person is 50m away.

**Example 4:** A business sees a list of potential customers near their store.

**Example 5:** A creator sees a fan nearby and can send a message.

---

### 5.4 Initiating Chat
#### Function 5.4.1: Start Conversation
- **Sub-Functions:** `sendInitialMessage()` – if both users are within radius, `createThread()` – DM thread created, `re-checkDistance()` – before sending, verify they are still in radius.

#### Function 5.4.2: Receive Message
- **Sub-Functions:** `notifyNewMessage()`, `displayThread()` – with distance context (e.g., "You were 300m away when this chat started")

**Example 1:** Emma sends "Hey, great set! I'm at the food trucks" to a musician she spotted nearby; the message goes through because both are still within 1km.

**Example 2:** Lena receives a message from someone nearby; she checks their profile and decides to reply.

**Example 3:** Mike tries to message someone who just left the radius; the app shows "User no longer nearby".

**Example 4:** A business sends a welcome message to a nearby user who just entered their radius.

**Example 5:** A creator starts a group chat with several nearby fans.

---

### 5.5 Safety & Reporting
#### Function 5.5.1: Report Nearby User
- **Sub-Functions:** `reportUser(reason)` – can be done from the nearby list or chat, `blockUser()` – immediately remove from list and prevent future contact.

#### Function 5.5.2: Exit Nearby Mode
- **Sub-Functions:** `disableNearby()` – stop sharing location, clear from server.

**Example 1:** Emma receives an inappropriate message from someone nearby; she reports and blocks them.

**Example 2:** Lena feels uncomfortable and disables Nearby Mode; her location is removed from the server.

**Example 3:** Mike reports a spammy account he discovered via Nearby.

**Example 4:** A business reports a competitor who is harassing customers.

**Example 5:** A creator uses the "Leave Nearby" button when leaving an event.

---

# 6. Proximity Alert

## Overview
Proximity Alert notifies a user when a specific contact (e.g., friend, family) enters a defined radius (e.g., 500m). This feature builds on the location infrastructure of Nearby Messaging.

---

## Sub-Features

### 6.1 Adding Proximity Alerts
#### Function 6.1.1: Select Contact
- **Sub-Functions:** `searchFriends()`, `selectUser()` – only users who follow each other (or are emergency contacts) can be added.

#### Function 6.1.2: Set Radius
- **Sub-Functions:** `chooseRadius()` – options: 100m, 500m, 1km, 2km, `customRadius()` – if allowed.

#### Function 6.1.3: Configure Alert Preferences
- **Sub-Functions:** `setCooldown()` – minimum time between alerts (e.g., 30 min), `enableNotifyOnlyWhenActive()` – only alert if the app is in use.

**Example 1:** Emma adds her best friend with a 500m radius; she will get an alert when her friend is within half a kilometer.

**Example 2:** Lena adds her mom with a 1km radius; she wants to know when mom is nearby for safety.

**Example 3:** Mike adds his bandmate with a 100m radius at a concert venue.

**Example 4:** A business adds a VIP customer with a 2km radius to send a personal offer when they're nearby.

**Example 5:** A creator adds a collaborator with a 500m radius and sets cooldown to 1 hour to avoid spam.

---

### 6.2 Monitoring & Alerting
#### Function 6.2.1: Background Location Monitoring
- **Sub-Functions:** `periodicLocationCheck()` – for each proximity alert, compute distance between users, `triggerAlertIfWithinRadius()` – if distance ≤ radius and cooldown passed.

#### Function 6.2.2: Send Notification
- **Sub-Functions:** `pushNotification()` – e.g., "Alex is 200m away!", `inAppAlert()` – banner within app.

**Example 1:** Emma's friend arrives at the same coffee shop; she gets a push notification: "Sarah is 50m away!"

**Example 2:** Lena's mom enters the 1km radius; Lena gets an alert while shopping.

**Example 3:** Mike's bandmate is 80m away at the venue; Mike gets a notification to meet up.

**Example 4:** A business sends an automated welcome notification when a VIP customer is nearby.

**Example 5:** A creator is alerted that a collaborator is in the area; they message to meet.

---

### 6.3 Managing Alerts
#### Function 6.3.1: View Active Alerts
- **Sub-Functions:** `listProximityAlerts()` – shows all configured alerts with contact, radius, last triggered time.

#### Function 6.3.2: Edit or Delete Alert
- **Sub-Functions:** `editRadius()`, `disableAlert()`, `deleteAlert()`

#### Function 6.3.3: Pause All Alerts
- **Sub-Functions:** `pauseAll()`, `resumeAll()`

**Example 1:** Emma reviews her active alerts and sees "Sarah – 500m – last triggered 2h ago".

**Example 2:** Lena increases the radius for her mom to 2km because she wants earlier notice.

**Example 3:** Mike deletes the alert for his ex-bandmate after they part ways.

**Example 4:** A business pauses all alerts during off-hours.

**Example 5:** A creator disables an alert for a day to avoid distractions.

---

### 6.4 Privacy Controls
#### Function 6.4.1: Recipient Consent
- **Sub-Functions:** `sendAlertRequest()` – user must approve being added to someone's proximity alerts, `acceptRequest()`, `declineRequest()`, `blockRequestsFromUser()`

#### Function 6.4.2: Opt-Out Globally
- **Sub-Functions:** `disableAllProximityAlerts()` – prevents anyone from alerting on this user's location.

**Example 1:** Emma sends a proximity alert request to her friend; the friend accepts, and now Emma will be notified when she's nearby.

**Example 2:** Lena receives a request from an acquaintance; she declines.

**Example 3:** Mike blocks all proximity alert requests from a user he doesn't trust.

**Example 4:** A business globally opts out of proximity alerts for privacy reasons.

**Example 5:** A creator accepts requests only from close friends.

---

# 7. Anonymous Discussion Spaces

## Overview
Anonymous Discussion Spaces are dedicated areas where users can post and interact without revealing their identity. They foster open dialogue on sensitive topics while maintaining moderation to prevent abuse.

---

## Sub-Features

### 7.1 Space Discovery & Creation
#### Function 7.1.1: Browse Public Spaces
- **Sub-Functions:** `listSpaces()` – categories (Health, Relationships, Work, etc.), `searchSpaces()`, `viewSpaceDetails()`

#### Function 7.1.2: Create a Space
- **Sub-Functions:** `setSpaceName()`, `setDescription()`, `chooseVisibility()` – Public, Private (by invite), `setModerators()` – assign users to moderate.

**Example 1:** Emma browses public spaces and finds "Mental Health Support" – she joins.

**Example 2:** Lena creates a private space "Prom Planning" for her friends to discuss anonymously.

**Example 3:** Mike creates a public space "Guitar Tips" where users can ask questions without revealing identity.

**Example 4:** A support group creates a space "Addiction Recovery" with strict moderation.

**Example 5:** A creator starts an "Ask Me Anything" space where fans can post anonymously.

---

### 7.2 Anonymous Posting
#### Function 7.2.1: Create Post
- **Sub-Functions:** `writeContent()`, `attachMedia()` – optional, `setAnonymous()` – no author name shown, `post()`

#### Function 7.2.2: Comment on Posts
- **Sub-Functions:** `writeComment()` – also anonymous, `replyToComment()`

#### Function 7.2.3: Vote on Posts/Comments
- **Sub-Functions:** `upvote()`, `downvote()`, `removeVote()`

**Example 1:** Emma posts anonymously in the mental health space: "I've been feeling anxious lately…" – she receives supportive comments.

**Example 2:** Lena comments on a prom dress thread anonymously: "I wore that dress too, it's gorgeous!"

**Example 3:** Mike upvotes a helpful guitar tip.

**Example 4:** A user in the recovery space shares their story; many upvote for encouragement.

**Example 5:** A creator posts an anonymous question in their own space to get honest feedback.

---

### 7.3 Moderation & Reporting
#### Function 7.3.1: Report Post/Comment
- **Sub-Functions:** `selectReason()` – Harassment, Spam, Offensive, etc., `submitReport()`, `auto-hide content with multiple reports`

#### Function 7.3.2: Moderator Actions
- **Sub-Functions:** `viewReportedContent()`, `hidePost()`, `deletePost()`, `warnUser()` – send anonymous warning, `banUserFromSpace()` – prevent further posting.

#### Function 7.3.3: Automated Filtering
- **Sub-Functions:** `AI-detectToxicity()` – flag content for review, `auto-block certain keywords`

**Example 1:** Emma reports a comment that contains hate speech in the mental health space.

**Example 2:** A moderator sees a reported post and deletes it, sending a warning to the anonymous user.

**Example 3:** The AI automatically hides a post with offensive language.

**Example 4:** Lena's private space has a moderator who removes spam.

**Example 5:** A user is banned from a space after multiple violations.

---

### 7.4 User Controls
#### Function 7.4.1: Mute Space
- **Sub-Functions:** `muteNotifications()` – stop alerts from a space, `unmute()`

#### Function 7.4.2: Leave Space
- **Sub-Functions:** `leaveSpace()`, `confirmLeave()`

#### Function 7.4.3: Block User in Space
- **Sub-Functions:** `blockAnonymousUser()` – user is identified by a consistent anonymous ID (e.g., a hash) so they can be blocked even without a real identity.

**Example 1:** Emma mutes a space that became too active.

**Example 2:** Lena leaves the prom space after the event is over.

**Example 3:** Mike blocks an anonymous user who kept trolling his posts.

**Example 4:** A user blocks a persistent harasser in a support space.

**Example 5:** A creator blocks a user from their space after repeated rule violations.

---

# 8. Real-Time Call Translation

## Overview
Real-Time Call Translation provides live translation of speech during audio and video calls. It displays subtitles in the user's preferred language, enabling cross-language communication.

---

## Sub-Features

### 8.1 Call Setup with Translation
#### Function 8.1.1: Enable Translation
- **Sub-Functions:** `toggleTranslation()` – during call setup or during call, `selectTargetLanguage()` – choose language to translate into.

#### Function 8.1.2: Language Detection
- **Sub-Functions:** `autoDetectSourceLanguage()` – identify the language being spoken, `confirmLanguage()` – user can override.

**Example 1:** Emma (English) calls a French friend; she enables translation and sets target language to English. Her friend speaks French, and Emma sees English subtitles.

**Example 2:** Lena (Spanish) calls a Japanese friend; she enables translation and selects Spanish as target.

**Example 3:** Mike (German) calls a client in Italy; he enables translation to German.

**Example 4:** A business calls an international partner; both enable translation to their respective languages.

**Example 5:** A creator does a live interview with a fan from another country; translation is enabled for all viewers.

---

### 8.2 Speech-to-Text (STT)
#### Function 8.2.1: Capture Audio
- **Sub-Functions:** `getUserMedia()` – access microphone, `streamAudioToServer()` – send audio chunks to STT service.

#### Function 8.2.2: Convert Speech to Text
- **Sub-Functions:** `sendToSpeechAPI()` – use Google Cloud Speech-to-Text or similar, `receiveTranscript()` – get text with timestamps.

**Example 1:** Emma's spoken English is converted to text in real time.

**Example 2:** Lena's Spanish speech is transcribed.

**Example 3:** Mike's German is transcribed with high accuracy.

**Example 4:** The system handles background noise and multiple speakers.

**Example 5:** A business call's audio is transcribed for both sides.

---

### 8.3 Translation
#### Function 8.3.1: Translate Text
- **Sub-Functions:** `sendToTranslationAPI()` – e.g., Google Translate, `receiveTranslatedText()`, `adjustForContext()` – use neural models for better fluency.

#### Function 8.3.2: Handle Multiple Languages
- **Sub-Functions:** `detectAndRoute()` – if participants have different target languages, translate accordingly.

**Example 1:** Emma's English transcript is translated to French for her friend's subtitles.

**Example 2:** Lena's Spanish is translated to Japanese.

**Example 3:** Mike's German is translated to Italian.

**Example 4:** The system correctly handles idioms and colloquialisms.

**Example 5:** A multi-party call with three languages: each participant sees subtitles in their chosen language.

---

### 8.4 Display Subtitles
#### Function 8.4.1: Render Subtitles on Screen
- **Sub-Functions:** `showSubtitles()` – bottom of screen, `adjustTextSize()`, `changeBackgroundOpacity()`, `enableWordHighlighting()` – highlight current word.

#### Function 8.4.2: Sync with Audio
- **Sub-Functions:** `alignWithSpeech()` – ensure subtitles appear at the right moment, `adjustLatency()` – compensate for processing delay.

**Example 1:** Emma sees subtitles in English as her friend speaks French, with a slight delay but well synchronized.

**Example 2:** Lena increases text size for better readability.

**Example 3:** Mike enables word highlighting to follow along.

**Example 4:** A business user sees clean, well-timed subtitles during an international call.

**Example 5:** A creator's live stream shows subtitles for viewers who enable translation.

---

### 8.5 Text-to-Speech (Optional)
#### Function 8.5.1: Synthesize Speech
- **Sub-Functions:** `convertTranslatedTextToSpeech()` – use TTS API, `chooseVoice()` – male/female, accent, `adjustSpeed()`.

#### Function 8.5.2: Inject Audio into Call
- **Sub-Functions:** `mixAudioStreams()` – combine original and synthesized speech, `sendToRemotePeer()` – as an alternative audio stream.

**Example 1:** Emma's friend prefers to hear English rather than read; TTS converts Emma's translated English to speech and plays it softly in the background.

**Example 2:** Lena's Japanese friend listens to Spanish translation via TTS.

**Example 3:** Mike uses TTS for hands-free understanding while driving.

**Example 4:** A business call uses TTS to ensure clarity for all participants.

**Example 5:** A creator's live stream has an option for viewers to hear translated audio.

---

### 8.6 User Controls & Preferences
#### Function 8.6.1: Language Settings
- **Sub-Functions:** `setPreferredLanguages()` – primary and secondary, `saveSettings()`

#### Function 8.6.2: Translation History
- **Sub-Functions:** `viewPastTranslations()` – log of calls with transcripts, `searchTranscripts()`, `deleteHistory()`

**Example 1:** Emma sets her preferred language to English and secondary to Spanish.

**Example 2:** Lena saves her translation settings for future calls.

**Example 3:** Mike reviews the transcript of a previous business call.

**Example 4:** A business searches for a specific term in past call transcripts.

**Example 5:** A creator clears translation history for privacy.

---

## Summary

This document provides a **complete functional breakdown** of the eight remaining features for MOxE, each with detailed sub-features, functions, sub-functions, and **5+ real-world examples**. The structure aligns with the earlier comprehensive guides, ensuring that all stakeholders (product, engineering, QA) have a single source of truth for what needs to be built.

**Next step:** Prioritise and begin implementation using [REMAINING_FEATURES_IMPLEMENTATION_PLAN.md](./REMAINING_FEATURES_IMPLEMENTATION_PLAN.md) for technical specs and effort estimates.
