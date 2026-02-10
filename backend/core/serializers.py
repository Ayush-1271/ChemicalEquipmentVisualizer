from rest_framework import serializers
from .models import Dataset, EquipmentRecord

class EquipmentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentRecord
        fields = '__all__'

class DatasetSerializer(serializers.ModelSerializer):
    record_count = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = ['id', 'filename', 'upload_timestamp', 'summary_stats', 'record_count']

    def get_record_count(self, obj):
        return obj.summary_stats.get('count', 0)

from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
