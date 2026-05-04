# Proyecto CRM propio para gestión de cartera de clientes con agente por Telegram

## 1. Resumen ejecutivo

Se plantea el desarrollo de un CRM propio, ligero, escalable y adaptado a la forma de trabajo de una pequeña consultora o agencia tecnológica. El objetivo es gestionar la cartera de clientes, controlar el pipeline comercial, registrar actividades, asignar tareas, agendar reuniones, organizar documentos y permitir que los usuarios internos puedan interactuar con el sistema desde Telegram mediante un agente conversacional controlado.

El CRM no debe ser únicamente una agenda de contactos. Debe convertirse en una herramienta diaria de seguimiento comercial y operativo, ayudando a responder con claridad a preguntas como:

- Qué clientes tenemos en cartera.
- En qué estado está cada oportunidad.
- Qué se habló con cada cliente.
- Qué tareas están pendientes.
- Qué reuniones hay previstas.
- Qué documentos existen por cliente.
- Qué oportunidades requieren seguimiento.
- Qué clientes llevan demasiado tiempo sin actividad.

La primera versión debe ser funcional, sencilla y útil desde el primer día, pero con una arquitectura preparada para evolucionar.

---

## 2. Objetivo del proyecto

El objetivo principal es construir una aplicación CRM propia que permita a dos usuarios internos gestionar de forma centralizada todo el ciclo comercial y de seguimiento de clientes.

### Objetivos concretos

1. Centralizar la información de clientes y empresas.
2. Controlar el estado comercial de cada oportunidad mediante un pipeline tipo Kanban.
3. Registrar automáticamente y manualmente la actividad relacionada con cada cliente.
4. Gestionar tareas asignadas a cada usuario y vinculadas a clientes u oportunidades.
5. Agendar reuniones y seguimientos mediante un calendario interno.
6. Mantener un inventario documental por cliente.
7. Disponer de un panel de control con indicadores básicos.
8. Permitir interacción desde Telegram para crear, consultar y actualizar información del CRM.
9. Garantizar trazabilidad de cambios y control de acciones realizadas por usuarios o por el agente.
10. Diseñar una base técnica limpia, mantenible y escalable.

---

## 3. Alcance funcional general

El proyecto se divide en los siguientes módulos funcionales:

1. Clientes.
2. Oportunidades comerciales.
3. Pipeline Kanban.
4. Actividades e historial.
5. Tareas.
6. Calendario.
7. Documentos.
8. Dashboard.
9. Agente por Telegram.
10. Configuración y catálogos.
11. Auditoría y seguridad.

---

## 4. Enfoque recomendado

La recomendación es desarrollar un CRM propio con una arquitectura sencilla pero profesional:

- Aplicación web accesible desde escritorio y móvil.
- Base de datos relacional.
- Autenticación de usuarios.
- Permisos básicos por rol.
- Interfaz limpia y rápida.
- Modelo de datos bien separado.
- Agente por Telegram conectado mediante API propia.
- Validaciones estrictas antes de ejecutar acciones automáticas.

El CRM debe evitar convertirse en una herramienta pesada. Su valor estará en que permita trabajar rápido, consultar información en segundos y registrar actividad con muy poca fricción.

---

## 5. Usuarios del sistema

### Usuario administrador

Usuario con control total del CRM.

Puede:

- Crear, editar y eliminar clientes.
- Gestionar oportunidades.
- Crear y asignar tareas.
- Subir documentos.
- Ver todo el pipeline.
- Configurar catálogos.
- Revisar auditoría.
- Usar el agente de Telegram.

### Usuario comercial / socio

Usuario interno con permisos operativos.

Puede:

- Crear y editar clientes.
- Gestionar sus oportunidades.
- Crear actividades.
- Crear y completar tareas.
- Agendar reuniones.
- Subir documentos.
- Consultar dashboard.
- Usar el agente de Telegram.

### Sistema / agente

Actor técnico que ejecuta acciones solicitadas desde Telegram.

Puede:

- Interpretar comandos.
- Consultar clientes.
- Crear registros.
- Proponer acciones.
- Ejecutar acciones permitidas.
- Solicitar confirmación en acciones sensibles.
- Registrar toda actividad ejecutada.

---

## 6. Módulo de clientes

### Finalidad

El módulo de clientes será el núcleo del CRM. Permitirá registrar clientes, potenciales clientes, empresas y contactos principales.

### Datos del cliente

#### Datos identificativos

| Campo | Descripción | Obligatorio |
|---|---|---|
| Nombre | Nombre del contacto principal | Sí |
| Apellidos | Apellidos del contacto | No |
| Empresa | Empresa asociada | No, pero recomendable |
| Cargo | Cargo del contacto | No |
| Email | Correo electrónico principal | No |
| Teléfono | Teléfono principal | No |
| Web | Página web de la empresa | No |
| LinkedIn | Perfil de LinkedIn personal o de empresa | No |
| Provincia | Provincia del cliente | No |
| Localidad | Localidad del cliente | No |

#### Datos comerciales

| Campo | Descripción | Obligatorio |
|---|---|---|
| Estado | Estado comercial actual | Sí |
| Sector | Sector de actividad | No |
| Origen | Cómo llegó el cliente | No |
| Responsable | Usuario interno responsable | Sí |
| Prioridad | Baja, media, alta o urgente | No |
| Etiquetas | Clasificación libre o semiestructurada | No |
| Resumen | Descripción general del cliente | No |
| Última actividad | Fecha de la última interacción | Automático |
| Próxima acción | Siguiente acción prevista | Automático/manual |

