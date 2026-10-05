import React, { useState } from "react";
import {
  assessmentsApi,
  type SubmissionDetailDto,
  type AssessmentResponseDto,
} from "../../services/api";
import { ProblemStatementViewer } from "./ProblemStatementViewer";
import {
  Code2,
  Terminal,
  FileCode,
  Mail,
  BookOpen,
  CheckSquare,
  Check,
  Award,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Star,
  Sparkles,
  Copy,
  Clock,
  ShieldCheck,
  X,
} from "lucide-react";
import "../../pages/TechnicalAssessmentsFull.css";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #059669 0%, #00b074 100%)", // Corporate Emerald
  "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", // Teal Forest
  "linear-gradient(135deg, #047857 0%, #10b981 100%)", // Forest Mint
  "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)", // Ocean Cyan
  "linear-gradient(135deg, #1e293b 0%, #334155 100%)", // Deep Slate
  "linear-gradient(135deg, #065f46 0%, #059669 100%)", // Deep Jade
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const getInitials = (name: string): string => {
  if (!name) return "CD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface CandidateCodeReviewModalProps {
  submission: SubmissionDetailDto;
  assessments: AssessmentResponseDto[];
  onClose: () => void;
  onSaveSuccess: () => void;
  showToast: (msg: string) => void;
}

