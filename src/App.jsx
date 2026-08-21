import { useEffect, useState } from "react";
import "./App.css";
import RecordOrder from "./RecordOrder";
import Orders from "./Orders";
import Customers from "./Customers";

function App() {
  const [screen, setScreen] = useState("home");
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // RECORD ORDER SCREEN
  if (screen === "record") {
    return (
      <RecordOrder
        onBack={() => {
          setScreen("home");
          fetchOrders();
        }}
      />
    );
  }

  // ORDERS SCREEN
  if (screen === "orders") {
    return (
      <Orders
        onBack={() => {
          setScreen("home");
          fetchOrders();
        }}
      />
    );
  }

  // CUSTOMERS SCREEN
  if (screen === "customers") {
    return (
      <Customers
        onBack={() => {
          setScreen("home");
          fetchOrders();
        }}
      />
    );
  }

  // DASHBOARD CALCULATIONS
  const totalOrders = orders.length;

  const totalValue = orders.reduce(
    (total, order) =>
      total +
      Number(order.price || 0) *
        Number(order.quantity || 1),
    0
  );

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <p className="greeting">
            Good afternoon 👋
          </p>

          <h1>BizAssist AI</h1>
        </div>

        <div className="profile">
          A
        </div>

      </header>


      <main>

        {/* WELCOME */}

        <section className="welcome-card">

          <p>Your business assistant</p>

          <h2>
            What would you like to do?
          </h2>

        </section>


        {/* QUICK ACTIONS */}

        <section className="quick-actions">

          {/* RECORD ORDER */}

          <button
            className="action-card voice"
            onClick={() => setScreen("record")}
          >

            <span className="icon">
              🎙️
            </span>

            <span>
              <strong>
                Record Order
              </strong>

              <small>
                Speak your order
              </small>
            </span>

          </button>


          {/* PHOTO */}

          <button
            className="action-card photo"
          >

            <span className="icon">
              📷
            </span>

            <span>
              <strong>
                Analyze Photo
              </strong>

              <small>
                Check a damaged item
              </small>
            </span>

          </button>


          {/* CUSTOMERS */}

          <button
            className="action-card customers"
            onClick={() =>
              setScreen("customers")
            }
          >

            <span className="icon">
              👥
            </span>

            <span>
              <strong>
                Customers
              </strong>

              <small>
                View customer history
              </small>
            </span>

          </button>


          {/* PAYMENTS */}

          <button
            className="action-card payments"
          >

            <span className="icon">
              💰
            </span>

            <span>
              <strong>
                Payments
              </strong>

              <small>
                Track pending money
              </small>
            </span>

          </button>

        </section>


        {/* STATS */}

        <section className="stats">

          <div className="stat-card">

            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Total Order Value
            </span>

            <strong>
              ₹
              {totalValue.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="stat-card warning">

            <span>
              Risk Alerts
            </span>

            <strong>
              0
            </strong>

          </div>

        </section>


        {/* RECENT ORDERS */}

        <section className="recent">

          <div className="section-heading">

            <h2>
              Recent Orders
            </h2>

            <button
              onClick={() =>
                setScreen("orders")
              }
            >
              View all
            </button>

          </div>


          {orders.length === 0 ? (

            <div className="order-card">

              <div className="order-info">

                <strong>
                  No orders yet
                </strong>

                <span>
                  Record your first order
                </span>

              </div>

            </div>

          ) : (

            orders
              .slice(0, 3)
              .map((order) => (

                <div
                  className="order-card"
                  key={order._id}
                >

                  <div className="order-info">

                    <strong>
                      {order.customerName ||
                        "Unknown Customer"}
                    </strong>

                    <span>
                      {order.quantity || 1} ×{" "}
                      {order.product ||
                        "Unknown Product"}
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

              ))

          )}

        </section>

      </main>


      {/* BOTTOM NAVIGATION */}

      <nav className="bottom-nav">

        {/* HOME */}

        <button
          className={
            screen === "home"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("home")
          }
        >
          ⌂
          <span>
            Home
          </span>
        </button>


        {/* CUSTOMERS */}

        <button
          className={
            screen === "customers"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("customers")
          }
        >
          👥
          <span>
            Customers
          </span>
        </button>


        {/* ORDERS */}

        <button
          className={
            screen === "orders"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("orders")
          }
        >
          📋
          <span>
            Orders
          </span>
        </button>


        {/* MONEY */}

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

export default App;