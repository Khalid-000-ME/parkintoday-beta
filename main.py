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
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import numpy as np
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# -------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------
# ENV VARIABLES (Make sure .env file exists)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Rate per minute (INR)
PARKING_RATE = 0.667

# -------------------------------------------------------------------
# GLOBAL STATE
# -------------------------------------------------------------------
class State:
    def __init__(self):
        self.processed_exits = {} # Dict[plate, timestamp] for cooldown
 # Cache to avoid double processing
        self.last_cleanup = time.time()

state = State()

# Initialize Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase Client Initialized")
except Exception as e:
    print(f"⚠️ Supabase Init Failed: {e}")
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
        # Check if already active
        existing = supabase.table('bookings').select("*").eq('vehicle_number', entry.vehicle_number).eq('status', 'active').execute()
        if existing.data:
            return {"message": "Vehicle already parked", "booking": existing.data[0]}

        # Insert new booking
        data = {
            "vehicle_number": entry.vehicle_number,
            "user_id": entry.user_id,
            "lot_id": entry.lot_id,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "status": "pending_entry", # Wait for camera
            "amount": 0
        }
        res = supabase.table('bookings').insert(data).execute()
        
        # Reset cache so camera can detect it immediately for entry confirmation
        state.processed_exits.pop(entry.vehicle_number, None)
        
        return {"message": "Waiting for vehicle entry", "booking": res.data[0]}
    except Exception as e:
        print(f"Error starting parking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def start_server():
    # Start ngrok tunnel
    port = 8000
    try:
        public_url = ngrok.connect(port).public_url
        print(f"\n🚀 Ngrok Tunnel Started: {public_url}")
        print(f"📡 API Endpoint: {public_url}/start_parking")
    except Exception as e:
        print(f"Ngrok Error: {e}")

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="error")

# -------------------------------------------------------------------
# DETECTION & LOGIC
# -------------------------------------------------------------------
def clean_plate(text):
    text = text.upper()
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def fix_plate_chars(text):
    n = len(text)
    if n not in (9, 10):
        return text  # Only handle known lengths

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
    if not re.match(pattern, plate): return False
    if plate[:2] not in VALID_STATE_CODES: return False
    return True