export const CandidateCodeReviewModal: React.FC<CandidateCodeReviewModalProps> = ({
  submission,
  assessments,
  onClose,
  onSaveSuccess,
  showToast,
}) => {
  // Evaluator state initialized from submission
  const [reviewExamScore, setReviewExamScore] = useState<number>(
    submission.examScore || 0,
  );
  const [reviewIsSelectedForInterview, setReviewIsSelectedForInterview] =
    useState<boolean>(submission.isSelectedForInterview || false);
  const [reviewFeedback, setReviewFeedback] = useState<string>(
    submission.reviewerFeedback || "",
  );
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  // Initialize individual question evaluations map
  const [questionEvaluations, setQuestionEvaluations] = useState<
    Record<string, { isCorrect: boolean; pointsEarned: number; notes: string }>
  >(() => {
    const qMap: Record<
      string,
      { isCorrect: boolean; pointsEarned: number; notes: string }
    > = {};
    (submission.answers || []).forEach((a) => {
      qMap[a.questionId] = {
        isCorrect: (a.testCasesPassed || 0) > 0 || (a.score || 0) > 0,
        pointsEarned: a.score || 0,
        notes: "",
      };
    });
    return qMap;
  });

  const handleCopyCode = (qId: string, code: string) => {
    navigator.clipboard.writeText(code || "");
    setCopiedQuestionId(qId);
    setTimeout(() => setCopiedQuestionId(null), 2000);
    showToast("✓ Code copied to clipboard");
  };

  const handleAutoSumQuestions = () => {
    const totalAwarded = Object.values(questionEvaluations).reduce(
      (sum, q) => sum + (q.pointsEarned || 0),
      0,
    );
    const totalPossible =
      submission.answers?.reduce((sum, a) => {
        const currentTemplate = assessments.find(
          (t) => t.id === submission.assessmentId,
        );
        const qDef = currentTemplate?.finalQuestions?.find(
          (q) => q.id === a.questionId,
        );
        return sum + (qDef?.points || 100);
      }, 0) || 100;

    const pct = Math.round((totalAwarded / (totalPossible || 1)) * 100);
    const finalPct = Math.min(100, Math.max(0, pct));
    setReviewExamScore(finalPct);
    showToast(`Calculated score: ${finalPct}% based on question points.`);
  };

  const handleSaveReview = async () => {
    try {
      setIsSavingReview(true);
      const questionReviews = Object.entries(questionEvaluations).map(
        ([qId, val]) => ({
          questionId: qId,
          isCorrect: val.isCorrect,
          pointsEarned: val.pointsEarned,
          notes: val.notes,
        }),
      );

      await assessmentsApi.reviewSubmission(submission.id, {
        examScore: reviewExamScore,
        isSelectedForInterview: reviewIsSelectedForInterview,
        reviewerFeedback: reviewFeedback,
        questionReviews,
      });

      showToast(
        reviewIsSelectedForInterview
          ? `✓ Candidate marked as Selected for Interview and grade (${reviewExamScore}%) published to profile!`
          : `✓ Grade (${reviewExamScore}%) successfully saved and published to candidate profile!`,
      );

      onSaveSuccess();
    } catch (err: unknown) {
      console.error("Error saving review:", err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || "Failed to save candidate code review.");
    } finally {
      setIsSavingReview(false);
    }
  };

  const passingThreshold = submission.passingThreshold || 60;
  const isPassing = reviewExamScore >= passingThreshold;
  const candidateName = submission.candidateName || "Candidate Submission";
  const proctorTabSwitches = submission.proctorSummary?.tabSwitches || 0;

  return (
    <div
      className="popup-backdrop"
      style={{ zIndex: 1240 }}
      onClick={onClose}
    >
      <div
        className="popup-card candidate-review-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="candidate-review-header">
          <div className="candidate-review-header-left">
            <div
              className="candidate-review-avatar"
              style={{
                background: getGradientForName(candidateName),
              }}
            >
              {getInitials(candidateName)}
            </div>
            <div className="candidate-review-header-info">
              <div className="candidate-review-badge-row">
                <span className="candidate-review-tag-category">
                  <Code2 size={12} />
                  Candidate Code Review
                </span>
                {submission.status === "Graded" || submission.status === "Passed" ? (
                  <span className="candidate-review-tag-status graded">
                    <span className="candidate-review-tag-dot active" />
                    Graded ({submission.examScore}%)
                  </span>
                ) : (
                  <span className="candidate-review-tag-status pending">
                    <span className="candidate-review-tag-dot pending" />
                    Pending Manual Evaluation
                  </span>
                )}
              </div>
              <h3 className="candidate-review-name">{candidateName}</h3>
              <div className="candidate-review-meta-row">
                <span className="candidate-review-meta-item">
                  <Mail size={13} color="#64748b" />
                  <span>Email:</span>
                  <strong>{submission.candidateEmail}</strong>
                </span>
                <span className="candidate-review-meta-divider">•</span>
                <span className="candidate-review-meta-item">
                  <Award size={13} color="#64748b" />
                  <span>Assessment:</span>
                  <strong>{submission.assessmentTitle}</strong>
                </span>
                {submission.submittedAt && (
                  <>
                    <span className="candidate-review-meta-divider">•</span>
                    <span className="candidate-review-meta-item">
                      <Clock size={13} color="#64748b" />
                      <span>Submitted:</span>
                      <strong>
                        {new Date(submission.submittedAt).toLocaleString()}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="candidate-review-close-btn"
            title="Close review modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="candidate-review-body">
          {/* Proctor Telemetry Alert Banner */}
          {proctorTabSwitches > 0 ? (
            <div className="candidate-review-proctor-warning">
              <div className="candidate-review-proctor-content">
                <div className="candidate-review-proctor-icon-box warning">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="candidate-review-proctor-title warning">
                    Proctor Warning: Tab Switches Detected
                  </div>
                  <p className="candidate-review-proctor-desc warning">
                    The proctoring monitor detected that the candidate switched browser tabs or minimized the assessment window{" "}
                    <strong>{proctorTabSwitches} times</strong> during their exam session.
                  </p>
                </div>
              </div>
              <div className="candidate-review-proctor-badge warning">
                ⚠️ {proctorTabSwitches} Tab Switches
              </div>
            </div>
          ) : (
            <div className="candidate-review-proctor-clean">
              <div className="candidate-review-proctor-content">
                <div className="candidate-review-proctor-icon-box clean">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="candidate-review-proctor-title clean">
                    Proctor Clean: Verified Integrity
                  </div>
                  <p className="candidate-review-proctor-desc clean">
                    Zero browser tab switches or window blurs detected during the examination session. High proctor confidence score.
                  </p>
                </div>
              </div>
              <div className="candidate-review-proctor-badge clean">
                ✓ 100% Focused Session
              </div>
            </div>
          )}

          {/* Submitted Code Solutions Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="candidate-review-solutions-header">
              <div className="candidate-review-solutions-title">
                <FileCode size={18} color="#00b074" />
                <span>Submitted Code Solutions</span>
                <span className="candidate-review-count-pill">
                  {submission.answers?.length || 0} Questions
                </span>
              </div>
              <span className="candidate-review-solutions-hint">
                Review candidate code and assign question score
              </span>
            </div>

            {(!submission.answers || submission.answers.length === 0) && (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 20px",
                  color: "#94a3b8",
                  fontSize: "13px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                No answer entries found for this submission.
              </div>
            )}

            {submission.answers?.map((ans, idx) => {
              const qEval = questionEvaluations[ans.questionId] || {
                isCorrect: false,
                pointsEarned: 0,
                notes: "",
              };
              const currentTemplate = assessments.find(
                (a) => a.id === submission.assessmentId,
              );
              const questionDef = currentTemplate?.finalQuestions?.find(
                (q) => q.id === ans.questionId,
              );
              const maxPts = questionDef?.points || 100;
              const lang = ans.language || questionDef?.language || "Code";
              const difficulty = questionDef?.difficulty || "Medium";

              return (
                <div key={ans.questionId || idx} className="candidate-review-qcard">
                  {/* Question Header Bar */}
                  <div className="candidate-review-qtop">
                    <div className="candidate-review-qtop-left">
                      <span className="candidate-review-qnum">Q{idx + 1}</span>
                      <span className="candidate-review-qtitle">
                        {questionDef?.title || `Coding Question #${idx + 1}`}
                      </span>
                      <span className="candidate-review-qlang">{lang}</span>
                      <span className={`candidate-review-qdiff ${difficulty}`}>
                        {difficulty}
                      </span>
                    </div>
                    <div className="candidate-review-qweight">
                      Max Weight: <strong>{maxPts} pts</strong>
                    </div>
                  </div>

                  {/* Problem Specification & Guidelines */}
                  {questionDef?.problemStatement && (
                    <div className="candidate-review-spec-box">
                      <div className="candidate-review-spec-header">
                        <BookOpen size={13} color="#00b074" />
                        <span className="candidate-review-spec-label">
                          Problem Specification & Guidelines
                        </span>
                      </div>
                      <ProblemStatementViewer
                        content={questionDef.problemStatement}
                        theme="light"
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Candidate Typed Code Block (IDE Card) */}
                  <div className="candidate-review-ide">
                    <div className="candidate-review-ide-bar">
                      <div className="candidate-review-ide-dots">
                        <span className="candidate-review-ide-dot red" />
                        <span className="candidate-review-ide-dot yellow" />
                        <span className="candidate-review-ide-dot green" />
                        <div
                          className="candidate-review-ide-title"
                          style={{ marginLeft: "6px" }}
                        >
                          <Terminal size={12} color="#94a3b8" />
                          <span>CANDIDATE TYPED CODE ({lang.toUpperCase()})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(ans.questionId, ans.submittedCode || "")}
                        className={`candidate-review-ide-copy-btn ${
                          copiedQuestionId === ans.questionId ? "copied" : ""
                        }`}
                        title="Copy candidate code to clipboard"
                      >
                        {copiedQuestionId === ans.questionId ? (
                          <>
                            <Check size={12} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="candidate-review-ide-code">
                      {ans.submittedCode || "// No code submitted for this question."}
                    </pre>
                  </div>

                  {/* Evaluator Controls */}
                  <div className="candidate-review-qeval-bar">
                    <div className="candidate-review-verdict-group">
                      <span className="candidate-review-verdict-label">
                        <CheckSquare
                          size={13}
                          style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }}
                        />
                        Solution Verdict:
                      </span>
                      <div className="candidate-review-verdict-options">
                        <button
                          type="button"
                          className={`candidate-review-verdict-btn ${
                            qEval.isCorrect ? "active-correct" : ""
                          }`}
                          onClick={() => {
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                isCorrect: true,
                                pointsEarned:
                                  qEval.pointsEarned > 0 ? qEval.pointsEarned : maxPts,
                              },
                            }));
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Correct</span>
                        </button>
                        <button
                          type="button"
                          className={`candidate-review-verdict-btn ${
                            !qEval.isCorrect ? "active-incorrect" : ""
                          }`}
                          onClick={() => {
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                isCorrect: false,
                                pointsEarned: 0,
                              },
                            }));
                          }}
                        >
                          <AlertCircle size={14} />
                          <span>Incorrect / Incomplete</span>
                        </button>
                      </div>
                    </div>

                    <div className="candidate-review-marks-box">
                      <span className="candidate-review-marks-label">
                        Marks Awarded:
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={maxPts}
                        value={qEval.pointsEarned}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            Math.min(maxPts, Number(e.target.value)),
                          );
                          setQuestionEvaluations((prev) => ({
                            ...prev,
                            [ans.questionId]: {
                              ...qEval,
                              pointsEarned: val,
                              isCorrect: val > 0,
                            },
                          }));
                        }}
                        className="candidate-review-marks-input"
                      />
                      <span className="candidate-review-marks-max">
                        / {maxPts} pts
                      </span>

                      <div className="candidate-review-quick-scores">
                        <button
                          type="button"
                          className="candidate-review-quick-btn"
                          title="Assign 0 points"
                          onClick={() => {
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                pointsEarned: 0,
                                isCorrect: false,
                              },
                            }));
                          }}
                        >
                          0
                        </button>
                        <button
                          type="button"
                          className="candidate-review-quick-btn"
                          title="Assign half points"
                          onClick={() => {
                            const half = Math.round(maxPts / 2);
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                pointsEarned: half,
                                isCorrect: true,
                              },
                            }));
                          }}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          className="candidate-review-quick-btn"
                          title="Assign full points"
                          onClick={() => {
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                pointsEarned: maxPts,
                                isCorrect: true,
                              },
                            }));
                          }}
                        >
                          Full
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Assessment Scoring & Decision Card */}
          <div className="candidate-review-overall-card">
            <div className="candidate-review-overall-header">
              <div className="candidate-review-overall-title">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#e6f9f2",
                    color: "#00b074",
                  }}
                >
                  <Award size={16} />
                </span>
                <span>Overall Assessment Scoring & Decision</span>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Passing Threshold: <strong>{passingThreshold}%</strong>
              </span>
            </div>

            <div className="candidate-review-overall-grid">
              {/* Left Column: Total Exam Score */}
              <div className="candidate-review-score-panel">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 750,
                    color: "#334155",
                    display: "block",
                  }}
                >
                  Total Exam Score (0 – 100%):
                </label>
                <div className="candidate-review-score-row">
                  <div className="candidate-review-score-input-wrap">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reviewExamScore}
                      onChange={(e) =>
                        setReviewExamScore(
                          Math.max(0, Math.min(100, Number(e.target.value))),
                        )
                      }
                      className="candidate-review-score-input"
                    />
                    <span className="candidate-review-score-percent">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoSumQuestions}
                    className="candidate-review-autosum-btn"
                    title="Calculate percentage from question points"
                  >
                    <Sparkles size={13} />
                    <span>Auto-sum Questions</span>
                  </button>
                </div>

                <div
                  className={`candidate-review-threshold-pill ${
                    isPassing ? "pass" : "fail"
                  }`}
                >
                  {isPassing ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>
                        Meets Passing Standard (≥ {passingThreshold}%)
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} />
                      <span>
                        Below Passing Standard (&lt; {passingThreshold}%)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Feedback */}
              <div className="candidate-review-feedback-panel">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 750,
                    color: "#334155",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Reviewer Feedback / Comments for Candidate:
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on coding style, algorithm efficiency, modularity, and clean code principles..."
                  className="candidate-review-feedback-textarea"
                />
              </div>
            </div>

            {/* ⭐ Select Candidate for Technical Interview Checkbox */}
            <div
              className={`candidate-review-interview-card ${
                reviewIsSelectedForInterview ? "selected" : "unselected"
              }`}
              onClick={() =>
                setReviewIsSelectedForInterview(!reviewIsSelectedForInterview)
              }
            >
              <div className="candidate-review-interview-left">
                <div className="candidate-review-interview-icon">
                  <Star
                    size={18}
                    fill={reviewIsSelectedForInterview ? "#ffffff" : "none"}
                  />
                </div>
                <div>
                  <div className="candidate-review-interview-title-row">
                    <span className="candidate-review-interview-title">
                      Select Candidate for Technical Interview
                    </span>
                    {reviewIsSelectedForInterview && (
                      <span className="candidate-review-interview-badge">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <p className="candidate-review-interview-desc">
                    When enabled, the candidate is prioritized in the Interview
                    Selection pipeline, and an interview invitation flag appears
                    on their profile.
                  </p>
                </div>
              </div>
              <label
                className="candidate-review-switch"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={reviewIsSelectedForInterview}
                  onChange={(e) =>
                    setReviewIsSelectedForInterview(e.target.checked)
                  }
                />
                <span className="candidate-review-switch-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="candidate-review-footer">
          <div className="candidate-review-footer-summary">
            <span>Evaluation Summary:</span>
            <span className="candidate-review-footer-badge">
              Final Score: <strong>{reviewExamScore}%</strong>
            </span>
            {reviewIsSelectedForInterview ? (
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  fontSize: "12px",
                  fontWeight: 750,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Star size={12} fill="#047857" /> Selected for Interview
              </span>
            ) : isPassing ? (
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  fontSize: "12px",
                  fontWeight: 750,
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                Passed
              </span>
            ) : (
              <span
                style={{
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  fontSize: "12px",
                  fontWeight: 750,
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                Needs Improvement
              </span>
            )}
          </div>

          <div className="candidate-review-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="candidate-review-btn-cancel"
              disabled={isSavingReview}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReview}
              className="candidate-review-btn-save"
              disabled={isSavingReview}
            >
              {isSavingReview ? (
                <>Saving Review...</>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save & Publish Grade to Candidate Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
