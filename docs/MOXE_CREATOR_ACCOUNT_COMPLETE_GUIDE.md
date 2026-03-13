# MOxE Creator Account — Complete Feature Guide

This guide explains **every feature, sub-feature, function, sub-function, component, and sub-component** of the MOxE Creator account, with **real-world examples** so you can understand and implement them correctly in MOxE.

---

## Core principles

### What is a MOxE Creator account?

- **Creators have access to ALL MOxE Personal account features** and **basic social features** of MOxE. Nothing from Personal or basic social is removed when you become a Creator.
- **Free tier (Creator Free):** Basic creator tools (live, scheduling, basic analytics, 5 links). No Blue Badge, no subscriptions/badges/gifts.
- **Paid tier (Creator Paid):** Full creator suite **plus the Blue Verification Badge**. MOxE uses the **Blue Verification Badge** (not a gold star) to indicate that an account is authentic and belongs to the paid user it represents—the same symbol used on major social platforms for public figures, celebrities, and brands.

### Tiers at a glance

| | Creator Free | Creator Paid |
|---|--------------|--------------|
| **Badge** | No verification badge | **Blue Verification Badge** (when verified) |
| Personal + basic social | ✅ All included | ✅ All included |
| Live, schedule, 5 links, basic analytics | ✅ | ✅ |
| Subscriptions, live badges/gifts, full analytics | ❌ | ✅ |
| Real-time translation, voice, storage 5GB | ❌ | ✅ |

---

## Section 0: Personal account & basic social (included in Creator)

Creators get **every** Personal account and basic social feature. These are the same components and functions as on a Personal account.

### 0.1 Account management, privacy, notifications

**Features / sub-features:** Edit profile, privacy settings, story privacy (close friends / public), notification preferences.

**Functions:** `updateAccount`, `updateNotificationPrefs`, load/save profile and privacy in settings.

**Real-world examples:**

1. **Fitness creator** — Sets profile to public so new followers can find them, but keeps story visibility to “Close friends” for personal updates.
2. **Artist** — Turns off comment notifications at night; keeps like and follow notifications on to track engagement.
3. **Chef** — Uses “Private account” until they launch their creator brand, then switches to public.
4. **Travel vlogger** — Limits “Who can message you” to “People you follow” to reduce spam while staying reachable for collabs.
5. **Musician** — Disables story replies from everyone except Close Friends to avoid clutter.
6. **Educator** — Sets “Suggest your account to others” off during exam season to avoid distracting new followers.

---

### 0.2 Posts, Stories, Reels (create, edit, caption, like, comment, share)

**Features:** Create and edit posts, stories, reels; captions, hashtags; likes, comments, shares.

**Functions:** `create` / `update` in post, story, reel services; like, comment, share handlers in feed and detail views.

**Real-world examples:**

1. **Fashion creator** — Posts a carousel of outfit photos with a caption and hashtags; fans like and comment; creator replies to top comments.
2. **Comedian** — Posts a Reel with trending audio; viewers share it to their stories, driving new followers.
3. **Chef** — Posts a Story with a recipe poll; next story shows the winning dish.
4. **Tech reviewer** — Creates a post with “Swipe for specs”; uses first comment for links (link in bio).
5. **Yoga instructor** — Posts a Reel of a short flow; followers save it to their Saved collection for later.
6. **Photographer** — Posts high-res images; uses collections to group “Portraits”, “Landscapes”, “Behind the scenes”.

---

### 0.3 Save & Collections

**Features:** Save posts/reels to Saved; create named collections; organize saved items.

**Components:** Collection routes (GET/POST/DELETE), Saved page; `canSavedCollections` is **true** for Creator.

**Real-world examples:**

1. **Recipe creator** — Saves fans’ recipe posts into collections: “Breakfast”, “Desserts”, “Quick meals”.
2. **Designer** — Saves inspiration posts into “Color palettes”, “Typography”, “Layouts”.
3. **Coach** — Saves motivational posts into “Monday motivation” and “Client wins”.
4. **Travel creator** — Saves destination posts into “Europe”, “Asia”, “Wishlist”.
5. **Fitness creator** — Saves workout reels into “HIIT”, “Stretching”, “Home workouts”.
6. **Beauty creator** — Saves tutorials into “Skincare”, “Makeup looks”, “Hair”.

---

### 0.4 Close Friends

**Features:** Add/remove close friends; share stories (or selected posts) only to Close Friends.

**Functions:** Close-friend list CRUD; story visibility “Close friends only”.

**Real-world examples:**

1. **Creator** — Shares “Unlisted vlog” and bloopers only to Close Friends (family and best friends).
2. **Consultant** — Uses Close Friends for early access to new offers before public launch.
3. **Artist** — Shares work-in-progress and rough drafts only to Close Friends for feedback.
4. **Influencer** — Shares personal life (birthday, travel) to Close Friends; keeps feed for branded content.
5. **Coach** — Sends “Client-only” tips and reminders to Close Friends list.
6. **Musician** — Shares rehearsal clips and setlist ideas only with band and inner circle.

---

### 0.5 Story Highlights

**Features:** Create highlights from past stories; name and reorder; show on profile.

**Functions:** GET/POST/DELETE highlights; add/remove stories to/from highlights.

**Real-world examples:**

