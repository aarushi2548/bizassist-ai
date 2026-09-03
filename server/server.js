const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());

console.log("========================================");
console.log("BIZASSIST AI BACKEND");
console.log("========================================");

console.log(
  "GEMINI API KEY LOADED:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

console.log(
  "MONGO URI LOADED:",
  process.env.MONGO_URI ? "YES" : "NO"
);

/* ============================================================
   GEMINI
============================================================ */

let gemini = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

/* ============================================================
   MULTER
============================================================ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* ============================================================
   REQUEST LOGGER
============================================================ */

app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

/* ============================================================
   DATE HELPERS
============================================================ */

function pad(number) {
  return String(number).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function getToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDayName(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

/* ============================================================
   DAY NORMALIZATION
============================================================ */

function normalizeDay(value) {
  if (!value) return "";

  const text = String(value)
    .trim()
    .toLowerCase();

  const map = {
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

    somvaar: "Monday",
    somvar: "Monday",

    mangalvaar: "Tuesday",
    mangalvar: "Tuesday",

    budhvaar: "Wednesday",
    budhvar: "Wednesday",

    guruvaar: "Thursday",
    guruvar: "Thursday",

    shukravaar: "Friday",
    shukravar: "Friday",

    shanivaar: "Saturday",
    shanivar: "Saturday",

    ravivaar: "Sunday",
    ravivar: "Sunday",
  };

  return map[text] || "";
}

/* ============================================================
   NEXT WEEKDAY
============================================================ */

function getDateForDay(dayName) {
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

  // Always choose NEXT occurrence
  if (difference <= 0) {
    difference += 7;
  }

  const result = new Date(today);

  result.setDate(
    result.getDate() + difference
  );

  return formatDate(result);
}

/* ============================================================
   DELIVERY DATE
============================================================ */

function resolveDeliveryDate(value) {
  if (!value) {
    return {
      deliveryDay: "",
      deliveryDate: "",
    };
  }

  const original = String(value).trim();
  const lower = original.toLowerCase();
  const today = getToday();

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

  const normalizedDay =
    normalizeDay(original);

  if (normalizedDay) {
    return {
      deliveryDay: normalizedDay,
      deliveryDate:
        getDateForDay(normalizedDay),
    };
  }

  return {
    deliveryDay: original,
    deliveryDate: "",
  };
}

/* ============================================================
   GEMINI JSON PARSER
============================================================ */

function parseGeminiJSON(text) {
  if (!text) {
    throw new Error(
      "Gemini returned empty response."
    );
  }

  let cleaned = String(text)
    .trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Continue to fallback extraction
  }

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1
  ) {
    const jsonText =
      cleaned.substring(
        firstBrace,
        lastBrace + 1
      );

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      // Continue
    }
  }

  throw new Error(
    "Gemini returned invalid JSON."
  );
}

/* ============================================================
   CUSTOMER EXTRACTION
============================================================ */

function extractCustomer(transcript) {
  const text = String(
    transcript || ""
  ).trim();

  if (!text) return "";

  const patterns = [
    // Rakesh wants...
    /\b([a-zA-Z][a-zA-Z0-9]*)\s+(?:wants?|want|needs?|need|requires?|require)\b/i,

    // Rakesh ko...
    /\b([a-zA-Z][a-zA-Z0-9]*)\s+ko\b/i,

    // Rakesh ke liye...
    /\b([a-zA-Z][a-zA-Z0-9]*)\s+ke\s+liye\b/i,

    // customer Rakesh
    /\b(?:customer|client)\s+(?:is\s+|name\s+is\s+)?([a-zA-Z][a-zA-Z0-9]*)/i,

    // name is Rakesh
    /\b(?:name|naam)\s+(?:is|hai)?\s*([a-zA-Z][a-zA-Z0-9]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return (
        match[1].charAt(0).toUpperCase() +
        match[1].slice(1).toLowerCase()
      );
    }
  }

  return "";
}

/* ============================================================
   EXPLICIT QUANTITY EXTRACTION
   This detects ONLY when a quantity is actually spoken.
============================================================ */

