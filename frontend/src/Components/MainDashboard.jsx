import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

import '../Styles/MainDashboard.css';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

function MainDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  const mainGraphData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Transaction Volume A',
        data: [12, 19, 8, 15, 22],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.4,
      },
      {
        label: 'Transaction Volume B',
        data: [7, 14, 5, 10, 18],
        fill: false,
        borderColor: 'rgba(255,99,132,1)',
        tension: 0.4,
      },
      {
        label: 'Transaction Volume C',
        data: [10, 9, 14, 6, 12],
        fill: false,
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
    ],
  };

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const subGraphs = [
    {
      label: 'Transaction Volume A',
      data: [12, 19, 8, 15, 22],
      color: 'rgba(75,192,192,1)',
    },
    {
      label: 'Transaction Volume B',
      data: [7, 14, 5, 10, 18],
      color: 'rgba(255,99,132,1)',
    },
    {
      label: 'Transaction Volume C',
      data: [10, 9, 14, 6, 12],
      color: 'rgba(54, 162, 235, 1)',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Search Box */}
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-box"
      />

      {/* Main Graph */}
      <div className="graph-container">
        <h4>Main Graph (All Lines)</h4>
        <Line data={mainGraphData} />
      </div>

      {/* Sub Graphs */}
      <div className="sub-graphs-row">
        {subGraphs.map((graph, idx) => (
          <div key={idx} className="sub-graph-box">
            <h5>{graph.label}</h5>
            <Line
              data={{
                labels: labels,
                datasets: [
                  {
                    label: graph.label,
                    data: graph.data,
                    fill: false,
                    borderColor: graph.color,
                    tension: 0.4,
                  },
                ],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainDashboard;
