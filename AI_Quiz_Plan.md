## Plan: AI Quiz Feature Development

Develop an AI-powered quiz feature with 5 multiple-choice questions based on the SP26SE009 document, collecting user preferences (gender, occasion, budget, scent family, longevity) to recommend 3-5 suitable products. The system processes answers, returns product recommendations with AI-generated explanations, displayed as clickable cards linking to product detail pages in new tabs.

**Steps**
1. **Backend Development (1.5 days)**: Create quiz module with service and controller. Add endpoints: POST /quiz/submit to save quiz answers, call AI service for recommendations, and return enriched product data; GET /quiz/:id to fetch saved quiz results. Adapt AI service with quizConsult method using structured prompt for quiz inputs.
2. **Frontend Quiz Form (1.5 days)**: Build multi-step quiz page with 5 questions (gender, occasion, budget, scent family, longevity) using existing UI patterns from consultation page. Implement state management for step progression and answer collection. Add form validation and submission handling.
3. **Recommendation Display (1 day)**: Create results page/component to display 3-5 product cards with name, explanation, price, and image. Make cards clickable to open product detail pages in new tabs. Reuse existing recommendation card pattern from FloatingChatWidget.
4. **Integration and Testing (1 day)**: Integrate frontend with backend APIs, handle loading states and errors. Test end-to-end flow, ensure recommendations are accurate, and verify mobile responsiveness.
5. **Polish and Optimization (0.5 days)**: Add animations, accessibility improvements, and i18n support. Optimize AI prompts for better recommendation quality.

**Relevant files**
- `backend/src/ai/ai.service.ts` — Adapt for quizConsult method
- `backend/src/quiz/quiz.service.ts` — New service for quiz logic
- `backend/src/quiz/quiz.controller.ts` — New controller for quiz endpoints
- `backend/prisma/schema.prisma` — Use existing QuizResult model
- `frontend/app/[locale]/quiz/page.tsx` — New quiz page
- `frontend/components/quiz/QuizForm.tsx` — New quiz form component
- `frontend/components/quiz/RecommendationCards.tsx` — New recommendation display component
- `frontend/services/quiz.service.ts` — New API service for quiz
- `frontend/components/chat/FloatingChatWidget.tsx` — Reference for recommendation card pattern

**Verification**
1. Run backend tests for quiz endpoints, ensuring QuizResult is saved and AI recommendations are generated correctly.
2. Test frontend quiz flow: Complete all 5 steps, submit, and verify 3-5 products are displayed with explanations.
3. Click product cards to confirm they open product detail pages in new tabs.
4. Validate AI explanations are relevant and based on quiz answers.
5. Check mobile responsiveness and accessibility.

**Decisions**
- Use 5 questions as specified in the document: gender, occasion, budget, scent family, longevity.
- AI handles only explanation generation for recommended products; product selection logic via structured prompts.
- Reuse existing QuizResult DB model and recommendation enrichment patterns.
- Display 3-5 products as cards, prioritizing relevance over fixed number if fewer match.
- No authentication required for quiz; optional saving for logged-in users.