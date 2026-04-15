import { DuxApiService } from "./api-service";
import { PracticeSession } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips LaTeX delimiters and math commands from plain text so that the
 * question *stem* (the non-math sentence part) renders as normal prose.
 *
 * The issue visible in the screenshot is that the AI wraps the ENTIRE
 * question string — including normal words — inside a math font.  We fix
 * this at the source by telling the AI (via the route prompt) to separate
 * prose from math, and here we do a light sanitize pass just in case.
 *
 * Real math blocks ($...$) must be kept intact for the LaTeX renderer;
 * only bare \textit / \text wrappers around whole sentences are stripped.
 */
function sanitizeQuestionText(text: string): string {
    if (!text) return text;
    // Remove \text{...} wrappers that sometimes bleed outside $ delimiters
    return text
        .replace(/\\text\{([^}]+)\}/g, "$1")
        .replace(/\\textit\{([^}]+)\}/g, "$1")
        .replace(/\\textbf\{([^}]+)\}/g, "$1")
        .trim();
}

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Randomises the position of options for a single question so the correct
 * answer doesn't always sit at position A. Updates `correctAnswer` to match.
 */
function shuffleQuestionOptions(q: any): any {
    if (!Array.isArray(q.options) || q.options.length === 0) return q;

    const correctText = q.options[q.correctAnswer];
    const shuffled = shuffle(q.options);
    const newCorrectIndex = shuffled.indexOf(correctText);

    return {
        ...q,
        options: shuffled,
        correctAnswer: newCorrectIndex,
    };
}

function sanitizeQuestions(questions: any[]): any[] {
    return questions.map((q) => {
        const sanitized = {
            ...q,
            text: sanitizeQuestionText(q.text),
            options: Array.isArray(q.options)
                ? q.options.map((o: string) => sanitizeQuestionText(o))
                : q.options,
            explanation: sanitizeQuestionText(q.explanation),
        };
        // Shuffle option positions so correct answer isn't always A
        return shuffleQuestionOptions(sanitized);
    });
}

