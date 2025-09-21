import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Table,
} from "lucide-react";
import styled from "styled-components";

/* ------------------- 🎨 Styled Components ------------------- */
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
`;

const StatIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background: ${(props) => props.bgColor};
  color: white;
`;

const StatValue = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
`;

const StatLabel = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => (props.positive ? "#10b981" : "#ef4444")};
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: -20px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: ${(props) => props.bgColor};
  opacity: 0.08;
  border-radius: 50%;
`;

/* ------------------- 🧠 Component ------------------- */
const StatsCards = ({ stats }) => {
  if (!stats) return null;

  const safeNumber = (num) =>
    typeof num === "number" && !isNaN(num) ? num.toLocaleString() : "0";

  const safeChange = (val) =>
    typeof val === "string" && val.trim() ? val : "+0%";

  const buildCard = (icon, label, value, change, bgColor) => {
    const changeVal = safeChange(change);
    const positive = changeVal.includes("+");
    return { icon, label, value, change: changeVal, positive, bgColor };
  };

  const statCards = [
    buildCard(
      <Users size={24} />,
      "Total Customers",
      safeNumber(stats?.total_customers),
      stats?.customers_change,
      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
    ),
    buildCard(
      <ShoppingCart size={24} />,
      "Total Products",
      safeNumber(stats?.total_products),
      stats?.products_change,
      "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    ),
    buildCard(
      <TrendingUp size={24} />,
      "Total Transactions",
      safeNumber(stats?.total_transactions),
      stats?.transactions_change,
      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
    ),
    buildCard(
      <Table size={24} />,
      "Rows",
      safeNumber(stats?.rows),
      stats?.rows_change,
      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
    ),
    buildCard(
      <Table size={24} />,
      "Columns",
      safeNumber(stats?.columns),
      stats?.columns_change,
      "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
    ),
  ];

  return (
    <StatsContainer>
      {statCards.map((stat, index) => (
        <StatCard
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -6, scale: 1.02 }}
          aria-label={`${stat.label}: ${stat.value} (${stat.change})`}
        >
          <BackgroundPattern bgColor={stat.bgColor} />
          <StatIcon bgColor={stat.bgColor}>{stat.icon}</StatIcon>
          <StatValue>{stat.value}</StatValue>
          <StatLabel>{stat.label}</StatLabel>
          <StatChange positive={stat.positive}>
            {stat.positive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            {stat.change}
          </StatChange>
        </StatCard>
      ))}
    </StatsContainer>
  );
};

export default StatsCards;
