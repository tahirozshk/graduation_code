import { Course, Lecture, Resource, StudentMark, ExamRecord, QuizQuestion } from '@/types'
import { API_CONFIG } from './api-config'
import { getStoredAccessToken } from './auth-bridge'

/**
 * Custom fetch wrapper that checks for 403/401 unauthorized errors
 * and redirects to login if the token is invalid/expired.
 */
async function fetchWith403Check(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (response.status === 403 || response.status === 401) {
    console.warn("Unauthorized/Forbidden (403/401) intercepted. Token might be expired.");
    // window.location.href = '/login'; // Disabled: Route does not exist yet
    throw new Error('Authentication required');
  }
  return response;
}

/**
 * Service to fetch data from the Dux Backend.
 * (Bu servisi gerçek API endpoint'lerine bağlamak için API_CONFIG daki 
 * endpoint'leri axios veya fetch ile kullanabilirsiniz.)
 */
export const DuxApiService = {
  /**
   * Fetch user's courses
   */
  async fetchMyCourses(): Promise<Course[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSES_MY}`;
      const accessToken = getStoredAccessToken();
      const res = await fetchWith403Check(url, {
        headers: API_CONFIG.getDefaultHeaders(accessToken)
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      const courses = data.course || [];
      return courses.map((c: any) => ({
        id: c.courseId,
        title: c.courseTitle,
        ...c
      }));
    } catch (error) {
      console.warn('API Failure (fetchMyCourses), using local fallback...');
      return [
        { id: 'c1', title: 'Introduction to University Mathematics', code: 'MTH101', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop' },
        { id: 'c2', title: 'KIBRIS TARIH', code: 'TRH121', image: 'https://images.unsplash.com/photo-1523050853063-8806af9e1725?q=80&w=800&auto=format&fit=crop' }
      ] as any[];
    }
  },

  /**
   * Fetch lectures for a specific course
   */
  async fetchCourseLectures(courseId: string | number): Promise<Lecture[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LECTURES.replace(':courseId', String(courseId))}`;
      const res = await fetchWith403Check(url, {
        headers: API_CONFIG.getDefaultHeaders(getStoredAccessToken()),
      });
      if (!res.ok) throw new Error('Failed to fetch lectures');
      const data = await res.json();
      const lectures = data.lectures || [];
      return lectures.map((l: any) => ({
        id: l.lectureId,
        title: l.title,
        topic: l.title, // Using title as topic if topic is missing
        date: l.startsAt ? new Date(l.startsAt).toLocaleDateString() : 'N/A',
        ...l
      }));
    } catch (error) {
      console.warn('API Failure (fetchCourseLectures), using local fallback...');
      return [
        { id: 'l1', title: 'I: Limits and Continuity (Word Problems)', topic: 'Introduction to University Mathematics', date: new Date().toLocaleDateString() },
        { id: 'l2', title: 'II: Calculating Curve Area (Math Focus)', topic: 'Introduction to University Mathematics', date: new Date().toLocaleDateString() },
        { id: 'l1785', title: 'KIBRIS TARIH: Genel Bakis', topic: 'KIBRIS TARIH', date: new Date().toLocaleDateString() }
      ] as any[];
    }
  },

  /**
   * Fetch Lecture Resources
   */
  async fetchLectureResources(lectureId: string): Promise<Resource[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESOURCES.replace(':lectureId', lectureId)}`;
      const res = await fetchWith403Check(url, {
        headers: API_CONFIG.getDefaultHeaders(getStoredAccessToken()),
      });
      if (!res.ok) throw new Error('Failed to fetch resources');
      const data = await res.json();
      const resources = data.resources || [];
      const accessToken = getStoredAccessToken();
      return resources.map((r: any) => ({
        id: r.resourceId,
        title: r.title,
        url: r.value ? `${API_CONFIG.BASE_URL}/uploads/${r.value.replace('uploads/', '')}${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}` : '#',
        ...r
      }));
    } catch (error) {
      console.warn('API Failure (fetchLectureResources), using local fallback...');
      return [
        { id: 'r1', lectureId: lectureId, type: 'pdf', title: 'Lecture Notes (Static Fallback).pdf', url: '#' },
        { id: 'r2', lectureId: lectureId, type: 'slide', title: 'Presentation Slides.pdf', url: '#' }
      ] as any[];
    }
  },

  /**
   * Fetch a specific student submission by ID
   */
  async fetchStudentSubmission(submissionId: string | number): Promise<any> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBMISSIONS.replace(':submissionId', String(submissionId))}`;
      const res = await fetchWith403Check(url, {
        headers: API_CONFIG.getDefaultHeaders(getStoredAccessToken()),
      });
      if (!res.ok) throw new Error('Failed to fetch submission');
      return await res.json();
    } catch (error) {
      console.error('Error fetching submission:', error);
      return null;
    }
  },

  /**
   * Fetch a quiz or generic file upload by file name
   */
  async fetchUploadContent(fileName: string): Promise<any> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOADS.replace(':fileName', fileName)}`;
      const res = await fetchWith403Check(url, {
        headers: API_CONFIG.getDefaultHeaders(getStoredAccessToken()),
      });
      if (!res.ok) throw new Error('Failed to fetch upload content');
      // Since it's a file upload, we might need to return a Blob or string
      return await res.blob();
    } catch (error) {
      console.error('Error fetching upload file:', error);
      return null;
    }
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
  },

  /**
   * AI Coach: Analyze student's quiz performance
   */
  async analyzePerformance(payload: {
    topic: string,
    lectureId: string,
    answers: Array<{ questionId: string, selectedOption: number, isCorrect: boolean }>,
    resources: any[]
  }): Promise<any> {
    try {
      const res = await fetch('/api/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to analyze performance');
      return await res.json();
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return null;
    }
  }
}
