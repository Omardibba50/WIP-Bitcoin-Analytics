import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PricePerformanceChart({ API_BASE_URL }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/prices/performance`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch performance:", err);
      }
    }
    fetchData();
  }, [API_BASE_URL]);

  if (!data) return <p style={{ color: "#888" }}>Loading...</p>;

  const chartData = {
    labels: data.performance.map((p) => p.interval.toUpperCase()),
    datasets: [
      {
        label: "Change (%)",
        data: data.performance.map((p) => p.changePct),
        backgroundColor: data.performance.map((p) =>
          p.changePct >= 0 ? "rgba(74,222,128,0.6)" : "rgba(255,107,107,0.6)"
        ),
        borderColor: data.performance.map((p) =>
          p.changePct >= 0 ? "#4ade80" : "#ff6b6b"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#ccc" } },
      y: { ticks: { color: "#ccc" } },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <h3 style={{ color: "#00b3ff", marginBottom: "0.5rem" }}>
        Price Performance ({data.source})
      </h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}
