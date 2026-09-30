/* ==========================================================================
   app.js — Motor de Evaluación y Generación de Rúbricas IQ-0432 (UCR)
   Ecosistema de Revisión de Informes de Laboratorio — Versión para Asistentes (Metodología IBL)
   ========================================================================== */

(function () {
  "use strict";

  // ==========================================
  // 1. CATÁLOGO DE PRÁCTICAS Y MODALIDADES
  // ==========================================
  const PRACTICAS = [
    { id: "BOMBAS", nombre: "Bombas Centrífugas (Módulo Serie y Paralelo)", codigo: "IQ-0432" },
    { id: "CAIDA_PRESION", nombre: "Caída de Presión en Tuberías y Accesorios", codigo: "IQ-0432" },
    { id: "INTERCAMBIO_CALOR", nombre: "Intercambio de Calor (Módulo GUNT WL 110)", codigo: "IQ-0432" },
    { id: "AGITACION", nombre: "Agitación y Mezclado", codigo: "IQ-0432" },
    { id: "VISCOSIDAD", nombre: "Viscosidad y Reología de Fluidos", codigo: "IQ-0432" },
    { id: "MEDICION_FLUJO", nombre: "Medición de Flujo y Calibración de Medidores", codigo: "IQ-0432" },
    { id: "CALDERAS", nombre: "Calderas (Práctica Especial)", codigo: "IQ-0432" }
  ];

  // Descriptores y Criterios por Modalidad
  const MODALIDADES = {
    REPORTE: {
      id: "REPORTE",
      nombre: "Informe Tipo Reporte (100 pts)",
      maxScore: 100,
      escala: "reporte",
      getCriterios: function (practicaId) {
        return getCriteriosReporte(practicaId);
      }
    },
    ARTICULO: {
      id: "ARTICULO",
      nombre: "Informe Tipo Artículo (100 pts)",
      maxScore: 100,
      escala: "articulo",
      getCriterios: function (practicaId) {
        return getCriteriosArticulo(practicaId);
      }
    },
    CALDERAS_AUDITORIA: {
      id: "CALDERAS_AUDITORIA",
      nombre: "Mini-Auditoría de la Caldera (100 pts / 2% del Curso)",
      maxScore: 100,
      escala: "calderas",
      getCriterios: function () {
        return getCriteriosCalderas();
      }
    }
  };

  // Descriptores de Condición de Calificación por Categoría (Escala Oficial IQ-0432)
  const LEVEL_DESCRIPTORS = {
    1.0: {
      titulo: "Sobresaliente (95 - 100)",
      desc: "Cumplimiento pleno, riguroso e impecable de la totalidad de los requisitos técnicos, normativos y de formato exigidos.",
      clase: "active-sobresaliente"
    },
    0.90: {
      titulo: "Muy Bueno (85 - 94)",
      desc: "Cumplimiento satisfactorio de la mayoría de los aspectos exigidos, presentando imprecisiones menores en redacción, formato o profundidad que no comprometen la validez técnica.",
      clase: "active-muybueno"
    },
    0.80: {
      titulo: "Bueno (75 - 84)",
      desc: "Cumplimiento aceptable de los requerimientos mínimos. Presenta fallas leves reincidentes en formato, notación, citación bibliográfica o justificación teórica.",
      clase: "active-bueno"
    },
    0.70: {
      titulo: "Suficiente (67.5 - 74)",
      desc: "Cumplimiento elemental en el límite inferior de aprobación. Presenta omisiones parciales de subsecciones, imprecisión técnica o problemas de formato notorios sin alcanzar reprobación.",
      clase: "active-suficiente"
    },
    0.50: {
      titulo: "Deficiente (< 67.5)",
      desc: "Incumplimiento grave de los requisitos exigidos, omisión de secciones obligatorias, datos incompletos o alterados, uso no autorizado de IAG, plagio o empleo de formatos prohibidos.",
      clase: "active-deficiente"
    }
  };

  // Matriz de Descriptores Específicos por Subcriterio y Nivel de Calificación (100% Oficial IQ-0432)
  const CRITERION_LEVEL_DESCRIPTORS = {
    // 1.1 Resumen en Español
    sec_11: {
      1.0: "Sintetiza en español con claridad y precisión las 4 preguntas esenciales: (1) ¿Qué y para qué se hizo? (Objetivo principal), (2) ¿Cómo se hizo? (Metodología), (3) ¿Qué se obtuvo? (Resultados cuantitativos clave con sus unidades), y (4) Recomendación principal.",
      0.90: "Responde a las 4 preguntas esenciales en español, pero presenta imprecisiones menores en la respuesta a 1 de las preguntas.",
      0.80: "Presenta imprecisiones moderadas o respuesta incompleta en 1 de las preguntas, o imprecisiones leves en 2 de las preguntas esenciales.",
      0.70: "Presenta imprecisiones severas u omisión explícita en 2 de las preguntas esenciales.",
      0.50: "Presenta imprecisiones críticas u omisión en 3 o más de las preguntas esenciales en español, o el Resumen está ausente o es una copia textual de la guía/marco teórico."
    },
    // 1.2 Abstract en Inglés
    sec_12: {
      1.0: "Presenta la versión en inglés (Abstract) de las 4 preguntas esenciales con precisión técnica, vocabulario ingenieril adecuado, sintaxis correcta y tiempos verbales apropiados (pasado procedimiento/resultados, presente recomendación).",
      0.90: "Responde a las 4 preguntas esenciales en inglés, pero presenta imprecisiones menores o errores leves de gramática/vocabulario en 1 de las preguntas.",
      0.80: "Presenta imprecisiones moderadas, traducción literal no editada o errores sintácticos en 1 de las preguntas, o imprecisiones leves en 2 de las preguntas esenciales.",
      0.70: "Presenta imprecisiones severas, errores de sintaxis notorios u omisión explícita en 2 de las preguntas esenciales en inglés.",
      0.50: "Presenta imprecisiones críticas u omisión en 3 o más de las preguntas esenciales en inglés, o el Abstract está ausente o redactado en español."
    },
    // 2.1 Temas Mínimos Obligatorios (Fondo)
    sec_21: {
      1.0: "Desarrolla la totalidad de los temas teóricos mínimos solicitados en la guía de indagación de la práctica correspondiente.",
      0.90: "Desarrolla los temas mínimos requeridos, pero presenta imprecisiones menores en 1 de los temas.",
      0.80: "Presenta imprecisiones moderadas en 1 de los temas mínimos o imprecisiones leves en 2 temas.",
      0.70: "Marco teórico incompleto; omite o presenta imprecisiones severas en 2 de los temas mínimos requeridos por la guía.",
      0.50: "Omisión explícita de la mayoría de los temas mínimos solicitados en la guía de indagación."
    },
    // 2.2 Pertinencia Teórica para la Discusión (Fondo)
    sec_22: {
      1.0: "Toda la teoría incluida es pertinente y está directamente orientada a justificar y fundamentar la posterior discusión de resultados, sin textos de relleno.",
      0.90: "La teoría es pertinente, pero incluye algún concepto secundario con escasa justificación para la discusión de resultados.",
      0.80: "Incluye información teórica irrelevante que aporta poca pertinencia al análisis.",
      0.70: "Incluye abundantes bloques teóricos de relleno sin pertinencia técnica para fundamentar los resultados de la práctica.",
      0.50: "Teoría completamente desconectada de la práctica o con conceptos físicos erróneos."
    },
    // 2.3 Hilo Conductor, Redacción y Referenciación (Forma)
    sec_23: {
      1.0: "Redacción fluida en prosa técnica continua con conectores de transición entre párrafos. Incluye el uso debido y oportuno de citas/referencias en todos los párrafos teóricos, sin dejar bloques largos de texto sin referenciar.",
      0.90: "Mantiene el hilo conductor continuo y buena referenciación, pero presenta imprecisiones menores en la transición entre 2 párrafos o la omisión puntual de una cita en una afirmación teórica.",
      0.80: "Párrafos redactados de forma aislada con uso escaso de conectores de transición, o presenta párrafos extensos de contenido teórico sin referenciar.",
      0.70: "Redacción fragmentada como lista de conceptos sueltos, con múltiples párrafos largos de teoría técnica sin respaldo de citas/referencias.",
      0.50: "Texto incomprensible, desorganizado, ausente de referencias en la totalidad del marco teórico, o copiado literalmente sin referenciar ni parafrasear (Plagio)."
    },
    // 3.1 Párrafo Introductorio y Objetivos (Fondo)
    sec_31: {
      1.0: "Redactado en prosa respondiendo a ¿qué?, ¿para qué? y ¿cómo se hizo?. Alinea el Objetivo General con el título del informe y desglosa los Objetivos Específicos en metas medibles.",
      0.90: "Responde a las 3 preguntas en prosa y alinea los objetivos, pero presenta imprecisiones menores en la redacción de 1 objetivo específico.",
      0.80: "Cumple con el párrafo introductorio, pero presenta imprecisiones moderadas en los objetivos o redacta objetivos como actividades.",
      0.70: "Párrafo introductorio incompleto; omite responder 1 de las 3 preguntas clave o los objetivos están desalineados del título.",
      0.50: "Omisión del párrafo introductorio o ausencia de los objetivos de la práctica."
    },
    // 3.2 Materiales, Sustancias (MSDS/Desechos) y Equipos (Fondo)
    sec_32: {
      1.0: "Presenta el cuadro de sustancias (con fórmula, propiedades, clasificación MSDS/OSHA, EPP y disposición de desechos) y el cuadro de equipos (fabricante, modelo, ámbito de medición y resolución).",
      0.90: "Presenta ambos cuadros con la información requerida, pero con imprecisiones menores en 1 de las especificaciones.",
      0.80: "Presenta los cuadros requeridos, pero con imprecisiones moderadas u omisión de las especificaciones de sustancias o equipos auxiliares.",
      0.70: "Información de materiales y equipos incompleta; omite el plan de disposición de desechos o la clasificación MSDS/OSHA.",
      0.50: "Omisión total de los cuadros de sustancias/equipos o información técnica errónea."
    },
    // 3.3 Inclusión de Variables Categorizadas (Fondo - IBL)
    sec_33: {
      1.0: "Incluye y reporta la totalidad de las variables experimentales tal y como se proporcionan en la guía de indagación de la práctica (respuesta, controlables y no controlables).",
      0.90: "Incluye las variables proporcionadas en la guía, pero presenta una imprecisión menor en la trascripción/reporte de 1 variable.",
      0.80: "Incluye la mayoría de las variables de la guía, pero presenta imprecisiones moderadas en la denominación o unidades de 2 variables.",
      0.70: "Reporte de variables incompleto; omite incluir una categoría entera de las variables proporcionadas en la guía.",
      0.50: "Omisión total de la sección de variables experimentales o alteración arbitraria de las variables dadas en la guía."
    },
    // 3.4 Redacción en Pasado Impersonal e Indicativo (Forma / Estilo)
    sec_34: {
      1.0: "Redactado estrictamente en prosa continua utilizando pasado simple, impersonal y modo indicativo (ej. 'se midió', 'se determinó'), sin uso de primera persona ni viñetas.",
      0.90: "Redactado en pasado impersonal, pero presenta imprecisiones menores en el tiempo verbal de 1 o 2 oraciones.",
      0.80: "Redacción aceptable, pero incluye usos ocasionales de primera persona ('medimos', 'hicimos') o pasados compuestos.",
      0.70: "Uso frecuente de primera persona gramatical o redacción desorganizada en listas/viñetas.",
      0.50: "Redacción incomprensible, en tiempo presente o redactado totalmente en primera persona."
    },
    // 3.5 Diagrama de Equipo (Forma)
    sec_35: {
      1.0: "Presenta el diagrama experimental técnico del equipo (proveniente del diseño AutoCAD .dwg del preinforme), claro, con simbología adecuada e identificación de componentes, tuberías e instrumentos.",
      0.90: "Presenta el diagrama técnico de equipo, pero con imprecisiones menores en el etiquetado de 1 componente u instrumento.",
      0.80: "Diagrama técnico de equipo presente, pero con imprecisiones moderadas en la simbología o etiquetado incompleto.",
      0.70: "Diagrama desorganizado o incompleto, con falta notoria de etiquetado en tuberías e instrumentos de medición.",
      0.50: "Diagrama ausente, o uso no permitido de dibujos a mano alzada, fotografías, capturas de pantalla de manuales o imágenes de IA."
    },
    // 8.F Integración de Datos y Redacción Impersonal (Forma / Estilo Transversal)
    sec_4f: {
      1.0: "Integra progresivamente cuadros y gráficas a lo largo del texto (Variable, símbolo/(unidad)). Redactado estrictamente en pasado simple, impersonal e indicativo, usando presente solo al referenciar figuras/cuadros.",
      0.90: "Mantiene la integración de datos y pasado impersonal, pero presenta imprecisiones menores en el tiempo verbal de 1 o 2 oraciones.",
      0.80: "Presenta datos integrados, pero con uso ocasional de tiempo presente en las discusiones o mezclas de tiempos verbales.",
      0.70: "Presenta los datos desorganizados; amontona los cuadros al inicio sin integrarlos, o uso frecuente de primera persona ('observamos').",
      0.50: "Redacción desorganizada o en voz activa de primera persona en la totalidad de la discusión."
    },
    // ==========================================
    // DISCUSIÓN ESPECÍFICA: BOMBAS CENTRÍFUGAS (TABLA 1.A)
    // ==========================================
    disc_bombas_41: {
      1.0: "Analiza el comportamiento de la bomba a partir de sus curvas características (H-Q, η-Q, W_elec-Q, W_fluido-Q), explica las tendencias en términos de mecánica de fluidos y compara la curva de cabeza vs. caudal (H-Q) experimental con la del fabricante.",
      0.90: "Analiza las curvas características y compara la curva H-Q con la del fabricante, pero presenta imprecisiones menores en la explicación técnica de 1 tendencia.",
      0.80: "Analiza las curvas características, pero con imprecisiones moderadas en la comparación de la curva H-Q con la del fabricante o análisis cualitativo.",
      0.70: "Descripción de curvas incompleta; se limita a describir los gráficos de la bomba sin explicar las tendencias ni comparar H-Q con la curva del fabricante.",
      0.50: "Omisión del análisis de curvas características."
    },
    disc_bombas_42: {
      1.0: "Construye e interpreta la curva del sistema (pérdidas por fricción + cabeza estática), identifica el punto de operación real y lo compara críticamente contra el punto de máxima eficiencia (BEP).",
      0.90: "Construye la curva del sistema y ubica el punto de operación, pero presenta imprecisiones menores en la comparación con el punto de máxima eficiencia (BEP).",
      0.80: "Ubica el punto de operación, pero con imprecisiones moderadas en la construcción de la curva del sistema o en la cabeza estática.",
      0.70: "Identificación confusa del punto de operación; omite relacionar el punto de operación con el BEP de la bomba.",
      0.50: "Omisión de la construcción de la curva del sistema y del punto de operación."
    },
    disc_bombas_43: {
      1.0: "Evalúa el desempeño en serie y paralelo, contrasta los datos con la predicción teórica (duplicación de cabeza en serie y caudal en paralelo a caudal/cabeza constante) y diagnostica las desviaciones y asimetrías encontradas.",
      0.90: "Evalúa las configuraciones serie y paralelo respecto a la teoría, pero presenta imprecisiones menores en el diagnóstico de 1 desviación del sistema real.",
      0.80: "Evalúa serie y paralelo, pero con imprecisiones moderadas en la explicación de por qué no se alcanzan los valores ideales.",
      0.70: "Evaluación superficial de arreglos; se limita a indicar si el caudal o cabeza aumentó sin diagnosticar las desviaciones ni el efecto de la curva del sistema.",
      0.50: "Omisión del análisis comparativo entre operación individual, en serie y en paralelo."
    },
    disc_bombas_44: {
      1.0: "Calcula la presión de succión mediante balance de energía entre el tanque y la brida de succión (justificando en paralelo la presión usada), determina la NPSHd y argumenta las consecuencias de un margen insuficiente con la NPSHr.",
      0.90: "Determina la NPSHd mediante el balance en succión, pero presenta imprecisiones menores en la argumentación del margen respecto a la NPSHr.",
      0.80: "Calcula la NPSHd, pero con imprecisiones moderadas en la formulación del balance de energía en la línea de succión.",
      0.70: "Cálculo de NPSHd incompleto; omite analizar las consecuencias operacionales del margen insuficiente con la NPSHr (cavitación).",
      0.50: "Omisión total del balance de energía en succión, cálculo de NPSHd o análisis de NPSHr."
    },
    disc_bombas_45: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental e incertidumbres operacionales que justifican las desviaciones observadas en los resultados.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. excusas genéricas de 'error humano' sin análisis técnico).",
      0.70: "Análisis de errores muy superficial; atribuye las desviaciones a causas no relacionadas con el módulo de bombeo.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres operacionales dentro del texto de la discusión."
    },
    // Aliases legacy para Bombas
    disc_41: {
      1.0: "Analiza el comportamiento de la bomba a partir de sus curvas características (H-Q, η-Q, W_elec-Q, W_fluido-Q), explica las tendencias en términos de mecánica de fluidos y compara la curva de cabeza vs. caudal (H-Q) experimental con la del fabricante.",
      0.90: "Analiza las curvas características y compara la curva H-Q con la del fabricante, pero presenta imprecisiones menores en la explicación técnica de 1 tendencia.",
      0.80: "Analiza las curvas características, pero con imprecisiones moderadas en la comparación de la curva H-Q con la del fabricante o análisis cualitativo.",
      0.70: "Descripción de curvas incompleta; se limita a describir los gráficos de la bomba sin explicar las tendencias ni comparar H-Q con la curva del fabricante.",
      0.50: "Omisión del análisis de curvas características."
    },
    disc_42: {
      1.0: "Construye e interpreta la curva del sistema (pérdidas por fricción + cabeza estática), identifica el punto de operación real y lo compara críticamente contra el punto de máxima eficiencia (BEP).",
      0.90: "Construye la curva del sistema y ubica el punto de operación, pero presenta imprecisiones menores en la comparación con el punto de máxima eficiencia (BEP).",
      0.80: "Ubica el punto de operación, pero con imprecisiones moderadas en la construcción de la curva del sistema o en la cabeza estática.",
      0.70: "Identificación confusa del punto de operación; omite relacionar el punto de operación con el BEP de la bomba.",
      0.50: "Omisión de la construcción de la curva del sistema y del punto de operación."
    },
    disc_43: {
      1.0: "Evalúa el desempeño en serie y paralelo, contrasta los datos con la predicción teórica (duplicación de cabeza en serie y caudal en paralelo a caudal/cabeza constante) y diagnostica las desviaciones y asimetrías encontradas.",
      0.90: "Evalúa las configuraciones serie y paralelo respecto a la teoría, pero presenta imprecisiones menores en el diagnóstico de 1 desviación del sistema real.",
      0.80: "Evalúa serie y paralelo, pero con imprecisiones moderadas en la explicación de por qué no se alcanzan los valores ideales.",
      0.70: "Evaluación superficial de arreglos; se limita a indicar si el caudal o cabeza aumentó sin diagnosticar las desviaciones ni el efecto de la curva del sistema.",
      0.50: "Omisión del análisis comparativo entre operación individual, en serie y en paralelo."
    },
    disc_44: {
      1.0: "Calcula la presión de succión mediante balance de energía entre el tanque y la brida de succión (justificando en paralelo la presión usada), determina la NPSHd y argumenta las consecuencias de un margen insuficiente con la NPSHr.",
      0.90: "Determina la NPSHd mediante el balance en succión, pero presenta imprecisiones menores en la argumentación del margen respecto a la NPSHr.",
      0.80: "Calcula la NPSHd, pero con imprecisiones moderadas en la formulación del balance de energía en la línea de succión.",
      0.70: "Cálculo de NPSHd incompleto; omite analizar las consecuencias operacionales del margen insuficiente con la NPSHr (cavitación).",
      0.50: "Omisión total del balance de energía en succión, cálculo de NPSHd o análisis de NPSHr."
    },
    disc_45: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental e incertidumbres operacionales que justifican las desviaciones observadas en los resultados.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. excusas genéricas de 'error humano' sin análisis técnico).",
      0.70: "Análisis de errores muy superficial; atribuye las desviaciones a causas no relacionadas con el módulo de bombeo.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres operacionales dentro del texto de la discusión."
    },
    // ==========================================
    // DISCUSIÓN ESPECÍFICA: CAÍDA DE PRESIÓN (TABLA 1.B)
    // ==========================================
    disc_caida_41: {
      1.0: "Analiza cuantitativamente las pérdidas de energía por fricción (pérdidas mayores) en tramos rectos de diferente diámetro, grafica f vs. Re, compara el factor de fricción experimental (f) con las predicciones del diagrama de Moody/Fanning en función del Re y discute el efecto de la rugosidad relativa (ε/D) y del diámetro interno.",
      0.90: "Analiza las pérdidas por fricción y compara f vs. Re con el diagrama de Moody/Fanning, pero presenta imprecisiones menores en la explicación técnica de 1 factor de desviación.",
      0.80: "Analiza f vs. Re, pero con imprecisiones moderadas en la comparación con el diagrama de Moody/Fanning o análisis cualitativo.",
      0.70: "Descripción de pérdidas por fricción incompleta; se limita a describir los datos de caída de presión sin analizar el factor de fricción f o viceversa.",
      0.50: "Omisión del análisis de pérdidas mayores y del diagrama de Moody/Fanning."
    },
    disc_caida_42: {
      1.0: "Determina la caída de presión (ΔP) y las pérdidas de energía menores producidas por válvulas y accesorios (codos de 90°, 45°, tees, yees, expansiones y contracciones), calcula sus coeficientes de pérdida (K) y los compara con los valores teóricos/tabulados de la literatura, justificando las desviaciones.",
      0.90: "Determina los coeficientes K en accesorios y los compara con valores teóricos, pero presenta imprecisiones menores en la justificación de la desviación de 1 accesorio.",
      0.80: "Calcula los coeficientes K y los compara con valores teóricos, pero con imprecisiones moderadas en la justificación de las diferencias.",
      0.70: "Evaluación de accesorios incompleta; presenta valores de K sin compararlos con los valores teóricos/tabulados o viceversa.",
      0.50: "Omisión de la determinación de pérdidas menores y coeficientes de pérdida K en accesorios."
    },
    disc_caida_43: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental e incertidumbres operacionales (calidad de la purga de aire en mangueras manométricas, sobre/subestimación de ΔP, precisión de medición de caudal Q) que justifican las desviaciones.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. excusas genéricas de 'error humano' sin análisis técnico).",
      0.70: "Análisis de errores muy superficial; atribuye las desviaciones a causas no relacionadas con el módulo hidrodinámico.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres operacionales dentro del texto de la discusión."
    },
    // ==========================================
    // DISCUSIÓN ESPECÍFICA: INTERCAMBIO DE CALOR (TABLA 1.C)
    // ==========================================
    disc_calor_41: {
      1.0: "Analiza el comportamiento térmico y los perfiles de temperatura en intercambiadores de calor operando en configuraciones de flujo paralelo, contracorriente, flujo cruzado-paralelo y flujo cruzado-contracorriente.",
      0.90: "Analiza los perfiles de temperatura en las configuraciones de flujo, pero presenta imprecisiones menores en el análisis del comportamiento térmico de 1 configuración.",
      0.80: "Analiza los perfiles de temperatura, pero con imprecisiones moderadas en la comparación del comportamiento térmico entre configuraciones de flujo.",
      0.70: "Análisis incompleto; se limita a presentar los perfiles de temperatura sin analizar el comportamiento térmico que distingue a las configuraciones de flujo o viceversa.",
      0.50: "Omisión del análisis del comportamiento térmico y los perfiles de temperatura en las configuraciones de flujo."
    },
    disc_calor_42: {
      1.0: "Evalúa el efecto de la variación del caudal y de la temperatura de operación sobre la tasa de transferencia de calor (Q̇), la Diferencia Media Logarítmica de Temperatura (LMTD) y el Coeficiente Global de Transferencia de Calor (U).",
      0.90: "Evalúa el efecto del caudal y temperatura sobre Q̇, LMTD y U, pero presenta imprecisiones menores en la explicación del efecto sobre 1 de las 3 variables.",
      0.80: "Evalúa el efecto del caudal y temperatura, pero con imprecisiones moderadas en la relación entre las condiciones de operación y Q̇, LMTD o U.",
      0.70: "Análisis incompleto; reporta valores de Q̇, LMTD o U sin evaluar el efecto de la variación del caudal y temperatura sobre estas variables o viceversa.",
      0.50: "Omisión del análisis del efecto de las condiciones de operación sobre Q̇, LMTD y U."
    },
    disc_calor_43: {
      1.0: "Cuantifica los balances de energía del sistema, determinando el calor cedido por el fluido caliente (Q̇_h), el calor ganado por el fluido frío (Q̇_c) y las pérdidas térmicas hacia el ambiente.",
      0.90: "Cuantifica los balances de energía determinando Q̇_h y Q̇_c, pero presenta imprecisiones menores en la cuantificación de las pérdidas térmicas al ambiente.",
      0.80: "Cuantifica Q̇_h y Q̇_c, pero con imprecisiones moderadas en la determinación de las pérdidas térmicas al ambiente.",
      0.70: "Análisis incompleto; reporta Q̇_h y Q̇_c sin cuantificar las pérdidas térmicas al ambiente o viceversa.",
      0.50: "Omisión de los balances de energía del sistema."
    },
    disc_calor_44: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental e incertidumbres operacionales que justifican las desviaciones observadas en los resultados.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. excusas genéricas de 'error humano' sin análisis técnico).",
      0.70: "Análisis de errores muy superficial; atribuye las desviaciones a causas no relacionadas con el módulo térmico.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres operacionales dentro del texto de la discusión."
    },
    // ==========================================
    // DISCUSIÓN: OTRAS PRÁCTICAS / GENÉRICAS
    // ==========================================
    disc_gen_41: {
      1.0: "Analiza rigurosamente los datos experimentales y gráficos en función de los principios teóricos y fenómenos de transporte del ensayo, justificando el comportamiento físico-químico observado.",
      0.90: "Analiza las tendencias y fenómenos principales, pero presenta imprecisiones menores en la explicación técnica de 1 variable o comportamiento secundario.",
      0.80: "Analiza las tendencias, pero con imprecisiones moderadas en la fundamentación teórica o explicaciones cualitativas simplistas.",
      0.70: "Descripción incompleta; se limita a describir los gráficos sin explicar las causas físicas ni los fenómenos subyacentes.",
      0.50: "Omisión del análisis de tendencias y fenómenos físico-químicos o análisis conceptualmente erróneo."
    },
    disc_gen_42: {
      1.0: "Contrasta cuantitativamente los resultados experimentales con ecuaciones de diseño, correlaciones y literatura técnica de referencia, justificando críticamente las desviaciones encontradas.",
      0.90: "Compara con literatura técnica, pero presenta imprecisiones menores en la justificación de la desviación con 1 modelo de referencia.",
      0.80: "Compara con literatura, pero con imprecisiones moderadas en el sustento de las diferencias o comparación cualitativa sin valores numéricos.",
      0.70: "Comparación incompleta; reporta valores teóricos sin contrastarlos numéricamente contra los datos experimentales o viceversa.",
      0.50: "Omisión total de la comparación con literatura técnica o valores de diseño."
    },
    disc_gen_43: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental e incertidumbres operacionales e instrumentales que justifican las desviaciones observadas.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. justificaciones genéricas sin sustento técnico).",
      0.70: "Análisis de errores muy superficial; atribuye desviaciones a causas no relacionadas con el ensayo ejecutado.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres operacionales dentro del texto de la discusión."
    },
    // ==========================================
    // SECCIÓN 5: CONCLUSIONES Y RECOMENDACIONES
    // ==========================================
    sec_51: {
      1.0: "Redacta conclusiones específicas y cuantitativas que responden directamente a cada uno de los objetivos específicos planteados, explicando el significado e implicaciones de los hallazgos sin repetir teoría.",
      0.90: "Redacta conclusiones cuantitativas alineadas a los objetivos, pero presenta imprecisiones menores en el sustento numérico o significancia de 1 conclusión.",
      0.80: "Redacta conclusiones vinculadas a los objetivos, pero con imprecisiones moderadas (ej. conclusiones cualitativas sin valores numéricos en 1 objetivo).",
      0.70: "Conclusiones incompletas; omite responder a 1 objetivo específico o se limita a repetir datos en bruto sin análisis de su significado.",
      0.50: "Conclusiones ausentes, redactadas como opiniones personales, repetición textual de teoría previamente conocida o contradictorias con los resultados."
    },
    sec_52: {
      1.0: "Plantea recomendaciones técnicas viables y realizables para profundizar o ampliar la investigación, justificando con claridad qué, por qué y para qué realizar las futuras pruebas.",
      0.90: "Plantea recomendaciones viables alineadas al trabajo, pero presenta imprecisiones menores en la justificación de 1 de las propuestas.",
      0.80: "Plantea recomendaciones aceptables, pero incluye propuestas con dudas menores de viabilidad técnica o de alcance.",
      0.70: "Incluye recomendaciones no viables, irrealizables o fuera de alcance técnico/económico del laboratorio, o sugerencias generales de escasa aplicabilidad.",
      0.50: "Recomendaciones ausentes, o consistentes únicamente en propuestas totalmente no viables, parches a errores operativos del laboratorio o pedidos genéricos de 'más cuidado' / 'equipos más precisos'."
    },
    // Aliases legacy para Conclusiones
    sec_41: {
      1.0: "Redacta conclusiones específicas y cuantitativas que responden directamente a cada uno de los objetivos específicos planteados, explicando el significado e implicaciones de los hallazgos sin repetir teoría.",
      0.90: "Redacta conclusiones cuantitativas alineadas a los objetivos, pero presenta imprecisiones menores en el sustento numérico o significancia de 1 conclusión.",
      0.80: "Redacta conclusiones vinculadas a los objetivos, pero con imprecisiones moderadas (ej. conclusiones cualitativas sin valores numéricos en 1 objetivo).",
      0.70: "Conclusiones incompletas; omite responder a 1 objetivo específico o se limita a repetir datos en bruto sin análisis de su significado.",
      0.50: "Conclusiones ausentes, redactadas como opiniones personales, repetición textual de teoría previamente conocida o contradictorias con los resultados."
    },
    sec_42: {
      1.0: "Plantea recomendaciones técnicas viables y realizables para profundizar o ampliar la investigación, justificando con claridad qué, por qué y para qué realizar las futuras pruebas.",
      0.90: "Plantea recomendaciones viables alineadas al trabajo, pero presenta imprecisiones menores en la justificación de 1 de las propuestas.",
      0.80: "Plantea recomendaciones aceptables, pero incluye propuestas con dudas menores de viabilidad técnica o de alcance.",
      0.70: "Incluye recomendaciones no viables, irrealizables o fuera de alcance técnico/económico del laboratorio, o sugerencias generales de escasa aplicabilidad.",
      0.50: "Recomendaciones ausentes, o consistentes únicamente en propuestas totalmente no viables, parches a errores operativos del laboratorio o pedidos genéricos de 'más cuidado' / 'equipos más precisos'."
    },
    // ==========================================
    // SECCIÓN 6: NOMENCLATURA
    // ==========================================
    sec_61: {
      1.0: "Incluye la totalidad de las variables del texto y ecuaciones. Cada símbolo posee un único significado, con descripción clara y unidades SI correctas. Excluye acrónimos/siglas y operadores matemáticos.",
      0.90: "Incluye los símbolos requeridos con unidades correctas, pero presenta imprecisiones menores en 1 de las definiciones o unidades.",
      0.80: "Presenta imprecisiones moderadas en 1 aspecto (ej. omisión de unidades en 2 símbolos) o imprecisiones leves en 2 aspectos.",
      0.70: "Nomenclatura incompleta; omite múltiples símbolos de las ecuaciones o asigna un mismo símbolo a dos variables distintas.",
      0.50: "Omisión total de la sección de Nomenclatura, inclusión de acrónimos/siglas como variables o unidades erróneas en todo el documento."
    },
    sec_62: {
      1.0: "Presentada como lista en columnas (sin cuadro/tabla), ordenada alfabéticamente sin imprecisiones y clasificada estrictamente en los 5 grupos normativos con subtítulos en negrita: (1) Romanas mayúsculas, (2) Romanas minúsculas, (3) Griegas, (4) Subíndices y (5) Superíndices.",
      0.90: "Mantiene la lista en columnas y los 5 grupos normativos con unidades correctas, pero presenta imprecisiones leves en la secuencia alfabética o tipografía de los subtítulos.",
      0.80: "Presenta imprecisiones moderadas o reiteradas en la secuencia alfabética o en la clasificación de los 5 grupos normativos.",
      0.70: "Presenta imprecisiones severas o sistemáticas (ej. omite los subtítulos de grupo o mezcla letras romanas y griegas), o presenta la nomenclatura dentro de un cuadro/tabla tradicional.",
      0.50: "Presenta imprecisiones críticas y generalizadas, lista totalmente desordenada sin secuencia alfabética ni clasificación por grupos, o formato notoriamente alterado."
    },
    // ==========================================
    // SECCIÓN 7: REFERENCIAS BIBLIOGRÁFICAS
    // ==========================================
    sec_71: {
      1.0: "Coincidencia 1:1 entre las citas del texto y la lista final de referencias (sin citas ni referencias huérfanas). Todos los medios digitales consultados (artículos, páginas web, manuales en línea) incluyen sus campos obligatorios completos y la URL activa o el DOI correspondiente.",
      0.90: "Coincidencia 1:1 entre citas y referencias, pero presenta imprecisiones leves en los campos de 1 referencia o la omisión puntual de la URL/DOI en 1 medio digital.",
      0.80: "Presenta imprecisiones moderadas o reiteradas en los campos obligatorios, omisión recurrente de la URL/DOI en medios digitales, o la existencia de 1 cita/referencia huérfana.",
      0.70: "Lista bibliográfica desorganizada o incompleta; presenta imprecisiones severas o sistemáticas en los campos obligatorios, múltiples medios digitales sin URL/DOI o citas huérfanas.",
      0.50: "Referencias ausentes, o inclusión de citas/referencias digitales inventadas o falsificadas."
    },
    // ==========================================
    // SECCIÓN 8: APÉNDICES Y ANEXOS
    // ==========================================
    sec_81: {
      1.0: "Presenta los datos experimentales crudos con correspondencia 1:1 absoluta con la hoja o archivo digital de datos de campo.",
      0.90: "Presenta los datos crudos con correspondencia adecuada, pero con imprecisiones leves en la trascripción de 1 valor secundario.",
      0.80: "Presenta la mayoría de los datos crudos, pero con imprecisiones moderadas en la correspondencia de varios valores.",
      0.70: "Datos experimentales incompletos; incongruencia notoria entre los datos reportados y el archivo crudo de campo.",
      0.50: "Omisión total de la sección de datos experimentales crudos o datos alterados/falsificados."
    },
    sec_82: {
      1.0: "En Reporte: Presenta cuadros completos con la totalidad de los valores intermedios, demostrando concordancia absoluta con la lógica de cálculo verificable en el Apéndice C. / En Artículo: Presenta los títulos del cálculo a realizar y la ecuación numerada requerida para cada apartado.",
      0.90: "Presenta los resultados intermedios o muestra de cálculo con concordancia adecuada, pero con imprecisiones leves en la lógica de cálculo o especificación de 1 ecuación.",
      0.80: "Presenta resultados intermedios o cálculos principales, pero con imprecisiones moderadas en la secuencia lógica de cálculo u omisión de origen/destino de datos.",
      0.70: "Resultados intermedios o muestra de cálculo incompleta; omite valores intermedios esenciales o apartados clave para seguir el flujo del cálculo.",
      0.50: "Omisión de la sección de resultados intermedios o de la muestra de cálculo, o valores matemáticamente incoherentes."
    },
    sec_83: {
      1.0: "En Reporte: Presenta estrictamente UN cálculo de muestra por apartado: título, ecuación (C.X), origen de datos (cuadro/fila/columna), sustitución y destino (cuadro/fila/columna). / En Artículo: Adjunta la imagen de datos crudos (1 pt), hoja de cálculo Excel funcional (1 pt) y Declaración de Transparencia IA.",
      0.90: "Desarrolla la muestra de cálculo (Reporte) o adjunta ambos anexos (Artículo), pero presenta imprecisiones leves en la especificación de 1 origen/destino o legibilidad de imagen.",
      0.80: "Desarrolla los cálculos principales con imprecisiones moderadas (Reporte), o la hoja de cálculo de anexos presenta fórmulas sin automatizar (Artículo).",
      0.70: "Muestra de cálculo incompleta o desorganizada (Reporte), o adjunta únicamente 1 de los 2 anexos obligatorios (Artículo).",
      0.50: "Omisión de la muestra de cálculo (Reporte) o de los anexos obligatorios (Artículo)."
    },
    sec_84: {
      1.0: "Cumple la codificación normativa y presenta el diagrama o flujo del procedimiento experimental en el Apéndice D.",
      0.90: "Mantiene la codificación de apéndices y procedimiento, pero presenta imprecisiones leves en la numeración de 1 cuadro o título.",
      0.80: "Presenta imprecisiones moderadas en la nomenclatura o codificación de los apéndices o procedimiento.",
      0.70: "Codificación desorganizada; omite las letras de apéndice (A, B, C, D) en la titulación de cuadros y ecuaciones.",
      0.50: "Apéndices sin títulos, sin codificación ni estructura organizativa."
    },
    sec_85: {
      1.0: "Adjunta la imagen/fotografía o archivo digital (tablet/PC) de los datos crudos tomados en el laboratorio (1 pt), integra la hoja de cálculo Excel funcional (1 pt) y la Declaración Obligatoria de Transparencia e IA (Sección 5.2).",
      0.90: "Adjunta ambos anexos y declaración, pero el archivo/imagen de los datos de campo presenta imprecisiones leves de legibilidad.",
      0.80: "Entrega la hoja de datos de campo y Excel, pero la hoja de cálculo presenta imprecisiones moderadas en la automatización de fórmulas.",
      0.70: "Omite el anexo de la Declaración de Transparencia y Uso de IA (Sección 5.2) o la hoja de datos de campo es parcialmente ilegible.",
      0.50: "Omisión total de ambos anexos obligatorios (0 pts en anexos)."
    },
    // Aliases legacy para Apéndices
    sec_72: {
      1.0: "En Reporte: Presenta cuadros completos con la totalidad de los valores intermedios. / En Artículo: Presenta títulos de cálculo y ecuaciones numeradas.",
      0.90: "Presenta resultados intermedios o muestra de cálculo con imprecisiones leves.",
      0.80: "Presenta resultados con imprecisiones moderadas.",
      0.70: "Resultados intermedios o muestra incompleta.",
      0.50: "Omisión de resultados intermedios o muestra de cálculo."
    },
    sec_73: {
      1.0: "En Reporte: Muestra de cálculo formal (C.X). / En Artículo: Anexos obligatorios.",
      0.90: "Desarrolla cálculos o anexos con imprecisiones leves.",
      0.80: "Cálculos o anexos con imprecisiones moderadas.",
      0.70: "Muestra o anexos incompletos.",
      0.50: "Omisión de muestra de cálculo o anexos."
    },
    sec_74: {
      1.0: "Cumple la codificación normativa y presenta el diagrama o flujo del procedimiento experimental en el Apéndice D.",
      0.90: "Mantiene la codificación pero con imprecisiones leves.",
      0.80: "Imprecisiones moderadas en codificación o procedimiento.",
      0.70: "Codificación desorganizada u omite letras de apéndice.",
      0.50: "Apéndices sin títulos ni estructura."
    },
    sec_75: {
      1.0: "Adjunta datos crudos de campo, hoja Excel funcional y Declaración de Transparencia IA.",
      0.90: "Adjunta ambos anexos pero con imprecisiones leves de legibilidad.",
      0.80: "Entrega datos y Excel pero con imprecisiones moderadas.",
      0.70: "Omite declaración IA o datos parcialmente ilegibles.",
      0.50: "Omisión total de anexos obligatorios."
    },
    // ==========================================
    // DISCUSIÓN ESPECÍFICA: TRABAJO FINAL (TABLA 2.A)
    // ==========================================
    tf_41: {
      1.0: "Desarrolla un análisis estadístico exhaustivo del DOE: verificación de supuestos del modelo (normalidad, homocedasticidad e independencia) o justificación técnica, especificación del nivel de significancia (α), pruebas de hipótesis (p-valor o F), comparaciones múltiples (LSD/Tukey) y evaluación de efectos principales e interacciones.",
      0.90: "Desarrolla el análisis completo del ANOVA y supuestos, pero presenta imprecisiones menores en la interpretación de los resultados estadísticos.",
      0.80: "Aplica el ANOVA pero con imprecisiones moderadas (ej. omite verificar o justificar supuestos, omite el nivel de confianza, o no aplica LSD cuando era requerido).",
      0.70: "Análisis estadístico incompleto; se limita a reportar la tabla del ANOVA sin pruebas de hipótesis ni verificación de supuestos o sin interpretar los resultados.",
      0.50: "Omisión total del análisis estadístico o presentación de datos sin tratamiento estadístico formal."
    },
    tf_42: {
      1.0: "Explica en profundidad las tendencias observadas en los gráficos fundamentándose en los principios de fenómenos de transporte, termodinámica o cinética química relevantes al proyecto, justificando el comportamiento físico de cada variable de respuesta.",
      0.90: "Explica las tendencias y mecanismos científicos, pero presenta imprecisiones menores en la justificación técnica de 1 comportamiento anómalo.",
      0.80: "Describe las tendencias gráficas pero con imprecisiones moderadas en la fundamentación científica o explicaciones cualitativas simplistas.",
      0.70: "Discusión superficial; se limita a describir lo que se ve en el gráfico ('la variable aumentó') sin explicar el porqué físico/químico del fenómeno.",
      0.50: "Omisión del análisis de tendencias o explicaciones técnicamente erróneas/pseudocientíficas."
    },
    tf_43: {
      1.0: "Contrasta cuantitativamente los resultados obtenidos con valores reportados en literatura científica arbitrada (artículos, patentes o fichas técnicas de la industria), justificando técnica y críticamente las concordancias o discrepancias encontradas.",
      0.90: "Compara con literatura científica oficial, pero presenta imprecisiones menores en la justificación de la discrepancia con 1 fuente bibliográfica.",
      0.80: "Compara con literatura pero con imprecisiones moderadas (ej. fuentes no arbitradas/blogs web, o comparación cualitativa sin valores de referencia).",
      0.70: "Comparación incompleta; cita literatura pero no contrasta numéricamente los resultados del proyecto con los datos teóricos/publicados.",
      0.50: "Omisión total de la comparación con literatura científica oficial."
    },
    tf_44: {
      1.0: "Identifica e integra dentro de la prosa de la discusión las posibles fuentes de error experimental, limitaciones instrumentales, variabilidad de materias primas e incertidumbres operacionales que sustentan las desviaciones observadas.",
      0.90: "Contempla las fuentes de error en la discusión, pero presenta imprecisiones menores en la identificación de 1 causa secundaria.",
      0.80: "Contempla fuentes de error en la discusión, pero con imprecisiones moderadas (ej. excusas genéricas de 'error humano' sin análisis técnico de la variabilidad).",
      0.70: "Análisis de errores muy superficial; atribuye las desviaciones a factores no relacionados con el diseño experimental ejecutado.",
      0.50: "Omisión del análisis de fuentes de error e incertidumbres dentro de la discusión."
    },
    tf_45: {
      1.0: "Desarrolla con rigurosidad las 3 áreas: dimensionamiento de equipos principales y balances (escalamiento), desglose detallado de materias primas, tarifas ICE/CNFL y AyA y costo unitario (costos), y mercado meta con ventajas competitivas y permisos sanitarios/ambientales (mercado/regulación).",
      0.90: "Desarrolla las 3 áreas con solidez técnica, pero presenta imprecisiones menores en el desglose de 1 rubro de costos o en la identificación de 1 permiso regulatorio.",
      0.80: "Desarrolla las secciones pero con análisis financiero o de escalamiento superficial (ej. costos globales sin cotizaciones locales o marco regulatorio genérico).",
      0.70: "Propuesta incompleta; omite una de las tres áreas obligatorias (escalamiento de planta, estructura de costos o mercado costarricense).",
      0.50: "Omisión total de las secciones de escalamiento, costos de producción y mercado nacional."
    },
    // Calderas
    cald_1: {
      1.0: "Identifica correctamente el tipo de caldera, su capacidad, el área de transferencia de calor y el combustible de operación, fundamentando con las especificaciones del fabricante (Fulton).",
      0.90: "Identifica los 4 aspectos generales, pero presenta imprecisiones menores en 1 de los valores (ej. área de transferencia).",
      0.80: "Identifica los aspectos generales, pero con imprecisiones moderadas en 2 de los valores o sin fundamentar con las especificaciones del fabricante.",
      0.70: "Identificación incompleta; omite reportar 1 de los 4 aspectos generales solicitados.",
      0.50: "Omisión de la mayoría de los aspectos generales o información incorrecta sobre el tipo de caldera."
    },
    cald_2: {
      1.0: "Identifica los elementos de seguridad en el acceso, clasifica correctamente la caldera (A, B, C o D) y justifica el cumplimiento de los incisos a), b), c) y d) del Art. 17 y las disposiciones del Art. 18, con evidencia fotográfica cuando aplica.",
      0.90: "Clasifica la caldera y verifica los artículos, pero presenta imprecisiones menores en la justificación de 1 inciso del Art. 17.",
      0.80: "Clasifica la caldera y verifica los artículos, pero con imprecisiones moderadas en la justificación de 2 incisos o sin evidencia fotográfica.",
      0.70: "Clasificación incorrecta de la caldera o omisión de la justificación de cumplimiento del Art. 17 o el Art. 18.",
      0.50: "Omisión del análisis del cuarto de calderas o clasificación ausente de la caldera."
    },
    cald_3: {
      1.0: "Reporte de capacidad del tanque de gas LP, justifica correctamente si aplica el inciso e) y verifica el cumplimiento de los incisos f) e i) del Art. 22 con evidencia fotográfica.",
      0.90: "Reporta la capacidad y justifica los incisos, pero presenta imprecisiones menores en la verificación de 1 inciso.",
      0.80: "Reporta la capacidad del tanque, pero con imprecisiones moderadas en la justificación de 2 incisos del Art. 22.",
      0.70: "Reporte incompleto; omite justificar 1 de los 3 incisos solicitados del Art. 22.",
      0.50: "Omisión del análisis del tanque de combustible o capacidad no reportada."
    },
    cald_4: {
      1.0: "Verifica el cumplimiento de la totalidad de los incisos a) a j) del Art. 24, indicando la presencia/ausencia de cada dispositivo de seguridad requerido, con evidencia fotográfica cuando es posible.",
      0.90: "Verifica los incisos a) a j), pero presenta imprecisiones menores en la identificación de 1 dispositivo de seguridad.",
      0.80: "Verifica la mayoría de los incisos, pero con imprecisiones moderadas en la verificación de 2 o 3 incisos.",
      0.70: "Verificación incompleta; omite la revisión de 4 o más incisos del Art. 24.",
      0.50: "Omisión del análisis de dispositivos de seguridad."
    },
    cald_5: {
      1.0: "Identifica los tratamientos del agua (nombre, tipo químico/físico, externo/interno), adjunta el informe del estado de la caldera, compara con los parámetros de calidad del fabricante y propone tratamientos viables para los parámetros fuera de límite.",
      0.90: "Identifica los tratamientos y adjunta el informe, pero presenta imprecisiones menores en la comparación con 1 parámetro del fabricante o en la propuesta de tratamiento.",
      0.80: "Identifica los tratamientos y adjunta el informe, pero con imprecisiones moderadas en la comparación con los parámetros o propuesta de tratamiento genérica.",
      0.70: "Identificación incompleta de tratamientos; omite adjuntar el informe del estado de la caldera o no propone tratamientos para los parámetros fuera de límite.",
      0.50: "Omisión del análisis de tratamiento de agua o informe no adjuntado."
    },
    cald_6: {
      1.0: "Realiza una investigación bibliográfica rigurosa sobre pruebas no destructivas aplicables a la inspección de calderas, lista las técnicas identificadas y resume en qué consiste cada una de ellas.",
      0.90: "Investiga y lista las técnicas de PND, pero presenta imprecisiones menores en el resumen de 1 técnica.",
      0.80: "Lista las técnicas de PND, pero con imprecisiones moderadas en los resúmenes o sin fuentes bibliográficas.",
      0.70: "Investigación superficial; lista las técnicas pero no resume en qué consiste cada una o viceversa.",
      0.50: "Omisión de la investigación sobre pruebas no destructivas."
    },
    cald_7: {
      1.0: "Presenta el plano de ubicación con vista frontal y superior de la caldera y chimenea, tuberías y accesorios de gas, agua y vapor (con purgas), código de colores normativo, vistas en detalle de válvulas de seguridad, manómetros e indicadores de nivel, dimensiones medidas del cuarto de calderas y formato CIQPA (nivel profesional 4to año IQ).",
      0.90: "Presenta el plano con las vistas, código de colores y formato CIQPA, con imprecisiones menores en 1 detalle secundario.",
      0.80: "Presenta el plano, pero con imprecisiones moderadas en el código de colores o en la inclusión de las vistas en detalle.",
      0.70: "Plano incompleto; omite una de las vistas obligatorias (frontal o superior) o no utiliza el formato CIQPA.",
      0.50: "Omisión del plano de ubicación o plano rudimentario sin dimensiones ni código de colores."
    }
  };

  // Helper para obtener el texto del descriptor por nivel garantizando desacoplamiento por práctica
  function getCriterionDescriptorText(critId, pct, critObj) {
    if (critObj && critObj.levels && critObj.levels[pct]) {
      return critObj.levels[pct];
    }
    if (typeof CRITERION_LEVEL_DESCRIPTORS !== "undefined" && CRITERION_LEVEL_DESCRIPTORS[critId] && CRITERION_LEVEL_DESCRIPTORS[critId][pct]) {
      return CRITERION_LEVEL_DESCRIPTORS[critId][pct];
    }
    const info = (typeof LEVEL_DESCRIPTORS !== "undefined" && LEVEL_DESCRIPTORS[pct]) ? LEVEL_DESCRIPTORS[pct] : (typeof LEVEL_DESCRIPTORS !== "undefined" ? LEVEL_DESCRIPTORS[1.0] : { titulo: "Nivel", desc: "" });
    return (critObj && critObj.desc) ? `${info.desc} (${critObj.desc})` : info.desc;
  }

  // ==========================================
  // 2. DEFINICIÓN DE CRITERIOS POR MODALIDAD
  // ==========================================

  function getDiscusionesEspecificas(practicaId, maxPts) {
    const isReporte = maxPts <= 38;
    const hasDescriptors = typeof CRITERION_LEVEL_DESCRIPTORS !== "undefined";

    if (practicaId === "BOMBAS") {
      return [
        {
          id: "disc_bombas_41",
          categoria: "4. Resultados y Discusión",
          nombre: "4.1 Curvas Características (H-Q, η-Q, W-Q) vs. Fabricante",
          puntos: isReporte ? 10.0 : 11.0,
          tag: "Fondo",
          desc: "Analiza el comportamiento de la bomba a partir de sus curvas características y compara la curva experimental H-Q con la del fabricante.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_bombas_41 : null
        },
        {
          id: "disc_bombas_42",
          categoria: "4. Resultados y Discusión",
          nombre: "4.2 Curva del Sistema, Punto de Operación y BEP",
          puntos: isReporte ? 10.0 : 11.0,
          tag: "Fondo",
          desc: "Construye e interpreta la curva del sistema, identifica el punto de operación real y lo compara contra el BEP.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_bombas_42 : null
        },
        {
          id: "disc_bombas_43",
          categoria: "4. Resultados y Discusión",
          nombre: "4.3 Arreglos Serie y Paralelo y Diagnóstico de Desviaciones",
          puntos: isReporte ? 10.0 : 11.0,
          tag: "Fondo",
          desc: "Evalúa el desempeño en serie y paralelo, contrasta con predicción teórica y diagnostica pérdidas y asimetrías.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_bombas_43 : null
        },
        {
          id: "disc_bombas_44",
          categoria: "4. Resultados y Discusión",
          nombre: "4.4 Balance en Succión, NPSHd y Margen con NPSHr",
          puntos: isReporte ? 5.0 : 6.0,
          tag: "Fondo",
          desc: "Calcula presión de succión por balance, determina NPSHd y argumenta consecuencias de cavitación.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_bombas_44 : null
        },
        {
          id: "disc_bombas_45",
          categoria: "4. Resultados y Discusión",
          nombre: "4.5 Inclusión de Posibles Fuentes de Error en la Discusión",
          puntos: isReporte ? 3.0 : 4.0,
          tag: "Fondo",
          desc: "Identifica e integra en la prosa de la discusión las posibles fuentes de error experimental e incertidumbres.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_bombas_45 : null
        }
      ];
    } else if (practicaId === "CAIDA_PRESION") {
      return [
        {
          id: "disc_caida_41",
          categoria: "4. Resultados y Discusión",
          nombre: "4.1 Pérdidas Mayores, Factor f vs. Re y Diagrama de Moody",
          puntos: isReporte ? 18.0 : 20.0,
          tag: "Fondo",
          desc: "Evalúa pérdidas en tramos rectos, grafica f vs Re, compara con Moody y analiza rugosidad relativa y diámetro.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_caida_41 : null
        },
        {
          id: "disc_caida_42",
          categoria: "4. Resultados y Discusión",
          nombre: "4.2 Pérdidas Menores, Coeficiente K en Accesorios vs. Literatura",
          puntos: isReporte ? 15.0 : 17.0,
          tag: "Fondo",
          desc: "Determina ΔP y pérdidas menores en accesorios/válvulas, calcula K y compara con valores teóricos justificando desviaciones.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_caida_42 : null
        },
        {
          id: "disc_caida_43",
          categoria: "4. Resultados y Discusión",
          nombre: "4.3 Inclusión de Posibles Fuentes de Error (Purga, Manómetros, Caudal)",
          puntos: isReporte ? 5.0 : 6.0,
          tag: "Fondo",
          desc: "Identifica e integra dentro de la prosa fuentes de error experimental (purga mangueras manométricas, precisión de Q).",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_caida_43 : null
        }
      ];
    } else if (practicaId === "INTERCAMBIO_CALOR") {
      return [
        {
          id: "disc_calor_41",
          categoria: "4. Resultados y Discusión",
          nombre: "4.1 Comportamiento Térmico y Perfiles de Temperatura en Flujos",
          puntos: isReporte ? 14.0 : 15.0,
          tag: "Fondo",
          desc: "Analiza comportamiento térmico y perfiles de temperatura en configuraciones paralelo, contracorriente y cruzado.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_calor_41 : null
        },
        {
          id: "disc_calor_42",
          categoria: "4. Resultados y Discusión",
          nombre: "4.2 Efecto del Caudal y Temperatura sobre Q, LMTD y U",
          puntos: isReporte ? 14.0 : 15.0,
          tag: "Fondo",
          desc: "Evalúa efecto de variación de caudal y temperatura sobre tasa de transferencia Q, LMTD y coeficiente global U.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_calor_42 : null
        },
        {
          id: "disc_calor_43",
          categoria: "4. Resultados y Discusión",
          nombre: "4.3 Balances de Energía y Pérdidas Térmicas al Ambiente",
          puntos: isReporte ? 7.0 : 9.0,
          tag: "Fondo",
          desc: "Cuantifica balances de energía determinando Qh cedido, Qc ganado y pérdidas térmicas hacia el entorno.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_calor_43 : null
        },
        {
          id: "disc_calor_44",
          categoria: "4. Resultados y Discusión",
          nombre: "4.4 Inclusión de Posibles Fuentes de Error en la Discusión",
          puntos: isReporte ? 3.0 : 4.0,
          tag: "Fondo",
          desc: "Identifica e integra en la prosa fuentes de error en termocuplas, estado estacionario y pérdidas al ambiente.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_calor_44 : null
        }
      ];
    } else {
      return [
        {
          id: "disc_gen_41",
          categoria: "4. Resultados y Discusión",
          nombre: "4.1 Análisis de Tendencias y Fenómenos Físico-Químicos",
          puntos: isReporte ? 19.0 : 21.0,
          tag: "Fondo",
          desc: "Analiza rigurosamente los datos experimentales y gráficos en función de los principios teóricos.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_gen_41 : null
        },
        {
          id: "disc_gen_42",
          categoria: "4. Resultados y Discusión",
          nombre: "4.2 Comparación Crítica con Literatura / Valores Teóricos",
          puntos: isReporte ? 14.0 : 16.0,
          tag: "Fondo",
          desc: "Contrasta numéricamente los resultados experimentales con ecuaciones de diseño y literatura técnica.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_gen_42 : null
        },
        {
          id: "disc_gen_43",
          categoria: "4. Resultados y Discusión",
          nombre: "4.3 Inclusión de Fuentes de Error e Incertidumbres",
          puntos: isReporte ? 5.0 : 6.0,
          tag: "Fondo",
          desc: "Identifica e integra en la prosa de la discusión las incertidumbres y posibles fuentes de error.",
          levels: hasDescriptors ? CRITERION_LEVEL_DESCRIPTORS.disc_gen_43 : null
        }
      ];
    }
  }

  function getCriteriosReporte(practicaId) {
    return [
      // 1. Resumen
      { id: "sec_11", categoria: "1. Resumen", nombre: "1.1 Resumen en Español (¿Qué?, ¿Para qué?, ¿Cómo?, Resultados)", puntos: 10.0, tag: "Fondo", desc: "Sintetiza las 4 preguntas esenciales con valores cuantitativos y recomendación principal." },
      
      // 2. Marco Teórico
      { id: "sec_21", categoria: "2. Marco Teórico", nombre: "2.1 Temas Mínimos Obligatorios de la Guía", puntos: 6.0, tag: "Fondo", desc: "Desarrolla la totalidad de los temas teóricos mínimos solicitados en la guía de indagación." },
      { id: "sec_22", categoria: "2. Marco Teórico", nombre: "2.2 Pertinencia Teórica para la Discusión", puntos: 1.0, tag: "Fondo", desc: "Toda la teoría incluida es pertinente y orientada a fundamentar la discusión, sin relleno." },
      { id: "sec_23", categoria: "2. Marco Teórico", nombre: "2.3 Hilo Conductor, Redacción y Referenciación Oportuna", puntos: 1.0, tag: "Forma", desc: "Redacción fluida en prosa técnica continua con conectores de transición y citas oportunas." },

      // 3. Sección Experimental
      { id: "sec_31", categoria: "3. Sección Experimental", nombre: "3.1 Párrafo Introductorio y Objetivos Medibles", puntos: 1.5, tag: "Fondo", desc: "Redactado en prosa respondiendo a ¿qué?, ¿para qué? y ¿cómo?, con objetivos alineados al título." },
      { id: "sec_32", categoria: "3. Sección Experimental", nombre: "3.2 Cuadros de Sustancias (MSDS/Desechos) y Equipos", puntos: 1.0, tag: "Fondo", desc: "Cuadro de sustancias (propiedades, MSDS, EPP, desechos) y equipos (marca, ámbito, resolución)." },
      { id: "sec_33", categoria: "3. Sección Experimental", nombre: "3.3 Inclusión de Variables Categorizadas (IBL)", puntos: 1.0, tag: "Fondo", desc: "Incluye la totalidad de variables de la guía (respuesta, controlables y no controlables)." },
      { id: "sec_34", categoria: "3. Sección Experimental", nombre: "3.4 Redacción en Pasado Impersonal e Indicativo", puntos: 0.5, tag: "Forma", desc: "Redactado estrictamente en pasado simple, impersonal y modo indicativo en prosa continua." },
      { id: "sec_35", categoria: "3. Sección Experimental", nombre: "3.5 Diagrama Técnico de Equipo en AutoCAD (.dwg)", puntos: 1.0, tag: "Forma", desc: "Diagrama AutoCAD claro, simbología adecuada e identificación de componentes e instrumentos." },

      // 4. Resultados y Discusión (Forma Transversal + Específicos)
      { id: "sec_4f", categoria: "4. Resultados y Discusión", nombre: "4.F Integración de Datos y Redacción Impersonal (Forma Transversal)", puntos: 2.0, tag: "Forma Transversal", desc: "Integra figuras progresivamente con Variable, símbolo/(unidad) y pasado simple impersonal." },
      ...getDiscusionesEspecificas(practicaId, 38),

      // 5. Conclusiones y Recomendaciones
      { id: "sec_51", categoria: "5. Conclusiones y Recomendaciones", nombre: "5.1 Conclusiones Cuantitativas Alineadas a Objetivos", puntos: 8.0, tag: "Fondo", desc: "Responde numéricamente a cada objetivo específico explicando significado sin repetir teoría." },
      { id: "sec_52", categoria: "5. Conclusiones y Recomendaciones", nombre: "5.2 Recomendaciones Técnicas de Extensión y Viabilidad", puntos: 8.0, tag: "Fondo", desc: "Propuestas técnicas viables fundamentando qué, por qué y para qué realizar futuros ensayos." },

      // 6. Nomenclatura
      { id: "sec_61", categoria: "6. Nomenclatura", nombre: "6.1 Completitud, Univocidad y Exclusiones de Nomenclatura", puntos: 3.0, tag: "Fondo", desc: "Incluye totalidad de variables del texto y ecuaciones, significado unívoco y excluye acrónimos." },
      { id: "sec_62", categoria: "6. Nomenclatura", nombre: "6.2 Orden Alfabético, 5 Grupos Normativos y Lista en Columnas", puntos: 1.0, tag: "Forma", desc: "Lista en columnas ordenada alfabéticamente en los 5 grupos normativos con subtítulos en negrita." },

      // 7. Referencias
      { id: "sec_71", categoria: "7. Referencias Bibliográficas", nombre: "7.1 Coincidencia 1:1, Formato IEEE/ACS y Enlaces DOI/URL", puntos: 2.0, tag: "Fondo/Forma", desc: "Coincidencia 1:1 entre citas y lista, campos completos y DOI/URL activos en fuentes digitales." },

      // 8. Apéndices y Anexos
      { id: "sec_81", categoria: "8. Apéndices y Anexos", nombre: "8.1 Apéndice A: Datos Experimentales Crudos", puntos: 2.0, tag: "Fondo", desc: "Correspondencia 1:1 absoluta con la hoja o archivo digital de datos de campo del laboratorio." },
      { id: "sec_82", categoria: "8. Apéndices y Anexos", nombre: "8.2 Apéndice B: Resultados Intermedios", puntos: 5.0, tag: "Fondo", desc: "Cuadros completos con valores intermedios demostrando concordancia con la lógica de cálculo." },
      { id: "sec_83", categoria: "8. Apéndices y Anexos", nombre: "8.3 Apéndice C: Muestra de Cálculo (Título, Ec. C.X, Origen, Destino)", puntos: 5.0, tag: "Fondo", desc: "Un cálculo por apartado con ecuación C.X, sustitución con unidades y origen/destino de datos." },
      { id: "sec_84", categoria: "8. Apéndices y Anexos", nombre: "8.4 Apéndice D: Procedimiento Experimental", puntos: 1.0, tag: "Fondo", desc: "Diagrama o flujo operacional del procedimiento experimental ejecutado en el laboratorio." },
      { id: "sec_85", categoria: "8. Apéndices y Anexos", nombre: "8.5 Anexos Obligatorios (Datos de Campo + Hoja Excel + Transparencia IA)", puntos: 2.0, tag: "Fondo", desc: "Imagen de datos tomados en laboratorio (1 pt), hoja Excel funcional (1 pt) y Declaración IA." }
    ];
  }

  function getCriteriosArticulo(practicaId) {
    return [
      // 1. Resumen y Abstract
      { id: "sec_11", categoria: "1. Resumen y Abstract", nombre: "1.1 Resumen en Español (¿Qué?, ¿Para qué?, ¿Cómo?, Resultados)", puntos: 7.5, tag: "Fondo", desc: "Sintetiza las 4 preguntas esenciales con valores cuantitativos y recomendación principal." },
      { id: "sec_12", categoria: "1. Resumen y Abstract", nombre: "1.2 Abstract en Inglés (Sintaxis, Gramática y Tiempos Verbales)", puntos: 7.5, tag: "Fondo/Forma", desc: "Traducción técnica rigurosa respondiendo a las 4 preguntas esenciales en inglés con vocabulario adecuado." },

      // 2. Introducción / Marco Teórico
      { id: "sec_21", categoria: "2. Introducción / Marco Teórico", nombre: "2.1 Temas Mínimos Obligatorios de la Guía", puntos: 6.0, tag: "Fondo", desc: "Desarrolla la totalidad de los temas teóricos mínimos solicitados en la guía de indagación." },
      { id: "sec_22", categoria: "2. Introducción / Marco Teórico", nombre: "2.2 Pertinencia Teórica para la Discusión", puntos: 1.0, tag: "Fondo", desc: "Toda la teoría incluida es pertinente y orientada a fundamentar la discusión, sin relleno." },
      { id: "sec_23", categoria: "2. Introducción / Marco Teórico", nombre: "2.3 Hilo Conductor, Redacción y Referenciación Oportuna", puntos: 1.0, tag: "Forma", desc: "Redacción fluida en prosa técnica continua con conectores de transición y citas oportunas." },

      // 3. Metodología Experimental
      { id: "sec_31", categoria: "3. Metodología Experimental", nombre: "3.1 Párrafo Introductorio y Objetivos Medibles", puntos: 1.5, tag: "Fondo", desc: "Redactado en prosa respondiendo a ¿qué?, ¿para qué? y ¿cómo?, con objetivos alineados al título." },
      { id: "sec_32", categoria: "3. Metodología Experimental", nombre: "3.2 Cuadros de Sustancias (MSDS/Desechos) y Equipos", puntos: 1.0, tag: "Fondo", desc: "Cuadro de sustancias (propiedades, MSDS, EPP, desechos) y equipos (marca, ámbito, resolución)." },
      { id: "sec_33", categoria: "3. Metodología Experimental", nombre: "3.3 Inclusión de Variables Categorizadas (IBL)", puntos: 1.0, tag: "Fondo", desc: "Incluye la totalidad de variables de la guía (respuesta, controlables y no controlables)." },
      { id: "sec_34", categoria: "3. Metodología Experimental", nombre: "3.4 Redacción en Pasado Impersonal e Indicativo", puntos: 0.5, tag: "Forma", desc: "Redactado estrictamente en pasado simple, impersonal y modo indicativo en prosa continua." },
      { id: "sec_35", categoria: "3. Metodología Experimental", nombre: "3.5 Diagrama Técnico de Equipo en AutoCAD (.dwg)", puntos: 1.0, tag: "Forma", desc: "Diagrama AutoCAD claro, simbología adecuada e identificación de componentes e instrumentos." },

      // 4. Resultados y Discusión (Forma Transversal + Específicos)
      { id: "sec_4f", categoria: "4. Resultados y Discusión", nombre: "4.F Integración de Datos y Redacción Impersonal (Forma Transversal)", puntos: 2.0, tag: "Forma Transversal", desc: "Integra figuras progresivamente con Variable, símbolo/(unidad) y pasado simple impersonal." },
      ...getDiscusionesEspecificas(practicaId, 43),

      // 5. Conclusiones y Recomendaciones
      { id: "sec_51", categoria: "5. Conclusiones y Recomendaciones", nombre: "5.1 Conclusiones Cuantitativas Alineadas a Objetivos", puntos: 8.0, tag: "Fondo", desc: "Responde numéricamente a cada objetivo específico explicando significado sin repetir teoría." },
      { id: "sec_52", categoria: "5. Conclusiones y Recomendaciones", nombre: "5.2 Recomendaciones Técnicas de Extensión y Viabilidad", puntos: 8.0, tag: "Fondo", desc: "Propuestas técnicas viables fundamentando qué, por qué y para qué realizar futuros ensayos." },

      // 6. Nomenclatura
      { id: "sec_61", categoria: "6. Nomenclatura", nombre: "6.1 Completitud, Univocidad y Exclusiones de Nomenclatura", puntos: 3.0, tag: "Fondo", desc: "Incluye totalidad de variables del texto y ecuaciones, significado unívoco y excluye acrónimos." },
      { id: "sec_62", categoria: "6. Nomenclatura", nombre: "6.2 Orden Alfabético, 5 Grupos Normativos y Lista en Columnas", puntos: 1.0, tag: "Forma", desc: "Lista en columnas ordenada alfabéticamente en los 5 grupos normativos con subtítulos en negrita." },

      // 7. Referencias
      { id: "sec_71", categoria: "7. Referencias Bibliográficas", nombre: "7.1 Coincidencia 1:1, Formato IEEE/ACS y Enlaces DOI/URL", puntos: 2.0, tag: "Fondo/Forma", desc: "Coincidencia 1:1 entre citas y lista, campos completos y DOI/URL activos en fuentes digitales." },

      // 8. Apéndices y Anexos
      { id: "sec_81", categoria: "8. Apéndices y Anexos", nombre: "8.1 Apéndice A: Datos Experimentales Crudos", puntos: 2.0, tag: "Fondo", desc: "Correspondencia 1:1 absoluta con la hoja o archivo digital de datos de campo del laboratorio." },
      { id: "sec_82", categoria: "8. Apéndices y Anexos", nombre: "8.2 Apéndice B: Muestra de Cálculo / Ecuaciones Numeradas", puntos: 1.0, tag: "Fondo", desc: "Títulos de cálculo y ecuaciones numeradas requeridas para cada apartado (sin datos intermedios)." },
      { id: "sec_83", categoria: "8. Apéndices y Anexos", nombre: "8.3 Anexos Obligatorios (Datos de Campo + Hoja Excel + Transparencia IA)", puntos: 2.0, tag: "Fondo", desc: "Imagen de datos tomados en laboratorio (1 pt), hoja Excel funcional (1 pt) y Declaración IA." }
    ];
  }

  function getCriteriosCalderas() {
    return [
      { id: "cald_1", categoria: "1. Aspectos Generales", nombre: "1. Aspectos Generales (Tipo, Capacidad, Área de Transferencia, Combustible)", puntos: 10, tag: "Fondo", desc: "Identifica correctamente los 4 aspectos generales fundamentando con especificaciones Fulton." },
      { id: "cald_2", categoria: "2. Análisis del Cuarto de Calderas", nombre: "2. Análisis del Cuarto de Calderas — Art. 17 y 18 (Seguridad, Clasificación, Incisos a-d)", puntos: 15, tag: "Fondo", desc: "Identifica seguridad en acceso, clasifica caldera (A/B/C/D) y verifica Art. 17 (a-d) y Art. 18." },
      { id: "cald_3", categoria: "3. Análisis del Tanque de Combustible", nombre: "3. Análisis del Tanque de Combustible — Art. 22 (Capacidad gas LP, Incisos e, f, i)", puntos: 15, tag: "Fondo", desc: "Capacidad del tanque, justificación de distancias e-f y código de colores inciso i." },
      { id: "cald_4", categoria: "4. Dispositivos de Seguridad", nombre: "4. Dispositivos de Seguridad — Art. 24 (Verificación de Incisos a - j)", puntos: 20, tag: "Fondo", desc: "Verificación de válvulas de seguridad, indicadores nivel, manómetros, controles de presión y grifos." },
      { id: "cald_5", categoria: "5. Tratamiento del Agua", nombre: "5. Tratamiento del Agua — Art. 37 (Tratamientos, Informe de Ventanilla y Propuesta)", puntos: 15, tag: "Fondo", desc: "Tipos de tratamiento químico/físico, adjunta informe de caldera y propone tratamientos correctivos." },
      { id: "cald_6", categoria: "6. Investigación PND", nombre: "6. Investigación: Pruebas No Destructivas (PND en Calderas)", puntos: 10, tag: "Fondo", desc: "Investigación bibliográfica de técnicas PND aplicables a la inspección de calderas y resumen." },
      { id: "cald_7", categoria: "7. Dibujo Técnico: Plano Formato CIQPA", nombre: "7. Dibujo Técnico: Plano de Ubicación Formato CIQPA (Vistas, Tuberías y Detalles)", puntos: 15, tag: "Forma/Técnica", desc: "Plano con vista frontal/superior, código de colores normativo, detalles de seguridad y formato CIQPA (nivel 4to año IQ)." }
    ];
  }

  

  // ==========================================
  // 3. ESTADO DE LA APLICACIÓN
  // ==========================================
  let appState = {
    practicaId: "BOMBAS",
    modalidadId: "ARTICULO",
    subgrupo: "Subgrupo 01",
    temaProyecto: "Caracterización Hidrodinámica de Bombeo en Serie y Paralelo",
    evaluador: "Asistente del Curso",
    fecha: new Date().toISOString().split("T")[0],
    integrantes: "",
    correos: "",
    scores: {}, // id_criterio: score_asignado
    notas: {}, // id_criterio: nota_0_100
    comentariosPorSeccion: {}, // id_criterio: texto
    comentarioGeneral: "",
    dictamenModo: "auto", // 'auto' | 'Sobresaliente' | 'Bueno' | 'Suficiente' | 'Condicional' | 'Deficiente' | 'personalizado'
    dictamenPersonalizado: "",
    penalizacionFormato: 0,
    modoVista: "preview" // 'preview' | 'code'
  };

  let activeRubricIndex = 0;
  let currentSelectedLevelCondition = null;

  // LocalStorage Key para Atajos
  const SHORTCUTS_STORAGE_KEY = "iq0432_report_shortcuts_v1";

  function getShortcutsStore() {
    try {
      const data = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error al leer LocalStorage", e);
      return {};
    }
  }

  function saveShortcutsStore(store) {
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error("Error al guardar en LocalStorage", e);
    }
  }

  // ==========================================
  // 4. INICIALIZACIÓN DE LA UI
  // ==========================================
  document.addEventListener("DOMContentLoaded", function () {
    initSelects();
    initTabs();
    initPdfExtraction();
    initRubric();
    initShortcutsManager();
    initExportButtons();
    initLiveCalculation();
    initSessionManager();
    initDictamenDocenteControls();
    initSynthesizer();
    initEmailModal();
    initKeyboardShortcuts();
    renderLivePreview();
  });

  function initSelects() {
    const selectPractica = document.getElementById("select-practica");
    const selectModalidad = document.getElementById("select-modalidad");
    const inputFecha = document.getElementById("input-fecha");

    if (inputFecha) inputFecha.value = appState.fecha;

    // Poblar Prácticas
    selectPractica.innerHTML = "";
    PRACTICAS.forEach(function (p) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      selectPractica.appendChild(opt);
    });
    selectPractica.value = appState.practicaId;

    // Evento Cambio de Práctica
    selectPractica.addEventListener("change", function () {
      appState.practicaId = this.value;
      updateModalidadesDisponibles();
      initRubric();
      renderLivePreview();
    });

    updateModalidadesDisponibles();

    selectModalidad.addEventListener("change", function () {
      appState.modalidadId = this.value;
      initRubric();
      renderLivePreview();
    });

    // Inputs de Metadatos
    const inputSubgrupo = document.getElementById("input-subgrupo");
    const inputTema = document.getElementById("input-tema-proyecto");
    const inputEvaluador = document.getElementById("input-evaluador");
    const inputIntegrantes = document.getElementById("input-integrantes");
    const inputCorreos = document.getElementById("input-correos");

    if (inputSubgrupo) {
      inputSubgrupo.value = appState.subgrupo;
      inputSubgrupo.addEventListener("input", function () {
        appState.subgrupo = this.value;
        renderLivePreview();
      });
    }

    if (inputTema) {
      inputTema.value = appState.temaProyecto;
      inputTema.addEventListener("input", function () {
        appState.temaProyecto = this.value;
        renderLivePreview();
      });
    }

    if (inputEvaluador) {
      inputEvaluador.value = appState.evaluador;
      inputEvaluador.addEventListener("input", function () {
        appState.evaluador = this.value;
        renderLivePreview();
      });
    }

    if (inputFecha) {
      inputFecha.addEventListener("change", function () {
        appState.fecha = this.value;
        renderLivePreview();
      });
    }

    if (inputIntegrantes) {
      inputIntegrantes.addEventListener("input", function () {
        appState.integrantes = this.value;
        renderLivePreview();
      });
    }

    if (inputCorreos) {
      inputCorreos.addEventListener("input", function () {
        appState.correos = this.value;
        renderLivePreview();
      });
    }
  }

  function updateModalidadesDisponibles() {
    const selectModalidad = document.getElementById("select-modalidad");
    selectModalidad.innerHTML = "";

    let opciones = [];
    if (appState.practicaId === "CALDERAS") {
      opciones = [MODALIDADES.CALDERAS_AUDITORIA];
    } else if (appState.practicaId === "INTERCAMBIO_CALOR") {
      opciones = [MODALIDADES.REPORTE, MODALIDADES.ARTICULO];
    } else {
      opciones = [MODALIDADES.ARTICULO, MODALIDADES.REPORTE];
    }

    opciones.forEach(function (m) {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nombre;
      selectModalidad.appendChild(opt);
    });

    appState.modalidadId = opciones[0].id;
    selectModalidad.value = appState.modalidadId;
  }

  function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetTab = this.getAttribute("data-tab");
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-content").forEach(function (tc) { tc.classList.remove("active"); });

        this.classList.add("active");
        const activeContent = document.getElementById(targetTab);
        if (activeContent) activeContent.classList.add("active");

        if (targetTab === "tab-reporte") {
          renderLivePreview();
        }
      });
    });
  }

  // ==========================================
  // 5. EXTRACTOR Y VISOR CANVAS DE PDF (PDF.js)
  // ==========================================
  let pdfDoc = null;
  let pdfPageNum = 1;
  let pdfScale = 1.2;

  function initPdfExtraction() {
    const dropZone = document.getElementById("drop-zone-pdf");
    const fileInput = document.getElementById("file-pdf-input");
    const badge = document.getElementById("pdf-file-badge");
    const textarea = document.getElementById("input-texto-extraido");

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener("click", function () {
      fileInput.click();
    });

    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", function () {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processPdfFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        processPdfFile(this.files[0]);
      }
    });

    function processPdfFile(file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        alert("Por favor seleccione un archivo PDF válido.");
        return;
      }

      badge.style.display = "inline-block";
      badge.textContent = "📄 " + file.name + " (" + (file.size / 1024).toFixed(1) + " KB)";

      const fileReader = new FileReader();
      fileReader.onload = function () {
        const typedarray = new Uint8Array(this.result);
        if (window.pdfjsLib) {
          window.pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            pdfDoc = pdf;
            pdfPageNum = 1;
            renderPdfCanvasPage(pdfPageNum);
            document.getElementById("pdf-viewer-container").style.display = "block";

            let fullText = "";
            let numPages = pdf.numPages;
            let pagePromises = [];

            for (let i = 1; i <= numPages; i++) {
              pagePromises.push(
                pdf.getPage(i).then(function (page) {
                  return page.getTextContent().then(function (textContent) {
                    return textContent.items.map(function (item) { return item.str; }).join(" ");
                  });
                })
              );
            }

            Promise.all(pagePromises).then(function (pagesText) {
              fullText = pagesText.join("\n\n--- PÁGINA SIGUIENTE ---\n\n");
              if (textarea) {
                textarea.value = fullText;
                analyzePdfText(fullText);
              }
            });
          }).catch(function (err) {
            console.error("Error al procesar PDF", err);
            if (textarea) textarea.value = "Error al extraer texto del PDF: " + err.message;
          });
        }
      };
      fileReader.readAsArrayBuffer(file);
    }

    if (textarea) {
      textarea.addEventListener("input", function () {
        analyzePdfText(this.value);
      });
    }

    // Botones del Visor Canvas de PDF
    const btnPrev = document.getElementById("btn-pdf-prev");
    const btnNext = document.getElementById("btn-pdf-next");
    const btnZoomIn = document.getElementById("btn-pdf-zoom-in");
    const btnZoomOut = document.getElementById("btn-pdf-zoom-out");

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        if (pdfPageNum <= 1) return;
        pdfPageNum--;
        renderPdfCanvasPage(pdfPageNum);
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (!pdfDoc || pdfPageNum >= pdfDoc.numPages) return;
        pdfPageNum++;
        renderPdfCanvasPage(pdfPageNum);
      });
    }

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", function () {
        pdfScale += 0.2;
        renderPdfCanvasPage(pdfPageNum);
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", function () {
        if (pdfScale <= 0.6) return;
        pdfScale -= 0.2;
        renderPdfCanvasPage(pdfPageNum);
      });
    }

    // Botón de aplicación de hallazgos de auditoría a la rúbrica
    const btnAplicar = document.getElementById("btn-aplicar-hallazgos-rubrica");
    if (btnAplicar) {
      btnAplicar.addEventListener("click", function () {
        if (!auditResults.findings || auditResults.findings.length === 0) {
          alert("No se encontraron infracciones de auditoría para aplicar a la rúbrica.");
          return;
        }

        let aplicados = 0;
        auditResults.findings.forEach(function (f) {
          const currentComment = appState.comentariosPorSeccion[f.section] || "";
          if (!currentComment.includes(f.text)) {
            appState.comentariosPorSeccion[f.section] = currentComment ? currentComment + "\n• " + f.text : "• " + f.text;
            aplicados++;
          }
        });

        if (auditResults.iaStatus === "danger" || auditResults.bibStatus === "danger") {
          const inpPenal = document.getElementById("input-errores-formato");
          if (inpPenal) {
            let currentPenal = parseInt(inpPenal.value, 10) || 0;
            inpPenal.value = currentPenal + 1;
            appState.penalizacionFormato = currentPenal + 1;
          }
        }

        updateTotalScore();
        renderLivePreview();
        alert(`¡Éxito! Se integraron ${aplicados} observaciones de auditoría y se actualizaron las penalizaciones en la rúbrica.`);
      });
    }
  }

  function renderPdfCanvasPage(num) {
    if (!pdfDoc) return;
    pdfDoc.getPage(num).then(function (page) {
      const canvas = document.getElementById("pdf-render-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const viewport = page.getViewport({ scale: pdfScale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      page.render(renderContext);

      const pageIndicator = document.getElementById("pdf-page-num");
      if (pageIndicator) {
        pageIndicator.textContent = "Página " + num + " / " + pdfDoc.numPages;
      }
    });
  }

  // ==========================================
  // 5.B MOTOR DE AUDITORÍA AUTOMÁTICA DE PDF
  // ==========================================
  let auditResults = {
    iaStatus: "warning",
    iaDesc: "",
    bibStatus: "warning",
    bibDesc: "",
    structStatus: "warning",
    structDesc: "",
    findings: []
  };

  function analyzePdfText(text) {
    const card = document.getElementById("pdf-audit-card");
    if (!card) return;

    if (!text || text.trim().length === 0) {
      card.style.display = "none";
      return;
    }

    card.style.display = "block";
    const lower = text.toLowerCase();
    let findings = [];

    // 1. Auditoría de IA Generativa (Sección 5.2 del Programa)
    const hasIADeclaration = lower.includes("transparencia") || lower.includes("declaración de transparencia") || lower.includes("inteligencia artificial") || lower.includes("prompt");
    const statusIa = document.getElementById("audit-status-ia");
    const descIa = document.getElementById("audit-desc-ia");

    if (hasIADeclaration) {
      auditResults.iaStatus = "success";
      auditResults.iaDesc = "🟢 Declaración de Transparencia y Uso de IA detectada en el informe.";
      if (statusIa) {
        statusIa.className = "audit-badge badge-success";
        statusIa.textContent = "Declaración Detectada";
      }
    } else {
      auditResults.iaStatus = "danger";
      auditResults.iaDesc = "🔴 ATENCIÓN: No se detectó el anexo obligatorio de Declaración de Transparencia y Uso de IA (Sección 5.2 del programa).";
      if (statusIa) {
        statusIa.className = "audit-badge badge-danger";
        statusIa.textContent = "Sin Declaración (Sección 5.2)";
      }
      findings.push({ section: "sec_85", text: "Falta la Declaración Obligatoria de Transparencia y Uso de IA (Sección 5.2 del programa)." });
    }
    if (descIa) descIa.textContent = auditResults.iaDesc;

    // 2. Auditoría Bibliográfica (IEEE / ACS & DOI)
    const doiMatches = (text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g) || []);
    const hasDOI = doiMatches.length > 0;
    const apaPattern = /\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g;
    const apaMatches = (text.match(apaPattern) || []);

    const statusBib = document.getElementById("audit-status-bib");
    const descBib = document.getElementById("audit-desc-bib");

    if (hasDOI && apaMatches.length === 0) {
      auditResults.bibStatus = "success";
      auditResults.bibDesc = `🟢 Se detectaron ${doiMatches.length} referencias con DOI en formato normativo (IEEE/ACS).`;
      if (statusBib) {
        statusBib.className = "audit-badge badge-success";
        statusBib.textContent = `IEEE/ACS OK (${doiMatches.length} DOI)`;
      }
    } else if (apaMatches.length > 0) {
      auditResults.bibStatus = "danger";
      auditResults.bibDesc = `🔴 Infracción de Formato: Citas detectadas en estilo APA ${apaMatches.slice(0, 2).join(", ")}. El curso requiere estrictamente IEEE o ACS.`;
      if (statusBib) {
        statusBib.className = "audit-badge badge-danger";
        statusBib.textContent = "Formato APA Prohibido";
      }
      findings.push({ section: "sec_71", text: "Infracción normativa: Se utilizó el formato APA para citas en lugar del estilo IEEE/ACS obligatorio." });
    } else if (!hasDOI) {
      auditResults.bibStatus = "warning";
      auditResults.bibDesc = "⚠️ No se identificaron enlaces DOI (doi:10.xxxx) en las referencias. El DOI es obligatorio para todo artículo científico.";
      if (statusBib) {
        statusBib.className = "audit-badge badge-warning";
        statusBib.textContent = "Sin DOI Detectado";
      }
      findings.push({ section: "sec_71", text: "Falta el DOI (Digital Object Identifier) en las referencias de artículos científicos." });
    }
    if (descBib) descBib.textContent = auditResults.bibDesc;

    // 3. Auditoría de Estructura e IBL
    const hasNomenclatura = lower.includes("nomenclatura");
    const hasApendices = lower.includes("apéndice") || lower.includes("apendice");
    const statusStruct = document.getElementById("audit-status-struct");
    const descStruct = document.getElementById("audit-desc-struct");

    if (hasNomenclatura && hasApendices) {
      auditResults.structStatus = "success";
      auditResults.structDesc = "🟢 Se identificaron las secciones obligatorias de Nomenclatura y Apéndices de cálculo.";
      if (statusStruct) {
        statusStruct.className = "audit-badge badge-success";
        statusStruct.textContent = "Estructura Completa";
      }
    } else {
      auditResults.structStatus = "warning";
      let missing = [];
      if (!hasNomenclatura) missing.push("Nomenclatura");
      if (!hasApendices) missing.push("Apéndices");
      auditResults.structDesc = `⚠️ Secciones requeridas no detectadas expresamente: ${missing.join(", ")}.`;
      if (statusStruct) {
        statusStruct.className = "audit-badge badge-warning";
        statusStruct.textContent = `Incompleto (${missing.length})`;
      }
    }
    if (descStruct) descStruct.textContent = auditResults.structDesc;

    auditResults.findings = findings;
  }

  // ==========================================
  // 6. GENERADOR DE RÚBRICA DINÁMICA
  function getCategoriasConSubtotales(criterios, scores) {
    const categoriesMap = new Map();
    criterios.forEach(function (c) {
      if (c.puntos === 0) return;
      const catName = c.categoria || c.nombre;
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          nombre: catName,
          puntosMax: 0,
          puntosObt: 0,
          criterios: []
        });
      }
      const cat = categoriesMap.get(catName);
      const score = scores[c.id] !== undefined ? parseFloat(scores[c.id]) : c.puntos;
      cat.puntosMax += c.puntos;
      cat.puntosObt += score;
      cat.criterios.push(Object.assign({}, c, { scoreAsignado: score }));
    });

    const result = [];
    categoriesMap.forEach(function (cat) {
      cat.puntosMax = Math.round(cat.puntosMax * 10) / 10;
      cat.puntosObt = Math.round(cat.puntosObt * 10) / 10;
      result.push(cat);
    });
    return result;
  }

  // ==========================================
  // 6. RENDERIZADO Y CONTROL DE LA RÚBRICA
  // ==========================================
  function initRubric() {
    const mod = MODALIDADES[appState.modalidadId];
    if (!mod) return;

    const criterios = mod.getCriterios(appState.practicaId);
    const container = document.getElementById("rubric-criteria-container");
    const selectSeccion = document.getElementById("select-seccion-comentario");
    const panelTitulo = document.getElementById("rubrica-panel-titulo");

    if (panelTitulo) {
      panelTitulo.textContent = "Rúbrica: " + mod.nombre;
    }

    // Inicializar y podar Puntajes y Notas para que contengan exclusivamente los criterios de la modalidad y práctica activa
    const cleanScores = {};
    const cleanNotas = {};
    criterios.forEach(function (c) {
      if (c.puntos === 0) return;
      const nota = (appState.notas && appState.notas[c.id] !== undefined) ? appState.notas[c.id] : 100;
      cleanNotas[c.id] = nota;
      cleanScores[c.id] = Math.round(c.puntos * (nota / 100) * 10) / 10;
    });
    appState.scores = cleanScores;
    appState.notas = cleanNotas;

    if (container) {
      container.innerHTML = "";
      const categorias = getCategoriasConSubtotales(criterios, appState.scores);
      let globalIdx = 0;

      categorias.forEach(function (cat) {
        const catSlug = cat.nombre.replace(/[^a-zA-Z0-9]/g, '_');

        // Header de sección padre
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "rubrica-section-header";
        sectionHeader.style.margin = "18px 0 10px";
        sectionHeader.style.padding = "10px 14px";
        sectionHeader.style.background = "#f8fafc";
        sectionHeader.style.borderRadius = "var(--radius-sm)";
        sectionHeader.style.border = "1px solid var(--border-color)";
        sectionHeader.style.display = "flex";
        sectionHeader.style.justifyContent = "space-between";
        sectionHeader.style.alignItems = "center";
        sectionHeader.innerHTML = `
          <div class="rubrica-section-title" style="font-weight: 700; color: var(--ucr-blue); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
            <span>📁</span> ${cat.nombre}
          </div>
          <span id="badge-cat-${catSlug}" class="subtotal-badge" style="background: var(--ucr-blue-light); color: var(--ucr-blue); font-weight: 700; font-size: 0.82rem; padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(0, 56, 116, 0.15);">${cat.puntosObt.toFixed(1)} / ${cat.puntosMax.toFixed(1)} pts</span>
        `;
        container.appendChild(sectionHeader);

        cat.criterios.forEach(function (c) {
          const idx = globalIdx++;
          const nota = appState.notas[c.id] !== undefined ? appState.notas[c.id] : 100;
          const calculatedScore = Math.round(c.puntos * (nota / 100) * 10) / 10;

          const item = document.createElement("div");
          item.className = "rubric-item" + (idx === 0 ? " keyboard-focused" : "");
          item.id = "rubric-row-" + c.id;
          item.setAttribute("data-index", idx);

          item.innerHTML = `
            <div class="rubric-header">
              <span class="rubric-name">${c.nombre}</span>
              <span class="rubric-tag">${c.puntos} pts</span>
            </div>
            <div class="rubric-desc-box">${c.desc}</div>
            <div class="rubric-level-desc-box level-sobresaliente" id="rubric-level-desc-${c.id}">
              <span>📌 <strong>Sobresaliente (95 - 100):</strong> ${getCriterionDescriptorText(c.id, 1.0, c)}</span>
              <button type="button" class="btn btn-secondary btn-copy-level-desc" style="padding: 2px 8px; font-size: 0.73rem; white-space: nowrap;">📋 Copiar Justificación</button>
            </div>
            <div class="rubric-levels-bar">
              <button type="button" class="level-btn active-sobresaliente" data-criterio="${c.id}" data-nota="100">Sobresaliente (95 - 100)</button>
              <button type="button" class="level-btn" data-criterio="${c.id}" data-nota="90">Muy Bueno (85 - 94)</button>
              <button type="button" class="level-btn" data-criterio="${c.id}" data-nota="80">Bueno (75 - 84)</button>
              <button type="button" class="level-btn" data-criterio="${c.id}" data-nota="70">Suficiente (67.5 - 74)</button>
              <button type="button" class="level-btn" data-criterio="${c.id}" data-nota="50">Deficiente (&lt; 67.5)</button>
            </div>
            <div class="rubric-score-control" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <label style="font-size: 0.84rem; font-weight: 600;">Nota:</label>
              <input type="number" class="rubric-nota-input" id="input-nota-${c.id}" min="0" max="100" step="0.5" value="${nota}" style="width: 68px;">
              <span style="font-size: 0.82rem; color: var(--text-muted);">/ 100</span>
              <span style="font-size: 1rem; margin: 0 4px; color: var(--text-muted);">→</span>
              <label style="font-size: 0.84rem; font-weight: 600;">Puntaje:</label>
              <span class="rubric-score-display" id="display-score-${c.id}" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-primary); min-width: 32px;">${calculatedScore}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${c.puntos} pts</span>
            </div>
          `;

          container.appendChild(item);
        });
      });

      // Helper: determinar pct del nivel a partir de la nota
      function notaToPct(nota) {
        if (nota >= 95) return 1.0;
        if (nota >= 85) return 0.90;
        if (nota >= 75) return 0.80;
        if (nota >= 67.5) return 0.70;
        return 0.50;
      }

      // Helper: actualizar botones activos, descriptor y puntaje para un criterio
      function applyNotaToCriterion(critId, nota) {
        const critObj = criterios.find(function (x) { return x.id === critId; });
        if (!critObj) return;

        // Clamp nota
        if (nota < 0) nota = 0;
        if (nota > 100) nota = 100;

        // Guardar nota y calcular puntaje
        appState.notas[critId] = nota;
        const calculatedScore = Math.round(critObj.puntos * (nota / 100) * 10) / 10;
        appState.scores[critId] = calculatedScore;

        // Actualizar display de puntaje
        const display = document.getElementById("display-score-" + critId);
        if (display) display.textContent = calculatedScore;

        // Actualizar input de nota
        const notaInput = document.getElementById("input-nota-" + critId);
        if (notaInput && parseFloat(notaInput.value) !== nota) notaInput.value = nota;

        // Determinar nivel y actualizar botones
        const pct = notaToPct(nota);
        const row = document.getElementById("rubric-row-" + critId);
        if (row) {
          row.querySelectorAll(".level-btn").forEach(function (b) {
            b.className = "level-btn";
          });
          // Resaltar el botón correspondiente al rango de la nota
          var levelClass = "";
          if (nota >= 95) levelClass = "active-sobresaliente";
          else if (nota >= 85) levelClass = "active-muybueno";
          else if (nota >= 75) levelClass = "active-bueno";
          else if (nota >= 67.5) levelClass = "active-suficiente";
          else levelClass = "active-deficiente";

          var targetNota = nota >= 95 ? "100" : nota >= 85 ? "90" : nota >= 75 ? "80" : nota >= 67.5 ? "70" : "50";
          var matchBtn = row.querySelector('.level-btn[data-nota="' + targetNota + '"]');
          if (matchBtn) matchBtn.classList.add(levelClass);
        }

        // Actualizar descriptor
        updateCriterionLevelDescriptor(critId, pct, critObj);

        // Actualizar subtotales de badges de categoría padre
        const catsUpdated = getCategoriasConSubtotales(criterios, appState.scores);
        catsUpdated.forEach(function (cat) {
          const catSlug = cat.nombre.replace(/[^a-zA-Z0-9]/g, '_');
          const badge = document.getElementById("badge-cat-" + catSlug);
          if (badge) badge.textContent = `${cat.puntosObt.toFixed(1)} / ${cat.puntosMax.toFixed(1)} pts`;
        });

        // Actualizar selector de comentario
        if (selectSeccion) {
          selectSeccion.value = critId;
          loadCommentsForSection(critId);
          renderShortcutsForSection(critId);
        }

        updateTotalScore();
        renderLivePreview();
      }

      // Eventos de botones de nivel — ahora ponen una nota por defecto
      container.querySelectorAll(".level-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const critId = this.getAttribute("data-criterio");
          const nota = parseFloat(this.getAttribute("data-nota"));
          applyNotaToCriterion(critId, nota);
        });
      });

      // Eventos iniciales de copia de justificación
      criterios.forEach(function (c) {
        var pct = notaToPct(appState.notas[c.id] !== undefined ? appState.notas[c.id] : 100);
        updateCriterionLevelDescriptor(c.id, pct, c);
      });

      // Eventos de input de nota — auto-calcula puntaje al escribir
      container.querySelectorAll(".rubric-nota-input").forEach(function (inp) {
        inp.addEventListener("input", function () {
          const critId = this.id.replace("input-nota-", "");
          let nota = parseFloat(this.value);
          if (isNaN(nota)) nota = 0;
          applyNotaToCriterion(critId, nota);
        });
      });
    }

    // Poblar Selector de Secciones para Comentarios
    if (selectSeccion) {
      selectSeccion.innerHTML = "";
      criterios.forEach(function (c) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nombre;
        selectSeccion.appendChild(opt);
      });

      selectSeccion.addEventListener("change", function () {
        loadCommentsForSection(this.value);
        renderShortcutsForSection(this.value);
      });

      if (criterios.length > 0) {
        loadCommentsForSection(criterios[0].id);
        renderShortcutsForSection(criterios[0].id);
      }
    }

    // Reset button
    const btnReset = document.getElementById("btn-reset-rubrica");
    if (btnReset) {
      btnReset.addEventListener("click", function () {
        criterios.forEach(function (c) {
          appState.notas[c.id] = 100;
          appState.scores[c.id] = c.puntos;
          const notaInp = document.getElementById("input-nota-" + c.id);
          if (notaInp) notaInp.value = 100;
          const display = document.getElementById("display-score-" + c.id);
          if (display) display.textContent = c.puntos;
          const row = document.getElementById("rubric-row-" + c.id);
          if (row) {
            row.querySelectorAll(".level-btn").forEach(function (b) { b.className = "level-btn"; });
            const firstBtn = row.querySelector(".level-btn");
            if (firstBtn) firstBtn.classList.add("active-sobresaliente");
            updateCriterionLevelDescriptor(c.id, 1.0, c);
          }
        });
        const catsUpdated = getCategoriasConSubtotales(criterios, appState.scores);
        catsUpdated.forEach(function (cat) {
          const catSlug = cat.nombre.replace(/[^a-zA-Z0-9]/g, '_');
          const badge = document.getElementById("badge-cat-" + catSlug);
          if (badge) badge.textContent = `${cat.puntosObt.toFixed(1)} / ${cat.puntosMax.toFixed(1)} pts`;
        });
        const inpPenal = document.getElementById("input-errores-formato");
        if (inpPenal) inpPenal.value = 0;
        updateTotalScore();
        renderLivePreview();
      });
    }

    updateTotalScore();
  }

  function updateCriterionLevelDescriptor(critId, pct, critObj) {
    const box = document.getElementById("rubric-level-desc-" + critId);
    if (!box) return;

    const info = LEVEL_DESCRIPTORS[pct] || LEVEL_DESCRIPTORS[1.0];
    let levelClass = "level-sobresaliente";
    if (pct >= 0.95) levelClass = "level-sobresaliente";
    else if (pct >= 0.85) levelClass = "level-muybueno";
    else if (pct >= 0.75) levelClass = "level-bueno";
    else if (pct >= 0.65) levelClass = "level-suficiente";
    else levelClass = "level-deficiente";

    const customDesc = getCriterionDescriptorText(critId, pct, critObj);

    box.className = "rubric-level-desc-box " + levelClass;
    box.innerHTML = `
      <span>📌 <strong>${info.titulo}:</strong> ${customDesc}</span>
      <button type="button" class="btn btn-secondary btn-copy-level-desc" style="padding: 2px 7px; font-size: 0.73rem; white-space: nowrap;">📋 Copiar Justificación</button>
    `;

    const btnCopy = box.querySelector(".btn-copy-level-desc");
    if (btnCopy) {
      btnCopy.onclick = function (e) {
        e.stopPropagation();
        const textarea = document.getElementById("textarea-comentario-seccion");
        const selectSeccion = document.getElementById("select-seccion-comentario");
        if (textarea && selectSeccion) {
          selectSeccion.value = critId;
          loadCommentsForSection(critId);
          renderShortcutsForSection(critId);

          const justificacionText = `• [Calificación ${info.titulo}] ${customDesc}`;
          if (textarea.value.trim().length > 0 && !textarea.value.includes(justificacionText)) {
            textarea.value += "\n" + justificacionText;
          } else if (textarea.value.trim().length === 0) {
            textarea.value = justificacionText;
          }
          appState.comentariosPorSeccion[critId] = textarea.value;
          renderLivePreview();
        }
      };
    }
  }

  function initLiveCalculation() {
    const inpPenal = document.getElementById("input-errores-formato");
    if (inpPenal) {
      inpPenal.addEventListener("input", function () {
        let val = parseInt(this.value, 10) || 0;
        if (val < 0) val = 0;
        if (val > 15) val = 15;
        this.value = val;
        appState.penalizacionFormato = val;
        updateTotalScore();
        renderLivePreview();
      });
    }

    const textareaGeneral = document.getElementById("textarea-comentarios-generales");
    if (textareaGeneral) {
      textareaGeneral.addEventListener("input", function () {
        appState.comentarioGeneral = this.value;
        renderLivePreview();
      });
    }

    const textareaSeccion = document.getElementById("textarea-comentario-seccion");
    if (textareaSeccion) {
      textareaSeccion.addEventListener("input", function () {
        const selectSeccion = document.getElementById("select-seccion-comentario");
        if (selectSeccion) {
          appState.comentariosPorSeccion[selectSeccion.value] = this.value;
          renderLivePreview();
        }
      });
    }
  }

  function calculateTotalScore() {
    const mod = MODALIDADES[appState.modalidadId];
    if (!mod) return 0;
    const criterios = mod.getCriterios(appState.practicaId);
    let total = 0;
    criterios.forEach(function (c) {
      if (c.puntos === 0) return;
      const score = (appState.scores && appState.scores[c.id] !== undefined) ? parseFloat(appState.scores[c.id]) : c.puntos;
      total += score;
    });
    total -= (appState.penalizacionFormato || 0);
    if (total < 0) total = 0;
    return Math.round(total * 10) / 10;
  }

  function getDictamenInfo() {
    const total = calculateTotalScore();
    let dictamenAuto = "Sobresaliente";
    let dictamenClassAuto = "doc-box-aprobado";
    let dictamenBadgeAuto = "badge-sobresaliente";

    if (total < 67.5) {
      dictamenAuto = "Deficiente (< 67.5 pts)";
      dictamenClassAuto = "doc-box-rechazado";
      dictamenBadgeAuto = "badge-deficiente";
    } else if (total < 75) {
      dictamenAuto = "Suficiente";
      dictamenClassAuto = "doc-box-condicional";
      dictamenBadgeAuto = "badge-suficiente";
    } else if (total < 90) {
      dictamenAuto = "Bueno";
      dictamenClassAuto = "doc-box-bueno";
      dictamenBadgeAuto = "badge-bueno";
    }

    const autoCalculado = total < 67.5 ? "Deficiente" : (total < 75 ? "Suficiente" : (total < 90 ? "Bueno" : "Sobresaliente"));
    const modo = appState.dictamenModo || "auto";

    if (modo === "auto") {
      return {
        texto: dictamenAuto,
        textoCorto: autoCalculado,
        clase: dictamenClassAuto,
        claseBadge: dictamenBadgeAuto,
        esAuto: true,
        autoCalculado: autoCalculado
      };
    } else if (modo === "Sobresaliente") {
      return {
        texto: "Sobresaliente",
        textoCorto: "Sobresaliente",
        clase: "doc-box-aprobado",
        claseBadge: "badge-sobresaliente",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    } else if (modo === "Bueno") {
      return {
        texto: "Bueno",
        textoCorto: "Bueno",
        clase: "doc-box-bueno",
        claseBadge: "badge-bueno",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    } else if (modo === "Suficiente") {
      return {
        texto: "Suficiente",
        textoCorto: "Suficiente",
        clase: "doc-box-condicional",
        claseBadge: "badge-suficiente",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    } else if (modo === "Condicional") {
      return {
        texto: "Condicional",
        textoCorto: "Condicional",
        clase: "doc-box-condicional",
        claseBadge: "badge-condicional",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    } else if (modo === "Deficiente") {
      return {
        texto: "Deficiente (< 67.5 pts)",
        textoCorto: "Deficiente",
        clase: "doc-box-rechazado",
        claseBadge: "badge-deficiente",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    } else if (modo === "personalizado") {
      const custom = (appState.dictamenPersonalizado || "").trim() || autoCalculado;
      return {
        texto: custom,
        textoCorto: custom,
        clase: dictamenClassAuto,
        claseBadge: "badge-custom",
        esAuto: false,
        autoCalculado: autoCalculado
      };
    }

    return {
      texto: modo,
      textoCorto: modo,
      clase: dictamenClassAuto,
      claseBadge: dictamenBadgeAuto,
      esAuto: false,
      autoCalculado: autoCalculado
    };
  }

  function updateTotalScore() {
    const total = calculateTotalScore();

    const scoreTotalElem = document.getElementById("score-total");
    const dictamenBanner = document.getElementById("dictamen-banner");
    const dictamenEstado = document.getElementById("dictamen-estado");
    const dictamenMensaje = document.getElementById("dictamen-mensaje");

    if (scoreTotalElem) scoreTotalElem.textContent = total.toFixed(1);

    if (dictamenBanner && dictamenEstado && dictamenMensaje) {
      dictamenBanner.className = "dictamen-banner";

      if (total >= 90) {
        dictamenBanner.classList.add("dictamen-aprobado");
        dictamenEstado.textContent = "ESTADO: SOBRESALIENTE (APROBADO)";
        dictamenMensaje.textContent = "Cumplimiento pleno y riguroso de los requisitos técnicos y normativos.";
      } else if (total >= 75) {
        dictamenBanner.classList.add("dictamen-aprobado");
        dictamenEstado.textContent = "ESTADO: BUENO (APROBADO)";
        dictamenMensaje.textContent = "Cumplimiento satisfactorio con observaciones menores a considerar.";
      } else if (total >= 67.5) {
        dictamenBanner.classList.add("dictamen-condicional");
        dictamenEstado.textContent = "ESTADO: SUFICIENTE (APROBACIÓN EN LÍMITE)";
        dictamenMensaje.textContent = "Cumplimiento en límite de aprobación. Presenta fallas que requieren corrección.";
      } else {
        dictamenBanner.classList.add("dictamen-rechazado");
        dictamenEstado.textContent = "ESTADO: DEFICIENTE (< 67.5 PTS)";
        dictamenMensaje.textContent = "Incumplimiento grave de requisitos normativos o de fondo.";
      }
    }

    if (typeof updateDictamenPillsUI === "function") {
      updateDictamenPillsUI();
    }
  }

  // ==========================================
  // 7. GESTOR DE ATAJOS Y ATENCION POR TECLADO
  // ==========================================
  function loadCommentsForSection(secId) {
    const textarea = document.getElementById("textarea-comentario-seccion");
    if (!textarea) return;
    let comment = (appState.comentariosPorSeccion && appState.comentariosPorSeccion[secId] !== undefined)
      ? appState.comentariosPorSeccion[secId]
      : undefined;
    if ((comment === undefined || comment === "") && appState.comentariosPorSeccion) {
      const legacyMatch = secId.match(/^disc_.*_(\d+)$/);
      if (legacyMatch) {
        const legacyId = "disc_" + legacyMatch[1];
        if (appState.comentariosPorSeccion[legacyId]) {
          comment = appState.comentariosPorSeccion[legacyId];
        }
      }
    }
    textarea.value = comment || "";
  }

  function initShortcutsManager() {
    const btnGuardar = document.getElementById("btn-guardar-atajo");
    const textarea = document.getElementById("textarea-comentario-seccion");
    const selectSeccion = document.getElementById("select-seccion-comentario");

    if (btnGuardar && textarea && selectSeccion) {
      btnGuardar.addEventListener("click", function () {
        const text = textarea.value.trim();
        if (!text) {
          alert("Escriba un comentario antes de marcarlo como atajo.");
          return;
        }

        const secId = selectSeccion.value;
        const store = getShortcutsStore();
        if (!store[secId]) store[secId] = [];

        if (!store[secId].includes(text)) {
          store[secId].push(text);
          saveShortcutsStore(store);
          renderShortcutsForSection(secId);
        }
      });
    }
  }

  function renderShortcutsForSection(secId) {
    const container = document.getElementById("shortcuts-container");
    const textarea = document.getElementById("textarea-comentario-seccion");
    if (!container) return;

    const store = getShortcutsStore();
    const list = store[secId] || [];

    container.innerHTML = "";
    if (list.length === 0) {
      container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Sin atajos aún. Escriba un comentario y presione "Marcar como atajo especial" para guardarlo.</span>`;
      return;
    }

    list.forEach(function (scText, index) {
      const chip = document.createElement("div");
      chip.className = "shortcut-chip";
      const previewText = scText.length > 42 ? scText.substring(0, 40) + "..." : scText;

      chip.innerHTML = `
        <span title="${scText}">${previewText}</span>
        <span class="btn-remove-shortcut" title="Eliminar atajo">✕</span>
      `;

      chip.querySelector("span:first-child").addEventListener("click", function () {
        if (textarea) {
          if (textarea.value.trim().length > 0) {
            textarea.value += "\n" + scText;
          } else {
            textarea.value = scText;
          }
          appState.comentariosPorSeccion[secId] = textarea.value;
          renderLivePreview();
        }
      });

      chip.querySelector(".btn-remove-shortcut").addEventListener("click", function (e) {
        e.stopPropagation();
        store[secId].splice(index, 1);
        saveShortcutsStore(store);
        renderShortcutsForSection(secId);
      });

      container.appendChild(chip);
    });
  }

  function initKeyboardShortcuts() {
    activeRubricIndex = 0;

    document.addEventListener("keydown", function (e) {
      const activeElem = document.activeElement;
      if (activeElem && (activeElem.tagName === "INPUT" || activeElem.tagName === "TEXTAREA" || activeElem.tagName === "SELECT")) {
        return;
      }

      const rows = Array.from(document.querySelectorAll("#rubric-criteria-container .rubric-item"));
      if (rows.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeRubricIndex = Math.min(activeRubricIndex + 1, rows.length - 1);
        highlightRubricRow(rows, activeRubricIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeRubricIndex = Math.max(activeRubricIndex - 1, 0);
        highlightRubricRow(rows, activeRubricIndex);
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        const notaMap = { "1": "100", "2": "90", "3": "80", "4": "70", "5": "50" };
        const targetRow = rows[activeRubricIndex];
        if (targetRow) {
          const nota = notaMap[e.key];
          const btn = targetRow.querySelector(`.level-btn[data-nota="${nota}"]`);
          if (btn) btn.click();
        }
      }
    });
  }

  function highlightRubricRow(rows, index) {
    rows.forEach(function (r, idx) {
      if (idx === index) {
        r.classList.add("keyboard-focused");
        r.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        r.classList.remove("keyboard-focused");
      }
    });
  }

  // ==========================================
  // 8. GESTOR DE SESIONES DE SUBGRUPO & BORRADORES
  // ==========================================
  function initSessionManager() {
    const btnSave = document.getElementById("btn-guardar-sesion");
    const btnLoad = document.getElementById("btn-cargar-sesion");
    const btnExport = document.getElementById("btn-exportar-json");
    const inputImport = document.getElementById("input-importar-json");

    if (btnSave) {
      btnSave.addEventListener("click", function () {
        const key = "iq0432_session_" + (appState.subgrupo.replace(/\s+/g, "_"));
        localStorage.setItem(key, JSON.stringify(appState));
        alert(`Borrador guardado exitosamente para ${appState.subgrupo}.`);
      });
    }

    if (btnLoad) {
      btnLoad.addEventListener("click", function () {
        const key = "iq0432_session_" + (appState.subgrupo.replace(/\s+/g, "_"));
        const data = localStorage.getItem(key);
        if (data) {
          appState = JSON.parse(data);
          updateUIFromAppState();
          alert(`Borrador cargado para ${appState.subgrupo}.`);
        } else {
          alert(`No se encontró ningún borrador guardado para ${appState.subgrupo}.`);
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener("click", function () {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `Evaluacion_${appState.practicaId}_${appState.subgrupo.replace(/\s+/g, "_")}.json`;
        a.click();
      });
    }

    if (inputImport) {
      inputImport.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            appState = JSON.parse(evt.target.result);
            updateUIFromAppState();
            alert("Sesión importada exitosamente desde archivo JSON.");
          } catch (err) {
            alert("Error al parsear el archivo JSON: " + err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function updateUIFromAppState() {
    const selectPractica = document.getElementById("select-practica");
    const selectModalidad = document.getElementById("select-modalidad");
    const inputSubgrupo = document.getElementById("input-subgrupo");
    const inputTema = document.getElementById("input-tema-proyecto");
    const inputEvaluador = document.getElementById("input-evaluador");
    const inputFecha = document.getElementById("input-fecha");
    const inputIntegrantes = document.getElementById("input-integrantes");
    const inputCorreos = document.getElementById("input-correos");
    const inputPenal = document.getElementById("input-errores-formato");
    const textareaGeneral = document.getElementById("textarea-comentarios-generales");

    if (selectPractica) selectPractica.value = appState.practicaId;
    updateModalidadesDisponibles();
    if (selectModalidad) selectModalidad.value = appState.modalidadId;

    if (inputSubgrupo) inputSubgrupo.value = appState.subgrupo;
    if (inputTema) inputTema.value = appState.temaProyecto;
    if (inputEvaluador) inputEvaluador.value = appState.evaluador;
    if (inputFecha) inputFecha.value = appState.fecha;
    if (inputIntegrantes) inputIntegrantes.value = appState.integrantes;
    if (inputCorreos) inputCorreos.value = appState.correos;
    if (inputPenal) inputPenal.value = appState.penalizacionFormato;
    if (textareaGeneral) textareaGeneral.value = appState.comentarioGeneral || "";

    if (appState.dictamenModo === undefined) appState.dictamenModo = "auto";
    if (appState.dictamenPersonalizado === undefined) appState.dictamenPersonalizado = "";
    updateDictamenPillsUI();

    initRubric();
    updateTotalScore();
    renderLivePreview();
  }

  // ==========================================
  // 8.5 CONTROL DEL DICTAMEN DEL ASISTENTE EVALUADOR
  // ==========================================
  function initDictamenDocenteControls() {
    const pillButtons = document.querySelectorAll(".dictamen-pill");
    const customWrap = document.getElementById("dictamen-personalizado-wrap");
    const customInput = document.getElementById("input-dictamen-personalizado");
    const btnLimpiar = document.getElementById("btn-limpiar-comentarios-generales");
    const textareaGeneral = document.getElementById("textarea-comentarios-generales");

    pillButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const val = this.dataset.dictamen;
        appState.dictamenModo = val;

        if (val === "personalizado") {
          if (customWrap) customWrap.style.display = "block";
          if (customInput) {
            customInput.value = appState.dictamenPersonalizado || "";
            customInput.focus();
          }
        } else {
          if (customWrap) customWrap.style.display = "none";
        }

        updateDictamenPillsUI();
        renderLivePreview();
      });
    });

    if (customInput) {
      customInput.addEventListener("input", function () {
        appState.dictamenPersonalizado = this.value;
        updateDictamenPillsUI();
        renderLivePreview();
      });
    }

    if (btnLimpiar && textareaGeneral) {
      btnLimpiar.addEventListener("click", function () {
        if (confirm("¿Desea limpiar las observaciones generales del evaluador?")) {
          appState.comentarioGeneral = "";
          textareaGeneral.value = "";
          renderLivePreview();
        }
      });
    }

    updateDictamenPillsUI();
  }

  function updateDictamenPillsUI() {
    const modo = appState.dictamenModo || "auto";
    const info = getDictamenInfo();
    const pillButtons = document.querySelectorAll(".dictamen-pill");
    const statusBadge = document.getElementById("dictamen-status-badge");
    const customWrap = document.getElementById("dictamen-personalizado-wrap");
    const customInput = document.getElementById("input-dictamen-personalizado");

    pillButtons.forEach(function (b) {
      if (b.dataset.dictamen === modo) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });

    if (customWrap) {
      customWrap.style.display = (modo === "personalizado") ? "block" : "none";
    }
    if (customInput && modo === "personalizado") {
      customInput.value = appState.dictamenPersonalizado || "";
    }

    if (statusBadge) {
      statusBadge.className = "dictamen-status-pill";
      if (modo === "auto") {
        statusBadge.classList.add("pill-auto");
        statusBadge.textContent = `Auto: ${info.autoCalculado}`;
      } else if (modo === "Sobresaliente") {
        statusBadge.classList.add("pill-sobresaliente");
        statusBadge.textContent = "Manual: Sobresaliente";
      } else if (modo === "Bueno") {
        statusBadge.classList.add("pill-bueno");
        statusBadge.textContent = "Manual: Bueno";
      } else if (modo === "Suficiente") {
        statusBadge.classList.add("pill-suficiente");
        statusBadge.textContent = "Manual: Suficiente";
      } else if (modo === "Condicional") {
        statusBadge.classList.add("pill-condicional");
        statusBadge.textContent = "Manual: Condicional";
      } else if (modo === "Deficiente") {
        statusBadge.classList.add("pill-deficiente");
        statusBadge.textContent = "Manual: Deficiente";
      } else if (modo === "personalizado") {
        statusBadge.classList.add("pill-custom");
        statusBadge.textContent = `Manual: ${info.texto}`;
      }
    }
  }

  // Helper para generar síntesis de observaciones de criterios
  function generateSynthesizedComment() {
    const mod = MODALIDADES[appState.modalidadId];
    if (!mod) return "";
    const criterios = mod.getCriterios(appState.practicaId);

    let observaciones = [];
    criterios.forEach(function (c) {
      if (c.puntos === 0) return;
      const score = appState.scores[c.id] !== undefined ? appState.scores[c.id] : c.puntos;
      const comment = appState.comentariosPorSeccion[c.id];

      if (score < c.puntos || comment) {
        let det = `• ${c.nombre} (${score}/${c.puntos} pts)`;
        if (comment) det += `: ${comment}`;
        observaciones.push(det);
      }
    });

    let texto = `Se felicita al subgrupo por el trabajo realizado en la evaluación de ${appState.temaProyecto}.\n\n`;
    if (observaciones.length === 0) {
      texto += "El entregable cumple con rigor y plenitud la totalidad de los criterios evaluados, manteniendo una calidad técnica y de forma sobresaliente.";
    } else {
      texto += "Principales observaciones y puntos de mejora a atender:\n" + observaciones.join("\n");
    }

    if (appState.penalizacionFormato > 0) {
      texto += `\n\nSe aplicó un descuento de -${appState.penalizacionFormato} pts por reincidencia de errores de formato.`;
    }

    return texto;
  }

  // ==========================================
  // 9. SINTETIZADOR DOCENTE Y NOTIFICACIÓN DE CORREO
  // ==========================================
  function initSynthesizer() {
    const btnSintesis = document.getElementById("btn-sintetizar-observaciones");
    const textareaGeneral = document.getElementById("textarea-comentarios-generales");
    if (!btnSintesis || !textareaGeneral) return;

    btnSintesis.addEventListener("click", function () {
      const texto = generateSynthesizedComment();
      textareaGeneral.value = texto;
      appState.comentarioGeneral = texto;
      renderLivePreview();
      alert("Síntesis del evaluador generada automáticamente.");
    });
  }

  function initEmailModal() {
    const btnGenerar = document.getElementById("btn-generar-correo");
    const modal = document.getElementById("modal-email");
    const btnCerrar = document.getElementById("btn-cerrar-modal-email");
    const inputDestinatarios = document.getElementById("email-modal-destinatarios");
    const inputAsunto = document.getElementById("email-modal-asunto");
    const textareaCuerpo = document.getElementById("email-modal-cuerpo");
    const btnCopiar = document.getElementById("btn-copiar-cuerpo-email");
    const btnMailto = document.getElementById("btn-abrir-mailto");

    if (!btnGenerar || !modal) return;

    btnGenerar.addEventListener("click", function () {
      const practicaObj = PRACTICAS.find(function (p) { return p.id === appState.practicaId; }) || PRACTICAS[0];
      const total = calculateTotalScore();

      const asunto = `[IQ-0432] Calificación y Retroalimentación — ${practicaObj.nombre} — ${appState.subgrupo}`;
      const destinatarios = appState.correos || "estudiante1@ucr.ac.cr";

      let cuerpo = `Estimados integrantes del ${appState.subgrupo},\n\n`;
      cuerpo += `Se les comparte la calificación final y retroalimentación oficial para:\n`;
      cuerpo += `📌 Práctica / Proyecto: ${practicaObj.nombre}\n`;
      cuerpo += `📌 Título del Entregable: ${appState.temaProyecto}\n`;
      cuerpo += `📊 Calificación Final: ${total.toFixed(1)} / 100 pts\n\n`;
      cuerpo += `--- DICTAMEN DEL ASISTENTE Y RETROALIMENTACIÓN ---\n`;
      cuerpo += `${appState.comentarioGeneral || "Sin comentarios adicionales."}\n\n`;
      cuerpo += `Por favor atender cada uno de los puntos señalados para sus próximos entregables.\n\n`;
      cuerpo += `Saludos cordiales,\n${appState.evaluador}\nEscuela de Ingeniería Química — UCR`;

      if (inputDestinatarios) inputDestinatarios.value = destinatarios;
      if (inputAsunto) inputAsunto.value = asunto;
      if (textareaCuerpo) textareaCuerpo.value = cuerpo;

      modal.style.display = "flex";
    });

    if (btnCerrar) {
      btnCerrar.addEventListener("click", function () {
        modal.style.display = "none";
      });
    }

    if (btnCopiar) {
      btnCopiar.addEventListener("click", function () {
        navigator.clipboard.writeText(textareaCuerpo.value).then(function () {
          alert("¡Cuerpo del correo copiado al portapapeles!");
        });
      });
    }

    if (btnMailto) {
      btnMailto.addEventListener("click", function () {
        const mailtoUrl = `mailto:${encodeURIComponent(inputDestinatarios.value)}?subject=${encodeURIComponent(inputAsunto.value)}&body=${encodeURIComponent(textareaCuerpo.value)}`;
        window.location.href = mailtoUrl;
      });
    }
  }

  // Helper para escapar HTML en cadenas insertadas en la interfaz
  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper para escapar caracteres especiales de LaTeX
  function escapeLatex(str) {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/&/g, "\\&")
      .replace(/#/g, "\\#")
      .replace(/\$/g, "\\$")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  }

  // ==========================================
  // 10. GENERADOR DE LATEX (.tex) Y VISTA PREVIA A4
  // ==========================================
  function generateLatexCode() {
    const practicaObj = PRACTICAS.find(function (p) { return p.id === appState.practicaId; }) || PRACTICAS[0];
    const mod = MODALIDADES[appState.modalidadId] || MODALIDADES.ARTICULO;
    const criterios = mod.getCriterios(appState.practicaId);

    const total = calculateTotalScore();
    const dictamenInfo = getDictamenInfo();

    let tableRows = "";
    const categorias = getCategoriasConSubtotales(criterios, appState.scores);

    categorias.forEach(function (cat) {
      const catNombreEsc = escapeLatex(cat.nombre);

      if (cat.criterios.length === 1) {
        const c = cat.criterios[0];
        const score = c.scoreAsignado;
        const commentRaw = appState.comentariosPorSeccion[c.id] || "Sin observaciones.";
        const comment = escapeLatex(commentRaw);
        const nombreEscapado = escapeLatex(c.nombre);
        tableRows += `\\rowcolor{headergray}\n`;
        tableRows += `\\textbf{${nombreEscapado}} & \\textbf{${c.puntos.toFixed(1)}} & \\textbf{${score.toFixed(1)}} & ${comment} \\\\ \\hline\n`;
      } else {
        // Categoría Padre con Subtotal
        tableRows += `\\rowcolor{headergray}\n`;
        tableRows += `\\textbf{${catNombreEsc}} & \\textbf{${cat.puntosMax.toFixed(1)}} & \\textbf{${cat.puntosObt.toFixed(1)}} & \\textbf{Subtotal ${catNombreEsc}} \\\\ \\hline\n`;

        // Subcriterios Indentados con \\quad
        cat.criterios.forEach(function (c) {
          const score = c.scoreAsignado;
          const commentRaw = appState.comentariosPorSeccion[c.id] || "Sin observaciones.";
          const comment = escapeLatex(commentRaw);
          const nombreEscapado = escapeLatex(c.nombre);
          tableRows += `\\quad ${nombreEscapado} & ${c.puntos.toFixed(1)} & ${score.toFixed(1)} & ${comment} \\\\ \\hline\n`;
        });
      }
    });

    if (appState.penalizacionFormato > 0) {
      tableRows += `\\textbf{\\textcolor{red}{Penalización Formato Reincidente}} & -- & -${appState.penalizacionFormato} & Descuento por faltas reiteradas de formato. \\\\ \\hline\n`;
    }

    const subgrupoEsc = escapeLatex(appState.subgrupo);
    const temaEsc = escapeLatex(appState.temaProyecto);
    const evaluadorEsc = escapeLatex(appState.evaluador);
    const integrantesEsc = escapeLatex(appState.integrantes) || "No especificado";
    const comentarioGeneralEsc = escapeLatex(appState.comentarioGeneral) || "Se felicita al subgrupo por el trabajo realizado en esta evaluación. Favor atender las observaciones señaladas en cada criterio para futuros entregables.";

    const tex = `% ==========================================================================
% Rúbrica Oficial de Evaluación — IQ-0432 (UCR)
% Escuela de Ingeniería Química · Universidad de Costa Rica
% ==========================================================================
\\documentclass[11pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2cm]{geometry}
\\usepackage{xcolor}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{tcolorbox}
\\usepackage{amsmath,amssymb}

% Definición de Colores UCR Oficiales
\\definecolor{ucrblue}{RGB}{0,56,116}
\\definecolor{ucrbluedark}{RGB}{0,34,68}
\\definecolor{ucrgreen}{RGB}{46,125,50}
\\definecolor{ucrgold}{RGB}{198,134,12}
\\definecolor{ucrred}{RGB}{183,28,28}
\\definecolor{headergray}{RGB}{245,245,245}

\\pagestyle{empty}

\\begin{document}

% --------------------------------------------------------------------------
% Encabezado Institucional Centrado (Sin Desfase de Cajas)
% --------------------------------------------------------------------------
\\begingroup
\\setlength{\\fboxsep}{0pt}%
\\setlength{\\parindent}{0pt}%
\\colorbox{ucrblue}{%
  \\parbox{\\linewidth}{%
    \\vspace{7pt}%
    \\centering \\bfseries \\color{white} \\footnotesize
    UNIVERSIDAD DE COSTA RICA --- FACULTAD DE INGENIERÍA --- ESCUELA DE INGENIERÍA QUÍMICA%
    \\vspace{7pt}%
  }%
}%
\\par
\\colorbox{headergray}{%
  \\parbox{\\linewidth}{%
    \\vspace{14pt}%
    \\centering
    {\\Large \\bfseries \\color{ucrblue} HOJA DE EVALUACIÓN Y RÚBRICA OFICIAL}\\\\[4pt]
    {\\large \\bfseries ${escapeLatex(mod.nombre)}}\\\\[6pt]
    {\\color{gray!80!black}\\rule{0.60\\linewidth}{1pt}}\\\\[6pt]
    {\\small \\bfseries \\color{black!80} ${escapeLatex(practicaObj.nombre)} (${practicaObj.codigo})}\\\\[3pt]
    {\\footnotesize \\color{black!60} Laboratorio de Operaciones de Transferencia de Fluidos y Calor}%
    \\vspace{14pt}%
  }%
}%
\\par
\\colorbox{ucrblue}{%
  \\parbox{\\linewidth}{%
    \\vspace{2pt}%
  }%
}%
\\endgroup

\\vspace{15pt}

% --------------------------------------------------------------------------
% Metadatos de la Evaluación
% --------------------------------------------------------------------------
\\noindent
\\begin{tabularx}{\\linewidth}{@{}l X l r@{}}
\\textbf{Subgrupo / Equipo:} & ${subgrupoEsc} & \\textbf{Fecha:} & ${escapeLatex(appState.fecha)} \\\\
\\textbf{Tema / Título:} & \\multicolumn{3}{X}{${temaEsc}} \\\\
\\textbf{Asistente Evaluador:} & ${evaluadorEsc} & \\textbf{Calificación Final:} & \\textbf{\\textcolor{ucrblue}{\\Large ${total.toFixed(1)} / 100}} \\\\
\\textbf{Integrantes:} & \\multicolumn{3}{X}{${integrantesEsc}} \\\\
\\end{tabularx}

\\vspace{12pt}

% --------------------------------------------------------------------------
% Matriz de Calificación por Criterios
% --------------------------------------------------------------------------
{\\color{ucrblue}\\section*{Desglose de Calificación y Rúbrica}}

\\noindent
\\small
\\begin{tabularx}{\\linewidth}{|X|c|c|X|}
\\hline
\\rowcolor{headergray}
\\textbf{Criterio de Evaluación} & \\textbf{Pts Máx} & \\textbf{Nota} & \\textbf{Observaciones del Asistente Evaluador} \\\\ \\hline
${tableRows}
\\hline
\\multicolumn{2}{|r|}{\\textbf{CALIFICACIÓN FINAL TOTAL:}} & \\textbf{${total.toFixed(1)}} & \\textbf{Dictamen: ${escapeLatex(dictamenInfo.textoCorto)}} \\\\ \\hline
\\end{tabularx}

\\vspace{14pt}

% --------------------------------------------------------------------------
% Comentarios y Conclusiones del Evaluador
% --------------------------------------------------------------------------
\\begin{tcolorbox}[colback=headergray, colframe=ucrblue, title=\\textbf{Dictamen del Asistente Evaluador: ${escapeLatex(dictamenInfo.textoCorto)} -- Observaciones Generales}]
${comentarioGeneralEsc}
\\end{tcolorbox}

\\end{document}
`;
    return tex;
  }

  function renderLivePreview() {
    const practicaObj = PRACTICAS.find(function (p) { return p.id === appState.practicaId; }) || PRACTICAS[0];
    const mod = MODALIDADES[appState.modalidadId] || MODALIDADES.ARTICULO;
    const criterios = mod.getCriterios(appState.practicaId);

    const total = calculateTotalScore();
    const dictamenInfo = getDictamenInfo();
    const defaultComentario = "Se felicita al subgrupo por el trabajo realizado en esta evaluación. Favor atender las observaciones señaladas en cada criterio para futuros entregables.";
    const comentarioActual = (appState.comentarioGeneral !== undefined && appState.comentarioGeneral !== "") ? appState.comentarioGeneral : defaultComentario;

    let tableHtml = "";
    const categorias = getCategoriasConSubtotales(criterios, appState.scores);

    categorias.forEach(function (cat) {
      if (cat.criterios.length === 1) {
        const c = cat.criterios[0];
        const score = c.scoreAsignado;
        const comment = appState.comentariosPorSeccion[c.id] || "Sin observaciones.";
        tableHtml += `
          <tr style="background-color: #f1f5f9; border-top: 1.5px solid #cbd5e1;">
            <td><strong>${c.nombre}</strong></td>
            <td style="text-align: center; font-weight: 700;">${c.puntos.toFixed(1)}</td>
            <td style="text-align: center; font-weight: 800; color: var(--ucr-blue);">${score.toFixed(1)}</td>
            <td style="font-size: 0.82rem; color: #444;">${comment}</td>
          </tr>
        `;
      } else {
        // Categoría Padre con Subtotal
        tableHtml += `
          <tr style="font-weight: 700; background-color: #f1f5f9; border-top: 1.5px solid #cbd5e1;">
            <td>${cat.nombre}</td>
            <td style="text-align: center;">${cat.puntosMax.toFixed(1)}</td>
            <td style="text-align: center; color: var(--ucr-blue); font-weight: 800;">${cat.puntosObt.toFixed(1)}</td>
            <td style="font-weight: 600; color: #334155;">Subtotal ${cat.nombre}</td>
          </tr>
        `;

        // Subcriterios Indentados
        cat.criterios.forEach(function (c) {
          const score = c.scoreAsignado;
          const comment = appState.comentariosPorSeccion[c.id] || "Sin observaciones.";
          tableHtml += `
            <tr>
              <td style="padding-left: 22px;">${c.nombre}</td>
              <td style="text-align: center;">${c.puntos.toFixed(1)}</td>
              <td style="text-align: center; font-weight: 600; color: var(--ucr-blue);">${score.toFixed(1)}</td>
              <td style="font-size: 0.82rem; color: #444;">${comment}</td>
            </tr>
          `;
        });
      }
    });

    if (appState.penalizacionFormato > 0) {
      tableHtml += `
        <tr style="background-color: var(--ucr-red-light); color: var(--ucr-red);">
          <td><strong>Penalización Formato Reincidente</strong></td>
          <td style="text-align: center;">--</td>
          <td style="text-align: center; font-weight: bold;">-${appState.penalizacionFormato}</td>
          <td style="font-size: 0.82rem;">Descuento por faltas reiteradas de formato.</td>
        </tr>
      `;
    }

    const sheet = document.getElementById("document-preview-sheet");
    if (sheet) {
      sheet.innerHTML = `
        <div class="doc-header-top">
          UNIVERSIDAD DE COSTA RICA — FACULTAD DE INGENIERÍA — ESCUELA DE INGENIERÍA QUÍMICA
        </div>
        <div class="doc-header-body">
          <div class="doc-header-title">HOJA DE EVALUACIÓN Y RÚBRICA OFICIAL</div>
          <div class="doc-header-subtitle">${mod.nombre}</div>
          <div class="doc-header-divider"></div>
          <div class="doc-header-course">${practicaObj.nombre} (${practicaObj.codigo})</div>
          <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">Laboratorio de Operaciones de Transferencia de Fluidos y Calor</div>
        </div>

        <div style="margin-top: 20px; font-size: 0.88rem; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr>
              <td style="width: 25%;"><strong>Subgrupo / Equipo:</strong></td>
              <td style="width: 35%;">${appState.subgrupo || "Subgrupo 01"}</td>
              <td style="width: 15%;"><strong>Fecha:</strong></td>
              <td style="width: 25%;">${appState.fecha}</td>
            </tr>
            <tr>
              <td><strong>Título / Proyecto:</strong></td>
              <td colspan="3">${appState.temaProyecto || "Sin título"}</td>
            </tr>
            <tr>
              <td><strong>Asistente Evaluador:</strong></td>
              <td>${appState.evaluador || "Asistente del Curso"}</td>
              <td><strong>Calificación:</strong></td>
              <td><span style="font-size: 1.25rem; font-weight: 800; color: var(--ucr-blue);">${total.toFixed(1)} / 100</span></td>
            </tr>
            <tr>
              <td><strong>Integrantes:</strong></td>
              <td colspan="3">${appState.integrantes || "No especificado"}</td>
            </tr>
          </table>
        </div>

        <div class="doc-section-title">Desglose de Calificación por Criterios</div>

        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 42%;">Criterio de Evaluación</th>
              <th style="width: 12%; text-align: center;">Pts Máx</th>
              <th style="width: 12%; text-align: center;">Nota</th>
              <th style="width: 34%;">Observaciones del Asistente Evaluador</th>
            </tr>
          </thead>
          <tbody>
            ${tableHtml}
            <tr style="background-color: #f5f5f5; font-weight: bold; border-top: 2px solid #003874;">
              <td colspan="2" style="text-align: right;">CALIFICACIÓN FINAL TOTAL:</td>
              <td style="text-align: center; color: var(--ucr-blue); font-size: 1.05rem;">${total.toFixed(1)}</td>
              <td>Dictamen: <span class="doc-dictamen-badge ${dictamenInfo.claseBadge}">${dictamenInfo.texto}</span></td>
            </tr>
          </tbody>
        </table>

        <div class="doc-box ${dictamenInfo.clase}">
          <div class="doc-box-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>📝 Dictamen del Asistente Evaluador y Observaciones Generales:</span>
              <span class="doc-dictamen-badge ${dictamenInfo.claseBadge}">${dictamenInfo.texto}</span>
            </div>
            <div class="preview-dictamen-actions no-print" style="display: flex; align-items: center; gap: 6px;">
              <label for="preview-select-dictamen" style="margin: 0; color: #475569; font-weight: 600; font-size: 0.78rem;">Dictamen:</label>
              <select id="preview-select-dictamen" class="preview-mini-select" title="Cambiar dictamen directamente desde la vista previa">
                <option value="auto"${appState.dictamenModo === 'auto' ? ' selected' : ''}>🔄 Auto (${dictamenInfo.autoCalculado})</option>
                <option value="Sobresaliente"${appState.dictamenModo === 'Sobresaliente' ? ' selected' : ''}>⭐ Sobresaliente</option>
                <option value="Bueno"${appState.dictamenModo === 'Bueno' ? ' selected' : ''}>🟢 Bueno</option>
                <option value="Suficiente"${appState.dictamenModo === 'Suficiente' ? ' selected' : ''}>🟡 Suficiente</option>
                <option value="Condicional"${appState.dictamenModo === 'Condicional' ? ' selected' : ''}>🟠 Condicional</option>
                <option value="Deficiente"${appState.dictamenModo === 'Deficiente' ? ' selected' : ''}>🔴 Deficiente</option>
                <option value="personalizado"${appState.dictamenModo === 'personalizado' ? ' selected' : ''}>✏️ Personalizado...</option>
              </select>
              <button type="button" id="preview-btn-sintesis" class="btn btn-warning" style="font-size: 0.74rem; padding: 2px 7px;" title="Generar síntesis basada en la rúbrica">
                <span>🪄</span> Síntesis
              </button>
            </div>
          </div>
          <div class="doc-box-body" style="margin-top: 6px;">
            <textarea id="preview-textarea-comentarios-generales" class="doc-preview-textarea screen-only" rows="3" placeholder="Escriba aquí el dictamen y las observaciones generales para el subgrupo...">${escapeHtml(comentarioActual)}</textarea>
            <div class="doc-preview-text print-only">${escapeHtml(comentarioActual).replace(/\n/g, '<br>')}</div>
            <div class="preview-textarea-footer no-print" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.74rem; color: #64748b;">
              <span>✏️ <em>Puede redactar y editar las observaciones directamente en esta caja.</em></span>
              <span id="preview-chars-counter">${comentarioActual.length} caracteres</span>
            </div>
          </div>
        </div>
      `;

      // Vincular eventos a la caja editable directamente en la vista previa
      const previewTextarea = document.getElementById("preview-textarea-comentarios-generales");
      if (previewTextarea) {
        previewTextarea.style.height = "auto";
        previewTextarea.style.height = (previewTextarea.scrollHeight + 4) + "px";

        previewTextarea.addEventListener("input", function () {
          appState.comentarioGeneral = this.value;
          this.style.height = "auto";
          this.style.height = (this.scrollHeight + 4) + "px";

          const tGen = document.getElementById("textarea-comentarios-generales");
          if (tGen && tGen.value !== this.value) {
            tGen.value = this.value;
          }

          const counter = document.getElementById("preview-chars-counter");
          if (counter) counter.textContent = `${this.value.length} caracteres`;

          const printEl = sheet.querySelector(".doc-preview-text.print-only");
          if (printEl) printEl.innerHTML = escapeHtml(this.value).replace(/\n/g, "<br>");

          const codeView = document.getElementById("codigo-tex-preview");
          if (codeView) codeView.textContent = generateLatexCode();
        });
      }

      const previewSelect = document.getElementById("preview-select-dictamen");
      if (previewSelect) {
        previewSelect.addEventListener("change", function () {
          if (this.value === "personalizado") {
            const actual = appState.dictamenPersonalizado || "";
            const nuevo = prompt("Ingrese el dictamen personalizado:", actual);
            if (nuevo !== null && nuevo.trim().length > 0) {
              appState.dictamenPersonalizado = nuevo.trim();
              appState.dictamenModo = "personalizado";
            } else if (actual) {
              appState.dictamenModo = "personalizado";
            } else {
              appState.dictamenModo = "auto";
              this.value = "auto";
            }
          } else {
            appState.dictamenModo = this.value;
          }
          updateDictamenPillsUI();
          renderLivePreview();
        });
      }

      const previewBtnSintesis = document.getElementById("preview-btn-sintesis");
      if (previewBtnSintesis) {
        previewBtnSintesis.addEventListener("click", function () {
          const texto = generateSynthesizedComment();
          appState.comentarioGeneral = texto;
          const tGen = document.getElementById("textarea-comentarios-generales");
          if (tGen) tGen.value = texto;
          renderLivePreview();
          alert("Síntesis del evaluador generada e insertada.");
        });
      }
    }

    const codeView = document.getElementById("codigo-tex-preview");
    if (codeView) {
      codeView.textContent = generateLatexCode();
    }
  }

  // ==========================================
  // 11. EXPORTACIÓN Y BOTONES
  // ==========================================
  function initExportButtons() {
    const btnPreview = document.getElementById("btn-mode-preview");
    const btnCode = document.getElementById("btn-mode-code");
    const containerPreview = document.getElementById("container-vista-previa");
    const containerCode = document.getElementById("container-vista-codigo");

    if (btnPreview && btnCode && containerPreview && containerCode) {
      btnPreview.addEventListener("click", function () {
        btnPreview.classList.add("active");
        btnCode.classList.remove("active");
        containerPreview.style.display = "block";
        containerCode.style.display = "none";
      });

      btnCode.addEventListener("click", function () {
        btnCode.classList.add("active");
        btnPreview.classList.remove("active");
        containerPreview.style.display = "none";
        containerCode.style.display = "block";
      });
    }

    const btnImprimir = document.getElementById("btn-imprimir-hoja");
    if (btnImprimir) {
      btnImprimir.addEventListener("click", function () {
        if (btnPreview) btnPreview.click();
        renderLivePreview();
        window.print();
      });
    }

    const btnCopiar = document.getElementById("btn-copiar-tex");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", function () {
        const tex = generateLatexCode();
        navigator.clipboard.writeText(tex).then(function () {
          alert("¡Código LaTeX (.tex) copiado exitosamente al portapapeles!");
        }).catch(function (err) {
          console.error("Error al copiar portapapeles", err);
        });
      });
    }

    const btnDescargar = document.getElementById("btn-descargar-tex");
    if (btnDescargar) {
      btnDescargar.addEventListener("click", function () {
        const tex = generateLatexCode();
        const blob = new Blob([tex], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const filename = "Rubrica_" + (appState.practicaId) + "_" + (appState.subgrupo.replace(/\s+/g, "_")) + ".tex";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }

})();
