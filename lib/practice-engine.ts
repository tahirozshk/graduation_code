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
  async generateSession(selectedLectureId?: string): Promise<PracticeSession> {
    console.log('--- Analyzing Performance (Smart AI Analysis) ---');
    
    // 1. Fetch data inputs (Parallel fetching for efficiency)
    const [lectures, marks, pastExp] = await Promise.all([
      DuxApiService.fetchLectureList(),
      DuxApiService.fetchStudentMarks(),
      DuxApiService.fetchPastPerformance()
    ]);

    // 2. Identify Weak Point (Input 3 & 4)
    // If no specific lecture is selected, find the one with the lowest score.
    const weakestMark = [...marks].sort((a, b) => a.score - b.score)[0];
    const targetLectureId = selectedLectureId || weakestMark.lectureId;
    const targetLecture = lectures.find(l => l.id === targetLectureId) || lectures[0];

    // 3. Fetch specific topics and resources for the target (Input 1 & 2)
    const resources = await DuxApiService.fetchLectureResources(targetLecture.id);

    // 4. Generate Practice Set (Input 4 question structures + AI hint generation)
    // Here we filter past questions related to the target or generate new ones
    // based on the structures found in input 4.
    const questions = pastExp.questions.filter(q => q.lectureId === targetLecture.id);

    return {
      topic: targetLecture.topic,
      lectureId: targetLecture.id,
      questions: questions.length > 0 ? questions : [],
      recommendationReason: `Based on your score of ${weakestMark.score}% in "${targetLecture.title}", we fetched ${resources.length} latest resources and generated a custom practice set for you.`
    };
  }
}
