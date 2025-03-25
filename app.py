import bcrypt
import jwt
import datetime
import secrets
from flask import Flask, request, jsonify
import mysql.connector
from functools import wraps

SECRET_KEY = "a3f2b4c59d6e82d34f1b8a7e60f8a2c1e9d4c7f5a3b2c6d8e0f1a4b9c3e7d6f5"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJleHAiOjE3NDIzNTI5NDV9.XVldUXyoNWVABml9tUkq8vgVb15g0hZUgyPRPjhSuZo"


app = Flask(__name__)

# MySQL Database Connection
db = mysql.connector.connect(
    host="restaurant-db.c1iyaow6qu35.ca-central-1.rds.amazonaws.com",
    user="admin",              
    password="Ontariotechu",
    database="restaurant_db",  
    port=3306                  
)

cursor = db.cursor()

@app.route("/")
def home():
    return jsonify({"message": "Restaurant Order Management API is running"}), 200

# Token verification function
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header:
            print(f"Received Authorization Header: {auth_header}")  # Debugging output

            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]  # Extract the token

        if not token:
            print("❌ No token found in the header")
            return jsonify({"error": "Token is missing!"}), 401

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            print(f"✅ Token decoded successfully: {decoded}")  # Debugging output
            request.user_id = decoded["user_id"]
        except jwt.ExpiredSignatureError:
            print("❌ Token has expired!")
            return jsonify({"error": "Token expired!"}), 401
        except jwt.InvalidTokenError:
            print("❌ Invalid Token!")
            return jsonify({"error": "Invalid Token!"}), 401

        return f(*args, **kwargs)
    return decorated

# Create new customer
@app.route("/customers", methods=["POST"])
def add_customer():
    data = request.json
    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    query = "INSERT INTO Customers (Name, Email, Phone, Address, Password) VALUES (%s, %s, %s, %s, %s)"
    values = (data["name"], data["email"], data["phone"], data["address"], hashed_password)
    cursor.execute(query, values)
    db.commit()
    return jsonify({"message": "Customer added successfully!"}), 201

# Login route
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"]
    password = data["password"]

    cursor.execute("SELECT CustomerID, Password FROM Customers WHERE Email = %s", (email,))
    user = cursor.fetchone()

    if not user:
        print("Login failed: Email not found")  # Debugging log
        return jsonify({"error": "Invalid email or password"}), 401

    user_id, hashed_password = user
    print(f"Stored Hash: {hashed_password}")  # Debugging log

    # Debug: Compare hashed password manually
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        print("Login failed: Password mismatch")  # Debugging log
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {"user_id": user_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        SECRET_KEY,
        algorithm="HS256"
    )
    return jsonify({"token": token}), 200

# Get all customers
@app.route("/customers", methods=["GET"])
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

# Get order by ID
@app.route("/orders/<int:id>", methods=["GET"])
@token_required
def get_order(id):
    cursor.execute("SELECT * FROM Orders WHERE OrderID = %s", (id,))
    order = cursor.fetchone()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({
        "OrderID": order[0],
        "CustomerID": order[1],
        "OrderDate": order[2],
        "Status": order[3],
        "TotalAmount": float(order[4])
    }), 200

if __name__ == "__main__":
    app.run(debug=True)
