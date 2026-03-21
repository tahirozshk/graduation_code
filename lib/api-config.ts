/**
 * Central API Configuration File.
 * You can change all endpoint URLs and the base URL from here.
 * (Tüm API endpoint'lerini tek bir yerden değiştirmek için bu dosyayı kullanın.)
 */

export const API_CONFIG = {
  // Base URL for the Dux Backend microservice
  BASE_URL: 'https://api.profdux.com/v1',

  // 4 Main Inputs (Dux Image 4)
  ENDPOINTS: {
    LECTURES: '/student/courses/lectures',       // Input 1: Lecture List
    RESOURCES: '/lectures/:id/resources',        // Input 2: Fetch resources (PDF, Slides)
    STUDENT_MARKS: '/student/performance/marks',  // Input 3: Fetch marks
    PAST_PERFORMANCE: '/student/quizzes/mistakes' // Input 4: Last quizzes & exams
  },

  // If you need specific Headers (like Auth tokens)
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE' 
  }
}