function normalizeCourseLanguage(language?: string | null): string {
    const normalized = String(language || "").trim();
    return normalized || "English";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Core engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core "Practice Engine Module" that analyses student performance
 * and generates personalized practice sessions.
 */
export const PracticeEngine = {
    /**
     * Orchestrates the 4 inputs and prepares the session.
     *
     * @param selectedLectureId  – specific lecture the student clicked "Practice" on
     * @param selectedCourseId   – course that lecture belongs to
     */
    async generateSession(
        selectedLectureId?: string,
        selectedCourseId?: string,
    ): Promise<PracticeSession> {
        console.log("--- Analyzing Performance (Smart AI Analysis) ---");

        const [rawCourses, rawMarks, rawPastExp] = await Promise.all([
            DuxApiService.fetchMyCourses(),
            DuxApiService.fetchStudentMarks(),
            DuxApiService.fetchPastPerformance(),
        ]);

        const courses = Array.isArray(rawCourses) ? rawCourses : [];
        const marks = Array.isArray(rawMarks) ? rawMarks : [];
        const pastExp = Array.isArray(rawPastExp) ? rawPastExp : [];

        // ── Resolve target course ────────────────────────────────────────────────
        const targetCourseId =
            selectedCourseId || (courses.length > 0 ? courses[0].id : null);

        // Grab the course object so we can pass its name to the AI
        const targetCourse =
            courses.find((c: any) => c.id === targetCourseId) ||
            courses[0] ||
            null;
        const courseName: string =
            targetCourse?.name ||
            targetCourse?.title ||
            targetCourse?.code ||
            "";
        const courseCode: string =
            targetCourse?.code || targetCourse?.courseCode || "";
        const courseLanguage: string = normalizeCourseLanguage(
            targetCourse?.language,
        );

        let lectures: any[] = [];
        if (targetCourseId) {
            lectures = await DuxApiService.fetchCourseLectures(targetCourseId);
        }
        const safeLectures = Array.isArray(lectures) ? lectures : [];

        // ── Resolve target lecture ───────────────────────────────────────────────
        console.log(
            `[PRACTICE ENGINE] Requested Lecture ID: ${selectedLectureId || "None (Automatic)"}, Course ID: ${targetCourseId}`,
        );

        const weakestMark = [...marks].sort((a, b) => a.score - b.score)[0];
        const targetLectureId =
            selectedLectureId || weakestMark?.lectureId || "unknown";
        const targetLecture = safeLectures.find(
            (l) => l.id === targetLectureId,
        ) ||
            safeLectures[0] || {
                id: targetLectureId,
                title: "Unknown",
                topic: "Unknown",
            };

        console.log(
            `[PRACTICE ENGINE] Target Lecture: ${targetLecture.title} (ID: ${targetLecture.id})`,
        );
        console.log(
            `[PRACTICE ENGINE] Course: "${courseName}" (${courseCode}) | Language: ${courseLanguage}`,
        );

        // ── Resources ────────────────────────────────────────────────────────────
        const resources = await DuxApiService.fetchLectureResources(
            targetLecture.id,
        );
        console.log(
            `[PRACTICE ENGINE] Found ${resources.length} resources for this lecture.`,
        );

        // ── AI question generation ───────────────────────────────────────────────
        const questions = await PracticeEngine._fetchQuestions({
            targetLecture,
            courseName,
            courseCode,
            courseLanguage,
            resources,
        });

        // ── Analysis metadata ────────────────────────────────────────────────────
        const safePastExp = Array.isArray(pastExp) ? pastExp : [];
        const analysisMetadata = {
            lectureTitle: targetLecture.title || "General Topics",
            resources: resources.map(
                (r: any) => r.title || r.name || "Resource",
            ),
            studentScore: weakestMark?.score ?? 100,
            lastQuizzes: safePastExp
                .slice(0, 2)
                .map((e: any) => e.title || "Quiz"),
        };

        return {
            topic: targetLecture.topic || targetLecture.title || "Unknown",
            lectureId: targetLecture.id || "unknown",
            courseName,
            courseCode,
            courseLanguage,
            questions,
            recommendationReason: `Based on your recent performance in "${targetLecture.title || "the course"}", our AI generated a custom practice set focusing on your weak points using ${resources.length} available resource${resources.length !== 1 ? "s" : ""}.`,
            analysisMetadata,
            // Store enough context to allow instant regeneration without re-fetching
            _regenerateContext: {
                targetLecture,
                courseName,
                courseCode,
                courseLanguage,
                resources,
            },
        };
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  Regenerate — called by "Try Again" / "New Questions" button.
    //  Reuses the already-resolved context so no extra API calls are needed.
    // ─────────────────────────────────────────────────────────────────────────
    async regenerateQuestions(
        session: PracticeSession,
    ): Promise<PracticeSession> {
        console.log(
            "[PRACTICE ENGINE] Regenerating questions for:",
            session.topic,
        );

        const ctx = (session as any)._regenerateContext;
        if (!ctx) {
            // Fallback: full regeneration
            return PracticeEngine.generateSession(session.lectureId);
        }

        const questions = await PracticeEngine._fetchQuestions(ctx);

        return {
            ...session,
            questions,
            // Reset any UI state the caller may have stored on the session object
            _regenerateContext: ctx,
        };
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  Internal: build payload and call /api/generate-quiz
    // ─────────────────────────────────────────────────────────────────────────
    async _fetchQuestions({
        targetLecture,
        courseName,
        courseCode,
        courseLanguage,
        resources,
    }: {
        targetLecture: any;
        courseName: string;
        courseCode: string;
        courseLanguage: string;
        resources: any[];
    }): Promise<any[]> {
        try {
            const payload = {
                // Use title as the primary topic signal — it's always populated
                topic:
                    targetLecture.title ||
                    targetLecture.topic ||
                    "General Concepts",
                lectureId: targetLecture.id,
                courseName, // ← passed to route for subject detection
                courseCode, // ← passed to route for subject detection
                courseLanguage,
                weakPoints:
                    targetLecture.topic || targetLecture.title || "Unknown",
                //TODO : imrove this point
                resources: resources.map((r: any) => ({
                    title: r.title || "Source Material",
                    summary:
                        r.summary ||
                        `Focus on the topic: ${targetLecture.title}`,
                })),
            };

            console.log(
                `[PRACTICE ENGINE] Calling AI Generator — topic: "${payload.topic}", course: "${courseName}", language: "${courseLanguage}"`,
            );

            const response = await fetch("/api/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "[AI Generation failed]",
                    response.status,
                    response.statusText,
                    errorText,
                );
                return [];
            }

            const data = await response.json();
            const raw = data.questions || [];

            // Light sanitize pass — strips stray LaTeX text commands from prose parts
            return sanitizeQuestions(raw);
        } catch (e) {
            console.error(
                "[PRACTICE ENGINE] Failed to connect to AI generator:",
                e,
            );
            return [];
        }
    },
};
