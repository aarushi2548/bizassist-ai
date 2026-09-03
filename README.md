# 🚀 BizAssist AI

### An AI-powered business assistant for small businesses

BizAssist AI is an AI-powered business management application designed to help small business owners manage their **orders, customers, payments, priorities, and business information** from one place.

Instead of relying entirely on notebooks, physical ledgers, WhatsApp messages, and memory, BizAssist provides a simple digital workspace where owners can use **voice, AI, and visual inputs** to manage everyday business operations.

---

## 💡 The Problem

Small businesses often manage their daily operations manually.

A business owner may have to:

* Write customer orders in a physical register
* Search old entries to find previous customer purchases
* Remember the price offered to a customer previously
* Track pending and completed payments
* Remember which orders are urgent
* Understand information from business-related images or documents

As the number of customers and orders increases, managing everything manually becomes difficult and time-consuming.

### The question we asked:

> **What if a small business owner had a digital assistant that could remember their business information and help them manage it?**

---

# 💡 Our Solution

**BizAssist AI** brings these everyday workflows together in one application.

The owner can:

🎙️ **Record an order using voice**

📦 **Manage and track orders**

👤 **View customer history**

💰 **Track payments**

🔴 **Identify priority orders**

🤖 **Ask BizAssist questions**

📸 **Analyze business-related images**

The goal is simple:

> **Less manual record keeping. More time running the business.**

---

# ✨ Key Features

## 🎙️ Voice Order Recording

Instead of manually typing every order, the owner can record an order using their voice.

BizAssist processes the voice input and extracts important information such as:

* Customer name
* Product
* Quantity
* Price
* Delivery date
* Original voice text

This makes order entry faster and more natural.

---

## 📦 Order Management

All business orders are organized in one place.

Owners can view:

* Customer
* Product
* Quantity
* Price
* Delivery information
* Order status
* Payment status

This provides a centralized alternative to searching through physical registers.

---

## 👤 Customer History

BizAssist keeps previous customer orders accessible.

For example, a business owner can check:

> **"Bhaiya, pehle aapne ye tank kis rate mein diya tha?"**

Instead of searching through old ledger pages, the owner can quickly check previous orders and pricing information.

This can also help when negotiating with customers or suppliers.

---

## 💰 Payment Tracking

BizAssist helps owners keep track of payments associated with orders.

Payment information can include:

* Amount paid
* Remaining amount
* Payment status
* Pending payments
* Partial payments
* Completed payments

### Future scope

The system can be extended to support direct digital payment requests and automated payment reminders.

---

## 🔴 Priority Orders

Some orders need attention before others.

The **Priority Orders** section helps highlight important orders so that the owner can focus on what needs to be handled first.

---

## 🤖 Ask BizAssist

**Ask BizAssist** provides a conversational interface for interacting with the business assistant.

Instead of navigating through multiple sections, the owner can use natural language to interact with BizAssist.

The feature is designed around the idea of making business information easier to access for non-technical users.

---

## 📸 Photo Analysis

BizAssist can analyze uploaded images using AI.

This creates a foundation for helping businesses extract useful information from visual inputs such as business-related documents, products, or other images.

---

# 🧠 Where AI Fits

BizAssist uses AI where it can reduce manual work.

```text
Voice Input
     ↓
AI Processing
     ↓
Structured Order Information
     ↓
Business Records
```

And:

```text
Image
  ↓
AI Image Analysis
  ↓
Useful Business Information
```

The objective is not to add AI simply for the sake of using AI.

**AI is used as an interface between the business owner and their data.**

---

# 🏗️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### AI

* Google Gemini
* Hugging Face Inference

### Additional Technologies

* Multer
* CORS
* dotenv

---

# 🔄 Application Flow

```text
                 Business Owner
                       │
             Voice / Text / Image
                       │
                       ▼
                ┌─────────────┐
                │  BizAssist  │
                │     AI      │
                └──────┬──────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Orders       Customers    Payments
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                   MongoDB
                       │
                       ▼
              Business Dashboard
```

---

# 📂 Project Structure

```text
bizassist-ai/
│
├── public/
│
├── server/
│   ├── models/
│   │   └── order.js
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── src/
│   ├── PriorityOrders.jsx
│   ├── askBizassist.jsx
│   ├── business.advisor.jsx
│   ├── customers.jsx
│   ├── insights.jsx
│   ├── orders.jsx
│   ├── payments.jsx
│   ├── photoanalysis.jsx
│   ├── RecordOrder.jsx
│   └── ...
│
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

# 🛠️ Getting Started

## Prerequisites

Install the following:

* Node.js
* npm
* MongoDB Atlas account
* Gemini API credentials
* Hugging Face credentials if required by the image-analysis configuration

---

## 1. Clone the Repository

```bash
git clone https://github.com/aarushi2548/bizassist-ai.git
cd bizassist-ai
```

---

## 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 4. Configure Environment Variables

Create the required `.env` file inside the `server` directory.

Example:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Add any additional AI credentials required by the current backend configuration.

### ⚠️ Important

**Never commit your `.env` file or API keys to GitHub.**

The repository ignores:

```text
.env
server/.env
```

---

## 5. Start the Backend

From the `server` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

---

## 6. Start the Frontend

Open another terminal and return to the project root:

```bash
cd ..
npm run dev
```

Vite will display the local development URL in the terminal.

---

# 🧪 Available Frontend Commands

### Start development server

```bash
npm run dev
```

### Build the application

```bash
npm run build
```

### Run ESLint

```bash
npm run lint
```

### Preview production build

```bash
npm run preview
```

---

# 🔐 Security

BizAssist uses environment variables for sensitive configuration.

The public repository should never contain:

* API keys
* MongoDB credentials
* Passwords
* Private credentials
* `.env` files

Sensitive environment files are excluded through `.gitignore`.

---

# 🎥 Demo

The BizAssist demo follows a realistic small-business scenario:

```text
Voice Order
     ↓
Order Saved
     ↓
Customer History
     ↓
Check Previous Price
     ↓
Payment Tracking
     ↓
Priority Orders
     ↓
Ask BizAssist
     ↓
Photo Analysis
```

The demonstration focuses on a simple idea:

> **A business owner should spend less time managing records and more time running the business.**

---

# 🚀 Future Scope

BizAssist can be extended with:

* Direct digital payment requests
* Automated payment reminders
* Invoice generation
* Inventory management
* Sales analytics
* Sales forecasting
* WhatsApp integration
* Multilingual voice interaction
* Better regional-language support
* Advanced document understanding
* Automated business insights

### Long-term Vision

The goal is to evolve BizAssist from a business record-management tool into a **digital operating assistant for small businesses**.

---

# 🏆 Built for Razorpay Buildathon

BizAssist AI explores how **AI can simplify everyday operational and financial workflows for small businesses**.

The project focuses on combining:

**AI + Voice + Business Data + Payment Tracking + Automation**

to create a practical assistant for businesses that traditionally rely on manual record keeping.

---

# 👩‍💻 Author

**Aarushi Singhal**

B.Tech Information Technology

---

## 📌 Project Status

**MVP completed and demo-ready.**

BizAssist currently focuses on demonstrating the core workflow of managing business orders, customers, payments, priorities, and AI-powered interactions from a single application.
