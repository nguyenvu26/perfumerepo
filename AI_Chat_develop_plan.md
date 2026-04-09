# Chat System Development Plan (AI + User Chat)

**Project:** AI-Powered Perfume Sales & Personalized Consultation System
**Scope:**

* User ↔ User Chat (Customer, Admin, Staff)
* AI Chat (Customer AI + Admin AI + Staff uses Customer AI)
* Hybrid architecture: **WebSocket (user chat) + HTTP (AI chat)**

---

# 1. Core Feature Definition

## 1.1 Roles & Chat Capabilities

### Customer

* Chat with Admin
* Chat with AI (Perfume Consultant)

---

### Admin

* Chat with Customer
* Chat with Staff
* Chat with AI (Marketing Assistant)

---

### Staff

* Chat with Admin
* **Use Customer AI (Perfume Consultant)**

---

## 1.2 Chat Matrix

| From     | To                              |
| -------- | ------------------------------- |
| Customer | Admin, AI (Perfume)             |
| Admin    | Customer, Staff, AI (Marketing) |
| Staff    | Admin, AI (Perfume)             |

---

# 2. Conversation Types (Core)

System supports exactly **4 conversation types**:

```id="chat-types"
CUSTOMER_ADMIN
CUSTOMER_AI
ADMIN_STAFF
ADMIN_AI
```

---

## Special Rule

* Staff uses **CUSTOMER_AI type**
* BUT UI is placed inside **Admin Dashboard (internal tool)**

---

# 3. Architecture Overview

## 3.1 Communication Model

```text
User ↔ User Chat      → WebSocket (Realtime)
User ↔ AI Chat        → HTTP API (Request–Response)
```

---

## 3.2 System Components

```text
Frontend
   ├── Customer Website
   │     └── Chat Widget (AI + Admin)
   │
   ├── Admin Dashboard
   │     ├── Customer Chats
   │     ├── Staff Chats
   │     ├── AI Marketing Chat
   │     └── AI Perfume (internal tool for staff)
   │
Backend (NestJS)
   ├── Chat Module (WebSocket)
   ├── AI Module (HTTP)
   ├── Database (PostgreSQL + Prisma)
```

---

# 4. UI/UX Design

## 4.1 Customer UI

### Chat Widget (Floating)

* Located at homepage (bottom-right)
* Supports:

  * Chat with AI (primary)
  * Chat with Admin (secondary)

### Features

* quick action buttons:

  * Recommend perfume
  * Under 1 million
  * For summer
* product cards inside chat
* lightweight interaction

---

## 4.2 Admin Dashboard

### Inbox Structure

```id="admin-ui"
Inbox
 ├── Customer Chats
 ├── Staff Chats
 ├── AI Marketing Assistant
 └── AI Perfume Consultant (internal use)
```

---

## 4.3 Staff UI

* Uses **Admin Dashboard UI**
* Can:

  * chat with Admin
  * use AI Perfume Consultant (same as customer AI)

---

# 5. Database Design

## 5.1 Conversation

```id="conv"
id
type
createdAt
updatedAt
```

---

## 5.2 ConversationParticipant

```id="participant"
id
conversationId
userId
role
```

---

## 5.3 Message

```id="msg"
id
conversationId
senderId
senderType (USER | AI)
type (TEXT | PRODUCT_CARD | SYSTEM)
content (JSON)
createdAt
```

---

# 6. Backend Development Plan

---

# Phase 1 — Database

* Define Prisma schema
* Create migrations
* Seed sample conversations

---

# Phase 2 — Core Chat Module

## APIs

```id="api"
POST /conversations
GET /conversations
GET /messages
POST /messages
```

---

## Services

### ConversationService

* create conversation
* fetch conversations by user

---

### MessageService

* save message
* fetch messages (pagination)

---

### ChatService

* route messages
* handle logic for:

  * user chat
  * AI chat

---

# Phase 3 — WebSocket (User Chat Only)

