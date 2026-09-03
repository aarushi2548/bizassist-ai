import { useEffect, useState } from "react";

function Payments({ onBack, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const ordersResponse = await fetch(
        "http://localhost:5000/api/orders"
      );

      if (!ordersResponse.ok) {
        throw new Error("Failed to load payments.");
      }

      const ordersData = await ordersResponse.json();

      const summaryResponse = await fetch(
        "http://localhost:5000/api/payments/summary"
      );

      if (!summaryResponse.ok) {
        throw new Error(
          "Failed to load payment summary."
        );
      }

      const summaryData =
        await summaryResponse.json();

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : []
      );

      setSummary({
        totalSales:
          Number(summaryData.totalSales) || 0,
        totalPaid:
          Number(summaryData.totalPaid) || 0,
        totalPending:
          Number(summaryData.totalPending) || 0,
      });
    } catch (err) {
      console.error(
        "PAYMENTS ERROR:",
        err
      );

      setError(
        err.message ||
          "Could not load payments."
      );
    } finally {
      setLoading(false);
    }
  };

  const money = (value) =>
    Number(value || 0).toLocaleString(
      "en-IN"
    );

  const getTotal = (order) =>
    Number(order.price || 0) *
    Number(order.quantity || 1);

  const getPaid = (order) =>
    Number(order.amountPaid || 0);

  const getPending = (order) =>
    Math.max(
      0,
      getTotal(order) -
        getPaid(order)
    );

  const updatePayment = async (
    order
  ) => {
    const total = getTotal(order);
    const currentPaid = getPaid(order);

    const input = window.prompt(
      `Order total: ₹${money(total)}\nAlready paid: ₹${money(
        currentPaid
      )}\n\nEnter total amount paid:`,
      currentPaid
    );

    if (input === null) {
      return;
    }

    const amountPaid = Number(input);

    if (
      Number.isNaN(amountPaid) ||
      amountPaid < 0
    ) {
      alert(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (amountPaid > total) {
      alert(
        "Payment cannot be greater than the order total."
      );
      return;
    }

    try {
      setUpdatingId(order._id);

      const response = await fetch(
        `http://localhost:5000/api/orders/${order._id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amountPaid,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update payment."
        );
      }

      await loadPayments();

    } catch (err) {
      console.error(
        "UPDATE PAYMENT ERROR:",
        err
      );

      alert(
        err.message ||
          "Could not update payment."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>

          <button
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              marginBottom: "10px",
              fontSize: "15px",
            }}
          >
            ← Back
          </button>

          <h1>
            Payments
          </h1>

          <p className="greeting">
            Track money received and pending
          </p>

        </div>

        <div className="profile">
          💰
        </div>

      </header>

      <main>

        {/* SUMMARY */}

        <section
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
            }}
          >
            Payment Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "12px",
            }}
          >

            <div
              style={{
                background: "#f6f7fb",
                padding: "14px",
                borderRadius: "12px",
              }}
            >

              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "12px",
                }}
              >
                Total Sales
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "19px",
                }}
              >
                ₹
                {loading
                  ? "..."
                  : money(
                      summary.totalSales
                    )}
              </strong>

            </div>

            <div
              style={{
                background: "#f1faf4",
                padding: "14px",
                borderRadius: "12px",
              }}
            >

              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "12px",
                }}
              >
                Received
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "19px",
                  color: "#16803c",
                }}
              >
                ₹
                {loading
                  ? "..."
                  : money(
                      summary.totalPaid
                    )}
              </strong>

            </div>

            <div
              style={{
                background: "#fff5f5",
                padding: "14px",
                borderRadius: "12px",
              }}
            >

              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "12px",
                }}
              >
                Pending
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "19px",
                  color: "#c24141",
                }}
              >
                ₹
                {loading
                  ? "..."
                  : money(
                      summary.totalPending
                    )}
              </strong>

            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fff1f1",
              color: "#c24141",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {/* REFRESH */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >

          <h2
            style={{
              margin: 0,
            }}
          >
            Payment Records
          </h2>

          <button
            onClick={loadPayments}
            style={{
              border: "none",
              borderRadius: "10px",
              background: "#5367d9",
              color: "white",
              padding: "9px 14px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Refresh
          </button>

        </div>

        {/* PAYMENT LIST */}

        {loading ? (

          <div className="order-card">
            Loading payments...
          </div>

        ) : orders.length === 0 ? (

          <div className="order-card">

            <div className="order-info">

              <strong>
                No payment records yet
              </strong>

              <span>
                Record an order to start
                tracking payments.
              </span>

            </div>

          </div>

        ) : (

          orders.map(
            (order, index) => {

              const total =
                getTotal(order);

              const paid =
                getPaid(order);

              const pending =
                getPending(order);

              const status =
                pending === 0
                  ? "Paid"
                  : paid > 0
                  ? "Partial"
                  : "Pending";

              return (

                <div
                  className="order-card"
                  key={
                    order._id ||
                    index
                  }
                  style={{
                    display: "block",
                    marginBottom: "14px",
                  }}
                >

                  {/* CUSTOMER + TOTAL */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                    }}
                  >

                    <div className="order-info">

                      <strong>
                        {order.customerName ||
                          "Unknown Customer"}
                      </strong>

                      <span>
                        {order.product ||
                          "Product"}{" "}
                        ×{" "}
                        {order.quantity ||
                          1}
                      </span>

                    </div>

                    <strong
                      style={{
                        fontSize: "17px",
                      }}
                    >
                      ₹{money(total)}
                    </strong>

                  </div>

                  {/* PAYMENT DETAILS */}

                  <div
                    style={{
                      marginTop: "15px",
                      paddingTop: "15px",
                      borderTop:
                        "1px solid #edf0f5",
                    }}
                  >

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, 1fr)",
                        gap: "10px",
                      }}
                    >

                      <div>

                        <span
                          style={{
                            display: "block",
                            color: "#687386",
                            fontSize: "11px",
                          }}
                        >
                          Total
                        </span>

                        <strong>
                          ₹{money(total)}
                        </strong>

                      </div>

                      <div>

                        <span
                          style={{
                            display: "block",
                            color: "#687386",
                            fontSize: "11px",
                          }}
                        >
                          Received
                        </span>

                        <strong
                          style={{
                            color:
                              "#16803c",
                          }}
                        >
                          ₹{money(paid)}
                        </strong>

                      </div>

                      <div>

                        <span
                          style={{
                            display: "block",
                            color: "#687386",
                            fontSize: "11px",
                          }}
                        >
                          Pending
                        </span>

                        <strong
                          style={{
                            color:
                              pending > 0
                                ? "#c24141"
                                : "#16803c",
                          }}
                        >
                          ₹{money(pending)}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* STATUS + BUTTON */}

                  <div
                    style={{
                      marginTop: "15px",
                      paddingTop: "15px",
                      borderTop:
                        "1px solid #edf0f5",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    <span
                      style={{
                        display:
                          "inline-block",
                        padding:
                          "6px 10px",
                        borderRadius:
                          "20px",
                        background:
                          status ===
                          "Paid"
                            ? "#eaf7ef"
                            : status ===
                              "Partial"
                            ? "#fff5df"
                            : "#fff1f1",
                        color:
                          status ===
                          "Paid"
                            ? "#16803c"
                            : status ===
                              "Partial"
                            ? "#a66b00"
                            : "#c24141",
                        fontSize: "12px",
                        fontWeight:
                          "700",
                      }}
                    >
                      {status}
                    </span>

                    <button
                      onClick={() =>
                        updatePayment(
                          order
                        )
                      }
                      disabled={
                        updatingId ===
                        order._id
                      }
                      style={{
                        border: "none",
                        borderRadius:
                          "10px",
                        background:
                          "#5367d9",
                        color: "white",
                        padding:
                          "9px 14px",
                        cursor:
                          updatingId ===
                          order._id
                            ? "default"
                            : "pointer",
                        fontWeight:
                          "600",
                        opacity:
                          updatingId ===
                          order._id
                            ? 0.6
                            : 1,
                      }}
                    >
                      {updatingId ===
                      order._id
                        ? "Updating..."
                        : "Update Payment"}
                    </button>

                  </div>

                </div>
              );
            }
          )

        )}

      </main>

      {/* BOTTOM NAVIGATION */}

      <nav className="bottom-nav">

        <button
          onClick={onBack}
        >
          <span>⌂</span>
          <span>Home</span>
        </button>

        <button
          onClick={() =>
            onNavigate(
              "customers"
            )
          }
        >
          <span>👥</span>
          <span>Customers</span>
        </button>

        <button
          onClick={() =>
            onNavigate("orders")
          }
        >
          <span>📋</span>
          <span>Orders</span>
        </button>

        <button
          className="active"
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

export default Payments;