### Estados de cliente recomendados

| Estado | Descripción |
|---|---|
| Nuevo lead | Cliente identificado pero todavía no trabajado |
| Contactado | Ya se ha realizado una primera acción comercial |
| Reunión agendada | Existe una reunión prevista |
| En diagnóstico | Se están analizando necesidades |
| Propuesta pendiente | Hay que preparar propuesta |
| Propuesta enviada | La propuesta ya se ha enviado |
| En negociación | El cliente está valorando o negociando |
| Ganado | La oportunidad se ha cerrado positivamente |
| Perdido | La oportunidad se ha descartado |
| Dormido | No avanza ahora, pero puede recuperarse |
| Cliente activo | Cliente con servicio o proyecto en marcha |
| Cliente inactivo | Cliente histórico sin actividad actual |

### Ficha de cliente

Cada cliente tendrá una ficha propia con pestañas:

1. Resumen.
2. Actividad.
3. Oportunidades.
4. Tareas.
5. Calendario.
6. Documentos.
7. Notas internas.

### Vista de clientes

La pantalla de clientes debe permitir:

- Buscar por nombre, empresa, email o teléfono.
- Filtrar por estado.
- Filtrar por responsable.
- Filtrar por sector.
- Filtrar por origen.
- Filtrar por clientes sin actividad reciente.
- Ordenar por última actividad.
- Ordenar por próxima acción.
- Crear cliente.
- Editar cliente.
- Acceder a la ficha completa.

---

## 7. Módulo de oportunidades comerciales

### Finalidad

Una oportunidad representa una posibilidad comercial concreta asociada a un cliente.

Es importante separar cliente de oportunidad porque un mismo cliente puede tener varias oportunidades a lo largo del tiempo.

Ejemplo:

- Cliente: Gestoría López.
- Oportunidad 1: Automatización de emails.
- Oportunidad 2: CRM interno.
- Oportunidad 3: Agente para atención a clientes.

### Datos de una oportunidad

| Campo | Descripción | Obligatorio |
|---|---|---|
| Cliente | Cliente asociado | Sí |
| Título | Nombre de la oportunidad | Sí |
| Descripción | Descripción de la necesidad | No |
| Etapa | Fase del pipeline | Sí |
| Valor estimado | Importe aproximado | No |
| Probabilidad | Probabilidad de cierre | No |
| Fecha estimada de cierre | Fecha prevista | No |
| Responsable | Usuario responsable | Sí |
| Motivo de pérdida | Si se pierde la oportunidad | No |
| Fecha de creación | Automática | Sí |
| Fecha de actualización | Automática | Sí |

### Etapas recomendadas del pipeline

1. Nuevo lead.
2. Contactado.
3. Reunión agendada.
4. Diagnóstico / análisis.
5. Propuesta en preparación.
6. Propuesta enviada.
7. Negociación.
8. Ganado.
9. Perdido.
10. Dormido / seguimiento futuro.

### Valor ponderado del pipeline

Cada oportunidad puede tener:

- Valor estimado.
- Probabilidad de cierre.
- Valor ponderado.

Ejemplo:

- Valor estimado: 5.000 €.
- Probabilidad: 60%.
- Valor ponderado: 3.000 €.

Esto permite disponer de una previsión comercial más realista.

---

## 8. Pipeline tipo Kanban

### Finalidad

El pipeline debe permitir visualizar el estado de las oportunidades de forma clara mediante columnas tipo Kanban.

Cada columna representa una etapa comercial. Cada tarjeta representa una oportunidad.

### Columnas propuestas

```text
Nuevo lead → Contactado → Reunión agendada → Diagnóstico → Propuesta en preparación → Propuesta enviada → Negociación → Ganado / Perdido / Dormido
```

### Información visible en cada tarjeta

Cada tarjeta debería mostrar:

- Nombre del cliente.
- Empresa.
- Título de la oportunidad.
- Responsable.
- Próxima acción.
- Fecha de próxima acción.
- Valor estimado.
- Probabilidad.
- Número de tareas pendientes.
- Indicador de retraso.
- Etiquetas principales.

### Acciones desde una tarjeta

Desde cada tarjeta se podrá:

- Abrir ficha de cliente.
- Abrir oportunidad.
- Cambiar estado.
- Crear tarea.
- Añadir nota.
- Agendar reunión.
- Marcar como ganado.
- Marcar como perdido.
- Marcar como dormido.

### Registro automático de cambios

Cuando una oportunidad se mueva de una columna a otra, el sistema debe registrar automáticamente una actividad:

```text
Yuri movió la oportunidad "CRM interno" de "Diagnóstico" a "Propuesta en preparación".
```

Este registro quedará en el historial del cliente y de la oportunidad.

---

## 9. Módulo de actividades e historial

### Finalidad

El historial permite saber qué ha ocurrido con cada cliente. Es uno de los módulos más importantes del CRM.

La actividad debe poder crearse manualmente, pero también automáticamente cuando ocurren determinados eventos.

### Tipos de actividad

| Tipo | Ejemplo |
|---|---|
| Nota | Se añade una observación interna |
| Email | Se registra envío de email |
| Llamada | Se registra llamada realizada |
| Reunión | Se registra reunión mantenida o prevista |
| Cambio de estado | Se registra movimiento en el pipeline |
| Documento | Se registra subida o modificación documental |
| Tarea creada | Se crea una tarea asociada |
| Tarea completada | Se completa una tarea |
| Recordatorio | Se añade un aviso futuro |
| Telegram | Acción recibida desde el agente |

