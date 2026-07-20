from django.db import models

class Turno(models.Model):
    #opciones para los servicios
    SERVICIOS_CHOICES = [
        ('Barba', 'Barba'),
        ('Corte', 'Corte'),
        ('Combo', 'Combo (Corte + Barba)'),
    ]

    cliente = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    fecha_hora = models.DateTimeField()
    servicio = models.CharField(max_length=10, choices=SERVICIOS_CHOICES)
    atendido = models.BooleanField(default=False)
    creado_el = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Turno de {self.cliente} - {self.fecha_hora}"
