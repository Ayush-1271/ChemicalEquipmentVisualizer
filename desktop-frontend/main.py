import sys
import matplotlib
matplotlib.use('Qt5Agg') # Force Qt5 Backend to prevent crashes
from PyQt5.QtWidgets import QApplication, QMainWindow, QStackedWidget, QHBoxLayout, QVBoxLayout, QWidget, QDialog, QLineEdit, QPushButton, QLabel, QMessageBox
from PyQt5.QtCore import pyqtSlot
from api_client import APIClient
from widgets.upload_widget import UploadWidget
from widgets.dashboard_widget import DashboardWidget
from widgets.history_widget import HistoryWidget
from widgets.sidebar_widget import SidebarWidget

class LoginDialog(QDialog):
    def __init__(self, api_client):
        super().__init__()
        self.api_client = api_client
        self.setWindowTitle("Login - Chemical Visualizer")
        self.setFixedWidth(300)
        self.token = None
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        self.username = QLineEdit(); self.username.setPlaceholderText("Username")
        self.password = QLineEdit(); self.password.setPlaceholderText("Password"); self.password.setEchoMode(QLineEdit.Password)
        btn = QPushButton("Login")
        btn.clicked.connect(self.do_login)
        
        layout.addWidget(QLabel("Welcome Back"))
        layout.addWidget(self.username)
        layout.addWidget(self.password)
        layout.addWidget(btn)
        self.setLayout(layout)

    def do_login(self):
        success, token = self.api_client.login(self.username.text(), self.password.text())
        if success:
            self.token = token
            self.accept()
        else:
            QMessageBox.warning(self, "Error", f"Login Failed: {token}")

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.api_client = APIClient()
        
        # Check for existing token or login
        if not self.api_client.token:
            if not self.login():
                sys.exit(0)

        self.setWindowTitle("Chemical Equipment Visualizer")
        self.setGeometry(100, 100, 1200, 800)
        self.init_ui()
        self.load_stylesheet()

    def login(self):
        dialog = LoginDialog(self.api_client)
        if dialog.exec_() == QDialog.Accepted:
            return True
        return False

    def init_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        # Main Layout: Horizontal [Sidebar | Content]
        h_layout = QHBoxLayout(central)
        h_layout.setContentsMargins(0, 0, 0, 0)
        h_layout.setSpacing(0)

        # 1. Sidebar
        self.sidebar = SidebarWidget()
        h_layout.addWidget(self.sidebar)

        # 2. Content Stack
        self.stack = QStackedWidget()
        
        # Initialize Widgets
        self.upload_widget = UploadWidget(self.api_client)
        self.dashboard_widget = DashboardWidget(self.api_client) 
        self.history_widget = HistoryWidget(self.api_client)

        # Connect Signals
        self.sidebar.pageChanged.connect(self.stack.setCurrentIndex)
        self.upload_widget.uploadSuccess.connect(self.on_upload_success)
        self.history_widget.datasetSelected.connect(self.on_dataset_selected)

        # Add Widgets to Stack (Order must match Sidebar buttons)
        self.stack.addWidget(self.upload_widget)      # Index 0
        self.stack.addWidget(self.dashboard_widget)   # Index 1
        self.stack.addWidget(self.history_widget)     # Index 2
        
        # Default View
        self.stack.setCurrentIndex(1) # Dashboard
        self.sidebar.set_active_index(1)
        
        # Handle Page Changes (e.g. refresh history)
        self.stack.currentChanged.connect(self.on_page_changed)

        h_layout.addWidget(self.stack)

    def load_stylesheet(self):
        try:
            with open("styles.qss", "r") as f:
                self.setStyleSheet(f.read())
        except:
            pass

    @pyqtSlot(int)
    def on_upload_success(self, dataset_id):
        QMessageBox.information(self, "Success", f"Dataset uploaded successfully! ID: {dataset_id}")
        self.sidebar.set_active_index(1) # Switch sidebar highlight
        self.stack.setCurrentIndex(1)    # Switch to Dashboard
        self.dashboard_widget.load_dataset(dataset_id)
        self.history_widget.refresh_history()

    @pyqtSlot(int)
    def on_dataset_selected(self, dataset_id):
        self.sidebar.set_active_index(1)
        self.stack.setCurrentIndex(1)
        self.dashboard_widget.load_dataset(dataset_id)

    def on_page_changed(self, index):
        if self.stack.currentWidget() == self.history_widget:
            self.history_widget.refresh_history()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
