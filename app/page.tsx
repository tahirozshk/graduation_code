'use client'

import React, { useState, useEffect } from 'react'

import { DuxApiService } from '../lib/api-service'
import { PracticeEngine } from '../lib/practice-engine'
import { PracticeStore } from '../lib/store'
import { Lecture } from '@/types'

export default function CoursePage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [openLectures, setOpenLectures] = useState<string[]>(['l4'])
  const [showModal, setShowModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    DuxApiService.fetchLectureList().then(setLectures)
  }, [])

  const handlePracticeClick = async (lectureId?: string) => {
    setShowModal(true)
    setIsAnalyzing(true)
    
    // Core "Practice Engine Module" call (Input 1, 2, 3, 4 integrated here)
    const result = await PracticeEngine.generateSession(lectureId)
    setSession(result)
    PracticeStore.saveSession(result)
    
    // Simulate thinking/analysis delay
    setTimeout(() => setIsAnalyzing(false), 2000)
  }

  const toggleLecture = (id: string) => {
    if (openLectures.includes(id)) {
      setOpenLectures(openLectures.filter(lid => lid !== id))
    } else {
      setOpenLectures([...openLectures, id])
    }
  }

  return (
    <div className="course-view">
      <div className="top-actions">
        <div className="actions-left">
          <button className="btn btn-primary">Back</button>
          <button className="btn btn-primary">View Course Exams</button>
        </div>
        <button className="btn btn-practice-more" onClick={() => setShowModal(true)}>
          Practice More
          <span className="sparkle-icon">✨</span>
        </button>
      </div>

      <div className="course-header">
        <h2 className="course-title">Precious Test (Test2)</h2>
      </div>

      <div className="section-card">
        <h3 className="section-title">Submissions</h3>
        <p className="section-text text-muted">No submissions for this course yet</p>
      </div>

      <div className="info-card">
         <div className="info-icon">ℹ️</div>
         <span className="info-label">Course Information</span>
      </div>

      <div className="lectures-section">
        <div className="lectures-header">
          <h3 className="section-title">Lectures</h3>
          <span className="badge">{lectures.length}</span>
        </div>

        <div className="lectures-list">
          {lectures.map((lecture) => (
            <div key={lecture.id} className="lecture-item">
              <div 
                className={`lecture-row ${openLectures.includes(lecture.id) ? 'active' : ''}`}
                onClick={() => toggleLecture(lecture.id)}
              >
                <div className="lecture-left">
                  <span className="arrow-icon">{openLectures.includes(lecture.id) ? '▼' : '▶'}</span>
                  <span className="lecture-title">{lecture.title}</span>
                </div>
                <div className="lecture-right" style={{ display: 'flex', alignItems: 'center' }}>
                  <button className="btn-practice-sub" onClick={(e) => { e.stopPropagation(); handlePracticeClick(lecture.id); }}>Practice</button>
                  <span className="lecture-date">{lecture.date}</span>
                </div>
              </div>
              
              {openLectures.includes(lecture.id) && (
                <div className="lecture-content">
                  <p className="content-text">No resources available for this lecture.</p>
                  <div className="empty-state" style={{ marginTop: '12px' }}>
                    <button className="btn-empty" onClick={() => handlePracticeClick(lecture.id)}>Practice this topic</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="recommendation-modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            
            <div className="modal-header">
              <span className="ai-icon">🤖</span>
              <h3>Smart Practice Recommendation</h3>
            </div>
            
            <div className="modal-body">
              {isAnalyzing ? (
                <div className="analysis-status">
                  <div className="loader"></div>
                  <p>AI is analyzing your performance...</p>
                </div>
              ) : (
                <>
                  <p className="recommendation-text">
                    {session?.recommendationReason || "We analyzed your performance and generated a custom practice set for you."}
                  </p>
                  
                  <div className="analysis-grid">
                    <div className="analysis-item confirmed">
                      <span className="item-icon">📖</span>
                      <div className="item-info">
                        <strong>1. Lecture List</strong>
                        <small>(Confirmed)</small>
                      </div>
                    </div>
                    <div className="analysis-item fetched">
                      <span className="item-icon">📚</span>
                      <div className="item-info">
                        <strong>2. Lecture Resources</strong>
                        <small>(Fetched)</small>
                      </div>
                    </div>
                    <div className="analysis-item analyzed">
                      <span className="item-icon">👥</span>
                      <div className="item-info">
                        <strong>3. Student Marks</strong>
                        <small>(Analyzed)</small>
                      </div>
                    </div>
                    <div className="analysis-item referenced">
                      <span className="item-icon">📄</span>
                      <div className="item-info">
                        <strong>4. Last Quizzes/Exams</strong>
                        <small>(Referenced)</small>
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn-start-session" onClick={() => window.location.href = '/practice'}>
                    Start Practice Session
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .course-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .actions-left {
          display: flex;
          gap: 16px;
        }

        .btn-practice-more {
          background-color: #6a1b2b;
          color: white;
          padding: 10px 24px;
          border-radius: 24px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(106, 27, 43, 0.2);
          transition: all 0.3s ease;
        }

        .btn-practice-more:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(106, 27, 43, 0.3);
        }

        .sparkle-icon {
          font-size: 16px;
        }

        .btn-practice-sub {
          background: #fff;
          border: 1px solid #6a1b2b;
          color: #6a1b2b;
          padding: 4px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 16px;
          transition: all 0.2s;
        }

        .btn-practice-sub:hover {
          background: #6a1b2b;
          color: #fff;
        }

        .btn-empty {
           background: #6a1b2b;
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        .course-title {
          font-size: 32px;
          margin-top: 8px;
          color: #222;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .recommendation-modal {
          background: #fff;
          width: 90%;
          max-width: 550px;
          border-radius: 20px;
          padding: 32px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .modal-header {
           display: flex;
           align-items: center;
           gap: 12px;
           margin-bottom: 24px;
        }

        .ai-icon {
          font-size: 28px;
        }

        .modal-header h3 {
          font-size: 22px;
          color: #333;
        }

        .recommendation-text {
          color: #555;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .analysis-item {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-icon {
          font-size: 20px;
          width: 40px;
          height: 40px;
          background: #fff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .item-info {
          display: flex;
          flex-direction: column;
        }

        .item-info strong {
          font-size: 14px;
          color: #333;
        }

        .item-info small {
          font-size: 11px;
          color: #888;
        }

        .btn-start-session {
          width: 100%;
          background: #6a1b2b;
          color: white;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-start-session:hover {
          background: #5a1725;
          transform: translateY(-2px);
        }

        .analysis-status {
          text-align: center;
          padding: 40px 0;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #6a1b2b;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .section-card {
          border-bottom: 2px solid #6a1b2b;
          padding-bottom: 12px;
        }

        .section-title {
          font-size: 18px;
          color: #333;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .info-card {
          background: #fdfdfd;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6a1b2b;
          font-weight: 600;
        }

        .info-icon {
          background: #6a1b2b;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .lectures-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .lectures-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lecture-item {
          border: 1px solid #eee;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }

        .lecture-row {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .lecture-row:hover {
          background: #fcfcfc;
        }

        .lecture-row.active {
          border-left: 4px solid #6a1b2b;
        }

        .lecture-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .arrow-icon {
          font-size: 10px;
          color: #6a1b2b;
        }

        .lecture-title {
          font-weight: 500;
          color: #444;
        }

        .lecture-date {
          font-size: 12px;
          color: #999;
        }

        .lecture-content {
          padding: 24px 36px;
          background: #fafafa;
          border-top: 1px solid #eee;
        }

        .content-text {
          color: #666;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .text-muted {
          color: #888;
        }
      ` }} />
    </div>
  )
}
