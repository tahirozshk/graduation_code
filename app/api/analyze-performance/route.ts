import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, answers, resources } = body;

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        coachMessage: "No Google API key found. I can't analyze your performance right now, but keep practicing!",
        knowledgeGaps: ["Could not analyze gaps."],
        score: 0
      });
    }

    const prompt = `You are an expert AI Learning Coach. Analyze the student's performance on a quiz about "${topic}".
    
    Inputs:
    - Student Answers: ${JSON.stringify(answers)}
    - Reference Resources (Summaries): ${JSON.stringify(resources)}
    
    Tasks:
    1. Provide a concise, encouraging "coachMessage".
    2. Identify specific "knowledgeGaps" (concepts the student struggled with).
    3. Calculate a "score" out of 100 based on their accuracy.
    
    Output ONLY valid JSON matching this structure:
    {
      "coachMessage": "string",
      "knowledgeGaps": ["string"],
      "score": number
    }`;

    // Google AI Studio (Gemini) API Endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

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
      console.error(`[GEMINI PERFORMANCE ERROR] Status: ${response.status}, Body: ${errorData}`);
      throw new Error(`Gemini API Error: ${response.statusText} - ${errorData}`);
    }

    const geminiData = await response.json();
    const resultString = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultString) {
      throw new Error("Gemini API returned empty response during analysis");
    }

    const data = JSON.parse(resultString);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error analyzing Gemini performance:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
