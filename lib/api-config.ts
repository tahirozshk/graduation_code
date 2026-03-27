/**
 * Central API Configuration File.
 * You can change all endpoint URLs and the base URL from here.
 * (Tüm API endpoint'lerini tek bir yerden değiştirmek için bu dosyayı kullanın.)
 */

export const API_CONFIG = {
  // Base URL for the Dux Backend (using local proxy to bypass CORS)
  BASE_URL: '/api/proxy',

  // Real Endpoints 
  ENDPOINTS: {
    COURSES_MY: '/courses/my',                           // Fetch My Courses
    LECTURES: '/lectures/course/:courseId',              // Fetch Course Lectures
    RESOURCES: '/resources/lecture/:lectureId',          // Fetch Lecture Resources
    SUBMISSIONS: '/studentSubmissions/my/:submissionId', // Fetch Student Submission
    UPLOADS: '/uploads/:fileName',                       // Fetch Uploads/Quiz Files
    
    // Kept for backward compatibility if needed, though they might change
    STUDENT_MARKS: '/student/performance/marks',  
    PAST_PERFORMANCE: '/student/quizzes/mistakes' 
  },

  // Headers with Auth tokens
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNDU1LCJpYXQiOjE3NzQ2MzczODEsImV4cCI6MTc3NDY0NDU4MX0.FfXbXdiZ4_rU-kF3XnK-B93qeflu0h0Q2gwTv3IZfKc' 
  }
}
