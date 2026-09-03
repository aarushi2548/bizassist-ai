import { useState, useRef } from "react";
import "./AskBizAssist.css";

function AskBizAssist({ onBack }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef(null);

  // ================================
  // START VOICE INPUT
  // ================================

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported. Please use Google Chrome."
      );
      return;
    }

    if (listening) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log("Voice listening started");

      setListening(true);
      setAnswer("");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      console.log(
        "Voice question:",
        transcript
      );

      setQuestion(transcript);
      setListening(false);

      askBizAssist(transcript);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);

      if (event.error === "not-allowed") {
        alert(
          "Microphone permission denied. Please allow microphone access."
        );
      }

      if (event.error === "no-speech") {
        alert(
          "I could not hear anything. Please try again."
        );
      }
    };

    recognition.onend = () => {
      console.log("Voice listening ended");

      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Voice start error:",
        error
      );

      setListening(false);
    }
  };

  // ================================
  // STOP LISTENING
  // ================================

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);
  };

  // ================================
  // ASK BIZASSIST
  // ================================

  const askBizAssist = async (
    questionText = question
  ) => {
    if (
      !questionText ||
      !String(questionText).trim()
    ) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const cleanQuestion =
        String(questionText).trim();

      console.log(
        "Sending question:",
        cleanQuestion
      );

      const response = await fetch(
        "http://localhost:5000/api/assistant/ask",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: cleanQuestion,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "AI response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to get AI answer."
        );
      }

      setAnswer(
        data.answer ||
          "No answer received."
      );

    } catch (error) {
      console.error(
        "ASK BIZASSIST ERROR:",
        error
      );

      setAnswer(
        "Sorry, I could not answer that right now. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ================================
  // EXAMPLE QUESTIONS
  // ================================

  const useExample = (text) => {
    setQuestion(text);
    setAnswer("");

    askBizAssist(text);
  };

  // ================================
  // SPEAK ANSWER
  // ================================

  const speakAnswer = () => {
    if (!answer) return;

    if (!window.speechSynthesis) {
      alert(
        "Voice output is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(answer);

    speech.lang = "hi-IN";
    speech.rate = 0.95;
    speech.pitch = 1;

    speech.onstart = () => {
      setSpeaking(true);
    };

    speech.onend = () => {
      setSpeaking(false);
    };

    speech.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };

  // ================================
  // STOP SPEAKING
  // ================================

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  };

  // ================================
  // BACK
  // ================================

  const handleBack = () => {
    stopListening();
    stopSpeaking();

    if (onBack) {
      onBack();
    }
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="ask-page">

      {/* HEADER */}

      <div className="ask-header">

        <button
          className="back-button"
          onClick={handleBack}
        >
          ←
        </button>

        <div>
          <h1>
            Ask BizAssist AI
          </h1>

          <p>
            Ask anything about your business
          </p>
        </div>

      </div>

      <main className="ask-content">

        {/* INTRO */}

        <div className="ask-intro">

          <div className="ai-icon">
            🤖
          </div>

          <h2>
            How can I help?
          </h2>

          <p>
            Ask about orders, customers,
            payments or deliveries.
          </p>

        </div>

        {/* VOICE SECTION */}

        <div className="voice-section">

          <button
            className={`mic-button ${
              listening
                ? "listening"
                : ""
            }`}
            onClick={
              listening
                ? stopListening
                : startListening
            }
          >
            {listening
              ? "⏹️"
              : "🎙️"}
          </button>

          <strong>
            {listening
              ? "Listening..."
              : "Tap to speak"}
          </strong>

          <span>
            English • Hindi • Hinglish
          </span>

        </div>

        {/* QUESTION */}

        {question && (
          <div className="question-card">

            <div className="card-label">
              🗣️ You asked
            </div>

            <p>
              {question}
            </p>

          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="answer-card loading-card">

            <div className="card-label">
              🤖 BizAssist AI
            </div>

            <div className="loading-dots">
              Thinking...
            </div>

          </div>
        )}

        {/* ANSWER */}

        {answer && !loading && (
          <div className="answer-card">

            <div className="answer-top">

              <div className="card-label">
                🤖 BizAssist AI
              </div>

              <button
                className="speak-button"
                onClick={
                  speaking
                    ? stopSpeaking
                    : speakAnswer
                }
              >
                {speaking
                  ? "⏹ Stop"
                  : "🔊 Listen"}
              </button>

            </div>

            <p className="answer-text">
              {answer}
            </p>

          </div>
        )}

        {/* EXAMPLES */}

        <div className="example-section">

          <h3>
            Try asking
          </h3>

          <button
            onClick={() =>
              useExample(
                "Rahul ka payment kitna pending hai?"
              )
            }
          >
            💰 Rahul ka payment kitna pending hai?
          </button>

          <button
            onClick={() =>
              useExample(
                "Mere kitne orders hain?"
              )
            }
          >
            📦 Mere kitne orders hain?
          </button>

          <button
            onClick={() =>
              useExample(
                "Kal kitne orders ki delivery hai?"
              )
            }
          >
            🚚 Kal kitne orders ki delivery hai?
          </button>

          <button
            onClick={() =>
              useExample(
                "Who owes me the most money?"
              )
            }
          >
            💵 Who owes me the most money?
          </button>

        </div>

        {/* ASK BUTTON */}

        <button
          className="ask-text-button"
          onClick={() =>
            askBizAssist()
          }
          disabled={
            loading ||
            !question.trim()
          }
        >
          {loading
            ? "Asking BizAssist..."
            : "Ask BizAssist →"}
        </button>

      </main>

    </div>
  );
}

export default AskBizAssist;