function extractQuantityExplicitly(transcript) {
  const text = String(
    transcript || ""
  ).trim();

  if (!text) {
    return null;
  }

  /*
    quantity 2
    quantity is 2
    quantity: 2
    qty 2
  */

  let match = text.match(
    /\b(?:quantity|qty)\s*(?:is|=|:)?\s*(\d+)\b/i
  );

  if (match) {
    const quantity = Number(match[1]);

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    2 pieces
    3 pcs
    4 units
    5 items
  */

  match = text.match(
    /\b(\d+)\s*(?:pieces?|pcs?|units?|items?)\b/i
  );

  if (match) {
    const quantity = Number(match[1]);

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    IMPORTANT:

    2 10000 litre water tanks

    2     = quantity
    10000 = capacity

    Therefore quantity = 2
  */

  match = text.match(
    /\b(\d+)\s+\d+(?:\.\d+)?\s*(?:litre|litres|liter|liters|ltr|l|kg|kgs|kilogram|kilograms|meter|meters|metre|metres|cm|mm|inch|inches|feet|ft)\b/i
  );

  if (match) {
    const quantity = Number(match[1]);

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    Normal products:

    2 tanks
    3 sarees
    4 shirts
    5 chairs
  */

  match = text.match(
    /\b(\d+)\s+(?:water\s+)?(?:tanks?|sarees?|saris?|shirts?|pants?|dresses?|kurtas?|jackets?|shoes?|bags?|bottles?|chairs?|tables?|machines?|pumps?|motors?|pipes?|fans?|coolers?|filters?|generators?|printers?|laptops?|phones?)\b/i
  );

  if (match) {
    const quantity = Number(match[1]);

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    Hindi:

    2 पानी की टंकी
    2 टंकी
    3 साड़ी
    4 कुर्सी
  */

  match = text.match(
    /(\d+)\s*(?:पानी की टंकी|पानी की टंकियां|टंकी|टंकियां|साड़ी|साड़ियां|कुर्सी|कुर्सियां|कमीज़|कमीज|कपड़े|कपड़ा|बोतल|बोतलें|मेज|मेज़|मशीन|मशीनें|पंखा|पंखे|पाइप|पाइप्स|मोटर|मोटर्स)/
  );

  if (match) {
    const quantity = Number(match[1]);

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    English/Hinglish number words
  */

  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,

    ek: 1,
    do: 2,
    teen: 3,
    char: 4,
    chaar: 4,
    paanch: 5,
    panch: 5,
    chhe: 6,
    che: 6,
    saat: 7,
    sat: 7,
    aath: 8,
    ath: 8,
    nau: 9,
    das: 10,
  };

  const numberWordPattern =
    Object.keys(numberWords).join("|");

  match = text.match(
    new RegExp(
      `\\b(${numberWordPattern})\\s+(?:water\\s+)?(?:tanks?|sarees?|saris?|shirts?|chairs?|tables?|bags?|bottles?|machines?|pumps?|motors?|pipes?)\\b`,
      "i"
    )
  );

  if (match) {
    const quantity =
      numberWords[
        match[1].toLowerCase()
      ];

    if (quantity > 0) {
      return quantity;
    }
  }

  /*
    Hindi number words

    दो पानी की टंकी
    तीन साड़ी
  */

  const hindiNumberWords = {
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पाँच": 5,
    "पांच": 5,
    "छह": 6,
    "छः": 6,
    "सात": 7,
    "आठ": 8,
    "नौ": 9,
    "दस": 10,
  };

  for (
    const [word, value] of Object.entries(
      hindiNumberWords
    )
  ) {
    const hindiPattern =
      new RegExp(
        `${word}\\s*(?:पानी की टंकी|टंकी|साड़ी|साड़ियां|कुर्सी|कुर्सियां|बोतल|मशीन|पाइप|मोटर)`,
        "i"
      );

    if (hindiPattern.test(text)) {
      return value;
    }
  }

  return null;
}

/* ============================================================
   QUANTITY EXTRACTION
============================================================ */

function extractQuantity(transcript) {
  const explicit =
    extractQuantityExplicitly(
      transcript
    );

  if (
    explicit !== null &&
    Number.isFinite(explicit) &&
    explicit > 0
  ) {
    return explicit;
  }

  // If no explicit quantity was spoken,
  // default to one item.
  return 1;
}

/* ============================================================
   PRODUCT EXTRACTION
============================================================ */

function extractProduct(transcript) {
  const text = String(
    transcript || ""
  ).trim();

  if (!text) return "";

  /*
    WATER TANK WITH CAPACITY

    10000 litre water tank
    10000 litres water tank
    500 liter tank
  */

  let match = text.match(
    /\b(\d+(?:\.\d+)?)\s*(?:litre|litres|liter|liters|ltr|l)\s+(?:(water)\s+)?tanks?\b/i
  );

  if (match) {
    const capacity = match[1];

    const isWater =
      Boolean(match[2]);

    return `${capacity} litre ${
      isWater ? "water " : ""
    }tank`.trim();
  }

  /*
    KNOWN PRODUCTS
  */

  const knownProducts = [
    "water tank",
    "tank",
    "saree",
    "sari",
    "shirt",
    "shirts",
    "pant",
    "pants",
    "dress",
    "kurta",
    "jacket",
    "shoe",
    "shoes",
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
    text.toLowerCase();

  for (const product of knownProducts) {
    const index =
      lower.indexOf(product);

    if (index === -1) {
      continue;
    }

    let before =
      text.slice(0, index);

    // Remove customer/order words
    before = before.replace(
      /^.*?\b(?:wants?|want|needs?|need|requires?|require)\b/i,
      ""
    );

    before = before.replace(
      /^.*?\b(?:customer|client)\b/i,
      ""
    );

    before = before.replace(
      /^(?:a|an|the)\s+/i,
      ""
    );

    // Remove quantity
    before = before.replace(
      /^\d+\s+/,
      ""
    );

    // Remove capacity
    before = before.replace(
      /\b\d+(?:\.\d+)?\s*(?:litre|litres|liter|liters|ltr|l|kg|kgs|kilogram|kilograms)\b/gi,
      ""
    );

    before =
      before.trim();

    let finalProduct =
      `${before} ${product}`.trim();

    finalProduct =
      finalProduct
        .replace(
          /\btanks\b/gi,
          "tank"
        )
        .replace(
          /\bsarees\b/gi,
          "saree"
        )
        .replace(
          /\bsaris\b/gi,
          "sari"
        )
        .replace(
          /\bshirts\b/gi,
          "shirt"
        )
        .trim();

    return finalProduct;
  }

  return "";
}

/* ============================================================
   PRICE EXTRACTION
============================================================ */

function extractPrice(transcript) {
  const text = String(
    transcript || ""
  ).trim();

  const patterns = [
    /*
      for 40000
      price 40000
      cost 40000
    */
    /(?:for|price|cost|amount|worth)\s*(?:₹|rs\.?|rupees?)?\s*([\d,]+(?:\.\d+)?)/i,

    /*
      ₹40000
      Rs 40000
      rupees 40000
    */
    /(?:₹|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)/i,

    /*
      40000 rupees
      40000 rupaye
      40000 rs
    */
    /\b([\d,]+(?:\.\d+)?)\s*(?:rupees?|rupaye|rs)\b/i,

    /*
      40 thousand
      40k
      40 hazaar
    */
    /\b(\d+(?:\.\d+)?)\s*(?:thousand|k|hazaar|hazar)\b/i,
  ];

  for (const pattern of patterns) {
    const match =
      text.match(pattern);

    if (!match) {
      continue;
    }

    let price =
      Number(
        String(match[1])
          .replace(/,/g, "")
      );

    if (
      /thousand|k|hazaar|hazar/i.test(
        match[0]
      )
    ) {
      price *= 1000;
    }

    if (Number.isFinite(price)) {
      return price;
    }
  }

  return 0;
}

/* ============================================================
   DELIVERY EXTRACTION
============================================================ */

function extractDelivery(transcript) {
  const text =
    String(transcript || "").trim();

  if (
    /\bday after tomorrow\b/i.test(text) ||
    /\bparso\b/i.test(text) ||
    text.includes("परसों")
  ) {
    return resolveDeliveryDate(
      "day after tomorrow"
    );
  }

  if (
    /\btoday\b/i.test(text) ||
    /\baaj\b/i.test(text) ||
    text.includes("आज")
  ) {
    return resolveDeliveryDate(
      "today"
    );
  }

  if (
    /\btomorrow\b/i.test(text) ||
    /\bkal\b/i.test(text) ||
    text.includes("कल")
  ) {
    return resolveDeliveryDate(
      "tomorrow"
    );
  }

  const englishDay =
    text.match(
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i
    );

  if (englishDay) {
    return resolveDeliveryDate(
      englishDay[1]
    );
  }

  const hinglishDay =
    text.match(
      /\b(somvaar|somvar|mangalvaar|mangalvar|budhvaar|budhvar|guruvaar|guruvar|shukravaar|shukravar|shanivaar|shanivar|ravivaar|ravivar)\b/i
    );

  if (hinglishDay) {
    return resolveDeliveryDate(
      hinglishDay[1]
    );
  }

  const hindiDays = [
    ["सोमवार", "Monday"],
    ["मंगलवार", "Tuesday"],
    ["बुधवार", "Wednesday"],
    ["गुरुवार", "Thursday"],
    ["शुक्रवार", "Friday"],
    ["शनिवार", "Saturday"],
    ["रविवार", "Sunday"],
  ];

  for (
    const [hindi, english] of hindiDays
  ) {
    if (text.includes(hindi)) {
      return resolveDeliveryDate(
        english
      );
    }
  }

  return {
    deliveryDay: "",
    deliveryDate: "",
  };
}

/* ============================================================
   FALLBACK EXTRACTION
============================================================ */

function fallbackExtractOrder(
  transcript
) {
  const delivery =
    extractDelivery(transcript);

  return {
    customerName:
      extractCustomer(transcript) ||
      "Unknown Customer",

    product:
      extractProduct(transcript) ||
      "Unknown product",

    quantity:
      extractQuantity(transcript),

    price:
      extractPrice(transcript),

    deliveryDay:
      delivery.deliveryDay,

    deliveryDate:
      delivery.deliveryDate,
  };
}

/* ============================================================
   NORMALIZE ORDER
============================================================ */

function normalizeOrder(
  geminiOrder,
  transcript
) {
  const local =
    fallbackExtractOrder(
      transcript
    );

  /*
    CUSTOMER
  */

  const customerName =
    local.customerName !==
    "Unknown Customer"
      ? local.customerName
      : geminiOrder.customerName ||
        "Unknown Customer";

  /*
    PRODUCT
  */

  const product =
    local.product !==
    "Unknown product"
      ? local.product
      : geminiOrder.product ||
        "Unknown product";

  /*
    QUANTITY

    Explicit spoken quantity gets priority.

    Example:
    "2 10000 litre tanks"
    => 2

    "10000 litre tank"
    => Gemini/default = 1
  */

  const explicitQuantity =
    extractQuantityExplicitly(
      transcript
    );

  let quantity;

  if (
    explicitQuantity !== null &&
    Number.isFinite(
      explicitQuantity
    ) &&
    explicitQuantity > 0
  ) {
    quantity =
      explicitQuantity;
  } else {
    quantity =
      Number(
        geminiOrder.quantity
      );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      quantity = 1;
    }
  }

  /*
    PRICE
  */

  let price =
    Number(local.price);

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    price =
      Number(
        geminiOrder.price
      );
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    price = 0;
  }

  /*
    DELIVERY
  */

  let deliveryDay =
    local.deliveryDay ||
    geminiOrder.deliveryDay ||
    "";

  let deliveryDate =
    local.deliveryDate ||
    geminiOrder.deliveryDate ||
    "";

  if (
    deliveryDay &&
    !deliveryDate
  ) {
    const resolved =
      resolveDeliveryDate(
        deliveryDay
      );

    deliveryDay =
      resolved.deliveryDay;

    deliveryDate =
      resolved.deliveryDate;
  }

  /*
    ORDER DATE

    Always today's date.
  */

  const orderDate =
    formatDate(
      getToday()
    );

  return {
    customerName:
      String(
        customerName
      ).trim(),

    product:
      String(
        product
      ).trim(),

    quantity,

    price,

    deliveryDay:
      String(
        deliveryDay
      ).trim(),

    deliveryDate:
      String(
        deliveryDate
      ).trim(),

    orderDate,

    originalVoiceText:
      transcript,
  };
}

/* ============================================================
   HOME
============================================================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "BizAssist AI backend is running",
  });
});

/* ============================================================
   PHOTO TEST
============================================================ */

app.get(
  "/api/photo/test",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Photo route is working",
    });
  }
);

