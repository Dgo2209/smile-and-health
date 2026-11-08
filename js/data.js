/**
 * Smile and Health - Dental Clinic Data Model & Seed Dataset
 * Contains realistic clinical and administrative demo data
 * based on the UACM software modeling document.
 */

window.DENTAL_DATA = {
  clinic: {
    name: "Smile and Health",
    subtitle: "Clínica Dental Especializada",
    address: "Av. Insurgentes Sur 1450, Col. Actipan, Benito Juárez, CDMX",
    phone: "55-5682-9011",
    whatsapp: "525532948120",
    email: "contacto@smileandhealth.mx",
    currentDoctor: {
      id: "doc-1",
      name: "Dr. Alejandro Mendoza Herrera",
      license: "8472910",
      specialty: "Rehabilitación Oral y Endodoncia"
    }
  },

  doctors: [
    {
      id: "doc-1",
      name: "Dr. Alejandro Mendoza Herrera",
      license: "8472910",
      specialty: "Rehabilitación Oral y Endodoncia",
      chair: "Sillón 1"
    },
    {
      id: "doc-2",
      name: "Dra. Sofía Valenzuela Ortiz",
      license: "9938120",
      specialty: "Ortodoncia y Odontopediatría",
      chair: "Sillón 2"
    }
  ],

  patients: [
    {
      id: "pac-001",
      recordNumber: "EXP-2026-084",
      fullName: "María Fernanda Gómez Rivas",
      phone: "55-3294-8120",
      email: "fernanda.gomez@gmail.com",
      birthDate: "1994-06-14",
      gender: "Femenino",
      bloodType: "O+",
      allergies: ["Penicilina", "Sulfitos"],
      medicalConditions: ["Hipotensión leve"],
      currentMedications: ["Ninguno"],
      address: "Calle Amores 724, Depto 302, Col. Del Valle, CDMX",
      emergencyContact: "Roberto Gómez (Padre) - 55-4190-2831",
      registrationDate: "2026-01-15",
      notes: "Paciente con alta sensibilidad a anestésicos con vasoconstrictor fuerte. Priorizar lidocaína sin epinefrina o mepivacaína.",
      status: "Activo"
    },
    {
      id: "pac-002",
      recordNumber: "EXP-2026-085",
      fullName: "Carlos Mendoza Soto",
      phone: "55-4412-9980",
      email: "carlos.mendoza@yahoo.com",
      birthDate: "1988-11-23",
      gender: "Masculino",
      bloodType: "A+",
      allergies: ["Ninguna conocida"],
      medicalConditions: ["Hipertensión controlada"],
      currentMedications: ["Losartán 50mg"],
      address: "Av. Universidad 1200, Col. Narvarte, CDMX",
      emergencyContact: "Elena Soto (Madre) - 55-1122-3344",
      registrationDate: "2026-02-10",
      notes: "Tratamiento de ortodoncia en fase de alineación.",
      status: "Activo"
    },
    {
      id: "pac-003",
      recordNumber: "EXP-2026-086",
      fullName: "Lucía Hernández Vega",
      phone: "55-8812-3456",
      email: "lucia.hdez@outlook.com",
      birthDate: "2001-03-08",
      gender: "Femenino",
      bloodType: "B+",
      allergies: ["AINEs (Ibuprofeno)"],
      medicalConditions: ["Ninguno"],
      currentMedications: ["Anticonceptivos"],
      address: "Eje Central 89, Benito Juárez, CDMX",
      emergencyContact: "Mariana Vega - 55-9988-7766",
      registrationDate: "2026-02-28",
      notes: "Programada para extracción de terceros molares inferiores.",
      status: "Activo"
    }
  ],

  appointments: [
    {
      id: "apt-101",
      patientId: "pac-001",
      patientName: "María Fernanda Gómez Rivas",
      phone: "55-3294-8120",
      allergies: ["Penicilina", "Sulfitos"],
      doctorId: "doc-1",
      doctorName: "Dr. Alejandro Mendoza Herrera",
      chair: "Sillón 1",
      date: "2026-09-21",
      time: "09:30",
      durationMin: 60,
      treatment: "Preparación para Corona en Pieza 36 y toma de impresión",
      status: "en-atencion", // en-espera, en-atencion, confirmada, programada, completada, cancelada
      reminderSent: true,
      notes: "Paciente en sillón. Revisar que la corona provisional ajuste sin oclusión forzada."
    },
    {
      id: "apt-102",
      patientId: "pac-002",
      patientName: "Carlos Mendoza Soto",
      phone: "55-4412-9980",
      allergies: [],
      doctorId: "doc-2",
      doctorName: "Dra. Sofía Valenzuela Ortiz",
      chair: "Sillón 2",
      date: "2026-09-21",
      time: "11:00",
      durationMin: 45,
      treatment: "Ajuste de Arcos de Ortodoncia y cambio de elásticos",
      status: "en-espera",
      reminderSent: true,
      notes: "Trae rotura de bracket en pieza 24."
    },
    {
      id: "apt-103",
      patientId: "pac-003",
      patientName: "Lucía Hernández Vega",
      phone: "55-8812-3456",
      allergies: ["AINEs (Ibuprofeno)"],
      doctorId: "doc-1",
      doctorName: "Dr. Alejandro Mendoza Herrera",
      chair: "Sillón 1",
      date: "2026-09-21",
      time: "12:30",
      durationMin: 90,
      treatment: "Valoración Quirúrgica y Odontograma Diagnóstico",
      status: "confirmada",
      reminderSent: true,
      notes: "Requiere firma de consentimiento antes de iniciar."
    },
    {
      id: "apt-104",
      patientId: "pac-001",
      patientName: "María Fernanda Gómez Rivas",
      phone: "55-3294-8120",
      allergies: ["Penicilina", "Sulfitos"],
      doctorId: "doc-1",
      doctorName: "Dr. Alejandro Mendoza Herrera",
      chair: "Sillón 1",
      date: "2026-09-28",
      time: "10:00",
      durationMin: 45,
      treatment: "Cementación Definitiva de Corona Zirconia en Pieza 36",
      status: "programada",
      reminderSent: false,
      notes: "Tener listo cemento de ionómero de vidrio resinoso."
    }
  ],

  // Interactive Odontogram findings for sample patient María Fernanda Gómez Rivas
  initialOdontogram: {
    "pac-001": {
      "36": {
        faces: {
          occlusal: "caries",
          mesial: "planned",
          distal: "healthy",
          vestibular: "healthy",
          lingual: "healthy"
        },
        crown: true,
        endo: true,
        extracted: false,
        notes: "Tratamiento de endodoncia concluido. Tallado para corona completa de zirconia."
      },
      "16": {
        faces: {
          occlusal: "restoration",
          mesial: "healthy",
          distal: "healthy",
          vestibular: "healthy",
          palatal: "healthy"
        },
        crown: false,
        endo: false,
        extracted: false,
        notes: "Obturación en resina en buen estado realizada en 2024."
      },
      "18": {
        faces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", vestibular: "healthy", palatal: "healthy" },
        crown: false,
        endo: false,
        extracted: true,
        notes: "Exodoncia quirúrgica previa."
      },
      "48": {
        faces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", vestibular: "healthy", lingual: "healthy" },
        crown: false,
        endo: false,
        extracted: true,
        notes: "Exodoncia quirúrgica previa."
      }
    }
  },

  // Evolution Notes complying with NOM-004-SSA3-2012
  evolutionNotes: [
    {
      id: "evo-01",
      patientId: "pac-001",
      date: "2026-09-14",
      time: "10:15",
      doctorName: "Dr. Alejandro Mendoza Herrera",
      doctorLicense: "8472910",
      vitals: { ta: "115/75 mmHg", fc: "72 lpm", temp: "36.5 °C" },
      motive: "Endodoncia finalizada; preparación para corona protésica",
      procedureDone: "Tallado protésico de muñón en pieza 36 con fresa tronco-cónica de extremo redondeado. Colocación de hilo retractor #000. Toma de impresión con polivinilsiloxano (silicona por adición) consistencia pesada y ligera. Fabricación y cementación de provisional de acrílico termopolimerizable con cemento sin eugenol (Temp-Bond NE).",
      materialsUsed: "Silicona por adición Express 3M, hilo retractor Ultrapack, acrílico Protemp 4, Temp-Bond NE.",
      prescriptions: "Paracetamol 500mg cada 8 horas por 2 días en caso de molestia en encía marginal. Evitar alimentos duros sobre el cuadrante 3.",
      isSignedAndLocked: true,
      integrityHash: "SHA256-NOM004-9AF328B104E8A",
      signatureDate: "2026-09-14T11:20:00-06:00"
    }
  ],

  // Catalog of Dental Procedures with official prices (MXN)
  treatmentsCatalog: [
    { id: "trt-01", code: "PRO-01", name: "Profilaxis Dental Ultrasónica y Profijet", category: "Prevención", price: 650 },
    { id: "trt-02", code: "RES-01", name: "Resina Compuesta Fotocurable (1 cara)", category: "Operatoria", price: 850 },
    { id: "trt-03", code: "RES-02", name: "Resina Compuesta Fotocurable Compleja (2+ caras)", category: "Operatoria", price: 1100 },
    { id: "trt-04", code: "END-01", name: "Endodoncia Unirradicular (Incisivos/Caninos)", category: "Endodoncia", price: 2400 },
    { id: "trt-05", code: "END-02", name: "Endodoncia Multirradicular (Molares)", category: "Endodoncia", price: 3400 },
    { id: "trt-06", code: "PRO-02", name: "Corona Libre de Metal (Zirconia Monolítica)", category: "Prótesis", price: 4800 },
    { id: "trt-07", code: "PRO-03", name: "Corona de Porcelana sobre Metal", category: "Prótesis", price: 3200 },
    { id: "trt-08", code: "CIR-01", name: "Extracción Dental Simple", category: "Cirugía", price: 900 },
    { id: "trt-09", code: "CIR-02", name: "Extracción Quirúrgica de Tercer Molar Incluido", category: "Cirugía", price: 2800 },
    { id: "trt-10", code: "BLA-01", name: "Blanqueamiento Dental Láser en Consultorio", category: "Estética", price: 2500 }
  ],

  // Informed Consent Legal Templates
  consentTemplates: {
    endodoncia: {
      title: "Consentimiento Informado para Tratamiento de Conductos Radiculares (Endodoncia)",
      body: `Por medio del presente documento, yo, paciente o tutor legal debidamente identificado, autorizo al especialista odontológico de la Clínica Smile and Health a llevar a cabo el tratamiento de conductos radiculares (endodoncia).

He sido informado con claridad de la naturaleza del procedimiento, el cual consiste en la extirpación del tejido pulpar inflamado, infectado o necrosado, la desinfección química y la obturación tridimensional del sistema de conductos radiculares con el objetivo de preservar la pieza dental en boca y evitar su extracción.

Riesgos y Molestias Informados:
1. Posible inflamación o dolor postoperatorio transitorio que cede con medicación analgésica.
2. Calcificación o curvaturas severas que puedan dificultar la instrumentación completa.
3. Posibilidad de fractura accidental de instrumentos endodónticos milimétricos en el interior del conducto.
4. Necesidad ineludible de rehabilitación posterior (incrustación, endoposte o corona) para evitar la fractura coronal del diente desvitalizado.

Declaro que he respondido con veracidad sobre mis antecedentes médicos, alergias a fármacos y estado de salud general, y que no me quedan dudas sobre el tratamiento propuesto.`
    },
    cirugia: {
      title: "Consentimiento Informado para Cirugía Bucal y Exodoncia de Terceros Molares",
      body: `Yo, en pleno uso de mis facultades, otorgo mi consentimiento libre e informado para la realización del procedimiento quirúrgico bucal / exodoncia en la Clínica Smile and Health.

Comprendo que el procedimiento implica la anestesia local, incisión, osteotomía y remoción de la pieza dentaria indicada, con sutura si el caso lo requiere.

Riesgos y Complicaciones Explicadas:
1. Dolor, edema (hinchazón) y hematomas faciales normales en el postoperatorio durante 48 a 72 horas.
2. Posible parestesia (sensación temporal de adormecimiento del labio o lengua) debido a la proximidad con el nervio dentario inferior o lingual.
3. Alveolitis (infección o pérdida prematura del coágulo) prevenida siguiendo rigurosamente las instrucciones de higiene y reposo.
4. Compromiso de cumplir estrictamente con el reposo, dieta blanda y medicación antibiótica/analgésica indicada.`
    },
    protesis: {
      title: "Consentimiento Informado para Prótesis Dental Fija y Coronas",
      body: `Autorizo la realización de preparaciones protésicas, toma de impresiones anatómicas y colocación de restauraciones fijas (coronas individuales o puentes) en las piezas dentales planeadas.

Comprendo que el éxito estético y funcional depende del cuidado en la higiene interdental, uso de hilo dental, revisiones periódicas cada 6 meses y evitar masticar objetos duros que comprometan el material cerámico.`
    }
  },

  // Signed Consents Repository
  signedConsents: [
    {
      id: "con-01",
      patientId: "pac-001",
      patientName: "María Fernanda Gómez Rivas",
      treatmentType: "endodoncia",
      tooth: "Pieza 36",
      date: "2026-09-08",
      doctorName: "Dr. Alejandro Mendoza Herrera",
      hasSignature: true,
      signatureDate: "2026-09-08T09:45:00-06:00",
      status: "Firmado y Custodiado"
    }
  ],

  // System Audit Trail (NOM-004 compliance)
  auditLogs: [
    {
      id: "log-1",
      timestamp: "2026-09-21 08:30:12",
      user: "recepcion",
      role: "Recepcionista",
      action: "Inicio de sesión en módulo de Agenda",
      entity: "Autenticación"
    },
    {
      id: "log-2",
      timestamp: "2026-09-21 09:15:40",
      user: "recepcion",
      role: "Recepcionista",
      action: "Cambio de estado de cita apt-101 a 'En Atención (Sillón 1)'",
      entity: "Citas"
    },
    {
      id: "log-3",
      timestamp: "2026-09-14 11:20:00",
      user: "dr.mendoza",
      role: "Odontólogo",
      action: "Firma electrónica y bloqueo de Nota de Evolución evo-01 (NOM-004-SSA3-2012)",
      entity: "Expediente Clínico"
    }
  ]
};