### Datos de una actividad

| Campo | Descripción |
|---|---|
| Cliente asociado | Cliente al que pertenece |
| Oportunidad asociada | Opcional |
| Tipo | Nota, llamada, reunión, cambio de estado, etc. |
| Descripción | Texto de la actividad |
| Usuario | Usuario que la crea |
| Origen | Web, sistema o Telegram |
| Fecha | Fecha de creación |

### Timeline de cliente

En la ficha del cliente se mostrará una línea temporal con todas las actividades ordenadas cronológicamente.

Ejemplo:

```text
25/04/2026 - Email enviado - Se envía presentación inicial.
26/04/2026 - Reunión agendada - Reunión de diagnóstico para el lunes.
27/04/2026 - Cambio de estado - De Contactado a Reunión agendada.
28/04/2026 - Nota - Cliente interesado en automatizar seguimiento de incidencias.
```

---

## 10. Módulo de tareas

### Finalidad

Las tareas deben permitir controlar el trabajo diario asociado a cada cliente u oportunidad.

La pregunta que debe responder este módulo es:

```text
¿Qué hay que hacer, quién lo hace y para cuándo?
```

### Datos de una tarea

| Campo | Descripción | Obligatorio |
|---|---|---|
| Título | Nombre breve de la tarea | Sí |
| Descripción | Detalle de la tarea | No |
| Cliente asociado | Cliente relacionado | No, pero recomendable |
| Oportunidad asociada | Oportunidad relacionada | No |
| Responsable | Usuario asignado | Sí |
| Estado | Pendiente, en curso, bloqueada, completada, cancelada | Sí |
| Prioridad | Baja, media, alta, urgente | Sí |
| Fecha límite | Vencimiento | No |
| Recordatorio | Aviso asociado | No |
| Creada por | Usuario creador | Automático |
| Fecha de creación | Fecha automática | Automático |

### Estados de tarea

1. Pendiente.
2. En curso.
3. Bloqueada.
4. Completada.
5. Cancelada.

### Vistas de tareas

El sistema debe ofrecer varias vistas:

1. Mis tareas.
2. Tareas de mi socio.
3. Tareas vencidas.
4. Tareas de hoy.
5. Tareas de esta semana.
6. Tareas por cliente.
7. Tareas por oportunidad.
8. Kanban de tareas.

### Kanban de tareas

Columnas recomendadas:

```text
Pendiente → En curso → Bloqueada → Completada
```

Este Kanban no debe confundirse con el pipeline comercial. El pipeline representa oportunidades. El Kanban de tareas representa trabajo operativo.

---

## 11. Módulo de calendario

### Finalidad

El calendario permitirá gestionar reuniones, llamadas, seguimientos y recordatorios vinculados a clientes.

### Tipos de evento

| Tipo | Ejemplo |
|---|---|
| Reunión comercial | Primera reunión con cliente |
| Reunión de diagnóstico | Análisis de necesidades |
| Presentación de propuesta | Reunión para explicar oferta |
| Llamada de seguimiento | Llamada tras enviar propuesta |
| Recordatorio | Revisar cliente dormido |
| Vencimiento | Fecha límite relevante |

### Datos de un evento

| Campo | Descripción |
|---|---|
| Título | Nombre del evento |
| Cliente asociado | Cliente relacionado |
| Oportunidad asociada | Opcional |
| Tipo | Reunión, llamada, seguimiento, etc. |
| Fecha y hora de inicio | Inicio del evento |
| Fecha y hora de fin | Fin del evento |
| Descripción | Detalle del evento |
| Responsable | Usuario responsable |
| Estado | Programado, realizado, cancelado |

### Vistas necesarias

- Vista mensual.
- Vista semanal.
- Vista diaria.
- Filtro por usuario.
- Filtro por cliente.
- Filtro por tipo de evento.

### Reglas recomendadas

1. Toda reunión debe quedar asociada a un cliente.
2. Después de una reunión, el sistema debe sugerir crear una nota de resumen.
3. Una reunión comercial puede generar una tarea de seguimiento.
4. Un evento cancelado debe permanecer en el historial.

---

## 12. Módulo de documentos

### Finalidad

El módulo de documentos permitirá mantener un inventario documental ordenado por cliente y oportunidad.

No se trata solo de subir archivos, sino de tener control documental básico.

### Tipos de documento

| Tipo | Ejemplo |
|---|---|
| Propuesta comercial | PDF enviado al cliente |
| Presupuesto | Oferta económica |
| Contrato | Documento firmado |
| Briefing | Documento de necesidades |
| Acta de reunión | Resumen formal de reunión |
| Documento técnico | Análisis o especificación |
| Imagen / captura | Evidencia gráfica |
| Otro | Documento no clasificado |

### Datos de un documento

| Campo | Descripción |
|---|---|
| Nombre | Nombre del documento |
| Cliente asociado | Cliente propietario |
| Oportunidad asociada | Opcional |
| Tipo | Propuesta, contrato, briefing, etc. |
| Estado | Borrador, enviado, aprobado, rechazado, firmado |
| Versión | v1, v2, v3, etc. |
| Archivo | Ruta del archivo en almacenamiento |
| Observaciones | Notas internas |
| Subido por | Usuario |
| Fecha de subida | Automática |