1. **Fitness creator** — Highlights: “Workouts”, “Meals”, “Progress”, “FAQ”.
2. **Chef** — “Recipes”, “Kitchen tips”, “Restaurant visits”, “Cookbook”.
3. **Travel creator** — “Japan”, “Europe 2024”, “Tips”, “Gear”.
4. **Artist** — “Process”, “Exhibitions”, “Commissions”, “Prints”.
5. **Educator** — “Syllabus”, “Office hours”, “Resources”, “Announcements”.
6. **Brand ambassador** — “Unboxing”, “Reviews”, “Discount codes”, “Events”.

---

### 0.6 Archive

**Features:** Archive posts so they’re hidden from profile but recoverable; view and restore from Archive.

**Functions:** Archive routes (list, archive, unarchive).

**Real-world examples:**

1. **Creator** — Archives old giveaway posts after the campaign ends to keep profile clean.
2. **Artist** — Archives early work but keeps it in Archive for portfolio reference.
3. **Business coach** — Archives outdated pricing posts after a rebrand.
4. **Fashion creator** — Archives seasonal lookbooks after the season; can restore for “Throwback” content.
5. **Food blogger** — Archives posts from a closed restaurant to avoid confusion.
6. **Musician** — Archives old tour dates and keeps only current tour on profile.

---

### 0.7 Direct Messages (DMs)

**Features:** Send and receive text/media DMs; group conversations; message requests.

**Functions:** Message service (send, list threads, get thread, labels).

**Real-world examples:**

1. **Creator** — Receives brand partnership inquiries in DMs and replies with rate card.
2. **Coach** — Sends 1:1 check-in messages to clients who subscribed.
3. **Artist** — Discusses commission details and references in DMs.
4. **Influencer** — Gets fan questions in DMs and uses quick replies for common answers.
5. **Consultant** — Sends booking link and follow-up via DM after a discovery call.
6. **Educator** — Answers student questions in DMs and uses labels to mark “Urgent” or “Assignment”.

---

### 0.8 Block, restrict, mute, report, hidden words

**Features:** Block/restrict/mute accounts; report content or accounts; hide comments/DMs containing certain words.

**Functions:** Block, restrict, mute, report services; Account `hiddenWords`, `commentFilterSensitivity`.

**Real-world examples:**

1. **Creator** — Blocks a user who repeatedly left hate comments.
2. **Public figure** — Restricts a tabloid account so their comments are hidden unless approved.
3. **Creator** — Mutes a former collaborator so they don’t see their posts but stay connected.
4. **Brand ambassador** — Reports impersonator accounts to get them removed.
5. **Creator** — Adds “discount code” and “DM for price” to hidden words to reduce spam in comments.
6. **Educator** — Uses “HIGH” comment filter sensitivity to auto-hide inappropriate words in class-related posts.

---

## Section 8: Creator setup & verification

### 8.1.1 Switch to Creator (convert from Personal)

**Feature:** Convert a Personal account to Creator; followers and content are preserved.

**Functions:** `convertToCreator` (PATCH accountType CREATOR, set FREE tier).

**Real-world examples:**

1. **Fitness enthusiast** — Has been posting workouts on Personal; converts to Creator to use scheduling and analytics.
2. **Photographer** — Converts to Creator to add “Book a shoot” and multiple links.
3. **Musician** — Converts to Creator before releasing an album to use subscriber-only teasers later (after upgrading to Paid).
4. **Chef** — Converts to Creator to join the creator network and apply for food brand campaigns.
5. **Coach** — Converts to Creator to use content calendar and best-time tools.
6. **Artist** — Converts to Creator to organize inbox with labels (Brand / Fan) and use quick replies.

---

### 8.1.2 Creator category

**Feature:** Set a primary creator category (e.g. Fitness, Food, Music, Education) for discovery and brand matching.

**Functions:** `setCreatorCategory`, `updateAccount` with `businessCategory`; browse/select in ConvertToCreator and Edit Profile.

**Real-world examples:**

1. **Yoga instructor** — Selects “Fitness & wellness” so fitness brands find them in the marketplace.
2. **Food blogger** — Selects “Food & cooking” for restaurant and kitchen brand campaigns.
3. **Singer** — Selects “Music” for music brands and event collabs.
4. **Teacher** — Selects “Education” for ed-tech and course partnerships.
5. **Fashion stylist** — Selects “Fashion & beauty” for clothing and makeup campaigns.
6. **Tech reviewer** — Selects “Technology” for gadget and software partnerships.

---

### 8.1.3 Creator contact (email, phone, booking link, WhatsApp)

**Feature:** Publish contact options so fans and brands can reach you: email, phone, “Book a call” link, WhatsApp.

**Functions:** `updateAccount` with `contactEmail`, `contactPhone`, `contactBookingLink`, `contactWhatsApp`; shown on CreatorProfile.

**Real-world examples:**

1. **Consultant** — Adds Calendly as “Book a call”; clients book without back-and-forth DMs.
2. **Coach** — Adds WhatsApp for quick voice notes and international clients.
3. **Photographer** — Adds email for formal inquiries and contracts; booking link for sessions.
4. **Musician** — Adds booking link for gigs and email for press.
5. **Speaker** — Adds “Book a call” for keynotes and workshops; email for contracts.
6. **Designer** — Adds WhatsApp for quick client feedback and email for invoices.

---

### 8.1.4 Creator verification (ID, portfolio; Blue Badge when Paid)

**Feature:** Submit ID and/or portfolio for verification; once approved **and** on **Creator Paid**, the account gets the **Blue Verification Badge**.

