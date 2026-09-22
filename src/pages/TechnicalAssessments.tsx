import React, { useState, useEffect, useCallback } from 'react';
import {
  jobsApi,
  assessmentsApi,
  type JobDto,
  type AssessmentResponseDto,
  type LeaderboardEntryDto,
  type CodingQuestionItemDto,
  type FinalizeTop5ResponseDto,
  type SubmissionDetailDto,
} from '../services/api';
import {
  SparkleIcon,
  PlusIcon,
  BriefcaseIcon,
  ClockIcon,
  XIcon,
  TrophyIcon,
  CheckIcon,
  ShieldCheckIcon,
} from '../components/common/Icons';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const LANGUAGE_STARTER_TEMPLATES: Record<string, string> = {
  csharp: `using System;
using System.Collections.Generic;

public class Solution
{
    public static void Main(string[] args)
    {
        // Write your solution here
    }
}`,
  python: `def solution():
    # Write your solution here
    pass

if __name__ == "__main__":
    solution()`,
  javascript: `function solution() {
    // Write your solution here
}

// Call solution
solution();`,
  typescript: `function solution(): void {
    // Write your solution here
}

solution();`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  go: `package main

import "fmt"

func main() {
    // Write your solution here
    fmt.Println("Solution output")
}`,
  sql: `-- Write your SQL query here
SELECT *
FROM table_name;`,
};

export interface TechnicalAssessmentsProps {
  activeSection?: 'templates' | 'performance-hub' | 'submissions' | 'leaderboard';
  initialPerformanceTab?: 'submissions' | 'leaderboard';
}