### Estados de documento

1. Borrador.
2. Enviado.
3. Aprobado.
4. Rechazado.
5. Firmado.
6. Archivado.

### Control básico de versiones

El sistema debe permitir diferenciar versiones de un mismo documento.

Ejemplo:

```text
Propuesta CRM IA v1.pdf
Propuesta CRM IA v2.pdf
Propuesta CRM IA v3 enviada.pdf
Propuesta CRM IA v4 aceptada.pdf
```

---

## 13. Dashboard

### Finalidad

El dashboard debe ser la pantalla inicial del CRM. Debe dar una visión rápida de la situación comercial y operativa.

### Indicadores recomendados

| Indicador | Utilidad |
|---|---|
| Leads nuevos del mes | Medir entrada comercial |
| Clientes contactados | Medir actividad |
| Reuniones agendadas | Ver tracción |
| Propuestas enviadas | Medir avance |
| Oportunidades ganadas | Ver conversión |
| Oportunidades perdidas | Analizar pérdidas |
| Valor total del pipeline | Previsión comercial |
| Valor ponderado del pipeline | Previsión ajustada |
| Tareas vencidas | Control operativo |
| Tareas de hoy | Ejecución diaria |
| Próximas reuniones | Planificación |
| Clientes sin actividad reciente | Prevención de abandono |

### Bloques del dashboard

1. Resumen comercial.
2. Tareas pendientes.
3. Tareas vencidas.
4. Próximas reuniones.
5. Pipeline resumido.
6. Clientes sin actividad.
7. Últimas actividades.
8. Accesos rápidos.

### Alertas recomendadas

- Cliente sin actividad en 15 días.
- Propuesta enviada sin seguimiento en 7 días.
- Tarea vencida.
- Reunión realizada sin nota posterior.
- Lead nuevo sin contactar en 3 días.
- Oportunidad en negociación más de 20 días.
- Cliente ganado sin tarea de arranque creada.

---

## 14. Agente por Telegram

### Finalidad

El agente por Telegram permitirá interactuar con el CRM desde el móvil de forma rápida, sin tener que abrir siempre la aplicación web.

El objetivo no es sustituir la interfaz del CRM, sino reducir fricción en acciones frecuentes.

### Principios de diseño del agente

1. El agente no debe modificar datos críticos sin validación.
2. Toda acción ejecutada debe quedar registrada.
3. El agente debe pedir aclaración cuando haya ambigüedad.
4. El agente debe trabajar con funciones cerradas, no con acceso libre a base de datos.
5. El agente debe confirmar las acciones ejecutadas.
6. El agente debe rechazar instrucciones no permitidas.

### Acciones permitidas en la primera versión

| Acción | Ejemplo de mensaje |
|---|---|
| Crear cliente | Crea cliente Juan Pérez, empresa Reformas Cáceres, teléfono 600123123 |
| Buscar cliente | Busca Clínica Norte |
| Añadir nota | Añade nota a Clínica Norte: quiere propuesta antes del viernes |
| Cambiar estado | Pasa Clínica Norte a propuesta enviada |
| Crear tarea | Crea tarea para llamar a Ana el martes |
| Consultar tareas | Qué tareas tengo hoy |
| Consultar pipeline | Qué oportunidades están en negociación |
| Agendar reunión | Agenda reunión con Gestoría López el lunes a las 10 |
| Registrar llamada | Registra llamada con Clínica Norte: revisamos dudas de la propuesta |

### Acciones que requieren confirmación

| Acción | Confirmación necesaria |
|---|---|
| Crear cliente | No, si los datos son claros |
| Añadir nota | No |
| Crear tarea | No |
| Agendar reunión | Sí, si falta fecha/hora clara |
| Cambiar estado | Sí, si hay ambigüedad |
| Marcar como ganado | Sí |
| Marcar como perdido | Sí |
| Eliminar registros | Siempre |
| Modificar datos sensibles | Sí |

### Ejemplo de flujo correcto

Mensaje en Telegram:

```text
Pasa Clínica Norte a propuesta enviada y crea tarea para llamar el viernes.
```

Interpretación estructurada:

```json
{
  "intent": "update_opportunity_and_create_task",
  "client_name": "Clínica Norte",
  "new_stage": "Propuesta enviada",
  "task": {
    "title": "Llamar para seguimiento",
    "due_date": "viernes"
  }
}
```

Validaciones:

1. Comprobar que el usuario de Telegram está autorizado.
2. Buscar cliente por nombre.
3. Comprobar si hay un único resultado.
4. Validar que la etapa existe.
5. Interpretar la fecha.
6. Ejecutar cambio.
7. Crear tarea.
8. Registrar actividad.
9. Confirmar por Telegram.

Respuesta esperada:

```text
He actualizado Clínica Norte a "Propuesta enviada" y he creado la tarea "Llamar para seguimiento" para el viernes.
```

### Ejemplo con ambigüedad

Mensaje:

```text
Añade nota a López: quiere presupuesto.
```

Si existen varios clientes parecidos:

```text
He encontrado varios clientes que coinciden con "López":
1. Gestoría López
2. Ana López - Clínica Dental Norte
3. López & Asociados

¿A cuál quieres añadir la nota?
```

### Comandos recomendados

Aunque el agente debe aceptar lenguaje natural, también conviene soportar comandos simples:

```text
/cliente crear
/cliente buscar
/tarea crear
/tareas hoy
/pipeline
/reunion crear
/nota añadir
```

