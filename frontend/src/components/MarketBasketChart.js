import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
import styled from "styled-components";
import { ShoppingCart, TrendingUp, Target, Award } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ---------------- Styled Components ----------------
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

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  height: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
`;

const DownloadBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover {
    background: #5a67d8;
  }
`;

const RulesContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-height: 400px;
  overflow-y: auto;
  position: relative;
`;

const RulesDownloadBtn = styled(DownloadBtn)`
  top: 16px;
  right: 16px;
`;

const RuleCard = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #667eea;
`;

const RuleText = styled.p`
  color: #374151;
  font-weight: 500;
  margin: 0;
`;

const RuleMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const Metric = styled.div`
  text-align: center;

  .label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  background: ${(props) => props.bgColor};
  color: white;
`;

const StatValue = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 4px 0;
`;

const StatLabel = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
`;

// ---------------- Component ----------------
const MarketBasketChart = ({ data }) => {
  const confidenceChartRef = useRef(null);
  const supportLiftChartRef = useRef(null);

  // ✅ Attach dashboard "Download MBA Results" button listener
  useEffect(() => {
    const downloadRulesCSV = () => {
      if (!data || !data.association_rules) return;
      const rules = data.association_rules.map((rule) => ({
        antecedent: Array.isArray(rule.antecedent) ? rule.antecedent : [rule.antecedent],
        consequent: Array.isArray(rule.consequent) ? rule.consequent : [rule.consequent],
        confidence: rule.confidence ?? 0,
        support: rule.support ?? 0,
        lift: rule.lift ?? 0,
      }));

      const csvContent = [
        ["Antecedent", "Consequent", "Confidence", "Support", "Lift"].join(","),
        ...rules.map((r) =>
          [
            r.antecedent.join(" + "),
            r.consequent.join(" + "),
            ((r.confidence ?? 0) * 100).toFixed(1) + "%",
            ((r.support ?? 0) * 100).toFixed(1) + "%",
            (r.lift ?? 0).toFixed(2),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mba_results.csv";
      link.click();
    };

    const dashboardBtn = document.querySelector("#download-mba-results");
    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", downloadRulesCSV);
    }
    return () => {
      if (dashboardBtn) {
        dashboardBtn.removeEventListener("click", downloadRulesCSV);
      }
    };
  }, [data]);

  // Early exit (safe after useEffect is declared)
  if (!data || !data.association_rules || data.association_rules.length === 0) {
    return <p style={{ color: "red" }}>⚠️ No Market Basket Data Available</p>;
  }

  // ---------------- Rules & Charts ----------------
  const rules = data.association_rules.map((rule) => ({
    antecedent: Array.isArray(rule.antecedent) ? rule.antecedent : [rule.antecedent],
    consequent: Array.isArray(rule.consequent) ? rule.consequent : [rule.consequent],
    confidence: rule.confidence ?? 0,
    support: rule.support ?? 0,
    lift: rule.lift ?? 0,
  }));

  rules.sort((a, b) => b.lift - a.lift);

  const confidenceData = {
    labels: rules.map(
      (r) => `${r.antecedent.join("+")} → ${r.consequent.join("+")}`
    ),
    datasets: [
      {
        label: "Confidence (%)",
        data: rules.map((r) => (r.confidence ?? 0) * 100),
        backgroundColor: "rgba(102, 126, 234, 0.8)",
        borderColor: "rgba(102, 126, 234, 1)",
        borderWidth: 1,
      },
    ],
  };

  const confidenceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { display: false } },
      y: { beginAtZero: true, max: 100, title: { display: true, text: "Confidence (%)" } },
    },
  };

  const supportLiftData = {
    labels: rules.map(
      (r) => `${r.antecedent.join("+")} → ${r.consequent.join("+")}`
    ),
    datasets: [
      {
        label: "Support (%)",
        data: rules.map((r) => (r.support ?? 0) * 100),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        yAxisID: "y1",
      },
      {
        label: "Lift",
        data: rules.map((r) => r.lift ?? 0),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        yAxisID: "y2",
      },
    ],
  };

  const supportLiftOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      y1: { beginAtZero: true, position: "left", title: { display: true, text: "Support (%)" } },
      y2: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Lift" } },
      x: { ticks: { display: false } },
    },
  };

  const itemCounts = {};
  rules.forEach((r) => {
    r.antecedent.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });
  const topAntecedent = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  const downloadChart = (ref, name) => {
    if (!ref.current) return;
    const url = ref.current.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const downloadRulesCSV = () => {
    const csvContent = [
      ["Antecedent", "Consequent", "Confidence", "Support", "Lift"].join(","),
      ...rules.map((r) =>
        [
          r.antecedent.join(" + "),
          r.consequent.join(" + "),
          ((r.confidence ?? 0) * 100).toFixed(1) + "%",
          ((r.support ?? 0) * 100).toFixed(1) + "%",
          (r.lift ?? 0).toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "association_rules.csv";
    link.click();
  };

  return (
    <VisualizationContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Header>
        <ShoppingCart size={24} color="#667eea" />
        <h2>Market Basket Analysis Results</h2>
      </Header>

      {/* Charts */}
      <Content>
        <ChartContainer>
          <Bar ref={confidenceChartRef} data={confidenceData} options={confidenceOptions} />
          <DownloadBtn onClick={() => downloadChart(confidenceChartRef, "confidence_chart.png")}>
            Download
          </DownloadBtn>
        </ChartContainer>

        <ChartContainer>
          <Bar ref={supportLiftChartRef} data={supportLiftData} options={supportLiftOptions} />
          <DownloadBtn onClick={() => downloadChart(supportLiftChartRef, "support_lift_chart.png")}>
            Download
          </DownloadBtn>
        </ChartContainer>
      </Content>

      {/* Rules List */}
      <RulesContainer>
        <h3 style={{ marginBottom: "16px", color: "#374151" }}>Association Rules (sorted by Lift)</h3>
        <RulesDownloadBtn onClick={downloadRulesCSV}>Download CSV</RulesDownloadBtn>
        {rules.map((rule, index) => (
          <RuleCard key={index}>
            <RuleText>
              {rule.antecedent.join(" + ")} → {rule.consequent.join(" + ")}
            </RuleText>
            <RuleMetrics>
              <Metric>
                <div className="label">Confidence</div>
                <div className="value">{((rule.confidence ?? 0) * 100).toFixed(1)}%</div>
              </Metric>
              <Metric>
                <div className="label">Support</div>
                <div className="value">{((rule.support ?? 0) * 100).toFixed(1)}%</div>
              </Metric>
              <Metric>
                <div className="label">Lift</div>
                <div className="value">{(rule.lift ?? 0).toFixed(2)}</div>
              </Metric>
            </RuleMetrics>
          </RuleCard>
        ))}
      </RulesContainer>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatIcon bgColor="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">
            <Target size={24} />
          </StatIcon>
          <StatValue>{data.total_rules ?? rules.length}</StatValue>
          <StatLabel>Total Rules</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon bgColor="linear-gradient(135deg, #10b981 0%, #059669 100%)">
            <TrendingUp size={24} />
          </StatIcon>
          <StatValue>
            {((rules.reduce((acc, r) => acc + (r.confidence ?? 0), 0) / (rules.length || 1)) * 100).toFixed(1)}%
          </StatValue>
          <StatLabel>Avg Confidence</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon bgColor="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
            <Award size={24} />
          </StatIcon>
          <StatValue>{Math.max(...rules.map((r) => r.lift ?? 0)).toFixed(2)}</StatValue>
          <StatLabel>Highest Lift</StatLabel>
        </StatCard>

        {topAntecedent && (
          <StatCard>
            <StatIcon bgColor="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)">
              <ShoppingCart size={24} />
            </StatIcon>
            <StatValue>{topAntecedent[0]}</StatValue>
            <StatLabel>Most Frequent Antecedent</StatLabel>
          </StatCard>
        )}
      </StatsGrid>
    </VisualizationContainer>
  );
};

export default MarketBasketChart;
