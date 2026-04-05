# REVIEW SYSTEM DEVELOPMENT PLAN (CUSTOMER + ADMIN) – PerfumeGPT

---

## 1. Objective

Build a complete review system that:

* Allows customers to review purchased products (rating, text, images)
* Enables admins to manage, moderate, and analyze reviews
* Integrates AI for summarization and insights
* Improves trust, engagement, and conversion

---

## 2. Actors

### Customer

* Write / edit / delete review
* Upload images
* View and interact with reviews

### Admin

* Moderate reviews (hide/show/delete)
* Manage reports
* Highlight/pin reviews
* Analyze review data & AI insights

### AI Service

* Summarize reviews
* Analyze sentiment
* Extract keywords

---

## 3. User Flows

## 3.1 Customer – Write Review

1. Go to Order History
2. Select completed order
3. Click “Write Review”
4. Input:

   * Rating (1–5)
   * Content
   * Images (optional)
5. Submit
6. System:

   * Validate purchase
   * Save review
   * Trigger AI processing (async)

---

## 3.2 Customer – View Reviews

1. Open product page
2. View:

   * Average rating
   * Review list
3. Interact:

   * Filter / sort
   * Mark helpful

---

## 3.3 Admin – Moderation Flow

1. Open Review Dashboard
2. Filter/search reviews
3. Perform actions:

   * Hide / show
   * Delete
   * Flag
   * Pin
4. Handle reports

---

## 4. Functional Requirements

---

## 4.1 Customer Features

### 4.1.1 Review Creation

* Only after successful purchase
* One review per order item
* Required: rating
* Optional: text, images

---

### 4.1.2 Review Management

* Edit review
* Delete review (soft delete)

---

### 4.1.3 Media Upload

* Max 5 images
* Limit size (5MB/image)
* Storage: S3 / Cloudinary

---

### 4.1.4 View Reviews

* Show:

  * Rating
  * Content
  * Images
  * Verified badge
* Pagination

---

### 4.1.5 Filtering & Sorting

* Filter:

  * Rating
  * Has images
* Sort:

  * Newest
  * Highest rating
  * Most helpful

---

### 4.1.6 Interaction

* Mark helpful / not helpful
* Prevent duplicate reaction

---

## 4.2 Admin Features

### 4.2.1 Moderation

* Hide / show review
* Soft delete
* Flag suspicious review

---

### 4.2.2 Review Dashboard

* View all reviews
* Filter:

  * Rating
  * Product
  * User
  * Status
* Sort:

  * Newest
  * Rating
  * Helpful

---

### 4.2.3 Pin / Highlight Review

* Pin review to top
* Mark as “Top Review”

---

### 4.2.4 Report System

* View reported reviews
* See reason
* Resolve:

  * Ignore
  * Hide
  * Delete

---

### 4.2.5 Image Moderation

* View images
* Remove inappropriate images

---

### 4.2.6 Analytics & Insights

* Avg rating per product
* Review count
* Negative feedback tracking

---

### 4.2.7 Fraud Detection (Advanced)

* Detect spam reviews
* Detect abnormal rating patterns
* Restrict abusive users

---

## 4.3 AI Features

### 4.3.1 Review Summarization

* Generate:

  * Summary
  * Pros / Cons

---

### 4.3.2 Sentiment Analysis

* Positive / Neutral / Negative

---

### 4.3.3 Keyword Extraction

* Example:

  * “sweet”
  * “long-lasting”

---

## 5. Database Design

### 5.1 Review

```prisma id="f4z2g8"
model Review {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  orderItemId   String   @unique

  rating        Int
  content       String?

  isVerified    Boolean  @default(true)
  isHidden      Boolean  @default(false)
  isPinned      Boolean  @default(false)
  flagged       Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  images        ReviewImage[]
  reactions     ReviewReaction[]
}
```

---

### 5.2 ReviewImage

```prisma id="6y6h8x"
model ReviewImage {
  id        String @id @default(cuid())
  reviewId  String
  imageUrl  String

  review    Review @relation(fields: [reviewId], references: [id])
}
```

---

### 5.3 ReviewReaction

```prisma id="x2s8k1"
model ReviewReaction {
  id        String @id @default(cuid())
  reviewId  String
  userId    String
  type      ReactionType

  @@unique([reviewId, userId])
}

enum ReactionType {
  HELPFUL
  NOT_HELPFUL
}
```

---

### 5.4 ReviewReport

```prisma id="9r2k1b"
model ReviewReport {
  id        String   @id @default(cuid())
  reviewId  String
  userId    String
  reason    String
  createdAt DateTime @default(now())
}
```

---

### 5.5 ReviewSummary (AI)

```prisma id="u7p4lm"
model ReviewSummary {
  id         String @id @default(cuid())
  productId  String @unique

  summary    String
  pros       String
  cons       String
  keywords   String

  updatedAt  DateTime @updatedAt
}
```

---

## 6. API Design

### Customer APIs

* POST `/reviews`
* GET `/products/:id/reviews`
* PUT `/reviews/:id`
* DELETE `/reviews/:id`
* POST `/reviews/:id/react`

---

### Admin APIs

* PATCH `/admin/reviews/:id/hide`
* PATCH `/admin/reviews/:id/show`
* PATCH `/admin/reviews/:id/pin`
* PATCH `/admin/reviews/:id/flag`
* DELETE `/admin/reviews/:id`

---

### Report APIs

* POST `/reviews/:id/report`
* GET `/admin/reports`
* PATCH `/admin/reports/:id/resolve`

---

### Analytics APIs

* GET `/admin/reviews/stats`

---

## 7. Backend Implementation Plan (AI Agent)

### Step 1: Schema

* Create all Prisma models
* Run migration

---

### Step 2: Customer APIs

* Create review (validate purchase)
* CRUD review

---

### Step 3: Media Upload

* Integrate Cloudinary/S3

---

### Step 4: Review Query

* Pagination
* Filtering
* Sorting

---

### Step 5: Reaction System

* Helpful logic

---

### Step 6: Admin APIs

* Moderation
* Pin
* Flag
* Reports

---

### Step 7: AI Integration

* Background job (queue)
* Summarization
* Sentiment

---

## 8. Frontend Tasks

### Customer

* Review modal
* Star rating UI
* Image uploader
* Review list + filter

---

### Admin

* Review dashboard
* Report management UI
* Analytics dashboard

---

## 9. Edge Cases

* Duplicate review → block by orderItemId
* Deleted review → update rating
* No reviews → fallback UI
* Spam → rate limit
* Multiple reports → avoid duplicate handling

---

## 10. Performance Optimization

* Index:

  * productId
  * rating
  * createdAt
* Cache:

  * average rating
* Lazy load images

---

## 11. Testing Plan

### Unit Test

* Review validation
* Permission check

---

### Integration Test

* Full flow:

  * Order → Review → Display

---

### Edge Case Test

* Invalid order
* Spam review
* Admin moderation

---

## 12. Roadmap

### Phase 1 (MVP)

* Review CRUD
* Rating + text + image

---

### Phase 2

* Filter/sort
* Reaction
* Admin moderation

---

### Phase 3 (AI)

* Summarization
* Sentiment
* Analytics dashboard

---

## 13. Codex Prompt Strategy

### Schema

"Generate Prisma schema for review system including admin moderation and AI summary"

---

### Backend

"Implement NestJS APIs for review system with customer and admin roles, including validation and moderation"

---

### AI

"Integrate background job to summarize reviews and extract sentiment using AI API"

---

## 14. Success Metrics

* % users writing reviews
* Avg rating accuracy
* Spam rate reduction
* Conversion rate increase
* AI summary usage

---
