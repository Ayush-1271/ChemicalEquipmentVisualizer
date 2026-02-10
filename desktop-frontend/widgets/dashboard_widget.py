from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QHBoxLayout, QMessageBox, QFrame, QSizePolicy, QGridLayout
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import matplotlib.pyplot as plt

class DashboardWidget(QWidget):
    def __init__(self, api_client=None):
        super().__init__()
        self.api_client = api_client
        self.init_ui()

    def init_ui(self):
        self.layout = QVBoxLayout()
        self.layout.setSpacing(20)
        self.layout.setContentsMargins(20, 20, 20, 20)
        
        # Header
        self.lbl_title = QLabel("Dashboard: No Dataset Selected")
        self.lbl_title.setStyleSheet("font-size: 24px; font-weight: bold; color: #f8fafc;")
        self.layout.addWidget(self.lbl_title)

        # Stats Area
        self.stats_container = QWidget()
        self.stats_layout = QHBoxLayout(self.stats_container)
        self.stats_layout.setSpacing(15)
        self.stats_layout.setContentsMargins(0,0,0,0)
        
        self.lbl_count = self.create_stat_card("Total Units", "--", "#38bdf8")
        self.lbl_flow = self.create_stat_card("Avg Flow", "--", "#38bdf8")
        self.lbl_press = self.create_stat_card("Avg Press", "--", "#f43f5e")
        self.lbl_temp = self.create_stat_card("Avg Temp", "--", "#eab308")
        
        self.stats_layout.addWidget(self.lbl_count)
        self.stats_layout.addWidget(self.lbl_flow)
        self.stats_layout.addWidget(self.lbl_press)
        self.stats_layout.addWidget(self.lbl_temp)
        self.layout.addWidget(self.stats_container)
        
        # Chart Area (Grid Layout)
        # Row 1: Scatter (Clusters) | Top Flow (Bar)
        # Row 2: Composition (Donut) | Parallel Coords (Line) - Simplified to just 3 charts for space
        
        self.figure = Figure(figsize=(10, 8), dpi=100, facecolor='#0f172a') 
        self.canvas = FigureCanvas(self.figure)
        self.canvas.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.canvas.setStyleSheet("background-color: #0f172a;")
        self.layout.addWidget(self.canvas)
        
        self.setLayout(self.layout)

    def create_stat_card(self, title, value, border_color):
        lbl = QLabel(f"{title}\n{value}")
        # We use a border-left trick with a frame normally, but with QLabel we can simulate via style
        # OR just use text color
        lbl.setStyleSheet(f"""
            QLabel {{
                border: 1px solid #334155; 
                border-left: 4px solid {border_color};
                padding: 15px; 
                border-radius: 8px; 
                background: #1e293b; 
                color: #f1f5f9;
            }}
        """)
        return lbl

    def update_stat_card(self, lbl, title, value, unit="", color="#f1f5f9"):
        # HTML formatting for rich text
        lbl.setText(f"<html><head/><body><p>"
                    f"<span style='color:#94a3b8; font-size:10pt; font-weight:600;'>{title.upper()}</span><br/>"
                    f"<span style='color:{color}; font-size:22pt; font-weight:bold;'>{value}</span> "
                    f"<span style='color:#64748b; font-size:10pt;'>{unit}</span>"
                    f"</p></body></html>")

    def load_dataset(self, dataset_id):
        if not self.api_client: return
        self.lbl_title.setText(f"Loading Dataset {dataset_id}...")
        
        success, data, error = self.api_client.get_dataset_details(dataset_id)
        if success:
            summary = data.get('summary', {})
            results = data.get('results', [])
            # Fallback
            if not summary and 'avg_flowrate' in data: summary = data
            self.update_ui(summary, results, dataset_id)
        else:
            self.lbl_title.setText("Error Loading Dataset")
            QMessageBox.warning(self, "Error", f"Failed: {error}")

    def update_ui(self, summary, results, dataset_id):
        count_val = str(summary.get('count', '--'))
        self.lbl_title.setText(f"CHEMICAL VIZ PRO: ID {dataset_id} • {count_val} UNITS")
        
        # Update Stats
        self.update_stat_card(self.lbl_count, "Total Units", count_val, "", "#38bdf8")
        
        f_val = f"{summary.get('avg_flowrate', 0):.1f}"
        self.update_stat_card(self.lbl_flow, "Avg Flow", f_val, "L/min", "#38bdf8")
        
        p_val = f"{summary.get('avg_pressure', 0):.1f}"
        self.update_stat_card(self.lbl_press, "Avg Press", p_val, "Bar", "#f43f5e")
        
        t_val = f"{summary.get('avg_temperature', 0):.1f}"
        self.update_stat_card(self.lbl_temp, "Avg Temp", t_val, "°C", "#eab308")

        # Update Charts
        self.figure.clear()
        text_color = '#cbd5e1'
        bg_color = '#0f172a'
        
        # 1. Performance Clusters (Scatter)
        ax1 = self.figure.add_subplot(221)
        ax1.set_facecolor(bg_color)
        ax1.set_title("PERFORMANCE CLUSTERS (Flow vs Pressure)", color='#f8fafc', fontsize=10, pad=10, loc='left')
        
        if results:
            x = [r.get('flowrate', 0) for r in results]
            y = [r.get('pressure', 0) for r in results]
            sizes = [(r.get('temperature', 0) / 10) * 10 for r in results] # Scale size by temp
            
            # Simple color mapping by type
            types = list(set([r.get('type') for r in results]))
            colors_map = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#e879f9']
            c = [colors_map[types.index(r.get('type')) % len(colors_map)] for r in results]
            
            ax1.scatter(x, y, s=sizes, c=c, alpha=0.7, edgecolors='none')
            ax1.set_xlabel("Flowrate (L/min)", color=text_color, fontsize=8)
            ax1.set_ylabel("Pressure (Bar)", color=text_color, fontsize=8)
            ax1.tick_params(colors=text_color, labelsize=8)
            
            # Grid
            ax1.grid(color='#334155', linestyle='--', linewidth=0.5, alpha=0.5)
            for spine in ax1.spines.values(): spine.set_edgecolor('#334155')

        # 2. Top Flowrate (Horizontal Bar)
        ax2 = self.figure.add_subplot(222)
        ax2.set_facecolor(bg_color)
        ax2.set_title("TOP FLOWRATE (L/min)", color='#f8fafc', fontsize=10, pad=10, loc='left')
        
        if results:
            sorted_res = sorted(results, key=lambda x: x.get('flowrate', 0), reverse=True)[:5]
            names = [x.get('equipment_name', '?') for x in sorted_res]
            val_flow = [x.get('flowrate', 0) for x in sorted_res]
            y_pos = range(len(names))
            
            # Lollipop style
            ax2.hlines(y=y_pos, xmin=0, xmax=val_flow, color='#ec4899', alpha=0.9, linewidth=4)
            ax2.plot(val_flow, y_pos, "o", markersize=8, color='#ec4899')
            
            ax2.set_yticks(y_pos)
            ax2.set_yticklabels(names, color=text_color, fontsize=8)
            ax2.invert_yaxis()
            ax2.tick_params(axis='x', colors=text_color, labelsize=8)
            ax2.tick_params(axis='y', colors=text_color)
            
            for spine in ax2.spines.values(): spine.set_visible(False)
            ax2.spines['left'].set_visible(True)
            ax2.spines['left'].set_color('#334155')

        # 3. Composition (Donut)
        ax3 = self.figure.add_subplot(223)
        ax3.set_facecolor(bg_color)
        ax3.set_title("COMPOSITION", color='#f8fafc', fontsize=10, pad=10, loc='left')
        
        dist = summary.get('type_distribution', {})
        if dist:
            labels = list(dist.keys())
            sizes = list(dist.values())
            pie_colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#e879f9']
            
            wedges, texts = ax3.pie(sizes, labels=None, startangle=90, colors=pie_colors, 
                                   wedgeprops=dict(width=0.3, edgecolor=bg_color))
            
            # Center Text
            ax3.text(0, 0, count_val, ha='center', va='center', fontsize=20, fontweight='bold', color='#f1f5f9')
            
            # Legend to the right? Or separate? Let's hide labels on chart to keep clean
            # Maybe add a simple legend manually if needed, but pie slices usually self-explanatory with tooltip (not in static mpl though)
            ax3.legend(wedges, labels, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1), 
                      frameon=False, labelcolor=text_color, fontsize=8)

        # 4. Smart Table Preview (Just text for now in MPL, or we separate it)
        # Actually, MPL table is ugly. Let's make this quadrant a "summary text" or leave empty for now.
        # Let's do a Histogram of Flowrate instead for the 4th slot
        ax4 = self.figure.add_subplot(224)
        ax4.set_facecolor(bg_color)
        ax4.set_title("FLOW DISTRIBUTION", color='#f8fafc', fontsize=10, pad=10, loc='left')
        
        if results:
            flows = [r.get('flowrate', 0) for r in results]
            ax4.hist(flows, bins=10, color='#22d3ee', alpha=0.7, rwidth=0.85)
            ax4.tick_params(colors=text_color, labelsize=8)
            for spine in ax4.spines.values(): spine.set_edgecolor('#334155')

        self.figure.tight_layout()
        self.canvas.draw()
