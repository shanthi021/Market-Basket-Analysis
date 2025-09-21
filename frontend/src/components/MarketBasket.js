// src/components/MarketBasket.js
import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const CardContent = styled.div`
  padding: 10px;
`;

const Button = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #5a67d8;
  }

  &:disabled {
    background: #a5b4fc;
    cursor: not-allowed;
  }
`;

const MarketBasket = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runMarketBasketAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://127.0.0.1:5000/api/market-basket-analysis",
        { min_support: 0.05, min_confidence: 0.3 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.association_rules) {
        setRules(res.data.association_rules);
      } else {
        setRules([]);
      }
    } catch (err) {
      console.error("MBA error:", err);
      setError("⚠️ Failed to run Market Basket Analysis. Upload data first.");
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        Market Basket Analysis
      </h2>

      <Button onClick={runMarketBasketAnalysis} disabled={loading}>
        {loading ? "Running..." : "Run Market Basket Analysis"}
      </Button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {!loading && rules.length === 0 && !error && (
        <p style={{ color: "#555", marginTop: "10px" }}>
          No Market Basket Data Available
        </p>
      )}

      {rules.length > 0 && (
        <Card>
          <CardContent>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Association Rules
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <thead style={{ background: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Antecedent
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Consequent
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      Support
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      Confidence
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      Lift
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #ddd" }}>
                      <td style={{ padding: "8px" }}>
                        {(r.antecedent || []).join(", ")}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {(r.consequent || []).join(", ")}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {((r.support ?? 0) * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {((r.confidence ?? 0) * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {(r.lift ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketBasket;