**Functions:** `VerificationRequest` create/approve; `verification.service` grants badge when verified + tier THICK.

**Real-world examples:**

1. **Celebrity** — Verifies with ID; after upgrading to Paid, gets Blue Badge so fans know the account is real.
2. **Journalist** — Verifies to get Blue Badge and reduce impersonation risk.
3. **Doctor** — Verifies so health advice is clearly from an authenticated professional.
4. **Brand** — Official brand account verifies and gets Blue Badge to avoid fake accounts.
5. **Public figure** — Verifies after a fake account tried to scam followers; Blue Badge restores trust.
6. **Artist** — Verifies with portfolio; Blue Badge helps galleries and brands trust the account.

---

### 8.1.5 Multiple links (max 5)

**Feature:** Add up to 5 links in bio (e.g. shop, podcast, Patreon, linktree, booking).

**Functions:** Link model CRUD; `maxLinks = 5` for Creator in capabilities.

**Real-world examples:**

1. **Creator** — Link 1: Latest YouTube video; 2: Merch store; 3: Podcast; 4: Newsletter; 5: Booking.
2. **Coach** — Link 1: Free assessment; 2: Course; 3: Calendar; 4: Testimonials; 5: Contact.
3. **Musician** — Link 1: Spotify; 2: Tour dates; 3: Store; 4: YouTube; 5: Newsletter.
4. **Writer** — Link 1: New book; 2: Substack; 3: Events; 4: Press; 5: Contact.
5. **Chef** — Link 1: Recipe ebook; 2: Kitchen tools; 3: Restaurant; 4: YouTube; 5: Book a class.
6. **Designer** — Link 1: Portfolio; 2: Dribbble; 3: Shop; 4: Commission form; 5: Contact.

---

### 8.1.6 Creator action buttons

**Feature:** Configure profile action buttons (e.g. “Book”, “Contact”, “Shop”) that link to external URLs or in-app actions.

**Functions:** `updateAccount` with `actionButtons` JSON; `canActionButtons` for Creator.

**Real-world examples:**

1. **Consultant** — “Book a call” button linking to Calendly.
2. **Artist** — “Shop prints” button to online store.
3. **Coach** — “Start free trial” button to course platform.
4. **Musician** — “Get tickets” button to ticket vendor.
5. **Chef** — “Order cookbook” button to Amazon or own site.
6. **Speaker** — “Invite to speak” button to speaker inquiry form.

---

### 8.1.7 Blue Verification Badge (Paid tier only)

**Feature:** Display the **Blue Verification Badge** next to the creator’s name when the account is verified **and** on **Creator Paid** tier. MOxE uses the **blue** verification badge (not a gold star) to signal authenticity, as on major social platforms.

**Functions:** `verifiedBadge` on Account; shown in UI when `verifiedBadge === true` and subscription tier is THICK (Paid).

**Real-world examples:**

1. **Verified celebrity** — Blue Badge so fans know it’s the real account, not a fan page.
2. **Verified journalist** — Blue Badge adds credibility to news and quotes.
3. **Verified brand** — Blue Badge prevents fake “official” accounts from confusing customers.
4. **Verified expert** — Blue Badge helps followers trust advice (health, legal, finance).
5. **Verified creator** — Blue Badge helps brands and platforms recognize the official creator in partnerships.
6. **Verified public figure** — Blue Badge reduces impersonation and scam risk after going viral.

---

## Section 9: Subscriptions & monetization (Paid tier)

### 9.1.1 Setup subscriptions (tiers, perks, welcome message)

**Feature:** Define subscription tiers (e.g. $5/mo, $15/mo) with perks; set a welcome message that is sent as a DM when someone subscribes.

**Functions:** GET/PATCH `/accounts/me/subscription-tiers` (tiers + `welcomeMessage`); on subscribe, send welcome DM if set.

**Real-world examples:**

1. **Fitness creator** — Tier 1: $5/mo (weekly workout plan); Tier 2: $15/mo (+ 1:1 check-in). Welcome message: “Thanks for subscribing! Here’s your first workout link.”
2. **Chef** — $7/mo for recipe vault; welcome DM includes PDF of top 10 recipes.
3. **Musician** — $5/mo for early access to songs; welcome: “You’re in! Next drop is Friday.”
4. **Coach** — $20/mo for group coaching; welcome: “Welcome to the group! Intro call is Tuesday 7pm.”
5. **Artist** — $10/mo for process videos and discount on prints; welcome: “Here’s your 15% code: CREW10.”
6. **Educator** — $9/mo for extra worksheets and Q&A; welcome: “Check your email for the resource folder link.”

---

### 9.1.2 Subscriber-only content

**Feature:** Publish posts, stories, or reels that only subscribers (or selected tiers) can see.

**Functions:** Create post/reel/story with `isSubscriberOnly`, `subscriberTierKeys`; feed and detail views gate by subscription.

**Real-world examples:**

1. **Creator** — Posts “Behind the scenes” reel as subscriber-only to reward paying fans.
2. **Coach** — Shares weekly reflection prompts as subscriber-only stories.
3. **Chef** — Posts full recipe video as subscriber-only; free feed shows teaser.
4. **Musician** — Shares acoustic version of a new song for subscribers only.
5. **Writer** — Posts bonus chapter as subscriber-only post.
6. **Fitness creator** — Posts full workout program as subscriber-only; free feed has one sample workout.

---

