from PyQt5.QtWidgets import (QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, 
                               QPushButton, QHBoxLayout, QHeaderView, QMessageBox, QFileDialog, QLabel)
from PyQt5.QtCore import pyqtSignal

class HistoryWidget(QWidget):
    datasetSelected = pyqtSignal(int)

    def __init__(self, api_client):
        super().__init__()
        self.api_client = api_client
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Header text
        lbl = QLabel("History")
        lbl.setStyleSheet("font-size: 20px; font-weight: bold; color: #f8fafc;")
        layout.addWidget(lbl)
        
        # Helper Text
        helper = QLabel("Select a dataset below to view its dashboard or download a report.")
        helper.setStyleSheet("color: #94a3b8; padding-bottom: 10px;")
        layout.addWidget(helper)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(3)
        self.table.setHorizontalHeaderLabels(["ID", "Filename", "Uploaded At"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        
        # Table Styling tweaks via Code
        self.table.verticalHeader().setDefaultSectionSize(45) # Taller rows
        self.table.setShowGrid(False) # Cleaner look
        self.table.setAlternatingRowColors(True)
        self.table.setStyleSheet("""
            QTableWidget {
                background-color: #1e293b;
                border: 1px solid #334155;
                gridline-color: #334155;
                alternate-background-color: #0f172a;
            }
            QTableWidget::item {
                padding: 5px;
            }
        """)

        layout.addWidget(self.table)
        
        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_refresh = QPushButton("Refresh List")
        self.btn_refresh.clicked.connect(self.refresh_history)
        
        self.btn_load = QPushButton("Load Dashboard")
        self.btn_load.clicked.connect(self.load_selected)
        
        self.btn_pdf = QPushButton("Download PDF Report")
        self.btn_pdf.clicked.connect(self.download_pdf)
        
        # Button styling specific overrides if needed, or rely on QSS
        
        btn_layout.addWidget(self.btn_refresh)
        btn_layout.addWidget(self.btn_load)
        btn_layout.addWidget(self.btn_pdf)
        
        layout.addLayout(btn_layout)
        self.setLayout(layout)

    def refresh_history(self):
        success, data, error = self.api_client.get_history()
        
        if success:
            self.table.setRowCount(0)
            if not isinstance(data, list):
                print(f"[ERROR] History data is not a list: {type(data)}")
                return

            for item in data:
                if isinstance(item, str):
                    print(f"[CRITICAL ERROR] History item is string: {item}")
                    continue # Skip invalid items
                    
                row = self.table.rowCount()
                self.table.insertRow(row)
                self.table.setItem(row, 0, QTableWidgetItem(str(item.get('id', 'N/A'))))
                self.table.setItem(row, 1, QTableWidgetItem(str(item.get('filename', 'Unknown'))))
                self.table.setItem(row, 2, QTableWidgetItem(str(item.get('upload_timestamp', ''))))
        else:
            if error:
                QMessageBox.warning(self, "History Error", f"Failed to load history: {error}")

    def get_selected_id(self):
        selected = self.table.selectedItems()
        if not selected:
            return None
        # Get ID from first column of selected row
        row = selected[0].row()
        item = self.table.item(row, 0)
        return int(item.text())

    def load_selected(self):
        dataset_id = self.get_selected_id()
        if dataset_id:
            self.datasetSelected.emit(dataset_id)
        else:
            QMessageBox.information(self, "Info", "Please select a dataset first.")

    def download_pdf(self):
        dataset_id = self.get_selected_id()
        if not dataset_id:
            QMessageBox.information(self, "Info", "Please select a dataset first.")
            return

        path, _ = QFileDialog.getSaveFileName(self, "Save PDF", f"report_{dataset_id}.pdf", "PDF Files (*.pdf)")
        if path:
            success, msg, error = self.api_client.get_dataset_report(dataset_id, path)
            if success:
                QMessageBox.information(self, "Success", "PDF Saved Successfully!")
            else:
                QMessageBox.critical(self, "Error", f"Download Failed: {error}")
