import React from "react";
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

const ProductPerformanceChart = ({ performanceData }) => {
  if (!performanceData || performanceData.length === 0) {
    return <p>No product performance data available</p>;
  }

  // Split into Top 5 and Bottom 5
  const sorted = [...performanceData].sort((a, b) => b.sales - a.sales);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5);

  const labels = [...top5.map((p) => p.name), ...bottom5.map((p) => p.name)];
  const sales = [...top5.map((p) => p.sales), ...bottom5.map((p) => p.sales)];

  const data = {
    labels,
    datasets: [
      {
        label: "Units Sold",
        data: sales,
        backgroundColor: [
          ...top5.map(() => "rgba(59, 130, 246, 0.8)"), // Blue for Top 5
          ...bottom5.map(() => "rgba(239, 68, 68, 0.8)"), // Red for Bottom 5
        ],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y", // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Top 5 vs Bottom 5 Product Performance",
        font: { size: 18, weight: "bold" },
        color: "#111827",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.formattedValue} units`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: "#374151" },
        grid: { color: "rgba(209, 213, 219, 0.3)" },
      },
      y: {
        ticks: { color: "#374151" },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ProductPerformanceChart;
