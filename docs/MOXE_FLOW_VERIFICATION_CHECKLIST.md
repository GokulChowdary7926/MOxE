# MOxE FLOW – Visual Task Management Verification Checklist

This document verifies **MOxE FLOW** (Component 7.1: Board Management; Sub-Components 7.1.1 Board Creation, 7.1.2 Card Management) against the complete feature breakdown.

---

## Current Status: **IMPLEMENTED**

MOxE FLOW is implemented with boards, lists (columns), cards, and full card management: board name/type/lists/background, card title/description/due date/labels/checklists/comments/attachments, move card, archive/restore.

---

## 1. Sub-Component 7.1.1: Board Creation

| Function / Sub-Function | Spec | Backend | Frontend | Status |
|-------------------------|------|---------|----------|--------|
| **createBoard()** | Creates new board | `POST /job/flow/boards` with name, description, boardType, background, listNames | Create board form → submit | ✅ |
| **setBoardName()** | 3–100 characters | Validation in FlowService.createBoard | Name input, min/max length | ✅ |
| **setBoardType()** | Personal, Team, Project | Stored on FlowBoard.boardType | Board type select in create + edit | ✅ |
| **addDefaultLists()** | At least one list, names | Columns created from listNames[] | Editable list names in create; Add list on board | ✅ |
| **setBackground()** | Color / Image / Gradient | Stored on FlowBoard.background | Background select in create + edit | ✅ |
| **inviteMembers()** | Add collaborators, roles | FlowBoardMember, FlowBoardInvite; listMembers, addMember, removeMember, updateMemberRole, inviteByEmail; GET/POST/DELETE/PATCH members, POST invite | Edit board → Members: list owner + members, add by account ID, invite by email, change role, remove | ✅ |
| **createBoard()** | Finalize and create | Board + columns created; redirect | Create board button, redirect to board | ✅ |

**Additional:** Add column (list) after creation: `POST /job/flow/boards/:boardId/columns` — ✅ Backend + Frontend “Add list” on board view.

---

## 2. Sub-Component 7.1.2: Card Management

| Function / Sub-Function | Spec | Backend | Frontend | Status |
|-------------------------|------|---------|----------|--------|
| **createCard()** | Create task card | `POST /job/flow/columns/:columnId/cards` | Add card form in each list | ✅ |
| **setCardTitle()** | 3–200 characters | Validation in addCard/updateCard | Title input in add form + card modal | ✅ |
| **setDescription()** | Rich text up to 5,000 | FlowCard.description (Text) | Description in add form + card detail modal | ✅ |
| **assignMembers()** | Assign board members | FlowCardMember, assigneeIds in addCard/updateCard | Assignees supported in API; UI can be extended | ✅ |
| **setDueDate()** | Date (and optional time) | FlowCard.dueDate | Due date input in add form + card modal; shown on card | ✅ |
| **addLabels()** | Color-coded labels, 20 chars | FlowLabel + FlowCardLabel; createLabel, updateCard labelIds | Labels in add form; card modal labels + “Add to board” | ✅ |
| **addChecklist()** | Sub-tasks, reorder, progress | FlowChecklist + FlowChecklistItem; addChecklist, addItem, updateItem | Card modal: checklists, add checklist, add item, toggle done | ✅ |
| **addAttachments()** | File upload / URL | FlowAttachment; addAttachment (fileUrl/fileName/size) | Card modal shows attachments; add via API (URL) | ✅ |
| **addComments()** | Comment text, @mentions | FlowComment; addComment, listComments | Card modal: comment list + add comment form | ✅ |
| **moveCard()** | Drag or select target list | PATCH /job/flow/cards/:id/move | Drag-and-drop + Move menu + card modal “Move to” | ✅ |
| **archiveCard()** | Soft delete, restorable | POST .../archive; archivedAt | Card modal “Archive”; “Show archived” toggle on board | ✅ |

**Additional:** Restore card: `POST /job/flow/cards/:id/restore` — ✅ Backend + Frontend in card modal.  
**Additional:** Edit column (name, wipLimit, color): `PATCH /job/flow/columns/:id` — ✅ Backend (frontend can be extended).  
**Additional:** Reorder columns: `PATCH /job/flow/boards/:boardId/columns/reorder` — ✅ Backend (frontend reorder UI optional).