/* ============================================================
   PHOTO ANALYSIS
============================================================ */

app.post(
  "/api/photo/analyze",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No image uploaded.",
        });
      }

      if (!gemini) {
        return res.status(500).json({
          success: false,
          message:
            "Gemini AI is not initialized.",
        });
      }

      const base64Image =
        req.file.buffer.toString(
          "base64"
        );

      const prompt = `
You are BizAssist AI's visual inspection assistant for small businesses.

Analyze the uploaded image and return ONLY valid JSON.

Return exactly:

{
  "product": "",
  "quantity": 0,
  "condition": "",
  "details": ""
}

Rules:

1. product = main physical business item visible.
2. quantity = number of separate physical items visible.
3. Capacity or measurement is NOT quantity.
4. If one tank is visible, quantity = 1.
5. condition should be practical.
6. details should describe only visible facts.
7. Never invent information.
`;

      const response =
        await gemini.models.generateContent({
          model:
            "gemini-3.6-flash",

          contents: [
            {
              inlineData: {
                mimeType:
                  req.file.mimetype,
                data:
                  base64Image,
              },
            },
            {
              text: prompt,
            },
          ],

          config: {
            responseMimeType:
              "application/json",

            temperature: 0,

            maxOutputTokens: 300,
          },
        });

      const parsed =
        parseGeminiJSON(
          response.text?.trim()
        );

      res.json({
        success: true,

        message:
          "Photo analyzed successfully.",

        analysis:
          JSON.stringify(parsed),

        fileName:
          req.file.originalname,
      });
    } catch (error) {
      console.error(
        "PHOTO ANALYSIS ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          error.message ||
          "Photo analysis failed.",
      });
    }
  }
);

