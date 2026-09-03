import { useEffect, useMemo, useState } from "react";

function Customers({ onBack, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      if (!response.ok) {
        throw new Error("Failed to load customers.");
      }

      const data = await response.json();

      setOrders(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("CUSTOMERS ERROR:", err);

      setError(
        err.message || "Could not load customers."
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

  /* =====================================================
     BUILD CUSTOMER DATA
  ===================================================== */

  const customers = useMemo(() => {
    const customerMap = {};

    orders.forEach((order) => {
      const name =
        order.customerName?.trim() ||
        "Unknown Customer";

      if (!customerMap[name]) {
        customerMap[name] = {
          name,
          orders: [],
          totalSpent: 0,
          totalPaid: 0,
          totalPending: 0,
          lastOrderDate: null,
        };
      }

      const customer = customerMap[name];

      const total = getTotal(order);
      const paid = getPaid(order);
      const pending = getPending(order);

      customer.orders.push(order);
      customer.totalSpent += total;
      customer.totalPaid += paid;
      customer.totalPending += pending;

      if (order.createdAt) {
        const date = new Date(order.createdAt);

        if (
          !customer.lastOrderDate ||
          date > customer.lastOrderDate
        ) {
          customer.lastOrderDate = date;
        }
      }
    });

    return Object.values(customerMap);
  }, [orders]);

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const filteredCustomers = useMemo(() => {
    const result = customers.filter((customer) =>
      customer.name
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );

    if (sortBy === "business") {
      result.sort(
        (a, b) =>
          b.totalSpent - a.totalSpent
      );
    }

    if (sortBy === "pending") {
      result.sort(
        (a, b) =>
          b.totalPending - a.totalPending
      );
    }

    if (sortBy === "orders") {
      result.sort(
        (a, b) =>
          b.orders.length -
          a.orders.length
      );
    }

    if (sortBy === "recent") {
      result.sort((a, b) => {
        const dateA =
          a.lastOrderDate?.getTime() || 0;

        const dateB =
          b.lastOrderDate?.getTime() || 0;

        return dateB - dateA;
      });
    }

    return result;
  }, [customers, search, sortBy]);

  const totalPending = customers.reduce(
    (sum, customer) =>
      sum + customer.totalPending,
    0
  );

  const totalBusiness = customers.reduce(
    (sum, customer) =>
      sum + customer.totalSpent,
    0
  );

  const openCustomer = (customer) => {
    setSelectedCustomer(customer);
    setError("");
  };

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

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
            Customers
          </h1>

          <p className="greeting">
            Know your customers better
          </p>

        </div>

        <div className="profile">
          👥
        </div>

      </header>

      <main>

        {/* =================================================
            SUMMARY
        ================================================= */}

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

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "12px",
            }}
          >

            <div>
              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "13px",
                }}
              >
                Customers
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "22px",
                }}
              >
                {loading
                  ? "..."
                  : customers.length}
              </strong>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "13px",
                }}
              >
                Business
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "22px",
                }}
              >
                ₹
                {loading
                  ? "..."
                  : money(totalBusiness)}
              </strong>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  color: "#687386",
                  fontSize: "13px",
                }}
              >
                Pending
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "22px",
                  color: "#c24141",
                }}
              >
                ₹
                {loading
                  ? "..."
                  : money(totalPending)}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

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

        {/* =================================================
            CUSTOMER DETAIL
        ================================================= */}

        {selectedCustomer && (

          <section
            style={{
              background:
                "linear-gradient(135deg, #f4f6ff, #ffffff)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "20px",
              border:
                "1px solid #e5e8ff",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {selectedCustomer.name}
                </h2>

                <p
                  style={{
                    color: "#687386",
                    marginTop: "5px",
                    marginBottom: 0,
                  }}
                >
                  Customer overview
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedCustomer(null)
                }
                style={{
                  border: "none",
                  background: "#eef0ff",
                  color: "#5367d9",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>

            </div>

            {/* CUSTOMER STATS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "12px",
                marginTop: "15px",
              }}
            >

              <div
                style={{
                  background: "white",
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#687386",
                    fontSize: "12px",
                  }}
                >
                  Total Orders
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "20px",
                  }}
                >
                  {selectedCustomer.orders.length}
                </strong>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#687386",
                    fontSize: "12px",
                  }}
                >
                  Total Business
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "20px",
                  }}
                >
                  ₹
                  {money(
                    selectedCustomer.totalSpent
                  )}
                </strong>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#687386",
                    fontSize: "12px",
                  }}
                >
                  Received
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "20px",
                    color: "#16803c",
                  }}
                >
                  ₹
                  {money(
                    selectedCustomer.totalPaid
                  )}
                </strong>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#687386",
                    fontSize: "12px",
                  }}
                >
                  Pending
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "20px",
                    color:
                      selectedCustomer.totalPending >
                      0
                        ? "#c24141"
                        : "#16803c",
                  }}
                >
                  ₹
                  {money(
                    selectedCustomer.totalPending
                  )}
                </strong>
              </div>

            </div>

            {/* LAST ORDER */}

            {selectedCustomer.lastOrderDate && (
              <div
                style={{
                  marginTop: "15px",
                  background: "white",
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#687386",
                    fontSize: "12px",
                  }}
                >
                  Last Order
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {selectedCustomer.lastOrderDate.toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </strong>
              </div>
            )}

            {/* ORDER HISTORY */}

            <h3
              style={{
                marginTop: "22px",
                marginBottom: "12px",
              }}
            >
              Order History
            </h3>

            {selectedCustomer.orders
              .slice()
              .sort((a, b) => {
                return (
                  new Date(
                    b.createdAt || 0
                  ) -
                  new Date(
                    a.createdAt || 0
                  )
                );
              })
              .map((order, index) => {

                const total =
                  getTotal(order);

                const paid =
                  getPaid(order);

                const pending =
                  getPending(order);

                return (
                  <div
                    key={
                      order._id ||
                      index
                    }
                    style={{
                      background: "white",
                      padding: "14px",
                      borderRadius: "12px",
                      marginBottom: "10px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                      }}
                    >

                      <div>

                        <strong>
                          {order.product ||
                            "Product"}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            color: "#687386",
                            fontSize: "13px",
                            marginTop: "4px",
                          }}
                        >
                          Quantity:{" "}
                          {order.quantity || 1}
                        </span>

                        {order.createdAt && (
                          <span
                            style={{
                              display: "block",
                              color: "#687386",
                              fontSize: "12px",
                              marginTop: "3px",
                            }}
                          >
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}

                      </div>

                      <strong>
                        ₹{money(total)}
                      </strong>

                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        fontSize: "13px",
                      }}
                    >

                      <span
                        style={{
                          color: "#687386",
                        }}
                      >
                        Paid: ₹{money(paid)}
                      </span>

                      {pending > 0 ? (
                        <span
                          style={{
                            color: "#c24141",
                            fontWeight: "600",
                          }}
                        >
                          Pending: ₹
                          {money(pending)}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#16803c",
                            fontWeight: "600",
                          }}
                        >
                          ✓ Fully Paid
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

          </section>
        )}

        {/* =================================================
            SEARCH + SORT
        ================================================= */}

        <section
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="🔍 Search customer..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >

            <button
              onClick={() =>
                setSortBy("recent")
              }
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "8px 12px",
                background:
                  sortBy === "recent"
                    ? "#5367d9"
                    : "#eef0ff",
                color:
                  sortBy === "recent"
                    ? "white"
                    : "#5367d9",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Recent
            </button>

            <button
              onClick={() =>
                setSortBy("business")
              }
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "8px 12px",
                background:
                  sortBy === "business"
                    ? "#5367d9"
                    : "#eef0ff",
                color:
                  sortBy === "business"
                    ? "white"
                    : "#5367d9",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Highest Value
            </button>

            <button
              onClick={() =>
                setSortBy("pending")
              }
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "8px 12px",
                background:
                  sortBy === "pending"
                    ? "#5367d9"
                    : "#eef0ff",
                color:
                  sortBy === "pending"
                    ? "white"
                    : "#5367d9",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Highest Pending
            </button>

            <button
              onClick={() =>
                setSortBy("orders")
              }
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "8px 12px",
                background:
                  sortBy === "orders"
                    ? "#5367d9"
                    : "#eef0ff",
                color:
                  sortBy === "orders"
                    ? "white"
                    : "#5367d9",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Most Orders
            </button>

          </div>

        </section>

        {/* =================================================
            CUSTOMER LIST
        ================================================= */}

        <section className="recent">

          <div className="section-heading">

            <div>

              <h2>
                Your Customers
              </h2>

              {!loading && (
                <span
                  style={{
                    color: "#687386",
                    fontSize: "13px",
                  }}
                >
                  {filteredCustomers.length}{" "}
                  customer
                  {filteredCustomers.length === 1
                    ? ""
                    : "s"}
                </span>
              )}

            </div>

            <button
              onClick={loadCustomers}
            >
              Refresh
            </button>

          </div>

          {loading ? (

            <div className="order-card">
              Loading customers...
            </div>

          ) : customers.length === 0 ? (

            <div className="order-card">

              <div className="order-info">

                <strong>
                  No customers yet
                </strong>

                <span>
                  Record an order to create
                  your first customer.
                </span>

              </div>

            </div>

          ) : filteredCustomers.length === 0 ? (

            <div className="order-card">

              <div className="order-info">

                <strong>
                  No customer found
                </strong>

                <span>
                  Try another customer name.
                </span>

              </div>

            </div>

          ) : (

            filteredCustomers.map(
              (customer) => (

                <button
                  key={customer.name}
                  onClick={() =>
                    openCustomer(customer)
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    background: "white",
                    borderRadius: "16px",
                    padding: "17px",
                    marginBottom: "12px",
                    boxShadow:
                      "0 2px 10px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >

                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius:
                            "50%",
                          background:
                            "#eef0ff",
                          color:
                            "#5367d9",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontWeight: "700",
                          fontSize: "18px",
                        }}
                      >
                        {customer.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <strong
                          style={{
                            display: "block",
                            fontSize: "16px",
                          }}
                        >
                          {customer.name}
                        </strong>

                        <span
                          style={{
                            color: "#687386",
                            fontSize: "13px",
                          }}
                        >
                          {customer.orders.length}{" "}
                          {customer.orders.length ===
                          1
                            ? "order"
                            : "orders"}
                        </span>

                      </div>

                    </div>

                    <span
                      style={{
                        color: "#5367d9",
                        fontWeight: "600",
                      }}
                    >
                      View →
                    </span>

                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, 1fr)",
                      gap: "10px",
                      marginTop: "14px",
                      paddingTop: "14px",
                      borderTop:
                        "1px solid #edf0f5",
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
                        Business
                      </span>

                      <strong>
                        ₹
                        {money(
                          customer.totalSpent
                        )}
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
                            customer.totalPending >
                            0
                              ? "#c24141"
                              : "#16803c",
                        }}
                      >
                        ₹
                        {money(
                          customer.totalPending
                        )}
                      </strong>

                    </div>

                  </div>

                </button>

              )
            )

          )}

        </section>

      </main>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <nav className="bottom-nav">

        <button
          onClick={onBack}
        >
          <span>⌂</span>
          <span>Home</span>
        </button>

        <button
          className="active"
          onClick={() =>
            onNavigate("customers")
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

export default Customers;