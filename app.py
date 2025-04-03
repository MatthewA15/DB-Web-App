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

# Load environment variables from .env
load_dotenv()

app = Flask(__name__, static_folder="frontend/build", static_url_path="")
CORS(app)

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

@app.route("/")
def serve_react():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

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

    # First try finding in customers table
    cursor.execute("SELECT CustomerID, Password FROM customers WHERE Email = %s", (email,))
    user = cursor.fetchone()

    if user:
        user_id, hashed_password = user
        user_type = "customer"
    else:
        # Try finding in staff table
        cursor.execute("SELECT StaffID, Password FROM staff WHERE Email = %s", (email,))
        user = cursor.fetchone()
        if user:
            user_id, hashed_password = user
            user_type = "staff"
        else:
            print("Login failed: Email not found in both tables")
            return jsonify({"error": "Invalid email or password"}), 401

    print(f"Stored Hash for {user_type}: {hashed_password}")
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        print("Login failed: Password mismatch")
        return jsonify({"error": "Invalid email or password"}), 401

    # If password check passed
    token = jwt.encode(
        {"user_id": user_id, "user_type": user_type, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
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
    items = data.get("items", [])

    # Insert order
    query = """
        INSERT INTO orders (CustomerID, OrderDate, Status, TotalAmount)
        VALUES (%s, %s, %s, %s)
    """
    values = (
        request.user_id,
        datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        data.get("status", "Pending"),
        data["total"]
    )
    cursor.execute(query, values)
    db.commit()

    order_id = cursor.lastrowid

    # Insert order items
    for item in items:
        menu_item_id = item.get("MenuItemID")
        quantity = item.get("Quantity")
        if menu_item_id and quantity:
            cursor.execute(
                """
                INSERT INTO order_items (OrderID, MenuItemID, Quantity)
                VALUES (%s, %s, %s)
                """,
                (order_id, menu_item_id, quantity)
            )

    db.commit()
    return jsonify({"message": "Order with items created!"}), 201


# Adds item to existing order
@app.route("/api/orders/<int:order_id>/items", methods=["POST"])
@token_required
def add_order_item(order_id):
    data = request.json
    menu_item_id = data.get("MenuItemID")
    quantity = data.get("Quantity")

    if not menu_item_id or not quantity:
        return jsonify({"error": "Missing menu item ID or quantity"}), 400

    cursor.execute(
        """
        INSERT INTO order_items (OrderID, MenuItemID, Quantity)
        VALUES (%s, %s, %s)
        """,
        (order_id, menu_item_id, quantity)
    )
    db.commit()
    return jsonify({"message": "Order item added!"}), 201

#delete an item from the order
@app.route("/api/orders/<int:order_id>/items/<int:item_id>", methods=["DELETE"])
@token_required
def delete_order_item(order_id, item_id):
    cursor.execute("DELETE FROM order_items WHERE OrderID = %s AND OrderItemID = %s", (order_id, item_id))
    db.commit()
    return jsonify({"message": "Order item deleted!"}), 200


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
    cursor.execute("SELECT * FROM menuitems")
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

#Staff login route
@app.route("/api/staff/login", methods=["POST"])
def staff_login():
    data = request.json
    username = data["username"]
    password = data["password"]

    cursor.execute("SELECT StaffID, Password FROM staff WHERE Username = %s", (username,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    staff_id, hashed_pw = user
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_pw.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {"staff_id": staff_id, "role": "staff", "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )
    return jsonify({"token": token}), 200

#feedback route
@app.route("/api/feedback", methods=["POST"])
@token_required
def submit_feedback():
    data = request.json
    order_id = data.get("order_id")
    rating = data.get("rating")
    comments = data.get("comments")

    if not order_id or not rating or not comments:
        return jsonify({"error": "Order ID, rating, and comments are required"}), 400

    cursor.execute(
        "INSERT INTO feedback (CustomerID, OrderID, Rating, Comments) VALUES (%s, %s, %s, %s)",
        (request.user_id, order_id, rating, comments)
    )
    db.commit()

    return jsonify({"message": "Feedback submitted successfully!"}), 201

#
@app.route("/api/payments", methods=["POST"])
@token_required
def submit_payment():
    data = request.json
    order_id = data.get("order_id")
    amount = data.get("amount")
    method = data.get("method")

    if not order_id or not amount or not method:
        return jsonify({"error": "Missing fields"}), 400

    cursor.execute(
        "INSERT INTO payments (OrderID, Amount, PaymentDate, PaymentMethod) VALUES (%s, %s, NOW(), %s)",
        (order_id, amount, method)
    )
    db.commit()

    return jsonify({"message": "✅ Payment recorded (mock)!"}), 201

if __name__ == "__main__":
    app.run(debug=True)

