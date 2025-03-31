import os
import bcrypt
import jwt
import datetime
import secrets
from flask import Flask, request, jsonify
import mysql.connector
from functools import wraps
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "a3f2b4c59d6e82d34f1b8a7e60f8a2c1e9d4c7f5a3b2c6d8e0f1a4b9c3e7d6f5")

# Optionally set SECRET_KEY variable from config
SECRET_KEY = app.config["SECRET_KEY"]

db = mysql.connector.connect(
    host=os.getenv("DB_HOST", "abhinavsiva.mysql.pythonanywhere-services.com"),
    port=os.getenv("DB_PORT", 3306),
    user=os.getenv("DB_USER", "abhinavsiva"),
    password=os.getenv("DB_PASSWORD", "databaseclass"),
    database=os.getenv("DB_NAME", "abhinavsiva$restaurant_db")
)

cursor = db.cursor()

# Home route (API entry point)
@app.route("/api")
def home():
    return jsonify({"message": "Restaurant Order Management API is running"}), 200

# Token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            print("❌ No token found in the header")
            return jsonify({"error": "Token is missing!"}), 401

        try:
            decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            print(f"✅ Token decoded successfully: {decoded}")
            request.user_id = decoded["user_id"]
        except jwt.ExpiredSignatureError:
            print("❌ Token has expired!")
            return jsonify({"error": "Token expired!"}), 401
        except jwt.InvalidTokenError:
            print("❌ Invalid Token!")
            return jsonify({"error": "Invalid Token!"}), 401

        return f(*args, **kwargs)
    return decorated

# Create new customer (sign-up)
@app.route("/api/customers", methods=["POST"])
def add_customer():
    data = request.json
    # Check if the email already exists
    cursor.execute("SELECT * FROM customers WHERE Email = %s", (data["email"],))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({"error": "Email already registered."}), 409
    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    query = "INSERT INTO customers (Name, Email, Phone, Address, Password) VALUES (%s, %s, %s, %s, %s)"
    values = (data["name"], data["email"], data["phone"], data["address"], hashed_password)
    cursor.execute(query, values)
    db.commit()
    return jsonify({"message": "Customer added successfully!"}), 201

# Login route
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"]
    password = data["password"]

    cursor.execute("SELECT CustomerID, Password FROM customers WHERE Email = %s", (email,))
    user = cursor.fetchone()

    if not user:
        print("Login failed: Email not found")
        return jsonify({"error": "Invalid email or password"}), 401

    user_id, hashed_password = user
    print(f"Stored Hash: {hashed_password}")

    if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        print("Login failed: Password mismatch")
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {"user_id": user_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )
    return jsonify({"token": token}), 200

# Get all customers (protected)
@app.route("/api/customers", methods=["GET"])
@token_required
def get_customers():
    cursor.execute("SELECT * FROM Customers")
    customers = cursor.fetchall()
    customer_list = []
    for customer in customers:
        customer_list.append({
            "CustomerID": customer[0],
            "Name": customer[1],
            "Email": customer[2],
            "Phone": customer[3],
            "Address": customer[4]
        })
    return jsonify(customer_list), 200

# Get order by ID (protected)
@app.route("/api/orders", methods=["GET"])
@token_required
def get_orders():
    query = """
    SELECT o.OrderID, o.CustomerID, c.Name AS CustomerName, o.OrderDate, o.Status, o.TotalAmount
    FROM orders o
    JOIN customers c ON o.CustomerID = c.CustomerID
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    if not rows:
        return jsonify([]), 200

    orders = []
    for row in rows:
        orders.append({
            "OrderID": row[0],
            "CustomerID": row[1],
            "CustomerName": row[2],
            "OrderDate": row[3].isoformat() if row[3] else None,
            "Status": row[4],
            "TotalAmount": float(row[5])
        })

    return jsonify(orders), 200

# Place new order (protected)
@app.route("/api/orders", methods=["POST"])
@token_required
def create_order():
    data = request.json
    query = "INSERT INTO orders (CustomerID, OrderDate, Status, TotalAmount) VALUES (%s, %s, %s, %s)"
    values = (
        request.user_id,
        datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        data.get("status", "Pending"),
        data["total"]
    )
    cursor.execute(query, values)
    db.commit()
    return jsonify({"message": "Order created!"}), 201

# Update order status 
@app.route("/api/orders/<int:order_id>", methods=["PUT"])
@token_required
def update_order(order_id):
    data = request.json
    new_status = data.get("status")
    cursor.execute("UPDATE orders SET Status = %s WHERE OrderID = %s", (new_status, order_id))
    db.commit()
    return jsonify({"message": "Order status updated!"}), 200

# Delete order by ID
@app.route("/api/orders/<int:order_id>", methods=["DELETE"])
@token_required
def delete_order(order_id):
    cursor.execute("DELETE FROM orders WHERE OrderID = %s", (order_id,))
    db.commit()
    return jsonify({"message": "Order deleted!"}), 200

#Menu order route
@app.route("/api/menu", methods=["GET"])
@token_required
def get_menu():
    cursor.execute("SELECT * FROM menu_items")
    items = cursor.fetchall()
    menu = []
    for item in items:
        menu.append({
            "ItemID": item[0],
            "Name": item[1],
            "Description": item[2],
            "Price": float(item[3])
        })
    return jsonify(menu), 200


if __name__ == "__main__":
    app.run(debug=True)

