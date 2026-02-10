from django.db import models

class Dataset(models.Model):
    filename = models.CharField(max_length=255)
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    summary_stats = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.filename} ({self.upload_timestamp})"

class EquipmentRecord(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='records')
    equipment_name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    flowrate = models.FloatField()
    pressure = models.FloatField()
    temperature = models.FloatField()

    def __str__(self):
        return f"{self.equipment_name} - {self.type}"