Esto ayuda cuando el usuario quiere ser más preciso.

---

## 15. Arquitectura funcional del agente de Telegram

### Flujo técnico

```text
Usuario escribe en Telegram
        ↓
Bot de Telegram recibe mensaje
        ↓
Webhook envía mensaje a la API del CRM
        ↓
API valida usuario autorizado
        ↓
Motor de interpretación analiza intención
        ↓
API valida datos y permisos
        ↓
Se ejecuta acción permitida
        ↓
Se registra actividad y auditoría
        ↓
Bot responde al usuario
```

### Componentes del agente

1. Bot de Telegram.
2. Webhook de recepción.
3. Servicio de autenticación de usuario Telegram.
4. Servicio de interpretación de intención.
5. Capa de validación.
6. Capa de acciones del CRM.
7. Registro de auditoría.
8. Servicio de respuesta.

### Tabla de usuarios de Telegram

Será necesario asociar cada usuario interno del CRM con su usuario de Telegram.

| Campo | Descripción |
|---|---|
| id | Identificador interno |
| user_id | Usuario del CRM |
| telegram_user_id | ID de usuario de Telegram |
| telegram_username | Alias de Telegram |
| active | Si está autorizado |
| created_at | Fecha de alta |

### Seguridad del agente

El sistema debe comprobar siempre:

- Que el mensaje viene de un usuario autorizado.
- Que el usuario tiene permisos en el CRM.
- Que la acción solicitada está permitida.
- Que los datos interpretados son válidos.
- Que no hay ambigüedad crítica.
- Que las acciones sensibles tienen confirmación.

---

## 16. Automatizaciones internas

### Automatizaciones recomendadas para el MVP ampliado

1. Al mover una oportunidad a "Propuesta enviada", crear tarea automática de seguimiento.
2. Al marcar una oportunidad como "Ganada", crear tareas de arranque.
3. Al completar una reunión, solicitar nota de resumen.
4. Al detectar cliente sin actividad en X días, mostrar alerta.
5. Al crear una tarea con fecha límite, mostrarla en calendario.
6. Al subir documento, registrar actividad.
7. Al cambiar responsable, registrar actividad.

### Ejemplo de tarea automática

Si una oportunidad pasa a "Propuesta enviada":

```text
Crear tarea automática:
Título: Hacer seguimiento de propuesta
Responsable: responsable de la oportunidad
Fecha límite: dentro de 7 días
Prioridad: media
```

---

## 17. Modelo de datos propuesto

### Tabla `users`

Usuarios internos del CRM.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| name | text | Nombre del usuario |
| email | text | Email |
| role | text | admin / user |
| active | boolean | Usuario activo |
| created_at | timestamp | Fecha de alta |
| updated_at | timestamp | Fecha de actualización |

### Tabla `clients`

Clientes y leads.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| first_name | text | Nombre |
| last_name | text | Apellidos |
| company | text | Empresa |
| position | text | Cargo |
| email | text | Email |
| phone | text | Teléfono |
| website | text | Web |
| linkedin | text | LinkedIn |
| province | text | Provincia |
| city | text | Localidad |
| sector | text | Sector |
| source | text | Origen del lead |
| status | text | Estado |
| priority | text | Prioridad |
| summary | text | Resumen del cliente |
| owner_id | UUID | Responsable |
| last_activity_at | timestamp | Última actividad |
| next_action_at | timestamp | Próxima acción |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |

### Tabla `opportunities`

Oportunidades comerciales.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| client_id | UUID | Cliente asociado |
| title | text | Título |
| description | text | Descripción |
| stage | text | Etapa del pipeline |
| estimated_value | numeric | Valor estimado |
| probability | integer | Probabilidad |
| weighted_value | numeric | Valor ponderado |
| expected_close_date | date | Fecha estimada de cierre |
| lost_reason | text | Motivo de pérdida |
| owner_id | UUID | Responsable |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |

### Tabla `activities`

Historial de actividad.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| client_id | UUID | Cliente asociado |
| opportunity_id | UUID | Oportunidad asociada |
| type | text | Tipo de actividad |
| description | text | Descripción |
| origin | text | web / system / telegram |
| created_by | UUID | Usuario creador |
| created_at | timestamp | Fecha |

### Tabla `tasks`

Tareas.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| client_id | UUID | Cliente asociado |
| opportunity_id | UUID | Oportunidad asociada |
| title | text | Título |
| description | text | Descripción |
| status | text | Estado |
| priority | text | Prioridad |
| due_date | timestamp | Fecha límite |
| assigned_to | UUID | Usuario asignado |
| created_by | UUID | Usuario creador |
| completed_at | timestamp | Fecha de finalización |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |

### Tabla `calendar_events`

Eventos de calendario.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| client_id | UUID | Cliente asociado |
| opportunity_id | UUID | Oportunidad asociada |
| title | text | Título |
| description | text | Descripción |
| type | text | Tipo de evento |
| start_at | timestamp | Inicio |
| end_at | timestamp | Fin |
| status | text | Programado / realizado / cancelado |
| owner_id | UUID | Responsable |
| created_by | UUID | Creador |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |

### Tabla `documents`

Documentos por cliente.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| client_id | UUID | Cliente asociado |
| opportunity_id | UUID | Oportunidad asociada |
| name | text | Nombre |
| type | text | Tipo de documento |
| status | text | Estado |
| version | text | Versión |
| storage_path | text | Ruta del archivo |
| notes | text | Observaciones |
| uploaded_by | UUID | Usuario |
| created_at | timestamp | Fecha de subida |
| updated_at | timestamp | Fecha de actualización |

