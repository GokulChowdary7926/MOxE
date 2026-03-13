# Messaging Blocked Users – Feature Specification

Premium feature: allow premium (Star/Thick) users to send a limited number of messages to users who have blocked them, with strong safety controls.

## Strengths of Design
- **Recipient-first** controls (re-block, report, view)
- **Limited scope**: 2 recipients per 28-day period; 14-day messaging window per grant
- **Safety**: re-block, reporting, character limits (150 base, optional paid extension)
- **Graduated consequences**: Lifestyle strikes → warning → suspend feature → revoke premium

## Data Model (see Prisma schema)

Run `npx prisma migrate dev --name add_premium_blocked_messaging` in `BACKEND` when the database is available to create the new tables.

- **PremiumMessageGrant** – Tracks each “grant” (sender may message this blocked recipient this period).
- **PremiumBlockedMessage** – Each message sent via this feature (content, character count, paid extension).
- **PremiumMessageRecipientAction** – Recipient actions: viewed, reblocked, reported (with reason/details).
- **LifestyleStrike** – Strikes for abuse (PREMIUM_MESSAGE_ABUSE); used for progressive consequences.

## Prerequisite Checks (Backend)

`canMessageBlockedUser(senderId, recipientId)`:

1. Sender is premium (Account.subscriptionTier in [STAR, THICK]).
2. Recipient has blocked sender (Block where blockerId = recipientId, blockedId = senderId).
3. Sender has not used both grants this 28-day period (count active grants in current period < 2).
4. No re-block cooldown for this pair (recipient did not re-block within cooldown window).
5. If grant exists for this recipient, remaining days in 14-day window still available.

## Message Sending Flow

1. User tries to message blocked user → frontend shows premium upsell if not premium.
2. Premium user sees warning (one message, 150 chars, “remaining X messages this period | Y days left”).
3. User composes (character counter); optional paid extension (+150 chars).
4. Backend validates all checks, stores in PremiumBlockedMessage, updates grant.
5. Recipient gets notification with special UI: “Message from someone who blocked you”, preview, [View] [Re-block] [Report].

## Recipient Experience

- **View**: Full message; options Reply, Unblock, Re-block, Report.
- **Re-block**: 30-day cooldown; sender notified “Your message was re-blocked.”
- **Report**: reason/details stored; can trigger abuse detection and strikes.

## Safety

- **Abuse detection**: Volume, abusive keywords, recipient report rate → risk score; auto-flag and throttle if threshold exceeded.
- **Strike system**: 1 = warning; 2 = suspend premium messaging 30 days; 3 = revoke premium status.

## API Endpoints

- `GET /api/premium/blocked-messages/check?recipientId=` – canSend, reason?, remainingGrants, remainingDays, characterLimit.
- `POST /api/premium/blocked-messages` – body: recipientId, content, paidExtension; returns messageId, status, expiresAt.
- `POST /api/premium/blocked-messages/:id/action` – body: action (view | reblock | unblock | report), reason?; returns success, cooldownUntil?.
- `GET /api/premium/blocked-messages/grants` – list sender’s active grants and messages.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User upgrades mid-period | Grants follow current period; no backfill. |
| Recipient blocks during thread | Normal thread frozen; premium path separate. |
| Grant expires mid-conversation | Read-only; no new premium messages. |
| User downgrades | Pending messages delivered; cannot send new. |
| Recipient deletes account | Send fails; grant can be freed for period. |

## UI Components (Frontend)

- **PremiumBlockedMessageComposer** – recipient, characterLimit, extend, send, warning, stats (remainingGrants, remainingDays).
- **BlockedMessageView** – message, sender, onView, onReblock, onUnblock, onReport, showPreview.

## Monitoring

- Daily: sent, viewed, reblocked, reported, paid extension conversion.
- Abuse: flagged senders, report rate, strike rate.
- Retention: unblocks after message, churn prevented.
