import { Lecture, Resource, StudentMark, ExamRecord, QuizQuestion } from '@/types'
import { API_CONFIG } from './api-config'

/**
 * Service to fetch data from the Dux Backend.
 * (Bu servisi gerçek API endpoint'lerine bağlamak için API_CONFIG daki 
 * endpoint'leri axios veya fetch ile kullanabilirsiniz.)
 */
export const DuxApiService = {
  /**
   * Input 1: Fetch Lecture List
   * Uses Endpoint: API_CONFIG.ENDPOINTS.LECTURES
   */
  async fetchLectureList(): Promise<Lecture[]> {
    // console.log(`Fetching from: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LECTURES}`);
    // return (await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LECTURES}`)).data;
    return [
      { id: 'l1', title: 'Calculating curve', topic: 'Engineering Mathematics', date: '7 Şub 2025 14:20' },
      { id: 'l2', title: 'nlp intro', topic: 'Computer Science', date: '19 Eyl 2025 18:08' },
      { id: 'l3', title: 'Intro to elicitation techniques', topic: 'Requirements Engineering', date: '12 Nis 2025 09:40' },
      { id: 'l4', title: 'Introduction', topic: 'General Knowledge', date: '10 Şub 2025 10:00' }
    ]
  },

  /**
   * Input 2: Fetch Lecture Resources
   * Uses Endpoint: API_CONFIG.ENDPOINTS.RESOURCES
   */
  async fetchLectureResources(lectureId: string): Promise<Resource[]> {
    // console.log(`Fetching from: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESOURCES.replace(':id', lectureId)}`);
    return [
      { id: 'r1', lectureId, type: 'pdf', title: 'Section 4.2 - Integration & Area', url: '/files/lecture4-2.pdf' },
      { id: 'r2', lectureId, type: 'slide', title: 'Calculations Slide 12', url: '/slides/s12.jpg' }
    ]
  },

  /**
   * Input 3: Fetch Student Marks
   * Uses Endpoint: API_CONFIG.ENDPOINTS.STUDENT_MARKS
   */
  async fetchStudentMarks(): Promise<StudentMark[]> {
    // console.log(`Fetching from: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STUDENT_MARKS}`);
    return [
      { lectureId: 'l1', score: 45, attempts: 2 }, // Low score on Calculating curve
      { lectureId: 'l2', score: 88, attempts: 1 },
      { lectureId: 'l3', score: 72, attempts: 3 },
      { lectureId: 'l4', score: 95, attempts: 1 }
    ]
  },

  /**
   * Input 4: Fetch Last Quizzes & Exams
   * Uses Endpoint: API_CONFIG.ENDPOINTS.PAST_PERFORMANCE
   */
  async fetchPastPerformance(): Promise<{ questions: QuizQuestion[] }> {
    // console.log(`Fetching from: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAST_PERFORMANCE}`);
    return {
      questions: [
        {
          id: 'q13',
          lectureId: 'l1',
          questionText: 'Find the total area enclosed between the curve f(x) = x³ - 4x and the x-axis, for the interval [-2, 2].',
          options: [
            'Option A: Area = 8 units²',
            'Option B: Area = 16 units²',
            'Option C: Area = 4 units²',
            'Option D: Area = 0 units²',
            'Option E: (Integration limits must be determined first)'
          ],
          correctAnswer: 0, // Option A
          explanation: 'Calculated using definite integral. Note: absolute value is key because the area is below/above axis.',
          difficulty: 'advanced'
        }
      ]
    }
  }
}
