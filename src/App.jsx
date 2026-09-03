import React, { useEffect, useState } from "react";

import AskBizAssist from "./AskBizAssist";
import PriorityOrders from "./PriorityOrders";
import RecordOrder from "./RecordOrder";
import PhotoAnalysis from "./PhotoAnalysis";

import "./App.css";

const API_URL = "http://localhost:5000";

/* =====================================================
   SAFE RESPONSE MESSAGE
===================================================== */

function getSafeMessage(data, fallback = "Something went wrong.") {
  if (!data) return fallback;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.analysis === "string") {
    return data.analysis;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (data.error && typeof data.error === "object") {
    if (typeof data.error.message === "string") {
      return data.error.message;
    }

    try {
      return JSON.stringify(data.error, null, 2);
    } catch {
      return fallback;
    }
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return fallback;
  }
}

/* =====================================================
   SAFE JSON FETCH
===================================================== */

async function getResponseData(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/* =====================================================
   APP
===================================================== */

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [showOrderForm, setShowOrderForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const [saving, setSaving] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentValue, setPaymentValue] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(null);

  /* =====================================================
     FETCH ORDERS
  ===================================================== */

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);

      const response = await fetch(
        `${API_URL}/api/orders`
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getSafeMessage(
            data,
            "Failed to load orders."
          )
        );
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        "FETCH ORDERS ERROR:",
        error
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const openPage = (page) => {
    setCurrentPage(page);

    if (
      page === "orders" ||
      page === "priority"
    ) {
      fetchOrders();
    }
  };

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const getTotal = (order) => {
    return (
      Number(order.price || 0) *
      Number(order.quantity || 1)
    );
  };

  const getPaid = (order) => {
    return Number(order.amountPaid || 0);
  };

  const getPending = (order) => {
    return Math.max(
      0,
      getTotal(order) - getPaid(order)
    );
  };

  /* =====================================================
     BUSINESS STATS
  ===================================================== */

  const totalBusinessValue = orders.reduce(
    (sum, order) => sum + getTotal(order),
    0
  );

  const totalPending = orders.reduce(
    (sum, order) => sum + getPending(order),
    0
  );

  const customerCount = new Set(
    orders
      .map((order) => order.customerName)
      .filter(Boolean)
  ).size;

  /* =====================================================
     SAVE MANUAL ORDER
  ===================================================== */

  const saveOrder = async () => {
    if (
      !customerName.trim() ||
      !product.trim()
    ) {
      alert(
        "Please enter customer name and product."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerName.trim(),
            product: product.trim(),
            quantity: Number(quantity) || 1,
            price: Number(price) || 0,
            deliveryDate: deliveryDate.trim(),
            originalVoiceText: "",
            status: "Pending",
            amountPaid: 0,
            paymentStatus: "Pending",
          }),
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getSafeMessage(
            data,
            "Failed to save order."
          )
        );
      }

      alert("Order saved successfully!");

      setCustomerName("");
      setProduct("");
      setQuantity(1);
      setPrice("");
      setDeliveryDate("");

      setShowOrderForm(false);

      await fetchOrders();
    } catch (error) {
      console.error(
        "SAVE ORDER ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to save order."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     UPDATE PAYMENT
  ===================================================== */

  const updatePayment = async (order) => {
    const amount = Number(paymentValue);
    const total = getTotal(order);

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      alert(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (amount > total) {
      alert(
        "Paid amount cannot be greater than order value."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${order._id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amountPaid: amount,
          }),
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getSafeMessage(
            data,
            "Failed to update payment."
          )
        );
      }

      setEditingPayment(null);
      setPaymentValue("");

      await fetchOrders();
    } catch (error) {
      console.error(
        "PAYMENT UPDATE ERROR:",
        error
      );

      alert(
        error.message ||
          "Could not update payment."
      );
    }
  };

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  const updateStatus = async (
    order,
    newStatus
  ) => {
    try {
      setUpdatingStatus(order._id);

      const response = await fetch(
        `${API_URL}/api/orders/${order._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getSafeMessage(
            data,
            "Failed to update status."
          )
        );
      }

      await fetchOrders();
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        error.message ||
          "Could not update order status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  /* =====================================================
     HOME PAGE
  ===================================================== */

  if (currentPage === "home") {
    return (
      <div className="app">

        <header className="app-header">
          <div className="brand">

            <div className="brand-icon">
              🤖
            </div>

            <div>
              <h1>BizAssist AI</h1>

              <p>
                Your smart business assistant
              </p>
            </div>

          </div>
        </header>

        <main className="dashboard">

          {/* WELCOME */}

          <section className="welcome-section">

            <h2>
              Welcome to BizAssist 👋
            </h2>

            <p>
              Manage your business smarter with AI.
            </p>

          </section>

          {/* FEATURES */}

          <section className="feature-grid">

            <button
              className="feature-card record-card"
              onClick={() =>
                openPage("record")
              }
            >
              <div className="feature-icon">
                🎙️
              </div>

              <h3>Record Order</h3>

              <p>
                Speak naturally and let BizAssist
                extract customer, product,
                quantity, price and delivery details.
              </p>

              <span>
                Record with voice →
              </span>
            </button>

            <button
              className="feature-card ask-card"
              onClick={() =>
                openPage("ask")
              }
            >
              <div className="feature-icon">
                🤖
              </div>

              <h3>Ask BizAssist</h3>

              <p>
                Ask questions about orders,
                payments, customers and deliveries.
              </p>

              <span>
                Voice + Text →
              </span>
            </button>

            <button
              className="feature-card priority-card-home"
              onClick={() =>
                openPage("priority")
              }
            >
              <div className="feature-icon">
                ⚡
              </div>

              <h3>Priority Orders</h3>

              <p>
                BizAssist tells you which order
                needs your attention first.
              </p>

              <span>
                See priorities →
              </span>
            </button>

            <button
              className="feature-card orders-card-home"
              onClick={() =>
                openPage("orders")
              }
            >
              <div className="feature-icon">
                📦
              </div>

              <h3>Orders</h3>

              <p>
                View and manage all your
                customer orders.
              </p>

              <span>
                View orders →
              </span>
            </button>

            <button
              className="feature-card photo-card-home"
              onClick={() =>
                openPage("photo")
              }
            >
              <div className="feature-icon">
                📸
              </div>

              <h3>AI Photo Analysis</h3>

              <p>
                Upload a product, machine or
                damage photo for AI analysis.
              </p>

              <span>
                Analyse photo →
              </span>
            </button>

          </section>

          {/* BUSINESS OVERVIEW */}

          <section className="stats-section">

            <div className="stats-heading">
              <h2>Business Overview</h2>
            </div>

            <div className="stats-grid">

              <div className="stat-card">

                <span>
                  Total Business Value
                </span>

                <strong>
                  ₹
                  {totalBusinessValue.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="stat-card warning">

                <span>
                  Pending Payments
                </span>

                <strong>
                  ₹
                  {totalPending.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  Customers
                </span>

                <strong>
                  {customerCount}
                </strong>

              </div>

            </div>

          </section>

          {/* ADD ORDER */}

          <section className="quick-section">

            <button
              className="primary-button"
              onClick={() =>
                setShowOrderForm(
                  !showOrderForm
                )
              }
            >
              {showOrderForm
                ? "✕ Close"
                : "+ Add Order"}
            </button>

          </section>

          {/* ADD ORDER FORM */}

          {showOrderForm && (
            <section className="order-form">

              <div className="form-header">

                <div>

                  <h2>
                    Add New Order
                  </h2>

                  <p>
                    Enter the order details manually.
                  </p>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Customer Name
                </label>

                <input
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Rahul"
                />

              </div>

              <div className="form-group">

                <label>
                  Product
                </label>

                <input
                  value={product}
                  onChange={(e) =>
                    setProduct(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 500 litre tank"
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Total Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value
                      )
                    }
                    placeholder="₹"
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Delivery Date
                </label>

                <input
                  value={deliveryDate}
                  onChange={(e) =>
                    setDeliveryDate(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Tomorrow"
                />

              </div>

              <button
                className="primary-button save-main-order"
                onClick={saveOrder}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Order"}
              </button>

            </section>
          )}

          {/* RECENT ORDERS */}

          <section className="recent-section">

            <div className="section-heading">

              <div>

                <h2>
                  Recent Orders
                </h2>

                <p>
                  Your latest customer orders
                </p>

              </div>

              {orders.length > 0 && (
                <button
                  onClick={() =>
                    openPage("orders")
                  }
                >
                  View all →
                </button>
              )}

            </div>

            {loadingOrders ? (

              <div className="recent-empty">

                <div className="loading-icon">
                  ⏳
                </div>

                <h3>
                  Loading orders...
                </h3>

              </div>

            ) : orders.length === 0 ? (

              <div className="recent-empty">

                <div className="empty-order-icon">
                  📦
                </div>

                <h3>
                  No orders yet
                </h3>

                <p>
                  Record or add your first
                  order to see it here.
                </p>

              </div>

            ) : (

              orders
                .slice(-4)
                .reverse()
                .map((order) => (

                  <div
                    className="recent-order-card"
                    key={order._id}
                  >

                    <div className="recent-order-left">

                      <div className="recent-order-icon">
                        📦
                      </div>

                      <div className="recent-order-info">

                        <strong>
                          {order.customerName ||
                            "Unknown Customer"}
                        </strong>

                        <span>
                          {order.product ||
                            "Unknown product"}
                          {" • "}
                          Qty{" "}
                          {order.quantity || 1}
                        </span>

                      </div>

                    </div>

                    <div className="recent-order-money">

                      <strong>
                        ₹
                        {getTotal(
                          order
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      {getPending(order) > 0 ? (

                        <small>
                          ₹
                          {getPending(
                            order
                          ).toLocaleString(
                            "en-IN"
                          )}
                          {" "}pending
                        </small>

                      ) : (

                        <small className="recent-paid">
                          ✓ Fully paid
                        </small>

                      )}

                    </div>

                  </div>

                ))

            )}

          </section>

        </main>

      </div>
    );
  }

  /* =====================================================
     RECORD ORDER
  ===================================================== */

  if (currentPage === "record") {
    return (
      <RecordOrder
        onBack={() => {
          setCurrentPage("home");
          fetchOrders();
        }}
      />
    );
  }

  /* =====================================================
     ASK BIZASSIST
  ===================================================== */

  if (currentPage === "ask") {
    return (
      <AskBizAssist
        onBack={() =>
          setCurrentPage("home")
        }
      />
    );
  }

  /* =====================================================
     PRIORITY ORDERS
  ===================================================== */

  if (currentPage === "priority") {
    return (
      <PriorityOrders
        onBack={() => {
          setCurrentPage("home");
          fetchOrders();
        }}
      />
    );
  }

  /* =====================================================
     ORDERS PAGE
  ===================================================== */

  if (currentPage === "orders") {
    return (
      <div className="app">

        <header className="inner-header">

          <div className="inner-header-left">

            <button
              className="back-button"
              onClick={() =>
                setCurrentPage("home")
              }
            >
              ←
            </button>

            <div>

              <h1>
                Orders
              </h1>

              <p>
                Manage your customer orders
              </p>

            </div>

          </div>

          <div className="header-page-icon">
            📦
          </div>

        </header>

        <main className="orders-main">

          <section className="orders-summary-card">

            <div>

              <h2>
                All Orders
              </h2>

              <p>
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}{" "}
                recorded
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={fetchOrders}
              disabled={loadingOrders}
            >
              {loadingOrders
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </section>

          {loadingOrders ? (

            <div className="orders-empty">

              <div className="empty-icon">
                ⏳
              </div>

              <h2>
                Loading orders...
              </h2>

            </div>

          ) : orders.length === 0 ? (

            <div className="orders-empty">

              <div className="empty-icon">
                📦
              </div>

              <h2>
                No orders yet
              </h2>

              <p>
                Add your first order
                from the home page.
              </p>

            </div>

          ) : (

            <div className="orders-list">

              {orders.map((order) => {

                const total =
                  getTotal(order);

                const paid =
                  getPaid(order);

                const pending =
                  getPending(order);

                const isEditing =
                  editingPayment ===
                  order._id;

                const status =
                  order.status ||
                  "Pending";

                const statusClass =
                  status
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      "-"
                    );

                return (
                  <div
                    className="full-order-card"
                    key={order._id}
                  >

                    {/* TOP */}

                    <div className="order-top">

                      <div className="customer-block">

                        <h2>
                          {order.customerName ||
                            "Unknown Customer"}
                        </h2>

                        <p>
                          {order.product ||
                            "Unknown Product"}
                        </p>

                      </div>

                      <div className="order-total">

                        <span>
                          Order Value
                        </span>

                        <strong>
                          ₹
                          {total.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="order-details-grid">

                      <div className="detail-box">

                        <span>
                          👤 Customer
                        </span>

                        <strong>
                          {order.customerName ||
                            "Unknown"}
                        </strong>

                      </div>

                      <div className="detail-box">

                        <span>
                          📦 Product
                        </span>

                        <strong>
                          {order.product ||
                            "Unknown"}
                        </strong>

                      </div>

                      <div className="detail-box">

                        <span>
                          🔢 Quantity
                        </span>

                        <strong>
                          {order.quantity ||
                            1}
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

                    </div>

                    {/* STATUS + PAYMENT */}

                    <div className="payment-section">

                      <div className="payment-item">

                        <span>
                          Status
                        </span>

                        <select
                          className={`status-select status-badge ${statusClass}`}
                          value={status}
                          disabled={
                            updatingStatus ===
                            order._id
                          }
                          onChange={(e) =>
                            updateStatus(
                              order,
                              e.target.value
                            )
                          }
                        >

                          <option value="Pending">
                            Pending
                          </option>

                          <option value="In Progress">
                            In Progress
                          </option>

                          <option value="Completed">
                            Completed
                          </option>

                          <option value="Cancelled">
                            Cancelled
                          </option>

                        </select>

                      </div>

                      <div className="payment-item">

                        <span>
                          Paid
                        </span>

                        {isEditing ? (

                          <div className="amount-edit">

                            <span>
                              ₹
                            </span>

                            <input
                              className="edit-input amount-input"
                              type="number"
                              min="0"
                              max={total}
                              value={
                                paymentValue
                              }
                              onChange={(e) =>
                                setPaymentValue(
                                  e.target.value
                                )
                              }
                            />

                            <button
                              className="save-order-button"
                              onClick={() =>
                                updatePayment(
                                  order
                                )
                              }
                            >
                              Save
                            </button>

                            <button
                              className="cancel-order-button"
                              onClick={() => {

                                setEditingPayment(
                                  null
                                );

                                setPaymentValue(
                                  ""
                                );

                              }}
                            >
                              Cancel
                            </button>

                          </div>

                        ) : (

                          <div className="paid-value-row">

                            <strong>
                              ₹
                              {paid.toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            <button
                              className="edit-payment-button"
                              onClick={() => {

                                setEditingPayment(
                                  order._id
                                );

                                setPaymentValue(
                                  paid
                                );

                              }}
                            >
                              ✏️ Edit
                            </button>

                          </div>

                        )}

                      </div>

                      <div className="payment-item">

                        <span>
                          Pending
                        </span>

                        <strong
                          className={
                            pending > 0
                              ? "pending-money"
                              : "paid-money"
                          }
                        >
                          ₹
                          {pending.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                      <div
                        className={`payment-status ${
                          pending === 0
                            ? "payment-status-paid"
                            : "payment-status-pending"
                        }`}
                      >
                        {pending === 0
                          ? "✓ Fully Paid"
                          : `₹${pending.toLocaleString(
                              "en-IN"
                            )} pending`}
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </main>

        {/* BOTTOM NAV */}

        <nav className="bottom-nav">

          <button
            onClick={() =>
              setCurrentPage("home")
            }
          >
            <span>⌂</span>
            <span>Home</span>
          </button>

          <button
            onClick={() =>
              setCurrentPage("priority")
            }
          >
            <span>⚡</span>
            <span>Priority</span>
          </button>

          <button className="active">
            <span>📦</span>
            <span>Orders</span>
          </button>

          <button
            onClick={() =>
              setCurrentPage("ask")
            }
          >
            <span>🤖</span>
            <span>Ask AI</span>
          </button>

        </nav>

      </div>
    );
  }

  /* =====================================================
     PHOTO ANALYSIS
  ===================================================== */

  if (currentPage === "photo") {
    return (
      <PhotoAnalysis
        onBack={() =>
          setCurrentPage("home")
        }
      />
    );
  }

  return null;
}

export default App;