### 9.1.3 Subscriber management (list, export, broadcast, unsubscribe)

**Feature:** View subscriber list, export CSV, send one broadcast DM to all subscribers, and let subscribers cancel (unsubscribe).

**Functions:** GET `/accounts/me/subscribers`, GET export, POST broadcast, POST `/:creatorId/unsubscribe`; CreatorSubscribers UI.

**Real-world examples:**

1. **Creator** — Exports subscriber list to send a thank-you gift via email.
2. **Coach** — Broadcasts “Reminder: Live Q&A tomorrow 8pm” to all subscribers.
3. **Musician** — Broadcasts “New single out Friday — you hear it first” to subscribers.
4. **Chef** — Exports list to create a “Subscriber-only” segment in their newsletter tool.
5. **Creator** — Fan clicks “Unsubscribe” on profile; status becomes CANCELLED, access to subscriber content ends at period end.
6. **Educator** — Broadcasts “New module is live in the course” to all paying subscribers.

---

### 9.2 Live badges (Paid tier)

**Feature:** Viewers buy badges during live streams (e.g. Bronze, Silver, Gold, Platinum); creator earns revenue and can see badge analytics.

**Functions:** POST `/live/:liveId/badges`, GET badges/analytics; `badgesEnabled` on Account (Paid).

**Real-world examples:**

1. **Creator** — Runs a Q&A live; fans send Silver badges to get their question prioritized.
2. **Musician** — Acoustic live; fans send Gold badges as “tips”; creator thanks them by name.
3. **Coach** — Workshop live; attendees send badges to support; creator shares badge leaderboard at the end.
4. **Chef** — Cooking live; viewers send Platinum badge for a shout-out.
5. **Gamer** — Streams gameplay; community uses badges to show support; creator reviews badge analytics to see peak engagement.
6. **Artist** — Live drawing; fans send badges to request themes; creator picks from top supporters.

---

### 9.3 Gifts (Paid tier)

**Feature:** Viewers send virtual gifts during live (e.g. Hearts, Stars, Crowns); creator earns revenue; gift analytics available.

**Functions:** POST `/live/:liveId/gifts`, GET gifts/analytics; `giftsEnabled` on Account (Paid).

**Real-world examples:**

1. **Creator** — Birthday live; fans send Crowns and Hearts; creator reads out top senders.
2. **Musician** — Concert live; fans send Stars as tips; revenue goes toward next music video.
3. **Coach** — Live session; clients send Trophies to celebrate; creator uses analytics to report “community support” to partners.
4. **Chef** — Recipe live; viewers send Diamonds for “saved my dinner”; creator gives a shout-out.
5. **Educator** — Live class; students send gifts instead of physical tips; creator thanks them and continues teaching.
6. **Fitness creator** — Workout live; viewers send Hearts for motivation; creator dedicates the last set to top gift senders.

---

### 9.4 Bonuses (invite-only Reels)

**Feature:** Participate in invite-only Reel bonus programs (e.g. platform or brand campaigns); track bonus status and payouts.

**Functions:** GET `/creator/bonuses`; ReelBonus model; admin/invite flow creates bonuses.

**Real-world examples:**

1. **Creator** — Invited to “Summer Reels” bonus; posts reels with the hashtag and tracks earnings in Creator Bonuses.
2. **Brand campaign** — Creator joins a brand’s Reel challenge; bonus paid per qualified view.
3. **Platform program** — Creator is invited to “New creator boost”; reels get extra reach and bonus pay.
4. **Music campaign** — Creator uses a specific track in reels; music label pays bonus per use.
5. **Niche program** — Fitness creator invited to “Fitness month”; bonus for reels in that category.
6. **Holiday campaign** — Creator joins “Holiday gift guide” Reel bonus; tracks performance in Creator Bonuses page.

---

### 9.5 Branded content (tag brand, disclosure)

**Feature:** Tag a brand on a post and add a “Paid partnership” (or similar) disclosure for transparency.

**Functions:** Post create with `brandedContentBrandId`, `brandedContentDisclosure`; displayed in feed and post detail.

**Real-world examples:**

1. **Fashion creator** — Posts outfit with “Paid partnership with [Brand]”; disclosure shown below caption.
2. **Tech reviewer** — Posts phone review; tags brand and adds “Paid partnership” so followers know it’s sponsored.
3. **Chef** — Recipe post using a kitchen product; tags brand and discloses partnership.
4. **Fitness creator** — Posts workout wearing brand apparel; tags brand and adds disclosure.
5. **Beauty creator** — Makeup tutorial with branded products; tags brand and uses standard disclosure.
6. **Travel creator** — Hotel or airline post; tags brand and discloses partnership for compliance.

---

## Section 10: Creator insights & analytics (Paid tier)

### 10.1.1 Overview dashboard

**Feature:** View follower growth, content performance, earnings summary, and best times to post in one dashboard.

**Functions:** GET `/analytics/insights` (CREATOR allowed when Paid); BusinessInsights UI; Creator profile “Insights” link.

**Real-world examples:**

1. **Creator** — Checks dashboard weekly to see follower trend and which reels drove growth.
2. **Coach** — Reviews “Best time to post” to schedule content when audience is most active.
3. **Musician** — Uses earnings summary to report to label or manager.
4. **Chef** — Compares performance of recipe reels vs story polls to decide content mix.
5. **Educator** — Tracks which topics get most saves and shares to plan the next course.
6. **Fashion creator** — Uses demographics to pitch brands (“60% of my audience is 18–24”).

