from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .models import Dataset, EquipmentRecord
from .serializers import DatasetSerializer, EquipmentRecordSerializer
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from django.contrib.auth.models import User
from .serializers import DatasetSerializer, EquipmentRecordSerializer, UserSerializer
from .serializers import DatasetSerializer, EquipmentRecordSerializer, UserSerializer
from rest_framework.permissions import IsAdminUser
import pandas as pd

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        })

class UploadViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file.name.endswith('.csv'):
             return Response({'error': 'Invalid file type. Only CSV allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(file)
            required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
            if not all(col in df.columns for col in required_cols):
                 return Response({'error': f'Missing columns. Required: {required_cols}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # numeric validation
            for col in ['Flowrate', 'Pressure', 'Temperature']:
                if not pd.to_numeric(df[col], errors='coerce').notnull().all():
                     return Response({'error': f'Column {col} contains non-numeric values'}, status=status.HTTP_400_BAD_REQUEST)

            # Compute stats
            stats = {
                'count': int(len(df)),
                'avg_flowrate': float(df['Flowrate'].mean()),
                'avg_pressure': float(df['Pressure'].mean()),
                'avg_temperature': float(df['Temperature'].mean()),
                'type_distribution': df['Type'].value_counts().to_dict()
            }

            # Save Dataset
            dataset = Dataset.objects.create(filename=file.name, summary_stats=stats)

            # Bulk Create Records
            records = [
                EquipmentRecord(
                    dataset=dataset,
                    equipment_name=row['Equipment Name'],
                    type=row['Type'],
                    flowrate=row['Flowrate'],
                    pressure=row['Pressure'],
                    temperature=row['Temperature']
                ) for _, row in df.iterrows()
            ]
            EquipmentRecord.objects.bulk_create(records)

            # Cleanup older than 5
            all_datasets = Dataset.objects.order_by('-upload_timestamp')
            if all_datasets.count() > 5:
                to_delete = all_datasets[5:]
                for d in to_delete:
                    d.delete()
            
            # Return full serialized dataset
            serializer = DatasetSerializer(dataset)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.pagination import PageNumberPagination

class HistoryPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class HistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Dataset.objects.order_by('-upload_timestamp')
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = HistoryPagination

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response({"error": "Cannot delete your own account"}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

class DatasetDetailViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EquipmentRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        dataset_id = self.kwargs['dataset_pk']
        return EquipmentRecord.objects.filter(dataset_id=dataset_id)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Inject summary into response
        try:
            dataset_pk = self.kwargs['dataset_pk']
            dataset = Dataset.objects.get(pk=dataset_pk)
            
            # Ensure response.data is mutable and is a dict (Pagination enabled)
            if hasattr(response.data, 'copy'):
                 data = response.data
            else:
                 data = response.data

            if isinstance(data, dict):
                data['summary'] = dataset.summary_stats
            
            # If for some reason it's not a dict (e.g. pagination disabled), wrap it
            # But we enforced pagination in settings.
            
        except Dataset.DoesNotExist:
            pass 
        return response

    @action(detail=False, methods=['get'])
    def summary(self, request, dataset_pk=None):
        dataset = get_object_or_404(Dataset, pk=dataset_pk)
        return Response(dataset.summary_stats)

    @action(detail=False, methods=['get'])
    def report(self, request, dataset_pk=None):
        dataset = get_object_or_404(Dataset, pk=dataset_pk)
        records = EquipmentRecord.objects.filter(dataset=dataset)[:20] # Preview

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{dataset.id}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        p.drawString(100, 750, f"Report for Dataset: {dataset.filename}")
        p.drawString(100, 730, f"Uploaded: {dataset.upload_timestamp}")
        
        y = 700
        p.drawString(100, y, "Summary Statistics:")
        y -= 20
        stats = dataset.summary_stats
        p.drawString(120, y, f"Count: {stats.get('count')}")
        y -= 15
        p.drawString(120, y, f"Avg Flowrate: {stats.get('avg_flowrate')}")
        y -= 15
        p.drawString(120, y, f"Avg Pressure: {stats.get('avg_pressure')}")
        y -= 15
        p.drawString(120, y, f"Avg Temp: {stats.get('avg_temperature')}")

        y -= 40
        p.drawString(100, y, "Data Preview (First 20 rows):")
        y -= 20
        for record in records:
            if y < 50:
                p.showPage()
                y = 750
            p.drawString(100, y, f"{record.equipment_name} | {record.type} | {record.flowrate}")
            y -= 15

        p.save()
        return response
