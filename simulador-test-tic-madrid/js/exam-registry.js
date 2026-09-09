/**
 * Registro y Catálogo Oficial de Exámenes y Simulacros TIC
 * Ayuntamiento de Madrid
 * 
 * Soporta múltiples grupos (C1, A2, A1) y convocatorias (2026, 2025, 2024).
 */

const EXAMS_CATALOG = [
  // --- GRUPO C1: Técnico/a Auxiliar TIC (Pruebas Teórica y Práctica) ---
  {
    id: "c1-2025-teorica",
    grupo: "C1",
    grupoLabel: "C1 — Técnico/a Auxiliar TIC",
    convocatoria: "2025",
    tipo: "teorica",
    tipoLabel: "Parte Teórica",
    modalidad: "dividido",
    title: "Parte Teórica — Técnico/a Auxiliar T.I.C. (Conv. 2025)",
    subtitle: "Convocatoria 2025 • Turno Libre",
    date: "Convocatoria 2025",
    timeMinutes: 90,
    totalQuestions: 90,
    reserveQuestions: 0,
    hasScenario: false,
    dataFile: "js/data-c1-2025-teorica.js",
    dataVar: "DATA_C1_2025_TEORICA",
    badgeClass: "badge-c1",
    description: "Cuestionario oficial tipo test de 90 preguntas (sin preguntas de reserva) sobre Constitución, régimen local de Madrid, sistemas de información, redes, microinformática y seguridad.",
    topics: ["Constitución y Régimen Local", "Hardware y Microinformática", "Sistemas Operativos y Redes", "Bases de Datos y SQL", "Seguridad y ENS"]
  },
  {
    id: "c1-2025-practica",
    grupo: "C1",
    grupoLabel: "C1 — Técnico/a Auxiliar TIC",
    convocatoria: "2025",
    tipo: "practica",
    tipoLabel: "Parte Práctica",
    modalidad: "dividido",
    title: "Parte Práctica — Técnico/a Auxiliar T.I.C. (Conv. 2025)",
    subtitle: "Convocatoria 2025 • Supuesto Práctico",
    date: "Convocatoria 2025",
    timeMinutes: 60,
    totalQuestions: 30,
    reserveQuestions: 0,
    hasScenario: true,
    dataFile: "js/data-c1-2025-practica.js",
    dataVar: "DATA_C1_2025_PRACTICA",
    badgeClass: "badge-c1",
    description: "Cuestionario tipo test de 30 preguntas basado en el Supuesto Práctico del Sistema de Gestión de Incidencias de la Policía Municipal de Madrid (EJB, SQL, VLSM, TETRA, ENS).",
    topics: ["Supuesto Policial", "Java EJB y Transacciones", "Consultas SQL", "VLSM y Subredes", "Red TETRA y Seguridad"]
  },
  {
    id: "c1-2024-teorica",
    grupo: "C1",
    grupoLabel: "C1 — Técnico/a Auxiliar TIC",
    convocatoria: "2024",
    tipo: "teorica",
    tipoLabel: "Parte Teórica",
    modalidad: "dividido",
    title: "Parte Teórica — Técnico/a Auxiliar T.I.C. (Conv. 2024)",
    subtitle: "Convocatoria 2024 • Turno Libre",
    date: "Convocatoria 2024",
    timeMinutes: 90,
    totalQuestions: 90,
    reserveQuestions: 0,
    hasScenario: false,
    dataFile: "js/data-c1-2024-teorica.js",
    dataVar: "DATA_C1_2024_TEORICA",
    badgeClass: "badge-c1",
    description: "Cuestionario oficial tipo test de 90 preguntas (sin preguntas de reserva) sobre administración electrónica, LPAC 39/2015, arquitectura de ordenadores, virtualización, protocolos de red y soporte a usuarios.",
    topics: ["LPAC y Procedimiento Administrativo", "Arquitectura PC y Periféricos", "Windows y Linux", "TCP/IP y DNS/DHCP", "Ofimática y Soporte"]
  },
  {
    id: "c1-2024-practica",
    grupo: "C1",
    grupoLabel: "C1 — Técnico/a Auxiliar TIC",
    convocatoria: "2024",
    tipo: "practica",
    tipoLabel: "Parte Práctica",
    modalidad: "dividido",
    title: "Parte Práctica — Técnico/a Auxiliar T.I.C. (Conv. 2024)",
    subtitle: "Convocatoria 2024 • Supuesto Práctico",
    date: "Convocatoria 2024",
    timeMinutes: 50,
    totalQuestions: 25,
    reserveQuestions: 0,
    hasScenario: true,
    dataFile: "js/data-c1-2024-practica.js",
    dataVar: "DATA_C1_2024_PRACTICA",
    badgeClass: "badge-c1",
    description: "Supuesto práctico sobre despliegue de puestos de trabajo corporativos, scripting PowerShell/Bash, gestión de incidencias ITIL y directivas de Active Directory.",
    topics: ["Supuesto Despliegue Puestos", "Active Directory y GPO", "Scripting PowerShell", "Resolución de Averías", "Gestión de Copias de Seguridad"]
  },

  // --- GRUPO A2: Técnico/a Medio TIC (Ejercicio Único Teórico-Práctico) ---
  {
    id: "a2-2024-unico",
    grupo: "A2",
    grupoLabel: "A2 — Técnico/a Medio TIC",
    convocatoria: "2024",
    tipo: "unico",
    tipoLabel: "Ejercicio Único",
    modalidad: "unico",
    title: "Ejercicio Único Teórico-Práctico — Técnico/a Medio T.I.C. (Conv. 2024)",
    subtitle: "Convocatoria 2024 • Ejercicio Único Teórico-Práctico",
    date: "Convocatoria 2024",
    timeMinutes: 107,
    totalQuestions: 100,
    reserveQuestions: 7,
    hasScenario: false,
    dataFile: "js/data-a2-2024-unico.js",
    dataVar: "DATA_A2_2024_UNICO",
    badgeClass: "badge-a2",
    description: "Ejercicio único integrando 100 preguntas oficiales (+7 preguntas de reserva) en 100 minutos: gestión de servicios ITIL v4, metodologías ágiles Scrum/Kanban, interoperabilidad ENI y contratación pública TIC.",
    topics: ["ITIL v4 y Gestión de Servicios", "Metodologías Ágiles", "Esquema Nacional de Interoperabilidad", "Pliegos y Contratación LCSP", "Seguridad Aplicada"]
  },

  // --- GRUPO A1: Técnico/a Superior TIC (Ejercicio Único) ---
  {
    id: "a1-2024-unico",
    grupo: "A1",
    grupoLabel: "A1 — Técnico/a Superior TIC",
    convocatoria: "2024",
    tipo: "unico",
    tipoLabel: "Ejercicio Único",
    modalidad: "unico",
    title: "Ejercicio Único — Técnico/a Superior T.I.C. (Conv. 2024)",
    subtitle: "Convocatoria 2024 • Dirección de Proyectos TIC",
    date: "Convocatoria 2024",
    timeMinutes: 129,
    totalQuestions: 120,
    reserveQuestions: 9,
    hasScenario: false,
    dataFile: "js/data-a1-2024-unico.js",
    dataVar: "DATA_A1_2024_UNICO",
    badgeClass: "badge-a1",
    description: "Ejercicio único integrando 120 preguntas oficiales (+9 preguntas de reserva) en 129 minutos: Gobernanza de TI (COBIT), dirección de proyectos (PMBOK), transformación digital en administraciones locales, RGPD y ENS categoría Alta.",
    topics: ["COBIT y Gobernanza de TI", "Gestión de Carteras y Proyectos", "RGPD y Evaluación de Impacto", "ENS Categoría Alta", "Identidad Digital y eIDAS"]
  }
];

