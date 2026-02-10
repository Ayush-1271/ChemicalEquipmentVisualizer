# Developer Guide: Chemical Equipment Visualizer

This document provides a comprehensive technical overview of the **Chemical Equipment Visualizer** project. It details the architecture, code structure, database schema, API endpoints, and frontend implementations for both Web and Desktop platforms.

---

## 1. Project Overview

The **Chemical Equipment Visualizer** is a full-stack application designed to:
1.  **Ingest** CSV data containing chemical equipment parameters (Flowrate, Pressure, Temperature).
2.  **Store** and process this data securely.
3.  **Visualize** key metrics and distributions via interactive dashboards.
4.  **Export** reports (PDF) and historical data.

The system is composed of three main parts:
-   **Backend**: Django REST Framework (API & Logic).
-   **Web Frontend**: React + Vite (Modern, responsive UI).
-   **Desktop Frontend**: PyQt5 (Native application with offline-capable feel).

---

## 2. Technology Stack

### Backend
-   **Framework**: Django 5.x + Django REST Framework (DRF)
-   **Language**: Python 3.10+
-   **Database**: SQLite (default) / PostgreSQL (production-ready)
-   **Data Processing**: Pandas (CSV parsing, statistics)
-   **PDF Generation**: ReportLab
-   **Authentication**: Token-based Auth (DRF Built-in)

### Web Frontend
-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Styling**: CSS Modules (Scoped), Vanilla CSS variables for theming.
-   **HTTP Client**: Axios (custom instance with interceptors)
-   **Charting**: Chart.js + React-Chartjs-2
-   **Icons**: Unicode (minimalist approach)

### Desktop Frontend
-   **Framework**: PyQt5 (Python bindings for Qt)
-   **Language**: Python 3.10+
-   **Charting**: Matplotlib (embedded in Qt widgets via `FigureCanvasQTAgg`)
-   **HTTP Client**: `requests` library
-   **Styling**: QSS (Qt Style Sheets) - Dark Theme

---

## 3. Project Structure

```
ChemicalEquipmentVisualizer/
├── backend/                        # Django Project Root
│   ├── core/                       # Main Application App
│   │   ├── migrations/             # DB Migrations
│   │   ├── models.py               # Database Models (Dataset, EquipmentRecord)
│   │   ├── serializers.py          # DRF Serializers
│   │   ├── views.py                # API Logic (Upload, History, Dashboard)
│   │   └── urls.py                 # App-specific URLs
│   ├── chemical_project/           # Project Configuration
│   │   ├── settings.py             # Global Settings (CORS, INSTALLED_APPS)
│   │   └── urls.py                 # Root URL Router
│   ├── manage.py                   # Django CLI entry point
│   └── requirements.txt            # Python dependencies
│
├── web-frontend/                   # React Application
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── Dashboard.jsx       # Main Visualization View
│   │   │   ├── Dashboard.module.css# Scoped Styles
│   │   │   ├── History.jsx         # List of Uploads
│   │   │   ├── Login.jsx           # Auth Screen
│   │   │   └── Upload.jsx          # File Upload Logic
│   │   ├── App.jsx                 # Main Router & Layout
│   │   ├── api.js                  # Axios Client & Endpoints
│   │   └── main.jsx                # React Entry Point
│   ├── ...                         # Config files (vite.config.js, package.json)
│   └── dist/                       # Production Build Output
│
├── desktop-frontend/               # PyQt Application
│   ├── widgets/                    # UI Components (Widgets)
│   │   ├── dashboard_widget.py     # Matplotlib Charts & Stats
│   │   ├── history_widget.py       # QTableWidget for History
│   │   └── upload_widget.py        # Drag-and-drop Upload
│   ├── main.py                     # Entry Point (MainWindow)
│   ├── api_client.py               # Python Requests Wrapper
│   └── styles.qss                  # Global Stylesheet
│
└── data/                           # Sample Data & Storage (Gitignored)
```

---

## 4. Database Schema

### `Dataset` Model
Represents a single CSV upload file.
-   `id` (PK): Auto-incrementing Integer.
-   `filename`: String (255) - Name of the uploaded file.
-   `upload_timestamp`: DateTime - When it was uploaded (Auto-now-add).
-   `summary_stats`: JSONField - Pre-calculated statistics (Count, Avg Flow/Press/Temp, Type Dist).
    -   *Optimization*: Storing stats prevents recalculating them on every dashboard load.