---

### 10.1.2 Audience demographics

**Feature:** See age, gender, location, and other demographic breakdowns of followers and viewers.

**Functions:** Analytics service demographics; BusinessInsights UI.

**Real-world examples:**

1. **Creator** — Notices most followers are in India; schedules lives in IST and considers local brands.
2. **Coach** — Sees 70% women 25–44; tailors messaging and partnerships to that segment.
3. **Musician** — Top cities are London and NYC; plans tour stops accordingly.
4. **Chef** — Majority in US; focuses recipe content on US ingredients and seasons.
5. **Brand ambassador** — Uses demographics in media kit to show brands who they reach.
6. **Educator** — Sees many students in Asia; adds subtitles and considers time zones for live classes.

---

### 10.1.3 Content performance (top posts, reels, stories)

**Feature:** See top posts, reels, and stories by reach, engagement, saves, and shares.

**Functions:** Analytics content endpoints; BusinessInsights UI.

**Real-world examples:**

1. **Creator** — Identifies top 5 reels and creates a “Part 2” series to repeat success.
2. **Coach** — Sees that “Monday motivation” posts get most saves; doubles down on that format.
3. **Chef** — Notices quick recipe reels outperform long tutorials; shifts content format.
4. **Musician** — Finds which song snippet got most shares and uses it in the next single’s promo.
5. **Travel creator** — Top posts are “hidden gems”; creates a highlight and more of that theme.
6. **Artist** — Process reels get more comments; does more “how I made this” content.

---

## Section 11: Content tools

### 11.1 Trending audio

**Feature:** Discover trending audio clips to use in reels and stories for better reach.

**Functions:** GET `/creator/trending-audio`; CreatorTools “Trending audio” section.

**Real-world examples:**

1. **Creator** — Uses top trending song in a reel and sees 3x usual views.
2. **Comedian** — Uses a viral dialogue clip as a punchline in a sketch reel.
3. **Chef** — Pairs a trending beat with a “1-minute recipe” reel.
4. **Fitness creator** — Uses trending workout track for a challenge reel.
5. **Educator** — Uses a trending “explainer” style audio for a tip reel.
6. **Fashion creator** — Uses trending sound for a “Get ready with me” reel.

---

### 11.2 Content ideas

**Feature:** Get topic and format ideas based on niche (and optional parameters) to reduce creator block.

**Functions:** GET `/creator/content-ideas` (optional niche); CreatorTools “Content ideas” section.

**Real-world examples:**

1. **Coach** — Asks for ideas in “Productivity”; gets “5 morning habits”, “Time-blocking tips”, “Burnout signs”.
2. **Chef** — Gets “One-pot meals”, “Meal prep Sunday”, “5-minute breakfast” for Food niche.
3. **Fitness creator** — Gets “Home workout no equipment”, “Stretch routine”, “Myth vs fact” ideas.
4. **Travel creator** — Gets “Packing hacks”, “Budget tips”, “Solo travel safety” ideas.
5. **Artist** — Gets “Speed paint”, “Materials tour”, “Commission process” ideas.
6. **Tech creator** — Gets “Unboxing”, “Setup tour”, “Comparison” ideas.

---

### 11.3 Content calendar

**Feature:** View a month calendar of scheduled and published content; plan and avoid gaps.

**Functions:** GET `/creator/content-calendar?month=YYYY-MM`; CreatorContentCalendar UI.

**Real-world examples:**

1. **Creator** — Opens March; sees 3 posts and 2 reels scheduled; adds a story series for the empty week.
2. **Coach** — Plans “Theme of the week” (Monday post, Wednesday reel, Friday live) in the calendar.
3. **Chef** — Schedules recipe posts for Tue/Thu and “Weekend baking” for Saturday.
4. **Musician** — Marks release day and builds content around it (teaser, release, behind the scenes).
5. **Educator** — Aligns calendar with syllabus (new module = announcement post + recap reel).
6. **Brand ambassador** — Maps campaign dates to calendar so sponsored posts don’t clash with personal content.

---

### 11.4.1–11.4.3 Schedule posts, stories, reels

**Feature:** Set a date and time for a post, story, or reel to publish automatically.

**Functions:** Create with `isScheduled`, `scheduledFor` in post, story, reel services; feed excludes not-yet-due scheduled items.

**Real-world examples:**

1. **Creator** — Schedules a “Good morning” post for 7am every day for a week.
2. **Coach** — Schedules Monday motivation post for Sunday 8pm so it’s first thing Monday.
3. **Chef** — Schedules recipe reel for lunch hour (12pm) when food content peaks.
4. **Musician** — Schedules “New single out now” post for release time (midnight).
5. **Travel creator** — On a flight, schedules 3 stories for the next day from the trip.
6. **Educator** — Schedules “Class reminder” story for 1 hour before each live class.

---

### 11.4.4 Best time to post

**Feature:** Get recommendations for when your audience is most active so you can schedule for maximum reach.

**Functions:** GET `/creator/best-time` (from analytics events); CreatorTools “Best time” section (Paid).

**Real-world examples:**

1. **Creator** — Best time is 7–9pm; moves all posts to that window.
2. **Coach** — Best times are Tuesday and Thursday evenings; schedules key content then.
3. **Chef** — Lunch (12–1pm) and dinner (6–7pm) peaks; schedules recipe content accordingly.
4. **Musician** — Friday evening is best; schedules single and tour announcements for then.
5. **Fitness creator** — 6am and 6pm peaks; schedules morning workout reels and evening tips.
6. **Educator** — Sunday evening is best; schedules “Week ahead” and assignment reminders then.

