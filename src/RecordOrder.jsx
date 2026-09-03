import { useEffect, useRef, useState } from "react";
import "./RecordOrder.css";

function RecordOrder({ onBack }) {
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  /* ============================================================
     DATE HELPERS
  ============================================================ */

  const todayDate = () => {
    const d = new Date();

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getDayName = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  /* ============================================================
     INITIAL ORDER
  ============================================================ */

  const [order, setOrder] = useState({
    customerName: "",
    product: "",
    quantity: 1,
    price: 0,
    deliveryDay: "",
    deliveryDate: "",
    orderDate: todayDate(),
  });

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  /* ============================================================
     NORMALIZE DAY
  ============================================================ */

  const normalizeDay = (value) => {
    if (!value) return "";

    const text = String(value).trim().toLowerCase();

    const days = {
      monday: "Monday",
      mon: "Monday",

      tuesday: "Tuesday",
      tue: "Tuesday",
      tues: "Tuesday",

      wednesday: "Wednesday",
      wed: "Wednesday",

      thursday: "Thursday",
      thu: "Thursday",
      thurs: "Thursday",

      friday: "Friday",
      fri: "Friday",

      saturday: "Saturday",
      sat: "Saturday",

      sunday: "Sunday",
      sun: "Sunday",

      somvar: "Monday",
      somvaar: "Monday",

      mangalvar: "Tuesday",
      mangalvaar: "Tuesday",

      budhvar: "Wednesday",
      budhvaar: "Wednesday",

      guruvaar: "Thursday",
      guruvar: "Thursday",

      shukravar: "Friday",
      shukravaar: "Friday",

      shanivar: "Saturday",
      shanivaar: "Saturday",

      ravivar: "Sunday",
      ravivaar: "Sunday",
    };

    return days[text] || "";
  };

  /* ============================================================
     GET NEXT WEEKDAY
  ============================================================ */

  const getNextWeekdayDate = (dayName) => {
    const days = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const normalized = normalizeDay(dayName);

    if (!normalized) return "";

    const today = getToday();

    const currentDay = today.getDay();
    const targetDay = days[normalized];

    let difference = targetDay - currentDay;

    /*
      IMPORTANT:
      If today is Wednesday and user says Wednesday,
      we interpret it as NEXT Wednesday.
    */

    if (difference <= 0) {
      difference += 7;
    }

    const result = new Date(today);

    result.setDate(
      result.getDate() + difference
    );

    return formatDate(result);
  };

  /* ============================================================
     RESOLVE DELIVERY
  ============================================================ */

  const resolveDelivery = (value) => {
    if (!value) {
      return {
        deliveryDay: "",
        deliveryDate: "",
      };
    }

    const original = String(value).trim();
    const lower = original.toLowerCase();

    const today = getToday();

    /* TODAY */

    if (
      lower === "today" ||
      lower === "aaj" ||
      original === "आज"
    ) {
      return {
        deliveryDay: getDayName(today),
        deliveryDate: formatDate(today),
      };
    }

    /* TOMORROW */

    if (
      lower === "tomorrow" ||
      lower === "kal" ||
      original === "कल"
    ) {
      const date = new Date(today);

      date.setDate(
        date.getDate() + 1
      );

      return {
        deliveryDay: getDayName(date),
        deliveryDate: formatDate(date),
      };
    }

    /* DAY AFTER TOMORROW */

    if (
      lower.includes("day after tomorrow") ||
      lower === "parso" ||
      original === "परसों"
    ) {
      const date = new Date(today);

      date.setDate(
        date.getDate() + 2
      );

      return {
        deliveryDay: getDayName(date),
        deliveryDate: formatDate(date),
      };
    }

    /* WEEKDAY */

    const normalizedDay =
      normalizeDay(original);

    if (normalizedDay) {
      return {
        deliveryDay: normalizedDay,
        deliveryDate:
          getNextWeekdayDate(
            normalizedDay
          ),
      };
    }

    return {
      deliveryDay: "",
      deliveryDate: "",
    };
  };

  /* ============================================================
     DELIVERY EXTRACTION
  ============================================================ */

  const extractDeliveryLocally = (sentence) => {
    const value = String(sentence || "").trim();

    if (!value) {
      return {
        deliveryDay: "",
        deliveryDate: "",
      };
    }

    const lower = value.toLowerCase();

    /* DAY AFTER TOMORROW FIRST */

    if (
      lower.includes(
        "day after tomorrow"
      ) ||
      lower.includes("parso") ||
      value.includes("परसों")
    ) {
      return resolveDelivery(
        "day after tomorrow"
      );
    }

    /* TODAY */

    if (
      /\btoday\b/i.test(value) ||
      /\baaj\b/i.test(value) ||
      value.includes("आज")
    ) {
      return resolveDelivery("today");
    }

    /* TOMORROW */

    if (
      /\btomorrow\b/i.test(value) ||
      /\bkal\b/i.test(value) ||
      value.includes("कल")
    ) {
      return resolveDelivery("tomorrow");
    }

    /* ENGLISH WEEKDAYS */

    const englishDay = value.match(
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i
    );

    if (englishDay) {
      return resolveDelivery(
        englishDay[1]
      );
    }

    /* HINGLISH WEEKDAYS */

    const hinglishDay = value.match(
      /\b(somvar|somvaar|mangalvar|mangalvaar|budhvar|budhvaar|guruvar|guruvaar|shukravar|shukravaar|shanivar|shanivaar|ravivar|ravivaar)\b/i
    );

    if (hinglishDay) {
      return resolveDelivery(
        hinglishDay[1]
      );
    }

    /* HINDI WEEKDAYS */

    const hindiDays = [
      ["सोमवार", "Monday"],
      ["मंगलवार", "Tuesday"],
      ["बुधवार", "Wednesday"],
      ["गुरुवार", "Thursday"],
      ["शुक्रवार", "Friday"],
      ["शनिवार", "Saturday"],
      ["रविवार", "Sunday"],
    ];

    for (const [hindi, english] of hindiDays) {
      if (value.includes(hindi)) {
        return resolveDelivery(
          english
        );
      }
    }

    return {
      deliveryDay: "",
      deliveryDate: "",
    };
  };

  /* ============================================================
     PRODUCT EXTRACTION
  ============================================================ */

  const extractProductLocally = (sentence) => {
    const value = String(sentence || "").trim();

    if (!value) return "";

    /* ==========================================================
       CAPACITY WATER TANK

       10000 litre water tank
       500 litre tank
       2 10000 litre water tanks
    ========================================================== */

    let match = value.match(
      /\b(?:\d+\s+)?(\d+(?:\.\d+)?)\s*(?:litre|litres|liter|liters|ltr|l)\s+(?:(water)\s+)?tanks?\b/i
    );

    if (match) {
      const capacity = match[1];
      const isWater = Boolean(match[2]);

      return `${capacity} litre ${
        isWater ? "water " : ""
      }tank`;
    }

    /* ==========================================================
       HINDI WATER TANK

       500 लीटर की पानी की टंकी
       1000 लीटर टैंक
    ========================================================== */

    match = value.match(
      /(\d+(?:\.\d+)?)\s*(?:लीटर|लीटर्स)\s*(?:का|की|के)?\s*(?:पानी\s+की\s+)?(?:टंकी|टैंक)/i
    );

    if (match) {
      const capacity = match[1];

      const isWater =
        value.includes("पानी");

      return `${capacity} litre ${
        isWater ? "water " : ""
      }tank`;
    }

    /* ==========================================================
       KNOWN PRODUCTS
    ========================================================== */

    const products = [
      "water tank",
      "tank",
      "saree",
      "sari",
      "shirt",
      "shirts",
      "pants",
      "pant",
      "dress",
      "kurta",
      "jacket",
      "shoes",
      "shoe",
      "bag",
      "bottle",
      "chair",
      "table",
      "machine",
      "pump",
      "motor",
      "pipe",
      "generator",
      "fan",
      "cooler",
      "filter",
      "printer",
      "laptop",
      "phone",
    ];

    const lower =
      value.toLowerCase();

    for (const product of products) {
      const index =
        lower.indexOf(product);

      if (index === -1) {
        continue;
      }

      let before =
        value.slice(0, index);

      /*
        Remove customer + action words.

        Rakesh wants a red silk saree
        becomes
        red silk saree
      */

      before =
        before.replace(
          /^.*?\b(wants?|want|needs?|need|requires?|require)\b/i,
          ""
        );

      before =
        before.replace(
          /^.*?\b(customer|client)\b/i,
          ""
        );

      before =
        before.replace(
          /\b(ko|ke liye)\b/gi,
          ""
        );

      before =
        before.replace(
          /^(a|an|the)\s+/i,
          ""
        );

      /*
        Remove physical quantity.

        2 red silk sarees
        becomes
        red silk saree
      */

      before =
        before.replace(
          /^\d+\s+/,
          ""
        );

      /*
        Remove capacity from descriptor.
      */

      before =
        before.replace(
          /\b\d+(?:\.\d+)?\s*(litre|litres|liter|liters|ltr|l|kg|kgs|kilogram|kilograms|meter|meters|metre|metres|cm|mm|inch|inches|feet|ft)\b/gi,
          ""
        );

      before =
        before.replace(
          /\b(for|on|at|price|cost|amount|worth)\s*$/i,
          ""
        );

      before =
        before.trim();

      let result =
        `${before} ${product}`.trim();

      result =
        result.replace(
          /\btanks\b/gi,
          "tank"
        );

      result =
        result.replace(
          /\bsarees\b/gi,
          "saree"
        );

      result =
        result.replace(
          /\bsaris\b/gi,
          "sari"
        );

      result =
        result.replace(
          /\bshirts\b/gi,
          "shirt"
        );

      return result.trim();
    }

    /* ==========================================================
       HINDI PRODUCTS
    ========================================================== */

    if (
      value.includes("टंकी") ||
      value.includes("टैंक")
    ) {
      return "tank";
    }

    if (
      value.includes("साड़ी")
    ) {
      return "saree";
    }

    if (
      value.includes("मोटर")
    ) {
      return "motor";
    }

    if (
      value.includes("पंप")
    ) {
      return "pump";
    }

    if (
      value.includes("पाइप")
    ) {
      return "pipe";
    }

    if (
      value.includes("मशीन")
    ) {
      return "machine";
    }

    return "";
  };

  /* ============================================================
     QUANTITY EXTRACTION
  ============================================================ */

  const extractQuantityLocally = (sentence) => {
    const value = String(sentence || "").trim();

    if (!value) return 1;

    /* quantity is 2 */

    let match = value.match(
      /\b(quantity|qty)\s*(is|=|:)?\s*(\d+)\b/i
    );

    if (match) {
      return Number(match[3]) || 1;
    }

    /* 2 pieces */

    match = value.match(
      /\b(\d+)\s*(pieces?|pcs?|units?|items?)\b/i
    );

    if (match) {
      return Number(match[1]) || 1;
    }

    /*
      2 10000 litre water tanks

      First number = physical quantity.
      Second number = capacity.
    */

    match = value.match(
      /\b(\d+)\s+\d+(?:\.\d+)?\s*(litre|litres|liter|liters|ltr|l|kg|kgs|kilogram|kilograms|meter|meters|metre|metres|cm|mm|inch|inches|feet|ft)\b/i
    );

    if (match) {
      return Number(match[1]) || 1;
    }

    /* 2 tanks */

    match = value.match(
      /\b(\d+)\s+(water\s+)?(tanks?|sarees?|saris?|shirts?|pants?|dresses?|kurtas?|bags?|bottles?|chairs?|tables?|machines?|pumps?|motors?|pipes?|fans?|coolers?|filters?)\b/i
    );

    if (match) {
      return Number(match[1]) || 1;
    }

    /* ==========================================================
       HINDI NUMBERS
    ========================================================== */

    const hindiNumbers = {
      "एक": 1,
      "दो": 2,
      "तीन": 3,
      "चार": 4,
      "पांच": 5,
      "पाँच": 5,
      "छह": 6,
      "सात": 7,
      "आठ": 8,
      "नौ": 9,
      "दस": 10,
    };

    const hindiProducts =
      "टैंक|टंकी|मशीन|पंप|मोटर|पाइप|कुर्सी|मेज|बोतल|साड़ी";

    for (
      const [word, number] of Object.entries(
        hindiNumbers
      )
    ) {
      const regex =
        new RegExp(
          `${word}\\s+(?:${hindiProducts})`
        );

      if (regex.test(value)) {
        return number;
      }
    }

    /* ==========================================================
       HINGLISH NUMBERS
    ========================================================== */

    const hinglishNumbers = {
      ek: 1,
      do: 2,
      teen: 3,
      char: 4,
      chaar: 4,
      paanch: 5,
      cheh: 6,
      saat: 7,
      aath: 8,
      nau: 9,
      das: 10,
    };

    for (
      const [word, number] of Object.entries(
        hinglishNumbers
      )
    ) {
      const regex =
        new RegExp(
          `\\b${word}\\s+(?:tanks?|sarees?|saris?|shirts?|machines?|pumps?|motors?|pipes?|chairs?|tables?)\\b`,
          "i"
        );

      if (regex.test(value)) {
        return number;
      }
    }

    return 1;
  };

  /* ============================================================
     PRICE EXTRACTION
  ============================================================ */

  const extractPriceLocally = (sentence) => {
    const value =
      String(sentence || "").trim();

    const patterns = [
      /(?:for|price|cost|amount|worth)\s*(?:₹|rs\.?|rupees?|rupaye)?\s*([\d,]+(?:\.\d+)?)/i,

      /(?:₹|rs\.?|rupees?|rupaye)\s*([\d,]+(?:\.\d+)?)/i,

      /\b([\d,]+(?:\.\d+)?)\s*(?:rupees?|rupaye|rs)\b/i,

      /\b(\d+(?:\.\d+)?)\s*(?:thousand|k|hazaar|hazar)\b/i,
    ];

    for (const pattern of patterns) {
      const match =
        value.match(pattern);

      if (!match) continue;

      let price =
        Number(
          String(match[1]).replace(
            /,/g,
            ""
          )
        );

      if (
        /thousand|k|hazaar|hazar/i.test(
          match[0]
        )
      ) {
        price *= 1000;
      }

      if (
        Number.isFinite(price)
      ) {
        return price;
      }
    }

    return 0;
  };

  /* ============================================================
     CUSTOMER EXTRACTION
  ============================================================ */

  const extractCustomerLocally = (sentence) => {
    const value =
      String(sentence || "").trim();

    const patterns = [
      /\b([a-zA-Z]+)\s+(wants?|want|needs?|need|requires?|require)\b/i,

      /\b([a-zA-Z]+)\s+ko\b/i,

      /\b([a-zA-Z]+)\s+ke\s+liye\b/i,

      /\b(customer|client)\s+(is|name is)?\s*([a-zA-Z]+)/i,

      /\b(name|naam)\s+(is|hai)?\s*([a-zA-Z]+)/i,
    ];

    for (const pattern of patterns) {
      const match =
        value.match(pattern);

      if (!match) continue;

      /*
        First two patterns have name at index 1.
        Customer/name patterns have name at index 3.
      */

      const name =
        match[3] || match[1];

      if (!name) continue;

      return (
        name.charAt(0).toUpperCase() +
        name.slice(1).toLowerCase()
      );
    }

    /* Hindi name ko */

    const hindi =
      value.match(
        /^([\u0900-\u097F]+)\s+(?:को|के लिए)/
      );

    if (hindi) {
      return hindi[1];
    }

    return "";
  };

  /* ============================================================
     START RECORDING
  ============================================================ */

  const startRecording = (selectedLanguage) => {
    setError("");
    setText("");
    setShowForm(false);
    setSaved(false);

    finalTranscriptRef.current = "";

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    setLanguage(
      selectedLanguage
    );

    const recognition =
      new SpeechRecognition();

    /*
      IMPORTANT:
      English button = en-IN
      Hindi button = hi-IN
    */

    recognition.lang =
      selectedLanguage;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current =
      recognition;

    recognition.onstart = () => {
      setRecording(true);
      setError("");

      console.log(
        "RECORDING STARTED:"
      );

      console.log(
        "LANGUAGE:",
        selectedLanguage
      );
    };

    recognition.onresult = (
      event
    ) => {
      let interim = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (
          event.results[i].isFinal
        ) {
          finalTranscriptRef.current +=
            transcript + " ";
        } else {
          interim += transcript;
        }
      }

      const completeText =
        (
          finalTranscriptRef.current +
          interim
        ).trim();

      setText(
        completeText
      );

      console.log(
        "WHAT CHROME HEARD:",
        completeText
      );
    };

    recognition.onerror = (
      event
    ) => {
      console.error(
        "VOICE ERROR:",
        event.error
      );

      if (
        event.error ===
        "not-allowed"
      ) {
        setError(
          "Microphone permission denied. Please allow microphone access in Chrome."
        );
      } else if (
        event.error ===
        "network"
      ) {
        setError(
          "Internet connection is required for speech recognition."
        );
      } else if (
        event.error ===
        "no-speech"
      ) {
        setError(
          "No speech detected. Please speak clearly and try again."
        );
      } else if (
        event.error !==
        "aborted"
      ) {
        setError(
          "Voice recognition failed. Please try again."
        );
      }

      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);

      console.log(
        "RECORDING ENDED"
      );

      recognitionRef.current =
        null;
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "START ERROR:",
        error
      );

      setRecording(false);

      setError(
        "Could not start voice recording. Please try again."
      );
    }
  };

  /* ============================================================
     STOP RECORDING
  ============================================================ */

  const stopRecording = () => {
    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setRecording(false);
  };

  /* ============================================================
     EXTRACT ORDER
  ============================================================ */

  const extractOrder = async () => {
    if (!text.trim()) {
      setError(
        "Please record an order first."
      );
      return;
    }

    try {
      setExtracting(true);
      setError("");

      const transcript =
        text.trim();

      console.log(
        "========================================"
      );

      console.log(
        "SENDING TEXT TO SERVER:"
      );

      console.log(
        transcript
      );

      console.log(
        "========================================"
      );

      const response =
        await fetch(
          "http://localhost:5000/api/orders/extract",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              voiceText:
                transcript,
            }),
          }
        );

      const responseText =
        await response.text();

      console.log(
        "SERVER STATUS:",
        response.status
      );

      console.log(
        "SERVER RESPONSE:",
        responseText
      );

      let data;

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Server returned invalid JSON."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Extraction failed."
        );
      }

      const serverOrder =
        data.order || {};

      /* ========================================================
         LOCAL EXTRACTION
      ======================================================== */

      const localProduct =
        extractProductLocally(
          transcript
        );

      const localQuantity =
        extractQuantityLocally(
          transcript
        );

      const localPrice =
        extractPriceLocally(
          transcript
        );

      const localCustomer =
        extractCustomerLocally(
          transcript
        );

      const localDelivery =
        extractDeliveryLocally(
          transcript
        );

      /* ========================================================
         FINAL VALUES
      ======================================================== */

      const finalCustomer =
        localCustomer ||
        serverOrder.customerName ||
        "Unknown Customer";

      const finalProduct =
        localProduct ||
        serverOrder.product ||
        "Unknown product";

      const finalQuantity =
        localQuantity > 0
          ? localQuantity
          : Number(
              serverOrder.quantity
            ) || 1;

      const finalPrice =
        localPrice > 0
          ? localPrice
          : Number(
              serverOrder.price
            ) || 0;

      const finalDeliveryDay =
        localDelivery.deliveryDay ||
        serverOrder.deliveryDay ||
        "";

      const finalDeliveryDate =
        localDelivery.deliveryDate ||
        serverOrder.deliveryDate ||
        "";

      const finalOrderDate =
        serverOrder.orderDate ||
        todayDate();

      const finalOrder = {
        customerName:
          finalCustomer,

        product:
          finalProduct,

        quantity:
          finalQuantity,

        price:
          finalPrice,

        deliveryDay:
          finalDeliveryDay,

        deliveryDate:
          finalDeliveryDate,

        orderDate:
          finalOrderDate,
      };

      console.log(
        "========================================"
      );

      console.log(
        "FINAL FRONTEND ORDER:"
      );

      console.log(
        finalOrder
      );

      console.log(
        "========================================"
      );

      setOrder(
        finalOrder
      );

      setShowForm(true);
    } catch (error) {
      console.error(
        "EXTRACTION ERROR:",
        error
      );

      setError(
        error.message ||
          "Could not extract order details."
      );
    } finally {
      setExtracting(false);
    }
  };

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setOrder(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /* ============================================================
     SAVE ORDER
  ============================================================ */

  const saveOrder = async () => {
    if (
      !order.customerName.trim()
    ) {
      setError(
        "Please enter customer name."
      );
      return;
    }

    if (
      !order.product.trim()
    ) {
      setError(
        "Please enter product."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch(
          "http://localhost:5000/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customerName:
                order.customerName.trim(),

              product:
                order.product.trim(),

              quantity:
                Number(
                  order.quantity
                ) || 1,

              price:
                Number(
                  order.price
                ) || 0,

              deliveryDay:
                order.deliveryDay ||
                "",

              deliveryDate:
                order.deliveryDate ||
                "",

              orderDate:
                order.orderDate ||
                todayDate(),

              originalVoiceText:
                text.trim(),

              status:
                "Pending",

              amountPaid:
                0,

              paymentStatus:
                "Pending",
            }),
          }
        );

      const responseText =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Server returned invalid JSON."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save order."
        );
      }

      console.log(
        "ORDER SAVED:",
        data
      );

      setSaved(true);
    } catch (error) {
      console.error(
        "SAVE ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to save order."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     RESET
  ============================================================ */

  const resetOrder = () => {
    setText("");
    setError("");
    setShowForm(false);
    setSaved(false);

    setOrder({
      customerName: "",
      product: "",
      quantity: 1,
      price: 0,
      deliveryDay: "",
      deliveryDate: "",
      orderDate: todayDate(),
    });

    finalTranscriptRef.current =
      "";
  };

  /* ============================================================
     SUCCESS SCREEN
  ============================================================ */

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

          <h1>
            Order Saved!
          </h1>

          <p
            style={{
              color: "#687386",
            }}
          >
            Order successfully added
            to BizAssist.
          </p>

          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f7f8fc",
              borderRadius: "15px",
              textAlign: "left",
            }}
          >
            <p>
              <strong>
                Customer:
              </strong>{" "}
              {order.customerName}
            </p>

            <p>
              <strong>
                Product:
              </strong>{" "}
              {order.product}
            </p>

            <p>
              <strong>
                Quantity:
              </strong>{" "}
              {order.quantity}
            </p>

            <p>
              <strong>
                Price:
              </strong>{" "}
              ₹
              {Number(
                order.price
              ).toLocaleString(
                "en-IN"
              )}
            </p>

            <p>
              <strong>
                Order Date:
              </strong>{" "}
              {order.orderDate}
            </p>

            <p>
              <strong>
                Delivery Day:
              </strong>{" "}
              {order.deliveryDay ||
                "Not specified"}
            </p>

            <p>
              <strong>
                Delivery Date:
              </strong>{" "}
              {order.deliveryDate ||
                "Not specified"}
            </p>
          </div>

          <button
            className="save-button"
            onClick={resetOrder}
            style={{
              marginTop: "20px",
            }}
          >
            Record Another Order
          </button>

          <button
            className="record-button"
            onClick={onBack}
            style={{
              marginTop: "10px",
            }}
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
  ============================================================ */

  return (
    <div className="record-page">
      <header className="record-header">
        <button
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <p>New Order</p>

          <h1>
            Record Order
          </h1>
        </div>
      </header>

      <main className="record-content">
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
                {language ===
                "hi-IN"
                  ? "🇮🇳"
                  : "🇬🇧"}
              </div>

              <h2>
                {recording
                  ? language ===
                    "hi-IN"
                    ? "सुन रहा हूँ..."
                    : "Listening..."
                  : "Tell me the order"}
              </h2>

              <p>
                Speak naturally in
                English or Hindi.
              </p>

              {/* ==================================================
                  LANGUAGE BUTTONS
              ================================================== */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent:
                    "center",
                  marginTop: "20px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    startRecording(
                      "en-IN"
                    )
                  }
                  disabled={
                    recording
                  }
                  style={{
                    padding:
                      "12px 20px",
                    borderRadius:
                      "12px",
                    border:
                      language ===
                      "en-IN"
                        ? "2px solid #4f46e5"
                        : "1px solid #ddd",
                    background:
                      language ===
                      "en-IN"
                        ? "#eef2ff"
                        : "white",
                    cursor:
                      recording
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      "600",
                    fontSize:
                      "15px",
                  }}
                >
                  🇬🇧 English
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startRecording(
                      "hi-IN"
                    )
                  }
                  disabled={
                    recording
                  }
                  style={{
                    padding:
                      "12px 20px",
                    borderRadius:
                      "12px",
                    border:
                      language ===
                      "hi-IN"
                        ? "2px solid #4f46e5"
                        : "1px solid #ddd",
                    background:
                      language ===
                      "hi-IN"
                        ? "#eef2ff"
                        : "white",
                    cursor:
                      recording
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      "600",
                    fontSize:
                      "15px",
                  }}
                >
                  🇮🇳 हिंदी
                </button>
              </div>

              {/* ==================================================
                  RECORD BUTTON
              ================================================== */}

              {!recording ? (
                <button
                  className="record-button"
                  onClick={() =>
                    startRecording(
                      language
                    )
                  }
                >
                  🎙️{" "}
                  {language ===
                  "hi-IN"
                    ? "Hindi mein Boliye"
                    : "Speak in English"}
                </button>
              ) : (
                <button
                  className="record-button active"
                  onClick={
                    stopRecording
                  }
                >
                  🛑 Done Speaking
                </button>
              )}

              {/* ==================================================
                  EXAMPLES
              ================================================== */}

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background:
                    "#f7f8fc",
                  borderRadius:
                    "12px",
                  textAlign:
                    "left",
                }}
              >
                <p
                  style={{
                    fontSize:
                      "13px",
                    color:
                      "#687386",
                    margin:
                      "0 0 8px",
                  }}
                >
                  🇬🇧 English example:
                </p>

                <p
                  style={{
                    fontSize:
                      "13px",
                    margin:
                      "0 0 15px",
                  }}
                >
                  <strong>
                    Rakesh wants 2
                    10000 litre water
                    tanks on Wednesday
                    for Rs 40000.
                  </strong>
                </p>

                <p
                  style={{
                    fontSize:
                      "13px",
                    color:
                      "#687386",
                    margin:
                      "0 0 8px",
                  }}
                >
                  🇮🇳 Hindi example:
                </p>

                <p
                  style={{
                    fontSize:
                      "13px",
                    margin: 0,
                  }}
                >
                  <strong>
                    राकेश को 2 10000
                    लीटर पानी की टंकी
                    बुधवार को चाहिए,
                    40000 रुपये में।
                  </strong>
                </p>
              </div>

              {error && (
                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "12px",
                    background:
                      "#fff1f1",
                    color:
                      "#c24141",
                    borderRadius:
                      "10px",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* ====================================================
                TRANSCRIPT
            ==================================================== */}

            {text && (
              <div className="transcript-card">
                <div className="card-title">
                  <h2>
                    What I heard
                  </h2>

                  <span>
                    ✓
                  </span>
                </div>

                <p>
                  {text}
                </p>

                <button
                  className="save-button"
                  onClick={
                    extractOrder
                  }
                  disabled={
                    extracting
                  }
                >
                  {extracting
                    ? "✨ Extracting..."
                    : "✨ Extract Order Details"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            EXTRACTED FORM
        ======================================================== */}

        {showForm && (
          <div className="transcript-card">
            <div className="card-title">
              <h2>
                Extracted Order
              </h2>

              <span>
                ✨
              </span>
            </div>

            <div className="form-group">
              <label>
                Customer Name
              </label>

              <input
                type="text"
                name="customerName"
                value={
                  order.customerName
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Product / Service
              </label>

              <input
                type="text"
                name="product"
                value={
                  order.product
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                value={
                  order.quantity
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Price per Unit
              </label>

              <input
                type="number"
                name="price"
                min="0"
                value={
                  order.price
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Order Date
              </label>

              <input
                type="text"
                name="orderDate"
                value={
                  order.orderDate
                }
                readOnly
              />
            </div>

            <div className="form-group">
              <label>
                Delivery Day
              </label>

              <input
                type="text"
                name="deliveryDay"
                value={
                  order.deliveryDay
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Delivery Date
              </label>

              <input
                type="text"
                name="deliveryDate"
                value={
                  order.deliveryDate
                }
                onChange={
                  handleChange
                }
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="save-button"
              onClick={
                saveOrder
              }
              disabled={
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Save Order"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(
                  false
                );

                setError("");
              }}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "12px",
                border:
                  "1px solid #ddd",
                borderRadius:
                  "10px",
                background:
                  "white",
                cursor:
                  "pointer",
              }}
            >
              ← Record Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default RecordOrder;