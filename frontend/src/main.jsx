import React from 'react';
import ReactDOM from 'react-dom/client'; 
import App from './App'; 
import './styles/variables.css'
import './index.css'; 

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';

// Register Financial Charts (Candlestick)
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

// Register Date Adapter for time-based charts
import 'chartjs-adapter-date-fns';

// Register all Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  CandlestickController,
  CandlestickElement
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
