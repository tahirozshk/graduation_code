'use client'

import React, { useState, useEffect } from 'react'
import { PracticeStore } from '../../lib/store'
import { PracticeSession, QuizQuestion } from '@/types'

export default function PracticePage() {
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    const activeSession = PracticeStore.getSession()
    if (activeSession) {
      setSession(activeSession)
    }
  }, [])

  const currentQuestion = session?.questions[currentQuestionIndex] as QuizQuestion | undefined

  const handleNext = () => {
    if (session && currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setShowAnswer(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedOption(null)
      setShowAnswer(false)
    }
  }

  if (!session) {
    return (
      <div className="practice-view" style={{ textAlign: 'center', padding: '100px' }}>
        <h2>Loading Practice Session...</h2>
        <p>Analyzing your data and preparing questions.</p>
        <button className="btn btn-outline" onClick={() => window.location.href = '/'}>Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="practice-view">
      {/* Title Bar with Progress Bar */}
      <div className="practice-title-bar">
        <div className="title-info">
          <h2>{currentQuestion?.lectureId === 'l1' ? 'Calculating Curve' : 'Practice Session'} - Interaktif Test | <span className="topic">Topic: {session.topic}</span></h2>
          <div className="stats" style={{ color: '#6a1b2b', fontWeight: 'bold' }}>
             <span>Progress: {currentQuestionIndex + 1}/{session.questions.length} Questions</span> | <span>Score: 780</span>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}></div>
          <span className="progress-label">Practice focused on your weakness</span>
        </div>
        <div className="user-score-box">
           <span className="user-icon">👤</span>
           <div className="score-details">
             <strong>Progress Score:</strong>
             <span>Focused Learner</span>
           </div>
        </div>
      </div>

      <div className="practice-content-grid">
        {/* Main Question Area */}
        <div className="question-area card">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1}: {currentQuestion?.difficulty || 'General Knowledge'}</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.6', marginTop: '12px' }}>{currentQuestion?.questionText || 'Loading question...'}</p>
          </div>

          <div className="question-visual">
            <svg viewBox="0 0 400 200" className="math-graph">
              <path d="M 50 100 L 350 100" stroke="#ccc" strokeWidth="1" />
              <path d="M 200 20 L 200 180" stroke="#ccc" strokeWidth="1" />
              <path d="M 100 100 Q 150 20 200 100 T 300 100" fill="none" stroke="#6a1b2b" strokeWidth="2" />
              <path d="M 100 100 Q 150 20 200 100" fill="rgba(106, 27, 43, 0.1)" />
              <path d="M 200 100 Q 250 180 300 100" fill="rgba(65, 105, 225, 0.1)" />
              <text x="360" y="105" fontSize="10">x</text>
              <text x="205" y="30" fontSize="10">y</text>
              <text x="100" y="115" fontSize="10">-2</text>
              <text x="300" y="115" fontSize="10">2</text>
            </svg>
            <div className="math-formula">
              |f(x) = ∫<sub>-2</sub><sup>2</sup> f(x) dx|
            </div>
          </div>

          <div className="options-list">
            {currentQuestion?.options.map((opt, i) => (
              <label key={i} className={`option-item ${selectedOption === i ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="quiz" 
                  checked={selectedOption === i}
                  onChange={() => setSelectedOption(i)}
                />
                <span className="option-text">{opt}</span>
                {selectedOption === i && !showAnswer && (
                  <button className="btn-check-answer" onClick={() => setShowAnswer(true)}>Check Answer</button>
                )}
                {showAnswer && i === currentQuestion.correctAnswer && (
                   <span style={{ color: 'green', fontWeight: 'bold', marginLeft: 'auto' }}>✓ Correct</span>
                )}
              </label>
            ))}
          </div>

          {showAnswer && (
            <div className="explanation-box" style={{ marginTop: '24px', padding: '16px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
              <strong style={{ color: '#2f855a' }}>Explanation:</strong>
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#276749' }}>{currentQuestion?.explanation}</p>
            </div>
          )}
        </div>

        {/* AI Coach Sidebar */}
        <aside className="ai-coach-sidebar">
          <div className="coach-main-title">
            <h3>AI Coach & Resources</h3>
            <small>(Yapay Zeka Koçu ve Kaynaklar)</small>
          </div>

          <div className="coach-card card">
            <div className="card-header">
              <span className="ai-robot">🤖</span>
              <strong>AI Coach (Yapay Zeka Koçu)</strong>
            </div>
            <div className="card-body">
              <p className="coach-message">
                <strong>Correct Selection!</strong> Your last mistake on the quiz was neglecting absolute value. 
                This session is designed to reinforce it. Keep it up!
              </p>
              <button className="btn-flag">Flag for Review</button>
            </div>
          </div>

          <div className="resources-card card">
            <div className="card-header">
              <strong>2. Study Resources (Ders Kaynakları)</strong>
            </div>
            <div className="card-body">
              <div className="resource-item">
                <span className="pdf-icon">📄</span>
                <div className="resource-info">
                  <strong>Reference Lecture:</strong>
                  <span>Section {currentQuestion?.lectureId === 'l1' ? '4.2' : '1.1'} - {session.topic}</span>
                  <a href="#" className="view-notes">View Lecture Notes</a>
                </div>
              </div>
              <div className="resource-thumbnail">
                 <div className="placeholder-img">📚 Slide 12</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="practice-footer">
        <button className="btn btn-outline" onClick={() => window.location.href = '/'}>Back to Dashboard</button>
        <div className="nav-buttons">
          <button className="btn btn-outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous Question</button>
          <button 
            className="btn btn-primary highlighted" 
            onClick={handleNext} 
            disabled={!showAnswer || currentQuestionIndex === session.questions.length - 1}
          >
            Next Question
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .practice-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .practice-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eee;
          gap: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .title-info h2 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .topic {
          color: #6a1b2b;
        }

        .stats {
          font-size: 13px;
          color: #666;
        }

        .progress-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-bar {
          height: 10px;
          background: #6a1b2b;
          border-radius: 5px;
          position: relative;
          overflow: hidden;
        }

        .progress-bar::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          width: 200%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-label {
          font-size: 11px;
          color: #888;
          text-align: center;
          font-weight: 600;
        }

        .user-score-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 20px;
          border-left: 1px solid #eee;
        }

        .user-icon {
          font-size: 24px;
          background: #fdf2f4;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .score-details strong {
          display: block;
          font-size: 12px;
          color: #6a1b2b;
        }

        .score-details span {
          font-size: 13px;
          font-weight: 600;
        }

        .practice-content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        .card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #eee;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .question-header {
          margin-bottom: 24px;
        }

        .question-header h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6a1b2b;
          margin-bottom: 8px;
        }

        .question-visual {
          background: #fcfcfc;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          border: 1px solid #f0f0f0;
        }

        .math-graph {
          width: 100%;
          max-width: 450px;
        }

        .math-formula {
          font-family: 'Times New Roman', serif;
          font-size: 20px;
          font-weight: bold;
          padding: 12px 24px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-item {
          display: flex;
          align-items: center;
          padding: 18px 24px;
          border: 2px solid #f0f0f0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .option-item:hover {
          border-color: #6a1b2b22;
          background: #fdf2f422;
        }

        .option-item.selected {
          border-color: #6a1b2b;
          background: #fdf2f4;
        }

        .option-text {
          font-weight: 600;
          color: #444;
          margin-left: 16px;
          flex: 1;
        }

        .btn-check-answer {
          background: #6a1b2b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-check-answer:hover {
          transform: scale(1.05);
        }

        .ai-coach-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .coach-main-title h3 {
          font-size: 16px;
          color: #333;
          font-weight: 800;
        }

        .coach-main-title small {
          color: #999;
          font-size: 11px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f5f5f5;
        }

        .ai-robot {
          font-size: 24px;
        }

        .coach-message {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .btn-flag {
           width: 100%;
           background: #fff;
           color: #6a1b2b;
           border: 1px solid #6a1b2b;
           padding: 12px;
           border-radius: 10px;
           font-weight: 800;
           cursor: pointer;
           transition: all 0.2s;
        }

        .btn-flag:hover {
          background: #6a1b2b;
          color: #fff;
        }

        .resource-item {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
        }

        .resource-info {
           display: flex;
           flex-direction: column;
           gap: 4px;
        }

        .resource-info strong {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #999;
        }

        .resource-info span {
          font-size: 14px;
          font-weight: 700;
          color: #333;
          line-height: 1.3;
        }

        .view-notes {
          font-size: 12px;
          color: #6a1b2b;
          font-weight: 700;
          text-decoration: none;
          margin-top: 4px;
        }

        .view-notes:hover {
          text-decoration: underline;
        }

        .resource-thumbnail {
          height: 100px;
          background: #fdfdfd;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eee;
          color: #888;
          font-size: 12px;
          font-weight: 600;
          background-image: linear-gradient(45deg, #fafafa 25%, transparent 25%, transparent 50%, #fafafa 50%, #fafafa 75%, transparent 75%, transparent);
          background-size: 20px 20px;
        }

        .practice-footer {
          display: flex;
          justify-content: space-between;
          padding: 24px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eee;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.02);
        }

        .btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #ddd;
          color: #666;
        }

        .btn-outline:hover:not(:disabled) {
          border-color: #6a1b2b;
          color: #6a1b2b;
          background: #fdf2f4;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary.highlighted {
           background: #6a1b2b;
           color: white;
           padding-left: 40px;
           padding-right: 40px;
           box-shadow: 0 4px 15px rgba(106, 27, 43, 0.3);
        }

        .btn-primary.highlighted:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(106, 27, 43, 0.4);
        }
      ` }} />
    </div>
  )
}
