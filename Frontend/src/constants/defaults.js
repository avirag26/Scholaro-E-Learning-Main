/**
 * Default values and constants used across the application
 */
export const DEFAULT_IMAGES = {
  PROFILE: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
  COURSE_THUMBNAIL: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
};
export const DEFAULT_TEXTS = {
  TUTOR_BIO: "Experienced tutor ready to help you learn",
  TUTOR_SUBJECT: "Professional Tutor",
  NO_COURSES_MESSAGE: "No courses available at the moment"
};
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  COURSES_PER_ROW: 4
};
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  NAME: 'Indian Rupee'
};

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'students', label: 'Students' }
];
export const SOCIAL_LINKS = {
  WEBSITE: 'website',
  TWITTER: 'twitter',
  YOUTUBE: 'youtube',
  LINKEDIN: 'linkedin'
};
