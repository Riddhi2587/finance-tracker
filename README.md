# finance-tracker
# 💰 Personal Finance Tracker

A full-stack personal finance tracker built with FastAPI and React. Track your income and expenses, set budgets, and visualize your financial data month by month.

---

## 🧰 Tech Stack

- 🐍 FastAPI (Python) – Backend API with SQLite
- ⚛️ React – Frontend interface with Chart.js visualizations
- 📊 Chart.js – For pie and doughnut charts
- 💽 SQLite – Lightweight database
- 🔄 Axios – For communicating with the backend

---

## 📁 Project Structure

finance-tracker/
├── main.py # FastAPI backend
├── finance.db # SQLite database
├── frontend/ # React frontend
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ │ └── FinanceDashboard.jsx
│ │ └── App.js
│ ├── package.json
│ └── ...
└── README.md

## Getting Started

### Backend Setup

1. Install dependencies:

pip install fastapi uvicorn sqlalchemy pydantic

Run the backend server:
uvicorn main:app --reload

Frontend Setup

Navigate to frontend directory:
cd finance-frontend

Install dependencies:
npm install

Start frontend server:
npm start

Frontend runs at: http://localhost:3000