/* ============================================================
   EXTRACT ORDER
============================================================ */

app.post(
  "/api/orders/extract",
  async (req, res) => {
    try {
      const voiceText =
        req.body.voiceText;

      if (
        !voiceText ||
        !String(voiceText).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Voice text is required.",
        });
      }

      const transcript =
        String(
          voiceText
        ).trim();

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "ORDER EXTRACTION"
      );

      console.log(
        "TRANSCRIPT:",
        transcript
      );

      console.log(
        "========================================"
      );

      let geminiResult = {};

      if (gemini) {
        try {
          const prompt = `
You are BizAssist AI's order extraction engine.

Extract the order from this transcript.

The transcript may be:
- English
- Hindi
- Hinglish
- Mixed English and Hindi
- Devanagari Hindi

Return ONLY valid JSON.

{
  "customerName": "",
  "product": "",
  "quantity": 1,
  "price": 0,
  "deliveryDay": "",
  "deliveryDate": ""
}

IMPORTANT PRODUCT RULE:

Keep the COMPLETE product description.

Example:
"red silk saree"
=> product = "red silk saree"

"10000 litre water tank"
=> product = "10000 litre water tank"

"blue cotton shirt"
=> product = "blue cotton shirt"

IMPORTANT QUANTITY RULE:

Quantity means NUMBER OF ITEMS ORDERED.

It does NOT mean product capacity or measurement.

Examples:

"500 litre tank"
=> quantity = 1

"10000 litre water tank"
=> quantity = 1

"2 tanks"
=> quantity = 2

"2 10000 litre water tanks"
=> quantity = 2

"3 red silk sarees"
=> quantity = 3

"2 water tanks"
=> quantity = 2

Hindi:

"2 पानी की टंकी"
=> quantity = 2

"10000 लीटर की पानी की टंकी"
=> quantity = 1

VERY IMPORTANT:

If the sentence contains two numbers like:

"2 10000 litre water tanks"

the FIRST number is quantity.

The SECOND number is capacity.

Therefore:

quantity = 2

product = "10000 litre water tank"

PRICE:

Understand:

₹
Rs
rupees
rupaye
thousand
k
hazaar
hazar

DELIVERY:

today / aaj / आज
tomorrow / kal / कल
day after tomorrow / parso / परसों

Weekdays:

Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday

Also:

somvaar
somvar
mangalvaar
mangalvar
budhvaar
budhvar
guruvaar
guruvar
shukravaar
shukravar
shanivaar
shanivar
ravivaar
ravivar

Hindi weekdays:

सोमवार
मंगलवार
बुधवार
गुरुवार
शुक्रवार
शनिवार
रविवार

Today's date:

${formatDate(getToday())}

Today's weekday:

${getDayName(getToday())}

For a weekday, return the NEXT occurrence.

If no delivery date is mentioned:

deliveryDay = ""
deliveryDate = ""

If customer is missing:

customerName = "Unknown Customer"

If product is missing:

product = "Unknown product"

Transcript:

${transcript}
`;

          const response =
            await gemini.models.generateContent({
              model:
                "gemini-3.6-flash",

              contents: prompt,

              config: {
                responseMimeType:
                  "application/json",

                temperature: 0,

                maxOutputTokens: 300,
              },
            });

          geminiResult =
            parseGeminiJSON(
              response.text?.trim()
            );

          console.log(
            "GEMINI RESULT:",
            JSON.stringify(
              geminiResult,
              null,
              2
            )
          );
        } catch (error) {
          console.error(
            "GEMINI EXTRACTION ERROR:",
            error.message
          );
        }
      }

      const finalOrder =
        normalizeOrder(
          geminiResult,
          transcript
        );

      console.log(
        "FINAL ORDER:"
      );

      console.log(
        JSON.stringify(
          finalOrder,
          null,
          2
        )
      );

      res.json({
        success: true,
        order: finalOrder,
      });
    } catch (error) {
      console.error(
        "ORDER EXTRACTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to extract order.",
      });
    }
  }
);