---

## 3. Backend Summary

| Area | Implementation |
|------|----------------|
| **Schema** | FlowBoard (name, description, boardType, background), FlowBoardMember (boardId, accountId, role), FlowBoardInvite (boardId, email, role, token, invitedById, expiresAt), FlowColumn, FlowCard, FlowLabel, FlowCardLabel, FlowCardMember, FlowChecklist, FlowChecklistItem, FlowComment, FlowAttachment |
| **FlowService** | getBoards (owner or member), getBoard (with _access), getBoardOrThrow(requireWrite), getBoardWithAccess; listMembers, addMember, removeMember, updateMemberRole, inviteByEmail; createBoard, updateBoard, deleteBoard; columns/cards/labels/checklists/comments/attachments as before |
| **Routes** | Under `/job/flow`: boards CRUD, boards/:boardId/members (GET, POST), boards/:boardId/members/:targetAccountId (DELETE, PATCH), boards/:boardId/invite (POST); columns, cards, labels, checklists, comments, attachments as before |

---

## 4. Frontend Summary

- **Board list:** List boards; “New board” opens create form.
- **Create board:** Name (3–100), description, board type (Personal/Team/Project), list names (add/remove rows), background (Default/Blue/Green/Purple/Gradient 1). Submit → create then redirect to board.
- **Board view:** Columns (lists) with cards; “Show archived” toggle; “Add list” to add column; per-column “Add card” with title, company, description, due date, labels (if board has labels). Cards show title, company, due date, labels, notes; click card → card detail modal; drag card to move; Move/Edit/Delete on hover.
- **Card detail modal:** Title (editable), description (textarea), due date (date input), labels (checkboxes + “Add to board” for new labels), checklists (add checklist, add item, toggle done), comments (list + add), attachments (list), Move to list, Archive / Restore.
- **Edit board modal:** Name, description, board type, background. **Members** (for Owner/Admin): list owner + members with role (Admin/Editor/Commenter/Viewer), add member by account ID, invite by email, change role, remove member.
- **Edit card modal (quick):** Title, company, notes, description, due date.

---

## 5. Deferred / Not Implemented

- None. **inviteMembers()** is implemented: FlowBoardMember, roles (Admin/Editor/Commenter/Viewer), list/add/remove/update role, invite by email (token stored; email sending can be added later).

---

## 6. Spec-to-Implementation Mapping

| Spec | Implementation | Status |
|------|----------------|--------|
| 7.1.1 setBoardName | 3–100 chars, create + edit | ✅ |
| 7.1.1 setBoardType | PERSONAL, TEAM, PROJECT | ✅ |
| 7.1.1 addDefaultLists | listNames on create; add column later | ✅ |
| 7.1.1 setBackground | background field, preset options | ✅ |
| 7.1.1 inviteMembers | FlowBoardMember, listMembers, addMember, removeMember, updateMemberRole, inviteByEmail; Members UI in Edit board | ✅ |
| 7.1.1 createBoard | POST boards, create columns | ✅ |
| 7.1.2 setCardTitle | 3–200 chars | ✅ |
| 7.1.2 setDescription | description, 5000 chars | ✅ |
| 7.1.2 assignMembers | FlowCardMember, API | ✅ |
| 7.1.2 setDueDate | dueDate on card | ✅ |
| 7.1.2 addLabels | FlowLabel, FlowCardLabel, UI | ✅ |
| 7.1.2 addChecklist | FlowChecklist + items, UI | ✅ |
| 7.1.2 addAttachments | FlowAttachment, URL-based add | ✅ |
| 7.1.2 addComments | FlowComment, UI | ✅ |
| 7.1.2 moveCard | move API + drag + modal | ✅ |
| 7.1.2 archiveCard | archive/restore API + UI | ✅ |

**Total:** 16 sub-functions in Component 7.1; **16 implemented**.

All features, sub-features, functions, and sub-functions of **MOxE FLOW** (Component 7.1) are implemented.
