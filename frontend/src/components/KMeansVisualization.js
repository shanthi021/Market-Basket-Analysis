// src/components/KMeansVisualization.js
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Scatter } from "react-chartjs-2";
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
import styled from "styled-components";
import { Users, Target, Download } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* ------------------- 🎨 Styled Components ------------------- */
const VisualizationContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
`;

const DownloadButton = styled.button`
  margin-left: auto;
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  height: 450px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const ClusterStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ClusterCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${(props) => props.color};
`;

const ClusterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
`;

const ClusterMetric = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;

  span {
    font-size: 0.875rem;
    color: #6b7280;
  }

  strong {
    color: #374151;
    font-weight: 600;
  }
`;

const CategorySelect = styled.select`
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
  width: 100%;
  background: #f9fafb;
`;

/* ------------------- 🧠 Component ------------------- */
const KMeansVisualization = ({ data }) => {
  const [clusters, setClusters] = useState(data?.clusters || []);

  if (!data) return <p>No clustering data available</p>;

  const clusterColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  const categoryOptions = [
    "High Value",
    "Budget Shoppers",
    "Occasional Buyers",
    "Frequent Buyers",
    "Young Adults",
    "Seniors",
    "Families",
    "Others",
  ];

  // 🔑 Adjust positions based on category selection
  const getAdjustedPosition = (point, category) => {
    switch (category) {
      case "High Value":
        return { ...point, x: point.x + 2, y: point.y + 2 };
      case "Budget Shoppers":
        return { ...point, x: point.x - 2, y: point.y };
      case "Occasional Buyers":
        return { ...point, x: point.x, y: point.y - 2 };
      case "Frequent Buyers":
        return { ...point, x: point.x, y: point.y + 2 };
      case "Young Adults":
        return { ...point, x: point.x + 3, y: point.y - 1 };
      case "Seniors":
        return { ...point, x: point.x - 3, y: point.y + 1 };
      case "Families":
        return { ...point, x: point.x + 1, y: point.y - 3 };
      default:
        return point;
    }
  };

  // ✅ Group points by cluster with adjusted positions
  const groupedPoints = (data.visualization_data || []).reduce((acc, point) => {
    if (!acc[point.cluster]) acc[point.cluster] = [];
    const clusterCategory =
      clusters.find((c) => c.cluster_id === point.cluster)?.category || "";
    acc[point.cluster].push(getAdjustedPosition(point, clusterCategory));
    return acc;
  }, {});

  // ✅ Chart datasets
  const chartData = {
    datasets: [
      ...Object.keys(groupedPoints).map((clusterId) => {
        const clusterNum = parseInt(clusterId, 10);
        return {
          label: clusters[clusterNum]?.category || `Cluster ${clusterNum}`,
          data: groupedPoints[clusterNum],
          backgroundColor: clusterColors[clusterNum % clusterColors.length],
          borderColor: clusterColors[clusterNum % clusterColors.length],
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }),
      {
        label: "Centroids",
        data: clusters.map((c) => ({
          x: c.centroid?.[0] || 0,
          y: c.centroid?.[1] || 0,
        })),
        backgroundColor: "#111827",
        pointStyle: "star",
        pointRadius: 10,
        pointHoverRadius: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Customer Segmentation - K-Means Clustering",
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const point = context.raw;
            if (point.customer_name) {
              return `${point.customer_name} (Age: ${point.age || "N/A"})`;
            }
            return "Centroid";
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Principal Component 1" } },
      y: { title: { display: true, text: "Principal Component 2" } },
    },
  };

  // ✅ Safe number formatter
  const formatNumber = (value, decimals = 2) =>
    typeof value === "number" && !isNaN(value)
      ? value.toFixed(decimals)
      : "N/A";

  // ✅ Handle category change
  const handleCategoryChange = async (clusterId, newCategory) => {
    const updatedClusters = clusters.map((c) =>
      c.cluster_id === clusterId ? { ...c, category: newCategory } : c
    );
    setClusters(updatedClusters);

    const labelsPayload = {};
    updatedClusters.forEach((c) => {
      labelsPayload[c.cluster_id] = c.category;
    });

    try {
      const token = localStorage.getItem("token");
      await fetch("http://127.0.0.1:5000/api/set-cluster-labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ labels: labelsPayload }),
      });
    } catch (err) {
      console.error("Error saving cluster labels:", err);
    }
  };

  // ✅ Download as CSV
  const handleDownload = () => {
    const csvHeader = [
      "Cluster ID",
      "Category",
      "Total Customers",
      "Avg Purchase Frequency",
      "Avg Age",
      "Top Products",
    ];
    const csvRows = clusters.map((c) => [
      c.cluster_id,
      c.category || "Uncategorized",
      c.total_customers || 0,
      formatNumber(c.avg_purchase_frequency, 2),
      formatNumber(c.avg_age, 1),
      (c.most_purchased_products || []).join("; "),
    ]);

    const csvContent =
      [csvHeader, ...csvRows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "kmeans_clusters.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <VisualizationContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Header>
        <Target size={24} color="#667eea" />
        <h2>K-Means Customer Segmentation</h2>
        <DownloadButton onClick={handleDownload}>
          <Download size={16} /> Download CSV
        </DownloadButton>
      </Header>

      <Content>
        {/* Chart */}
        <ChartContainer>
          <Scatter data={chartData} options={chartOptions} />
        </ChartContainer>

        {/* Cluster Stats */}
        <ClusterStats>
          <h3 style={{ marginBottom: "16px", color: "#374151" }}>
            Cluster Statistics
          </h3>
          {clusters.map((cluster, index) => (
            <ClusterCard
              key={index}
              color={clusterColors[index % clusterColors.length]}
            >
              <ClusterHeader>
                <Users
                  size={16}
                  color={clusterColors[index % clusterColors.length]}
                />
                <h3>
                  Cluster {cluster.cluster_id} –{" "}
                  {cluster.category || "Uncategorized"}
                </h3>
              </ClusterHeader>

              <ClusterMetric>
                <span>Customers:</span>
                <strong>{cluster.total_customers || 0}</strong>
              </ClusterMetric>
              <ClusterMetric>
                <span>Avg Items/User:</span>
                <strong>{formatNumber(cluster.avg_purchase_frequency, 2)}</strong>
              </ClusterMetric>
              <ClusterMetric>
                <span>Avg Age:</span>
                <strong>{formatNumber(cluster.avg_age, 1)}</strong>
              </ClusterMetric>
              <ClusterMetric>
                <span>Top Products:</span>
                <strong>
                  {cluster.most_purchased_products?.join(", ") || "N/A"}
                </strong>
              </ClusterMetric>

              {/* Dropdown to change category */}
              <CategorySelect
                value={cluster.category || ""}
                onChange={(e) =>
                  handleCategoryChange(cluster.cluster_id, e.target.value)
                }
              >
                <option value="">Select Category</option>
                {categoryOptions.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </CategorySelect>
            </ClusterCard>
          ))}
        </ClusterStats>
      </Content>
    </VisualizationContainer>
  );
};

export default KMeansVisualization;