/* ============================================================
   SAVE ORDER
============================================================ */

app.post(
  "/api/orders",
  async (req, res) => {
    try {
      const orderDate =
        req.body.orderDate ||
        formatDate(
          getToday()
        );

      const order =
        await Order.create({
          customerName:
            req.body.customerName ||
            "Unknown Customer",

          product:
            req.body.product ||
            "Unknown product",

          quantity:
            Number(
              req.body.quantity
            ) > 0
              ? Number(
                  req.body.quantity
                )
              : 1,

          price:
            Number(
              req.body.price
            ) >= 0
              ? Number(
                  req.body.price
                )
              : 0,

          deliveryDay:
            req.body.deliveryDay ||
            "",

          deliveryDate:
            req.body.deliveryDate ||
            "",

          orderDate,

          originalVoiceText:
            req.body.originalVoiceText ||
            "",

          status:
            req.body.status ||
            "Pending",

          amountPaid:
            Number(
              req.body.amountPaid
            ) || 0,

          paymentStatus:
            req.body.paymentStatus ||
            "Pending",
        });

      res.status(201).json({
        success: true,

        message:
          "Order saved successfully",

        order,
      });
    } catch (error) {
      console.error(
        "SAVE ORDER ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to save order",

        error:
          error.message,
      });
    }
  }
);

