from flask import Flask, jsonify, request
from flask_cors import CORS
from dronekit import connect, VehicleMode, LocationGlobalRelative
import threading
import time

app = Flask(__name__)
CORS(app)

vehicle = None
vehicle_lock = threading.Lock()

def connect_vehicle(connection_string='COM6', baud=9600):
    global vehicle
    with vehicle_lock:
        if vehicle:
            try:
                vehicle.close()
            except:
                pass
            vehicle = None
        try:
            vehicle = connect(connection_string, baud=baud, wait_ready=True, timeout=30)
            print(f"✅ Connected to vehicle on {connection_string} at {baud} baud")
        except Exception as e:
            print(f"❌ Connection failed: {str(e)}")
            raise

@app.route('/connect', methods=['POST'])
def connect_api():
    data = request.json
    port = data.get('port', 'COM6')
    baud = data.get('baud', 9600)  # Default changed here
    try:
        connect_vehicle(port, baud)
        return jsonify({"success": True, "message": f"Connected to {port} at {baud} baud"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/disconnect', methods=['POST'])
def disconnect_api():
    global vehicle
    with vehicle_lock:
        if vehicle:
            try:
                vehicle.close()
                vehicle = None
                return jsonify({"success": True, "message": "Disconnected"})
            except Exception as e:
                return jsonify({"success": False, "message": str(e)}), 500
        else:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400

@app.route('/telemetry', methods=['GET'])
def telemetry_api():
    global vehicle
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"connected": False})
        try:
            loc = vehicle.location.global_frame
            attitude = vehicle.attitude
            status = {
                "connected": True,
                "armed": vehicle.armed,
                "mode": str(vehicle.mode.name),
                "lat": loc.lat if loc else 0,
                "lon": loc.lon if loc else 0,
                "alt": vehicle.location.global_relative_frame.alt if vehicle.location.global_relative_frame else 0,
                "groundspeed": vehicle.groundspeed if vehicle.groundspeed else 0,
                "airspeed": vehicle.airspeed if vehicle.airspeed else 0,
                "heading": vehicle.heading if vehicle.heading else 0,
                "battery_voltage": vehicle.battery.voltage if vehicle.battery else 0,
                "battery_remaining": vehicle.battery.level if vehicle.battery else 0,
                "gps_fix": vehicle.gps_0.fix_type if vehicle.gps_0 else 0,
                "satellites": vehicle.gps_0.satellites_visible if vehicle.gps_0 else 0,
                "roll": attitude.roll if attitude else 0,
                "pitch": attitude.pitch if attitude else 0,
                "yaw": attitude.yaw if attitude else 0
            }
            return jsonify(status)
        except Exception as e:
            return jsonify({"connected": False, "error": str(e)}), 500

@app.route('/arm', methods=['POST'])
def arm_api():
    global vehicle
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        try:
            from dronekit import VehicleMode
            if not vehicle.is_armable:
                return jsonify({"success": False, "message": "Vehicle not armable yet"})
            vehicle.mode = VehicleMode("GUIDED")
            while vehicle.mode.name != "GUIDED":
                time.sleep(0.5)
            vehicle.armed = True
            while not vehicle.armed:
                time.sleep(0.5)
            return jsonify({"success": True, "message": "Vehicle armed"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/disarm', methods=['POST'])
def disarm_api():
    global vehicle
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        try:
            vehicle.armed = False
            while vehicle.armed:
                time.sleep(0.5)
            return jsonify({"success": True, "message": "Vehicle disarmed"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/takeoff', methods=['POST'])
def takeoff_api():
    global vehicle
    data = request.json
    altitude = data.get('altitude', 10)
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        if not vehicle.armed:
            return jsonify({"success": False, "message": "Vehicle not armed"}), 400
        try:
            vehicle.simple_takeoff(altitude)
            return jsonify({"success": True, "message": f"Taking off to {altitude}m"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/land', methods=['POST'])
def land_api():
    global vehicle
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        try:
            from dronekit import VehicleMode
            vehicle.mode = VehicleMode("LAND")
            return jsonify({"success": True, "message": "Landing"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/mode', methods=['POST'])
def mode_api():
    global vehicle
    data = request.json
    mode = data.get('mode', 'GUIDED')
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        try:
            from dronekit import VehicleMode
            vehicle.mode = VehicleMode(mode)
            return jsonify({"success": True, "message": f"Mode changed to {mode}"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/goto', methods=['POST'])
def goto_api():
    global vehicle
    data = request.json
    lat = data.get('lat')
    lon = data.get('lon')
    alt = data.get('alt', 10)
    with vehicle_lock:
        if vehicle is None:
            return jsonify({"success": False, "message": "No vehicle connected"}), 400
        try:
            from dronekit import LocationGlobalRelative
            point = LocationGlobalRelative(lat, lon, alt)
            vehicle.simple_goto(point)
            return jsonify({"success": True, "message": f"Going to {lat}, {lon} @ {alt}m"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_api():
    return jsonify({"status": "ok", "message": "Python backend is running"})

if __name__ == '__main__':
    print('')
    print('╔════════════════════════════════════════════╗')
    print('║   🚁 Python Persistent Backend Started 🚁 ║')
    print('╚════════════════════════════════════════════╝')
    print('')
    print('✅ Flask server running on http://0.0.0.0:5555')
    print('')
    app.run(host='0.0.0.0', port=5555, debug=False)