### Tabla `telegram_users`

Relación entre usuarios del CRM y usuarios de Telegram.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| user_id | UUID | Usuario CRM |
| telegram_user_id | text | ID de Telegram |
| telegram_username | text | Alias |
| active | boolean | Autorizado |
| created_at | timestamp | Fecha de alta |

### Tabla `telegram_messages`

Registro de mensajes recibidos y respuestas enviadas.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| telegram_user_id | text | Usuario Telegram |
| user_id | UUID | Usuario CRM |
| message_text | text | Mensaje recibido |
| interpreted_intent | jsonb | Intención interpretada |
| status | text | received / processed / failed / pending_confirmation |
| response_text | text | Respuesta enviada |
| created_at | timestamp | Fecha |

### Tabla `audit_log`

Auditoría de cambios.

| Campo | Tipo aproximado | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| user_id | UUID | Usuario |
| actor_type | text | user / system / telegram_agent |
| entity_type | text | client / opportunity / task / document / event |
| entity_id | UUID | Identificador del registro afectado |
| action | text | create / update / delete |
| before_data | jsonb | Datos anteriores |
| after_data | jsonb | Datos posteriores |
| created_at | timestamp | Fecha |

---

## 18. Arquitectura técnica recomendada

### Stack propuesto

| Capa | Tecnología recomendada |
|---|---|
| Frontend | Next.js con TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase Postgres |
| Autenticación | Supabase Auth |
| Almacenamiento | Supabase Storage |
| Backend ligero | API Routes / Server Actions / Edge Functions |
| Agente Telegram | Bot de Telegram + webhook propio |
| IA para interpretación | Modelo LLM mediante API |
| Calendario visual | FullCalendar o componente equivalente |
| Despliegue frontend | Vercel o servidor propio |
| Despliegue backend | Vercel / Supabase Functions / VPS ligero |

### Motivo de esta elección

Este stack permite avanzar rápido sin renunciar a una base profesional:

- Supabase reduce mucho la carga de backend inicial.
- Postgres permite modelar bien los datos.
- Next.js permite una aplicación moderna, rápida y mantenible.
- Telegram permite validar el agente sin complejidad excesiva.
- La arquitectura queda preparada para crecer.

---

## 19. Pantallas de la aplicación

### 1. Login

Pantalla de acceso para usuarios internos.

Funciones:

- Inicio de sesión.
- Recuperación de contraseña.
- Control de sesión.

### 2. Dashboard

Pantalla inicial con resumen operativo.

Incluye:

- Tareas de hoy.
- Tareas vencidas.
- Próximas reuniones.
- Pipeline resumido.
- Clientes sin actividad.
- Últimas actividades.

### 3. Clientes

Listado general de clientes.

Incluye:

- Tabla de clientes.
- Buscador.
- Filtros.
- Botón de crear cliente.
- Acceso rápido a ficha.

### 4. Ficha de cliente

Vista completa del cliente.

Pestañas:

- Resumen.
- Actividad.
- Oportunidades.
- Tareas.
- Calendario.
- Documentos.
- Notas.

### 5. Pipeline

Kanban comercial.

Incluye:

- Columnas por etapa.
- Tarjetas arrastrables.
- Filtros por responsable.
- Filtros por prioridad.
- Filtros por importe.

### 6. Tareas

Gestión de tareas.

Incluye:

- Vista lista.
- Vista Kanban.
- Filtro por usuario.
- Filtro por estado.
- Filtro por vencimiento.

### 7. Calendario

Vista de eventos y reuniones.

Incluye:

- Vista mensual.
- Vista semanal.
- Vista diaria.
- Creación de eventos.
- Asociación a cliente.

### 8. Documentos

Gestión documental.

Incluye:

- Listado de documentos.
- Subida de archivo.
- Filtros por cliente.
- Filtros por tipo.
- Filtros por estado.

### 9. Configuración

Administración básica.

Incluye:

- Usuarios.
- Estados.
- Tipos de actividad.
- Prioridades.
- Tipos de documento.
- Orígenes de lead.
- Sectores.

### 10. Agente Telegram

Panel de control del agente.

Incluye:

- Usuarios Telegram autorizados.
- Mensajes recibidos.
- Acciones ejecutadas.
- Acciones pendientes de confirmación.
- Errores.

---

## 20. Reglas de negocio

### Reglas sobre clientes

1. Todo cliente debe tener un responsable.
2. Todo cliente debe tener un estado.
3. La última actividad debe actualizarse automáticamente.
4. La próxima acción debe poder mostrarse en la ficha y en el dashboard.
5. Un cliente puede tener varias oportunidades.

### Reglas sobre oportunidades

1. Toda oportunidad debe estar asociada a un cliente.
2. Toda oportunidad debe tener una etapa.
3. Todo cambio de etapa debe registrar actividad.
4. Si una oportunidad se marca como perdida, debe indicarse motivo.
5. Si una oportunidad se marca como ganada, deben generarse tareas de arranque.

### Reglas sobre tareas

1. Toda tarea debe tener responsable.
2. Una tarea puede estar asociada a cliente, oportunidad o ambos.
3. Las tareas vencidas deben destacarse.
4. Al completar una tarea, debe registrarse actividad.

### Reglas sobre calendario

