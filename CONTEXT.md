# Golf Tracker

Aplicación para registrar rondas de golf y analizar estadísticas de juego en el Jockey Club de Tucumán.

## Language

**Jugador**:
Una persona con cuenta en la app que registra sus propias rondas. Solo puede ver sus propios datos; no accede a rondas ni estadísticas de otros jugadores. Se registra con email y contraseña; Supabase envía un solo email de confirmación al crear la cuenta. Los ingresos posteriores son solo con email y contraseña, sin más emails. El registro es abierto: cualquiera con el link de la app puede crear su cuenta.
_Avoid_: Usuario, player, account

**Perfil**:
Los datos personales del jugador: nombre, apellido, HCP y avatar (imagen opcional). El email proviene de la autenticación. Todos los campos del perfil son editables en cualquier momento. Al primer login, el jugador debe completar nombre, apellido y HCP antes de acceder a la app.
_Avoid_: Cuenta, settings, user profile

**Handicap (HCP)**:
El índice de handicap del jugador, configurado en su perfil. Acepta decimales (ej. 12.4). Se resta del score gross total de la ronda para obtener el score neto. No se distribuye golpe por golpe según el HCP de cada hoyo. Al iniciar una ronda se precarga desde el perfil; el jugador puede cambiarlo para esa ronda. Si el HCP ingresado difiere del perfil, se actualiza el perfil y se usa ese valor para el score neto de la ronda.
_Avoid_: Índice, handicap de juego

**Score gross**:
La suma total de golpes (score) en los 18 hoyos de una ronda, sin aplicar handicap.
_Avoid_: Bruto, total

**Score neto**:
El score gross de la ronda menos el HCP usado en esa ronda.
_Avoid_: Net, total ajustado

**Ronda**:
Una partida de golf de 18 hoyos jugada por un jugador en una cancha, con fecha y estadísticas por hoyo. La fecha se registra automáticamente al iniciar la ronda y puede editarse después. Tiene dos estados: *en progreso* (carga hoyo por hoyo con autosave) y *finalizada* (18 hoyos completos). Un jugador solo puede tener una ronda en progreso a la vez; para iniciar otra debe retomar la existente o abandonarla (borrado permanente, sin rastro en historial ni estadísticas). Una ronda finalizada puede editarse o borrarse.
_Avoid_: Partida, game, session

**Cancha**:
Un recorrido de 18 hoyos con par, handicap y yardas fijos. Las canchas iniciales son Country (par 71, 6910 yds) y Alpa Sumaj (par 71, 6499 yds) del Jockey Club de Tucumán. Sus datos se cargan como seed fijo en la base de datos.
_Avoid_: Campo, course (en UI), layout

**Hoyo**:
Una unidad de juego dentro de una cancha, identificada por número (1–18), con par, handicap (HCP) y yardas predefinidos.
_Avoid_: Hole (en UI)

**Fairway**:
Si el tee shot terminó en el fairway. Valores: Sí, No, o No aplica (par 3 y casos donde no corresponde). No aplica no entra en el cálculo de % fairways.
_Avoid_: Calle, FW

**Penalidad desde tee**:
Si hubo una penalidad (stroke and distance, OB, agua, etc.) causada por el tee shot. Valores: Sí, No, o No aplica. No aplica no entra en estadísticas de driving.
_Avoid_: Penalidad, penalty

**GIR (Green in Regulation)**:
Si llegaste al green en el número de golpes que permite dos putts para par (par − 2). Valores: Sí o No.
_Avoid_: Green en regulación, GIR%

**Putts**:
Cantidad de golpes con el putter en un hoyo, después de estar en el green.
_Avoid_: Putt, puteo

**Ranking de hoyos**:
Clasificación personal de los 36 hoyos (18 × 2 canchas) según el promedio de golpes respecto al par de cada hoyo (score − par). Mejor hoyo = menor diferencia promedio vs par. Peor hoyo = mayor diferencia promedio vs par.
_Avoid_: Best holes, worst holes, top hoyos

**Evolución**:
Gráficos de tendencia en Historial (score, GIR, fairways, putts) calculados sobre rondas finalizadas. Filtros: cancha (Country, Alpa Sumaj o ambas) y rango de fechas.
_Avoid_: Tendencias, charts, gráficos
