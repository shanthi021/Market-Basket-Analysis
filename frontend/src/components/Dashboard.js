// src/components/Dashboard.js
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  LogOut,
  Upload,
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  Settings,
  Target,
  Loader2,
} from "lucide-react";
import styled from "styled-components";
import axios from "axios";
import toast from "react-hot-toast";
import KMeansVisualization from "./KMeansVisualization";
import MarketBasketChart from "./MarketBasketChart";
import StatsCards from "./StatsCards";
import TopCategoriesChart from "./TopCategoriesChart";

const API_BASE = "http://127.0.0.1:5000/api";

/* ------------------- 🎨 Styled Components ------------------- */
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
`;

const Header = styled.header`
  background: white;
  border-radius: 16px;
  padding: 20px 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserInfo = styled.div`
  text-align: right;

  .username {
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .role {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
`;

const LogoutButton = styled(motion.button)`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const UploadSection = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
`;

const FileInput = styled.input`
  display: none;
`;

const AnalysisControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ControlButton = styled(motion.button)`
  background: ${(props) =>
    props.active
      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      : "white"};
  color: ${(props) => (props.active ? "white" : "#374151")};
  border: 2px solid ${(props) => (props.active ? "transparent" : "#e5e7eb")};
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ClusterSelect = styled.select`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
  margin-left: 10px;
`;

/* ------------------- 🧠 Component ------------------- */
const Dashboard = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("kmeans");
  const [loadingKMeans, setLoadingKMeans] = useState(false);
  const [loadingMBA, setLoadingMBA] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [kmeansData, setKmeansData] = useState(null);
  const [marketBasketData, setMarketBasketData] = useState(null);
  const [clusters, setClusters] = useState(3);

  const fileInputRef = useRef();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 📊 Fetch Stats
  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/dashboard-stats`, {
        headers: getAuthHeader(),
      });
      setDashboardStats(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
      } else {
        toast.error("Failed to load dashboard stats");
      }
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchStats();
    }
  }, [loading, user]);

  // 📤 File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_BASE}/upload-data`, formData, {
        headers: getAuthHeader(),
      });

      toast.success(
        `${response.data.message} | Rows: ${response.data.rows}, Columns: ${response.data.columns}`
      );
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload data");
    }
  };

  // 🧠 Run KMeans
  const runKMeansAnalysis = async () => {
    setLoadingKMeans(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/kmeans-analysis`,
        { n_clusters: clusters },
        { headers: getAuthHeader() }
      );
      setKmeansData(data);
      setActiveTab("kmeans");
      toast.success(`K-means completed with ${clusters} clusters!`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run K-means");
    } finally {
      setLoadingKMeans(false);
    }
  };

  // 🛒 Run Market Basket
  const runMarketBasketAnalysis = async () => {
    setLoadingMBA(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/market-basket-analysis`,
        {},
        { headers: getAuthHeader() }
      );
      setMarketBasketData(data);
      setActiveTab("marketbasket");
      toast.success("Market basket analysis completed!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run analysis");
    } finally {
      setLoadingMBA(false);
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <p className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} /> Loading application
          data...
        </p>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* -------- Header -------- */}
      <Header>
        <Logo>
          <BarChart3 size={32} color="#667eea" />
          <h1>Market Basket Analysis</h1>
        </Logo>
        <UserSection>
          <UserInfo>
            <p className="username">Welcome, {user?.username || "Guest"}</p>
            <p className="role">Data Analyst</p>
          </UserInfo>
          <LogoutButton onClick={logout}>
            <LogOut size={16} />
            Logout
          </LogoutButton>
        </UserSection>
      </Header>

      {/* -------- Stats -------- */}
      {dashboardStats ? (
        <>
          <StatsCards stats={dashboardStats} />
          {dashboardStats.top_categories &&
            dashboardStats.top_categories.length > 0 && (
              <Card>
                <CardHeader>
                  <h2>Top Categories</h2>
                </CardHeader>
                <TopCategoriesChart
                  topCategories={dashboardStats.top_categories}
                />
              </Card>
            )}
        </>
      ) : (
        <p className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Loading dashboard
          stats...
        </p>
      )}

      {/* -------- Main Content -------- */}
      <MainContent>
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2>Data Upload</h2>
            <Upload size={20} color="#6b7280" />
          </CardHeader>
          <UploadSection>
            <Upload size={48} className="upload-icon" />
            <h3>Upload Transaction Data</h3>
            <p>Click below to upload a CSV file with your transaction data</p>
            <ActionButton onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              Choose File
            </ActionButton>
            <FileInput
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </UploadSection>
        </Card>

        {/* Controls Section */}
        <Card>
          <CardHeader>
            <h2>Analysis Controls</h2>
            <Settings size={20} color="#6b7280" />
          </CardHeader>
          <AnalysisControls>
            <ControlButton
              active={activeTab === "kmeans"}
              onClick={() => setActiveTab("kmeans")}
            >
              <Users size={16} />
              K-Means
            </ControlButton>
            <ControlButton
              active={activeTab === "marketbasket"}
              onClick={() => setActiveTab("marketbasket")}
            >
              <ShoppingCart size={16} />
              Market Basket
            </ControlButton>
          </AnalysisControls>

          {/* Cluster Selector */}
          {activeTab === "kmeans" && (
            <>
              <label>
                Number of Clusters:
                <ClusterSelect
                  value={clusters}
                  onChange={(e) => setClusters(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </ClusterSelect>
              </label>
              <ActionButton onClick={runKMeansAnalysis} disabled={loadingKMeans}>
                {loadingKMeans ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Running...
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    Run K-Means Analysis
                  </>
                )}
              </ActionButton>
            </>
          )}

          {activeTab === "marketbasket" && (
            <ActionButton onClick={runMarketBasketAnalysis} disabled={loadingMBA}>
              {loadingMBA ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Running...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Run Market Basket Analysis
                </>
              )}
            </ActionButton>
          )}
        </Card>
      </MainContent>

      {/* -------- Results -------- */}
      {activeTab === "kmeans" && kmeansData && (
        <KMeansVisualization data={kmeansData} />
      )}
      {activeTab === "marketbasket" && marketBasketData && (
        <MarketBasketChart data={marketBasketData} />
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
