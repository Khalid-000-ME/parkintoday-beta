# ParkInToday - ANPR Parking System 🚗

ParkInToday is an end-to-end, automated parking management ecosystem. It uses Automatic Number Plate Recognition (ANPR) to seamlessly log vehicle entries and exits while providing users with a mobile app to track their parking sessions, find available spots, and manage their profile without needing paper tickets.

This repository contains two main components:
1. **Frontend (`/v3`)**: A React Native (Expo) mobile application for the users.
2. **Backend (`/anpr_parkintoday`)**: A Python-based computer vision engine that detects license plates in real-time, extracts the text using YOLOv8 & Microsoft TrOCR, and updates the database via a FastAPI/Ngrok bridge.

---

## 🛠 Prerequisites

To test and run this project locally, ensure you have the following installed:
- **Node.js** (v18+) and npm
- **Python** (3.9+)
- **Tesseract OCR** (System package required for `pytesseract`)
  - Mac: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr`
  - Windows: Download the Tesseract installer.
- **Expo Go** app on your physical mobile device (or an iOS/Android emulator)
- A webcam (for testing the ANPR system via your computer's camera)

---

## 🚀 How to Run the Backend (ANPR Server)

The Python backend is responsible for monitoring a live video feed, extracting license plates, and communicating with the Supabase database.

1. **Navigate to the backend directory:**
   ```bash
   cd anpr_parkintoday
   ```

2. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the `anpr_parkintoday` directory with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Note: The system also uses ngrok to expose the FastAPI webhook. Ensure ngrok is configured if required).*

4. **Start the ANPR System:**
   ```bash
   python main1.py
   ```
   - This will start a local FastAPI server, establish an ngrok tunnel, and open a live webcam feed. 
   - The system is configured to detect Indian license plate formats (e.g., `TN01AA1234`).

---

## 📱 How to Run the Frontend (Mobile App)

The mobile app provides the user interface for booking slots, viewing current parking sessions, and paying.

1. **Navigate to the app directory:**
   ```bash
   cd v3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the `v3` directory. It requires the Supabase keys and a Google Maps API key (for the map view):
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Expo Development Server:**
   ```bash
   npx expo start
   ```
   - Scan the QR code shown in the terminal using the **Expo Go** app on your phone, or press `a` for Android Emulator / `i` for iOS Simulator.

---

## 🧪 Testing the Full Flow

To see the magic happen:

1. **Start both systems:** Make sure both `python main1.py` and `npx expo start` are running.
2. **Log into the Mobile App:** Open the app and ensure you are logged into an account that has a vehicle registered.
3. **Trigger an Entry:** Hold up a picture of a license plate (e.g., `TN01AA1234`) to your computer's webcam. 
   - The Python CV window will draw a bounding box, crop the plate, correct OCR errors, and hit the Supabase database.
4. **Check the App:** The mobile app will reflect an active parking session for that vehicle, updating its status seamlessly without manual user intervention.
5. **Trigger an Exit:** Show the same license plate to the camera again to clock the vehicle out. The app will update to show the completed session and handle checkout/payment.

---

### Technologies Used
- **Frontend:** React Native, Expo, Tailwind (NativeWind)
- **Backend & CV:** Python, FastAPI, OpenCV, Ultralytics (YOLOv8), Microsoft TrOCR (`microsoft/trocr-small-printed`), Tesseract
- **Database & Auth:** Supabase (PostgreSQL)
- **Networking:** Ngrok