---

## Section 12: Collaboration tools

### 12.1 Collab posts (co-author)

**Feature:** Create a post with another creator; it appears on both profiles (e.g. “With @other”).

**Functions:** Post create with `coAuthorId`; list by account returns posts where account is author or co-author.

**Real-world examples:**

1. **Two chefs** — Collab post: “Our fusion recipe”; appears on both profiles and drives cross-follows.
2. **Fitness + nutrition creators** — Collab post: “Workout + meal plan”; both audiences see it.
3. **Musician + producer** — Collab post for a new track; both promote to their followers.
4. **Fashion + beauty creators** — Collab “Outfit + makeup” post for a brand campaign.
5. **Travel creators** — Collab “Trip together” post; each tags the other, shared audience.
6. **Educator + industry expert** — Collab “Q&A” or “Interview” post for credibility.

---

### 12.2 Creator network (connect, list, accept)

**Feature:** Send connection requests to other creators; accept incoming; list your creator network.

**Functions:** GET/POST `/creator/network`, POST `accept/:id`; CreatorConnection model; CreatorNetwork UI.

**Real-world examples:**

1. **Creator** — Sends connection request to a creator in the same niche for future collabs.
2. **Chef** — Accepts request from another food creator; they plan a “Cook-off” live.
3. **Musician** — Browses network to find a producer for a collab track.
4. **Coach** — Connects with other coaches to cross-promote and share best practices.
5. **Fashion creator** — Builds network of stylists and photographers for shoot collabs.
6. **Educator** — Connects with other teachers to co-host webinars and share resources.

---

### 12.3 Brand marketplace (campaigns, apply, applications)

**Feature:** Browse brand campaigns (briefs, deliverables, compensation); apply; track your applications.

**Functions:** GET `/creator/campaigns`, POST `/creator/campaigns/:id/apply`, GET campaign-applications; CreatorCampaigns UI.

**Real-world examples:**

1. **Creator** — Finds “Summer skincare” campaign; applies with portfolio and rate; brand reviews and hires.
2. **Chef** — Applies to “Kitchen gadget” campaign; submits recipe reels; gets shortlisted.
3. **Fitness creator** — Applies to “Sportswear” campaign; shares demographics and past branded work.
4. **Travel creator** — Applies to “Destination” campaign; shares reach and previous travel content.
5. **Educator** — Applies to “Ed-tech” campaign; shares audience and course experience.
6. **Musician** — Applies to “Music festival” campaign; shares streaming stats and past partnerships.

---

## Section 13: Creator inbox

### 13.1 Categorized inbox (labels: Brand, Fan, Collaborator, etc.)

**Feature:** Assign labels to conversations (e.g. BRAND, FAN, COLLABORATOR, GENERAL) and filter inbox by label.

**Functions:** GET `/messages/threads?label=...`; POST/DELETE thread labels; Messages UI filter tabs.

**Real-world examples:**

1. **Creator** — Labels a thread “BRAND” when a brand DMs; filters to “Brand” to reply to business first.
2. **Coach** — Labels paying clients “FAN” or “Client”; keeps them separate from general DMs.
3. **Musician** — Labels collab discussions “COLLABORATOR”; finds them quickly when planning.
4. **Chef** — Labels press and events “BRAND”; labels recipe questions “FAN”.
5. **Educator** — Labels student questions “FAN”; labels school/admin “BRAND”.
6. **Artist** — Labels commission threads “BRAND”; labels fan art “FAN”.

---

### 13.2 Quick replies (templates)

**Feature:** Create reusable message templates with shortcuts (e.g. “/rates”, “/booking”) and insert them in DMs.

**Functions:** GET/POST/PATCH/DELETE `/creator/quick-replies`; MessageTemplate model; CreatorQuickReplies UI.

**Real-world examples:**

1. **Creator** — “/rates” → “Thanks for your interest! Here are my partnership tiers: …”
2. **Coach** — “/booking” → “You can book a call here: [link]. I have slots Tue/Thu.”
3. **Consultant** — “/thanks” → “Thanks for reaching out! I’ll reply within 24 hours.”
4. **Artist** — “/commissions” → “Commissions are open! Process: 1) Brief 2) Deposit 3) Draft…”
5. **Chef** — “/recipe” → “That recipe is in my highlight ‘Recipes’ or in my ebook [link].”
6. **Educator** — “/office” → “Office hours are Wed 4–5pm. Here’s the Zoom link: …”

---

### 13.3 Automated responses (keyword, first message, after hours, vacation)

**Feature:** Set rules that auto-reply to DMs: by keyword, on first message, after hours, or when on vacation.

**Functions:** GET/POST/PATCH/DELETE `/creator/auto-responses`; AutoResponseRule (KEYWORD, FIRST_MESSAGE, AFTER_HOURS, VACATION).

**Real-world examples:**

1. **Creator** — Keyword “collab” → “Thanks! Send your brief and budget to collab@…”
2. **Coach** — First message → “Hi! For coaching, see [link]. For quick questions, I reply within 24h.”
3. **Consultant** — After hours (6pm–9am) → “Thanks for your message. I’ll reply during business hours.”
4. **Creator** — Vacation rule → “I’m away until [date]. For urgent brand inquiries, email …”
5. **Artist** — Keyword “price” → “Commission prices start at $X. Full list: [link].”
6. **Educator** — Keyword “syllabus” → “Syllabus and materials are here: [link].”

