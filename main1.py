import cv2
import threading
import time
import re
import os
import uvicorn
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
from ultralytics import YOLO
import pytesseract
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# -------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Rate per minute (INR)
PARKING_RATE = 0.667

# Models
VEHICLE_MODEL_PATH = "yolov8n.pt"
PLATE_MODEL_PATH = "./models/LP-detection.pt"

# Camera Settings
CAMERA_INDEX = 0
CAM_WIDTH = 640
CAM_HEIGHT = 480

# OCR Settings
OCR_CONFIG = "--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

# -------------------------------------------------------------------
# GLOBAL STATE
# -------------------------------------------------------------------
class State:
    def __init__(self):
        self.processed_exits = {}  # plate -> timestamp
        self.last_cleanup = time.time()

state = State()

# -------------------------------------------------------------------
# SUPABASE INIT
# -------------------------------------------------------------------
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("âœ… Supabase Client Initialized")
except Exception as e:
    print(f"âš ï¸ Supabase Init Failed: {e}")
    supabase = None

# -------------------------------------------------------------------
# FASTAPI SERVER SETUP
# -------------------------------------------------------------------
app = FastAPI(title="ANPR Real-time API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EntryRequest(BaseModel):
    vehicle_number: str
    user_id: str
    lot_id: str

@app.get("/")
def root():
    return {"message": "ANPR Traffic Controller Running"}

@app.post("/start_parking")
def start_parking(entry: EntryRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        existing = supabase.table('bookings').select("*") \
            .eq('vehicle_number', entry.vehicle_number) \
            .eq('status', 'active') \
            .execute()

        if existing.data:
            return {"message": "Vehicle already parked", "booking": existing.data[0]}

        data = {
            "vehicle_number": entry.vehicle_number,
            "user_id": entry.user_id,
            "lot_id": entry.lot_id,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "status": "pending_entry",
            "amount": 0
        }

        res = supabase.table('bookings').insert(data).execute()

        # reset cache so entry can be detected
        state.processed_exits.pop(entry.vehicle_number, None)

        return {"message": "Waiting for vehicle entry", "booking": res.data[0]}

    except Exception as e:
        print(f"âŒ Error starting parking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def start_server():
    port = 8000
    try:
        public_url = ngrok.connect(port).public_url
        print(f"\nðŸš€ Ngrok Tunnel Started: {public_url}")
        print(f"ðŸ“¡ API Endpoint: {public_url}/start_parking")
    except Exception as e:
        print(f"âŒ Ngrok Error: {e}")

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="error")

# -------------------------------------------------------------------
# PLATE CLEANING & VALIDATION
# -------------------------------------------------------------------
def clean_plate(text):
    text = text.upper()
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def fix_plate_chars(text):
    n = len(text)
    if n not in (9, 10):
        return text

    dict_char_to_int = {'O': '0', 'I': '1', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'Z': '2', 'B': '8'}
    dict_int_to_char = {'0': 'O', '1': 'I', '3': 'J', '4': 'A', '6': 'G', '5': 'S', '8': 'B'}

    text_list = list(text)

    if n == 10:
        # Format: AA-00-AA-0000  (2 state + 2 dist + 2 series + 4 num)
        letter_positions = [0, 1, 4, 5]
        digit_positions  = [2, 3, 6, 7, 8, 9]
    else:  # n == 9
        # Format: AA-00-A-0000   (2 state + 2 dist + 1 series + 4 num)
        letter_positions = [0, 1, 4]
        digit_positions  = [2, 3, 5, 6, 7, 8]

    for i in letter_positions:
        if text_list[i] in dict_int_to_char:
            text_list[i] = dict_int_to_char[text_list[i]]
    for i in digit_positions:
        if text_list[i] in dict_char_to_int:
            text_list[i] = dict_char_to_int[text_list[i]]

    return "".join(text_list)

VALID_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH",
    "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB",
    "AN", "CH", "DN", "DD", "DL", "JK", "LA", "LD", "PY", "BH"
}

def validate_plate(plate):
    # Accepts both 9-char (1 series letter) and 10-char (2 series letters)
    pattern = r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"
    if not re.match(pattern, plate):
        return False
    if plate[:2] not in VALID_STATE_CODES:
        return False
    return True

# -------------------------------------------------------------------
# MAIN BUSINESS LOGIC (ENTRY/EXIT)
# -------------------------------------------------------------------
def handle_detection(plate_text):
    if not supabase:
        return

    now = time.time()

    # cooldown to avoid repeated triggers
    if plate_text in state.processed_exits:
        last_time = state.processed_exits[plate_text]
        if (now - last_time) < 45:
            print(f"â³ Skipping {plate_text} (Recently Processed)")
            return
        else:
            del state.processed_exits[plate_text]

    try:
        # 1. Pending Entry Check
        pending = supabase.table('bookings').select("*") \
            .eq('vehicle_number', plate_text) \
            .eq('status', 'pending_entry') \
            .execute()

        if pending.data:
            booking = pending.data[0]
            print(f"âœ… ENTRY CONFIRMED: {plate_text}. Activating session.")

            now_iso = datetime.now(timezone.utc)

            supabase.table('bookings').update({
                "status": "active",
                "start_time": now_iso.isoformat()
            }).eq('id', booking['id']).execute()

            state.processed_exits[plate_text] = time.time()
            return

        # 2. Active Booking Check (Exit)
        response = supabase.table('bookings').select("*") \
            .eq('vehicle_number', plate_text) \
            .eq('status', 'active') \
            .execute()

        if response.data:
            booking = response.data[0]
            booking_id = booking['id']

            start_time = datetime.fromisoformat(booking['start_time'].replace('Z', '+00:00'))
            now_dt = datetime.now(timezone.utc)

            duration_seconds = (now_dt - start_time).total_seconds()

            # prevent immediate exit detection
            if duration_seconds < 30:
                print(f"âš ï¸ {plate_text}: Detected too soon after entry ({duration_seconds}s). Ignoring.")
                return

            minutes_parked = duration_seconds / 60
            amount = max(1, int(round(minutes_parked * PARKING_RATE)))

            print(f"ðŸš— EXIT DETECTED: {plate_text}. Duration: {minutes_parked:.1f}m. Fee: â‚¹{amount}")

            update_data = {
                "end_time": now_dt.isoformat(),
                "status": "exit_detected",
                "amount": amount
            }

            supabase.table('bookings').update(update_data).eq('id', booking_id).execute()

            state.processed_exits[plate_text] = time.time()

            # cleanup cache every 60 seconds
            if time.time() - state.last_cleanup > 60:
                state.processed_exits.clear()
                state.last_cleanup = time.time()

        else:
            # no booking found
            pass

    except Exception as e:
        print(f"âŒ Logic Error: {e}")

# -------------------------------------------------------------------
# OCR USING PYTESSERACT
# -------------------------------------------------------------------
def ocr_plate(plate_crop):
    try:
        # Guard: skip crops too small for reliable OCR
        h, w = plate_crop.shape[:2]
        if h < 10 or w < 20:
            return None, None

        # Convert to grayscale only if BGR (3 channels)
        if len(plate_crop.shape) == 3 and plate_crop.shape[2] == 3:
            gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        else:
            gray = plate_crop  # already single-channel

        # Upscale for better Tesseract accuracy (min 100px tall)
        scale = max(1.0, 100.0 / gray.shape[0])
        if scale > 1.0:
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        # Otsu thresholding adapts to actual image contrast (avoids fixed-150 failures)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        text = pytesseract.image_to_string(thresh, config=OCR_CONFIG).strip()
        if not text:
            return None, thresh

        cleaned = clean_plate(text)
        cleaned = fix_plate_chars(cleaned)
        return cleaned if cleaned else None, thresh

    except Exception as e:
        print(f"❌ OCR Error: {e}")
        return None, None

# -------------------------------------------------------------------
# ANPR MAIN LOOP
# -------------------------------------------------------------------
def run_anpr_system():
    print("ðŸ“¦ Loading Models...")

    try:
        vehicle_model = YOLO(VEHICLE_MODEL_PATH)
        print("âœ… Vehicle YOLO Loaded")
    except Exception as e:
        print(f"âŒ Vehicle Model Load Error: {e}")
        return

    try:
        plate_model = YOLO(PLATE_MODEL_PATH)
        print("âœ… Plate YOLO Loaded")
    except Exception as e:
        print(f"âŒ Plate Model Load Error: {e}")
        return

    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(3, CAM_WIDTH)
    cap.set(4, CAM_HEIGHT)

    if not cap.isOpened():
        print("âŒ Camera not opened!")
        return

    cooldown = 2.0
    last_ocr_time = 0
    frame_count = 0

    print("\nâœ… ANPR System Running! Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("âŒ Camera frame not received")
            break

        frame_count += 1
        display_frame = frame.copy()

        # Skip frames to improve FPS
        if frame_count % 2 != 0:
            cv2.imshow("ANPR Live", display_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            continue

        current_time = time.time()

        # Vehicle Detection
        vehicle_found = False
        results = vehicle_model(frame, verbose=False)

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])

                # COCO indices: car=2, motorcycle=3, bus=5, truck=7
                if cls_id in [2, 3, 5, 7]:
                    vehicle_found = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Plate detection only if vehicle detected + cooldown
        if vehicle_found and (current_time - last_ocr_time > cooldown):

            plate_results = plate_model(frame, verbose=False)

            if len(plate_results) > 0 and len(plate_results[0].boxes) > 0:

                last_ocr_time = current_time

                # Take best detected plate box
                best_box = plate_results[0].boxes[0]

                if best_box.conf[0] > 0.4:
                    px1, py1, px2, py2 = map(int, best_box.xyxy[0])

                    # clamp coordinates
                    py1, py2 = max(0, py1), min(frame.shape[0], py2)
                    px1, px2 = max(0, px1), min(frame.shape[1], px2)

                    plate_crop = frame[py1:py2, px1:px2]

                    if plate_crop.size > 0:
                        plate_text, processed_img = ocr_plate(plate_crop)

                        if plate_text:
                            print(f"OCR: {plate_text}")

                            if validate_plate(plate_text):
                                print(f"âœ… VALID PLATE DETECTED: {plate_text}")

                                cv2.rectangle(display_frame, (px1, py1), (px2, py2), (255, 0, 0), 2)
                                cv2.putText(display_frame, plate_text, (px1, py1 - 10),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

                                # Save images
                                os.makedirs("captured_frames", exist_ok=True)
                                cv2.imwrite("captured_frames/plate.jpg", plate_crop)
                                if processed_img is not None:
                                    cv2.imwrite("captured_frames/plate_processed.jpg", processed_img)

                                # trigger database logic
                                handle_detection(plate_text)

                            else:
                                print("âŒ INVALID PLATE FORMAT")

        cv2.imshow("ANPR Live", display_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

# -------------------------------------------------------------------
# MAIN ENTRY POINT
# -------------------------------------------------------------------
if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    time.sleep(2)

    run_anpr_system()