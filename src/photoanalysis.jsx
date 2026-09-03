import React, { useState } from "react";

const PhotoAnalysis = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setError("");
  };

  const analyzePhoto = async () => {
    if (!selectedFile) {
      setError("Please select a photo first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(
        "http://localhost:5000/api/photo/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Invalid server response:", text);
        throw new Error(
          "Invalid response received from the server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Photo analysis failed. Please try again."
        );
      }

      console.log("PHOTO ANALYSIS RESPONSE:", data);

      let result = data.analysis;

      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch (parseError) {
          console.log("Analysis was not JSON:", result);

          result = {
            details: result,
          };
        }
      }

      if (!result || typeof result !== "object") {
        throw new Error("AI returned an invalid analysis.");
      }

      setAnalysis({
        product:
          result.product ||
          "Not clearly identified",

        quantity:
          result.quantity !== undefined &&
          result.quantity !== null
            ? result.quantity
            : 1,

        condition:
          result.condition ||
          "Not clearly identified",

        situation:
          result.situation ||
          `The image shows a ${
            result.product || "product"
          } that appears to be ${
            result.condition
              ? result.condition.toLowerCase()
              : "in need of inspection"
          }.`,

        issue:
          result.issue ||
          result.details ||
          "No specific issue could be clearly identified from the image.",

        solution:
          result.solution ||
          "Further inspection is recommended before taking corrective action.",

        model:
          data.model || "Gemini AI",
      });
    } catch (err) {
      console.error("PHOTO ANALYSIS ERROR:", err);

      setError(
        err.message ||
          "Something went wrong while analyzing the photo."
      );
    } finally {
      setLoading(false);
    }
  };

  const getConditionStyle = (condition) => {
    const value = condition?.toLowerCase() || "";

    if (
      value.includes("damage") ||
      value.includes("broken") ||
      value.includes("issue") ||
      value.includes("poor")
    ) {
      return {
        background: "#fff0f0",
        color: "#c24141",
      };
    }

    if (
      value.includes("good") ||
      value.includes("new") ||
      value.includes("normal")
    ) {
      return {
        background: "#e8f8ee",
        color: "#16803c",
      };
    }

    return {
      background: "#fff4df",
      color: "#a56a00",
    };
  };

  return (
    <>
      <div className="inner-header">
        <div className="inner-header-left">

          {onBack && (
            <button
              className="back-button"
              onClick={onBack}
              title="Back"
            >
              ←
            </button>
          )}

          <div className="header-page-icon">
            📷
          </div>

          <div>
            <h1>Photo Analysis</h1>
            <p>
              AI-powered visual inspection for your products
            </p>
          </div>

        </div>
      </div>

      <main className="photo-page-content">

        <div className="photo-upload-card">

          <div className="photo-large-icon">
            📷
          </div>

          <h2>Upload Product Photo</h2>

          <p>
            Upload a clear photo of the product or item.
            BizAssist will identify the product, condition,
            issue, and recommend a solution.
          </p>

          <label className="file-upload-label">
            📁 Choose Image

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          {selectedFile && (
            <div
              style={{
                marginTop: "-8px",
                marginBottom: "20px",
                color: "#687386",
                fontSize: "13px",
              }}
            >
              Selected:{" "}
              <strong style={{ color: "#202938" }}>
                {selectedFile.name}
              </strong>
            </div>
          )}

          {preview && (
            <img
              src={preview}
              alt="Selected product"
              className="photo-preview"
            />
          )}

          {selectedFile && (
            <button
              className="primary-button photo-analyze-button"
              onClick={analyzePhoto}
              disabled={loading}
            >
              {loading
                ? "Analyzing Photo with AI..."
                : "Analyze Photo with AI"}
            </button>
          )}

          {error && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 15px",
                borderRadius: "10px",
                background: "#fff0f0",
                border: "1px solid #f3caca",
                color: "#c24141",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

        </div>

        {analysis && (
          <div className="analysis-card">

            <div className="analysis-heading">

              <div>
                🤖
              </div>

              <div>
                <h2>AI Inspection</h2>

                <p>
                  Analysis generated using{" "}
                  {analysis.model}
                </p>
              </div>

              <div
                style={{
                  marginLeft: "auto",
                  padding: "7px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  ...getConditionStyle(
                    analysis.condition
                  ),
                }}
              >
                {analysis.condition}
              </div>

            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                marginTop: "18px",
              }}
            >

              <div className="detail-box">
                <span>PRODUCT</span>
                <strong>
                  {analysis.product}
                </strong>
              </div>

              <div className="detail-box">
                <span>QUANTITY VISIBLE</span>
                <strong>
                  {analysis.quantity}
                </strong>
              </div>

            </div>

            <div className="analysis-text">

              <strong
                style={{
                  display: "block",
                  color: "#202938",
                  fontSize: "15px",
                  marginBottom: "7px",
                }}
              >
                📋 Situation
              </strong>

              {analysis.situation}

            </div>

            <div
              className="analysis-text"
              style={{
                borderTop: "1px solid #edf0f5",
                marginTop: "5px",
                paddingTop: "18px",
              }}
            >

              <strong
                style={{
                  display: "block",
                  color: "#c24141",
                  fontSize: "15px",
                  marginBottom: "7px",
                }}
              >
                ⚠️ Issue Identified
              </strong>

              {analysis.issue}

            </div>

            <div
              className="analysis-text"
              style={{
                borderTop: "1px solid #edf0f5",
                marginTop: "5px",
                paddingTop: "18px",
              }}
            >

              <strong
                style={{
                  display: "block",
                  color: "#16803c",
                  fontSize: "15px",
                  marginBottom: "7px",
                }}
              >
                💡 Recommended Solution
              </strong>

              {analysis.solution}

            </div>

            <div
              style={{
                marginTop: "18px",
                paddingTop: "13px",
                borderTop: "1px solid #edf0f5",
                color: "#687386",
                fontSize: "11px",
                textAlign: "center",
              }}
            >
              ✨ AI-powered visual inspection by BizAssist
            </div>

          </div>
        )}

      </main>
    </>
  );
};

export default PhotoAnalysis;