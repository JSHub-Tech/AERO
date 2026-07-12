import os
import requests
from pymongo import MongoClient
from neo4j import GraphDatabase
import psycopg2
from dotenv import load_dotenv

load_dotenv()

print("----------------------------------------")
print("Testing Database Connections...")
print("----------------------------------------")

# 1. Postgres
try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    print("✅ PostgreSQL (Supabase): Live and reachable!")
    conn.close()
except Exception as e:
    print(f"❌ PostgreSQL: Connection failed: {e}")

# 2. Neo4j
try:
    driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))
    )
    driver.verify_connectivity()
    print("✅ Neo4j (Aura): Live and reachable!")
    driver.close()
except Exception as e:
    print(f"❌ Neo4j: Connection failed: {e}")

# 3. MongoDB
try:
    client = MongoClient(os.getenv("MONGODB_URI"), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ MongoDB (Atlas): Live and reachable!")
except Exception as e:
    print(f"❌ MongoDB: Connection failed: {e}")

# 4. Redis (Upstash REST)
try:
    url = f"{os.getenv('UPSTASH_REDIS_REST_URL')}/ping"
    headers = {"Authorization": f"Bearer {os.getenv('UPSTASH_REDIS_REST_TOKEN')}"}
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        print("✅ Redis (Upstash REST): Live and reachable!")
    else:
        print(f"❌ Redis: Connection failed: {res.text}")
except Exception as e:
    print(f"❌ Redis: Connection failed: {e}")

print("----------------------------------------")
