# Chart Migration Guide - Standardized ChartWrapper Implementation

## Overview
This guide provides step-by-step instructions for migrating existing chart components to use the new standardized `ChartWrapper` component for consistent styling, error handling, and functionality.

## Benefits of ChartWrapper
- ✅ **Error Boundaries**: Prevents crashes with graceful fallbacks
- ✅ **Consistent Styling**: Unified look across all charts
- ✅ **Built-in Refresh**: Standard refresh functionality
- ✅ **Data Source Attribution**: Clear data provenance
- ✅ **Loading States**: Consistent loading indicators
- ✅ **Responsive Design**: Mobile-friendly layout
- ✅ **Accessibility**: Proper ARIA labels and keyboard navigation

## Migration Steps

### Step 1: Import ChartWrapper
```javascript
// Replace
import { Card, LoadingSpinner } from './ui';

// With
import ChartWrapper from './ChartWrapper';
```

### Step 2: Update Component Structure
```javascript
// Old structure
return (
  <Card className={styles.container}>
    <div className={styles.header}>
      <h3>{title}</h3>
      {/* Time range buttons */}
    </div>
    {loading && <LoadingSpinner />}
    {error && <ErrorComponent />}
    {!loading && !error && <Chart />}
  </Card>
);

// New structure
return (
  <ChartWrapper
    title="Chart Title"
    subtitle="Optional subtitle"
    loading={loading}
    error={error}
    onRefresh={handleRefresh}
    dataSource="API Source"
    timeRangeComponent={timeRangeButtons}
    metricsComponent={metricsDisplay}
  >
    <Chart />
  </ChartWrapper>
);
```

### Step 3: Handle Refresh Logic
```javascript
const [internalLoading, setInternalLoading] = useState(false);

const handleRefresh = async () => {
  if (onRefresh) {
    setInternalLoading(true);
    try {
      await onRefresh();
    } finally {
      setInternalLoading(false);
    }
  }
};
```

### Step 4: Extract Time Range Component
```javascript
const timeRangeComponent = (
  <div className={styles.timeRangeButtons}>
    {timeRanges.map(range => (
      <button
        key={range.value}
        onClick={() => setTimeRange(range.value)}
        className={activeClass}
      >
        {range.label}
      </button>
    ))}
  </div>
);
```

## Completed Migrations

### ✅ PriceChart
- File: `PriceChart.updated.jsx`
- Status: Ready for testing
- Features: Time range selector, refresh button, data source attribution

## Pending Migrations

### High Priority
1. **AIPredictionChart**
   - Add prediction confidence metrics
   - Source: OpenAI API

2. **BitcoinDominanceChart**
   - Add current dominance display
   - Source: CoinGecko

3. **MVRVChart**
   - Add zone indicators
   - Source: Calculated from price data

4. **ExchangeReservesChart**
   - Add netflow metrics
   - Source: Blockchain.info

### Medium Priority
5. **HashRateChart**
   - Add difficulty correlation
   - Source: Blockchain.info

6. **TransactionVolumeChart**
   - Add average transaction size
   - Source: Blockchain.info

7. **BTCGoldChart**
   - Add gold price source
   - Source: Gold API

8. **CorrelationDashboard**
   - Add correlation strength legend
   - Source: Internal calculations

### Low Priority
9. **StockFlowChart**
   - Add S/F ratio explanation
   - Source: Calculated

10. **DifficultyChart**
    - Add mining difficulty info
    - Source: Blockchain.info

11. **LiveModelsChart**
    - Add model accuracy metrics
    - Source: Internal ML models

## Testing Checklist

After each migration:
- [ ] Chart renders without errors
- [ ] Loading state displays correctly
- [ ] Error state shows retry button
- [ ] Refresh button works
- [ ] Time range filters update data
- [ ] Data source is displayed
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] ARIA labels are present

## Code Quality Standards

1. **PropTypes**: Add PropTypes for all props
2. **Default Props**: Provide sensible defaults
3. **Error Handling**: Handle API failures gracefully
4. **Performance**: Use React.memo for expensive renders
5. **Accessibility**: Add proper ARIA labels

## Common Issues & Solutions

### Issue: Time range not updating
**Solution**: Ensure `timeRange` is in dependency array of `useEffect`

### Issue: Refresh button not working
**Solution**: Check if `onRefresh` prop is passed correctly

### Issue: Styling conflicts
**Solution**: Remove old CSS classes that conflict with ChartWrapper

### Issue: Mobile layout broken
**Solution**: Test responsive breakpoints and adjust CSS

## Rollback Plan

If issues arise:
1. Keep original file as backup
2. Test migration in development branch
3. Gradual rollout - one chart at a time
4. Monitor error rates in production

## Next Steps

1. Complete all high priority migrations
2. Test thoroughly on different devices
3. Gather user feedback
4. Implement additional features (zoom, export)
5. Document any custom chart-specific features

---
Migration Status: 1/11 Complete
Last Updated: December 21, 2025