// Helper methods
function getExamById(id) {
  const found = EXAMS_CATALOG.find(exam => exam.id === id);
  if (found) return found;
  const aliases = {
    'c1-2024-teorica': 'c1-2024-teorica',
    'c1-2024-practica': 'c1-2024-practica',
    'c1-2025-teorica': 'c1-2025-teorica',
    'c1-2025-practica': 'c1-2025-practica',
    'a2-2024-unico': 'a2-2024-unico',
    'a1-2024-unico': 'a1-2024-unico'
  };
  if (aliases[id]) {
    return EXAMS_CATALOG.find(exam => exam.id === aliases[id]) || null;
  }
  return null;
}

function getAllExams() {
  return EXAMS_CATALOG;
}

function getGrupos() {
  const set = new Set(EXAMS_CATALOG.map(e => e.grupo));
  return Array.from(set);
}

function getConvocatorias() {
  const set = new Set(EXAMS_CATALOG.map(e => e.convocatoria));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

function filterExams({ grupo = 'all', convocatoria = 'all', query = '' } = {}) {
  return EXAMS_CATALOG.filter(exam => {
    if (grupo !== 'all' && exam.grupo !== grupo) return false;
    if (convocatoria !== 'all' && exam.convocatoria !== convocatoria) return false;
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      const matchTitle = exam.title.toLowerCase().includes(q);
      const matchDesc = exam.description.toLowerCase().includes(q);
      const matchGrupo = exam.grupoLabel.toLowerCase().includes(q);
      const matchTopics = exam.topics && exam.topics.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchGrupo && !matchTopics) return false;
    }
    return true;
  });
}

// Global exposure
if (typeof window !== 'undefined') {
  window.EXAMS_CATALOG = EXAMS_CATALOG;
  window.EXAM_REGISTRY = {
    catalog: EXAMS_CATALOG,
    getExamById,
    getAllExams,
    getGrupos,
    getConvocatorias,
    filterExams: (g, c) => filterExams({ grupo: g, convocatoria: c })
  };
}