/* ============================================================
   GET ORDERS
============================================================ */

app.get(
  "/api/orders",
  async (req, res) => {
    try {
      const orders =
        await Order.find()
          .sort({
            createdAt: -1,
          });

      res.json(orders);
    } catch (error) {
      console.error(
        "FETCH ORDERS ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch orders",
      });
    }
  }
);

/* ============================================================
   GET SINGLE ORDER
============================================================ */

app.get(
  "/api/orders/:id",
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,

          message:
            "Order not found",
        });
      }

      res.json(order);
    } catch (error) {
      console.error(
        "GET ORDER ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch order",
      });
    }
  }
);

/* ============================================================
   UPDATE ORDER
============================================================ */

app.put(
  "/api/orders/:id",
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,

          message:
            "Order not found",
        });
      }

      if (
        req.body.customerName !==
        undefined
      ) {
        order.customerName =
          req.body.customerName;
      }

      if (
        req.body.product !==
        undefined
      ) {
        order.product =
          req.body.product;
      }

      if (
        req.body.quantity !==
        undefined
      ) {
        order.quantity =
          Number(
            req.body.quantity
          );
      }

      if (
        req.body.price !==
        undefined
      ) {
        order.price =
          Number(
            req.body.price
          );
      }

      if (
        req.body.deliveryDay !==
        undefined
      ) {
        order.deliveryDay =
          req.body.deliveryDay;
      }

      if (
        req.body.deliveryDate !==
        undefined
      ) {
        order.deliveryDate =
          req.body.deliveryDate;
      }

      if (
        req.body.orderDate !==
        undefined
      ) {
        order.orderDate =
          req.body.orderDate;
      }

      if (
        req.body.status !==
        undefined
      ) {
        order.status =
          req.body.status;
      }

      await order.save();

      res.json({
        success: true,

        message:
          "Order updated successfully",

        order,
      });
    } catch (error) {
      console.error(
        "UPDATE ORDER ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to update order",
      });
    }
  }
);

