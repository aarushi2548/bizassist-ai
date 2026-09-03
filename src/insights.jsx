import { useEffect, useState } from "react";

function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/insights"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load insights."
        );
      }

      setInsights(
        Array.isArray(data.insights)
          ? data.insights
          : []
      );
    } catch (error) {
      console.error("INSIGHTS ERROR:", error);
      setError(
        error.message ||
          "Could not load business insights."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStyle = (type) => {
    if (type === "success") {
      return {
        background: "#eaf8ef",
        border: "1px solid #ccebd7",
      };
    }

    if (type === "danger") {
      return {
        background: "#fff1f1",
        border: "1px solid #f4cccc",
      };
    }

    if (type === "warning") {
      return {
        background: "#fff7e6",
        border: "1px solid #f1dfb5",
      };
    }

    return {
      background: "#eef2ff",
      border: "1px solid #d9defb",
    };
  };

  return (
    <section
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "25px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#172033",
            }}
          >
            🤖 BizAssist Insights
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#687386",
              fontSize: "13px",
            }}
          >
            Smart insights from your business data
          </p>
        </div>

        <button
          onClick={loadInsights}
          style={{
            border: "none",
            background: "#eef0ff",
            color: "#5367d9",
            borderRadius: "9px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ↻
        </button>
      </div>

      {loading && (
        <div
          style={{
            color: "#687386",
            padding: "10px 0",
          }}
        >
          Analyzing your business...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fff1f1",
            color: "#c24141",
            padding: "12px",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        insights.length === 0 && (
          <div
            style={{
              color: "#687386",
              padding: "10px 0",
            }}
          >
            Record some orders to get business
            insights.
          </div>
        )}

      {!loading &&
        !error &&
        insights.map((insight, index) => (
          <div
            key={index}
            style={{
              ...getStyle(insight.type),
              borderRadius: "12px",
              padding: "14px",
              marginBottom:
                index === insights.length - 1
                  ? "0"
                  : "10px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "22px",
              }}
            >
              {insight.icon}
            </span>

            <div>
              <strong
                style={{
                  display: "block",
                  color: "#172033",
                  marginBottom: "4px",
                }}
              >
                {insight.title}
              </strong>

              <span
                style={{
                  color: "#687386",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {insight.message}
              </span>
            </div>
          </div>
        ))}
    </section>
  );
}

export default Insights;