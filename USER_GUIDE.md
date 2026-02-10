# User Guide & Operation Manual

## 🔑 Login Credentials

Use the following credentials to access both the Web and Desktop applications:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `adminpass` | Full Access + User Management |
| **Standard User** | `user1` | `userpass` | Upload & View Only |

---

## 🚀 How to Operate

### 1. Starting the Application

**Step A: Start the Backend Server**
1.  Open a terminal in the `backend/` folder.
2.  Run: `python manage.py runserver`
3.  Keep this terminal open.

**Step B: Start the Web App (Optional)**
1.  Open a new terminal in `web-frontend/`.
2.  Run: `npm run dev`
3.  Open the link shown (usually `http://localhost:5173`).

**Step C: Start the Desktop App (Optional)**
1.  Open a new terminal in `desktop-frontend/`.
2.  Run: `python main.py`

---

### 2. Using the Application

#### A. Uploading Data
1.  Log in using the credentials above.
2.  Navigate to the **Upload** tab (Web) or click "Upload" in the Sidebar (Desktop).
3.  **Drag & Drop** a CSV file into the upload area.
    *   *Sample Data*: You can find sample CSV files in the `data/` folder of this project.
4.  Wait for the progress bar to complete. You will see a success message.

#### B. Analyzing Data (Dashboard)
1.  Once uploaded, the app automatically redirects you to the **Dashboard**.
2.  **KPI Cards**: View top-level metrics (Total Units, Avg Flowrate, etc.).
3.  **Charts**:
    *   **Performance Clusters**: Hover over bubbles to see individual equipment details.
    *   **Top Flowrate**: Identify the highest performing units.
    *   **Composition**: See the breakdown of equipment types.

#### C. Generating Reports
1.  Navigate to the **History** tab.
2.  Select a dataset from the list.
3.  Click **"Download Report"** (Web) or **"Download PDF"** (Desktop).
4.  The server will generate a comprehensive PDF summary which you can save to your computer.

---

## ❓ Troubleshooting

-   **"Login Failed"**: Ensure the Backend Server (Step A) is running.
-   **"Upload Failed"**: Check if your CSV matches the required columns: `Equipment_Name`, `Type`, `Average_Flowrate`, `Average_Pressure`, `Average_Temperature`.
-   **"Blank Page"**: Refresh the browser (Web) or restart `main.py` (Desktop).
