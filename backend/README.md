# NOVIS Backend

## Overview

The NOVIS backend powers a real-time geo-dispatch and incident mapping platform for Lahore and other urban environments. It is designed to ingest incident reports, broadcast live updates to connected clients, and compute shortest-path routes while dynamically avoiding roadblocks or disrupted segments.

This backend acts as the event-driven core of the NOVIS system, combining Flask, WebSockets, graph routing, and geospatial data processing to support fast and responsive civic logistics workflows.

## Core Mission

NOVIS enables users to:

- Report community issues, emergencies, or food insecurity events in real time
- Visualize incidents on a live dashboard
- Calculate the fastest route to the affected location
- Re-route around blocked or inaccessible roads dynamically
- Support NGOs, responders, and local authorities with live coordination tools

## High-Performance Tech Stack

### Frontend Integration

- React (Vite) for the interactive dashboard experience
- Zustand or Redux Toolkit for live state management
- React-Leaflet or Mapbox GL JS for mapping interfaces
- Socket.IO-client for real-time client-server communication

### Backend

- Flask as the core web framework
- Flask-SocketIO for real-time, bidirectional communication
- gevent or eventlet as the async networking worker layer
- Neo4j Python Driver for fast graph-based routing queries
- Redis as an in-memory message broker and session coordination layer

### Data and Routing Layer

- Neo4j Community Edition or Neo4j Aura Free Tier for graph storage
- Cypher-based shortest path queries using Dijkstra or similar routing algorithms
- Optional Graph Data Science (GDS) integration for advanced routing and network analysis

## Recommended Architecture

The backend follows a real-time event-driven architecture:

1. Clients connect through WebSockets using Flask-SocketIO.
2. Incident reports are received and stored or broadcast instantly.
3. Neo4j processes location and road-network data for route computation.
4. Redis helps manage live sessions and asynchronous message flow.
5. The frontend receives live updates without constantly polling the server.

## Best Free Datasets for Lahore / Urban Routing

To make routing simulations realistic, the backend can be connected to open geospatial datasets.

### 1. Geofabrik (OpenStreetMap Extracts)

- Free and regularly updated geographic data
- Includes roads, intersections, highways, and street names
- Suitable for building a complete road network graph for Lahore

### 2. HDX - Pakistan Road Surface and Passability Data

- Provides road surface, width, and passability information
- Useful for assigning road weights and difficulty scores
- Supports dynamic rerouting when roads become blocked or inaccessible

### 3. Overpass API

- Allows direct extraction of road networks from OpenStreetMap
- Useful for lightweight, targeted data collection for Lahore
- Can be queried through Python tools such as OSMnx

## Sample Use Case

A user submits an emergency or food-distribution request from a mobile or web client. The backend receives the report, visualizes it on the dashboard, and calculates the shortest route for the nearest available responder or volunteer. If a roadblock is reported, the routing logic updates the affected segment and computes an alternative path in real time.

## Project Goals

- Build a scalable real-time incident management backend
- Support low-latency map updates and vehicle/volunteer dispatch
- Use graph databases for intelligent routing
- Provide an extensible foundation for humanitarian logistics and civic response systems

## Getting Started

A typical backend setup may include:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-socketio eventlet neo4j redis
```

You can then configure environment variables for:

- Neo4j connection details
- Redis host and port
- Flask secret and application settings

## Notes

This README is a sample backend documentation template for the NOVIS project and can be expanded as the implementation grows.
