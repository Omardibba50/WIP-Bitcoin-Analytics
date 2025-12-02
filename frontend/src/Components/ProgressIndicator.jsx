import React from 'react';
import styles from './MainDashboard.module.css';

/**
 * Progress Indicator Component
 * Shows 3-tier progressive loading state
 */
const ProgressIndicator = ({ 
  isCriticalLoading, 
  isSecondaryLoading, 
  isTertiaryLoading 
}) => {
  // Calculate progress percentage
  let progress = 0;
  if (!isCriticalLoading) progress = 33;
  if (!isCriticalLoading && !isSecondaryLoading) progress = 66;
  if (!isCriticalLoading && !isSecondaryLoading && !isTertiaryLoading) progress = 100;

  // Don't show if fully loaded
  if (progress === 100) return null;

  return (
    <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div 
        className={styles.progressBarFill} 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressIndicator;
