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

const CustomerGrowthChart = ({ growthData }) => {
  if (!growthData || growthData.length === 0) {
    return <p>No customer growth data available</p>;
  }

  // Extract labels & values
  const labels = growthData.map((item) => item.month);
  const values = growthData.map((item) => item.customers);

  const data = {
    labels,
    datasets: [
      {
        label: "Customer Growth",
        data: values,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)", // Green fill
        borderColor: "rgba(16, 185, 129, 1)", // Green border
        borderWidth: 2,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
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
        text: "Customer Growth Trend",
        font: { size: 18, weight: "bold" },
        color: "#111827",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.formattedValue} Customers`,
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
          callback: (value) => `${value}`,
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

export default CustomerGrowthChart;
