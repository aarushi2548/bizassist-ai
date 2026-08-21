const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },

    product: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    price: {
      type: Number,
      default: 0,
    },

    deliveryDate: {
      type: String,
      default: "",
    },

    originalVoiceText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);