def handle_detection(plate_text):
    if not supabase: return

    # Remove specific check for non-AZ0-9 characters as TrOCR might handle it differently, 
    # but the regex above covers it.

    now = time.time()
    if plate_text in state.processed_exits:
        last_time = state.processed_exits[plate_text]
        if (now - last_time) < 45: # 45 seconds cooldown
            print(f"⏳ Skipping {plate_text} (Recently Processed)")
            return
        else:
             # Expired, remove to allow processing
             del state.processed_exits[plate_text]

    try:
        # 1. Check PENDING ENTRY (Activation)
        pending = supabase.table('bookings').select("*").eq('vehicle_number', plate_text).eq('status', 'pending_entry').execute()
        
        if pending.data:
            booking = pending.data[0]
            print(f"✅ ENTRY CONFIRMED: {plate_text}. Activating session.")
            
            # Activate and set REAL start time
            now_iso = datetime.now(timezone.utc)
            supabase.table('bookings').update({
                "status": "active",
                "start_time": now_iso.isoformat()
            }).eq('id', booking['id']).execute()

            # Add to cache with timestamp
            state.processed_exits[plate_text] = time.time()
            return

        # 2. Check ACTIVE booking (Exit)
        response = supabase.table('bookings').select("*").eq('vehicle_number', plate_text).eq('status', 'active').execute()
        
        if response.data:
            booking = response.data[0]
            booking_id = booking['id']
            start_time = datetime.fromisoformat(booking['start_time'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            
            # Simple Minimum Duration Check (Prevention of immediate exit after entry)
            duration_seconds = (now - start_time).total_seconds()
            if duration_seconds < 30:
                print(f"⚠️ {plate_text}: Detected too soon after entry ({duration_seconds}s). Ignoring.")
                return

            minutes_parked = duration_seconds / 60
            amount = max(1, int(round(minutes_parked * PARKING_RATE))) # Min 1 rupee, rounded to nearest int

            print(f"🚗 EXIT DETECTED: {plate_text}. Duration: {minutes_parked:.1f}m. Fee: ₹{amount}")

            # Update Booking -> Set status to 'exit_detected' (App will prompt payment)
            # We set end_time now.
            update_data = {
                "end_time": now.isoformat(),
                "status": "exit_detected",
                "amount": amount
            }
            supabase.table('bookings').update(update_data).eq('id', booking_id).execute()
            
            # Add to cache to prevent re-triggering for 60s
            state.processed_exits[plate_text] = time.time()
            
            # Simple cleanup of cache
            if time.time() - state.last_cleanup > 60:
                state.processed_exits.clear()
                state.last_cleanup = time.time()

        else:
            # No active booking found. 
            pass
            # Maybe auto-entry? User said "Manual Entry", so we ignore.
    
    except Exception as e:
        print(f"❌ Logic Error: {e}")

def run_anpr_system():
    # ... Models Loading (Same as before) ...
    print("📦 Loading Models...")
    try:
        vehicle_model = YOLO("yolov8n.pt") 
    except:
        vehicle_model = YOLO("yolov8n.pt")

    plate_model_path = "./models/LP-detection.pt"
    try:
        plate_model = YOLO(plate_model_path)
    except Exception as e:
        print(f"❌ Error loading plate model: {e}")
        return

    try:
        processor = TrOCRProcessor.from_pretrained("microsoft/trocr-small-printed")
        ocr_model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-small-printed")
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        if torch.cuda.is_available(): device = "cuda"
        ocr_model.to(device)
    except Exception as e:
        print(f"❌ Error loading TrOCR: {e}")
        return

    cap = cv2.VideoCapture(0)
    cap.set(3, 640)
    cap.set(4, 480)

    cooldown = 2.0
    last_ocr_time = 0
    frame_count = 0 

    print("\n✅ ANPR System Running! Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret: break

        frame_count += 1
        display_frame = frame.copy()

        if frame_count % 2 != 0:
            cv2.imshow("ANPR Live", display_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"): break
            continue

        current_time = time.time()
        
        # We only care about Plate Detection logic here
        # Assuming Vehicle Detection logic is implicit or we can skip it for speed if we trust Plate Model
        # Let's keep it simple: Just run Plate Model directly on frame (it's fast enough usually)
        # Or stick to original flow: Vehicle -> Plate
        
        # Vehicle Check
        vehicle_found = False
        results = vehicle_model(frame, verbose=False)
        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) in [2, 3, 5, 7]: # car, motorcycle, bus, truck indices in COCO
                    vehicle_found = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        if vehicle_found and (current_time - last_ocr_time > cooldown):
            plate_results = plate_model(frame, verbose=False)
            if len(plate_results) > 0 and len(plate_results[0].boxes) > 0:
                last_ocr_time = current_time
                box = plate_results[0].boxes[0]
                if box.conf[0] > 0.4:
                    px1, py1, px2, py2 = map(int, box.xyxy[0].cpu().numpy())
                    # clamp
                    py1, py2 = max(0, py1), min(frame.shape[0], py2)
                    px1, px2 = max(0, px1), min(frame.shape[1], px2)
                    
                    plate_crop = frame[py1:py2, px1:px2]
                    if plate_crop.size > 0:
                        try:
                            plate_pil = Image.fromarray(cv2.cvtColor(plate_crop, cv2.COLOR_BGR2RGB))
                            pixel_values = processor(plate_pil, return_tensors="pt").pixel_values.to(device)
                            generated_ids = ocr_model.generate(pixel_values, max_new_tokens=20)
                            plate_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                            cleaned = clean_plate(plate_text)
                            cleaned = fix_plate_chars(cleaned)
                            
                            print(f"OCR: {cleaned}")
                            
                            if validate_plate(cleaned):
                                cv2.putText(display_frame, cleaned, (px1, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                                cv2.rectangle(display_frame, (px1, py1), (px2, py2), (0, 255, 0), 2)
                                
                                # TRIGGER LOGIC
                                handle_detection(cleaned)
                                
                        except Exception as e:
                            print(f"OCR Error: {e}")

        cv2.imshow("ANPR Live", display_frame)
        if cv2.waitKey(1) & 0xFF == ord("q"): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2)
    run_anpr_system()
