from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UploadViewSet, HistoryViewSet, DatasetDetailViewSet, CustomAuthToken, UserViewSet
# from rest_framework_nested import routers # REMOVED
# Requirement: /api/dataset/<id>/...
# I can use DRF routers.

router = DefaultRouter()
router.register(r'upload', UploadViewSet, basename='upload')
router.register(r'history', HistoryViewSet, basename='history')
router.register(r'users', UserViewSet, basename='users')
# For Dataset Detail, we want /dataset/<pk>/
# And /dataset/<pk>/report/
# And /dataset/<pk>/ (list records?)
# Wait, `DatasetDetailViewSet` has `get_queryset` filtering by `dataset_pk`.
# This implies nested structure if using nested routers, or a manual path.
# "Get /api/dataset/<id>/" -> Paginated equipment records.
# So `DatasetDetailViewSet` acts on EquipmentRecord but scoped to Dataset.
# Let's handle this carefully.

from rest_framework.urlpatterns import format_suffix_patterns

dataset_list = DatasetDetailViewSet.as_view({
    'get': 'list'
})
dataset_report = DatasetDetailViewSet.as_view({
    'get': 'report'
})
dataset_summary = DatasetDetailViewSet.as_view({
    'get': 'summary'
})

urlpatterns = [
    path('login/', CustomAuthToken.as_view()),
    path('', include(router.urls)),
    path('dataset/<int:dataset_pk>/', dataset_list, name='dataset-records'),
    path('dataset/<int:dataset_pk>/report/', dataset_report, name='dataset-report'),
    path('dataset/<int:dataset_pk>/summary/', dataset_summary, name='dataset-summary'),
]
