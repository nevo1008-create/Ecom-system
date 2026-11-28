import json
import os
import time
from datetime import UTC, datetime
from uuid import uuid4

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from kafka.errors import KafkaError

from kafka import KafkaProducer

app = Flask(__name__)
CORS(app)

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092",
)

API_SERVER_URL = os.getenv(
    "API_SERVER_URL",
    "http://localhost:5000",
)

def connect_to_kafka():
    while True:
        try:
            kafka_producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda value: json.dumps(
                    value
                ).encode("utf-8"),
            )

            print("Connected to Kafka", flush=True)
            return kafka_producer

        except KafkaError as error:
            print(
                f"Kafka is not ready: {error}",
                flush=True,
            )
            time.sleep(5)


producer = connect_to_kafka()


@app.post("/buy")
def buy():
    data = request.get_json()

    purchase = {
        "purchase_id": str(uuid4()),
        "user_id": data["user_id"],
        "item_name": data["item_name"],
        "price": data["price"],
        "quantity": data["quantity"],
        "total_price": data["price"] * data["quantity"],
        "created_at": datetime.now(UTC).isoformat(),
    }

    producer.send("purchases", purchase).get(timeout=10)

    return jsonify({
        "message": "Purchase received",
        "purchase_id": purchase["purchase_id"],
    }), 201


@app.get("/purchases")
def get_purchases():
    response = requests.get(
        f"{API_SERVER_URL}/purchases",
        timeout=10,
    )

    return jsonify(response.json()), response.status_code

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
