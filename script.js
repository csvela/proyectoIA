
const instructionsInput = document.getElementById("instructions");
const analyzeButton = document.getElementById("analyzeButton");
const exampleButton = document.getElementById("exampleButton");
const clearButton = document.getElementById("clearButton");

const emptyState = document.getElementById("emptyState");
const results = document.getElementById("results");
const objectiveOutput = document.getElementById("objective");
const requirementsOutput = document.getElementById("requirements");
const taskList = document.getElementById("taskList");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const warningOutput = document.getElementById("warning");

// Instrucción de ejemplo para probar el prototipo.
const exampleInstructions = `
Elaborar un reporte de investigación sobre una problemática tecnológica.

El documento debe incluir portada, introducción, planteamiento
del problema, objetivo general, tres objetivos específicos,
metodología, conclusiones y mínimo 5 referencias en formato APA.

Entregar el viernes 30 de octubre en PDF.
Revisar ortografía y comprobar que todas las secciones estén completas.
`;

// Cargar el ejemplo.
exampleButton.addEventListener("click", () => {
    instructionsInput.value = exampleInstructions.trim();
});

// Limpiar la entrada y los resultados.
clearButton.addEventListener("click", () => {
    instructionsInput.value = "";
    emptyState.hidden = false;
    results.hidden = true;
    taskList.replaceChildren();
    requirementsOutput.replaceChildren();
    updateProgress();
});


 // Analizar las instrucciones.
analyzeButton.addEventListener("click", async () => {
    const text = instructionsInput.value.trim();

    if (!text) {
        alert("Primero escribe o pega las instrucciones de tu actividad.");
        instructionsInput.focus();
        return;
    }

    // Mantener el análisis local existente.
    const objective = identifyObjective(text);
    const requirements = identifyRequirements(text);
    const tasks = generateTasks(text);

    objectiveOutput.textContent = objective;
    showRequirements(requirements);
    showTasks(tasks);

    emptyState.hidden = true;
    results.hidden = false;

    warningOutput.textContent = detectAmbiguities(text);

    updateProgress();

    // Enviar las instrucciones a Flask.
    try {
        analyzeButton.disabled = true;
        analyzeButton.textContent = "Conectando...";

        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                instructions: text
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Error al analizar.");
        }

        console.log("Respuesta de Flask:", data);

        warningOutput.textContent =
            "Servidor conectado correctamente. " + data.analysis;

    } catch (error) {
        console.error("Error al conectar con Flask:", error);

        warningOutput.textContent =
            "El análisis local se completó, pero no se pudo conectar con Flask.";
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analizar";
    }
});


// Identificar una posible frase de objetivo.
function identifyObjective(text) {
    const sentences = text
        .split(/[.!?\n]+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);

    const actionWords =
        /\b(elaborar|realizar|desarrollar|crear|investigar|diseñar|construir|presentar|entregar|analizar)\b/i;

    const objective = sentences.find(sentence =>
        actionWords.test(sentence)
    );

    return objective || sentences[0] ||
        "No se pudo identificar un objetivo.";
}