### `EquipmentRecord` Model
Represents a single row from the CSV.
-   `id` (PK): Auto-incrementing Integer.
-   `dataset` (FK): Foreign Key to `Dataset` (Cascade Delete).
-   `equipment_name`: String (255) - e.g., "Pump-001".
-   `type`: String (100) - e.g., "Pump", "Valve".
-   `flowrate`: Float.
-   `pressure`: Float.
-   `temperature`: Float.

---

## 5. API Reference (Backend)

Base URL: `http://127.0.0.1:8000/api`

### Authentication
-   **POST** `/login/`
    -   Body: `{ "username": "admin", "password": "..." }`
    -   Response: `{ "token": "..." }`

### Data Operations
-   **POST** `/upload/`
    -   Headers: `Authorization: Token <token>`, `Content-Type: multipart/form-data`
    -   Body: `file` (CSV)
    -   Response: `201 Created` - Returns complete `Dataset` object (with ID and summary).
-   **GET** `/history/`
    -   Headers: `Authorization: Token <token>`
    -   Response: List of `Dataset` objects (latest first).
-   **GET** `/dataset/<id>/`
    -   Headers: `Authorization: Token <token>`
    -   Response:
        ```json
        {
          "count": 100,
          "next": "...",
          "previous": null,
          "results": [ ...records... ],
          "summary": { ...stats... }  // Injected for easy frontend access
        }
        ```
-   **GET** `/dataset/<id>/report/`
    -   Headers: `Authorization: Token <token>`
    -   Response: `application/pdf` binary stream.

---

## 6. Frontend Guide

### Web Frontend (React)
-   **Core Logic**: `App.jsx` handles routing (`view` state: 'upload' | 'history' | 'dashboard') and Auth check.
-   **State Management**: Local component state (`useState`, `useEffect`).
-   **Styling**:
    -   **`App.module.css`**: Global layout, Navbar, background gradients.
    -   **`Dashboard.module.css`**: Grid layouts, Chart containers, KPI cards.
    -   **Glassmorphism**: Achieved via `backdrop-filter: blur(10px)` and semi-transparent `rgba` backgrounds.
-   **Charts**:
    -   `Doughnut`: Equipment Type Distribution.
    -   `Bar`: Average Metrics.
    -   `HorizontalBar`: Top 5 Equipment by Flowrate.
    -   *Colors*: Standardized palette (Blue `#3b82f6`, Pink `#ec4899`, Yellow `#eab308`).

### Desktop Frontend (PyQt)
-   **Threading**: `UploadThread` (in `upload_widget.py`) handles file uploads in a background thread to keep the UI responsive (avoid freezing during validation).
-   **Matplotlib Integration**:
    -   Uses `FigureCanvasQTAgg` to embed plots.
    -   **Crucial Config**: `matplotlib.use('Qt5Agg')` must be called before creating `QApplication` to avoid threading crashes.
    -   **Styling**: Graphs are styled with dark backgrounds (`#0f172a`), white text, and removed spines to match the Web UI.
-   **Navigation**: `QTabWidget` based. Switching tabs triggers `refresh_history()` signals.

---

## 7. Setup & Run Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser # (username: admin)
python manage.py runserver
```
*Server runs at `http://127.0.0.1:8000`*

### 2. Web Frontend
```bash
cd web-frontend
npm install
npm run dev
```
*Client runs at `http://localhost:5173`*

### 3. Desktop Frontend
```bash
cd desktop-frontend
pip install -r requirements.txt 
# Ensure you have pyqt5, requests, matplotlib
python main.py
```

---

## 8. Common Issues & Troubleshooting

-   **Desktop Crash "QLabel not defined"**: Missing import in `history_widget.py`. *Fixed in Phase 7.*
-   **Web Upload "Network Error"**: Ensure Backend is running on port 8000. Check CORS settings in `settings.py`.
-   **Chart Labels Incorrect**: Ensure use of `summary` object in API response for global stats, and `results` list for individual records.
-   **Login Failure**: Use the credentials created via `createsuperuser`.

---

## 9. Future Improvements (Roadmap)
-   **Real-time Updates**: WebSockets integration for live data streams.
-   **Advanced filtering**: Add date range filters to History and Dashboard.
-   **User Roles**: Multi-user support with read-only vs admin permissions.
-   **Dockerization**: `Dockerfile` and `docker-compose.yml` for unified deployment.