---

### 13.4 Message labels (add/remove per thread)

**Feature:** Add or remove labels on a conversation to keep inbox organized and filterable.

**Functions:** POST/DELETE `/messages/threads/:peerId/labels`; Messages UI add/remove label.

**Real-world examples:**

1. **Creator** — Adds “BRAND” to a new brand thread; later adds “DONE” when deal is closed.
2. **Coach** — Labels “Trial” for new leads; moves to “Client” when they subscribe.
3. **Musician** — Labels “Tour inquiry” for venue DMs; “Press” for media.
4. **Chef** — Labels “Recipe request” for fan DMs; “Partnership” for brands.
5. **Educator** — Labels “Assignment” for homework questions; “Admin” for school staff.
6. **Artist** — Labels “Commission” for paid work; “Fan” for general support.

---

## Section 14: Creator safety & privacy

### 14.1 Advanced comment filter (sensitivity)

**Feature:** Set comment filter sensitivity (LOW / MEDIUM / HIGH) so more aggressive filtering hides or holds comments.

**Functions:** Account `commentFilterSensitivity`; updateAccount; HiddenWords / Settings UI.

**Real-world examples:**

1. **Creator** — Sets HIGH to hide slurs and hate; keeps MEDIUM for mild spam.
2. **Public figure** — Uses HIGH after a viral post to reduce trolling.
3. **Educator** — Uses MEDIUM so students can discuss but inappropriate words are hidden.
4. **Coach** — Uses LOW to allow honest feedback but still filter obvious spam.
5. **Artist** — Uses HIGH on controversial pieces to keep discussion constructive.
6. **Family creator** — Uses HIGH to protect kids from inappropriate comments.

---

### 14.2 Harassment protection (auto-restrict)

**Feature:** When the same account is reported by the same user multiple times (e.g. ≥3), the system can auto-restrict the reported user toward the reporter (e.g. comments hidden by default).

**Functions:** report.service logic (e.g. 3+ reports → create Restrict); backend-driven.

**Real-world examples:**

1. **Creator** — A troll keeps commenting; creator reports 3 times; troll gets auto-restricted toward them.
2. **Public figure** — Stalker keeps messaging; repeated reports trigger restriction and reduce contact.
3. **Educator** — Student reports a bully 3 times; bully’s comments to that student are restricted.
4. **Coach** — Client reports an abusive ex 3 times; ex’s ability to interact is limited.
5. **Artist** — Someone repeatedly posts negative comments; after 3 reports, their comments are hidden by default.
6. **Brand ambassador** — Competitor’s fake account is reported multiple times; restriction limits their reach to the creator.

---

### 14.3 Blocked words (comments and/or DMs)

**Feature:** Maintain a list of hidden/blocked words; optionally apply to comments only, DMs only, or both. Comments/DMs containing these words can be hidden or filtered.

**Functions:** Account `hiddenWords`, `hiddenWordsCommentFilter`, `hiddenWordsDMFilter`; HiddenWords UI.

**Real-world examples:**

1. **Creator** — Adds “DM for price”, “Link in bio for free” to reduce comment spam.
2. **Coach** — Adds competitor names and “refund” in comments to avoid public drama.
3. **Educator** — Adds inappropriate words so they’re filtered in class-related posts.
4. **Artist** — Adds “cheap”, “overpriced” in comments to reduce negativity.
5. **Brand ambassador** — Adds “scam”, “fake” to protect brand reputation in comments.
6. **Public figure** — Adds slurs and threats in both comments and DMs for safety.

---

## Section 15: New innovative features

### 15.1 Nearby messaging (radius, daily limit, paid extra)

**Feature:** Post or message to people within a radius (e.g. for local events); 1 free nearby post per day for Paid; extra posts can be charged (e.g. $0.50).

**Real-world examples:**

1. **Local musician** — Posts “Gig tonight at [venue]” to nearby users to fill the room.
2. **Chef** — Promotes “Pop-up dinner this Saturday” to people within 5 km.
3. **Coach** — Promotes “Free workshop at [location]” to nearby users.
4. **Artist** — Promotes “Gallery opening tonight” to local art lovers.
5. **Fitness creator** — Promotes “Outdoor bootcamp this Sunday” to nearby users.
6. **Educator** — Promotes “Free coding workshop at library” to nearby students.

---

### 15.2 SOS safety mode

**Feature:** Trigger SOS and share live location with trusted contacts in emergencies.

**Real-world examples:**

1. **Travel creator** — Uses SOS when feeling unsafe in an unfamiliar area; contacts get location.
2. **Creator at event** — Triggers SOS if harassed; security or friends can locate them.
3. **Solo creator** — Uses SOS during late-night shoot; family can see live location.
4. **Educator** — Uses SOS when traveling to a new school; office has real-time location.
5. **Coach** — Uses SOS when meeting a new client in an unknown place.
6. **Musician** — Uses SOS after a late gig in a new city; bandmates get location.

---

### 15.3 Real-time translation (Paid tier)

**Feature:** Enable live translation of comments or messages so creators can engage with a global audience.

**Real-world examples:**

