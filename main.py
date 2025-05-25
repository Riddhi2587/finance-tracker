from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DATABASE SETUP ----------
DATABASE_URL = "sqlite:///./finance.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime)
    amount = Column(Float)
    category = Column(String)
    type = Column(String)  # income or expense
    description = Column(String, default="")
    is_fixed_income = Column(Boolean, default=False)  # New field to track fixed income

class FixedIncomeDB(Base):
    __tablename__ = "fixed_income"

    id = Column(String, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String, default="")
    category = Column(String, default="Salary")

Base.metadata.create_all(bind=engine)

# ---------- MODELS ----------
class Transaction(BaseModel):
    id: str
    date: datetime
    amount: float
    category: str
    type: str  # 'income' or 'expense'
    description: str = ""

    class Config:
        orm_mode = True

class TransactionInput(BaseModel):
    date: datetime
    amount: float
    category: str
    type: str
    description: str = ""

class Budget(BaseModel):
    category: str
    limit: float

class FixedIncome(BaseModel):
    id: str
    amount: float
    description: str = ""
    category: str = "Salary"

    class Config:
        orm_mode = True

class FixedIncomeInput(BaseModel):
    amount: float
    description: str = ""
    category: str = "Salary"

budgets = {}

# Store fixed income in memory (could be moved to database in future)
fixed_income = None

# ---------- ROUTES ----------
@app.post("/transactions/", response_model=Transaction)
def add_transaction(txn: TransactionInput):
    if txn.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    db = SessionLocal()
    new_txn = TransactionDB(
        id=str(uuid4()),
        **txn.dict(),
        is_fixed_income=False  # All manually added transactions are variable by default
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    db.close()
    return new_txn

@app.get("/transactions/", response_model=List[Transaction])
def get_transactions():
    db = SessionLocal()
    txns = db.query(TransactionDB).all()
    db.close()
    return txns

@app.get("/transactions/summary")
def transaction_summary():
    db = SessionLocal()
    txns = db.query(TransactionDB).all()
    fixed_income = db.query(FixedIncomeDB).first()
    db.close()
    
    variable_income = sum(t.amount for t in txns if t.type == "income" and not t.is_fixed_income)
    fixed_income_amount = fixed_income.amount if fixed_income else 0
    total_income = variable_income + fixed_income_amount
    expenses = sum(t.amount for t in txns if t.type == "expense")
    
    return {
        "fixed_income": fixed_income_amount,
        "variable_income": variable_income,
        "total_income": total_income,
        "total_expense": expenses,
        "balance": total_income - expenses
    }

@app.post("/budget/")
def set_budget(budget: Budget):
    budgets[budget.category] = budget.limit
    return {"message": f"Budget set for {budget.category}"}

@app.get("/budget/")
def get_budgets():
    return budgets

@app.get("/budget/status")
def budget_status():
    db = SessionLocal()
    txns = db.query(TransactionDB).all()
    db.close()
    status = {}
    for category, limit in budgets.items():
        spent = sum(t.amount for t in txns if t.category == category and t.type == "expense")
        status[category] = {"limit": limit, "spent": spent, "remaining": limit - spent}
    return status

@app.post("/fixed-income/", response_model=FixedIncome)
def set_fixed_income(income: FixedIncomeInput):
    db = SessionLocal()
    
    # Delete existing fixed income if any
    db.query(FixedIncomeDB).delete()
    
    # Create new fixed income
    new_fixed_income = FixedIncomeDB(
        id=str(uuid4()),
        **income.dict()
    )
    db.add(new_fixed_income)
    db.commit()
    db.refresh(new_fixed_income)
    db.close()
    return new_fixed_income

@app.get("/fixed-income/")
def get_fixed_income():
    db = SessionLocal()
    fixed_income = db.query(FixedIncomeDB).first()
    db.close()
    return fixed_income

