#!/usr/bin/env python3
"""
UTMS Drone Controller with USB Port Scanning (Mission Planner style)
"""
import sys
import json
import time
from serial.tools import list_ports

# Try to import dronekit
try:
    from dronekit import connect, VehicleMode, LocationGlobalRelative, Command
    from pymavlink import mavutil
    DRONEKIT_AVAILABLE = True
except ImportError:
    DRONEKIT_AVAILABLE = False

class DroneController:
    def __init__(self):
        self.vehicle = None
        self.connected = False
        self.current_port = None
        
    # ===== PORT SCANNING (Like Mission Planner) =====
    def scan_ports(self):
        """Scan all available COM ports and identify drone ports"""
        try:
            ports = list_ports.comports()
            port_list = []
            
            for port in ports:
                port_info = {
                    "port": port.device,
                    "description": port.description,
                    "manufacturer": port.manufacturer,
                    "vid": port.vid,
                    "pid": port.pid
                }
                port_list.append(port_info)
                print(f"Found: {port.device} - {port.description}", file=sys.stderr)
            
            if len(port_list) == 0:
                return {"success": False, "message": "No COM ports found", "ports": []}
            
            return {"success": True, "ports": port_list, "count": len(port_list)}
        except Exception as e:
            return {"success": False, "message": str(e), "ports": []}
    
    def auto_connect(self):
        """Auto-detect and connect to drone (like Mission Planner 'Auto' button)"""
        try:
            # Get all ports
            ports = list_ports.comports()
            
            if len(ports) == 0:
                return {"success": False, "message": "No COM ports found"}
            
            # Try each port with standard drone baud rates
            baud_rates = [57600,115200, 9600]
            
            for port in ports:
                for baud in baud_rates:
                    try:
                        print(f"Trying {port.device} at {baud} baud...", file=sys.stderr)
                        
                        if not DRONEKIT_AVAILABLE:
                            # Mock mode
                            self.vehicle = None
                            self.connected = True
                            self.current_port = port.device
                            return {
                                "success": True, 
                                "message": f"Connected to {port.device} (MOCK MODE)",
                                "port": port.device,
                                "baud": baud
                            }
                        
                        # Real DroneKit connection
                        vehicle = connect(
                            port.device,
                            wait_ready=False,
                            baud=baud,
                            timeout=10
                        )
                        vehicle.wait_ready(True, raise_exception=False, timeout=5)
                        
                        self.vehicle = vehicle
                        self.connected = True
                        self.current_port = port.device
                        
                        return {
                            "success": True,
                            "message": f"Auto-connected to {port.device}",
                            "port": port.device,
                            "baud": baud,
                            "vehicle_type": str(self.vehicle.vehicle_type) if self.vehicle else "Unknown"
                        }
                    except Exception as e:
                        continue
            
            return {"success": False, "message": "Could not connect to any port"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def connect_vehicle(self, connection_string, baud=57600):
        """Connect to vehicle via specific serial port"""
        try:
            if not DRONEKIT_AVAILABLE:
                self.connected = True
                self.current_port = connection_string
                return {
                    "success": True,
                    "message": f"Connected to {connection_string} (MOCK MODE)",
                    "port": connection_string
                }
            
            self.vehicle = connect(
                connection_string,
                wait_ready=False,
                baud=baud,
                timeout=60
            )
            self.vehicle.wait_ready(True, raise_exception=False, timeout=30)
            self.connected = True
            self.current_port = connection_string
            
            return {
                "success": True,
                "message": f"Connected to {connection_string}",
                "port": connection_string,
                "baud": baud
            }
        except Exception as e:
            self.connected = False
            return {"success": False, "message": str(e), "port": connection_string}
    
    def disconnect_vehicle(self):
        """Disconnect from vehicle"""
        if self.vehicle:
            try:
                self.vehicle.close()
            except:
                pass
        self.connected = False
        self.current_port = None
        return {"success": True, "message": "Disconnected"}
    
    def get_telemetry(self):
        """Get current vehicle state"""
        if not self.vehicle or not self.connected:
            return {
                "connected": False,
                "armed": False,
                "mode": "DISARMED",
                "lat": 28.6139,
                "lon": 77.2090,
                "alt": 0,
                "groundspeed": 0,
                "airspeed": 0,
                "heading": 0,
                "battery_voltage": 0,
                "battery_remaining": 0,
                "gps_fix": 0,
                "satellites": 0,
                "roll": 0,
                "pitch": 0,
                "yaw": 0,
                "port": self.current_port
            }
        
        try:
            location = self.vehicle.location.global_frame
            attitude = self.vehicle.attitude
            
            return {
                "connected": True,
                "armed": self.vehicle.armed,
                "mode": str(self.vehicle.mode.name),
                "lat": location.lat if location else 0,
                "lon": location.lon if location else 0,
                "alt": self.vehicle.location.global_relative_frame.alt if self.vehicle.location.global_relative_frame else 0,
                "groundspeed": self.vehicle.groundspeed if self.vehicle.groundspeed else 0,
                "airspeed": self.vehicle.airspeed if self.vehicle.airspeed else 0,
                "heading": self.vehicle.heading if self.vehicle.heading else 0,
                "battery_voltage": self.vehicle.battery.voltage if self.vehicle.battery else 0,
                "battery_remaining": self.vehicle.battery.level if self.vehicle.battery else 0,
                "gps_fix": self.vehicle.gps_0.fix_type if self.vehicle.gps_0 else 0,
                "satellites": self.vehicle.gps_0.satellites_visible if self.vehicle.gps_0 else 0,
                "roll": attitude.roll if attitude else 0,
                "pitch": attitude.pitch if attitude else 0,
                "yaw": attitude.yaw if attitude else 0,
                "port": self.current_port
            }
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    def arm_vehicle(self):
        """Arm the vehicle"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": "Armed (MOCK MODE)"}
        
        if not self.vehicle:
            return {"success": False, "message": "Not connected"}
        try:
            timeout = 30
            start = time.time()
            while not self.vehicle.is_armable and (time.time() - start) < timeout:
                time.sleep(2)
            
            if not self.vehicle.is_armable:
                return {"success": False, "message": "Vehicle not armable"}
            
            self.vehicle.mode = VehicleMode("GUIDED")
            while self.vehicle.mode.name != 'GUIDED':
                time.sleep(0.5)
            
            self.vehicle.armed = True
            while not self.vehicle.armed:
                time.sleep(0.5)
            
            return {"success": True, "message": "Armed"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def disarm_vehicle(self):
        """Disarm the vehicle"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": "Disarmed (MOCK MODE)"}
        
        if not self.vehicle:
            return {"success": False, "message": "Not connected"}
        try:
            self.vehicle.armed = False
            while self.vehicle.armed:
                time.sleep(0.5)
            return {"success": True, "message": "Disarmed"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def change_mode(self, mode_name):
        """Change flight mode"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": f"Mode changed to {mode_name} (MOCK MODE)"}
        
        if not self.vehicle:
            return {"success": False, "message": "Not connected"}
        try:
            self.vehicle.mode = VehicleMode(mode_name)
            return {"success": True, "message": f"Mode changed to {mode_name}"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def takeoff(self, altitude):
        """Takeoff to specified altitude"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": f"Taking off to {altitude}m (MOCK MODE)"}
        
        if not self.vehicle or not self.vehicle.armed:
            return {"success": False, "message": "Not armed"}
        try:
            self.vehicle.simple_takeoff(altitude)
            return {"success": True, "message": f"Taking off to {altitude}m"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def land(self):
        """Land the vehicle"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": "Landing (MOCK MODE)"}
        
        if not self.vehicle:
            return {"success": False, "message": "Not connected"}
        try:
            self.vehicle.mode = VehicleMode("LAND")
            return {"success": True, "message": "Landing"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def goto_position(self, lat, lon, alt):
        """Go to GPS position"""
        if not DRONEKIT_AVAILABLE:
            return {"success": True, "message": f"Going to {lat}, {lon} @ {alt}m (MOCK MODE)"}
        
        if not self.vehicle:
            return {"success": False, "message": "Not connected"}
        try:
            point = LocationGlobalRelative(lat, lon, alt)
            self.vehicle.simple_goto(point)
            return {"success": True, "message": f"Going to {lat}, {lon} @ {alt}m"}
        except Exception as e:
            return {"success": False, "message": str(e)}

# Main execution
if __name__ == '__main__':
    controller = DroneController()
    
    command = sys.argv[1] if len(sys.argv) > 1 else 'telemetry'
    result = {}
    
    try:
        if command == 'scan_ports':
            result = controller.scan_ports()
        elif command == 'auto_connect':
            result = controller.auto_connect()
        elif command == 'connect':
            port = sys.argv[2] if len(sys.argv) > 2 else 'COM3'
            baud = int(sys.argv[3]) if len(sys.argv) > 3 else 57600
            result = controller.connect_vehicle(port, baud)
        elif command == 'disconnect':
            result = controller.disconnect_vehicle()
        elif command == 'telemetry':
            result = controller.get_telemetry()
        elif command == 'arm':
            result = controller.arm_vehicle()
        elif command == 'disarm':
            result = controller.disarm_vehicle()
        elif command == 'mode':
            mode = sys.argv[2] if len(sys.argv) > 2 else 'GUIDED'
            result = controller.change_mode(mode)
        elif command == 'takeoff':
            alt = float(sys.argv[2]) if len(sys.argv) > 2 else 10
            result = controller.takeoff(alt)
        elif command == 'land':
            result = controller.land()
        elif command == 'goto':
            lat = float(sys.argv[2])
            lon = float(sys.argv[3])
            alt = float(sys.argv[4])
            result = controller.goto_position(lat, lon, alt)
        else:
            result = {
                "error": f"Unknown command: {command}",
                "available_commands": [
                    "scan_ports",      # NEW: Scan USB ports
                    "auto_connect",    # NEW: Auto-detect and connect
                    "connect",         # Manual connect with port
                    "disconnect",
                    "telemetry",
                    "arm",
                    "disarm",
                    "mode",
                    "takeoff",
                    "land",
                    "goto"
                ]
            }
    except Exception as e:
        result = {"error": str(e)}
    
    print(json.dumps(result))
