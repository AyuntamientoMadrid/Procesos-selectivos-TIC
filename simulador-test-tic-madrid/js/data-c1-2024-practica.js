window.EXAM_DATA = window.EXAM_DATA || {};
const DATA_C1_2024_PRACTICA = {
  "id": "c1-2024-practica",
  "title": "Parte Práctica — Técnico/a Auxiliar T.I.C. (Conv. 2024)",
  "grupo": "C1",
  "convocatoria": "2024",
  "tipo": "practica",
  "date": "Convocatoria 2024",
  "timeMinutes": 50,
  "scenario": "Supuesto práctico: Despliegue de Puestos Ofimáticos y Soporte TIC en la Red de Centros Culturales del Ayuntamiento de Madrid\n\nEres Técnico/a Auxiliar TIC en el Organismo Informática del Ayuntamiento de Madrid (IAM), adscrito/a al Servicio de Soporte a Usuarios y Gestión de Puestos de Trabajo. El Ayuntamiento va a renovar el equipamiento microinformático de 15 Centros Culturales del Distrito Centro y Arganzuela.\n\nEl proyecto contempla:\n1. Despliegue de 250 puestos de trabajo cliente con Windows 11 Enterprise y suites corporativas conectadas al Directorio Activo municipal (`madrid.local`).\n2. Configuración de subredes locales `/24` en cada centro, conectadas a la WAN corporativa municipal mediante switches gestionables y puntos de acceso Wi-Fi corporativo (WPA3-Enterprise con 802.1X).\n3. Automatización de tareas mediante scripts PowerShell y Bash, gestión de directivas GPO para seguridad de endpoint y despliegue de certificados de usuario (FNMT).\n4. Protocolo de atención de incidencias del CAU municipal bajo marco ITIL (gestión de incidencias, solicitudes y cambios).",
  "totalQuestions": 25,
  "reserveQuestions": 0,
  "stipulatedQuestions": 25,
  "questions": [
    {
      "id": 1,
      "question": "Se necesita configurar la interfaz de red de un equipo técnico con IP estática en la subred `10.25.14.0/24`. La puerta de enlace es `10.25.14.1` y los servidores DNS corporativos son `10.0.1.10` y `10.0.1.11`. ¿Qué comando PowerShell realiza esta configuración en una sola línea o bloque?",
      "options": {
        "a": "New-NetIPAddress -InterfaceAlias 'Ethernet' -IPAddress '10.25.14.50' -PrefixLength 24 -DefaultGateway '10.25.14.1'; Set-DnsClientServerAddress -InterfaceAlias 'Ethernet' -ServerAddresses ('10.0.1.10','10.0.1.11')",
        "b": "ipconfig /setip '10.25.14.50' /mask '255.255.255.0' /gw '10.25.14.1' /dns '10.0.1.10'",
        "c": "Set-NetworkDevice -Name 'Ethernet' -StaticIP '10.25.14.50/24' -Router '10.25.14.1'"
      },
      "correct": "a"
    },
    {
      "id": 2,
      "question": "Al unir un nuevo equipo Windows 11 al dominio `madrid.local`, aparece el error: 'No se puede contactar con un controlador de dominio de Active Directory para el dominio madrid.local'. El equipo tiene conectividad IP con la puerta de enlace. ¿Cuál es el primer diagnóstico que debe realizarse?",
      "options": {
        "a": "Verificar que el equipo tiene configurado como servidor DNS primario la IP del controlador de dominio de Active Directory y que puede resolver los registros SRV `_ldap._tcp.dc._msdcs.madrid.local`.",
        "b": "Reinstalar inmediatamente la tarjeta de red y sustituir el cable de par trenzado.",
        "c": "Desactivar el firewall perimetral de la sede central de Madrid."
      },
      "correct": "a"
    },
    {
      "id": 3,
      "question": "Se requiere crear una directiva GPO para impedir la ejecución de programas desde unidades extraíbles USB en todos los puestos del centro. ¿En qué sección de la directiva de grupo se configura este bloqueo?",
      "options": {
        "a": "Configuración del equipo > Plantillas administrativas > Sistema > Acceso de almacenamiento extraíble > Todas las clases de almacenamiento extraíble: Denegar todo acceso.",
        "b": "Configuración de usuario > Panel de control > Dispositivos e impresoras > Deshabilitar USB 3.0.",
        "c": "Configuración del equipo > Ajustes de Windows > Scripts de apagado > Format-USB.ps1."
      },
      "correct": "a"
    },
    {
      "id": 4,
      "question": "Un usuario reporta que al intentar acceder a la sede electrónica municipal aparece el mensaje: 'No se encuentra ningún certificado digital válido'. El usuario dispone de certificado de la FNMT emitido en tarjeta criptográfica DNIe. ¿Qué comprobación es correcta?",
      "options": {
        "a": "Comprobar que el lector de tarjetas inteligentes está reconocido por el sistema, el servicio 'Tarjeta inteligente' (SCardSvr) está iniciado y el software criptográfico (DNIe / tarjeta FNMT) está instalado.",
        "b": "Eliminar la carpeta Windows/System32/drivers/etc para regenerar los certificados de raíz.",
        "c": "Modificar el archivo hosts para redirigir la sede electrónica a localhost."
      },
      "correct": "a"
    },
    {
      "id": 5,
      "question": "En un script PowerShell de mantenimiento, se desea comprobar si el servicio del cliente de antivirus corporativo (`DefenderService`) está en ejecución y, si no lo está, iniciarlo y registrar el evento. ¿Qué fragmento de código es correcto?",
      "options": {
        "a": "```powershell\n$svc = Get-Service -Name 'DefenderService'\nif ($svc.Status -ne 'Running') {\n    Start-Service -Name 'DefenderService'\n    Write-Output 'Servicio iniciado correctamente'\n}\n```",
        "b": "```powershell\nif (Check-Service 'DefenderService' == $false) {\n    Run-Service 'DefenderService'\n}\n```",
        "c": "```powershell\nGet-Process 'DefenderService' | Stop-Process -Force\n```"
      },
      "correct": "a"
    },
    {
      "id": 6,
      "question": "En una subred `10.25.14.0/24`, ¿cuántas direcciones IP útiles para puestos de trabajo se pueden asignar si reservamos las 10 primeras para routers, switches e impresoras?",
      "options": {
        "a": "244 direcciones útiles.",
        "b": "254 direcciones útiles.",
        "c": "230 direcciones útiles."
      },
      "correct": "a"
    },
    {
      "id": 7,
      "question": "Se necesita desplegar una aplicación ofimática en formato MSI de forma silenciosa sin interacción del usuario a través de un script. ¿Qué parámetros de `msiexec.exe` deben utilizarse?",
      "options": {
        "a": "msiexec.exe /i \"paquete.msi\" /qn /norestart",
        "b": "msiexec.exe /uninstall \"paquete.msi\" /verbose",
        "c": "msiexec.exe /x \"paquete.msi\" /gui"
      },
      "correct": "a"
    },
    {
      "id": 8,
      "question": "Un puesto de trabajo conectado por cable a un switch Gigabit negocia la velocidad de enlace a solo 100 Mbps Half-Duplex. Tras sustituir el cable de parcheo por un cable Cat 6 certificado, la conexión negocia a 1 Gbps Full-Duplex. ¿Cuál era la causa más probable del problema?",
      "options": {
        "a": "Un par de cables dañado o conector RJ-45 defectuoso que impedía el uso de los 4 pares requeridos para Gigabit Ethernet (1000BASE-T).",
        "b": "Que el switch tenía la tabla CAM llena de direcciones MAC obsoletas.",
        "c": "Que la tarjeta de red requería una actualización de firmware de BIOS."
      },
      "correct": "a"
    },
    {
      "id": 9,
      "question": "En la gestión de incidencias ITIL, ¿cuál es la diferencia fundamental entre un 'Incidente' y un 'Problema'?",
      "options": {
        "a": "Un incidente es una interrupción no planificada o reducción de la calidad de un servicio TIC; un problema es la causa subyacente de uno o varios incidentes.",
        "b": "Un incidente lo resuelven exclusivamente los programadores; un problema lo resuelve el usuario final.",
        "c": "No hay diferencia, son términos equivalentes en la norma ISO 20000."
      },
      "correct": "a"
    },
    {
      "id": 10,
      "question": "En un servidor local Linux que actúa como servidor de impresión y archivos, se necesita otorgar permisos de lectura y escritura al grupo `culturales` sobre el directorio `/var/compartido` sin que otros usuarios puedan acceder. ¿Qué secuencia de comandos es correcta?",
      "options": {
        "a": "chown -R root:culturales /var/compartido && chmod -R 770 /var/compartido",
        "b": "chmod -R 777 /var/compartido",
        "c": "chown -R nobody:nogroup /var/compartido && chmod 600 /var/compartido"
      },
      "correct": "a"
    },
    {
      "id": 11,
      "question": "Un técnico detecta que los puestos de un centro cultural no reciben parámetros IP por DHCP tras reiniciar el switch de planta. Se comprueba que el servidor DHCP está en otra subred central (`10.0.2.0/24`). ¿Qué configuración es necesaria en el router o switch de capa 3 para permitir el tráfico DHCP?",
      "options": {
        "a": "Configurar una IP Helper Address (DHCP Relay Agent) en la interfaz VLAN correspondiente apuntando a la IP del servidor DHCP central.",
        "b": "Habilitar el protocolo RIP v1 en todos los puestos cliente.",
        "c": "Desactivar el cortafuegos perimetral del centro cultural."
      },
      "correct": "a"
    },
    {
      "id": 12,
      "question": "Para auditar los inicios de sesión fallidos en un puesto con Windows 11, ¿en qué registro del Visor de Eventos de Windows se debe buscar y qué ID de evento corresponde a un fallo de autenticación?",
      "options": {
        "a": "Registro de 'Seguridad' (Security), Event ID 4625.",
        "b": "Registro de 'Sistema' (System), Event ID 1000.",
        "c": "Registro de 'Aplicación' (Application), Event ID 7036."
      },
      "correct": "a"
    },
    {
      "id": 13,
      "question": "Se quiere programar una tarea en Windows para que ejecute un script PowerShell `C:\\Scripts\\limpieza.ps1` todos los domingos a las 23:00. ¿Qué comando `schtasks` o cmdlet de PowerShell es adecuado?",
      "options": {
        "a": "schtasks /create /tn \"LimpiezaSemanal\" /tr \"powershell.exe -ExecutionPolicy Bypass -File C:\\Scripts\\limpieza.ps1\" /sc weekly /d SUN /st 23:00",
        "b": "schtasks /run /now C:\\Scripts\\limpieza.ps1",
        "c": "Set-CronJob -Time 23:00 -Sunday -Script C:\\Scripts\\limpieza.ps1"
      },
      "correct": "a"
    },
    {
      "id": 14,
      "question": "Un monitor de un puesto de trabajo se apaga intermitentemente cada pocos segundos. El técnico comprueba que el cable de vídeo HDMI está bien fijado y el brillo configurado correctamente. ¿Cuál es el siguiente paso diagnóstico más eficiente?",
      "options": {
        "a": "Probar el monitor con otro cable de vídeo y en otro equipo para aislar si el fallo está en el panel/fuente del monitor, en el cable o en la salida gráfica del PC.",
        "b": "Cambiar la placa base y el procesador del ordenador.",
        "c": "Reinstalar el sistema operativo desde cero mediante PXE."
      },
      "correct": "a"
    },
    {
      "id": 15,
      "question": "En una auditoría de seguridad del puesto, se detecta que los usuarios pueden conectar memorias USB personales y ejecutar ejecutables portables. Para mitigarlo con tecnologías nativas de Windows Enterprise, se debe implementar:",
      "options": {
        "a": "AppLocker o Control de aplicaciones de Windows Defender (WDAC) mediante directivas GPO.",
        "b": "Desinstalar el explorador de archivos Windows Explorer.",
        "c": "Configurar una IP pública en la tarjeta de red del puesto."
      },
      "correct": "a"
    },
    {
      "id": 16,
      "question": "En la red Wi-Fi municipal del centro cultural, los puestos corporativos deben autenticarse mediante credenciales individuales de Directorio Activo o certificado digital. ¿Qué estándar de seguridad Wi-Fi proporciona esta funcionalidad?",
      "options": {
        "a": "WPA2/WPA3 Enterprise con autenticación IEEE 802.1X y servidor RADIUS.",
        "b": "WPA-Personal con clave precompartida (PSK) fija escrita en el router.",
        "c": "Filtrado por dirección MAC sin cifrado."
      },
      "correct": "a"
    },
    {
      "id": 17,
      "question": "Para comprobar la ruta que siguen los paquetes IP desde el puesto cliente hasta el servidor de la sede electrónica `sede.madrid.es` y localizar el salto donde se produce latencia, ¿qué herramienta se utiliza?",
      "options": {
        "a": "tracert sede.madrid.es (en Windows) o traceroute sede.madrid.es (en Linux).",
        "b": "nslookup -type=mx sede.madrid.es",
        "c": "netstat -e"
      },
      "correct": "a"
    },
    {
      "id": 18,
      "question": "Un usuario borra por error un archivo importante de su carpeta personal alojada en un servidor de archivos Windows con Instantáneas de volumen (Shadow Copies / VSS) activadas. ¿Cómo puede el técnico recuperar el archivo rápidamente?",
      "options": {
        "a": "Hacer clic derecho sobre la carpeta contenedora > Propiedades > pestaña 'Versiones anteriores' y restaurar la copia previa deseada.",
        "b": "Formatear el volumen y volcar el backup completo semanal en cinta magnética.",
        "c": "Ejecutar el comando chkdsk /f /r sobre el disco C: del cliente."
      },
      "correct": "a"
    },
    {
      "id": 19,
      "question": "Al ejecutar un script `.ps1` en PowerShell, aparece el error: 'La ejecución de scripts está deshabilitada en este sistema'. ¿Qué directiva de ejecución permite ejecutar scripts firmados por una autoridad de confianza o scripts locales?",
      "options": {
        "a": "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser",
        "b": "Set-ExecutionPolicy Restricted -Force",
        "c": "Disable-PowerShellSecurity -All"
      },
      "correct": "a"
    },
    {
      "id": 20,
      "question": "En un equipo cliente con Windows 11, se requiere liberar espacio en disco eliminando los archivos residuales de actualizaciones anteriores de Windows Update (`SoftwareDistribution/Download`). ¿Qué herramienta nativa es la más segura y recomendada?",
      "options": {
        "a": "El Liberador de espacio en disco (cleanmgr.exe) ejecutado como Administrador seleccionando 'Limpieza de actualizaciones de Windows'.",
        "b": "Borrar manualmente todo el directorio C:\\Windows\\System32.",
        "c": "Ejecutar diskpart y seleccionar clean all sobre el volumen principal."
      },
      "correct": "a"
    },
    {
      "id": 21,
      "question": "Se necesita verificar si un puerto TCP (por ejemplo, el puerto 443 del servidor `10.0.5.20`) está accesible a través de los cortafuegos intermedios sin instalar herramientas de terceros. ¿Qué comando PowerShell realiza esta comprobación?",
      "options": {
        "a": "Test-NetConnection -ComputerName '10.0.5.20' -Port 443",
        "b": "Ping-Port -Host '10.0.5.20' -TCP 443",
        "c": "Connect-Socket -Address '10.0.5.20' -P 443"
      },
      "correct": "a"
    },
    {
      "id": 22,
      "question": "El puesto de trabajo de un centro cultural sufre apagados repentinos cuando se abren múltiples aplicaciones pesadas al mismo tiempo. El visor de eventos registra un apagado crítico por temperatura. ¿Cuál es la causa técnica más habitual?",
      "options": {
        "a": "Acumulación de polvo en el disipador/ventilador de la CPU o degradación de la pasta térmica del procesador.",
        "b": "Un fallo en la configuración de la zona horaria del sistema operativo.",
        "c": "Que la memoria RAM está configurada con demasiada memoria virtual."
      },
      "correct": "a"
    },
    {
      "id": 23,
      "question": "En el marco del Esquema Nacional de Seguridad (ENS), ¿qué medida debe aplicarse a los puestos de trabajo que manejan información sensible cuando el usuario se ausenta temporalmente de su puesto?",
      "options": {
        "a": "Bloqueo automático de la sesión por inactividad tras un tiempo predefinido (ej. 5-10 minutos) protegido por contraseña.",
        "b": "Apagado total del interruptor general del edificio.",
        "c": "Desconectar el cable de red para evitar accesos remotos."
      },
      "correct": "a"
    },
    {
      "id": 24,
      "question": "Se desea clonar una imagen maestra de Windows 11 preparada con Sysprep en 20 equipos idénticos a través de la red local. ¿Qué tecnología de Microsoft permite el despliegue masivo por arranque en red (PXE)?",
      "options": {
        "a": "WDS (Windows Deployment Services) / Microsoft Endpoint Configuration Manager (MECM).",
        "b": "Hyper-V Quick Create.",
        "c": "Internet Information Services (IIS)."
      },
      "correct": "a"
    },
    {
      "id": 25,
      "question": "Un usuario reporta que su teclado inalámbrico no responde. Tras cambiar las pilas por unas nuevas, el teclado sigue sin funcionar. ¿Qué comprobación rápida debe realizar el técnico?",
      "options": {
        "a": "Comprobar que el receptor nano-USB está correctamente insertado en un puerto USB funcional del PC y que el interruptor de encendido del teclado está en posición 'ON'.",
        "b": "Actualizar el controlador de la tarjeta gráfica y reiniciar el router del centro.",
        "c": "Sustituir la fuente de alimentación del ordenador de sobremesa."
      },
      "correct": "a"
    }
  ]
};

window.EXAM_DATA["c1-2024-practica"] = DATA_C1_2024_PRACTICA;
if (typeof window !== 'undefined') {
  window.DATA_C1_2024_PRACTICA = DATA_C1_2024_PRACTICA;
}
