from PyQt5.QtWidgets import QWidget, QVBoxLayout, QPushButton, QLabel, QFileDialog, QProgressBar, QMessageBox
from PyQt5.QtCore import Qt, QThread, pyqtSignal

class UploadThread(QThread):
    finished = pyqtSignal(bool, object, str) # success, data, error

    def __init__(self, api_client, file_path):
        super().__init__()
        self.api_client = api_client
        self.file_path = file_path

    def run(self):
        success, data, error = self.api_client.upload_dataset(self.file_path)
        self.finished.emit(success, data, str(error) if error else "")

class UploadWidget(QWidget):
    uploadSuccess = pyqtSignal(int)

    def __init__(self, api_client):
        super().__init__()
        self.api_client = api_client
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        
        self.label = QLabel("Drag & Drop CSV here or Click Upload")
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setStyleSheet("border: 2px dashed #555; padding: 40px; font-size: 16px; color: #aaa;")
        layout.addWidget(self.label)
        
        self.btn_upload = QPushButton("Select CSV File")
        self.btn_upload.clicked.connect(self.select_file)
        self.btn_upload.setFixedWidth(200)
        layout.addWidget(self.btn_upload, alignment=Qt.AlignCenter)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        layout.addStretch()
        self.setLayout(layout)
        self.setAcceptDrops(True)

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.accept()
        else:
            event.ignore()

    def dropEvent(self, event):
        files = [u.toLocalFile() for u in event.mimeData().urls()]
        if files:
             self.start_upload(files[0])

    def select_file(self):
        filename, _ = QFileDialog.getOpenFileName(self, "Open CSV", "", "CSV Files (*.csv)")
        if filename:
            self.start_upload(filename)

    def start_upload(self, filename):
        if not filename.endswith('.csv'):
            QMessageBox.warning(self, "Invalid File", "Please upload a CSV file.")
            return

        self.label.setText(f"Uploading {filename}...")
        self.progress_bar.setVisible(True)
        self.progress_bar.setRange(0, 0) # Indeterminate
        self.btn_upload.setEnabled(False)
        
        self.thread = UploadThread(self.api_client, filename)
        self.thread.finished.connect(self.on_upload_finished)
        self.thread.start()

    def on_upload_finished(self, success, data, error):
        self.progress_bar.setVisible(False)
        self.btn_upload.setEnabled(True)
        
        if success:
            dataset_id = data.get('id')
            self.label.setText("Upload Successful!")
            self.uploadSuccess.emit(dataset_id)
        else:
            self.label.setText("Upload Failed")
            QMessageBox.critical(self, "Upload Failed", error)
