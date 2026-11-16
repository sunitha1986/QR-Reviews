/**
 * Business Category Metadata & Quick Highlight Tags
 * Note: Review suggestions are generated 100% dynamically via Google Gemini AI (no hardcoded review strings).
 */

export const POPULAR_CATEGORY_KEYWORDS = {
  'Restaurant & Cafe': [
    'Rooftop ambiance',
    'Wood-fired pizza',
    'Delicious food',
    'Fast service',
    'Cozy seating',
    'Courteous staff',
    'Fresh coffee',
    'Hygienic kitchen',
    'Generous portions',
    'Family friendly',
    'Tasty desserts',
    'Prompt billing'
  ],
  'Healthcare & Clinic': [
    'Gentle doctors',
    'Minimal waiting time',
    'Clean & sterile clinic',
    'Caring nurses',
    'Modern diagnostics',
    'Painless treatment',
    'Helpful reception',
    'Transparent consultation fees',
    'Patient guidance',
    'Family health care'
  ],
  'Hotel & Resort': [
    'Spacious rooms',
    'Comfortable beds',
    'Peaceful stay',
    'Delicious breakfast buffet',
    'Helpful front desk',
    'Clean swimming pool',
    'Fast Wi-Fi',
    'Prompt room service',
    'Scenic views',
    'Hassle-free check-in'
  ],
  'Retail & Shopping': [
    'Trendy collection',
    'Top quality merchandise',
    'Fast billing counter',
    'Affordable prices',
    'Helpful store staff',
    'Neat aisles',
    'Great discount offers',
    'Wide product variety',
    'Easy exchange policy',
    'Pleasant shopping vibe'
  ],
  'Salon & Spa': [
    'Expert hair stylists',
    'Relaxing massage',
    'Top hygiene standards',
    'Soothing ambiance',
    'Premium beauty products',
    'Punctual appointments',
    'Skin rejuvenation',
    'Attentive personal care',
    'Great hair makeover',
    'Pampering experience'
  ],
  'Automotive & Garage': [
    'Honest estimates',
    'Skilled mechanics',
    'Timely vehicle delivery',
    'Genuine spare parts',
    'Fair & transparent billing',
    'Prompt oil service',
    'Clean workshop',
    'Accurate diagnostics',
    'Helpful service advisors'
  ],
  'Gym & Fitness Center': [
    'Modern equipment',
    'Certified personal trainers',
    'Clean locker rooms',
    'Motivating energy',
    'Spacious workout floor',
    'Personalized fitness plan',
    'Great workout playlist',
    'Hygienic weights area',
    'Positive community vibe'
  ],
  'Education & Coaching': [
    'Dedicated faculty',
    'Clear concept explanation',
    'Patient doubt clearing',
    'Well-planned study material',
    'Inspiring mentors',
    'Interactive classes',
    'Confidence building',
    'Regular test reviews',
    'Friendly learning environment'
  ],
  'General Business': [
    'Professional team',
    'Prompt response',
    'Transparent pricing',
    'Dependable service',
    'Friendly customer care',
    'Top quality workmanship',
    'Hassle-free experience',
    'Honest communication',
    'Fast turnaround time'
  ]
};

