from PyQt5.QtWidgets import QWidget, QVBoxLayout, QPushButton, QLabel, QFrame
from PyQt5.QtCore import pyqtSignal, Qt, QSize
from PyQt5.QtGui import QIcon, QPainter, QColor

class SidebarButton(QPushButton):
    def __init__(self, text, icon_name=None, parent=None):
        super().__init__(text, parent)
        self.setCheckable(True)
        self.setAutoExclusive(True)
        self.setFixedHeight(50)
        self.setCursor(Qt.PointingHandCursor)
        # We will use QSS to style init, hover, and checked states

class SidebarWidget(QWidget):
    pageChanged = pyqtSignal(int) # Emits index of page to show

    def __init__(self):
        super().__init__()
        self.setFixedWidth(240) # Sidebar width
        self.setAttribute(Qt.WA_StyledBackground, True)
        self.setObjectName("Sidebar") # For QSS
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 20)
        layout.setSpacing(10)
        
        # 1. Brand Header
        header = QLabel("ChemicalViz Pro")
        header.setObjectName("SidebarHeader")
        header.setAlignment(Qt.AlignCenter)
        header.setFixedHeight(80)
        layout.addWidget(header)
        
        # 2. Navigation Buttons
        self.btn_group = []
        
        # Define buttons (Text, Index)
        buttons = [
            ("Upload", 0),
            ("Dashboard", 1),
            ("History", 2)
        ]
        
        for text, index in buttons:
            btn = SidebarButton(text)
            btn.clicked.connect(lambda checked, idx=index: self.pageChanged.emit(idx))
            layout.addWidget(btn)
            self.btn_group.append(btn)
            
            if index == 1: # Default to Dashboard
                btn.setChecked(True)

        layout.addStretch()
        
        # 3. User / Footer
        # Optional: Add user info or logout here later
        
        self.setLayout(layout)

    def set_active_index(self, index):
        if 0 <= index < len(self.btn_group):
            self.btn_group[index].setChecked(True)
