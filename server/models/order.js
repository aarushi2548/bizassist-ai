const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      default: "Unknown Customer",
      trim: true,
    },

    product: {
      type: String,
      default: "Unknown product",
      trim: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Date on which the order was created
    // Format: YYYY-MM-DD
    orderDate: {
      type: String,
      default: "",
    },

    // Actual delivery date
    // Format: YYYY-MM-DD
    deliveryDate: {
      type: String,
      default: "",
    },

    // Day spoken by customer
    // Example: Friday, Monday, Tomorrow, Kal
    deliveryDay: {
      type: String,
      default: "",
    },

    originalVoiceText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Partial",
        "Paid",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);