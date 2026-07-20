from django.utils import timezone
from rest_framework import serializers
from .models import Turno

class TurnoSerializer(serializers.ModelSerializer):
    cliente = serializers.CharField(max_length=100, write_only=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, write_only=True, allow_null=True)

    class Meta:
        model = Turno
        fields = ['id', 'cliente', 'telefono', 'fecha_hora', 'servicio', 'atendido', 'creado_el']
        read_only_fields = ['creado_el']
    def validate_fecha_hora(self, value):
        #1. Evitar turnos en el pasado
        if value < timezone.now():
            raise serializers.ValidationError("No se pueden crear turnos en el pasado.")

        #2. Bloquear para que sean cada media hora (00 o 30)
        if value.minute !=0 and value.minute !=30:
            raise serializers.ValidationError("Los turnos solo pueden ser cada media hora.")
        
        #3. Evitar Lunes
        if value.weekday() == 0: # 0 es Lunes en Python
            raise serializers.ValidationError("Los lunes nos encontramos cerrados.")

        #4. Rangos horarios
        hora_turno = value.hour
        # Mañana de 9 a 13
        # Tarde de 16 a 21
        esta_en_rango_manana = (9 <= hora_turno < 13)
        esta_en_rango_tarde = (16 <= hora_turno <= 21)  # 21 incluidos
        
        if not (esta_en_rango_manana or esta_en_rango_tarde):
            raise serializers.ValidationError("El horario debe ser entre las 9:00-13:00 o 16:00-21:00.")
        
        #4. Evitar doble reserva (mismo dia y hora)
        existe_turno = Turno.objects.filter(fecha_hora=value).exists()
        
        if existe_turno:
            raise serializers.ValidationError("Ya existe un turno para esa fecha y hora.")
        
        return value