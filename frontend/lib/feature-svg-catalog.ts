export type FeatureSvgOption = {
  id: string;
  label: string;
  path: string;
  tone: 'light' | 'dark';
  bestFor: string[];
};

export type FeatureSvgGroup = {
  id: string;
  label: string;
  description: string;
  options: FeatureSvgOption[];
};

export const featureSvgCatalog: FeatureSvgGroup[] = [
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Login, register, forgot password, verify email.',
    options: [
      {
        id: 'auth-option-a',
        label: 'Identity Shield',
        path: '/illustrations/auth/option-a.svg',
        tone: 'light',
        bestFor: ['login', 'register', 'verify-email', 'profile security'],
      },
      {
        id: 'auth-option-b',
        label: 'Secure Access',
        path: '/illustrations/auth/option-b.svg',
        tone: 'dark',
        bestFor: ['login hero', 'auth side panel', 'password reset'],
      },
    ],
  },
  {
    id: 'quiz',
    label: 'Scent Quiz',
    description: 'Quiz intro, fragrance matching, recommendation flow.',
    options: [
      {
        id: 'quiz-option-a',
        label: 'Choice Orbit',
        path: '/illustrations/quiz/option-a.svg',
        tone: 'light',
        bestFor: ['quiz intro', 'result empty state', 'discovery section'],
      },
      {
        id: 'quiz-option-b',
        label: 'Radar Match',
        path: '/illustrations/quiz/option-b.svg',
        tone: 'dark',
        bestFor: ['quiz hero', 'ai match state', 'recommendation teaser'],
      },
    ],
  },
  {
    id: 'consultation',
    label: 'AI Consultation',
    description: 'AI chat, fragrance advisor, perfume GPT flows.',
    options: [
      {
        id: 'consultation-option-a',
        label: 'Assistant Console',
        path: '/illustrations/consultation/option-a.svg',
        tone: 'light',
        bestFor: ['consultation landing', 'chat empty state', 'assistant cards'],
      },
      {
        id: 'consultation-option-b',
        label: 'Signal Lab',
        path: '/illustrations/consultation/option-b.svg',
        tone: 'dark',
        bestFor: ['ai consultation hero', 'analysis panels', 'staff ai tools'],
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog And Products',
    description: 'Collection, products, search, featured perfumes.',
    options: [
      {
        id: 'catalog-option-a',
        label: 'Editorial Shelf',
        path: '/illustrations/catalog/option-a.svg',
        tone: 'light',
        bestFor: ['collection hero', 'featured catalog', 'product landing'],
      },
      {
        id: 'catalog-option-b',
        label: 'Search Grid',
        path: '/illustrations/catalog/option-b.svg',
        tone: 'dark',
        bestFor: ['search empty state', 'filter panels', 'catalog dashboard'],
      },
    ],
  },
  {
    id: 'cart',
    label: 'Cart And Checkout',
    description: 'Cart drawer, checkout summaries, payment prompts.',
    options: [
      {
        id: 'cart-option-a',
        label: 'Luxury Bag',
        path: '/illustrations/cart/option-a.svg',
        tone: 'light',
        bestFor: ['cart empty state', 'checkout section', 'shopping prompts'],
      },
      {
        id: 'cart-option-b',
        label: 'Receipt Flow',
        path: '/illustrations/cart/option-b.svg',
        tone: 'dark',
        bestFor: ['checkout hero', 'payment CTA', 'order summary cards'],
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders And Returns',
    description: 'Order history, shipment tracking, returns workflow.',
    options: [
      {
        id: 'orders-option-a',
        label: 'Delivery Timeline',
        path: '/illustrations/orders/option-a.svg',
        tone: 'light',
        bestFor: ['orders empty state', 'tracking overview', 'return intro'],
      },
      {
        id: 'orders-option-b',
        label: 'Route Parcel',
        path: '/illustrations/orders/option-b.svg',
        tone: 'dark',
        bestFor: ['shipment cards', 'return dashboard', 'delivery status'],
      },
    ],
  },
  {
    id: 'loyalty',
    label: 'Loyalty And Membership',
    description: 'Rewards, subscriptions, membership tiers, perks.',
    options: [
      {
        id: 'loyalty-option-a',
        label: 'Member Card',
        path: '/illustrations/loyalty/option-a.svg',
        tone: 'light',
        bestFor: ['loyalty page', 'membership overview', 'subscription promo'],
      },
      {
        id: 'loyalty-option-b',
        label: 'Reward Crown',
        path: '/illustrations/loyalty/option-b.svg',
        tone: 'dark',
        bestFor: ['vip section', 'reward milestone', 'member upsell'],
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard And Analytics',
    description: 'Admin, staff, charts, KPIs, overview cards.',
    options: [
      {
        id: 'dashboard-option-a',
        label: 'Growth Story',
        path: '/illustrations/dashboard/option-a.svg',
        tone: 'light',
        bestFor: ['analytics hero', 'admin overview', 'staff KPI'],
      },
      {
        id: 'dashboard-option-b',
        label: 'Ops Monitor',
        path: '/illustrations/dashboard/option-b.svg',
        tone: 'dark',
        bestFor: ['dashboard panels', 'reporting modules', 'internal tools'],
      },
    ],
  },
  {
    id: 'journal',
    label: 'Journal And Story',
    description: 'Magazine, editorial story, article sections.',
    options: [
      {
        id: 'journal-option-a',
        label: 'Editorial Spread',
        path: '/illustrations/journal/option-a.svg',
        tone: 'light',
        bestFor: ['journal landing', 'story page', 'editor picks'],
      },
      {
        id: 'journal-option-b',
        label: 'Bound Volume',
        path: '/illustrations/journal/option-b.svg',
        tone: 'dark',
        bestFor: ['article hero', 'journal cards', 'blog teaser'],
      },
    ],
  },
  {
    id: 'support',
    label: 'Support And Communication',
    description: 'Support center, notifications, messaging, FAQ.',
    options: [
      {
        id: 'support-option-a',
        label: 'Care Headset',
        path: '/illustrations/support/option-a.svg',
        tone: 'light',
        bestFor: ['support landing', 'empty notification state', 'contact us'],
      },
      {
        id: 'support-option-b',
        label: 'Signal Compass',
        path: '/illustrations/support/option-b.svg',
        tone: 'dark',
        bestFor: ['help center hero', 'faq module', 'chat assistance'],
      },
    ],
  },
];

export const featureSvgMap = Object.fromEntries(
  featureSvgCatalog.flatMap((group) =>
    group.options.map((option) => [option.id, option.path]),
  ),
) as Record<string, string>;
