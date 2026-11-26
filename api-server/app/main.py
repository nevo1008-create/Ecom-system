import json
from threading import Thread

from flask import Flask, jsonify
from kafka import KafkaConsumer
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os
import time


app = Flask(__name__)

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27018",
)

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092",
)

def connect_to_mongodb():
    while True:
        try:
            client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,
            )

            client.admin.command("ping")

            purchases_collection = client.shop.purchases
            purchases_collection.create_index(
                "purchase_id",
                unique=True,
            )

            print("Connected to MongoDB", flush=True)
            return purchases_collection

        except Exception as error:
            print(
                f"MongoDB is not ready: {error}",
                flush=True,
            )
            time.sleep(5)


purchases = connect_to_mongodb()


def consume_purchases():
    while True:
        try:
            consumer = KafkaConsumer(
                "purchases",
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id="api-server",
                auto_offset_reset="earliest",
                enable_auto_commit=False,
            )

            print("Connected to Kafka", flush=True)

            for message in consumer:
                purchase = json.loads(
                    message.value.decode("utf-8")
                )

                try:
                    purchases.insert_one(purchase)
                except DuplicateKeyError:
                    pass

                consumer.commit()

        except Exception as error:
            print(
                f"Kafka is not ready: {error}",
                flush=True,
            )
            time.sleep(5)

@app.get("/purchases")
def get_purchases():
    return jsonify(list(purchases.find({}, {"_id": 0})))


if __name__ == "__main__":
    Thread(target=consume_purchases, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