// Detectar requisitos que aparecen explícitamente en el texto.
function identifyRequirements(text) {
    const requirements = [];
    const lowerText = text.toLowerCase();

    if (/\bpdf\b/i.test(text)) {
        requirements.push("Formato PDF mencionado.");
    }

    if (/\bapa\b/i.test(text)) {
        requirements.push("Formato APA mencionado.");
    }

    const referencesMatch = text.match(
        /\b(?:mínimo|minimo|al menos)\s+\d+\s+(?:referencias|fuentes)\b/i
    );

    if (referencesMatch) {
        requirements.push(
            "Cantidad de referencias: " + referencesMatch[0] + "."
        );
    }

    const dateMatch = text.match(
    /\b(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b[^.,;\n]*/i
);

    if (dateMatch) {
        requirements.push(
            "Posible fecha de entrega: " + dateMatch[0] +
            ". Confirma la fecha exacta."
        );
    }

    // Identificar algunos apartados comunes.
    const sections = [
        "portada",
        "introducción",
        "introduccion",
        "objetivos",
        "metodología",
        "metodologia",
        "conclusiones",
        "bibliografía",
        "bibliografia",
        "referencias"
    ];

    const foundSections = sections.filter(section =>
        lowerText.includes(section)
    );

    if (foundSections.length > 0) {
        requirements.push(
            "Apartados mencionados: " +
            [...new Set(foundSections)].join(", ") + "."
        );
    }

    if (requirements.length === 0) {
        requirements.push(
            "No se detectaron requisitos mediante las reglas actuales. " +
            "Revisa las instrucciones manualmente."
        );
    }

    return requirements;
}

// Crear tareas preliminares a partir del contenido.
function generateTasks(text) {
    const tasks = [];
    const lowerText = text.toLowerCase();

    const possibleTasks = [
        {
            label: "Identificar el objetivo de la actividad.",
            keywords: ["objetivo", "propósito", "proposito"]
        },
        {
            label: "Preparar las secciones o apartados solicitados.",
            keywords: [
                "portada", "introducción", "introduccion",
                "metodología", "metodologia", "conclusiones"
            ]
        },
        {
            label: "Reunir las referencias o fuentes necesarias.",
            keywords: ["referencias", "bibliografía", "bibliografia", "fuentes"]
        },
        {
            label: "Preparar el documento o producto solicitado.",
            keywords: [
                "reporte", "documento", "proyecto",
                "investigación", "investigacion", "presentación",
                "presentacion"
            ]
        },
        {
            label: "Confirmar la fecha y el formato de entrega.",
            keywords: ["entregar", "entrega", "viernes", "lunes", "formato"]
        },
        {
            label: "Revisar la ortografía y los requisitos antes de entregar.",
            keywords: ["revisar", "ortografía", "ortografia", "completas"]
        }
    ];

    possibleTasks.forEach(task => {
        const isRelevant = task.keywords.some(keyword =>
            lowerText.includes(keyword)
        );

        if (isRelevant) {
            tasks.push(task.label);
        }
    });

    // Siempre se agrega una tarea de revisión final.
    tasks.push(
        "Comparar el resultado final con las instrucciones originales."
    );

    return [...new Set(tasks)];
}

// Mostrar los requisitos utilizando texto seguro.
function showRequirements(requirements) {
    requirementsOutput.replaceChildren();

    requirements.forEach(requirement => {
        const item = document.createElement("li");
        item.textContent = requirement;
        requirementsOutput.appendChild(item);
    });
}

// Crear las casillas de verificación.
function showTasks(tasks) {
    taskList.replaceChildren();

    tasks.forEach((task, index) => {
        const label = document.createElement("label");
        label.className = "task-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "task-" + index;

        const text = document.createElement("span");
        text.textContent = task;

        checkbox.addEventListener("change", () => {
            label.classList.toggle(
                "completed",
                checkbox.checked
            );

            updateProgress();
        });

        label.appendChild(checkbox);
        label.appendChild(text);
        taskList.appendChild(label);
    });
}

// Actualizar el progreso de las tareas.
function updateProgress() {
    const checkboxes = taskList.querySelectorAll(
        'input[type="checkbox"]'
    );

    const completed = [...checkboxes].filter(
        checkbox => checkbox.checked
    ).length;

    const total = checkboxes.length;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    progressBar.style.width = percentage + "%";

    progressText.textContent =
        completed + " de " + total + " tareas completadas";

    progressPercent.textContent = percentage + "%";
}


function detectAmbiguities(text) {
    const warnings = [];
    const lowerText = text.toLowerCase();

    // Detectar expresiones de fecha poco precisas.
    const vagueDates = [
        "próximo viernes",
        "proximo viernes",
        "la próxima semana",
        "la proxima semana",
        "lo antes posible",
        "cuando se pueda",
        "a la brevedad"
    ];

    if (vagueDates.some(phrase => lowerText.includes(phrase))) {
        warnings.push(
            "Confirma la fecha exacta de entrega; " +
            "se detectó una expresión de tiempo poco precisa."
        );
    }

    // Comprobar si se menciona una fecha o un plazo.
    const hasDate =
        /\b(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i.test(text) ||
        /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(text) ||
        /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(text);

    if (!hasDate) {
        warnings.push(
            "No se detectó una fecha clara de entrega. " +
            "Comprueba si tu profesor indicó un plazo."
        );
    }

    // Comprobar si se mencionan criterios de evaluación.
    const hasCriteria =
        /rúbrica|rubrica|criterios de evaluación|criterios de evaluacion|porcentaje|puntuación|puntuacion/i.test(text);

    if (!hasCriteria) {
        warnings.push(
            "No se detectaron criterios de evaluación explícitos. " +
            "Revisa si existe una rúbrica o una lista de requisitos."
        );
    }

    if (warnings.length === 0) {
        warnings.push(
            "No se detectaron ambigüedades con las reglas actuales. " +
            "Esto no garantiza que las instrucciones estén completas."
        );
    }

    warnings.push(
        "Análisis realizado con reglas de JavaScript; todavía no se utiliza IA."
    );

    return warnings.join(" ");
}

