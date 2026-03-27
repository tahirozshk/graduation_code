'use client'

import React, { useState, useEffect } from 'react'
import { PracticeStore } from '../../lib/store'
import { PracticeSession, QuizQuestion } from '@/types'
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MathText = ({ text }: { text: string }) => {
  if (!text) return null;

  // If the text contains explicit $...$ blocks (legacy or edge cases), render them with KaTeX
  if (text.includes('$')) {
    const parts = text.split(/(\$[^$]+\$)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('$') && part.endsWith('$')) {
            try {
              return <InlineMath key={i} math={part.slice(1, -1)} />;
            } catch {
              return <span key={i}>{part.slice(1, -1)}</span>;
            }
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  // Plain text — Unicode math notation (x², √, ∫, Δ, etc.) renders natively in the browser
  return <span>{text}</span>;
};

const QuestionVisual = ({ visual }: { visual?: QuizQuestion['visual'] }) => {
  if (!visual || !visual.value) return null;

  switch (visual.type) {
    case 'formula':
      return (
        <div style={{
          textAlign: 'center', padding: '20px 24px',
          background: 'rgba(106, 27, 43, 0.08)', borderRadius: '14px',
          border: '1px solid rgba(106, 27, 43, 0.2)',
          fontSize: '18px', fontWeight: '600', color: '#fff', letterSpacing: '0.5px'
        }}>
          {visual.value}
          {visual.label && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px', fontWeight: '400' }}>{visual.label}</div>}
        </div>
      );

    case 'graph': {
      // Parse coordinate pairs: "50,180 100,120 150,80 200,60 ..."
      const pairs = visual.value.trim().split(/\s+/).map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      }).filter(p => !isNaN(p.x) && !isNaN(p.y));

      // If parsing failed, try treating value as raw SVG path
      if (pairs.length < 2) {
        return (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg viewBox="0 0 400 200" style={{ maxWidth: '420px', width: '100%', height: 'auto' }}>
              <path d="M 50 100 L 350 100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <path d="M 200 20 L 200 180" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <path d={visual.value} fill="none" stroke="#6a1b2b" strokeWidth="2.5" />
              {visual.label && <text x="200" y="195" textAnchor="middle" fontSize="11" fill="#888">{visual.label}</text>}
            </svg>
          </div>
        );
      }

      // Build polyline from data points
      const polylinePoints = pairs.map(p => `${p.x},${p.y}`).join(' ');
      // Build area fill (close path at bottom)
      const areaPath = `M ${pairs[0].x},180 ` + pairs.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${pairs[pairs.length - 1].x},180 Z`;

      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
          <svg viewBox="0 0 400 210" style={{ maxWidth: '440px', width: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6a1b2b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6a1b2b" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[20, 60, 100, 140, 180].map(y => (
              <line key={`h${y}`} x1="50" y1={y} x2="350" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            {[50, 100, 150, 200, 250, 300, 350].map(x => (
              <line key={`v${x}`} x1={x} y1="20" x2={x} y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}

            {/* Axes */}
            <line x1="50" y1="180" x2="350" y2="180" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <line x1="50" y1="20" x2="50" y2="180" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

            {/* Gradient fill under curve */}
            <path d={areaPath} fill="url(#graphFill)" />

            {/* Curve line */}
            <polyline points={polylinePoints} fill="none" stroke="#e8485c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data point dots */}
            {pairs.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#e8485c" stroke="#1a1a2e" strokeWidth="2" />
            ))}

            {/* Label */}
            {visual.label && (
              <text x="200" y="205" textAnchor="middle" fontSize="12" fill="#aaa" fontStyle="italic">{visual.label}</text>
            )}
          </svg>
        </div>
      );
    }

    case 'image':
      return (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <img
            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop"
            alt={visual.label || 'Question visual'}
            style={{ borderRadius: '16px', maxWidth: '100%', height: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          />
          {visual.label && <p style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>{visual.label}</p>}
        </div>
      );

    default:
      return null;
  }
}

export default function PracticePage() {
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [answers, setAnswers] = useState<Array<{ questionId: string, selectedOption: number, isCorrect: boolean }>>([])
  const [coachData, setCoachData] = useState<{ coachMessage: string, knowledgeGaps: string[], score: number } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── Deterministic score: (correct / total) × 100, rounded ──────────────
  const totalQuestions = session?.questions?.length || 0;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const calculatedScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    setMounted(true)
    const activeSession = PracticeStore.getSession()
    if (activeSession) {
      setSession(activeSession)
    }
  }, [])

  // Restore answer state when navigating (Prev/Next)
  useEffect(() => {
    if (!session || !session.questions) return;
    const currentQ = session.questions[currentQuestionIndex];
    if (!currentQ) return;

    const existingAnswer = answers.find(a => a.questionId === currentQ.id);
    if (existingAnswer) {
      setSelectedOption(existingAnswer.selectedOption);
      setShowAnswer(true);
    } else {
      setSelectedOption(null);
      setShowAnswer(false);
    }
  }, [currentQuestionIndex, session, answers]);

  // Auto-retry: if session exists but has no questions, regenerate automatically
  useEffect(() => {
    if (!session || !session.lectureId) return;
    if (session.questions && session.questions.length > 0) return;

    let cancelled = false;
    const retry = async (attempt: number) => {
      if (cancelled || attempt > 3) return;
      try {
        const { PracticeEngine } = await import('../../lib/practice-engine');
        const newSession = await PracticeEngine.generateSession(session.lectureId);
        if (cancelled) return;
        if (newSession && newSession.questions && newSession.questions.length > 0) {
          setSession(newSession);
          PracticeStore.saveSession(newSession);
        } else if (attempt < 3) {
          setTimeout(() => retry(attempt + 1), 1500);
        }
      } catch {
        if (!cancelled && attempt < 3) {
          setTimeout(() => retry(attempt + 1), 2000);
        }
      }
    };
    retry(1);
    return () => { cancelled = true; };
  }, [session]);

  // ── Loading / empty guards (after all hooks) ──────────────────────────────
  if (!mounted || !session || !session.questions || session.questions.length === 0) {
    return (
      <div className="practice-view" style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
        <div className="loader" style={{ margin: '0 auto 24px auto' }}></div>
        <h2>Generating Questions...</h2>
        <p style={{ color: '#888', marginTop: '12px' }}>AI is preparing your personalized quiz. This may take a few seconds.</p>
        <button className="btn btn-outline" style={{ marginTop: '32px' }} onClick={() => window.location.href = '/'}>← Back to Dashboard</button>
      </div>
    )
  }

  const currentQuestion = session?.questions[currentQuestionIndex] as QuizQuestion | undefined

  const handleCheckAnswer = async () => {
    if (selectedOption === null || !currentQuestion || !session) return;
    
    setShowAnswer(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newAnswer = { questionId: currentQuestion.id, selectedOption, isCorrect };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    
    setIsAnalyzing(true);
    try {
      const { DuxApiService } = await import('../../lib/api-service');
      const feedback = await DuxApiService.analyzePerformance({
        topic: session.topic,
        lectureId: session.lectureId,
        answers: updatedAnswers.map(ans => ({
          ...ans,
          questionText: session.questions.find(q => q.id === ans.questionId)?.questionText || ''
        })),
        resources: []
      });
      if (feedback) setCoachData(feedback);
    } catch (e) {
      console.error(e);
    }
    setIsAnalyzing(false);
  }

  const handleNext = () => {
    if (currentQuestionIndex < (session?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowSummary(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleTryAgain = async () => {
    setIsAnalyzing(true);
    setShowSummary(false);
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCoachData(null);
    setSelectedOption(null);
    setShowAnswer(false);

    try {
      const { PracticeEngine } = await import('../../lib/practice-engine');
      const newSession = await PracticeEngine.generateSession(session?.lectureId || '');
      setSession(newSession);
      PracticeStore.saveSession(newSession);
    } catch (e) {
      console.error("Failed to regenerate session:", e);
      alert("Yeniden deneme sırasında bir hata oluştu. Lütfen ana sayfaya dönüp tekrar deneyin.");
      window.location.href = '/';
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (showSummary) {
    // Collect wrong answers with their original question index
    const wrongAnswerIndices = answers
      .filter(a => !a.isCorrect)
      .map(a => session.questions.findIndex(q => q.id === a.questionId))
      .filter(i => i !== -1);

    const wrongQuestions = wrongAnswerIndices.map(i => session.questions[i]);

    // Build weak topic cards from wrong questions
    const weakTopics = wrongQuestions.map((q, idx) => ({
      questionNumber: wrongAnswerIndices[idx] + 1,
      snippet: (q.text || q.questionText || '').substring(0, 100) + ((q.text || '').length > 100 ? '...' : ''),
    }));

    const scoreColor = calculatedScore >= 80 ? '#4ade80' : calculatedScore >= 50 ? '#fbbf24' : '#f87171';
    const scoreEmoji = calculatedScore >= 80 ? '🎉' : calculatedScore >= 50 ? '💪' : '📚';
    const scoreMessage = calculatedScore >= 80
      ? 'Excellent! You have a strong understanding of this topic.'
      : calculatedScore >= 50
        ? 'Good effort! Review the topics below to strengthen your knowledge.'
        : 'Keep practicing! Focus on the weak areas listed below.';

    // Handler: go back to quiz view on the first wrong question
    const handleReviewMistakes = () => {
      if (wrongAnswerIndices.length > 0) {
        setCurrentQuestionIndex(wrongAnswerIndices[0]);
      }
      setShowSummary(false);
    };

    return (
      <div className="practice-view summary-view" style={{ padding: '40px 20px', animation: 'fadeIn 0.6s ease' }}>
        {/* ── Score Card ───────────────────────────────────────────── */}
        <div className="card summary-card" style={{ maxWidth: '700px', margin: '0 auto 32px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{scoreEmoji}</div>
          <h2 style={{ fontSize: '28px', marginBottom: '8px', color: '#fff' }}>Practice Complete!</h2>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '28px', borderRadius: '20px', margin: '20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Score</div>
            <div style={{ fontSize: '64px', fontWeight: '900', color: scoreColor, margin: '4px 0' }}>{calculatedScore}</div>
            <div style={{ fontSize: '15px', color: '#ccc' }}>
              <span style={{ color: '#4ade80' }}>✓ {correctCount} correct</span>
              {' · '}
              <span style={{ color: '#f87171' }}>✗ {wrongAnswerIndices.length} wrong</span>
              {' · '}
              <span>{totalQuestions} total</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ height: '100%', background: scoreColor, width: `${calculatedScore}%`, transition: 'width 1s ease-out' }}></div>
            </div>
          </div>

          <p style={{ color: '#ccc', lineHeight: '1.6', margin: '0 0 24px 0' }}>{scoreMessage}</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '0.5px' }}>← Back to Dashboard</button>
            {wrongAnswerIndices.length > 0 && (
              <button className="btn btn-outline" onClick={handleReviewMistakes} style={{ borderColor: '#f87171', color: '#f87171' }}>
                🔍 Review Mistakes
              </button>
            )}
            <button className="btn btn-primary highlighted" onClick={handleTryAgain}>Try Again</button>
          </div>
        </div>

        {/* ── Weak Topics ─────────────────────────────────────────── */}
        {weakTopics.length > 0 && (
          <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📊</span> Areas to Improve
            </h3>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px' }}>
              Based on your wrong answers, focus on these topics:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weakTopics.map((wt, idx) => (
                <div key={idx} style={{
                  background: 'rgba(248, 113, 113, 0.08)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}>
                  <div style={{ color: '#f87171', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                    ⚠ Question {wt.questionNumber}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.5' }}>
                    {wt.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── All Correct ──────────────────────────────────────────── */}
        {wrongAnswerIndices.length === 0 && (
          <div className="card" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <h3 style={{ color: '#4ade80', marginBottom: '8px' }}>Perfect Score!</h3>
            <p style={{ color: '#aaa', fontSize: '14px' }}>You answered every question correctly. Outstanding work!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="practice-view">
      <div className="practice-title-bar">
        <div className="title-info">
          <h2>Practice Session | <span className="topic">{session.topic}</span></h2>
          <div className="stats">
             <span>Progress: {currentQuestionIndex + 1}/{session.questions.length} Questions</span> | <span>Score: {correctCount}/{answers.length} correct</span>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}></div>
          <span className="progress-label">Practice focused on your weakness</span>
        </div>
      </div>

      <div className="practice-content-grid">
        <div className="question-area card">
          <div className="question-content-box">
            <div className="question-header">
              <h3>Question {currentQuestionIndex + 1}: {currentQuestion?.difficulty || 'General Knowledge'}</h3>
              <div className="question-text" style={{ fontSize: '20px', lineHeight: '1.6', marginTop: '12px' }}>
                <MathText text={currentQuestion?.text || currentQuestion?.questionText || ''} />
              </div>
            </div>

            {currentQuestion?.visual && (
              <div className="question-visual-wrapped" style={{ margin: '24px 0', padding: '32px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <QuestionVisual visual={currentQuestion.visual} />
              </div>
            )}
          </div>

          <div className="options-list">
            {currentQuestion?.options.map((opt, i) => (
              <label key={i} className={`option-item ${selectedOption === i ? 'selected' : ''}`}>
                <input type="radio" checked={selectedOption === i} onChange={() => setSelectedOption(i)} />
                <span className="option-text"><MathText text={opt} /></span>
                {selectedOption === i && !showAnswer && (
                  <button className="btn-small" onClick={handleCheckAnswer}>Check Answer</button>
                )}
                {showAnswer && i === currentQuestion.correctAnswer && (
                   <span style={{ color: '#00ff00', fontWeight: 'bold', marginLeft: 'auto' }}>✓ Correct</span>
                )}
              </label>
            ))}
          </div>

          {showAnswer && (
            <div className="explanation-box" style={{ marginTop: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <strong style={{ color: '#fff' }}>Explanation:</strong>
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#ccc' }}>
                <MathText text={currentQuestion?.explanation || ''} />
              </p>
            </div>
          )}
        </div>

        <aside className="ai-coach-sidebar">
          <div className="coach-card card">
             <div className="card-header">
               🤖 <strong>AI Coach</strong>
               {isAnalyzing && <div className="mini-loader"></div>}
             </div>
             <div className="card-body">
               <p>{coachData?.coachMessage || "Answer questions to get personalized feedback!"}</p>
               {coachData && coachData.knowledgeGaps.length > 0 && (
                 <div className="gaps" style={{ marginTop: '16px' }}>
                   <strong>Focused Areas:</strong>
                   <ul style={{ fontSize: '12px', color: '#888', paddingLeft: '16px', marginTop: '4px' }}>
                     {coachData.knowledgeGaps.map((gap, idx) => <li key={idx}>{gap}</li>)}
                   </ul>
                 </div>
               )}
             </div>
          </div>
        </aside>
      </div>

      <div className="practice-footer">
        <button className="btn btn-outline" onClick={() => window.location.href = '/'}>End Session</button>
        <div className="nav-buttons">
          <button className="btn btn-outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</button>
          <button className="btn btn-primary highlighted" onClick={handleNext} disabled={!showAnswer}>
            {currentQuestionIndex === session.questions.length - 1 ? 'Calculate Score' : 'Next Question'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .practice-view { display: flex; flex-direction: column; gap: 24px; color: white; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .practice-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
        .progress-container { flex: 1; margin: 0 40px; }
        .progress-bar { height: 8px; background: #6a1b2b; border-radius: 4px; transition: width 0.3s ease; }
        .progress-label { font-size: 11px; color: #888; display: block; text-align: center; margin-top: 8px; }
        .practice-content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        .card { background: rgba(255,255,255,0.03); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); padding: 32px; }
        .option-item { display: flex; align-items: center; padding: 20px; border: 2px solid rgba(255,255,255,0.1); border-radius: 16px; cursor: pointer; margin-bottom: 12px; transition: 0.2s; }
        .option-item.selected { border-color: white; background: rgba(255,255,255,0.05); }
        .option-text { margin-left: 16px; flex: 1; font-weight: 500; }
        .btn-small { background: #6a1b2b; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .practice-footer { display: flex; justify-content: space-between; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
        .btn { padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; }
        .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; }
        .btn-primary.highlighted { background: #6a1b2b; color: white; box-shadow: 0 4px 15px rgba(106, 27, 43, 0.4); }
        .mini-loader { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #6a1b2b; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      ` }} />
    </div>
  )
}
