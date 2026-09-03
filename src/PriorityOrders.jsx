import React, { useEffect, useState } from "react";
import "./PriorityOrders.css";

function PriorityOrders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("PRIORITY ORDERS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotal = (order) => {
    return (
      Number(order.price || 0) *
      Number(order.quantity || 1)
    );
  };

  const getPending = (order) => {
    return Math.max(
      0,
      getTotal(order) -
        Number(order.amountPaid || 0)
    );
  };

  const getPriority = (order) => {
    const pending = getPending(order);
    const total = getTotal(order);

    const delivery =
      String(order.deliveryDate || "").toLowerCase();

    const status =
      String(order.status || "").toLowerCase();

    // HIGH PRIORITY
    if (
      pending > 0 &&
      (
        delivery.includes("today") ||
        delivery.includes("tomorrow") ||
        delivery.includes("aaj") ||
        delivery.includes("kal")
      )
    ) {
      return "HIGH";
    }

    if (
      pending >= total * 0.5 &&
      pending > 0
    ) {
      return "HIGH";
    }

    // MEDIUM PRIORITY
    if (
      pending > 0 ||
      status === "pending" ||
      status === "in progress"
    ) {
      return "MEDIUM";
    }

    // LOW
    return "LOW";
  };

  const getReason = (order, priority) => {
    const pending = getPending(order);

    const delivery =
      String(order.deliveryDate || "").toLowerCase();

    if (
      pending > 0 &&
      (
        delivery.includes("today") ||
        delivery.includes("tomorrow") ||
        delivery.includes("aaj") ||
        delivery.includes("kal")
      )
    ) {
      return "Payment is pending and delivery is near.";
    }

    if (pending > 0) {
      return `₹${pending.toLocaleString(
        "en-IN"
      )} payment is still pending.`;
    }

    if (
      order.status === "Pending"
    ) {
      return "Order has not been started yet.";
    }

    if (
      order.status === "In Progress"
    ) {
      return "Order is currently in progress.";
    }

    return "No urgent action required.";
  };

  const getAction = (order, priority) => {
    const pending = getPending(order);

    if (pending > 0) {
      return `Contact ${
        order.customerName || "customer"
      } and follow up for ₹${pending.toLocaleString(
        "en-IN"
      )} payment.`;
    }

    if (order.status === "Pending") {
      return "Start processing this order.";
    }

    if (order.status === "In Progress") {
      return "Check progress and update the customer.";
    }

    return "Keep monitoring this order.";
  };

  const priorityValue = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedOrders = [...orders].sort(
    (a, b) =>
      priorityValue[getPriority(b)] -
      priorityValue[getPriority(a)]
  );

  return (
    <div className="priority-page">

      <div className="priority-header">

        <button
          className="priority-back"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>Priority Orders</h1>

          <p>
            BizAssist tells you what needs your attention first.
          </p>
        </div>

      </div>

      <main className="priority-content">

        <div className="priority-intro">

          <div className="priority-icon">
            ⚡
          </div>

          <div>
            <h2>
              What should I do first?
            </h2>

            <p>
              Your orders are automatically prioritized
              based on payments, delivery and order status.
            </p>
          </div>

        </div>

        {loading && (
          <div className="priority-loading">
            Analysing your orders...
          </div>
        )}

        {!loading && sortedOrders.length === 0 && (
          <div className="priority-empty">
            <div className="empty-icon">
              📦
            </div>

            <h3>
              No orders yet
            </h3>

            <p>
              Add an order and BizAssist will
              automatically decide its priority.
            </p>
          </div>
        )}

        {!loading &&
          sortedOrders.map((order, index) => {

            const priority =
              getPriority(order);

            const total =
              getTotal(order);

            const paid =
              Number(order.amountPaid || 0);

            const pending =
              getPending(order);

            return (
              <div
                className={`priority-card ${priority.toLowerCase()}`}
                key={
                  order._id ||
                  order.id ||
                  index
                }
              >

                <div className="priority-card-top">

                  <div className="priority-number">
                    #{index + 1}
                  </div>

                  <div
                    className={`priority-badge ${priority.toLowerCase()}`}
                  >
                    {priority === "HIGH" &&
                      "🔴 HIGH PRIORITY"}

                    {priority === "MEDIUM" &&
                      "🟠 MEDIUM PRIORITY"}

                    {priority === "LOW" &&
                      "🟢 LOW PRIORITY"}
                  </div>

                </div>

                <div className="order-main">

                  <div className="customer-section">

                    <div className="customer-avatar">
                      {(order.customerName ||
                        "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2>
                        {order.customerName ||
                          "Unknown Customer"}
                      </h2>

                      <p>
                        Customer
                      </p>
                    </div>

                  </div>

                  <div className="order-details">

                    <div className="detail-box">

                      <span>
                        📦 Product
                      </span>

                      <strong>
                        {order.product ||
                          "Unknown product"}
                      </strong>

                    </div>

                    <div className="detail-box">

                      <span>
                        🔢 Quantity
                      </span>

                      <strong>
                        {order.quantity || 1}
                      </strong>

                    </div>

                    <div className="detail-box">

                      <span>
                        📅 Delivery
                      </span>

                      <strong>
                        {order.deliveryDate ||
                          "Not specified"}
                      </strong>

                    </div>

                    <div className="detail-box">

                      <span>
                        📌 Status
                      </span>

                      <strong>
                        {order.status ||
                          "Pending"}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="payment-section">

                  <div className="money-box">

                    <span>
                      Order Value
                    </span>

                    <strong>
                      ₹{total.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  <div className="money-box">

                    <span>
                      Paid
                    </span>

                    <strong className="paid">
                      ₹{paid.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  <div className="money-box">

                    <span>
                      Pending
                    </span>

                    <strong className="pending">
                      ₹{pending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                </div>

                <div className="ai-reason">

                  <div className="ai-title">
                    🤖 Why this order needs attention
                  </div>

                  <p>
                    {getReason(
                      order,
                      priority
                    )}
                  </p>

                </div>

                <div className="ai-action">

                  <div className="action-title">
                    👉 BizAssist recommends
                  </div>

                  <p>
                    {getAction(
                      order,
                      priority
                    )}
                  </p>

                </div>

              </div>
            );
          })}

      </main>

    </div>
  );
}

export default PriorityOrders;