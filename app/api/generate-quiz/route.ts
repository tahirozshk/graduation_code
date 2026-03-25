import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, resources, weakPoints } = body;

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn("No GOOGLE_API_KEY found. Returning mock AI generated questions.");
      return NextResponse.json({ 
        questions: [
          { id: 'q1', text: 'Mock Gemini Question: What is Calculus?', options: ['Math', 'Art', 'History', 'Music'], correctAnswer: 0, explanation: 'Calculus is a branch of mathematics.' },
          { id: 'q2', text: 'Mock Gemini Question: Who founded Math 101?', options: ['Newton', 'Leibniz', 'Dux AI', 'Einstein'], correctAnswer: 2, explanation: 'Prof. Dux is the platform tutor.' }
        ]
      });
    }

    const prompt = `You are an expert AI tutor. Generate a 5-question multiple-choice quiz that PRIORITIZES the following Lecture Topic Title for question content, while using the provided resources for context.
    
    Lecture Topic Title: ${topic}
    Weaknesses: ${weakPoints}
    Resources: ${JSON.stringify(resources)}
    
    Guidelines:
    - **Problem Focus**: Generate complex "Word Problems" requiring multi-step calculation.
    - **No Spoilers**: NEVER hint at the answer in the question.
    - **CRITICAL**: Use professional LaTeX (e.g., \\frac{a}{b}, \\div).
    - **Math Formatting**: You MUST wrap ALL LaTeX and math expressions in $ signs (e.g., $a_{100} \\text{ is even}$) in the text, options, and explanation fields.
    - **JSON Format**: You MUST output EXACTLY 5 questions in a valid JSON array. Do not truncate the response. Ensure every question has 4 options, a correctAnswer index (0-3), and a clear explanation.
    - Each question can optionally have a "visual" object.
    
    Output ONLY valid JSON matching this structure:
    {
      "questions": [
        { 
          "id": "string", 
          "text": "string (Wrap math in $...$)", 
          "options": ["string (Wrap math in $...$)", "string", "string", "string"], 
          "correctAnswer": number, 
          "explanation": "string (Wrap math in $...$)",
          "visual": { "type": "formula" | "graph" | "image", "value": "string", "label": "string" }
        }
      ]
    }`;

    // Google AI Studio (Gemini) API Endpoint (using verified identifier)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    console.log(`[GEMINI API] Requesting quiz generation for topic: ${topic}`);

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[GEMINI ERROR] Status: ${response.status}, Body: ${errorData}`);
      throw new Error(`Gemini API Error: ${response.statusText} - ${errorData}`);
    }

    const geminiData = await response.json();
    const resultString = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultString) {
      console.error("[GEMINI ERROR] Empty response body:", JSON.stringify(geminiData));
      throw new Error("Gemini API returned empty response during quiz generation");
    }

    // Sanitize resultString: sometimes AI wraps JSON in markdown blocks
    const sanitized = resultString
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log("[GEMINI SANITIZED]:", sanitized.substring(0, 200) + "...");

    let data;
    try {
      data = JSON.parse(sanitized);
    } catch (parseError) {
      console.error("[GEMINI JSON ERROR] Failed to parse. Raw string:", resultString);
      throw new Error("AI produced invalid JSON format. Please try again.");
    }
    
    // Fallback if AI didn't generate questions properly
    if (!data.questions || data.questions.length === 0) {
      console.warn("[GEMINI WARNING] AI returned zero questions. Providing common fallback questions.");
      data.questions = [
        { id: 'f1', text: `Solve: $45 \\div 5 \\times 2$`, options: ['18', '9', '20', '4.5'], correctAnswer: 0, explanation: 'Order of operations: $45 \\div 5 = 9$, then $9 \\times 2 = 18$.' },
        { id: 'f2', text: `If a book costs $120$ and has a $25\\%$ discount, what is the final price?`, options: ['$90$', '$100$', '$80$', '$95$'], correctAnswer: 0, explanation: '$25\\%$ of $120$ is $30$. $120 - 30 = 90$.' }
      ];
    }

    console.log(`[GEMINI SUCCESS] Generated ${data.questions?.length || 0} questions.`);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error generating Gemini AI practice:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