1. Todo evento comercial debe estar asociado a cliente.
2. Una reunión realizada debería generar nota posterior.
3. Los eventos cancelados no deben borrarse, sino marcarse como cancelados.

### Reglas sobre documentos

1. Todo documento debe estar asociado a cliente.
2. Todo documento debe tener tipo.
3. Toda subida de documento debe registrar actividad.
4. No se deben sobrescribir documentos sin conservar referencia de versión.

### Reglas sobre Telegram

1. Solo usuarios autorizados pueden usar el bot.
2. Toda instrucción debe validarse antes de ejecutarse.
3. Las acciones ambiguas deben pedir aclaración.
4. Las acciones sensibles deben pedir confirmación.
5. Toda acción ejecutada por Telegram debe registrarse en actividad y auditoría.

---

## 21. MVP recomendado

### Objetivo del MVP

Construir una primera versión operativa que permita trabajar ya con clientes, pipeline, tareas y actividades.

El MVP debe ser suficientemente útil para usarlo a diario, pero no debe intentar incluir todas las funcionalidades avanzadas desde el principio.

### Funcionalidades del MVP

#### Incluidas

1. Login de usuarios.
2. Gestión de clientes.
3. Ficha de cliente.
4. Estados de cliente.
5. Gestión de oportunidades.
6. Pipeline Kanban.
7. Registro de actividades.
8. Gestión de tareas.
9. Dashboard básico.
10. Auditoría básica.
11. Primer bot de Telegram con funciones limitadas.

#### No incluidas en el MVP inicial

1. Integraciones externas de calendario.
2. Generación automática de documentos.
3. Firma electrónica.
4. Informes avanzados.
5. Automatizaciones complejas.
6. Gestión avanzada de permisos.

### Funciones mínimas del bot en MVP

1. Crear cliente.
2. Buscar cliente.
3. Añadir nota.
4. Crear tarea.
5. Consultar tareas de hoy.
6. Cambiar estado de oportunidad.
7. Consultar oportunidades por estado.

---

## 22. Fases del proyecto

### Fase 1: Diseño funcional y modelo de datos

Objetivo:

Definir de forma cerrada las entidades, campos, estados, reglas y flujos principales.

Entregables:

- Documento funcional.
- Modelo de datos.
- Definición de estados.
- Definición de pantallas.
- Reglas de negocio.

### Fase 2: Base técnica

Objetivo:

Preparar el proyecto técnico.

Entregables:

- Proyecto Next.js.
- Supabase configurado.
- Autenticación.
- Tablas principales.
- Políticas básicas de seguridad.
- Layout principal.

### Fase 3: Clientes y ficha de cliente

Objetivo:

Construir el núcleo del CRM.

Entregables:

- Alta de clientes.
- Edición de clientes.
- Listado con filtros.
- Ficha de cliente.
- Actividades básicas.

### Fase 4: Oportunidades y pipeline

Objetivo:

Construir el flujo comercial.

Entregables:

- CRUD de oportunidades.
- Kanban de pipeline.
- Cambio de estado por arrastre.
- Registro automático de actividad.

### Fase 5: Tareas

Objetivo:

Gestionar el trabajo operativo.

Entregables:

- Crear tareas.
- Asignar tareas.
- Estados de tareas.
- Filtros.
- Vista de mis tareas.
- Tareas por cliente.

### Fase 6: Dashboard

Objetivo:

Crear visión de control.

Entregables:

- KPIs básicos.
- Tareas vencidas.
- Próximas acciones.
- Clientes sin actividad.
- Últimas actividades.

### Fase 7: Calendario y documentos

Objetivo:

Añadir planificación y control documental.

Entregables:

- Calendario interno.
- Eventos por cliente.
- Subida de documentos.
- Inventario documental.
- Estados de documento.

### Fase 8: Agente Telegram

Objetivo:

Permitir interacción conversacional desde Telegram.

Entregables:

- Bot de Telegram.
- Webhook.
- Asociación usuario CRM / usuario Telegram.
- Interpretación de comandos.
- Ejecución de acciones permitidas.
- Confirmaciones.
- Registro de auditoría.

---

## 23. Priorización recomendada

### Prioridad alta

- Clientes.
- Oportunidades.
- Pipeline.
- Actividades.
- Tareas.
- Dashboard básico.
- Seguridad mínima.

### Prioridad media

- Calendario.
- Documentos.
- Automatizaciones simples.
- Telegram básico.

### Prioridad posterior

- Informes avanzados.
- Integraciones externas.
- Generación documental.
- Automatizaciones avanzadas.
- Analítica comercial avanzada.

---

## 24. Riesgos del proyecto

### Riesgo 1: sobredimensionar el MVP

Intentar construir demasiadas funcionalidades desde el inicio puede retrasar el proyecto y hacerlo inmanejable.

Mitigación:

Definir un MVP claro y añadir funcionalidades por fases.

### Riesgo 2: mezclar conceptos

Cliente, oportunidad, actividad, tarea y documento son conceptos distintos. Si se mezclan, el sistema se vuelve confuso.

Mitigación:

Diseñar bien el modelo de datos desde el principio.

### Riesgo 3: confiar demasiado en el agente

El agente puede interpretar mal una instrucción.

Mitigación:

Usar funciones cerradas, validaciones, permisos y confirmaciones.

### Riesgo 4: baja adopción

Si registrar información cuesta demasiado, el CRM no se usará.

Mitigación:

Hacer una interfaz rápida y apoyarse en Telegram para acciones frecuentes.

