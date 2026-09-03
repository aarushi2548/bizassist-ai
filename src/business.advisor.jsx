import { useState } from "react";

function BusinessAdvisor({ onBack }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAdvisor = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const response = await fetch(
        "http://localhost:5000/api/advisor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get advice."
        );
      }

      setAnswer(data.answer || "No advice received.");
    } catch (err) {
      console.error("ADVISOR ERROR:", err);
      setError(
        err.message || "Could not connect to BizAssist AI."
      );
    } finally {
      setLoading(false);
    }
  };

  const askQuickQuestion = (text) => {
    setQuestion(text);
    setAnswer("");
    setError("");
  };

  return (
    <div className="app">

      <header className="header">
        <div>
          <button
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              marginBottom: "10px",
              fontSize: "15px",
            }}
          >
            ← Back
          </button>

          <h1>AI Business Advisor</h1>

          <p className="greeting">
            Ask questions about your business
          </p>
        </div>

        <div className="profile">
          AI
        </div>
      </header>

      <main>

        {/* INTRO */}

        <section
          style={{
            background: "linear-gradient(135deg, #eef0ff, #f8f9ff)",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "8px",
            }}
          >
            🤖
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              color: "#172033",
            }}
          >
            Your Business Copilot
          </h2>

          <p
            style={{
              margin: 0,
              color: "#687386",
              lineHeight: "1.5",
            }}
          >
            Ask BizAssist about your sales, customers,
            pending payments or orders.
          </p>
        </section>

        {/* QUICK QUESTIONS */}

        <section
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#172033",
            }}
          >
            Try asking
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {[
              "Who owes me the most money?",
              "What is my best-selling product?",
              "How is my business doing?",
              "Which customers should I follow up with?",
            ].map((text) => (
              <button
                key={text}
                onClick={() =>
                  askQuickQuestion(text)
                }
                style={{
                  border: "1px solid #e0e4ef",
                  background: "#f7f8fc",
                  color: "#5367d9",
                  padding: "10px 13px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {text}
              </button>
            ))}
          </div>
        </section>

        {/* QUESTION */}

        <section
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#172033",
            }}
          >
            Ask BizAssist
          </h2>

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Example: Which customer should I contact first for payment?"
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px",
              borderRadius: "11px",
              border: "1px solid #dfe3ec",
              resize: "vertical",
              fontSize: "15px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />

          <button
            onClick={askAdvisor}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "13px",
              border: "none",
              borderRadius: "11px",
              background: "#5367d9",
              color: "white",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontWeight: "600",
              fontSize: "15px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Analysing your business..."
              : "Ask BizAssist AI"}
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fff1f1",
              color: "#c24141",
              padding: "13px",
              borderRadius: "11px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* ANSWER */}

        {answer && (
          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <span
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "#eef0ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🤖
              </span>

              <h2
                style={{
                  margin: 0,
                  color: "#172033",
                }}
              >
                BizAssist Recommendation
              </h2>
            </div>

            <div
              style={{
                color: "#3f4858",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
            >
              {answer}
            </div>
          </section>
        )}

      </main>

      <nav className="bottom-nav">
        <button onClick={onBack}>
          <span>⌂</span>
          <span>Home</span>
        </button>

        <button onClick={onBack}>
          <span>👥</span>
          <span>Customers</span>
        </button>

        <button onClick={onBack}>
          <span>📋</span>
          <span>Orders</span>
        </button>

        <button onClick={onBack}>
          <span>💰</span>
          <span>Money</span>
        </button>
      </nav>

    </div>
  );
}

export default BusinessAdvisor;