# 🚀 Quick Start Guide - AI Bitcoin Price Prediction Dashboard

## Prerequisites
- ✅ Backend server running on `http://localhost:5000`
- ✅ AI model trained and loaded
- ✅ Node.js v20.x installed
- ✅ npm or yarn package manager

---

## Step 1: Start the Backend (if not running)

```bash
cd /home/omar/WIP/backend
node server.js
```

**Expected Output:**
```
✅ Backend running on http://localhost:5000
🤖 Initializing AI Prediction Service...
✅ Model loaded successfully
✅ AI prediction polling started (every 1 hour)
```

---

## Step 2: Configure Frontend Environment

Create `.env` file in `/home/omar/WIP/frontend/`:

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Step 3: Install Frontend Dependencies

```bash
cd /home/omar/WIP/frontend
npm install
```

**Note:** All required dependencies should already be in `package.json`:
- react
- react-chartjs-2
- chart.js
- chartjs-adapter-date-fns

---

## Step 4: Start the Frontend Development Server

```bash
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 5: Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173/
```

---

## 📊 What You'll See

### **Dashboard Tab** (Main View)

1. **Price Cards** (Top)
   - Current BTC price
   - 24h change
   - All-time high

2. **🤖 AI Prediction Card** (NEW)
   - Current price: $91,094
   - Predicted price (1h): $91,107
   - Change: ↑ -0.01%
   - Confidence: 95.0%
   - Countdown: Next in 55m 30s

3. **📈 AI Predictions vs Actual Prices Chart** (NEW)
   - Blue line: Historical actual prices
   - Orange dashed: AI predictions
   - Toggle: 24H / 7D / 30D
   - Stats: Total predictions, Avg confidence

4. **🎯 Model Performance Metrics** (NEW)
   - Left: Model info (LSTM, training date, dataset size)
   - Gauge: Directional accuracy (51.3%)
   - Right: Error metrics (MAE, Loss, MAPE)
   - Features: 10 features × 60 timesteps

5. **Existing Charts** (Below)
   - Candlestick chart
   - Live models comparison
   - BTC vs Gold
   - Network metrics

---

## 🔍 Testing the AI Features

### **Test 1: Check Service Status**
```bash
curl http://localhost:5000/api/ai/status | jq
```

Expected: `"status": "operational"`

### **Test 2: Get Latest Prediction**
```bash
curl http://localhost:5000/api/ai/predictions/latest | jq
```

Expected: Prediction object with `predicted_price`, `confidence`

### **Test 3: Get Model Metrics**
```bash
curl http://localhost:5000/api/ai/model/metrics | jq
```

Expected: Model performance data with MAE, accuracy

---

## 🎨 UI Components Location

```
frontend/src/Components/
├── AIPredictionCard.jsx      // Hero prediction card
├── AIPredictionChart.jsx     // Chart visualization
├── AIModelMetrics.jsx         // Performance metrics
└── MainDashboard.jsx          // Integration point
```

---

## 🔧 Troubleshooting

### **Issue: "Loading AI prediction..." never finishes**

**Solution:**
1. Check backend logs: `tail -f /tmp/server_complete.txt`
2. Verify API endpoint: `curl http://localhost:5000/api/ai/status`
3. Check browser console for CORS errors
4. Ensure `.env` has correct API URL

### **Issue: "AI service may be initializing"**

**Solution:**
- Wait 10-30 seconds for model to load on startup
- Backend shows: `✅ Model loaded successfully`
- Component auto-retries every 5 minutes

### **Issue: No predictions in chart**

**Solution:**
- First prediction generates after ~1 hour
- Or manually trigger: `curl http://localhost:5000/api/ai/predictions/generate`
- Check database: `SELECT COUNT(*) FROM predictions WHERE model_id LIKE 'lstm%'`

### **Issue: CORS errors in browser console**

**Solution:**
Backend already has CORS enabled. If still seeing errors:
```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📱 Mobile Testing

The AI components are fully responsive. Test on different screen sizes:

```bash
# Desktop (default)
http://localhost:5173/

# Mobile simulation
Open DevTools → Toggle device toolbar
Select: iPhone 12 Pro / iPad / Pixel 5
```

---

## ⚡ Performance Tips

### **Optimize Chart Rendering:**
- Charts auto-refresh every 5 minutes
- Reduce polling interval if needed:
  ```javascript
  // AIPredictionCard.jsx, line 24
  const interval = setInterval(fetchData, 10 * 60 * 1000); // 10 minutes
  ```

### **Lazy Load Heavy Components:**
```javascript
// MainDashboard.jsx
const AIModelMetrics = lazy(() => import('./AIModelMetrics'));
```

---

## 🎯 Next Steps

1. **Generate More Predictions:**
   - Let the service run for 24 hours to accumulate data
   - Check prediction history grows: `/api/ai/predictions/history`

2. **Monitor Model Performance:**
   - Track directional accuracy over time
   - Compare predicted vs actual prices
   - Adjust confidence thresholds if needed

3. **Customize Visualizations:**
   - Modify time ranges (add 90D, 1Y options)
   - Add custom chart types
   - Implement export functionality

4. **Production Deployment:**
   - Build frontend: `npm run build`
   - Serve static files with nginx
   - Configure reverse proxy for API
   - Enable HTTPS with SSL certificates

---

## 📞 Support

### **Logs Location:**
- Backend: `/tmp/server_complete.txt`
- Frontend: Browser DevTools Console
- Model Training: `/home/omar/WIP/backend/models/training-metadata.json`

### **API Documentation:**
- Full docs: `/home/omar/WIP/docs/AI_FRONTEND_INTEGRATION.md`
- Backend routes: `/home/omar/WIP/backend/API_ROUTES.md`

### **Database Queries:**
```bash
# Check predictions count
cd /home/omar/WIP/backend
node -e "const db = require('better-sqlite3')('./data/prices.sqlite'); console.log(db.prepare('SELECT COUNT(*) FROM predictions').get());"

# Check price data
node -e "const db = require('better-sqlite3')('./data/prices.sqlite'); console.log(db.prepare('SELECT COUNT(*) FROM prices WHERE symbol = ?').get('BTC'));"
```

---

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] AI model loaded successfully
- [ ] Frontend running on port 5173
- [ ] Can access dashboard at localhost:5173
- [ ] AI Prediction Card displays current prediction
- [ ] Chart shows historical data
- [ ] Model metrics render correctly
- [ ] Auto-refresh working (check countdown timer)
- [ ] No console errors
- [ ] Responsive on mobile devices

---

**🎉 You're all set! The AI Bitcoin Price Prediction Dashboard is now live!**

For any issues or feature requests, check the documentation in `/docs/` or review the API endpoints at `http://localhost:5000/api`.
