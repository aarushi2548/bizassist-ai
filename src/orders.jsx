import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function Orders({ onBack, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching orders from:", `${API_URL}/api/orders`);

      const response = await fetch(`${API_URL}/api/orders`);

      console.log("Orders response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Server response:", errorText);

        throw new Error(
          `Failed to fetch orders (${response.status})`
        );
      }

      const data = await response.json();

      console.log("Orders received:", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid orders data received from server.");
      }

      setOrders(data);
    } catch (err) {
      console.error("ORDERS ERROR:", err);

      setError(
        err.message ||
          "Could not load orders. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const getTotal = (order) =>
    Number(order.price || 0) *
    Number(order.quantity || 1);

  const getPaid = (order) =>
    Number(order.amountPaid || 0);

  const getPending = (order) =>
    Math.max(
      0,
      getTotal(order) - getPaid(order)
    );

  const startEdit = (order) => {
    setEditingId(order._id);

    setEditData({
      customerName: order.customerName || "",
      product: order.product || "",
      quantity: order.quantity || 1,
      price: order.price || 0,
      deliveryDate: order.deliveryDate || "",
      status: order.status || "Pending",
      amountPaid: order.amountPaid || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const updateField = (field, value) => {
    setEditData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveEdit = async (orderId) => {
    try {
      setSavingId(orderId);

      const quantity = Number(editData.quantity);
      const price = Number(editData.price);
      const amountPaid = Number(editData.amountPaid);

      if (!editData.customerName.trim()) {
        alert("Customer name is required.");
        return;
      }

      if (!editData.product.trim()) {
        alert("Product is required.");
        return;
      }

      if (quantity <= 0 || Number.isNaN(quantity)) {
        alert("Quantity must be greater than 0.");
        return;
      }

      if (price < 0 || Number.isNaN(price)) {
        alert("Price cannot be negative.");
        return;
      }

      if (amountPaid < 0 || Number.isNaN(amountPaid)) {
        alert("Amount paid cannot be negative.");
        return;
      }

      const total = price * quantity;

      if (amountPaid > total) {
        alert(
          "Amount paid cannot be greater than order total."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/orders/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: editData.customerName.trim(),
            product: editData.product.trim(),
            quantity,
            price,
            deliveryDate: editData.deliveryDate.trim(),
            status: editData.status,
            amountPaid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update order."
        );
      }

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? data.order
            : order
        )
      );

      setEditingId(null);
      setEditData({});
    } catch (err) {
      console.error("UPDATE ORDER ERROR:", err);

      alert(
        err.message ||
          "Could not update order."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="app">

      <header className="header">

        <div>

          <button
            onClick={onBack}
            className="orders-back-button"
          >
            ← Back
          </button>

          <h1>Orders</h1>

          <p className="greeting">
            Manage all your orders
          </p>

        </div>

        <div className="profile">
          📋
        </div>

      </header>

      <main className="orders-main">

        <section className="orders-summary-card">

          <div>
            <h2>All Orders</h2>

            <p>
              {orders.length}{" "}
              {orders.length === 1
                ? "order"
                : "orders"}
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="refresh-button"
          >
            ↻ Refresh
          </button>

        </section>

        {error && (
          <div className="orders-error">
            {error}

            <button
              onClick={loadOrders}
              style={{
                marginLeft: "10px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (

          <div className="orders-empty">
            Loading orders...
          </div>

        ) : orders.length === 0 ? (

          <div className="orders-empty">

            <div className="empty-icon">
              📦
            </div>

            <h2>No orders yet</h2>

            <p>
              Record your first order
              from the Home page.
            </p>

          </div>

        ) : (

          <div className="orders-list">

            {orders.map((order) => {

              const total = getTotal(order);
              const paid = getPaid(order);
              const pending = getPending(order);
              const isEditing =
                editingId === order._id;

              return (

                <div
                  className={`full-order-card ${
                    isEditing
                      ? "editing-order"
                      : ""
                  }`}
                  key={order._id}
                >

                  <div className="order-top">

                    <div className="customer-block">

                      {isEditing ? (

                        <input
                          className="edit-input customer-input"
                          value={
                            editData.customerName
                          }
                          onChange={(e) =>
                            updateField(
                              "customerName",
                              e.target.value
                            )
                          }
                        />

                      ) : (

                        <h2>
                          {order.customerName ||
                            "Unknown Customer"}
                        </h2>

                      )}

                      {isEditing ? (

                        <input
                          className="edit-input"
                          value={editData.product}
                          onChange={(e) =>
                            updateField(
                              "product",
                              e.target.value
                            )
                          }
                        />

                      ) : (

                        <p>
                          {order.product ||
                            "Unknown product"}
                        </p>

                      )}

                    </div>

                    <div className="order-total">

                      <span>Total</span>

                      <strong>
                        ₹{money(total)}
                      </strong>

                    </div>

                  </div>

                  <div className="order-details-grid">

                    <div className="detail-box">

                      <span>Price</span>

                      {isEditing ? (

                        <input
                          className="edit-input"
                          type="number"
                          min="0"
                          value={editData.price}
                          onChange={(e) =>
                            updateField(
                              "price",
                              e.target.value
                            )
                          }
                        />

                      ) : (

                        <strong>
                          ₹{money(order.price)}
                        </strong>

                      )}

                    </div>

                    <div className="detail-box">

                      <span>Quantity</span>

                      {isEditing ? (

                        <input
                          className="edit-input"
                          type="number"
                          min="1"
                          value={
                            editData.quantity
                          }
                          onChange={(e) =>
                            updateField(
                              "quantity",
                              e.target.value
                            )
                          }
                        />

                      ) : (

                        <strong>
                          {order.quantity || 1}
                        </strong>

                      )}

                    </div>

                    <div className="detail-box">

                      <span>Delivery</span>

                      {isEditing ? (

                        <input
                          className="edit-input"
                          value={
                            editData.deliveryDate
                          }
                          onChange={(e) =>
                            updateField(
                              "deliveryDate",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Tomorrow"
                        />

                      ) : (

                        <strong>
                          {order.deliveryDate ||
                            "Not specified"}
                        </strong>

                      )}

                    </div>

                    <div className="detail-box">

                      <span>Status</span>

                      {isEditing ? (

                        <select
                          className="edit-input status-select"
                          value={editData.status}
                          onChange={(e) =>
                            updateField(
                              "status",
                              e.target.value
                            )
                          }
                        >

                          <option>
                            Pending
                          </option>

                          <option>
                            In Progress
                          </option>

                          <option>
                            Completed
                          </option>

                          <option>
                            Cancelled
                          </option>

                        </select>

                      ) : (

                        <span
                          className={`status-badge ${
                            String(
                              order.status ||
                                "Pending"
                            )
                              .toLowerCase()
                              .replace(
                                " ",
                                "-"
                              )
                          }`}
                        >
                          {order.status ||
                            "Pending"}
                        </span>

                      )}

                    </div>

                  </div>

                  <div className="payment-section">

                    <div className="payment-item">

                      <span>
                        Amount Paid
                      </span>

                      {isEditing ? (

                        <div className="amount-edit">

                          <span>₹</span>

                          <input
                            className="edit-input amount-input"
                            type="number"
                            min="0"
                            max={total}
                            value={
                              editData.amountPaid
                            }
                            onChange={(e) =>
                              updateField(
                                "amountPaid",
                                e.target.value
                              )
                            }
                          />

                        </div>

                      ) : (

                        <strong>
                          ₹{money(paid)}
                        </strong>

                      )}

                    </div>

                    <div className="payment-item">

                      <span>Pending</span>

                      <strong
                        className={
                          pending > 0
                            ? "pending-money"
                            : "paid-money"
                        }
                      >
                        {pending > 0
                          ? `₹${money(pending)}`
                          : "✓ Paid"}
                      </strong>

                    </div>

                    <div className="payment-status">
                      {order.paymentStatus ||
                        "Pending"}
                    </div>

                  </div>

                  <div className="order-actions">

                    {isEditing ? (

                      <>

                        <button
                          className="save-order-button"
                          onClick={() =>
                            saveEdit(order._id)
                          }
                          disabled={
                            savingId ===
                            order._id
                          }
                        >
                          {savingId ===
                          order._id
                            ? "Saving..."
                            : "✓ Save Changes"}
                        </button>

                        <button
                          className="cancel-order-button"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>

                      </>

                    ) : (

                      <button
                        className="edit-order-button"
                        onClick={() =>
                          startEdit(order)
                        }
                      >
                        ✎ Edit Order
                      </button>

                    )}

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </main>

      <nav className="bottom-nav">

        <button onClick={onBack}>
          <span>⌂</span>
          <span>Home</span>
        </button>

        <button
          onClick={() =>
            onNavigate("customers")
          }
        >
          <span>👥</span>
          <span>Customers</span>
        </button>

        <button
          className="active"
          onClick={() =>
            onNavigate("orders")
          }
        >
          <span>📋</span>
          <span>Orders</span>
        </button>

        <button
          onClick={() =>
            onNavigate("payments")
          }
        >
          <span>💰</span>
          <span>Money</span>
        </button>

      </nav>

    </div>
  );
}

export default Orders;