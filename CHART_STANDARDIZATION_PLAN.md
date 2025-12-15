# Chart Standardization Plan

## Design System - Consistent Colors

### Primary Color Assignments
- **Bitcoin/BTC**: `#22D3EE` (Cyan/Primary) - All BTC-related lines, bars, data
- **Gold**: `#F59E0B` (Orange/Warning) - All gold-related data
- **Positive/Gains**: `#10B981` (Green/Success) - Profits, gains, positive changes
- **Negative/Losses**: `#EF4444` (Red/Error) - Losses, negative changes
- **AI/Predictions**: `#F59E0B` (Orange) - AI predictions, forecasts
- **Secondary Data**: `#3B82F6` (Blue/Info) - Supporting metrics

### Typography & Labels
- **X-Axis Labels**: 
  - Format: "MMM DD" for short periods, "MMM 'YY" for long periods
  - Font size: 12px
  - Color: #94A3B8 (textSecondary)
  
- **Y-Axis Labels**:
  - Clear titles: "Price (USD)", "Volume (BTC)", "Hash Rate (TH/s)"
  - Numbers formatted with commas: 45,000 not 45000
  - Use K/M/B suffixes for large numbers
  - Font size: 12px
  - Color: #94A3B8

- **Legend Labels**:
  - Clear, descriptive text
  - Font size: 14px
  - Position: top-right or top-center

## Charts to Standardize

### 1. Investment Analytics (4 charts)
- ✓ BitcoinDominanceChart - BTC dominance (cyan), thresholds (orange)
- ✓ MVRVChart - MVRV ratio line (cyan), zones colored
- ✓ ExchangeReservesChart - Reserves (cyan)
- ✓ HistoricalROIHeatmap - Color gradient (red→yellow→green)

### 2. Price & AI Charts (2 charts)
- ✓ PriceChart - BTC price (cyan)
- ✓ AIPredictionChart - Actual (cyan), AI predictions (orange)

### 3. Comparison Charts (2 charts)
- BTCGoldChart - BTC price (cyan), Gold (orange)
- TransactionVolumeChart - TX volume (cyan), Price (orange)

### 4. Network Health (3 charts)
- HashRateChart - Hash rate (green/success)
- DifficultyChart - Difficulty (blue/info)
- StockFlowChart - S2F (orange), Price (cyan)

### 5. Other Charts (2 charts)
- LiveModelsChart - Model bars (cyan)
- PricePerformanceChart - Green (positive), Red (negative)

## Implementation Checklist Per Chart
- [ ] Verify color uses design system tokens
- [ ] X-axis has proper date formatting
- [ ] Y-axis has clear title and formatted numbers
- [ ] Legend is positioned correctly
- [ ] Tooltips show formatted data
- [ ] Chart maintains aspect ratio
- [ ] Loading state implemented
- [ ] Error state implemented
