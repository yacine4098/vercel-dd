// /api/index.js
require('dotenv').config();

import { IncomingMessage, ServerResponse } from 'http';

// Shopify API credentials (hardcoded for now, should be environment variables)
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;



export default async (req, res) => {
    if (req.method === 'GET') {
        // Serve the form HTML on GET request
        res.setHeader('Content-Type', 'text/html');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Form</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f9f9f9;
                    }
                    h1 {
                        text-align: center;
                        margin-top: 20px;
                    }
                    .form-container {
                        width: 60%;
                        margin: 30px auto;
                        background-color: white;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    label {
                        font-size: 14px;
                        margin-bottom: 8px;
                        display: block;
                    }
                    input[type="text"], input[type="number"], input[type="submit"] {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 12px;
                        font-size: 14px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                    }
                    input[type="submit"] {
                        background-color: #4CAF50;
                        color: white;
                        cursor: pointer;
                    }
                    input[type="submit"]:hover {
                        background-color: #45a049;
                    }
                    .message {
                        padding: 10px;
                        background-color: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Order Form</h1>
                <div class="form-container">
                    <form id="orderForm">
                        <label for="name">Full Name:</label>
                        <input type="text" id="name" name="name" required>
                        <label for="phone">Phone:</label>
                        <input type="text" id="phone" name="phone" required>
                        <label for="address">Address:</label>
                        <input type="text" id="address" name="address" required>
                        <label for="province">Province:</label>
                        <input type="text" id="province" name="province" required>
                        <label for="variantId">Product Variant ID:</label>
                        <input type="text" id="variantId" name="variantId" required>
                        <label for="productTitle">Product Title:</label>
                        <input type="text" id="productTitle" name="productTitle" required>
                        <label for="quantity">Quantity:</label>
                        <input type="number" id="quantity" name="quantity" required>
                        <label for="price">Price:</label>
                        <input type="number" step="0.01" id="price" name="price" required>
                        <label for="deliveryMethod">Delivery Method:</label>
                        <input type="text" id="deliveryMethod" name="deliveryMethod" required>
                        <label for="shipmentPrice">Shipment Price:</label>
                        <input type="number" step="0.01" id="shipmentPrice" name="shipmentPrice" required>
                        <input type="submit" value="Place Order">
                    </form>
                    <div class="message" id="message" style="display:none;"></div>
                </div>

                <script>
                    document.getElementById('orderForm').addEventListener('submit', async function(event) {
                        event.preventDefault();
                        
                        const formData = new FormData(event.target);
                        const orderData = {};
                        formData.forEach((value, key) => {
                            orderData[key] = value;
                        });

                        const response = await fetch('/api', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(orderData),
                        });

                        const result = await response.json();
                        const messageDiv = document.getElementById('message');

                        if (response.ok) {
                            messageDiv.style.backgroundColor = "#d4edda";
                            messageDiv.style.color = "#155724";
                            messageDiv.innerText = 'Order placed successfully!';
                        } else {
                            messageDiv.style.backgroundColor = "#f8d7da";
                            messageDiv.style.color = "#721c24";
                            messageDiv.innerText = 'Error: ' + (result.errors ? result.errors : 'Something went wrong');
                        }

                        messageDiv.style.display = 'block';
                    });
                </script>
            </body>
            </html>
        `);
    } else if (req.method === 'POST') {
        // Handle the form submission and create the order in Shopify
        const orderData = req.body;

        const headers = {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json',
        };

        const orderPayload = {
            order: {
                customer: {
                    first_name: orderData.name,
                    phone: orderData.phone,
                },
                shipping_address: {
                    address1: orderData.address,
                    city: orderData.province,
                },
                line_items: [
                    {
                        variant_id: orderData.variantId,
                        title: orderData.productTitle,
                        quantity: orderData.quantity,
                        price: orderData.price,
                    },
                ],
                shipping_lines: [
                    {
                        title: orderData.deliveryMethod,
                        price: orderData.shipmentPrice,
                    },
                ],
            },
        };

        try {
            const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(orderPayload),
            });

            const data = await response.json();
            if (data.errors) {
                res.status(400).json({ message: 'Error creating order', errors: data.errors });
            } else {
                res.status(200).json({ message: 'Order placed successfully!', order: data });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error creating order', error });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed..' });
    }
};
