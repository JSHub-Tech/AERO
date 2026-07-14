# AERO API Specification

This document outlines the API endpoints and WebSocket channels required by the AERO frontend. Currently, the frontend is reading from local CSV mock data and simulating WebSockets. The backend team should implement these endpoints to make the system fully functional.

---

## 1. REST Endpoints

### 1.1 GET `/api/v1/airports`
**Description:** Fetches the list of all airports in the network. Used to render nodes on the 3D Globe and 2D Map.
**Response Body:**
```json
[
  {
    "Airport_Code": "KHI",
    "Airport Name": "Jinnah International Airport",
    "City": "Karachi",
    "Country": "Pakistan",
    "Latitude": 24.9065,
    "Longitude": 67.1608
  },
  // ...
]
```

### 1.2 GET `/api/v1/airports/details`
**Description:** Fetches extended metadata for airports used in the cinematic "Airports View".
**Response Body:**
```json
[
  {
    "Airport_Code": "KHI",
    "Operational_Status": "Active",
    "Annual_Passengers": "7.3M",
    "Description_Blog": "Jinnah International Airport is Pakistan's busiest..."
  },
  // ...
]
```

### 1.3 GET `/api/v1/routes`
**Description:** Fetches all active network connections. Used to draw the glowing green arcs on the globe and dashed lines on the 2D map.
**Response Body:**
```json
[
  {
    "Source_Airport_Code": "KHI",
    "Destination_Airport_Code": "ISB"
  },
  // ...
]
```

### 1.4 GET `/api/v1/flights/schedule`
**Description:** Fetches the static flight schedule for the day. Displayed in the "Live Flight Schedule" tables.
**Response Body:**
```json
[
  {
    "flight_number": "PK300",
    "departure_airport": "KHI",
    "arrival_airport": "ISB",
    "departure_time_of_day": "07:00",
    "arrival_time_of_day": "08:50"
  },
  // ...
]
```

### 1.5 GET `/api/v1/flights/search`
**Description:** Fetches available flights based on Origin, Destination, Date, and Flexibility. Used by the Booking Portal.
**Query Params:** `?origin=KHI&destination=ISB&date=2026-07-20&flex=3`
**Response Body:**
```json
[
  {
    "id": "PK300",
    "departureTime": "08:00 AM",
    "arrivalTime": "10:00 AM",
    "duration": "2h 0m",
    "price": "$120",
    "path": ["KHI", "ISB"],
    "type": "Direct",
    "plane": "A320-01"
  }
]
```

### 1.6 POST `/api/v1/booking/checkout`
**Description:** Submits the final passenger booking and locks in the selected seats.
**Request Body:**
```json
{
  "flight_id": "PK300",
  "passengers": 2,
  "seats": ["1A", "1B"],
  "customer_details": { "name": "John Doe", "email": "john@example.com" }
}
```
**Response Body:**
```json
{
  "status": "success",
  "booking_reference": "AERO-X9F2A",
  "message": "Booking Confirmed"
}
```

### 1.7 GET `/api/v1/fleet`
**Description:** Fetches the fleet details. The frontend uses this to calculate the layout of the interactive seat map (e.g., A320 = 6 across, B777 = 9 across).
**Response Body:**
```json
[
  {
    "Aircraft_ID": "A320-01",
    "Model": "Airbus A320-200",
    "Total_Seats": 170
  }
]
```

### 1.8 GET `/api/v1/flights/seats/{flight_id}`
**Description:** Fetches the list of already booked or unavailable seats for a specific flight so they can be greyed out on the seat map.
**Response Body:**
```json
{
  "booked_seats": ["1A", "1B", "14F", "15D"]
}
```

---

## 2. WebSockets (Live Telemetry)

### 2.1 Channel: `ws://<backend_url>/ws/telemetry`
**Description:** Streams real-time flight positions. The frontend connects to this WebSocket to move airplanes across the Live Operations map.
**Frequency:** Emits every 1-5 seconds.

**Event Payload (Server to Client):**
```json
{
  "type": "FLIGHT_TELEMETRY_UPDATE",
  "data": [
    {
      "id": "PK300-LIVE",
      "flightNumber": "PK300",
      "departure": "KHI",
      "dest": "ISB",
      "lat": 29.5,
      "lng": 70.1,
      "heading": 45,
      "progress": 0.45,
      "status": "In-Air"
    },
    // ...
  ]
}
```

### 2.2 Channel: `ws://<backend_url>/ws/operations`
**Description:** Streams operational status updates (e.g. Boarding, Delayed, Takeoff). The frontend uses this to populate the left-side operation panels on the Live Operations page.

**Event Payload (Server to Client):**
```json
{
  "type": "OPERATIONAL_UPDATE",
  "data": {
    "boarding": [
      { "route": "KHI - LHE", "flight": "PK302", "time": "14:30" }
    ],
    "delayed": [
      { "route": "LHE - DXB", "flight": "PK203", "reason": "Weather" }
    ]
  }
}
```
