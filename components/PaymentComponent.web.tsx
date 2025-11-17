import React from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

interface PaymentComponentProps {
  razorpayKeyId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const useRazorpayPayment = () => {
  const handlePayment = async ({ razorpayKeyId, amount, onSuccess, onError }: PaymentComponentProps) => {
    if (!razorpayKeyId) {
      Alert.alert(
        "Configuration Error",
        "Razorpay Key ID not found. Please check your environment configuration.",
        [{ text: "OK" }]
      );
      return;
    }

    // Create a simple HTML page with Razorpay checkout for web
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ParkinToday Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            text-align: center;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            margin: 50px auto;
          }
          .btn {
            background: #3395ff;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
          }
          .btn:hover { background: #2980ff; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>ParkinToday Payment</h2>
          <p>Amount: ₹${(amount / 100).toFixed(2)}</p>
          <p>Parking Payment</p>
          <button class="btn" onclick="startPayment()">Pay with Razorpay</button>
        </div>
        
        <script>
          function startPayment() {
            var options = {
              "key": "${razorpayKeyId}",
              "amount": ${amount},
              "currency": "INR",
              "name": "ParkinToday",
              "description": "Parking Payment",
              "image": "https://i.imgur.com/3g7nmJC.png",
              "handler": function (response) {
                alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
                window.close();
              },
              "prefill": {
                "name": "Customer",
                "email": "customer@example.com",
                "contact": "9999999999"
              },
              "theme": {
                "color": "#3395ff"
              }
            };
            var rzp = new Razorpay(options);
            rzp.open();
          }
          
          // Auto-start payment when page loads
          window.onload = function() {
            setTimeout(startPayment, 1000);
          };
        </script>
      </body>
      </html>
    `;

    try {
      // Open Razorpay checkout in web browser
      const result = await WebBrowser.openBrowserAsync('data:text/html;base64,' + btoa(htmlContent), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#3395ff',
      });

      if (result.type === 'cancel') {
        onError("Payment was cancelled");
      } else {
        // For demo purposes, simulate success
        Alert.alert(
          "Payment Demo",
          "This is a demo payment. In production, you would handle the actual Razorpay response.",
          [
            {
              text: "Simulate Success",
              onPress: onSuccess
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onError("Failed to open payment gateway. Please try again.");
    }
  };

  return { handlePayment };
};
