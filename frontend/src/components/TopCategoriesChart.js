// src/components/TopCategoriesChart.js
import React, { useRef, useEffect } from "react";
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

const TopCategoriesChart = ({ topCategories }) => {
  const chartRef = useRef(null);

  // Extract labels and counts safely
  const labels = topCategories?.map((c) => c.name) || [];
  const counts = topCategories?.map((c) => c.count) || [];

  // 🎨 Base colors
  const colors = [
    "rgba(99, 102, 241, 0.8)", // Indigo
    "rgba(16, 185, 129, 0.8)", // Green
    "rgba(239, 68, 68, 0.8)", // Red
    "rgba(245, 158, 11, 0.8)", // Amber
    "rgba(139, 92, 246, 0.8)", // Purple
  ];

  // 🔥 Apply gradient effect after chart renders
  useEffect(() => {
    const chart = chartRef.current;

    if (chart && chart.ctx && counts.length > 0) {
      const ctx = chart.ctx;

      chart.data.datasets[0].backgroundColor = counts.map((_, i) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, colors[i % colors.length]);
        gradient.addColorStop(1, "rgba(255,255,255,0.2)");
        return gradient;
      });

      chart.update();
    }
  }, [counts]);

  const data = {
    labels,
    datasets: [
      {
        label: "Products Sold",
        data: counts,
        borderColor: colors.map((c) => c.replace("0.8", "1")),
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 40,
        backgroundColor: colors, // fallback colors
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Top Product Categories",
        font: { size: 18, weight: "bold" },
        color: "#111827",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.formattedValue} items`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#374151", font: { size: 12, weight: "500" } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "#6b7280" },
        grid: { color: "rgba(209, 213, 219, 0.3)" },
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      {counts.length > 0 ? (
        <Bar ref={chartRef} data={data} options={options} />
      ) : (
        <p>No category data available</p>
      )}
    </div>
  );
};

export default TopCategoriesChart;