1. **Creator** — Translates comments from Spanish to English and replies in both languages.
2. **Educator** — Uses translation so international students can follow live Q&A.
3. **Musician** — Translates fan messages from multiple languages during a live.
4. **Travel creator** — Reads and replies to comments in local language during a trip.
5. **Coach** — Offers sessions in one language but uses translation for written feedback from non-native clients.
6. **Brand ambassador** — Responds to global fan comments in their language via translation.

---

### 15.4 Screenshot / download protection (Paid tier)

**Feature:** Reduce or deter unauthorized screenshots and downloads of stories or posts (e.g. for premium or exclusive content).

**Real-world examples:**

1. **Creator** — Protects subscriber-only content from easy screenshot sharing.
2. **Educator** — Protects paid course materials shown in stories.
3. **Artist** — Protects unreleased artwork from being saved and reposted.
4. **Coach** — Protects worksheets and templates shared in stories.
5. **Musician** — Protects snippet of unreleased song in a story.
6. **Consultant** — Protects slide decks and templates shared in posts.

---

### 15.5 Proximity alert

**Feature:** Get alerts when a chosen contact (e.g. family, friend) is within a set distance—e.g. for meet-ups or safety.

**Real-world examples:**

1. **Creator** — Gets alert when a collab partner arrives at the shoot location.
2. **Travel creator** — Gets alert when a friend is nearby in the same city.
3. **Coach** — Gets alert when a client arrives for an in-person session.
4. **Musician** — Gets alert when bandmates are near the venue for load-in.
5. **Parent creator** — Gets alert when a child is near home after school.
6. **Event creator** — Gets alert when VIP guests are near the venue.

---

### 15.6 Voice commands (Paid tier)

**Feature:** Use advanced voice commands to control the app (e.g. “Post my last story to highlights”, “Schedule this for 7am”).

**Real-world examples:**

1. **Creator** — While driving: “Add to highlight ‘Travel’” without touching the phone.
2. **Chef** — Hands busy cooking: “Reply to last message with ‘/thanks’.”
3. **Fitness creator** — During workout: “Schedule this reel for 6pm.”
4. **Educator** — While presenting: “Send reminder to class group.”
5. **Musician** — In studio: “Post ‘Recording in progress’ to story.”
6. **Coach** — On the go: “Show my calendar for this week.”

---

### 15.7 Lifestyle streaks

**Feature:** Create and log lifestyle streaks (e.g. “Meditation”, “Workout”, “Reading”) to build habits and share progress.

**Real-world examples:**

1. **Fitness creator** — “30-day workout” streak; logs daily and shares milestone stories.
2. **Coach** — “Morning journal” streak; shares tips each day and encourages followers to join.
3. **Chef** — “Cook at home” streak; logs daily meals and shares one recipe per week.
4. **Educator** — “Read 20 min” streak; students join and log; leaderboard in class.
5. **Writer** — “500 words/day” streak; shares progress and snippets.
6. **Musician** — “Practice 1 hour” streak; shares practice clips and milestones.

---

## Section 16: Free vs Paid tier (summary)

| Feature | Creator Free | Creator Paid |
|--------|---------------|--------------|
| **MOxE Personal + basic social** | ✅ All features | ✅ All features |
| **Blue Verification Badge** | ❌ | ✅ (when verified) |
| Live, schedule, 5 links, basic analytics | ✅ | ✅ |
| Subscriptions (tiers, welcome, subscriber content) | ❌ | ✅ |
| Live badges & gifts | ❌ | ✅ |
| Full analytics (30d, demographics, best time) | ❌ | ✅ |
| Real-time translation | ❌ | ✅ |
| Voice commands, DRM, storage 5GB | ❌ | ✅ |
| Upgrade path | — | PATCH `/accounts/:id/upgrade` tier THICK |

**Implementation note:** MOxE uses the **Blue Verification Badge** for paid, verified creators (not a gold star). The badge is shown when the account is verified and on the **Creator Paid (THICK)** tier, confirming the account is authentic and belongs to the person or brand it represents.

---

## Quick reference: where things live in the app

- **Personal + basic social in Creator:** Same as Personal: profile edit, Settings (privacy, notifications, blocked, hidden words), Feed, CreatePost/CreateStory/CreateReel, Saved, Close Friends, Highlights, Archive, Messages.
- **Creator setup:** `/settings/convert-to-creator` (ConvertToCreator), Edit Profile (Creator fields: category, contact, links, action buttons).
- **Subscriptions:** `/creator/subscription-tiers`, `/creator/subscribers`; Subscribe/Unsubscribe and “Subscribers only” in create flows; live badges/gifts in live flows.
- **Insights:** `/business/insights` (Creator allowed when Paid); “Insights” link on Creator profile.
- **Content tools:** `/creator/tools` (trending audio, content ideas, best time), `/creator/content-calendar`.
- **Collaboration:** CreatePost (co-author), `/creator/network`, `/creator/campaigns`.
- **Inbox:** Messages (labels, filter by label), `/creator/quick-replies`, `/creator/auto-responses`.
- **Safety:** Settings → Hidden words (sensitivity + blocked words); harassment protection is backend (report flow).
- **New features:** Nearby, SOS, Translation, DRM, Proximity, Voice, Streaks (each has its own UI/routes as implemented).

This document is the single reference for **every** feature, sub-feature, function, sub-function, component, and sub-component of the MOxE Creator account, with **Personal and basic social included**, **Free vs Paid** clearly defined, and the **Blue Verification Badge** (not gold) used for paid, verified creators.
