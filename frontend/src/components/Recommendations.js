// src/components/Recommendations.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, Lightbulb } from "lucide-react";

const Recommendations = () => {
  const [cartInput, setCartInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRecommendations = async () => {
    if (!cartInput.trim()) {
      setErrorMsg("⚠️ Please enter at least one item in your cart.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setRecommendations([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          cart: cartInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean), // ✅ removes empty values
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        setErrorMsg("⚠️ No recommendations received from server.");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setErrorMsg("❌ Failed to fetch recommendations. Please try again.");
    }

    setLoading(false);
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="text-indigo-500" size={24} />
        <h2 className="text-xl font-semibold text-gray-800">
          Smart Recommendations
        </h2>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={cartInput}
          onChange={(e) => setCartInput(e.target.value)}
          placeholder="Enter items in your cart (e.g., Milk, Bread)"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
        />
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="grid gap-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-xl bg-gray-50 border-l-4 border-indigo-500 shadow-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={18} className="text-indigo-600" />
                <p className="font-semibold text-gray-800">{rec.product}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lightbulb size={14} className="text-yellow-500" />
                <span>{rec.reason || "Recommended based on your cart"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !loading &&
        !errorMsg && (
          <p className="text-gray-500 text-sm">
            No recommendations yet. Add items to your cart and try again!
          </p>
        )
      )}
    </motion.div>
  );
};

export default Recommendations;
