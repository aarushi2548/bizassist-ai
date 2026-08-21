import { useEffect, useState } from "react";

function Customers({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      console.log("ORDERS FROM DATABASE:", data);

      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setLoading(false);
    }
  };

  // Create unique customers
  const customers = [];

  orders.forEach((order) => {
    const name = order.customerName || "Unknown Customer";

    let customer = customers.find(
      (item) => item.name === name
    );

    const orderValue =
      Number(order.price || 0) *
      Number(order.quantity || 1);

    if (!customer) {
      customer = {
        name: name,
        orders: [],
        total: 0,
      };

      customers.push(customer);
    }

    customer.orders.push(order);
    customer.total += orderValue;
  });

  // -------------------------
  // CUSTOMER DETAIL SCREEN
  // -------------------------

  if (selectedCustomer) {
    return (
      <div className="app">

        <header className="header">

          <div>

            <button
              onClick={() => setSelectedCustomer(null)}
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
              {selectedCustomer.name}
            </h1>

            <p className="greeting">
              Customer History
            </p>

          </div>

          <div className="profile">
            {selectedCustomer.name
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>


        <main>

          {/* SUMMARY */}

          <section className="stats">

            <div className="stat-card">

              <span>
                Total Orders
              </span>

              <strong>
                {selectedCustomer.orders.length}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                Total Spent
              </span>

              <strong>
                ₹
                {selectedCustomer.total.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </section>


          {/* ORDER HISTORY */}

          <section className="recent">

            <div className="section-heading">

              <h2>
                Order History
              </h2>

            </div>


            {selectedCustomer.orders.length === 0 ? (

              <div className="order-card">

                <div className="order-info">

                  <strong>
                    No orders found
                  </strong>

                </div>

              </div>

            ) : (

              selectedCustomer.orders.map(
                (order) => (

                  <div
                    className="order-card"
                    key={order._id}
                  >

                    <div className="order-info">

                      <strong>
                        {order.product ||
                          "Product not specified"}
                      </strong>

                      <span>
                        Quantity:{" "}
                        {order.quantity || 1}
                      </span>

                      <span>
                        Price per unit: ₹
                        {Number(
                          order.price || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      <span>
                        Delivery:{" "}
                        {order.deliveryDate ||
                          "Not specified"}
                      </span>

                    </div>


                    <div className="order-price">

                      ₹
                      {(
                        Number(
                          order.price || 0
                        ) *
                        Number(
                          order.quantity || 1
                        )
                      ).toLocaleString(
                        "en-IN"
                      )}

                    </div>

                  </div>

                )
              )

            )}

          </section>

        </main>


        <nav className="bottom-nav">

          <button onClick={onBack}>
            ⌂
            <span>
              Home
            </span>
          </button>

          <button className="active">
            👥
            <span>
              Customers
            </span>
          </button>

          <button>
            📋
            <span>
              Orders
            </span>
          </button>

          <button>
            💰
            <span>
              Money
            </span>
          </button>

        </nav>

      </div>
    );
  }


  // -------------------------
  // CUSTOMER LIST
  // -------------------------

  return (
    <div className="app">

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
            Your customer history
          </p>

        </div>

        <div className="profile">
          A
        </div>

      </header>


      <main>

        {loading ? (

          <div className="welcome-card">
            <h2>
              Loading customers...
            </h2>
          </div>

        ) : customers.length === 0 ? (

          <div className="welcome-card">

            <div style={{ fontSize: "45px" }}>
              👥
            </div>

            <h2>
              No customers yet
            </h2>

            <p>
              Customers will appear here
              after you record orders.
            </p>

          </div>

        ) : (

          <section>

            <h2>
              {customers.length} Customer
              {customers.length !== 1
                ? "s"
                : ""}
            </h2>


            {customers.map((customer) => (

              <button
                key={customer.name}
                onClick={() =>
                  setSelectedCustomer(customer)
                }
                style={{
                  width: "100%",
                  border: "none",
                  background: "white",
                  textAlign: "left",
                  cursor: "pointer",
                  marginBottom: "12px",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >

                <div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: "17px",
                    }}
                  >
                    {customer.name}
                  </strong>

                  <span
                    style={{
                      color: "#687386",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {customer.orders.length} order
                    {customer.orders.length !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>


                <div
                  style={{
                    fontWeight: "600",
                  }}
                >

                  ₹
                  {customer.total.toLocaleString(
                    "en-IN"
                  )}

                  <span
                    style={{
                      marginLeft: "8px",
                    }}
                  >
                    →
                  </span>

                </div>

              </button>

            ))}

          </section>

        )}

      </main>


      <nav className="bottom-nav">

        <button onClick={onBack}>
          ⌂
          <span>
            Home
          </span>
        </button>

        <button className="active">
          👥
          <span>
            Customers
          </span>
        </button>

        <button>
          📋
          <span>
            Orders
          </span>
        </button>

        <button>
          💰
          <span>
            Money
          </span>
        </button>

      </nav>

    </div>
  );
}

export default Customers;