/* ============================================================
   UPDATE STATUS
============================================================ */

app.put(
  "/api/orders/:id/status",
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,

          message:
            "Order not found",
        });
      }

      order.status =
        req.body.status;

      await order.save();

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to update status",
      });
    }
  }
);

/* ============================================================
   UPDATE PAYMENT
============================================================ */

app.put(
  "/api/orders/:id/payment",
  async (req, res) => {
    try {
      const amountPaid =
        Number(
          req.body.amountPaid
        );

      if (
        !Number.isFinite(
          amountPaid
        ) ||
        amountPaid < 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid amount paid",
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,

          message:
            "Order not found",
        });
      }

      const totalAmount =
        Number(
          order.price || 0
        ) *
        Number(
          order.quantity || 1
        );

      if (
        amountPaid >
        totalAmount
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Amount paid cannot exceed total amount",
        });
      }

      let paymentStatus =
        "Pending";

      if (
        amountPaid > 0 &&
        amountPaid < totalAmount
      ) {
        paymentStatus =
          "Partial";
      }

      if (
        amountPaid ===
        totalAmount
      ) {
        paymentStatus =
          "Paid";
      }

      order.amountPaid =
        amountPaid;

      order.paymentStatus =
        paymentStatus;

      await order.save();

      res.json({
        success: true,

        order,

        payment: {
          totalAmount,

          amountPaid,

          pendingAmount:
            totalAmount -
            amountPaid,

          paymentStatus,
        },
      });
    } catch (error) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to update payment",
      });
    }
  }
);

/* ============================================================
   PAYMENT SUMMARY
============================================================ */

app.get(
  "/api/payments/summary",
  async (req, res) => {
    try {
      const orders =
        await Order.find();

      let totalSales = 0;
      let totalPaid = 0;
      let totalPending = 0;

      orders.forEach(
        (order) => {
          const total =
            Number(
              order.price || 0
            ) *
            Number(
              order.quantity || 1
            );

          const paid =
            Number(
              order.amountPaid || 0
            );

          totalSales += total;

          totalPaid += paid;

          totalPending +=
            Math.max(
              0,
              total - paid
            );
        }
      );

      res.json({
        success: true,

        totalSales,

        totalPaid,

        totalPending,
      });
    } catch (error) {
      console.error(
        "PAYMENT SUMMARY ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch payment summary",
      });
    }
  }
);

/* ============================================================
   ASK BIZASSIST
============================================================ */

app.post(
  "/api/assistant/ask",
  async (req, res) => {
    try {
      const question =
        req.body.question;

      if (!question) {
        return res.status(400).json({
          success: false,

          message:
            "Question is required.",
        });
      }

      if (!gemini) {
        return res.status(500).json({
          success: false,

          message:
            "Gemini AI is not initialized.",
        });
      }

      const orders =
        await Order.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      let totalSales = 0;
      let totalPaid = 0;
      let totalPending = 0;

      orders.forEach(
        (order) => {
          const total =
            Number(
              order.price || 0
            ) *
            Number(
              order.quantity || 1
            );

          const paid =
            Number(
              order.amountPaid || 0
            );

          totalSales += total;

          totalPaid += paid;

          totalPending +=
            Math.max(
              0,
              total - paid
            );
        }
      );

      const businessData = {
        totalOrders:
          orders.length,

        totalSales,

        totalPaid,

        totalPending,

        orders:
          orders.map(
            (order) => ({
              customerName:
                order.customerName,

              product:
                order.product,

              quantity:
                order.quantity,

              price:
                order.price,

              deliveryDay:
                order.deliveryDay,

              deliveryDate:
                order.deliveryDate,

              orderDate:
                order.orderDate,

              status:
                order.status,

              amountPaid:
                order.amountPaid,

              paymentStatus:
                order.paymentStatus,
            })
          ),
      };

      const prompt = `
You are BizAssist AI.

Answer the business owner's question using ONLY the business data.

Understand:
- English
- Hindi
- Hinglish
- Devanagari Hindi

Never invent information.

Keep the answer short and useful.

BUSINESS DATA:

${JSON.stringify(
  businessData
)}

USER QUESTION:

${String(
  question
).trim()}
`;

      const response =
        await gemini.models.generateContent({
          model:
            "gemini-3.6-flash",

          contents:
            prompt,

          config: {
            temperature: 0,

            maxOutputTokens: 300,
          },
        });

      res.json({
        success: true,

        answer:
          response.text?.trim() ||
          "I could not find an answer.",
      });
    } catch (error) {
      console.error(
        "ASK BIZASSIST ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to answer question.",
      });
    }
  }
);

