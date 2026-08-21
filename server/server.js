const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BizAssist AI backend is running",
  });
});

app.post("/api/orders/extract", (req, res) => {
  try {
    const { voiceText } = req.body;

    if (!voiceText) {
      return res.status(400).json({
        message: "Voice text is required",
      });
    }

    const text = voiceText.trim();

    let customerName = "";
    let product = "";
    let quantity = 1;
    let price = 0;
    let deliveryDate = "";

    const customerMatch = text.match(
      /^([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:wants|needs|ordered|requires|asked for)/i
    );

    if (customerMatch) {
      customerName = customerMatch[1].trim();
    }

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
    };

    const quantityMatch = text.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i
    );

    if (quantityMatch) {
      const value = quantityMatch[1].toLowerCase();

      quantity = numberWords[value]
        ? numberWords[value]
        : Number(value);

      if (!quantity || quantity < 1) {
        quantity = 1;
      }
    }

    const priceMatch = text.match(
      /(?:at|for|price|cost|costing)\s*(?:₹|rs\.?|rupees?)?\s*([\d,]+)/i
    );

    if (priceMatch) {
      price = Number(
        priceMatch[1].replace(/,/g, "")
      );
    }

    const deliveryMatch = text.match(
      /\b(?:for|on|by)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    );

    if (deliveryMatch) {
      deliveryDate = deliveryMatch[1];
    }

    const productMatch = text.match(
      /(?:wants|needs|ordered|requires|asked for)\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(.+?)(?:\s+for\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?(?:\s+at\s+(?:₹|rs\.?|rupees?)?\s*[\d,]+)?\.?$/i
    );

    if (productMatch) {
      product = productMatch[1].trim();
    }

    product = product
      .replace(/\s+at\s+.*$/i, "")
      .replace(/\s+for\s+.*$/i, "")
      .trim();

    const extractedOrder = {
      customerName,
      product,
      quantity,
      price,
      deliveryDate,
    };

    console.log(
      "Extracted order:",
      extractedOrder
    );

    res.json({
      success: true,
      order: extractedOrder,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to extract order",
      error: error.message,
    });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);

    res.status(201).json({
      message: "Order saved successfully",
      order,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save order",
      error: error.message,
    });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(5000, () => {
      console.log(
        "Server running on http://localhost:5000"
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });