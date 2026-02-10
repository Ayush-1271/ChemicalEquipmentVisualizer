# Chemical Equipment Parameter Visualizer

A robust, hybrid application designed to visualize and analyze chemical equipment parameters (Flowrate, Pressure, Temperature). This project consists of a **Django Backend** (Single Source of Truth), a **React Web Frontend**, and a **PyQt5 Desktop Frontend**, ensuring a seamless cross-platform experience.

## 🚀 Key Features

### 🌐 Hybrid Architecture
- **Single Backend API**: Both web and desktop apps consume the same RESTful API.
- **Real-time Synchronization**: Data uploaded from one platform is instantly available on the other.

### 📊 Advanced Visualization (Dashboard)
- **Performance Clusters**: Bubble/Scatter chart correlating Flowrate vs. Pressure, sized by Temperature.
- **Top Performers**: "Lollipop" chart highlighting equipment with the highest flowrates.
- **Composition Analysis**: Donut chart showing the distribution of equipment types (Pump, Valve, Tank, etc.).
- **Smart Analytics**: Automated calculation of averages, correlations, and outliers.

### 🔒 Security & Management
- **Token-Based Authentication**: Secure access for all endpoints.
- **Role-Based Access Control**: Admin/Staff distinction (Web App).
- **Automated Cleanup**: The system automatically retains only the 5 most recent uploads to maintain relevance.

### 📄 Reporting & History
- **PDF Generation**: Server-side generation of detailed PDF reports (`reportlab`) containing summary stats and tables.
- **History Tracking**: Complete history of uploaded datasets with download options.

---

## 🛠️ Technology Stack

| Component | Tech | Details |
| :--- | :--- | :--- |
| **Backend** | Python / Django 5.x | Django REST Framework (DRF), Pandas (Analysis), SQLite (DB) |
| **Web App** | React / Vite | Chart.js, CSS Modules (Vanilla), Axios |
| **Desktop App** | Python / PyQt5 | Matplotlib (Embedded), Requests, QSS Styling |

---

## ⚙️ Setup & Installation

### Prerequisites
- **Python 3.10+**
- **Node.js** & **npm**

### 1️⃣ Backend (Django)
Runs the core API server.

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*Server runs at: `http://127.0.0.1:8000/`*
*Default Admin: `admin` / `adminpass`*

### 2️⃣ Web Application (React)
The primary user interface.

```bash
cd web-frontend
npm install
npm run dev
```
*App runs at: `http://localhost:5173/`*

### 3️⃣ Desktop Application (PyQt5)
The native alternative.

```bash
cd desktop-frontend
pip install -r requirements.txt
python main.py
```
*Launches the native window.*

---

## 🧪 Usage Guide

1.  **Login**: Use the default credentials (`admin`/`adminpass` or `user1`/`userpass`).
2.  **Upload**: Navigate to the "Upload" tab. Drag & drop a CSV file containing equipment data.
    -   *Schema expected*: `Equipment_Name, Type, Average_Flowrate, Average_Pressure, Average_Temperature`.
3.  **Analyze**: Go to "Dashboard" to see the auto-generated visualization for the uploaded dataset.
4.  **Report**: Go to "History" and click "Download Report" to get a PDF summary.

---

## 📂 Project Structure

```
ChemicalEquipmentVisualizer/
├── backend/                # Django Project
│   ├── core/               # Main App (Models, Views, Serializers)
│   ├── media/              # PDF Storage
│   └── manage.py
├── web-frontend/           # React Project
│   ├── src/
│   │   ├── components/     # Dashboard, Upload, History, Login
│   │   └── api.js          # Central API Handler
├── desktop-frontend/       # PyQt5 Project
│   ├── widgets/            # Sidebar, Dashboard, Upload
│   ├── main.py             # Entry Point
│   └── styles.qss          # Dark Theme Styling
└── data/                   # Sample CSVs
```

## ✨ Design Philosophy
The application follows a "Deep Navy" / "Quantico" aesthetic (`#0f172a`), focusing on readability and a data-first approach. The UI is designed to be cleaner and more professional than typical internal tools.
