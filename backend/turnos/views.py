from rest_framework import viewsets
from .models import Turno
from .serializers import TurnoSerializer

class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all().order_by('fecha_hora')
    serializer_class = TurnoSerializer
