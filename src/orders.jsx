import { useEffect, useState } from "react";

function Orders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load orders"
        );
      }

      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalValue = orders.reduce(
    (total, order) =>
      total +
      Number(order.price || 0) *
        Number(order.quantity || 1),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        padding: "25px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <button
              onClick={onBack}
              style={{
                border: "none",
                background: "none",
                fontSize: "15px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              ← Back
            </button>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
              }}
            >
              Order History
            </h1>

            <p
              style={{
                color: "#687386",
                marginTop: "6px",
              }}
            >
              All orders recorded in BizAssist
            </p>
          </div>

          <button
            onClick={fetchOrders}
            style={{
              padding: "11px 18px",
              border: "none",
              borderRadius: "10px",
              background: "#5367d9",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "15px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <p
              style={{
                color: "#687386",
                margin: 0,
              }}
            >
              Total Orders
            </p>

            <h2
              style={{
                margin: "8px 0 0",
              }}
            >
              {orders.length}
            </h2>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "15px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <p
              style={{
                color: "#687386",
                margin: 0,
              }}
            >
              Total Order Value
            </p>

            <h2
              style={{
                margin: "8px 0 0",
              }}
            >
              ₹{totalValue.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fff1f1",
              color: "#c24141",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#687386",
            }}
          >
            Loading orders...
          </div>
        )}

        {/* EMPTY */}

        {!loading && orders.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "50px",
              textAlign: "center",
              borderRadius: "15px",
            }}
          >
            <div
              style={{
                fontSize: "45px",
              }}
            >
              📦
            </div>

            <h2>No orders yet</h2>

            <p
              style={{
                color: "#687386",
              }}
            >
              Record your first order using
              BizAssist.
            </p>
          </div>
        )}

        {/* ORDERS */}

        {!loading && orders.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            {orders.map((order) => (
              <div
                key={order._id}
                style={{
                  padding: "20px",
                  borderBottom:
                    "1px solid #edf0f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      {order.customerName}
                    </h3>

                    <p
                      style={{
                        margin:
                          "6px 0",
                        color: "#687386",
                      }}
                    >
                      {order.quantity} ×{" "}
                      {order.product}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <strong>
                      ₹
                      {(
                        Number(order.price || 0) *
                        Number(
                          order.quantity || 1
                        )
                      ).toLocaleString("en-IN")}
                    </strong>

                    <p
                      style={{
                        margin:
                          "6px 0 0",
                        color: "#687386",
                      }}
                    >
                      Delivery:{" "}
                      {order.deliveryDate ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    display: "inline-block",
                    padding:
                      "5px 10px",
                    borderRadius: "20px",
                    background: "#fff7e6",
                    color: "#a66a00",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {order.status ||
                    "Pending"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;