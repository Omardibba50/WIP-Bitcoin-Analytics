import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './MainDashboard.module.css';

/**
 * Filter Controls Component
 * Symbol search and date range picker
 */
const FilterControls = ({
  symbol,
  onSymbolChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onApply
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onApply();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.controlRow}>
      <div className={styles.controlLabel}>
        Filter Price Data:
      </div>

      <input
        type="text"
        placeholder="Symbol (e.g., BTC)"
        value={symbol}
        onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
        className={`${styles.controlInput} ${styles.symbolInput}`}
        maxLength={10}
        aria-label="Cryptocurrency symbol"
      />

      <div className={styles.datepickerWrapper}>
        <DatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Start Date"
          dateFormat="MM/dd/yyyy"
          customInput={
            <input 
              className={`${styles.controlInput} ${styles.datepickerInput}`}
              aria-label="Start date"
            />
          }
          maxDate={new Date()}
        />
      </div>

      <div className={styles.datepickerWrapper}>
        <DatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          placeholderText="End Date"
          dateFormat="MM/dd/yyyy"
          customInput={
            <input 
              className={`${styles.controlInput} ${styles.datepickerInput}`}
              aria-label="End date"
            />
          }
          maxDate={new Date()}
        />
      </div>

      <button 
        type="submit" 
        className={styles.applyButton}
        aria-label="Apply filters"
      >
        Apply
      </button>
    </form>
  );
};

export default FilterControls;
