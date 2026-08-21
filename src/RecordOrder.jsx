import { useState } from "react";
import "./RecordOrder.css";

function RecordOrder({ onBack }) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

  const [order, setOrder] = useState({
    customerName: "",
    product: "",
    quantity: 1,
    price: 0,
    deliveryDate: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // VOICE RECORDING
  const startRecording = () => {
  setError("");

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setError(
      "Voice recognition is not supported. Please use Google Chrome."
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";

  recognition.onstart = () => {
    setRecording(true);
    setText("");
    setSaved(false);
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const transcript =
        event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    setText(
      (finalTranscript + interimTranscript).trim()
    );
  };

  recognition.onerror = (event) => {
    console.error(
      "Speech recognition error:",
      event.error
    );

    if (event.error === "not-allowed") {
      setError(
        "Please allow microphone access in Chrome."
      );
      setRecording(false);
    } else if (event.error === "no-speech") {
      // Don't immediately stop for silence.
      console.log("No speech detected.");
    } else if (event.error !== "aborted") {
      setError(
        "Voice recognition failed. Please try again."
      );
      setRecording(false);
    }
  };

  recognition.onend = () => {
    /*
      Chrome can automatically end continuous
      recognition. Restart it while the user
      still wants to record.
    */

    if (recording) {
      try {
        recognition.start();
      } catch (error) {
        console.log("Recognition restart:", error);
      }
    }
  };

  recognition.start();

  // Store recognition so we can stop it later.
  window.currentRecognition = recognition;
};
     

  // SEND VOICE TEXT TO AI
  const extractOrder = async () => {
    try {
      setExtracting(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voiceText: text,
          }),
        }
      );

      const responseText = await response.text();

      console.log(
        "Backend status:",
        response.status
      );

      console.log(
        "Backend response:",
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Backend error ${response.status}: ${responseText}`
        );
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Backend returned something that is not JSON: " +
            responseText.substring(0, 200)
        );
      }

      console.log("AI extracted order:", data);

      setOrder({
        customerName:
          data.order.customerName || "",

        product:
          data.order.product || "",

        quantity:
          data.order.quantity || 1,

        price:
          data.order.price || 0,

        deliveryDate:
          data.order.deliveryDate || "",
      });

      setShowForm(true);
      setExtracting(false);
    } catch (error) {
      console.error(
        "Extraction error:",
        error
      );

      setError(error.message);
      setExtracting(false);
    }
  };

  // HANDLE FORM CHANGES
  const handleChange = (e) => {
    setOrder({
      ...order,
      [e.target.name]: e.target.value,
    });
  };

  // SAVE ORDER TO MONGODB
  const saveOrder = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...order,
            quantity: Number(order.quantity),
            price: Number(order.price),
            originalVoiceText: text,
          }),
        }
      );

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Server returned invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save order"
        );
      }

      console.log(
        "Order saved:",
        data
      );

      setSaved(true);
      setSaving(false);
    } catch (error) {
      console.error(
        "Save error:",
        error
      );

      setError(error.message);
      setSaving(false);
    }
  };

  // SUCCESS SCREEN
  if (saved) {
    return (
      <div className="record-page">
        <div
          style={{
            maxWidth: "600px",
            margin: "100px auto",
            padding: "25px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "60px",
            }}
          >
            ✅
          </div>

          <h1
            style={{
              marginTop: "20px",
            }}
          >
            Order Saved!
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#687386",
            }}
          >
            The order has been successfully
            added to BizAssist.
          </p>

         <button
  className={`record-button ${
    recording ? "active" : ""
  }`}
  onClick={() => {
    if (recording && window.currentRecognition) {
      window.currentRecognition.stop();
      setRecording(false);
    } else {
      startRecording();
    }
  }}
>
  {recording
    ? "🛑 Done Speaking"
    : "🎙️ Tap to Speak"}
</button>
        </div>
      </div>
    );
  }

  return (
    <div className="record-page">

      {/* HEADER */}

      <header className="record-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <p>New Order</p>
          <h1>Record Order</h1>
        </div>

      </header>

      <main className="record-content">

        {/* VOICE SCREEN */}

        {!showForm && (
          <>
            <div className="voice-card">

              <div
                className={`mic-circle ${
                  recording
                    ? "recording"
                    : ""
                }`}
              >
                🎙️
              </div>

              <h2>
                {recording
                  ? "Listening..."
                  : "Tell me the order"}
              </h2>

              <p>
                Speak naturally. For example:
                <br />

                <strong>
                  "Rakesh wants two 500 litre
                  tanks for Friday at 8500 each."
                </strong>
              </p>

             {!recording ? (
  <button
    className="record-button"
    onClick={startRecording}
  >
    🎙️ Tap to Speak
  </button>
) : (
  <button
    className="record-button active"
    onClick={() => {
      if (window.currentRecognition) {
        window.currentRecognition.stop();
        window.currentRecognition = null;
      }

      setRecording(false);
    }}
  >
    🛑 Done Speaking
  </button>
)}

              {error && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    background: "#fff1f1",
                    color: "#c24141",
                    borderRadius: "10px",
                    fontSize: "14px",
                    textAlign: "left",
                  }}
                >
                  {error}
                </div>
              )}

            </div>

            {/* TRANSCRIPT */}

            {text && (
              <div className="transcript-card">

                <div className="card-title">
                  <h2>What I heard</h2>
                  <span>✓</span>
                </div>

                <p>{text}</p>

                <button
                  className="save-button"
                  onClick={extractOrder}
                  disabled={extracting}
                >
                  {extracting
                    ? "✨ AI is understanding..."
                    : "✨ Extract Order Details"}
                </button>

              </div>
            )}
          </>
        )}

        {/* AI EXTRACTED FORM */}

        {showForm && (
          <div className="transcript-card">

            <div className="card-title">

              <h2>
                AI Extracted Order
              </h2>

              <span>✨</span>

            </div>

            <p
              style={{
                marginBottom: "20px",
                color: "#687386",
                fontSize: "13px",
              }}
            >
              BizAssist extracted these
              details from your voice.
              Check them before saving.
            </p>

            <div className="form-group">

              <label>
                Customer Name
              </label>

              <input
                type="text"
                name="customerName"
                value={order.customerName}
                onChange={handleChange}
                placeholder="Customer name"
              />

            </div>

            <div className="form-group">

              <label>
                Product / Service
              </label>

              <input
                type="text"
                name="product"
                value={order.product}
                onChange={handleChange}
                placeholder="Product or service"
              />

            </div>

            <div className="form-group">

              <label>
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                value={order.quantity}
                onChange={handleChange}
                min="1"
              />

            </div>

            <div className="form-group">

              <label>
                Price per Unit
              </label>

              <input
                type="number"
                name="price"
                value={order.price}
                onChange={handleChange}
                min="0"
              />

            </div>

            <div className="form-group">

              <label>
                Delivery Date
              </label>

              <input
                type="text"
                name="deliveryDate"
                value={order.deliveryDate}
                onChange={handleChange}
                placeholder="e.g. Friday"
              />

            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="save-button"
              onClick={saveOrder}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Order"}
            </button>

          </div>
        )}

      </main>
    </div>
  );
}

export default RecordOrder;