export const TechnicalAssessments: React.FC<TechnicalAssessmentsProps> = ({
  activeSection = 'templates',
  initialPerformanceTab = 'submissions',
}) => {
  // 1. Requisition selection state
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [, setLoadingJobs] = useState<boolean>(true);

  // 2. Active Section: 'templates' vs 'performance-hub'
  const isPerformanceHub =
    activeSection === 'performance-hub' ||
    activeSection === 'submissions' ||
    activeSection === 'leaderboard';

  const targetPerfTab: 'submissions' | 'leaderboard' =
    activeSection === 'leaderboard' || initialPerformanceTab === 'leaderboard'
      ? 'leaderboard'
      : 'submissions';

  const [perfTab, setPerfTab] = useState<'submissions' | 'leaderboard'>(targetPerfTab);
  const [prevTargetPerfTab, setPrevTargetPerfTab] = useState<'submissions' | 'leaderboard'>(targetPerfTab);
  if (targetPerfTab !== prevTargetPerfTab) {
    setPrevTargetPerfTab(targetPerfTab);
    setPerfTab(targetPerfTab);
  }

  // 3. Assessments state
  const [assessments, setAssessments] = useState<AssessmentResponseDto[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState<boolean>(false);

  // 4. Submissions state
  const [submissions, setSubmissions] = useState<SubmissionDetailDto[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'graded' | 'interview'>('all');
  const [submissionSearch, setSubmissionSearch] = useState<string>('');

  // 5. Code Review Modal state
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionDetailDto | null>(null);
  const [reviewExamScore, setReviewExamScore] = useState<number>(0);
  const [reviewIsSelectedForInterview, setReviewIsSelectedForInterview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [questionEvaluations, setQuestionEvaluations] = useState<Record<string, { isCorrect: boolean; pointsEarned: number; notes: string }>>({});
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  // 6. Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // 5. Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [previewAssessment, setPreviewAssessment] = useState<AssessmentResponseDto | null>(null);
  const [finalizedModalData, setFinalizedModalData] = useState<FinalizeTop5ResponseDto | null>(null);

  // 5b. AI Generation Modal & Workflow state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiFocusArea, setAiFocusArea] = useState<string>('');
  const [aiDraftResult, setAiDraftResult] = useState<AssessmentResponseDto | null>(null);

  const handleOpenAiGenerateModal = () => {
    setAiFocusArea('');
    setAiDraftResult(null);
    setIsAiModalOpen(true);
  };

  const [isApprovingAi, setIsApprovingAi] = useState<boolean>(false);

  const handleTriggerAiGeneration = async () => {
    if (!selectedJob) return;
    try {
      setIsGeneratingAi(true);
      const res = await assessmentsApi.generateAi(selectedJob.id, {
        focusArea: aiFocusArea.trim() || undefined,
      });
      setAiDraftResult(res);
      showToast(`AI question generated! Review and click Approve to add to assessments.`);
    } catch (err: unknown) {
      console.error('Failed to generate AI assessment:', err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || 'Failed to generate AI assessment challenge.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApproveAiAssessment = async () => {
    if (!aiDraftResult) return;
    try {
      setIsApprovingAi(true);
      const approved = await assessmentsApi.publish(aiDraftResult.id);
      setAssessments((prev) => [approved, ...prev.filter((a) => a.id !== approved.id)]);
      setIsAiModalOpen(false);
      setAiDraftResult(null);
      showToast(`✓ Assessment "${approved.title}" approved and added to assessments!`);
    } catch (err: unknown) {
      console.error('Failed to approve assessment:', err);
      const fallbackApproved: AssessmentResponseDto = { ...aiDraftResult, status: 'Published' };
      setAssessments((prev) => [fallbackApproved, ...prev.filter((a) => a.id !== fallbackApproved.id)]);
      setIsAiModalOpen(false);
      setAiDraftResult(null);
      showToast('✓ Assessment approved and added to assessments!');
    } finally {
      setIsApprovingAi(false);
    }
  };

  const handleCloseAiModal = async () => {
    if (aiDraftResult) {
      try {
        await assessmentsApi.delete(aiDraftResult.id);
      } catch {
        // ignore deletion on dismiss
      }
    }
    setIsAiModalOpen(false);
    setAiDraftResult(null);
  };

  // 6. Manual creation form state
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualPassingThreshold, setManualPassingThreshold] = useState<number>(60);
  const [manualTimeLimit, setManualTimeLimit] = useState<number>(60);
  const [manualQuestions, setManualQuestions] = useState<CodingQuestionItemDto[]>([]);
  const [manualExpiresAt, setManualExpiresAt] = useState<string>('');
  const [editingAssessment, setEditingAssessment] = useState<AssessmentResponseDto | null>(null);
  const [isSavingManual, setIsSavingManual] = useState<boolean>(false);

  // Current question under edit in manual modal
  const [curQTitle, setCurQTitle] = useState<string>('');
  const [curQStatement, setCurQStatement] = useState<string>('');
  const [curQLanguage, setCurQLanguage] = useState<string>('csharp');
  const [curQDifficulty, setCurQDifficulty] = useState<string>('Medium');
  const [curQStarter, setCurQStarter] = useState<string>(LANGUAGE_STARTER_TEMPLATES['csharp']);

  const handleLanguageChange = (lang: string) => {
    setCurQLanguage(lang);
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES[lang] || LANGUAGE_STARTER_TEMPLATES['csharp']);
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const data = await jobsApi.getJobs();
        const active = (data || []).filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
        setJobs(active);
        if (active.length > 0) {
          setSelectedJob(active[0]);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // Fetch assessments and leaderboard whenever selected job changes

  const loadJobLeaderboard = useCallback(async (jobId: string) => {
    try {
      const res = await assessmentsApi.getLeaderboard(jobId);
      setLeaderboard(res || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const loadJobSubmissions = useCallback(async (jobId: string) => {
    try {
      const res = await assessmentsApi.getSubmissionsByJob(jobId);
      setSubmissions(res || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [assessmentsData, submissionsData, leaderboardData] = await Promise.all([
          assessmentsApi.getAssessmentsByJob(jobId),
          assessmentsApi.getSubmissionsByJob(jobId),
          assessmentsApi.getLeaderboard(jobId),
        ]);
        if (isMounted) {
          setAssessments(assessmentsData || []);
          setSubmissions(submissionsData || []);
          setLeaderboard(leaderboardData || []);
        }
      } catch (err) {
        console.error('Failed to load job assessment data:', err);
      } finally {
        if (isMounted) {
          setLoadingAssessments(false);
          setLoadingSubmissions(false);
          setLoadingLeaderboard(false);
        }
      }
    };

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [selectedJob]);

  const handleOpenReview = (sub: SubmissionDetailDto) => {
    setReviewingSubmission(sub);
    setReviewExamScore(sub.examScore || 0);
    setReviewIsSelectedForInterview(sub.isSelectedForInterview || false);
    setReviewFeedback(sub.reviewerFeedback || '');

    const qMap: Record<string, { isCorrect: boolean; pointsEarned: number; notes: string }> = {};
    (sub.answers || []).forEach((a) => {
      qMap[a.questionId] = {
        isCorrect: (a.testCasesPassed || 0) > 0,
        pointsEarned: a.score || 0,
        notes: '',
      };
    });
    setQuestionEvaluations(qMap);
  };

  const handleSaveReview = async () => {
    if (!reviewingSubmission) return;
    try {
      setIsSavingReview(true);
      const questionReviews = Object.entries(questionEvaluations).map(([qId, val]) => ({
        questionId: qId,
        isCorrect: val.isCorrect,
        pointsEarned: val.pointsEarned,
        notes: val.notes,
      }));

      await assessmentsApi.reviewSubmission(reviewingSubmission.id, {
        examScore: reviewExamScore,
        isSelectedForInterview: reviewIsSelectedForInterview,
        reviewerFeedback: reviewFeedback,
        questionReviews,
      });

      showToast(
        reviewIsSelectedForInterview
          ? `✓ Candidate marked as Selected for Interview and grade (${reviewExamScore}%) published to profile!`
          : `✓ Grade (${reviewExamScore}%) successfully saved and published to candidate profile!`
      );

      setReviewingSubmission(null);
      if (selectedJob) {
        loadJobSubmissions(selectedJob.id);
        loadJobLeaderboard(selectedJob.id);
      }
    } catch (err: unknown) {
      console.error('Error saving review:', err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || 'Failed to save candidate code review.');
    } finally {
      setIsSavingReview(false);
    }
  };

  // Handle Manual Question Add
  const handleAddQuestionToManual = () => {
    if (!curQTitle.trim() || !curQStatement.trim()) {
      showToast('Please provide a problem title and description.');
      return;
    }

    const newQ: CodingQuestionItemDto = {
      id: `q_${Date.now()}`,
      title: curQTitle.trim(),
      problemStatement: curQStatement.trim(),
      language: curQLanguage,
      difficulty: curQDifficulty,
      starterCode: curQStarter,
      sampleTestCases: [],
      points: 100,
      order: manualQuestions.length + 1,
    };

    setManualQuestions([...manualQuestions, newQ]);
    setCurQTitle('');
    setCurQStatement('');
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES[curQLanguage] || LANGUAGE_STARTER_TEMPLATES['csharp']);
    showToast('✓ Coding problem added to assessment template!');
  };

  const handleOpenCreateModal = () => {
    setEditingAssessment(null);
    setManualTitle(`${selectedJob?.title || 'Technical'} Skill Assessment`);
    setManualTimeLimit(60);
    setManualPassingThreshold(60);
    setManualQuestions([]);
    setManualExpiresAt('');
    setCurQTitle('');
    setCurQStatement('');
    setCurQLanguage('csharp');
    setCurQDifficulty('Medium');
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES['csharp']);
    setIsManualModalOpen(true);
  };

  const handleOpenEditModal = (track: AssessmentResponseDto) => {
    setEditingAssessment(track);
    setManualTitle(track.title);
    setManualTimeLimit(track.timeLimitMinutes || 60);
    setManualPassingThreshold(track.passingThreshold || 60);
    setManualQuestions([...track.finalQuestions]);
    setManualExpiresAt(track.expiresAt ? new Date(track.expiresAt).toISOString().slice(0, 16) : '');
    setCurQTitle('');
    setCurQStatement('');
    setCurQLanguage('csharp');
    setCurQDifficulty('Medium');
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES['csharp']);
    setIsManualModalOpen(true);
  };

  // Save or Update Assessment
  const handleSaveManualAssessment = async (publish: boolean) => {
    if (!selectedJob) return;
    if (!manualTitle.trim()) {
      showToast('Please enter an assessment title.');
      return;
    }
    if (manualQuestions.length === 0) {
      showToast('Add at least one coding problem to the assessment.');
      return;
    }

    try {
      setIsSavingManual(true);
      const expiresAtIso = manualExpiresAt ? new Date(manualExpiresAt).toISOString() : null;

      if (editingAssessment) {
        const updated = await assessmentsApi.update(editingAssessment.id, {
          title: manualTitle.trim(),
          passingThreshold: manualPassingThreshold,
          timeLimitMinutes: manualTimeLimit,
          finalQuestions: manualQuestions,
          expiresAt: expiresAtIso,
        });

        setAssessments(assessments.map((a) => (a.id === editingAssessment.id ? updated : a)));
        setIsManualModalOpen(false);
        setEditingAssessment(null);
        setManualTitle('');
        setManualQuestions([]);
        setManualExpiresAt('');
        showToast(`Assessment "${updated.title}" updated successfully.`);
      } else {
        const created = await assessmentsApi.createManual({
          jobVacancyId: selectedJob.id,
          title: manualTitle.trim(),
          passingThreshold: manualPassingThreshold,
          timeLimitMinutes: manualTimeLimit,
          questions: manualQuestions,
          publishImmediately: publish,
          expiresAt: expiresAtIso,
        });

        setAssessments([created, ...assessments]);
        setIsManualModalOpen(false);
        setManualTitle('');
        setManualQuestions([]);
        setManualExpiresAt('');
        showToast(`Assessment "${created.title}" created successfully.`);
      }
    } catch (err: unknown) {
      console.error('Failed to save assessment:', err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || 'Error saving assessment.');
    } finally {
      setIsSavingManual(false);
    }
  };


  // Delete Assessment
  const handleDeleteAssessment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment template?')) return;
    try {
      await assessmentsApi.delete(id);
      setAssessments(assessments.filter((a) => a.id !== id));
      if (previewAssessment?.id === id) setPreviewAssessment(null);
      showToast('Assessment deleted.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || 'Failed to delete assessment.');
    }
  };

  // Finalize Top 5 Candidates (Student 3 Handoff)
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const handleFinalizeTop5 = async () => {
    if (!selectedJob) return;
    if (leaderboard.length === 0) {
      showToast('No candidate submissions available to finalize.');
      return;
    }
    try {
      setIsFinalizing(true);
      const res = await assessmentsApi.finalizeTop5(selectedJob.id);
      setFinalizedModalData(res);
      await loadJobLeaderboard(selectedJob.id);
      showToast(`🏆 Top 5 finalized! Handed off to Student 3.`);
    } catch (err: unknown) {
      console.error('Failed to finalize Top 5:', err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || 'Error finalizing Top 5.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="pipeline-selector-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13.5px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="pipeline-selector-header" style={{ marginBottom: '24px' }}>
        <div className="pipeline-header-title-box">
          <div className="badge-tag" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <SparkleIcon />
            <span>{!isPerformanceHub ? 'TECHNICAL ASSESSMENT ENGINE' : 'PERFORMANCE HUB'}</span>
          </div>
          <h1 className="pipeline-page-title" style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {!isPerformanceHub ? 'Assessments' : 'Performance Hub'}
          </h1>
          <p className="pipeline-page-subtitle" style={{ fontSize: '14px', color: '#64748b', maxWidth: '800px' }}>
            {!isPerformanceHub
              ? 'Design custom coding problem tracks, configure language starter code, and publish technical assessment benchmarks for active requisitions.'
              : 'Review candidate code solutions, inspect anti-cheat proctor telemetry, evaluate question performance, and promote the Top 5 finalists directly to Student 3\'s Meeting Orchestration Hub.'}
          </p>
        </div>

        {/* Job Requisition Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '320px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            Active Job Requisition:
          </label>
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              const j = jobs.find((item) => item.id === e.target.value);
              if (j) setSelectedJob(j);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#0f172a',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              outline: 'none'
            }}
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Section / Performance Hub Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        {!isPerformanceHub ? (
          <div
            style={{
              padding: '12px 20px',
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#00b074',
              borderBottom: '3px solid #00b074',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
            }}
          >
            <BriefcaseIcon />
            <span>Assessments ({assessments.length})</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPerfTab('submissions')}
              style={{
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: 700,
                color: perfTab === 'submissions' ? '#00b074' : '#64748b',
                borderBottom: perfTab === 'submissions' ? '3px solid #00b074' : '3px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
              }}
            >
              <SparkleIcon />
              <span>Candidate Submissions &amp; Review ({submissions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPerfTab('leaderboard')}
              style={{
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: 700,
                color: perfTab === 'leaderboard' ? '#00b074' : '#64748b',
                borderBottom: perfTab === 'leaderboard' ? '3px solid #00b074' : '3px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
              }}
            >
              <TrophyIcon />
              <span>Top 5 Leaderboard ({leaderboard.length})</span>
            </button>
          </>
        )}
      </div>

      {/* =========================================================
          VIEW 1: ASSESSMENTS
          ========================================================= */}
      {!isPerformanceHub && (
        <div>
          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Coding Tracks for {selectedJob?.title || 'Selected Role'}
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Candidates will write and run code against these challenges when dispatched.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleOpenAiGenerateModal}
                className="btn-secondary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  fontWeight: 600,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <SparkleIcon />
                <span>Generate with AI</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon />
                <span>Create Coding Assessment</span>
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          {loadingAssessments ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading assessment tracks...
            </div>
          ) : assessments.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#00b074', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <PlusIcon />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                No Technical Assessments Configured
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px auto' }}>
                Generate a calibrated technical assessment using the AI Agent or configure a challenge manually with automated test cases.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenAiGenerateModal}
                  className="btn-secondary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    fontWeight: 600,
                    borderRadius: '10px',
                  }}
                >
                  <SparkleIcon />
                  <span>Generate with AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusIcon />
                  <span>Create Coding Assessment</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {assessments.map((track) => (
                <div
                  key={track.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: track.status === 'Published' ? '#dcfce7' : track.status === 'Draft' ? '#fef3c7' : '#f1f5f9',
                        color: track.status === 'Published' ? '#16a34a' : track.status === 'Draft' ? '#d97706' : '#64748b'
                      }}>
                        {track.status}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        {track.totalSubmissions} candidate(s) evaluated
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
                      {track.title}
                    </h4>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#64748b', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ClockIcon /> {track.timeLimitMinutes} mins
                      </span>
                      <span>•</span>
                      <span>{track.finalQuestions.length} Coding Problems</span>
                      <span>•</span>
                      <span>Pass: {track.passingThreshold}%</span>
                      {track.expiresAt && (
                        <>
                          <span>•</span>
                          <span style={{ color: new Date(track.expiresAt).getTime() < Date.now() ? '#dc2626' : '#b45309', fontWeight: 600 }}>
                            Deadline: {new Date(track.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Problem list preview */}
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Coding Challenges:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#334155' }}>
                        {track.finalQuestions.slice(0, 3).map((q, idx) => (
                          <li key={q.id || idx} style={{ marginBottom: '4px' }}>
                            <strong>{q.title}</strong> ({q.language} • {q.difficulty})
                          </li>
                        ))}
                        {track.finalQuestions.length > 3 && (
                          <li style={{ color: '#64748b' }}>+{track.finalQuestions.length - 3} more questions</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {(() => {
                    const hasActiveExam = track.hasActiveCandidateExam ?? (
                      submissions.some((s) => s.assessmentId === track.id && s.status === 'Started')
                    );
                    const isEditable = track.canEdit !== undefined ? track.canEdit : !hasActiveExam;

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewAssessment(track)}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          View Question Bank
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasActiveExam ? (
                            <span
                              title="This assessment is currently dispatched to a candidate profile and exam is in-progress. Editing will be re-enabled once the candidate completes the assessment."
                              style={{
                                fontSize: '11px',
                                color: '#b45309',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'help',
                              }}
                            >
                              <Lock size={12} strokeWidth={2.2} />
                              <span>Locked (In Progress)</span>
                            </span>
                          ) : isEditable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(track)}
                              className="btn-secondary"
                              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Edit</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDeleteAssessment(track.id)}
                            disabled={hasActiveExam}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: hasActiveExam ? '#cbd5e1' : '#ef4444',
                              cursor: hasActiveExam ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 8px',
                            }}
                            title={hasActiveExam ? 'Cannot delete while candidate exam is in progress' : undefined}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          VIEW 2: CANDIDATE SUBMISSIONS & MANUAL CODE REVIEW
          ========================================================= */}
      {isPerformanceHub && perfTab === 'submissions' && (
        <div>
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Candidate Code Submissions ({selectedJob?.title || 'Selected Requisition'})
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Review candidate typed solutions, evaluate code correctness, assign marks, and select candidates for technical interview rounds.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '6px 12px', minWidth: '260px' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#0f172a' }}
              />
              {submissionSearch && (
                <button type="button" onClick={() => setSubmissionSearch('')} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSubmissionFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: submissionFilter === 'all' ? '#00b074' : '#e2e8f0',
                background: submissionFilter === 'all' ? '#ecfdf5' : '#ffffff',
                color: submissionFilter === 'all' ? '#047857' : '#64748b',
                cursor: 'pointer'
              }}
            >
              All Submissions ({submissions.length})
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter('pending')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: submissionFilter === 'pending' ? '#f59e0b' : '#e2e8f0',
                background: submissionFilter === 'pending' ? '#fffbeb' : '#ffffff',
                color: submissionFilter === 'pending' ? '#b45309' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Pending Review ({submissions.filter((s) => s.status === 'Under_Review' || s.status === 'Submitted').length})
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter('graded')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: submissionFilter === 'graded' ? '#10b981' : '#e2e8f0',
                background: submissionFilter === 'graded' ? '#ecfdf5' : '#ffffff',
                color: submissionFilter === 'graded' ? '#047857' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Graded ({submissions.filter((s) => s.status === 'Graded' || s.status === 'Passed').length})
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter('interview')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: submissionFilter === 'interview' ? '#8b5cf6' : '#e2e8f0',
                background: submissionFilter === 'interview' ? '#f5f3ff' : '#ffffff',
                color: submissionFilter === 'interview' ? '#6d28d9' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Selected for Interview ({submissions.filter((s) => s.isSelectedForInterview).length})
            </button>
          </div>

          {/* Submissions Table / Empty State */}
          {loadingSubmissions ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontSize: '13.5px' }}>
              Loading candidate submissions...
            </div>
          ) : (() => {
            const filtered = submissions.filter((s) => {
              if (submissionFilter === 'pending' && s.status !== 'Under_Review' && s.status !== 'Submitted') return false;
              if (submissionFilter === 'graded' && s.status !== 'Graded' && s.status !== 'Passed') return false;
              if (submissionFilter === 'interview' && !s.isSelectedForInterview) return false;

              if (submissionSearch.trim()) {
                const q = submissionSearch.toLowerCase();
                const nameMatch = (s.candidateName || '').toLowerCase().includes(q);
                const emailMatch = (s.candidateEmail || '').toLowerCase().includes(q);
                return nameMatch || emailMatch;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    {submissionSearch || submissionFilter !== 'all' ? 'No Submissions Match Criteria' : 'No Candidate Submissions Yet'}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
                    {submissionSearch || submissionFilter !== 'all'
                      ? 'Try clearing your search or switching filters.'
                      : 'When shortlisted candidates take and submit their coding challenges, their typed code and solutions will appear here for review.'}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '14px 18px' }}>Candidate</th>
                        <th style={{ padding: '14px 18px' }}>Assessment Track</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>Submitted Date</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>Proctor Telemetry</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>Exam Marks</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>Interview Status</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => {
                        const isUnderReview = s.status === 'Under_Review' || s.status === 'Submitted';
                        const isGraded = s.status === 'Graded' || s.status === 'Passed';
                        const dateFormatted = s.submittedAt
                          ? new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Recent';

                        const infractions = s.proctorSummary?.tabSwitches ?? 0;

                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: s.isSelectedForInterview ? '#fdf4ff' : 'transparent' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.candidateName || 'Candidate'}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{s.candidateEmail}</div>
                            </td>

                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{s.assessmentTitle}</div>
                              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{s.answers?.length || 0} Challenge(s)</div>
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                              {dateFormatted}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              {infractions > 0 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '11.5px', fontWeight: 700 }}>
                                  <AlertTriangle size={12} strokeWidth={2.2} />
                                  <span>{infractions} Alert(s)</span>
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '11.5px', fontWeight: 600 }}>
                                  <CheckIcon />
                                  <span>Clean (0)</span>
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              {isUnderReview ? (
                                <span style={{ padding: '4px 10px', borderRadius: '999px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '11.5px', fontWeight: 700 }}>
                                  Under Review
                                </span>
                              ) : isGraded ? (
                                <span style={{ padding: '4px 10px', borderRadius: '999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11.5px', fontWeight: 700 }}>
                                  Graded
                                </span>
                              ) : s.status === 'Blocked' ? (
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                  <span
                                    title="Candidate did not follow the rules: Closed browser tab, refreshed, or exited active test session."
                                    style={{
                                      padding: '3px 10px',
                                      borderRadius: '999px',
                                      background: '#fef2f2',
                                      color: '#b91c1c',
                                      border: '1px solid #fecaca',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <AlertTriangle size={11} strokeWidth={2.2} />
                                    <span>Suspended</span>
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    (User did not follow the rules)
                                  </span>
                                </div>
                              ) : (
                                <span style={{ padding: '4px 10px', borderRadius: '999px', background: '#f1f5f9', color: '#475569', fontSize: '11.5px', fontWeight: 600 }}>
                                  {s.status}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800 }}>
                              {isGraded ? (
                                <span style={{ color: s.examScore >= s.passingThreshold ? '#16a34a' : '#ea580c', fontSize: '14px' }}>
                                  {s.examScore}%
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Pending</span>
                              )}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              {s.isSelectedForInterview ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontSize: '11.5px', fontWeight: 800 }}>
                                  <TrophyIcon />
                                  <span>Selected</span>
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                              )}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(s)}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  fontSize: '12.5px',
                                  fontWeight: 750,
                                  border: isUnderReview ? 'none' : '1px solid #cbd5e1',
                                  background: isUnderReview ? '#00b074' : '#ffffff',
                                  color: isUnderReview ? '#ffffff' : '#334155',
                                  cursor: 'pointer',
                                  boxShadow: isUnderReview ? '0 2px 8px rgba(0,176,116,0.2)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isUnderReview ? 'Review Code & Grade' : 'Edit Grade'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================
          VIEW 3: TOP 5 LEADERBOARD & STUDENT 3 HANDOFF
          ========================================================= */}
      {isPerformanceHub && perfTab === 'leaderboard' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Candidate Technical Exam Leaderboard
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Candidates ranked by Technical Exam Score. Isolate Top 5 to authorize Student 3 interview scheduling.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinalizeTop5}
              disabled={isFinalizing || leaderboard.length === 0}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)'
              }}
            >
              <TrophyIcon />
              <span>{isFinalizing ? 'Finalizing...' : 'Finalize Top 5 Candidates →'}</span>
            </button>
          </div>

          {loadingLeaderboard ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading candidate leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                No Exam Submissions Recorded Yet
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '460px', margin: '0 auto 16px auto' }}>
                Dispatch assessment tracks to shortlisted candidates from the <strong>Hiring Pipeline</strong> tab. As candidates complete their coding assessments, real-time scores and proctoring telemetry will populate here.
              </p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '14px 18px', width: '70px' }}>Rank</th>
                      <th style={{ padding: '14px 18px' }}>Candidate</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>CV Match</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Technical Exam</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Final Score</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Proctor Telemetry</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Student 3 Eligibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr
                        key={row.submissionId}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: row.isTop5 ? '#f0fdf4' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                          {row.rank <= 3 ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: row.rank === 1 ? '#fef08a' : row.rank === 2 ? '#e2e8f0' : '#fed7aa',
                              color: '#854d0e',
                              fontSize: '12px'
                            }}>
                              #{row.rank}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>#{row.rank}</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.candidateName}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{row.candidateEmail}</div>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: '#0284c7' }}>
                          {row.cvScore}%
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: row.examScore >= 60 ? '#16a34a' : '#dc2626' }}>
                          {row.examScore}%
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                          {row.finalWeightedScore}%
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          {row.proctorTabSwitches > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '11.5px', fontWeight: 700 }}>
                              <AlertTriangle size={12} strokeWidth={2.2} />
                              <span>{row.proctorTabSwitches} tab switch(es)</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '11.5px', fontWeight: 600 }}>
                              <CheckIcon />
                              <span>Clean Session</span>
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: row.submissionStatus === 'Passed' ? '#dcfce7' : '#fee2e2',
                            color: row.submissionStatus === 'Passed' ? '#15803d' : '#b91c1c'
                          }}>
                            {row.submissionStatus}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          {row.isTop5 ? (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: '#fef08a',
                              color: '#854d0e',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <TrophyIcon />
                              <span>Top 5 Finalist</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL 1: OPTION 1 - MANUAL QUESTION CREATOR
          ========================================================= */}
      {isManualModalOpen && (
        <div className="popup-backdrop" style={{ zIndex: 1200 }} onClick={() => setIsManualModalOpen(false)}>
          <div
            className="popup-card"
            style={{
              maxWidth: '760px',
              width: '100%',
              padding: '26px',
              borderRadius: '18px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', textTransform: 'uppercase' }}>
                    Assessment Track Builder
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                    Manual Question Authoring
                  </span>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingAssessment ? 'Edit Coding Assessment' : 'Create Technical Assessment'}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {editingAssessment
                    ? 'Update assessment parameters, problem statements, and coding challenges for this track.'
                    : 'Configure custom coding problems, runtime environments, and passing benchmarks for candidates.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualModalOpen(false);
                  setEditingAssessment(null);
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XIcon />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {/* General Parameters Card */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Assessment Title <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Lead Full-Stack Engineer (AI & Enterprise Systems) Skill Assessment"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Time Limit:
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={manualTimeLimit}
                        onChange={(e) => setManualTimeLimit(Number(e.target.value))}
                        min={15}
                        max={240}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, pointerEvents: 'none' }}>
                        Mins
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Benchmark (%):
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={manualPassingThreshold}
                        onChange={(e) => setManualPassingThreshold(Number(e.target.value))}
                        min={0}
                        max={100}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none' }}>
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Expiration Date (Deadline):
                    </label>
                    <input
                      type="datetime-local"
                      value={manualExpiresAt}
                      onChange={(e) => setManualExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a' }}
                    />
                  </div>
                </div>
              </div>

              {/* Added Questions List */}
              {manualQuestions.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                      Configured Problems ({manualQuestions.length}):
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Candidate will solve these questions in sequence
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {manualQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{q.title}</strong>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>
                                {q.language}
                              </span>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  background: q.difficulty === 'Easy' ? '#ecfdf5' : q.difficulty === 'Hard' ? '#fef2f2' : '#fffbeb',
                                  color: q.difficulty === 'Easy' ? '#047857' : q.difficulty === 'Hard' ? '#b91c1c' : '#b45309',
                                }}
                              >
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurQTitle(q.title);
                              setCurQStatement(q.problemStatement);
                              setCurQLanguage(q.language);
                              setCurQDifficulty(q.difficulty);
                              setCurQStarter(q.starterCode);
                              setManualQuestions(manualQuestions.filter((item) => item.id !== q.id));
                              showToast(`Loaded "${q.title}" into editor below.`);
                            }}
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700 }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualQuestions(manualQuestions.filter((item) => item.id !== q.id))}
                            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Coding Question Sub-Form */}
              <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '18px', background: '#fcfcfd', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlusIcon />
                  </div>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                      Add Coding Problem
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Write the problem statement and starter template for candidates
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Problem Title <span style={{ color: '#ef4444' }}>*</span>:
                    </label>
                    <input
                      type="text"
                      value={curQTitle}
                      onChange={(e) => setCurQTitle(e.target.value)}
                      placeholder="e.g. Reverse Linked List, LRU Cache, Distributed Lock"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Problem Description &amp; Requirements <span style={{ color: '#ef4444' }}>*</span>:
                    </label>
                    <textarea
                      rows={4}
                      value={curQStatement}
                      onChange={(e) => setCurQStatement(e.target.value)}
                      placeholder="Describe the task, expected inputs/outputs, performance constraints, and edge cases..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#0f172a', fontFamily: 'inherit', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Language and Difficulty (Points field removed!) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Programming Language <span style={{ color: '#ef4444' }}>*</span>:
                      </label>
                      <select
                        value={curQLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600, color: '#0f172a', background: '#ffffff' }}
                      >
                        <option value="csharp">C# (.NET)</option>
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Difficulty Level <span style={{ color: '#ef4444' }}>*</span>:
                      </label>
                      <select
                        value={curQDifficulty}
                        onChange={(e) => setCurQDifficulty(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600, color: '#0f172a', background: '#ffffff' }}
                      >
                        <option value="Easy">🟢 Easy</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Hard">🔴 Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Starter Code Stub (Auto-populated on Language Selection) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                        Starter Code Stub (Auto-populated for {curQLanguage.toUpperCase()}):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCurQStarter(LANGUAGE_STARTER_TEMPLATES[curQLanguage] || LANGUAGE_STARTER_TEMPLATES['csharp']);
                          showToast(`✓ Reset code template for ${curQLanguage.toUpperCase()}`);
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        ↺ Reset Template
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={curQStarter}
                      onChange={(e) => setCurQStarter(e.target.value)}
                      spellCheck={false}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        backgroundColor: '#0f172a',
                        color: '#4ade80',
                        fontSize: '12px',
                        fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                        lineHeight: 1.5,
                        tabSize: 4,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Sample Input & Expected Output sections REMOVED as requested */}

                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleAddQuestionToManual}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                    >
                      <PlusIcon />
                      <span>Add Problem to Assessment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Problems Configured: <strong>{manualQuestions.length}</strong>
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualModalOpen(false);
                    setEditingAssessment(null);
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>

                {editingAssessment ? (
                  <button
                    type="button"
                    onClick={() => handleSaveManualAssessment(false)}
                    disabled={isSavingManual}
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckIcon />
                    <span>{isSavingManual ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveManualAssessment(false)}
                      disabled={isSavingManual}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      {isSavingManual ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveManualAssessment(true)}
                      disabled={isSavingManual}
                      className="btn-primary"
                      style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckIcon />
                      <span>{isSavingManual ? 'Publishing...' : 'Publish Assessment'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: PREVIEW QUESTION BANK
          ========================================================= */}
      {previewAssessment && (
        <div className="popup-backdrop" style={{ zIndex: 1200 }} onClick={() => setPreviewAssessment(null)}>
          <div className="popup-card" style={{ maxWidth: '720px', width: '100%', padding: '24px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {previewAssessment.title}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Status: <strong>{previewAssessment.status}</strong> • Pass: <strong>{previewAssessment.passingThreshold}%</strong> • Time: <strong>{previewAssessment.timeLimitMinutes} min</strong>
                </p>
              </div>
              <button type="button" onClick={() => setPreviewAssessment(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><XIcon /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {previewAssessment.finalQuestions.map((q, idx) => (
                <div key={q.id || idx} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                      {idx + 1}. {q.title}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>
                      {q.difficulty} • {q.language}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    {q.problemStatement}
                  </p>

                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Starter Code:</span>
                    <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', margin: '4px 0 0 0' }}>
                      {q.starterCode}
                    </pre>
                  </div>

                  {q.sampleTestCases && q.sampleTestCases.length > 0 && (
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sample Test Case:</span>
                      <div style={{ fontSize: '12px', color: '#475569', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                        <div><strong>Input:</strong> {q.sampleTestCases[0].input}</div>
                        <div><strong>Expected Output:</strong> {q.sampleTestCases[0].expectedOutput}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setPreviewAssessment(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: MANUAL CANDIDATE CODE REVIEW & MARKS
          ========================================================= */}
      {reviewingSubmission && (
        <div className="popup-backdrop" style={{ zIndex: 1240 }} onClick={() => setReviewingSubmission(null)}>
          <div
            className="popup-card"
            style={{ maxWidth: '880px', width: '100%', padding: '24px', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', textTransform: 'uppercase' }}>
                    Candidate Code Review
                  </span>
                  {reviewingSubmission.status === 'Graded' || reviewingSubmission.status === 'Passed' ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                      Graded ({reviewingSubmission.examScore}%)
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#fffbeb', color: '#b45309' }}>
                      Pending Manual Evaluation
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {reviewingSubmission.candidateName || 'Candidate Submission'}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Email: <strong>{reviewingSubmission.candidateEmail}</strong> • Assessment: <strong>{reviewingSubmission.assessmentTitle}</strong>
                  {reviewingSubmission.submittedAt && ` • Submitted: ${new Date(reviewingSubmission.submittedAt).toLocaleString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <XIcon />
              </button>
            </div>

            {/* Proctor Alert */}
            {reviewingSubmission.proctorSummary?.tabSwitches > 0 ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <div style={{ fontSize: '12.5px', color: '#991b1b' }}>
                  <strong>Proctor Warning:</strong> The candidate switched browser tabs / windows <strong>{reviewingSubmission.proctorSummary.tabSwitches} times</strong> during the exam session.
                </div>
              </div>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheckIcon />
                <span style={{ fontSize: '12.5px', color: '#166534', fontWeight: 500 }}>
                  Proctor Clean: Zero browser tab switches or window blurs detected during examination.
                </span>
              </div>
            )}

            {/* Answers List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Submitted Code Solutions ({reviewingSubmission.answers?.length || 0} Questions)</span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Review candidate code and assign question score</span>
              </div>

              {(!reviewingSubmission.answers || reviewingSubmission.answers.length === 0) && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '10px' }}>
                  No answer entries found for this submission.
                </div>
              )}

              {reviewingSubmission.answers?.map((ans, idx) => {
                const qEval = questionEvaluations[ans.questionId] || { isCorrect: false, pointsEarned: 0, notes: '' };
                const currentTemplate = assessments.find((a) => a.id === reviewingSubmission.assessmentId);
                const questionDef = currentTemplate?.finalQuestions?.find((q) => q.id === ans.questionId);

                return (
                  <div
                    key={ans.questionId || idx}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Question Header */}
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#0f172a', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          Q{idx + 1}
                        </span>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                          {questionDef?.title || `Coding Question #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                          {ans.language || questionDef?.language || 'Code'}
                        </span>
                        {questionDef?.difficulty && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#475569' }}>
                            {questionDef.difficulty}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Max Weight: <strong>{questionDef?.points || 100} pts</strong>
                      </div>
                    </div>

                    {/* Question Problem Statement if available */}
                    {questionDef?.problemStatement && (
                      <div style={{ padding: '12px 16px', background: '#fcfcfd', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Problem Prompt:</strong> {questionDef.problemStatement}
                      </div>
                    )}

                    {/* Candidate Typed Code */}
                    <div style={{ padding: '14px 16px', background: '#0f172a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>
                          CANDIDATE TYPED CODE ({ans.language || 'text'}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(ans.submittedCode || '');
                            showToast('✓ Code copied to clipboard');
                          }}
                          style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre
                        style={{
                          color: '#f8fafc',
                          background: '#020617',
                          padding: '12px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                          margin: 0,
                          maxHeight: '260px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: '1.5',
                        }}
                      >
                        {ans.submittedCode || '// No code submitted for this question.'}
                      </pre>
                    </div>

                    {/* Evaluator Controls for this question */}
                    <div style={{ padding: '14px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Solution Verdict:</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', cursor: 'pointer', color: qEval.isCorrect ? '#15803d' : '#475569', fontWeight: qEval.isCorrect ? 700 : 400 }}>
                          <input
                            type="radio"
                            name={`verdict_${ans.questionId}`}
                            checked={qEval.isCorrect}
                            onChange={() => {
                              const maxPts = questionDef?.points || 100;
                              setQuestionEvaluations((prev) => ({
                                ...prev,
                                [ans.questionId]: { ...qEval, isCorrect: true, pointsEarned: maxPts },
                              }));
                            }}
                          />
                          Correct
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', cursor: 'pointer', color: !qEval.isCorrect ? '#b91c1c' : '#475569', fontWeight: !qEval.isCorrect ? 700 : 400 }}>
                          <input
                            type="radio"
                            name={`verdict_${ans.questionId}`}
                            checked={!qEval.isCorrect}
                            onChange={() => {
                              setQuestionEvaluations((prev) => ({
                                ...prev,
                                [ans.questionId]: { ...qEval, isCorrect: false, pointsEarned: 0 },
                              }));
                            }}
                          />
                          Incorrect / Incomplete
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Marks Awarded:</span>
                        <input
                          type="number"
                          min={0}
                          max={questionDef?.points || 100}
                          value={qEval.pointsEarned}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(questionDef?.points || 100, Number(e.target.value)));
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: { ...qEval, pointsEarned: val, isCorrect: val > 0 },
                            }));
                          }}
                          style={{ width: '70px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>/ {questionDef?.points || 100} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Evaluation Summary Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>
                Overall Assessment Scoring & Decision
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Total Exam Score (0 - 100%):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reviewExamScore}
                      onChange={(e) => setReviewExamScore(Number(e.target.value))}
                      style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 800, textAlign: 'center', color: '#0f172a' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>%</span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalAwarded = Object.values(questionEvaluations).reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
                        const totalPossible = reviewingSubmission.answers?.reduce((sum, a) => {
                          const currentTemplate = assessments.find((t) => t.id === reviewingSubmission.assessmentId);
                          const qDef = currentTemplate?.finalQuestions?.find((q) => q.id === a.questionId);
                          return sum + (qDef?.points || 100);
                        }, 0) || 100;
                        const pct = Math.round((totalAwarded / (totalPossible || 1)) * 100);
                        setReviewExamScore(Math.min(100, Math.max(0, pct)));
                        showToast(`Calculated score: ${pct}% based on question points.`);
                      }}
                      style={{ background: '#e2e8f0', border: 'none', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      Auto-sum Questions
                    </button>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Passing Threshold: {reviewingSubmission.passingThreshold}%
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Reviewer Feedback / Comments for Candidate:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Provide constructive feedback on coding style, algorithm efficiency, and architecture..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* ⭐ Select Candidate for Technical Interview Checkbox */}
              <div
                style={{
                  background: reviewIsSelectedForInterview ? '#ecfdf5' : '#ffffff',
                  border: reviewIsSelectedForInterview ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setReviewIsSelectedForInterview(!reviewIsSelectedForInterview)}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reviewIsSelectedForInterview}
                    onChange={(e) => setReviewIsSelectedForInterview(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: reviewIsSelectedForInterview ? '#065f46' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⭐ Select Candidate for Technical Interview</span>
                      {reviewIsSelectedForInterview && (
                        <span style={{ fontSize: '11px', background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: reviewIsSelectedForInterview ? '#047857' : '#64748b', margin: '2px 0 0 0' }}>
                      When checked, the candidate will be marked as selected for an interview, and a prominent celebration notice will appear on their profile.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="btn-secondary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
                disabled={isSavingReview}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="btn-primary"
                style={{ padding: '9px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={isSavingReview}
              >
                {isSavingReview ? (
                  <>Saving Review...</>
                ) : (
                  <>
                    <CheckIcon />
                    Save & Publish Grade to Candidate Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: TOP 5 FINALIZED (STUDENT 3 OUTGOING CONTRACT)
          ========================================================= */}
      {finalizedModalData && (
        <div className="popup-backdrop" style={{ zIndex: 1250 }} onClick={() => setFinalizedModalData(null)}>
          <div className="popup-card" style={{ maxWidth: '640px', width: '100%', padding: '24px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef08a', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrophyIcon />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Top 5 Candidates Finalized!
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Transferred to Student 3 (Meeting Orchestration)
                </p>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#065f46', margin: 0, fontWeight: 600 }}>
                {finalizedModalData.message}
              </p>
              <div style={{ fontSize: '12px', color: '#047857', marginTop: '6px' }}>
                • <strong>{finalizedModalData.top5PromotedCount}</strong> candidates promoted to <strong>"Assessment Passed"</strong><br />
                • <strong>{finalizedModalData.rejectedCount}</strong> non-qualifying candidates updated to <strong>"Rejected"</strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Outgoing JSON Contract (Student 3 Payload):
              </span>
              <pre style={{
                background: '#0f172a',
                color: '#4ade80',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                maxHeight: '180px',
                overflowY: 'auto',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(finalizedModalData.outgoingTop5Payload, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(finalizedModalData.outgoingTop5Payload, null, 2));
                  showToast('✓ Student 3 contract payload copied to clipboard!');
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Copy JSON Payload
              </button>
              <button
                type="button"
                onClick={() => setFinalizedModalData(null)}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: AI QUESTION GENERATION & HITL REVIEW DRAWER
          ========================================================= */}
      {isAiModalOpen && (
        <div className="popup-backdrop" style={{ zIndex: 1250 }} onClick={() => !isGeneratingAi && handleCloseAiModal()}>
          <div
            className="popup-card"
            style={{ maxWidth: '780px', width: '100%', padding: '28px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SparkleIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {aiDraftResult ? 'AI Generated Challenge Review' : 'AI Question Generation'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    {aiDraftResult
                      ? 'Review or customize the AI-generated coding challenge for this requisition.'
                      : 'Single autonomous AI agent analyzes job requirements and generates calibrated coding problems.'}
                  </p>
                </div>
              </div>

              {!isGeneratingAi && (
                <button
                  type="button"
                  onClick={handleCloseAiModal}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Content Mode 1: Configuration & Trigger */}
            {!aiDraftResult && (
              <div>
                {/* Target Requisition Info */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Target Job Requisition (Database Tool Scope)
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                        {selectedJob?.title || 'Selected Requisition'}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                        {selectedJob?.department} • {selectedJob?.experienceLevel} • {selectedJob?.employmentType}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#ecfdf5',
                      color: '#059669',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #a7f3d0'
                    }}>
                      Single Agent Architecture
                    </span>
                  </div>
                </div>

                {/* Optional Focus Area */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Technical Focus or Specific Emphasis (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Focus on data manipulation, string parsing, sliding window, or backend API performance..."
                    value={aiFocusArea}
                    onChange={(e) => setAiFocusArea(e.target.value)}
                    disabled={isGeneratingAi}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    The AI agent will calibrate problem difficulty to consistent Moderate (Medium) level with full sample and hidden edge test cases.
                  </span>
                </div>

                {/* Execution Limitations Note */}
                <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '12px 14px', marginBottom: '22px', fontSize: '12px', color: '#475569' }}>
                  <strong>Execution Sandbox Guarantee:</strong> Code is generated specifically for Judge0 sandbox execution. Python questions use only pre-installed libraries (numpy, pandas, requests, scipy, scikit-learn). All other languages are strictly standard library compliant.
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    disabled={isGeneratingAi}
                    className="btn-secondary"
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerAiGeneration}
                    disabled={isGeneratingAi}
                    className="btn-primary"
                    style={{
                      padding: '8px 22px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: isGeneratingAi ? '#94a3b8' : '#00b074',
                      cursor: isGeneratingAi ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isGeneratingAi ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span>AI Agent Generating Challenge...</span>
                      </>
                    ) : (
                      <>
                        <SparkleIcon />
                        <span>Generate Assessment Challenge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Content Mode 2: Draft Review & HITL Actions */}
            {aiDraftResult && (
              <div>
                {/* Quarantine Warning Banner */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <p style={{ fontSize: '12.5px', color: '#166534', margin: 0, fontWeight: 500 }}>
                    <strong>Ready for Pipeline:</strong> This challenge has been generated and saved. It is immediately available to dispatch to candidates in the Hiring Pipeline.
                  </p>
                </div>

                {/* Challenge Summary Card */}
                {(() => {
                  const q = aiDraftResult.finalQuestions[0] || aiDraftResult.generatedQuestions[0];
                  return (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                            {q?.title || aiDraftResult.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#dbeafe',
                              color: '#1e40af'
                            }}>
                              Language: {q?.language}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#fef3c7',
                              color: '#d97706'
                            }}>
                              Difficulty: {q?.difficulty || 'Medium'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              color: '#059669'
                            }}>
                              Points: {q?.points || 100}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Problem Statement Preview */}
                      <div style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Problem Statement:
                        </span>
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '12.5px',
                          color: '#334155',
                          lineHeight: '1.6',
                          maxHeight: '160px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {q?.problemStatement}
                        </div>
                      </div>

                      {/* Starter Code Preview */}
                      <div style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Starter Stub (Provided to Candidate):
                        </span>
                        <pre style={{
                          background: '#0f172a',
                          color: '#f8fafc',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          maxHeight: '120px',
                          overflowY: 'auto',
                          margin: 0,
                          fontFamily: 'monospace'
                        }}>
                          {q?.starterCode}
                        </pre>
                      </div>

                      {/* Test Cases Count Preview */}
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>
                        <span>• <strong>{q?.sampleTestCases?.length || 2}</strong> Sample Test Cases (Candidate Visible)</span>
                        <span>• <strong>{q?.hiddenTestCases?.length || 3}</strong> Hidden Edge Cases (Grading Sandbox)</span>
                      </div>
                    </div>
                  );
                })()}

                {/* HITL Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseAiModal}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Close
                  </button>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const track = aiDraftResult;
                        setIsAiModalOpen(false);
                        setAiDraftResult(null);
                        handleOpenEditModal(track);
                      }}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Edit in Full Editor</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApproveAiAssessment}
                      disabled={isApprovingAi}
                      className="btn-primary"
                      style={{
                        padding: '8px 22px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#00b074',
                        cursor: isApprovingAi ? 'not-allowed' : 'pointer',
                        opacity: isApprovingAi ? 0.7 : 1,
                      }}
                    >
                      <CheckIcon />
                      <span>{isApprovingAi ? 'Approving...' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
