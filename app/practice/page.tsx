'use client'

import React, { useState, useEffect } from 'react'
import { PracticeStore } from '../../lib/store'
import { PracticeSession, QuizQuestion } from '@/types'
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MathText = ({ text }: { text: string }) => {
  if (!text) return null;
  // Fallback: If AI returns raw LaTeX without $ signs, wrap the entire string if it contains math syntax
  let processedText = text;
  if (!processedText.includes('$') && (processedText.includes('\\') || /[_^]/.test(processedText))) {
    processedText = `$${processedText}$`;
  }
  
  const parts = processedText.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const QuestionVisual = ({ visual }: { visual?: QuizQuestion['visual'] }) => {
  if (!visual || !visual.value) return null;

  switch (visual.type) {
    case 'formula':
      return (
        <div className="math-formula">
          <BlockMath math={visual.value} />
        </div>
      );
    case 'graph':
      return (
        <div className="math-graph-dynamic" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg viewBox="0 0 400 200" style={{ maxWidth: '400px', width: '100%', height: 'auto' }}>
            <path d="M 50 100 L 350 100" stroke="#eee" strokeWidth="1" />
            <path d="M 200 20 L 200 180" stroke="#eee" strokeWidth="1" />
            <path d={visual.value} fill="none" stroke="#6a1b2b" strokeWidth="2.5" />
            {visual.label && (
              <text x="200" y="195" textAnchor="middle" fontSize="12" fill="#666" style={{ fontStyle: 'italic' }}>
                {visual.label}
              </text>
            )}
          </svg>
        </div>
      );
    case 'image':
      return (
        <div className="question-image" style={{ width: '100%', textAlign: 'center' }}>
          <img 
            src={`https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop`} 
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

  if (!mounted || !session) {
    return (
      <div className="practice-view" style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loader" style={{ margin: '0 auto 24px auto' }}></div>
        <h2>Preparing Your Session...</h2>
        <p style={{ color: '#888', marginTop: '12px' }}>Analyzing resources and generating problems.</p>
        <button className="btn btn-outline" style={{ marginTop: '32px' }} onClick={() => window.location.href = '/'}>Back to Dashboard</button>
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
    return (
      <div className="practice-view summary-view" style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.6s ease' }}>
        <div className="card summary-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="completion-icon" style={{ fontSize: '64px', marginBottom: '24px' }}>🎯</div>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Practice Complete!</h2>
          <div className="final-score-box" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '32px', borderRadius: '24px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Final Score</span>
            <div style={{ fontSize: '72px', fontWeight: '900', color: '#fff', margin: '8px 0' }}>{coachData?.score || 0}</div>
            <div className="score-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ height: '100%', background: '#6a1b2b', width: `${coachData?.score || 0}%`, transition: 'width 1s ease-out' }}></div>
            </div>
          </div>
          <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '40px' }}>
            {coachData?.coachMessage || "Great job completing this practice session. You're making steady progress!"}
          </p>
          <div className="summary-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => window.location.href = '/'}>Back to Dashboard</button>
            <button className="btn btn-primary highlighted" onClick={handleTryAgain}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-view">
      <div className="practice-title-bar">
        <div className="title-info">
          <h2>Practice Session | <span className="topic">{session.topic}</span></h2>
          <div className="stats">
             <span>Progress: {currentQuestionIndex + 1}/{session.questions.length} Questions</span> | <span>Score: {coachData?.score || 0}</span>
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
