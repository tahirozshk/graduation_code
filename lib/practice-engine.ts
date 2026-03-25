import { DuxApiService } from './api-service'
import { PracticeSession } from '@/types'

/**
 * Core "Practice Engine Module" that analyzes student performance 
 * and generates personalized practice sessions. (Logic from Image 4)
 */
export const PracticeEngine = {
  /**
   * Orchestrates the 4 inputs and prepares the session.
   */
  async generateSession(selectedLectureId?: string, selectedCourseId?: string): Promise<PracticeSession> {
    console.log('--- Analyzing Performance (Smart AI Analysis) ---');
    
    const [rawCourses, rawMarks, rawPastExp] = await Promise.all([
      DuxApiService.fetchMyCourses(),
      DuxApiService.fetchStudentMarks(),
      DuxApiService.fetchPastPerformance()
    ]);

    const courses = Array.isArray(rawCourses) ? rawCourses : [];
    const marks = Array.isArray(rawMarks) ? rawMarks : [];
    const pastExp = Array.isArray(rawPastExp) ? rawPastExp : [];

    let lectures: any[] = [];
    const targetCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : null);
    
    if (targetCourseId) {
       lectures = await DuxApiService.fetchCourseLectures(targetCourseId);
    }
    const safeLectures = Array.isArray(lectures) ? lectures : [];

    // 2. Identify Weak Point (Input 3 & 4)
    console.log(`[PRACTICE ENGINE] Requested Lecture ID: ${selectedLectureId || 'None (Automatic)'}, Course ID: ${targetCourseId}`);
    
    const weakestMark = [...marks].sort((a, b) => a.score - b.score)[0];
    const targetLectureId = selectedLectureId || weakestMark?.lectureId || 'unknown';
    const targetLecture = safeLectures.find(l => l.id === targetLectureId) || safeLectures[0] || { id: targetLectureId, title: 'Unknown', topic: 'Unknown' };

    console.log(`[PRACTICE ENGINE] Target Lecture: ${targetLecture.title} (ID: ${targetLecture.id})`);

    // 3. Fetch specific topics and resources for the target (Input 1 & 2)
    const resources = await DuxApiService.fetchLectureResources(targetLecture.id);
    console.log(`[PRACTICE ENGINE] Found ${resources.length} resources for this lecture.`);

    // 4. Generate Practice Set via AI Endpoint
    let questions = [];
    try {
      const payload = {
        topic: targetLecture.topic || targetLecture.title || 'General Concepts',
        lectureId: targetLecture.id,
        weakPoints: targetLecture.topic || 'Unknown',
        resources: resources.map((r: any) => ({
          title: r.title || 'Source Material',
          summary: r.summary || `No summary available. Focus on the topic: ${targetLecture.title}`
        })) 
      };

      console.log(`[PRACTICE ENGINE] Calling AI Generator for topic: ${payload.topic}`);

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        questions = data.questions || [];
      } else {
         console.error("AI Generation failed:", response.statusText);
      }
    } catch (e) {
      console.error("Failed to connect to AI generator:", e);
    }

    const safePastExp = Array.isArray(pastExp) ? pastExp : [];

    // 5. Prepare Analysis Metadata for UI
    const analysisMetadata = {
      lectureTitle: targetLecture.title || 'General Topics',
      resources: resources.map((r: any) => r.title || r.name || 'Resource'),
      studentScore: weakestMark?.score || 100,
      lastQuizzes: safePastExp.slice(0, 2).map((e: any) => e.title || 'Quiz')
    };

    return {
      topic: targetLecture.topic || 'Unknown',
      lectureId: targetLecture.id || 'unknown',
      questions: questions,
      recommendationReason: `Based on your recent performance in "${targetLecture.title || 'the course'}", our AI generated a custom practice set focusing on your weak points using ${resources.length} available resources.`,
      analysisMetadata
    };
  }
}