## Events

Client → Server

```id="ws-client"
joinConversation
sendMessage
typing
markAsRead
```

Server → Client

```id="ws-server"
messageReceived
userTyping
messageRead
```

---

## Responsibilities

* manage connections
* join rooms
* broadcast messages

---

# Phase 4 — AI Module (HTTP-based)

---

## Endpoints

### Customer AI & Staff AI (same service)

```id="ai-customer"
POST /ai/customer-chat
```

---

### Admin AI

```id="ai-admin"
POST /ai/admin-chat
```

---

## AI Services

### PerfumeConsultantService

Used by:

* Customer
* Staff

Responsibilities:

* detect intent
* query product database
* generate recommendations

---

### MarketingAdvisorService

Used by:

* Admin

Responsibilities:

* analyze business data
* suggest strategies

---

# 7. AI Request/Response

## Request

```id="ai-req"
{
  "message": "...",
  "conversationId": "...",
  "context": {
    "userProfile": {}
  }
}
```

---

## Response

```id="ai-res"
{
  "type": "PRODUCT_CARD",
  "data": [
    {
      "productId": "...",
      "reason": "..."
    }
  ]
}
```

---

# 8. Message Flow

---

## 8.1 User Chat

```id="flow-user"
Client → WebSocket → Gateway
        → ChatService
        → Save DB
        → Broadcast
```

---

## 8.2 AI Chat

```id="flow-ai"
Client → HTTP → AI Controller
        → AI Service
        → Save message
        → Return response
```

---

# 9. Permissions

| Role     | Customer | Admin | Staff | AI               |
| -------- | -------- | ----- | ----- | ---------------- |
| Customer | ❌        | ✅     | ❌     | ✅                |
| Admin    | ✅        | ❌     | ✅     | ✅                |
| Staff    | ❌        | ✅     | ❌     | ✅ (Perfume only) |

---

# 10. AI Agent Tasks (for Codex)

---

## Task 1

Generate Prisma schema for chat tables.

---

## Task 2

Generate Chat Module:

* ChatService
* ConversationService
* MessageService

---

## Task 3

Implement WebSocket Gateway:

* connection handling
* messaging events

---

## Task 4

Implement REST APIs for:

* conversations
* messages

---

## Task 5

Implement AI endpoints:

* /ai/customer-chat
* /ai/admin-chat

---

## Task 6

Implement AI services:

* PerfumeConsultantService
* MarketingAdvisorService

---

## Task 7

Implement message types:

* TEXT
* PRODUCT_CARD
* SYSTEM

---

## Task 8

Add permission guards.

---

## Task 9

Implement pagination & optimization.

---

# 11. Timeline

| Phase          | Duration |
| -------------- | -------- |
| Database       | 1 day    |
| Backend Core   | 2 days   |
| WebSocket      | 2 days   |
| AI Integration | 2 days   |
| Frontend       | 3–4 days |
| Testing        | 2 days   |

**Total: 10–13 days**

---

# 12. Final Architecture Summary

```text
Customer Chat (AI)        → HTTP (Chat Widget - Homepage)
Staff AI Chat             → HTTP (Dashboard)
Admin AI                  → HTTP (Dashboard)

User ↔ User Chat          → WebSocket

=> Hybrid system (optimized UX + simple backend)
```

---

# 13. Key Design Decisions

* AI chat uses HTTP (no WebSocket required)
* User chat uses WebSocket for realtime
* Customer UI uses floating chat widget
* Admin/Staff use dashboard chat
* Staff reuses Customer AI (no separate AI)

---

# 14. Out of Scope (MVP)

* AI streaming
* voice chat
* advanced AI memory
* realtime AI push notifications

---

# 15. Summary

The chat system is designed as a **hybrid communication platform**:

* Realtime communication for human users
* Simple request-response for AI
* Role-based chat boundaries
* Optimized UI per user type

This ensures fast development, clear architecture, and scalability for future upgrades.
