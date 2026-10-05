import { SparkleIcon } from './Icons';

export const CandidateLoadingIndicator = () => (
  <div className="candidate-loading-indicator" aria-hidden="true">
    <span className="candidate-loading-indicator-ring" />
    <span className="candidate-loading-indicator-mark"><SparkleIcon /></span>
  </div>
);