/* ============================================================
   PRIORITY ORDERS
============================================================ */

app.get(
  "/api/business/priority",
  async (req, res) => {
    try {
      const orders =
        await Order.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      const priorities = [];

      const today =
        formatDate(
          getToday()
        );

      const tomorrowDate =
        new Date(
          getToday()
        );

      tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
      );

      const tomorrow =
        formatDate(
          tomorrowDate
        );

      orders.forEach(
        (order) => {
          const total =
            Number(
              order.price || 0
            ) *
            Number(
              order.quantity || 1
            );

          const paid =
            Number(
              order.amountPaid || 0
            );

          const pending =
            Math.max(
              0,
              total - paid
            );

          /*
            HIGH PAYMENT PRIORITY
          */

          if (
            pending >= 25000
          ) {
            priorities.push({
              level: "HIGH",

              score: 100,

              icon: "💰",

              title:
                `${order.customerName} ka payment follow-up`,

              description:
                `₹${pending.toLocaleString(
                  "en-IN"
                )} pending hai.`,

              action:
                "Customer se payment follow-up karo.",

              orderId:
                order._id,
            });

            return;
          }

          /*
            DELIVERY TODAY
          */

          if (
            order.deliveryDate ===
            today
          ) {
            priorities.push({
              level: "HIGH",

              score: 95,

              icon: "🚚",

              title:
                `${order.customerName} ki delivery aaj hai`,

              description:
                `${order.product} × ${order.quantity} deliver karna hai.`,

              action:
                "Order ko delivery ke liye ready karo.",

              orderId:
                order._id,
            });

            return;
          }

          /*
            DELIVERY TOMORROW
          */

          if (
            order.deliveryDate ===
            tomorrow
          ) {
            priorities.push({
              level: "HIGH",

              score: 90,

              icon: "🚚",

              title:
                `${order.customerName} ki delivery kal hai`,

              description:
                `${order.product} × ${order.quantity} prepare karna hai.`,

              action:
                "Aaj order preparation complete karo.",

              orderId:
                order._id,
            });

            return;
          }

          /*
            PAYMENT PENDING
          */

          if (
            pending > 0
          ) {
            priorities.push({
              level: "MEDIUM",

              score: 75,

              icon: "💰",

              title:
                `${order.customerName} ka payment pending`,

              description:
                `₹${pending.toLocaleString(
                  "en-IN"
                )} receive karna baaki hai.`,

              action:
                "Payment follow-up karo.",

              orderId:
                order._id,
            });

            return;
          }

          /*
            IN PROGRESS
          */

          if (
            order.status ===
            "In Progress"
          ) {
            priorities.push({
              level: "MEDIUM",

              score: 70,

              icon: "🔧",

              title:
                `${order.customerName} ka order in progress`,

              description:
                `${order.product} abhi complete nahi hua.`,

              action:
                "Order completion check karo.",

              orderId:
                order._id,
            });
          }
        }
      );

      priorities.sort(
        (a, b) =>
          b.score - a.score
      );

      res.json({
        success: true,

        priorities:
          priorities.slice(0, 5),
      });
    } catch (error) {
      console.error(
        "PRIORITY ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to generate priorities.",
      });
    }
  }
);

/* ============================================================
   404
============================================================ */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/* ============================================================
   DATABASE + SERVER
============================================================ */

if (!process.env.MONGO_URI) {
  console.error(
    "MONGO_URI is missing from .env"
  );

  process.exit(1);
}

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      5000,
      () => {
        console.log(
          "BizAssist backend running on http://localhost:5000"
        );
      }
    );
  })
  .catch(
    (error) => {
      console.error(
        "MONGODB CONNECTION FAILED:"
      );

      console.error(error);
    }
  );