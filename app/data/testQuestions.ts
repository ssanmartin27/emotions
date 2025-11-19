export interface TestQuestion {
    question: string;
    options: string[];
    weights: number[]; // Scoring weights for each option (0-4 typically)
    section?: string; // Section header (e.g., "Comunicación", "Motora Gruesa")
    hasTextArea?: boolean; // If true, shows a text area below
    textAreaLabel?: string; // Label for the text area
    textAreaEnabledOn?: "Sí" | "No"; // Which answer enables the text area
}

export interface AssessmentTest {
    id: string;
    name: string;
    description?: string;
    questions: TestQuestion[];
}

export interface AssessmentPhase {
    id: string;
    name: string;
    description?: string;
    tests: AssessmentTest[];
}

export const assessmentPhases: AssessmentPhase[] = [
    {
        id: "phase-1",
        name: "Pruebas de Evaluación del Desarrollo y Comportamiento",
        description: "Evaluación de habilidades motoras, comunicación, resolución de problemas y comportamiento social",
        tests: [
            {
                id: "asq",
                name: "ASQ (Ages and Stages Questionnaire)",
                description: "Evalúa habilidades motoras, comunicación, resolución de problemas y comportamiento social",
                questions: [
                    // Comunicación
                    {
                        question: "¿Intenta su niño tocar, agarrar, o señalar con el dedo los dibujos de un libro?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    {
                        question: "¿Dice su niña cuatro o más palabras además de \"mamá\" y \"papá\"?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    {
                        question: "Cuando su niño quiere algo, ¿lo señala con el dedo para comunicárselo a Ud.?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    {
                        question: "Cuando Ud. se lo pide, ¿va su niña a otro cuarto a buscar un juguete u objeto conocido? (Puede preguntarle, \"¿Dónde está la pelota?\", o decirle \"Tráeme tu abrigo\", o \"Busca tu cobija\".)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    {
                        question: "¿Imita su niña una oración de dos palabras? Por ejemplo, cuando Ud. dice \"Mamá juega\", \"Papá come\", o \"¿Qué es?\", repite ella la misma frase? (Marque \"si\" aun si sus palabras sean difíciles de entender.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    {
                        question: "¿Dice su niño ocho o más palabras además de \"mamá\" y \"papá\"?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Comunicación",
                    },
                    // Motora Gruesa
                    {
                        question: "¿Su niña puede ponerse de pie y dar algunos pasitos hacia adelante sin ninguna ayuda o soporte?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    {
                        question: "¿Su niño se sube a los muebles o a juegos (como grandes bloques) hechos para bebé?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    {
                        question: "¿Puede su niña agacharse para recoger un objeto del suelo y volver a ponerse de pie sin apoyo?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    {
                        question: "¿Camina su niño por la casa en lugar de gatear?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    {
                        question: "¿Camina bien su niña, sin caerse a menudo?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    {
                        question: "¿Se sube a algún objeto como una silla para alcanzar algo que quiere (por ejemplo, para agarrar un juguete que está arriba del mostrador de la cocina o para \"ayudarle\" en la cocina)?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Gruesa",
                    },
                    // Motora Fina
                    {
                        question: "¿Su niña le ayuda a Ud. a darle la vuelta a las hojas de un libro? (Ud. puede darle la página para que ella la agarre.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    {
                        question: "¿Puede lanzar su niño una pelota pequeña, moviendo el brazo hacia adelante por encima del hombro? (Si simplemente la deja caer, marque \"todavía no\" en esta pregunta.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    {
                        question: "¿Coloca su niña un cubito o un juguete pequeño encima de otro? (También puede usar carretes de hilo de coser, cajitas, o juguetes que midan aproximadamente una pulgada, o 3 centímetros.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    {
                        question: "¿Puede su niño poner tres cubitos o juguetes uno sobre otro sin ayuda?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    {
                        question: "Cuando intenta dibujar, ¿marca su niña la hoja de papel con la punta de la crayola (o del lápiz o de la pluma)?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    {
                        question: "¿Sabe darle la vuelta a las hojas de un libro sin ayuda? (Tal vez pase más de una hoja a la vez.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Motora Fina",
                    },
                    // Resolución de Problemas
                    {
                        question: "Si Ud. traza rayones o garabatos en un papel con una crayola (o con un lápiz o una pluma), ¿hace su niño lo mismo, imitándole a Ud.? (Si ya sabe trazar solo, marque \"sí\" en esta pregunta.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    {
                        question: "¿Puede su niña meter una migaja o un Cheerio (cereal de desayuno) dentro de una pequeña botella transparente (por ejemplo una botella de refresco o un biberón)?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    {
                        question: "¿Mete varios juguetes pequeños, uno tras otro, dentro de un recipiente como una caja o un tazón? (Puede enseñarle cómo se hace.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    {
                        question: "Después de enseñarle a su niño cómo se hace, ¿usa una cuchara, un palo, u otro implemento similar para intentar agarrar un juguete pequeño que esté ligeramente fuera de su alcance?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    {
                        question: "Sin enseñarle cómo hacerlo, ¿traza su niña garabatos o rayas cuando Ud. le da una crayola (o un lápiz o una pluma)? (Nota: Si marcó \"sí\" en la pregunta 5, marque \"si\" en la pregunta 1 también.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    {
                        question: "Después de dejar caer una migaja o un Cheerio (cereal de desayuno) en una pequeña botella transparente, ¿pone la botella al revés para sacarlo? (Puede enseñarle cómo hacerlo.)",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Resolución de Problemas",
                    },
                    // Socio-Individual
                    {
                        question: "¿Come con cuchara su niño sin la ayuda de Ud., aunque se le caiga algo de comida?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    {
                        question: "Cuando Ud. desviste a su niña, ¿ayuda ella a quitarse la ropa (los calcetines, el gorro, los zapatos, o los guantes)?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    {
                        question: "¿Juega su niño con una muñeca o con un muñeco de peluche, abrazándolo?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    {
                        question: "Al mirarse en el espejo, ¿su niña se ofrece un juguete a sí misma?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    {
                        question: "¿Intenta conseguir su atención o intenta enseñarle algo tirándole de la mano o de la ropa?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    {
                        question: "¿Viene a pedirle ayuda su niño, como cuando necesita que alguien le dé cuerda a un juguete o que quite la tapa de un frasco?",
                        options: ["Sí", "A veces", "Todavía no"],
                        weights: [0, 1, 2],
                        section: "Socio-Individual",
                    },
                    // Observaciones Generales
                    {
                        question: "¿Cree Ud. que su niño/a oye bien?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"no\", explique:",
                        textAreaEnabledOn: "No",
                    },
                    {
                        question: "¿Cree Ud. que su niño/a habla igual que los otros niños de su edad?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"no\", explique:",
                        textAreaEnabledOn: "No",
                    },
                    {
                        question: "¿Puede Ud. entender casi todo lo que dice su niño/a?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"no\", explique:",
                        textAreaEnabledOn: "No",
                    },
                    {
                        question: "¿Cree Ud. que su niño/a camina, corre, y trepa igual que los otros niños de su edad?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"no\", explique:",
                        textAreaEnabledOn: "No",
                    },
                    {
                        question: "¿Tiene algún familiar con historia de sordera o cualquier otro impedimento auditivo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"sí\", explique:",
                        textAreaEnabledOn: "Sí",
                    },
                    {
                        question: "¿Tiene Ud. alguna preocupación sobre la visión de su niño/a?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"sí\", explique:",
                        textAreaEnabledOn: "Sí",
                    },
                    {
                        question: "¿Ha tenido su niño/a algún problema de salud en los últimos meses?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"sí\", explique:",
                        textAreaEnabledOn: "Sí",
                    },
                    {
                        question: "¿Tiene alguna preocupación sobre el comportamiento de su niño/a?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"sí\", explique:",
                        textAreaEnabledOn: "Sí",
                    },
                    {
                        question: "¿Le preocupa algún aspecto del desarrollo de su niño/a?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "Observaciones Generales",
                        hasTextArea: true,
                        textAreaLabel: "Si contesta \"sí\", explique:",
                        textAreaEnabledOn: "Sí",
                    },
                ],
            },
            {
                id: "mchat",
                name: "M-CHAT (Modified Checklist for Autism in Toddlers)",
                description: "Detección temprana de signos de autismo en niños de 16 a 30 meses",
                questions: [
                    {
                        question: "¿El niño disfruta siendo mecido o saltando en sus rodillas?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra interés en otros niños?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño imita acciones o sonidos?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño responde cuando se le llama por su nombre?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño señala objetos de interés?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño hace contacto visual?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra gestos sociales (saludar, decir adiós)?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra comportamientos repetitivos o estereotipados?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                ],
            },
        ],
    },
    {
        id: "phase-2",
        name: "Pruebas Psicométricas y Proyectivas",
        description: "Pruebas proyectivas que permiten explorar el mundo interno del niño",
        tests: [
            {
                id: "figura-humana",
                name: "Test de la Figura Humana (Machover)",
                description: "Evalúa la autoimagen y posibles conflictos emocionales",
                questions: [
                    {
                        question: "¿Cómo describiría el niño su dibujo de una persona?",
                        options: ["Muy positivo", "Positivo", "Neutral", "Negativo", "Muy negativo"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El dibujo incluye todas las partes principales del cuerpo?",
                        options: ["Completo", "Mayormente completo", "Parcial", "Incompleto", "Muy incompleto"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El tamaño del dibujo es proporcional?",
                        options: ["Muy proporcional", "Proporcional", "Algo desproporcionado", "Desproporcionado", "Muy desproporcionado"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿Hay detalles en el dibujo (ropa, accesorios, etc.)?",
                        options: ["Muchos detalles", "Algunos detalles", "Pocos detalles", "Muy pocos detalles", "Sin detalles"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El dibujo muestra expresión emocional?",
                        options: ["Muy expresivo", "Expresivo", "Neutral", "Poco expresivo", "Sin expresión"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra confianza al dibujar?",
                        options: ["Muy confiado", "Confiado", "Neutral", "Inseguro", "Muy inseguro"],
                        weights: [0, 1, 2, 3, 4],
                    },
                ],
            },
            {
                id: "arbol-htp",
                name: "Test del Árbol (Koch) y HTP (Casa-Árbol-Persona)",
                description: "Proyectivos que permiten explorar el mundo interno del niño",
                questions: [
                    {
                        question: "¿Cómo describe el niño su dibujo de un árbol?",
                        options: ["Muy positivo", "Positivo", "Neutral", "Negativo", "Muy negativo"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El árbol tiene raíces visibles?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El árbol tiene ramas y hojas?",
                        options: ["Completo", "Mayormente completo", "Parcial", "Incompleto", "Muy incompleto"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿Cómo describe el niño su dibujo de una casa?",
                        options: ["Muy positivo", "Positivo", "Neutral", "Negativo", "Muy negativo"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿La casa tiene ventanas y puerta?",
                        options: ["Completo", "Mayormente completo", "Parcial", "Incompleto", "Muy incompleto"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra emociones al describir sus dibujos?",
                        options: ["Muy emocional", "Emocional", "Neutral", "Poco emocional", "Sin emoción"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿Hay elementos adicionales en los dibujos (sol, nubes, personas)?",
                        options: ["Muchos elementos", "Algunos elementos", "Pocos elementos", "Muy pocos elementos", "Sin elementos"],
                        weights: [0, 1, 2, 3, 4],
                    },
                ],
            },
        ],
    },
    {
        id: "phase-3",
        name: "Evaluación del Maltrato Infantil",
        description: "Cuestionarios para evaluar el comportamiento y posibles signos de maltrato",
        tests: [
            {
                id: "cbcl",
                name: "CBCL (Child Behavior Checklist)",
                description: "Evaluación del comportamiento del niño",
                questions: [
                    {
                        question: "¿El niño muestra comportamientos agresivos?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene problemas para dormir?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra ansiedad o preocupación?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene problemas de atención?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra retraimiento social?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene problemas de conducta en la escuela?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra signos de depresión?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene problemas para relacionarse con otros?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                ],
            },
            {
                id: "sdq",
                name: "SDQ (Strengths and Difficulties Questionnaire)",
                description: "Evaluación de fortalezas y dificultades",
                questions: [
                    {
                        question: "¿El niño muestra fortalezas emocionales?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene buenas habilidades sociales?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra hiperactividad?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene problemas de conducta?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra prosocialidad (ayuda a otros)?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño tiene dificultades emocionales?",
                        options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"],
                        weights: [0, 1, 2, 3, 4],
                    },
                    {
                        question: "¿El niño muestra resiliencia ante dificultades?",
                        options: ["Siempre", "A menudo", "A veces", "Raramente", "Nunca"],
                        weights: [0, 1, 2, 3, 4],
                    },
                ],
            },
        ],
    },
];

// Helper function to get all tests flattened
export function getAllTests(): Array<AssessmentTest & { phaseId: string; phaseName: string }> {
    return assessmentPhases.flatMap(phase =>
        phase.tests.map(test => ({
            ...test,
            phaseId: phase.id,
            phaseName: phase.name,
        }))
    );
}

// Helper function to get a specific test
export function getTest(phaseId: string, testId: string): AssessmentTest | undefined {
    const phase = assessmentPhases.find(p => p.id === phaseId);
    return phase?.tests.find(t => t.id === testId);
}

// Helper function to get a specific phase
export function getPhase(phaseId: string): AssessmentPhase | undefined {
    return assessmentPhases.find(p => p.id === phaseId);
}

// Backward compatibility: flatten all questions for legacy use
export const testQuestions: TestQuestion[] = assessmentPhases.flatMap(phase =>
    phase.tests.flatMap(test => test.questions)
);

// Calculate score for a specific test
export function calculateTestScore(
    answers: Array<{ question: string; answer: string; score: number }>
): number {
    if (answers.length === 0) return 0;
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxScore = answers.length * 4; // Maximum possible score
    return Math.round((totalScore / maxScore) * 100); // Return as percentage
}

// Calculate score for a specific test by phase and test ID
export function calculateTestScoreForTest(
    phaseId: string,
    testId: string,
    answers: Record<string, string>
): number {
    const test = getTest(phaseId, testId);
    if (!test) return 0;

    const testAnswers = test.questions.map((question, index) => {
        const answer = answers[`${phaseId}-${testId}-${index}`];
        if (!answer) return null;
        const optionIndex = question.options.indexOf(answer);
        const score = optionIndex >= 0 ? question.weights[optionIndex] : 0;
        return {
            question: question.question,
            answer,
            score,
        };
    }).filter((item): item is { question: string; answer: string; score: number } => item !== null);

    return calculateTestScore(testAnswers);
}

// ASQ Scoring Constants
export const ASQ_SECTION_THRESHOLDS: Record<string, { cutoff: number; monitoringCeil: number }> = {
    "Comunicación": { cutoff: 16.81, monitoringCeil: 30 },
    "Motora Gruesa": { cutoff: 37.91, monitoringCeil: 50 },
    "Motora Fina": { cutoff: 31.98, monitoringCeil: 45 },
    "Resolución de Problemas": { cutoff: 30.51, monitoringCeil: 45 },
    "Socio-Individual": { cutoff: 26.43, monitoringCeil: 40 },
};

// ASQ Answer value mapping
export function getASQAnswerValue(answer: string): number {
    switch (answer) {
        case "Sí":
            return 10;
        case "A veces":
            return 5;
        case "Todavía no":
            return 0;
        default:
            return 0;
    }
}

// Calculate ASQ section score
export function calculateASQSectionScore(
    sectionName: string,
    answers: Array<{ question: string; answer: string; section?: string }>
): number {
    const sectionAnswers = answers.filter(a => a.section === sectionName);
    return sectionAnswers.reduce((sum, item) => {
        return sum + getASQAnswerValue(item.answer);
    }, 0);
}

// Get ASQ zone for a section
export type ASQZone = "BLACK" | "GREY" | "WHITE";

export function getASQZone(totalScore: number, sectionName: string): ASQZone {
    const thresholds = ASQ_SECTION_THRESHOLDS[sectionName];
    if (!thresholds) return "WHITE"; // Default if section not found

    if (totalScore <= thresholds.cutoff) {
        return "BLACK";
    } else if (totalScore < thresholds.monitoringCeil) {
        return "GREY";
    } else {
        return "WHITE";
    }
}

// Get zone interpretation text
export function getASQZoneInterpretation(zone: ASQZone): string {
    switch (zone) {
        case "BLACK":
            return "Si el Puntaje total está dentro del área negra, el puntaje está debajo de las expectativas. Quizás se requiera una evaluación adicional más a fondo.";
        case "GREY":
            return "Si el Puntaje total está dentro del área gris, el puntaje está apenas por encima de las expectativas. Proporcione actividades adicionales para ayudarle al niño/a y vigile su progreso.";
        case "WHITE":
            return "Si el Puntaje total está dentro del área blanca, el puntaje del niño/a está por encima de las expectativas, y el desarrollo del niño/a parece estar bien hasta ahora.";
        default:
            return "";
    }
}

// Calculate all ASQ section scores
export function calculateASQAllSections(
    phaseId: string,
    testId: string,
    answers: Record<string, string>
): Array<{ section: string; score: number; zone: ASQZone; interpretation: string }> {
    const test = getTest(phaseId, testId);
    if (!test || testId !== "asq") return [];

    // Convert answers to array format
    const answerArray = test.questions.map((question, index) => {
        const key = `${phaseId}-${testId}-${index}`;
        const answer = answers[key];
        return {
            question: question.question,
            answer: answer || "",
            section: question.section || "",
        };
    }).filter(a => a.answer !== "");

    // Calculate scores for each section
    const sections = Object.keys(ASQ_SECTION_THRESHOLDS);
    return sections.map(sectionName => {
        const score = calculateASQSectionScore(sectionName, answerArray);
        const zone = getASQZone(score, sectionName);
        const interpretation = getASQZoneInterpretation(zone);
        return {
            section: sectionName,
            score,
            zone,
            interpretation,
        };
    });
}