### Riesgo 5: falta de trazabilidad

Sin auditoría, no se sabrá quién cambió qué.

Mitigación:

Registrar actividad y auditoría desde el MVP.

---

## 25. Criterios de éxito

El proyecto se considerará exitoso si:

1. Los usuarios pueden consultar en segundos el estado de cada cliente.
2. El pipeline refleja la situación comercial real.
3. Las tareas pendientes están claramente asignadas.
4. Ninguna oportunidad queda olvidada sin seguimiento.
5. Las reuniones y próximas acciones están visibles.
6. Los documentos están localizables por cliente.
7. El agente de Telegram permite registrar información sin abrir la web.
8. Toda acción importante queda trazada.
9. El CRM se usa de forma natural en el día a día.

---

## 26. Recomendación final

La mejor estrategia es construir un CRM propio centrado en uso real, no en acumular funcionalidades.

La primera versión debería priorizar:

1. Clientes.
2. Oportunidades.
3. Pipeline Kanban.
4. Actividades.
5. Tareas.
6. Dashboard.
7. Telegram básico.

Después se pueden añadir:

1. Calendario completo.
2. Documentos.
3. Automatizaciones.
4. Informes.
5. Agente más avanzado.

La clave del proyecto será mantener una arquitectura clara y una experiencia de uso muy rápida. El CRM debe ayudar a trabajar mejor, no convertirse en una carga administrativa.

---

# Anexo I. Alcance sugerido de CRM v1

## CRM v1 incluirá

- Autenticación.
- Gestión de clientes.
- Gestión de oportunidades.
- Pipeline Kanban.
- Registro de actividades.
- Gestión de tareas.
- Dashboard básico.
- Auditoría básica.
- Bot de Telegram con acciones limitadas.

## CRM v1 dejará preparado

- Calendario.
- Documentos.
- Automatizaciones.
- Informes.
- Agente avanzado.

## CRM v1 no intentará resolver todavía

- Integraciones externas complejas.
- Firma documental.
- Generación automática de propuestas.
- Analítica avanzada.
- Flujos comerciales complejos por equipo grande.

---

# Anexo II. Ejemplos de uso diario

## Caso 1: crear cliente desde Telegram

Mensaje:

```text
Crea cliente Marta Sánchez, empresa Clínica Norte, email marta@clinicanorte.es, interesada en automatizar citas.
```

Resultado:

- Se crea cliente.
- Se añade resumen.
- Se registra actividad de origen Telegram.
- Se confirma al usuario.

## Caso 2: registrar avance comercial

Mensaje:

```text
Pasa Clínica Norte a diagnóstico. Hemos hablado y quiere revisar automatización de citas y recordatorios.
```

Resultado:

- Se actualiza estado.
- Se crea actividad.
- Se actualiza última actividad.

## Caso 3: crear tarea

Mensaje:

```text
Crea tarea para llamar a Clínica Norte el viernes y revisar si han enviado la información.
```

Resultado:

- Se crea tarea.
- Se asocia al cliente.
- Se asigna al usuario solicitante.
- Se confirma por Telegram.

## Caso 4: consultar tareas

Mensaje:

```text
Qué tareas tengo hoy
```

Resultado:

El bot devuelve:

```text
Tareas para hoy:
1. Llamar a Clínica Norte.
2. Preparar propuesta para Gestoría López.
3. Revisar documento de Reformas Cáceres.
```

## Caso 5: consultar pipeline

Mensaje:

```text
Qué oportunidades están en propuesta enviada
```

Resultado:

El bot devuelve:

```text
Oportunidades en propuesta enviada:
1. Clínica Norte - Automatización de citas - 3.500 €
2. Gestoría López - CRM interno - 4.800 €
3. Reformas Cáceres - Automatización presupuestos - 2.200 €
```

---

# Anexo III. Prompt base para el agente de Telegram

```text
Eres un asistente interno conectado al CRM de una consultora tecnológica.

Tu función es interpretar mensajes enviados por usuarios autorizados desde Telegram y convertirlos en acciones estructuradas sobre el CRM.

Puedes ayudar a:
- Crear clientes.
- Buscar clientes.
- Añadir notas.
- Crear tareas.
- Cambiar estados de oportunidades.
- Agendar reuniones.
- Consultar tareas.
- Consultar oportunidades del pipeline.

Normas obligatorias:
1. No inventes datos.
2. Si falta información importante, pide aclaración.
3. Si hay varios clientes posibles, pide al usuario que elija.
4. No elimines registros sin confirmación explícita.
5. No marques oportunidades como ganadas o perdidas sin confirmación.
6. Devuelve siempre una intención estructurada en JSON.
7. No ejecutes acciones directamente; la API validará y ejecutará.
8. Toda acción debe poder ser auditada.

Formato de respuesta esperado:

{
  "intent": "nombre_de_la_intencion",
  "confidence": 0.0,
  "requires_confirmation": true,
  "missing_fields": [],
  "data": {}
}
```

---

# Anexo IV. Decisión de enfoque

La decisión recomendada es:

```text
Construir un CRM propio, con base técnica en Supabase y Next.js, centrado primero en clientes, oportunidades, pipeline, actividades, tareas y dashboard. Incorporar desde fases tempranas un agente interno por Telegram, pero con funciones limitadas, trazabilidad y confirmaciones para acciones sensibles.
```

Este enfoque equilibra rapidez, control, coste y capacidad de evolución.

