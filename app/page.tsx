'use client'

import React, { useState, useEffect } from 'react'

import { DuxApiService } from '../lib/api-service'
import { PracticeEngine } from '../lib/practice-engine'
import { PracticeStore } from '../lib/store'
import {
  getStoredAccessToken,
  getStoredSelectedCourseId,
  isAllowedParentOrigin,
  isPracticeBridgePayload,
  storeBridgePayload,
} from '../lib/auth-bridge'
import { Course, Lecture } from '@/types'

export default function CoursePage() {
  const [view, setView] = useState<'grid' | 'detail'>('grid')
  const [language, setLanguage] = useState<'en' | 'tr'>('en')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [openLectures, setOpenLectures] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [lectureResources, setLectureResources] = useState<Record<string, any[]>>({})
  const [hasAccessToken, setHasAccessToken] = useState(false)
  const [authMessage, setAuthMessage] = useState('Waiting for dashboard authorization...')
  const ui = {
    en: {
      courses: 'Courses',
      back: 'Back',
      authorizingTitle: 'Authorizing Practice Module',
      authWaiting: 'Waiting for dashboard authorization...',
      authMissing: 'Authorization was not received. Open this module from the student dashboard.',
      authError: 'AI coach is busy right now or timed out while preparing 10 questions. Please try again.',
      courseInformation: 'Course Information',
      lectures: 'Lectures',
      practice: 'Practice',
      practiceTopic: 'Practice this topic',
      noResources: 'No resources available for this lecture.',
      resourceFile: 'Resource File',
      recommendationTitle: 'Smart Practice Recommendation',
      analyzing: 'AI is analyzing your performance...',
      recommendationFallback: 'We analyzed your performance and generated a custom practice set for you.',
      lectureList: 'Lecture List',
      lectureResources: 'Lecture Resources',
      studentMarks: 'Student Marks',
      lastQuizzes: 'Last Quizzes/Exams',
      confirmed: 'Confirmed',
      fetched: 'Fetched',
      analyzed: 'Analyzed',
      referenced: 'Referenced',
      startSession: 'Start Practice Session',
      pdfLabel: 'PDFs',
      languageToggle: 'Türkçe',
    },
    tr: {
      courses: 'Dersler',
      back: 'Geri',
      authorizingTitle: 'Alıştırma Modülü Yetkilendiriliyor',
      authWaiting: 'Panel yetkilendirmesi bekleniyor...',
      authMissing: 'Yetkilendirme alınamadı. Bu modülü öğrenci panelinden açın.',
      authError: 'AI koçu şu an biraz meşgul veya 10 soruyu hazırlarken zaman aşımına uğradı. Lütfen tekrar deneyin.',
      courseInformation: 'Ders Bilgileri',
      lectures: 'Dersler',
      practice: 'Pratik Yap',
      practiceTopic: 'Bu konuda pratik yap',
      noResources: 'Bu ders için mevcut kaynak yok.',
      resourceFile: 'Kaynak Dosyası',
      recommendationTitle: 'Akıllı Alıştırma Önerisi',
      analyzing: 'Yapay zeka performansınızı analiz ediyor...',
      recommendationFallback: 'Performansınızı analiz ettik ve size özel bir alıştırma seti oluşturduk.',
      lectureList: 'Ders Listesi',
      lectureResources: 'Ders Kaynakları',
      studentMarks: 'Öğrenci Notları',
      lastQuizzes: 'Son Quizler/Sınavlar',
      confirmed: 'Onaylandı',
      fetched: 'Getirildi',
      analyzed: 'Analiz Edildi',
      referenced: 'Referans Alındı',
      startSession: 'Alıştırma Oturumunu Başlat',
      pdfLabel: 'PDF',
      languageToggle: 'English',
    },
  }[language]

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)

    const existingAccessToken = getStoredAccessToken()
    if (existingAccessToken) {
      setHasAccessToken(true)
      setAuthMessage('')
    }

    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedParentOrigin(event.origin)) {
        return
      }

      if (!isPracticeBridgePayload(event.data)) {
        return
      }

      storeBridgePayload(event.data)
      setHasAccessToken(Boolean(event.data.accessToken || getStoredAccessToken()))
      setAuthMessage('')
    }

    window.addEventListener('message', handleMessage)

    const authWaitTimeout = window.setTimeout(() => {
      if (!getStoredAccessToken()) {
        setAuthMessage(ui.authMissing)
      }
    }, 4000)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearTimeout(authWaitTimeout)
    }
  }, [ui.authMissing])

  useEffect(() => {
    if (!hasAccessToken && !getStoredAccessToken()) {
      setAuthMessage(ui.authWaiting)
    }
  }, [hasAccessToken, ui.authWaiting])

  useEffect(() => {
    if (!hasAccessToken) {
      return
    }

    DuxApiService.fetchMyCourses().then(res => {
      setCourses(res)
    })
  }, [hasAccessToken])

  useEffect(() => {
    if (courses.length === 0) {
      return
    }

    const initialCourseId = getStoredSelectedCourseId()
    if (!initialCourseId) {
      return
    }

    const matchingCourse = courses.find((course) => String(course.id) === String(initialCourseId))
    if (matchingCourse) {
      void handleCourseClick(matchingCourse)
    }
  }, [courses])

  if (!mounted) {
    return (
      <div className="loading-view" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
      </div>
    )
  }

  if (!hasAccessToken) {
    return (
      <div className="loading-view" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px' }}>
        <div>
          <div className="loader" style={{ margin: '0 auto 24px auto' }}></div>
          <h2 style={{ color: '#fff', marginBottom: '12px' }}>{ui.authorizingTitle}</h2>
          <p style={{ color: '#bdbdbd', maxWidth: '520px' }}>{authMessage}</p>
        </div>
      </div>
    )
  }

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course)
    setLectures([])
    setOpenLectures([])
    setView('detail')
    try {
      const lectureRes = await DuxApiService.fetchCourseLectures(course.id)
      setLectures(lectureRes)
    } catch (e) {
      console.error(e)
    }
  }

  const handlePracticeClick = async (lectureId?: string, courseId?: string) => {
    setShowModal(true)
    setIsAnalyzing(true)
    setSession(null) // Reset previous
    
    try {
      // Pass the explicit IDs to the engine
      const targetCourseId = courseId || selectedCourse?.id;
      const result = await PracticeEngine.generateSession(lectureId, targetCourseId)
      setSession(result)
      PracticeStore.saveSession(result)
    } catch (e) {
      console.error("Practice generation failed:", e)
      alert(ui.authError)
      setShowModal(false)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleLecture = async (id: string) => {
    if (openLectures.includes(id)) {
      setOpenLectures(openLectures.filter(lid => lid !== id))
    } else {
      setOpenLectures([...openLectures, id])
      if (!lectureResources[id]) {
        try {
          const res = await DuxApiService.fetchLectureResources(id);
          setLectureResources(prev => ({ ...prev, [id]: res }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  return (
    <div className="practice-page-shell">
      <div className={view === 'grid' ? 'course-grid-view' : 'course-view'} style={{ animation: 'fadeIn 0.5s ease' }}>
      {view === 'grid' ? (
        <>
          <div className="view-header">
             <h1 className="main-title">{ui.courses}</h1>
             <button className="btn lang-toggle-btn" onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}>
               {ui.languageToggle}
             </button>
          </div>
          
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', marginTop: '32px' }}>
             {courses.map(course => (
               <div key={course.id} className="course-card" onClick={() => handleCourseClick(course)} style={{ cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', transition: 'transform 0.3s ease', position: 'relative', height: '380px' }}>
                  <div className="card-image" style={{ 
                    backgroundImage: `url(${course.image || 'https://images.unsplash.com/photo-1523050853063-8806af9e1725?q=80&w=800&auto=format&fit=crop'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '100%',
                    width: '100%',
                    position: 'absolute'
                  }}></div>
                  <div className="card-badge" style={{ position: 'absolute', top: '24px', left: '24px', background: 'rgba(255,215,225,0.3)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                    {course.code || (course.id.toString().includes('math') ? 'MTH101' : 'TRH121')}
                  </div>
                  <div className="card-overlay" style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '48px 32px 32px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', display: 'flex', alignItems: 'flex-end' }}>
                     <h3 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', margin: '0' }}>{course.title.toUpperCase()}</h3>
                  </div>
               </div>
             ))}
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .practice-page-shell {
              width: min(1240px, calc(100vw - 32px));
              margin: 0 auto;
              padding: 28px 0 48px;
            }
            .course-grid-view { animation: fadeIn 0.6s ease; }
            .main-title { font-size: 36px; color: #fff; font-weight: 800; }
            .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .lang-toggle-btn { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.18); }
            .course-card:hover { transform: translateY(-12px) scale(1.02); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          ` }} />
        </>
      ) : (
        <>
          <div className="top-actions">
            <div className="actions-left">
              <button className="btn btn-primary" onClick={() => setView('grid')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>{ui.back}</button>
            </div>
            <button className="btn lang-toggle-btn" onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}>
              {ui.languageToggle}
            </button>
          </div>

          <div className="course-header" style={{ marginTop: '32px' }}>
            <h2 className="course-title" style={{ color: '#fff', fontSize: '40px', fontWeight: '800' }}>{selectedCourse?.title}{selectedCourse?.code ? ` (${selectedCourse.code.toLowerCase()})` : ''}</h2>
          </div>

          <div className="info-card">
             <div className="info-icon">ℹ️</div>
             <span className="info-label">{ui.courseInformation}</span>
          </div>

          <div className="lectures-section">
            <div className="lectures-header">
              <h3 className="section-title">{ui.lectures}</h3>
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
                      <button className="btn-practice-sub" onClick={(e) => { e.stopPropagation(); handlePracticeClick(lecture.id, selectedCourse?.id); }}>{ui.practice}</button>
                      <span className="lecture-date">{lecture.date}</span>
                    </div>
                  </div>
                  
                  {openLectures.includes(lecture.id) && (
                    <div className="lecture-content">
                      {lectureResources[lecture.id] && lectureResources[lecture.id].length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                          {lectureResources[lecture.id].map((r: any, idx: number) => (
                            <li key={idx} className="content-text" style={{ marginBottom: '8px' }}>
                              📄 <a href={r.url || '#'} target="_blank" rel="noreferrer" style={{ color: '#6a1b2b', textDecoration: 'none', fontWeight: 500 }}>
                                {r.title || r.name || ui.resourceFile}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="content-text">{ui.noResources}</p>
                      )}
                      <div className="empty-state" style={{ marginTop: '12px' }}>
                        <button className="btn-empty" onClick={() => handlePracticeClick(lecture.id)}>{ui.practiceTopic}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="recommendation-modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <div className="modal-header">
              <span className="ai-icon">🤖</span>
              <h3>{ui.recommendationTitle}</h3>
            </div>
            <div className="modal-body">
              {isAnalyzing ? (
                <div className="analysis-status">
                  <div className="loader"></div>
                  <p>{ui.analyzing}</p>
                </div>
              ) : (
                <>
                  <p className="recommendation-text">
                    {session?.recommendationReason || ui.recommendationFallback}
                  </p>
                  <div className="analysis-grid">
                    <div className="analysis-item confirmed">
                      <span className="item-icon">📖</span>
                      <div className="item-info">
                        <strong>1. {ui.lectureList}</strong>
                        <small>{session?.analysisMetadata?.lectureTitle || ui.confirmed}</small>
                      </div>
                    </div>
                    <div className="analysis-item fetched">
                      <span className="item-icon">📚</span>
                      <div className="item-info">
                        <strong>2. {ui.lectureResources}</strong>
                        <small title={session?.analysisMetadata?.resources?.join(', ')}>
                          {session?.analysisMetadata?.resources?.length > 0 
                            ? `${session.analysisMetadata.resources.length} ${ui.pdfLabel}: ${session.analysisMetadata.resources[0]}${session.analysisMetadata.resources.length > 1 ? '...' : ''}` 
                            : ui.fetched}
                        </small>
                      </div>
                    </div>
                    <div className="analysis-item analyzed">
                      <span className="item-icon">👥</span>
                      <div className="item-info">
                        <strong>3. {ui.studentMarks}</strong>
                        <small>{session?.analysisMetadata?.studentScore !== undefined ? `${session.analysisMetadata.studentScore}/100` : ui.analyzed}</small>
                      </div>
                    </div>
                    <div className="analysis-item referenced">
                      <span className="item-icon">📄</span>
                      <div className="item-info">
                        <strong>4. {ui.lastQuizzes}</strong>
                        <small>{session?.analysisMetadata?.lastQuizzes?.length > 0 ? session.analysisMetadata.lastQuizzes.join(', ') : ui.referenced}</small>
                      </div>
                    </div>
                  </div>
                  <button className="btn-start-session" onClick={() => window.location.href = '/practice'}>{ui.startSession}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .practice-page-shell {
          width: min(1240px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 28px 0 48px;
        }
        .course-view { display: flex; flex-direction: column; gap: 24px; }
        .top-actions { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .actions-left { display: flex; gap: 16px; }
        .lang-toggle-btn { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.18); }
        .btn-practice-sub { background: #fff; border: 1px solid #6a1b2b; color: #6a1b2b; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; margin-right: 16px; transition: all 0.2s; }
        .btn-practice-sub:hover { background: #6a1b2b; color: #fff; }
        .btn-empty { background: #6a1b2b; color: #fff; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
        .course-title { font-size: 32px; margin-top: 8px; color: #222; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .recommendation-modal { background: #fff; width: 90%; max-width: 550px; border-radius: 20px; padding: 32px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
        .modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .ai-icon { font-size: 28px; }
        .modal-header h3 { font-size: 22px; color: #1f1f2b; }
        .recommendation-text { color: #4b5563; line-height: 1.6; margin-bottom: 32px; }
        .analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .analysis-item { background: #f7f4f5; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px; border: 1px solid rgba(106, 27, 43, 0.1); }
        .item-icon { font-size: 20px; width: 40px; height: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .item-info { display: flex; flex-direction: column; overflow: hidden; }
        .item-info strong { font-size: 14px; color: #1f1f2b; }
        .item-info small { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .btn-start-session { width: 100%; background: #6a1b2b; color: white; padding: 16px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba(106, 27, 43, 0.3); }
        .btn-start-session:hover { background: #7a1f31; transform: translateY(-2px); }
        .analysis-status { text-align: center; padding: 40px 0; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #6a1b2b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .section-card { border-bottom: 2px solid #6a1b2b; padding-bottom: 12px; }
        .section-title { font-size: 18px; color: #333; margin-bottom: 8px; display: flex; align-items: center; }
        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-weight: 600;
        }
.info-icon { background: #6a1b2b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .lectures-header { display: flex; align-items: center; margin-bottom: 20px; }
        .lectures-list { display: flex; flex-direction: column; gap: 8px; }
        .lecture-item {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
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
          background: rgba(255, 255, 255, 0.05);
        }

        .lecture-row.active {
          border-left: 4px solid var(--white);
        }

        .lecture-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .arrow-icon {
          font-size: 10px;
          color: var(--white);
        }

        .lecture-title {
          font-weight: 500;
          color: #fff;
        }

        .lecture-date {
          font-size: 12px;
          color: #888;
        }

        .lecture-content {
          padding: 24px 36px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .content-text {
          color: #bbb;
          margin-bottom: 8px;
          font-size: 14px;
        }
.text-muted { color: #888; }
        @media (max-width: 900px) {
          .practice-page-shell {
            width: min(100vw - 24px, 100%);
            padding: 20px 0 40px;
          }
          .top-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .actions-left {
            flex-wrap: wrap;
          }
          .lang-toggle-btn {
            width: 100%;
          }
          .courses-grid {
            gap: 20px !important;
            margin-top: 24px !important;
          }
          .course-card {
            height: 320px !important;
          }
          .lecture-row {
            padding: 14px 18px;
            align-items: flex-start;
            gap: 12px;
          }
          .lecture-right {
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 8px;
          }
          .lecture-content {
            padding: 18px 20px;
          }
        }
        @media (max-width: 640px) {
          .practice-page-shell {
            width: min(100vw - 16px, 100%);
            padding: 16px 0 32px;
          }
          .view-header {
            margin-bottom: 16px;
          }
          .main-title {
            font-size: 30px;
          }
          .course-header {
            margin-top: 20px !important;
          }
          .course-title {
            font-size: 28px !important;
          }
          .info-card,
          .section-card {
            padding: 16px 18px !important;
          }
          .card-overlay {
            padding: 36px 22px 24px !important;
          }
        }
      ` }} />
      </div>
    </div>
  )
}
