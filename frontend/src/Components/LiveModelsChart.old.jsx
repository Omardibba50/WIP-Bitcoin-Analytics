import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LiveModelsChart() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  async function fetchModels() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/models/live`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setModels(json.data || []);
      setError(null);
    } catch (err) {
      console.error(" Error fetching live model data:", err);
      setError("Failed to load live data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p style={{ color: "#888" }}>Loading live data...</p>;
  }

  if (error) {
    return <p style={{ color: "#ff4d4d" }}>{error}</p>;
  }

  if (!models.length) {
    return <p style={{ color: "#888" }}>No model data available.</p>;
  }

  const labels = models.map((m) => m.name);
  const accuracies = models.map((m) => (Number(m.accuracy) * 100).toFixed(2));


  const chartData = {
    labels,
    datasets: [
      {
        label: "Model Accuracy (%)",
        data: accuracies,
        backgroundColor: ["#00b3ff", "#0090dd", "#006db3"],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#fff" } },
      title: { display: true, text: "Live Model Accuracy", color: "#fff" },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      x: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
  <div style={{ color: "#fff" }}>
    {/* Chart Section */}
    <div style={{ height: "350px", width: "100%", marginBottom: "1.5rem" }}>
      <Bar data={chartData} options={options} />
    </div>

    {/* Details Table */}
    <div
      style={{
        overflowX: "auto",
        background: "rgba(30,30,40,0.6)",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <h4 style={{ marginBottom: "0.75rem", color: "#00b3ff" }}>
        Model Details (Live)
      </h4>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
            <th style={{ padding: "0.5rem" }}>ID</th>
            <th style={{ padding: "0.5rem" }}>Name</th>
            <th style={{ padding: "0.5rem" }}>Description</th>
            <th style={{ padding: "0.5rem" }}>Accuracy (%)</th>
            <th style={{ padding: "0.5rem" }}>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr
              key={m.id}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <td style={{ padding: "0.5rem" }}>{m.id}</td>
              <td style={{ padding: "0.5rem" }}>{m.name}</td>
              <td style={{ padding: "0.5rem", maxWidth: "300px" }}>
                {m.description}
              </td>
              <td style={{ padding: "0.5rem" }}>
                {(Number(m.accuracy) * 100).toFixed(2)}%
              </td>
              <td style={{ padding: "0.5rem" }}>
                {new Date(m.updated_at).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

}
