import React from 'react';
import styles from './EmptyState.module.css';

export function EmptyState({ 
  message = 'No data available',
  icon = '📊',
  action,
  actionLabel = 'Refresh',
  description
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.message}>{message}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button onClick={action} className={styles.actionButton}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
