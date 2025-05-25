import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Card({ children, style, className }) {
  return (
    <div style={{ backgroundColor: '#232733', borderRadius: 8, padding: 16, marginBottom: 16, ...style }} className={className}>
      {children}
    </div>
  );
}

function Button({ children, onClick, style, className }) {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: '#3b82f6', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'white', cursor: 'pointer', ...style }}
      className={className}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, name, placeholder, style, className }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ backgroundColor: '#181c23', color: 'white', border: '1px solid #444', borderRadius: 6, padding: 8, ...style }}
      className={className}
    />
  );
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [form, setForm] = useState({ amount: '', category: '', type: 'expense', description: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const API = 'http://localhost:8000';

  const fetchData = async () => {
    const txns = await axios.get(`${API}/transactions/`);
    const sum = await axios.get(`${API}/transactions/summary`);
    setTransactions(txns.data);
    setSummary(sum.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter transactions by selected month
  const filteredTransactions = transactions.filter(t => {
    const txnDate = new Date(t.date);
    return txnDate.getMonth() === selectedMonth;
  });

  // Pie chart for income vs expenses
  const pieData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [summary.total_income, summary.total_expense],
        backgroundColor: ['#3b82f6', '#64748b'],
        borderWidth: 0,
      },
    ],
  };

  // Donut chart for expense categories
  const expenseCategories = {};
  filteredTransactions.forEach(t => {
    if (t.type === 'expense') {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    }
  });
  const donutData = {
    labels: Object.keys(expenseCategories),
    datasets: [
      {
        data: Object.values(expenseCategories),
        backgroundColor: ['#334155', '#64748b', '#94a3b8', '#0ea5e9', '#f59e42'],
        borderWidth: 0,
      },
    ],
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString(),
    };
    await axios.post(`${API}/transactions/`, payload);
    setForm({ amount: '', category: '', type: 'expense', description: '' });
    fetchData();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#181c23', color: 'white', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 192, backgroundColor: '#11141a', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(i)}
            style={{
              textAlign: 'left',
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: selectedMonth === i ? '#232733' : 'transparent',
              fontWeight: selectedMonth === i ? 'bold' : 'normal',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: 40, maxWidth: 1024, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 32 }}>Personal Finance Tracker</h1>
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: 12, color: '#9ca3af', letterSpacing: 2 }}>Income</div>
            <div style={{ fontSize: 40, fontWeight: 'bold', marginTop: 4, marginBottom: 16 }}>${summary.total_income.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: 12, color: '#9ca3af', letterSpacing: 2 }}>Expenses</div>
            <div style={{ fontSize: 40, fontWeight: 'bold', marginTop: 4, marginBottom: 16 }}>${summary.total_expense.toLocaleString()}</div>
          </div>
          <Button style={{ marginLeft: 32, padding: '8px 24px', borderRadius: 8, backgroundColor: '#232733', border: '1px solid #999', color: 'white', cursor: 'pointer' }}>
            Edit Income/Expenses
          </Button>
        </div>
        <div style={{ display: 'flex', gap: 48, marginBottom: 48 }}>
          <div style={{ width: 256 }}>
            <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span> Income
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#64748b', display: 'inline-block' }}></span> Expenses
              </div>
            </div>
          </div>
          <div style={{ width: 256 }}>
            <Doughnut data={donutData} options={{ plugins: { legend: { display: false } } }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {Object.keys(expenseCategories).map((cat, idx) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: donutData.datasets[0].backgroundColor[idx % donutData.datasets[0].backgroundColor.length],
                    display: 'inline-block'
                  }} />
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Add Transaction Form */}
        <Card>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Add Transaction</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              style={{ backgroundColor: '#181c23', color: 'white' }}
            />
            <Input
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              style={{ backgroundColor: '#181c23', color: 'white' }}
            />
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              style={{ borderRadius: 8, padding: 8, backgroundColor: '#181c23', color: 'white', border: '1px solid #444' }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <Input
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={{ backgroundColor: '#181c23', color: 'white' }}
            />
          </div>
          <Button onClick={handleSubmit} style={{ marginTop: 16 }}>
            Add
          </Button>
        </Card>
        {/* Transactions List */}
        <Card>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Transactions</h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {filteredTransactions.map(t => (
              <li key={t.id} style={{ borderBottom: '1px solid #444', padding: '8px 0' }}>
                <strong>{t.type.toUpperCase()}</strong> - ${t.amount} - {t.category} <br />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{t.description}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