export const CATEGORY_DATA = {
  'Healthcare & Clinic': {
    categoryLabel: 'Healthcare & Hospital',
    icon: 'Activity',
    tags: [
      'Caring Doctors',
      'Clean & Hygienic',
      'Supportive Nurses',
      'Minimal Waiting',
      'Quick Consultation',
      'Transparent Advice',
      'Comfortable Wards',
      'Well-Organized'
    ]
  },

  'Restaurant & Cafe': {
    categoryLabel: 'Restaurant & Dining',
    icon: 'Utensils',
    tags: [
      'Delicious Food',
      'Quick Service',
      'Cozy Ambiance',
      'Fresh Ingredients',
      'Polite Staff',
      'Generous Portions',
      'Hygienic Kitchen',
      'Great Value'
    ]
  },

  'Hotel & Resort': {
    categoryLabel: 'Hotel & Hospitality',
    icon: 'Hotel',
    tags: [
      'Spotless Rooms',
      'Warm Hospitality',
      'Smooth Check-in',
      'Delicious Breakfast',
      'Comfortable Bed',
      'Peaceful Stay',
      'Helpful Concierge',
      'Great Location'
    ]
  },

  'Retail & Shopping': {
    categoryLabel: 'Retail & Shopping',
    icon: 'ShoppingBag',
    tags: [
      'Great Collection',
      'Helpful Staff',
      'Authentic Products',
      'Fair Pricing',
      'Neat Display',
      'Fast Billing',
      'Easy Exchange',
      'Ample Variety'
    ]
  },

  'Salon & Spa': {
    categoryLabel: 'Salon & Wellness',
    icon: 'Sparkles',
    tags: [
      'Skilled Stylists',
      'Relaxing Ambiance',
      'Hygienic Equipment',
      'Premium Products',
      'Punctual Service',
      'Courteous Staff',
      'Customized Care',
      'Great Value'
    ]
  },

  'Automotive & Garage': {
    categoryLabel: 'Automotive & Garage',
    icon: 'Car',
    tags: [
      'Honest Diagnosis',
      'Timely Delivery',
      'Genuine Parts',
      'Fair Estimate',
      'Skilled Mechanics',
      'Transparent Billing',
      'Neat Cleaning',
      'Professional Service'
    ]
  },

  'Gym & Fitness Center': {
    categoryLabel: 'Gym & Fitness',
    icon: 'Dumbbell',
    tags: [
      'Modern Equipment',
      'Certified Trainers',
      'Clean Locker Rooms',
      'Motivating Vibe',
      'Spacious Workout Area',
      'Good Ventilation',
      'Helpful Guidance',
      'Great Energy'
    ]
  },

  'Education & Coaching': {
    categoryLabel: 'Education & Academy',
    icon: 'GraduationCap',
    tags: [
      'Experienced Faculty',
      'Personal Attention',
      'Structured Curriculum',
      'Encouraging Mentors',
      'Well-Equipped Labs',
      'Regular Doubt Clearing',
      'Inspiring Environment',
      'Clear Concepts'
    ]
  },

  'General Business': {
    categoryLabel: 'Valued Partner',
    icon: 'Building2',
    tags: [
      'Professional Service',
      'Prompt Response',
      'Friendly Team',
      'High Quality',
      'Trustworthy',
      'Clean Facility',
      'Good Value',
      'Smooth Process'
    ]
  }
};

/**
 * Resolves a raw business type string into a known category key
 */
export function resolveCategory(rawCategory = '', businessName = '') {
  const text = `${rawCategory} ${businessName}`.toLowerCase();

  if (/hospital|clinic|doctor|dental|dentist|health|care|pharma|medical|child|pediatric/i.test(text)) {
    return 'Healthcare & Clinic';
  }
  if (/restaurant|cafe|coffee|food|dining|bistro|bake|bakery|sweet|snack|kitchen|bar|pub/i.test(text)) {
    return 'Restaurant & Cafe';
  }
  if (/hotel|resort|lodge|stay|inn|guest|suite/i.test(text)) {
    return 'Hotel & Resort';
  }
  if (/salon|spa|beauty|parlour|hair|makeup|skincare|wellness/i.test(text)) {
    return 'Salon & Spa';
  }
  if (/auto|garage|car|bike|motor|repair|service center|mechanic|tyre|wheel/i.test(text)) {
    return 'Automotive & Garage';
  }
  if (/gym|fitness|crossfit|workout|yoga|pilates|trainer/i.test(text)) {
    return 'Gym & Fitness Center';
  }
  if (/school|college|coach|academy|institute|tuition|class|tutor|education|learning/i.test(text)) {
    return 'Education & Coaching';
  }
  if (/retail|shop|store|mart|supermarket|mall|boutique|cloth|fashion|jewel|footwear|optics/i.test(text)) {
    return 'Retail & Shopping';
  }

  return 'General Business';
}

/**
 * Kept for signature compatibility - returns empty array because suggestions are AI-generated only
 */
export function getSuggestions() {
  return [];
}

/**
 * Gets highlight tags for a category
 */
export function getAspectTags(categoryKey) {
  const data = CATEGORY_DATA[categoryKey] || CATEGORY_DATA['General Business'];
  return data.tags || [];
}
