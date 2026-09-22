import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Try loading from datasets folder, fallback to root directory if not found
try:
    df = pd.read_csv("datasets/data.csv")
except Exception:
    try:
        df = pd.read_csv("/datasets/data.csv")
    except Exception:
        df = pd.read_csv("data.csv")

X = df[["Screen_time"]]
Y = df["Battery_used"]

X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
model = LinearRegression()
model.fit(X_train, Y_train)