import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MonthlySalesChart = ({ salesData }) => {
  if (!salesData || salesData.length === 0) {
    return <p>No monthly sales data available</p>;
  }

  // Extract labels & values
  const labels = salesData.map((item) => item.month);
  const values = salesData.map((item) => item.sales);

  const data = {
    labels,
    datasets: [
      {
        label: "Monthly Sales",
        data: values,
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.1)", // Indigo fill
        borderColor: "rgba(99, 102, 241, 1)", // Indigo border
        borderWidth: 2,
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        pointRadius: 4,
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: "Monthly Sales Trend",
        font: { size: 18, weight: "bold" },
        color: "#111827",
      },
      tooltip: {
        callbacks: {
          label: (context) => `₹${context.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#374151", font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`,
          color: "#6b7280",
        },
        grid: { color: "rgba(209, 213, 219, 0.3)" },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default MonthlySalesChart;
