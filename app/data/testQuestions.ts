export interface TestQuestion {
    question: string;
    options: string[];
    weights: number[]; // Scoring weights for each option (0-4 typically)
    section?: string; // Section header (e.g., "Comunicación", "Motora Gruesa")
    hasTextArea?: boolean; // If true, shows a text area below
    textAreaLabel?: string; // Label for the text area
    textAreaEnabledOn?: "Sí" | "No"; // Which answer enables the text area
    interpretation?: string; // Interpretation text shown when "Sí" is selected (for Machover test)
        // CBCL-specific fields
        textAreaEnabledOnScore?: boolean; // If true, text area enabled when score > 0 (for CBCL)
        ageRange?: "1.5-5" | "6-18" | "2-4" | "11-17"; // Age range for which this question applies (for CBCL, SDQ)
}

export interface AssessmentTest {
    id: string;
    name: string;
    description?: string;
    questions: TestQuestion[];
    ageBased?: boolean; // If true, questions are filtered by age (for CBCL)
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
                description: "Detección temprana de signos de autismo en niños de 16 a 30 meses. Por favor, rellene lo que su hijo hace habitualmente. Trate de responder a todas las preguntas. Si la conducta es poco frecuente (ej. la ha observado una o dos veces), responda \"No\".",
                questions: [
                    {
                        question: "¿Disfruta su hijo cuando se le balancea, se le hace saltar sobre sus rodillas...?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Muestra su hijo interés por otros niños?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Le gusta a su hijo subirse a las cosas, como p.ej. las escaleras?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Disfruta su hijo jugando a cucu-tras o al escondite?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Su hijo simula alguna vez, por ejemplo, hablar por teléfono o cuidar a las muñecas o imagina otra cosa?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Utiliza su hijo alguna vez su dedo índice para señalar pidiendo algo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Utiliza su hijo alguna vez su dedo índice para señalar mostrando su interés en algo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Puede su hijo jugar apropiadamente con juguetes pequeños (ej. coches o bloques) sin metérselos en la boca, toquetearlos o tirarlos únicamente?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Le acerca su hijo alguna vez objetos para enseñárselos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Le mira su hijo a los ojos durante más de uno o dos segundos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Su hijo parece hipersensible a los ruidos? (ej. tapándose los oídos)",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Responde su hijo con una sonrisa a su cara o a su sonrisa?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Le imita su hijo? (ej. poner una cara que su hijo imita?)",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Su hijo responde cuando se le llama por su nombre?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "Si usted señala un juguete al otro lado de la habitación, ¿su hijo lo mira?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Anda su hijo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Mira su hijo a las cosas que está usted mirando?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Hace su hijo movimientos raros con los dedos cerca de su propia cara?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Trata de atraer su hijo la atención sobre su propia actividad?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Alguna vez ha sospechado que su hijo era sordo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Entiende su hijo lo que dice la gente?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿A veces su hijo se queda mirando fijamente al vacío o deambula sin ningún propósito?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                    },
                    {
                        question: "¿Mira su hijo a su cara para observar su reacción cuando se enfrenta con algo desconocido?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
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
                    // I. Aspectos Estructurales y Formales
                    {
                        question: "¿El dibujo es demasiado pequeño?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Indica inseguridad, sensación de inferioridad, preocupación sobre cómo manejar el ambiente o depresión extrema",
                    },
                    {
                        question: "¿El dibujo es muy grande?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Puede indicar sensación de grandiosidad, megalomanía (trata de probar que vale la pena) o paranoia",
                    },
                    {
                        question: "¿La figura está ubicada arriba de la mitad de la hoja?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Tendencia a fantasear, lucha por metas inalcanzables, inaccesibilidad o sensación de no tener una base firme",
                    },
                    {
                        question: "¿La figura está ubicada al lado izquierdo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Énfasis en el pasado, dominio emocional, impulsividad y autoconcientización",
                    },
                    {
                        question: "¿El trazo de las líneas es muy fino?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Falta de asertividad, timidez, ansiedad, inseguridad, depresión o falta de vitalidad",
                    },
                    {
                        question: "¿El trazo de las líneas es fuerte o remarcado?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Asertividad, dominio, lucha por el poder, o tensión y hostilidad (si es excesivo)",
                    },
                    {
                        question: "¿Hay sombreado excesivo en el dibujo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "I. Aspectos Estructurales y Formales",
                        interpretation: "Generalmente indica ansiedad o tensión extrema. Si es en zonas sexuales, sugiere conflicto en esa área",
                    },
                    // II. La Cabeza y Rasgos Faciales
                    {
                        question: "¿La cabeza es desproporcionadamente grande?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Lucha por ser intelectual, uso de la fantasía como satisfacción, o egocentrismo",
                    },
                    {
                        question: "¿La cabeza está dibujada de perfil?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Evasión, retraimiento o culpabilidad",
                    },
                    {
                        question: "¿Se han omitido los rasgos faciales?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Evasión de conflictos interpersonales, retraimiento social o timidez",
                    },
                    {
                        question: "¿Están dibujados los dientes?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Agresión oral, infantilismo o sadismo verbal",
                    },
                    {
                        question: "¿Los ojos están cerrados o tapados?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Hostilidad hacia otros, rechazo a ver el mundo externo o evitación de lo que molesta",
                    },
                    {
                        question: "¿Los ojos son grandes y oscuros/acentuados?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Tendencias de exhibicionismo o curiosidad intelectual; si son escrutadores, indican estado de alerta",
                    },
                    {
                        question: "¿Hay énfasis en las orejas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "II. La Cabeza y Rasgos Faciales",
                        interpretation: "Sensibilidad al mundo, paranoia, o sensibilidad a la crítica",
                    },
                    // III. Brazos y Manos (Rasgos de Contacto)
                    {
                        question: "¿Se han omitido los brazos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Sentimiento severo de culpabilidad, depresión, retraimiento activo u hostilidad",
                    },
                    {
                        question: "¿Los brazos son cortos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Falta de ambición o sensación de debilidad",
                    },
                    {
                        question: "¿Los brazos son largos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Ambición, lucha por el triunfo o demanda de amor y atención",
                    },
                    {
                        question: "¿Las manos están ocultas (en bolsas o atrás)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Evasión, falta de deseo de manejar problemas, sofisticación artística o posible psicopatía",
                    },
                    {
                        question: "¿Las manos están dibujadas como puños?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Rebeldía (común en delincuentes) o agresividad contenida",
                    },
                    {
                        question: "¿Los dedos son largos o como garras?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Hostilidad, paranoia o agresión externa",
                    },
                    // IV. Piernas y Pies
                    {
                        question: "¿Se han omitido las piernas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "IV. Piernas y Pies",
                        interpretation: "Sentimientos patológicos de constricción, dependencia, o sensación de falta de autonomía",
                    },
                    {
                        question: "¿Las piernas están muy juntas o cruzadas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "IV. Piernas y Pies",
                        interpretation: "Rigidez, tensión, o rechazo al acercamiento sexual",
                    },
                    {
                        question: "¿Se han omitido los pies?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "IV. Piernas y Pies",
                        interpretation: "Falta de autonomía, sensación de inmovilidad, depresión o desánimo",
                    },
                    {
                        question: "¿Los pies terminan en punta?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "IV. Piernas y Pies",
                        interpretation: "Hostilidad reprimida o sentimientos agresivos inaceptables",
                    },
                    // V. Tronco, Ropa y Accesorios
                    {
                        question: "¿El tronco es muy pequeño?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "V. Tronco, Ropa y Accesorios",
                        interpretation: "Negación de los deseos corporales, sensación de inferioridad física",
                    },
                    {
                        question: "¿Hay énfasis en los botones (especialmente en línea media)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "V. Tronco, Ropa y Accesorios",
                        interpretation: "Dependencia (usualmente materna), egocentrismo, o inseguridad",
                    },
                    {
                        question: "¿Hay énfasis en los bolsillos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "V. Tronco, Ropa y Accesorios",
                        interpretation: "Dependencia infantil, privación de afecto o egoísmo",
                    },
                    {
                        question: "¿El cuello es largo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "V. Tronco, Ropa y Accesorios",
                        interpretation: "Falta de control racional sobre los impulsos o características esquizoides",
                    },
                    {
                        question: "¿Se ha omitido el cuello?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "V. Tronco, Ropa y Accesorios",
                        interpretation: "Fluidez libre de los instintos e impulsos sin controles adecuados",
                    },
                ],
            },
            {
                id: "htp",
                name: "HTP (Casa-Árbol-Persona)",
                description: "Test proyectivo que incluye Casa, Árbol y Persona para explorar el mundo interno del niño",
                questions: [
                    // PARTE 1: ÁRBOL - I. Raíces y Suelo (La base y lo instintivo)
                    {
                        question: "¿El árbol no tiene suelo (flota en el aire)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - I. Raíces y Suelo (La base y lo instintivo)",
                        interpretation: "Inseguridad, falta de apoyo, desarraigo o pérdida de contacto con la realidad",
                    },
                    {
                        question: "¿El suelo es una sola línea recta firme?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - I. Raíces y Suelo (La base y lo instintivo)",
                        interpretation: "Aceptación de normas, firmeza, o rigidez si es muy marcada",
                    },
                    {
                        question: "¿Las raíces son exageradas, grandes o retorcidas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - I. Raíces y Suelo (La base y lo instintivo)",
                        interpretation: "Fuerte énfasis en lo instintivo, apego excesivo al pasado, preocupaciones materiales o angustia",
                    },
                    {
                        question: "¿Las raíces son transparentes (se ven a través de la tierra)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - I. Raíces y Suelo (La base y lo instintivo)",
                        interpretation: "Deterioro del criterio de realidad (en adultos) o inteligencia concreta/infantil",
                    },
                    // PARTE 1: ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)
                    {
                        question: "¿El tronco es muy delgado o débil?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Sentimiento de debilidad, inseguridad, sensibilidad extrema o inestabilidad",
                    },
                    {
                        question: "¿El tronco es muy ancho o grueso?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Energía, impulsividad, materialismo o tendencia a la acción (a veces agresividad)",
                    },
                    {
                        question: "¿Hay manchas, nudos o agujeros en el tronco?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Huellas de traumas pasados, conflictos no resueltos o heridas emocionales",
                    },
                    {
                        question: "¿La corteza está dibujada con trazos angulosos/ásperos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Agresividad, actitud defensiva o irritabilidad",
                    },
                    {
                        question: "¿El tronco se inclina hacia la izquierda?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Introversión, apego a la madre o al pasado, temor al futuro",
                    },
                    {
                        question: "¿El tronco se inclina hacia la derecha?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - II. El Tronco (El \"Yo\", fortaleza y traumas)",
                        interpretation: "Extroversión, búsqueda de contacto social, o impulsividad hacia el futuro",
                    },
                    // PARTE 1: ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)
                    {
                        question: "¿La copa es muy pequeña (respecto al tronco)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Introversión, timidez, sentimiento de inferioridad o detallismo obsesivo",
                    },
                    {
                        question: "¿La copa es enorme o desbordante?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Fantasía excesiva, narcisismo, vanidad o falta de autocontrol",
                    },
                    {
                        question: "¿Las ramas terminan en punta o como lanzas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Agresividad, crítica aguda, hostilidad hacia el entorno",
                    },
                    {
                        question: "¿Las ramas están cortadas o truncadas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Sentimientos de castración, limitaciones impuestas por el ambiente o traumas recientes",
                    },
                    {
                        question: "¿El árbol tiene frutos (manzanas, etc.)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Deseo de productividad, impaciencia por ver resultados o inmadurez (depende de la edad)",
                    },
                    {
                        question: "¿Aparecen hojas cayendo (otoño)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "ÁRBOL - III. La Copa y Ramas (Fantasía y contacto social)",
                        interpretation: "Sentimientos de pérdida, duelo, tristeza o depresión",
                    },
                    // PARTE 2: CASA - I. Estructura General de la Casa
                    {
                        question: "¿La casa es muy pequeña en el papel?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - I. Estructura General de la Casa",
                        interpretation: "Rechazo a la vida hogareña, inseguridad o retraimiento",
                    },
                    {
                        question: "¿La casa parece un plano o vista aérea?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - I. Estructura General de la Casa",
                        interpretation: "Conflicto grave con la situación familiar (toma distancia) o intelectualización excesiva",
                    },
                    {
                        question: "¿Falta la línea del suelo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - I. Estructura General de la Casa",
                        interpretation: "Sensación de desarraigo, inestabilidad familiar (\"en el aire\")",
                    },
                    // PARTE 2: CASA - II. Techo y Chimenea (Fantasía y Clima Emocional)
                    {
                        question: "¿El techo es excesivamente grande (aplasta la casa)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - II. Techo y Chimenea (Fantasía y Clima Emocional)",
                        interpretation: "La fantasía domina sobre la realidad, escape mental excesivo",
                    },
                    {
                        question: "¿Falta el techo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - II. Techo y Chimenea (Fantasía y Clima Emocional)",
                        interpretation: "Personalidad muy constreñida, falta de imaginación o problemas cognitivos",
                    },
                    {
                        question: "¿Hay mucho humo saliendo de la chimenea (denso)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - II. Techo y Chimenea (Fantasía y Clima Emocional)",
                        interpretation: "Tensión interna considerable, conflictos o presión en el ambiente familiar",
                    },
                    {
                        question: "¿Hay chimenea pero no sale humo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - II. Techo y Chimenea (Fantasía y Clima Emocional)",
                        interpretation: "Falta de afecto, frialdad en el hogar o sensación de vacío",
                    },
                    // PARTE 2: CASA - III. Puertas y Ventanas (Acceso y Contacto)
                    {
                        question: "¿La puerta es muy pequeña?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Timidez, dificultad para el contacto social, inhibición",
                    },
                    {
                        question: "¿La puerta está muy abierta?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Necesidad extrema de afecto, dependencia o falta de defensas",
                    },
                    {
                        question: "¿La puerta tiene cerraduras, candados o herrajes?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Desconfianza, paranoia, actitud defensiva ante el exterior",
                    },
                    {
                        question: "¿Las ventanas no tienen cristales, cortinas ni marcos (huecas)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Trato rudo, falta de tacto social o vacío afectivo",
                    },
                    {
                        question: "¿Las ventanas tienen rejas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Desconfianza, temor a ser robado o dañado, aislamiento voluntario",
                    },
                    {
                        question: "¿Se ha omitido la puerta de entrada?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "CASA - III. Puertas y Ventanas (Acceso y Contacto)",
                        interpretation: "Aislamiento extremo, inaccesibilidad, rechazo al contacto",
                    },
                    // PARTE 3: PERSONA - I. Aspectos Estructurales y Formales
                    {
                        question: "¿El dibujo es demasiado pequeño?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Indica inseguridad, sensación de inferioridad, preocupación sobre cómo manejar el ambiente o depresión extrema",
                    },
                    {
                        question: "¿El dibujo es muy grande?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Puede indicar sensación de grandiosidad, megalomanía (trata de probar que vale la pena) o paranoia",
                    },
                    {
                        question: "¿La figura está ubicada arriba de la mitad de la hoja?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Tendencia a fantasear, lucha por metas inalcanzables, inaccesibilidad o sensación de no tener una base firme",
                    },
                    {
                        question: "¿La figura está ubicada al lado izquierdo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Énfasis en el pasado, dominio emocional, impulsividad y autoconcientización",
                    },
                    {
                        question: "¿El trazo de las líneas es muy fino?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Falta de asertividad, timidez, ansiedad, inseguridad, depresión o falta de vitalidad",
                    },
                    {
                        question: "¿El trazo de las líneas es fuerte o remarcado?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Asertividad, dominio, lucha por el poder, o tensión y hostilidad (si es excesivo)",
                    },
                    {
                        question: "¿Hay sombreado excesivo en el dibujo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - I. Aspectos Estructurales y Formales",
                        interpretation: "Generalmente indica ansiedad o tensión extrema. Si es en zonas sexuales, sugiere conflicto en esa área",
                    },
                    // PARTE 3: PERSONA - II. La Cabeza y Rasgos Faciales
                    {
                        question: "¿La cabeza es desproporcionadamente grande?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Lucha por ser intelectual, uso de la fantasía como satisfacción, o egocentrismo",
                    },
                    {
                        question: "¿La cabeza está dibujada de perfil?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Evasión, retraimiento o culpabilidad",
                    },
                    {
                        question: "¿Se han omitido los rasgos faciales?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Evasión de conflictos interpersonales, retraimiento social o timidez",
                    },
                    {
                        question: "¿Están dibujados los dientes?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Agresión oral, infantilismo o sadismo verbal",
                    },
                    {
                        question: "¿Los ojos están cerrados o tapados?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Hostilidad hacia otros, rechazo a ver el mundo externo o evitación de lo que molesta",
                    },
                    {
                        question: "¿Los ojos son grandes y oscuros/acentuados?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Tendencias de exhibicionismo o curiosidad intelectual; si son escrutadores, indican estado de alerta",
                    },
                    {
                        question: "¿Hay énfasis en las orejas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - II. La Cabeza y Rasgos Faciales",
                        interpretation: "Sensibilidad al mundo, paranoia, o sensibilidad a la crítica",
                    },
                    // PARTE 3: PERSONA - III. Brazos y Manos (Rasgos de Contacto)
                    {
                        question: "¿Se han omitido los brazos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Sentimiento severo de culpabilidad, depresión, retraimiento activo u hostilidad",
                    },
                    {
                        question: "¿Los brazos son cortos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Falta de ambición o sensación de debilidad",
                    },
                    {
                        question: "¿Los brazos son largos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Ambición, lucha por el triunfo o demanda de amor y atención",
                    },
                    {
                        question: "¿Las manos están ocultas (en bolsas o atrás)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Evasión, falta de deseo de manejar problemas, sofisticación artística o posible psicopatía",
                    },
                    {
                        question: "¿Las manos están dibujadas como puños?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Rebeldía (común en delincuentes) o agresividad contenida",
                    },
                    {
                        question: "¿Los dedos son largos o como garras?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - III. Brazos y Manos (Rasgos de Contacto)",
                        interpretation: "Hostilidad, paranoia o agresión externa",
                    },
                    // PARTE 3: PERSONA - IV. Piernas y Pies
                    {
                        question: "¿Se han omitido las piernas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - IV. Piernas y Pies",
                        interpretation: "Sentimientos patológicos de constricción, dependencia, o sensación de falta de autonomía",
                    },
                    {
                        question: "¿Las piernas están muy juntas o cruzadas?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - IV. Piernas y Pies",
                        interpretation: "Rigidez, tensión, o rechazo al acercamiento sexual",
                    },
                    {
                        question: "¿Se han omitido los pies?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - IV. Piernas y Pies",
                        interpretation: "Falta de autonomía, sensación de inmovilidad, depresión o desánimo",
                    },
                    {
                        question: "¿Los pies terminan en punta?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - IV. Piernas y Pies",
                        interpretation: "Hostilidad reprimida o sentimientos agresivos inaceptables",
                    },
                    // PARTE 3: PERSONA - V. Tronco, Ropa y Accesorios
                    {
                        question: "¿El tronco es muy pequeño?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - V. Tronco, Ropa y Accesorios",
                        interpretation: "Negación de los deseos corporales, sensación de inferioridad física",
                    },
                    {
                        question: "¿Hay énfasis en los botones (especialmente en línea media)?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - V. Tronco, Ropa y Accesorios",
                        interpretation: "Dependencia (usualmente materna), egocentrismo, o inseguridad",
                    },
                    {
                        question: "¿Hay énfasis en los bolsillos?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - V. Tronco, Ropa y Accesorios",
                        interpretation: "Dependencia infantil, privación de afecto o egoísmo",
                    },
                    {
                        question: "¿El cuello es largo?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - V. Tronco, Ropa y Accesorios",
                        interpretation: "Falta de control racional sobre los impulsos o características esquizoides",
                    },
                    {
                        question: "¿Se ha omitido el cuello?",
                        options: ["Sí", "No"],
                        weights: [0, 1],
                        section: "PERSONA - V. Tronco, Ropa y Accesorios",
                        interpretation: "Fluidez libre de los instintos e impulsos sin controles adecuados",
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
                description: "Evaluación del comportamiento del niño. El formulario se adapta según la edad del niño (1.5-5 años o 6-18 años).",
                ageBased: true,
                questions: [
                    // Form 1: Ages 1.5-5 years - Behavior Items
                    // CBCL Scale: 0 = No es cierto, 1 = Es algo cierto o a veces cierto, 2 = Es muy cierto o a menudo cierto
                    { question: "Dolores o molestias (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Actúa demasiado joven para su edad", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Problemas con el alcohol o las drogas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Alergias", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Discute mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Asma", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se comporta como el sexo opuesto", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "No puede concentrarse, no puede prestar atención por mucho tiempo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "No puede quedarse quieto, es hiperactivo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "No puede ver bien (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se lastima a sí mismo deliberadamente o intenta suicidarse", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se lastima físicamente a sí mismo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de dolores de cabeza", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de dolores de estómago o cólicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de dolores (sin dolores de cabeza o estómago)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de vómitos o náuseas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente mareado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente demasiado cansado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente demasiado pesado o con sobrepeso", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente o se queja de que nadie lo quiere", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente o se queja de que otros están en su contra", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Come o bebe cosas que no son comida", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Teme a ciertos animales, situaciones o lugares", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Teme ir a la escuela", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Teme que pueda pensar o hacer algo malo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Teme estar solo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Teme que le pase algo malo a sus padres", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Teme ciertos lugares, situaciones o animales más que otros niños", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Tiene que hacer las cosas de la misma manera una y otra vez; compulsiones", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Tiene problemas para dormir", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Tiene problemas con los ojos (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Tiene rabietas o arrebatos de mal genio", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se mueve más que otros niños, es hiperactivo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se niega a hablar", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se niega a comer", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se niega a ir a la escuela", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Movimientos nerviosos o tics", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se niega a participar activamente en los juegos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se niega a usar el baño", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se hurga la nariz, la piel u otras partes del cuerpo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se queja de dolores de cabeza", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de dolores de estómago o cólicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de dolores (sin dolores de cabeza o estómago)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se queja de vómitos o náuseas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente mareado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente demasiado cansado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente demasiado pesado o con sobrepeso", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Problemas con los ojos (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se siente o se queja de que nadie lo quiere", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente o se queja de que otros están en su contra", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se resiste al entrenamiento para ir al baño", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Duerme menos que la mayoría de los niños durante el día y/o noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Problema del habla", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Comportamiento extraño", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se molesta con nuevas personas o situaciones", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "1.5-5" },
                    { question: "Por favor escriba cualquier problema que tenga el niño que no se haya listado arriba", options: [], weights: [], ageRange: "1.5-5", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: false },
                    // Form 2: Ages 6-18 years - Behavior Items (Part B)
                    { question: "Actúa demasiado joven para su edad", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Bebe alcohol sin aprobación de los padres", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Discute mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "No puede concentrarse, no puede prestar atención por mucho tiempo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "No puede quedarse quieto, es hiperactivo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se lastima a sí mismo deliberadamente o intenta suicidarse", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se lastima físicamente a sí mismo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de dolores de cabeza", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "No puede quitarse ciertos pensamientos de la mente; obsesiones", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se queja de dolores de estómago o cólicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de dolores (sin dolores de cabeza o estómago)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de vómitos o náuseas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente mareado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente demasiado cansado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente demasiado pesado o con sobrepeso", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente o se queja de que nadie lo quiere", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente o se queja de que otros están en su contra", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Tiene rabietas o arrebatos de mal genio", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se mueve más que otros niños, es hiperactivo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Teme a ciertos animales, situaciones o lugares (que no sean la escuela)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Teme ir a la escuela", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Teme que pueda pensar o hacer algo malo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Teme estar solo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Teme que le pase algo malo a sus padres", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Teme ciertos lugares, situaciones o animales más que otros niños", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Tiene que hacer las cosas de la misma manera una y otra vez; compulsiones", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Tiene problemas para dormir", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Tiene problemas con los ojos (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se niega a hablar", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se niega a comer", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Escucha sonidos o voces que no están ahí", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se niega a ir a la escuela", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se niega a participar activamente en los juegos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se niega a usar el baño", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de dolores de cabeza", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de dolores de estómago o cólicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Movimientos nerviosos o tics", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se queja de dolores (sin dolores de cabeza o estómago)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se queja de vómitos o náuseas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente mareado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente demasiado cansado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente demasiado pesado o con sobrepeso", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente o se queja de que nadie lo quiere", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente o se queja de que otros están en su contra", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Dolores o molestias (sin causa médica)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Dolores de cabeza", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Náuseas, se siente mal", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Problemas con los ojos (no si se corrigen con lentes)", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Erupciones u otros problemas de la piel", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Dolores de estómago o cólicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Vómitos, náuseas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Otros problemas físicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se hurga la nariz, la piel u otras partes del cuerpo", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Repite ciertos actos una y otra vez; compulsiones", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Ve cosas que no están ahí", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Problemas sexuales", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Duerme más que la mayoría de los niños durante el día y/o noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Problema del habla", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Acumula demasiadas cosas que no necesita", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Comportamiento extraño", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Ideas extrañas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Habla o camina dormido", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Problemas para dormir", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se siente inútil o inferior", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se muerde las uñas", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Usa drogas con fines no médicos", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: true },
                    { question: "Se orina en la cama", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se orina durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante el día", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se ensucia durante la noche", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa mucho", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por su futuro", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Se preocupa por pensar en el pasado", options: ["No es cierto (hasta donde usted sabe)", "Es algo cierto o a veces cierto", "Es muy cierto o a menudo cierto"], weights: [0, 1, 2], ageRange: "6-18" },
                    { question: "Por favor escriba cualquier problema que tenga su hijo que no se haya listado arriba", options: [], weights: [], ageRange: "6-18", hasTextArea: true, textAreaLabel: "Describa", textAreaEnabledOnScore: false },
                ],
            },
            {
                id: "sdq",
                name: "SDQ (Strengths and Difficulties Questionnaire)",
                description: "Evaluación de fortalezas y dificultades. El formulario se adapta según la edad del niño (2-4 años para padres o 11-17 años para adolescentes).",
                ageBased: true,
                questions: [
                    // Form 1: Ages 2-4 years - Parent Version
                    { question: "Tiene en cuenta los sentimientos de otras personas", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Es inquieto/a, hiperactivo/a, no puede permanecer quieto/a por mucho tiempo", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Se queja con frecuencia de dolor de cabeza, de estómago o de náuseas", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Comparte frecuentemente con otros niños/as chucherías, juguetes, lápices, etc", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Frecuentemente tiene rabietas o mal genio", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Es más bien solitario/a y tiende a jugar solo/a", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Por lo general es obediente, suele hacer lo que le piden los adultos", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Tiene muchas preocupaciones, a menudo parece inquieto/a o preocupado/a", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Ofrece ayuda cuando alguien resulta herido, disgustado, o enfermo", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Está continuamente moviéndose y es revoltoso", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Tiene por lo menos un/a buen/a amigo/a", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Pelea con frecuencia con otros niños/as o se mete con ellos/ellas", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Se siente a menudo infeliz, desanimado o lloroso", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Por lo general cae bien a los otros niños/as", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Se distrae con facilidad, su concentración tiende a dispersarse", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Es nervioso/a o dependiente ante nuevas situaciones, fácilmente pierde la confianza en sí mismo/a", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Trata bien a los niños/as más pequeños/as", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Muestra a menudo una actitud negativa con los adultos", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Los otros niños/as se meten con él/ella o se burlan de él/ella", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "A menudo se ofrece para ayudar (a padres, maestros, otros niños/as)", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Tiene capacidad para pensar antes de actuar", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "A menudo muestra rencor cuando se enfada", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Se lleva mejor con adultos que con otros niños/as", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Tiene muchos miedos, se asusta fácilmente", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "Termina lo que empieza, tiene buena concentración", options: ["No es cierto", "Un tanto cierto", "Absolutamente cierto"], weights: [0, 1, 2], ageRange: "2-4" },
                    { question: "¿Tiene usted algún comentario o preocupación en particular que quiera plantear?", options: [], weights: [], ageRange: "2-4", hasTextArea: true, textAreaLabel: "Comentarios", textAreaEnabledOnScore: false },
                    // Impact Supplement - Form 1 (2-4 years)
                    { question: "¿Cree usted que su hijo/a tiene dificultades en alguna de las siguientes áreas: emociones, concentración, conducta o capacidad para relacionarse con otras personas?", options: ["No", "Sí- pequeñas dificultades", "Sí- claras dificultades", "Sí- severas dificultades"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Desde cuándo tiene estas dificultades?", options: ["Menos de un mes", "1-5 meses", "6-12 meses", "Más de un año"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Cree usted que estas dificultades preocupan o causan malestar a su hijo/a?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Interfieren estas dificultades en la vida diaria de su hijo/a en VIDA EN LA CASA?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Interfieren estas dificultades en la vida diaria de su hijo/a en AMISTADES?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Interfieren estas dificultades en la vida diaria de su hijo/a en APRENDIZAJE?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Interfieren estas dificultades en la vida diaria de su hijo/a en ACTIVIDADES DE OCIO O DE TIEMPO LIBRE?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    { question: "¿Son estas dificultades una carga para usted o su familia?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "2-4", section: "Impact Supplement" },
                    // Form 2: Ages 11-17 years - Adolescent Version
                    { question: "Procuro ser agradable con los demás. Tengo en cuenta los sentimientos de las otras personas", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Soy inquieto/a, hiperactivo/a, no puedo permanecer quieto/a por mucho tiempo", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Suelo tener muchos dolores de cabeza, estómago o náuseas", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Normalmente comparto con otros mis juguetes, chucherías, lápices, etc", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Cuando me enfado, me enfado mucho y pierdo el control", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Prefiero estar solo/a que con gente de mi edad", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Por lo general soy obediente", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "A menudo estoy preocupado/a", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Ayudo si alguien está enfermo, disgustado o herido", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Estoy todo el tiempo moviéndome, me muevo demasiado", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Tengo un/a buen/a amigo/a por lo menos", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Peleo con frecuencia con otros, manipulo a los demás", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Me siento a menudo triste, desanimado o con ganas de llorar", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Por lo general caigo bien a la otra gente de mi edad", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Me distraigo con facilidad, me cuesta concentrarme", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Me pongo nervioso/a con las situaciones nuevas, fácilmente pierdo la confianza en mí mismo/a", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Trato bien a los niños/as más pequeños/as", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "A menudo me acusan de mentir o de hacer trampas", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Otra gente de mi edad se mete conmigo o se burla de mi", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "A menudo me ofrezco para ayudar (a padres, maestros, niños)", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Pienso las cosas antes de hacerlas", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Cojo cosas que no son mías de casa, la escuela o de otros sitios", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Me llevo mejor con adultos que con otros de mi edad", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Tengo muchos miedos, me asusto fácilmente", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "Termino lo que empiezo, tengo buena concentración", options: ["No es verdad", "Es verdad a medias", "Verdaderamente sí"], weights: [0, 1, 2], ageRange: "11-17" },
                    { question: "¿Tienes algún comentario o preocupación en particular que quieras plantear?", options: [], weights: [], ageRange: "11-17", hasTextArea: true, textAreaLabel: "Comentarios", textAreaEnabledOnScore: false },
                    // Impact Supplement - Form 2 (11-17 years)
                    { question: "En general, ¿crees que tienes dificultades en alguna de las siguientes áreas: emociones, concentración, conducta o capacidad para relacionarte con otras personas?", options: ["No", "Sí- pequeñas dificultades", "Sí- claras dificultades", "Sí- severas dificultades"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Desde cuándo tienes estas dificultades?", options: ["Menos de un mes", "1-5 meses", "6-12 meses", "Más de un año"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Estas dificultades te preocupan o te hacen sufrir?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Repercuten estas dificultades en tu vida diaria en VIDA EN LA CASA?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Repercuten estas dificultades en tu vida diaria en AMISTADES?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Repercuten estas dificultades en tu vida diaria en APRENDIZAJE EN LA ESCUELA?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Repercuten estas dificultades en tu vida diaria en ACTIVIDADES DE OCIO O DE TIEMPO LIBRE?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
                    { question: "¿Suponen estas dificultades una carga para los que están a tu alrededor (tu familia, amigos, profesores etc)?", options: ["No", "Sólo un poco", "Bastante", "Mucho"], weights: [0, 1, 2, 3], ageRange: "11-17", section: "Impact Supplement" },
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

// M-CHAT Scoring Constants
// Critical items (1-indexed): 2, 7, 9, 13, 14, 15
// Converted to 0-indexed: 1, 6, 8, 12, 13, 14
export const MCHAT_CRITICAL_ITEMS = new Set([1, 6, 8, 12, 13, 14]);

// Reverse scored items (1-indexed): 11, 18, 20, 22
// Converted to 0-indexed: 10, 17, 19, 21
// For these, "YES" (Sí) is the risk indicator
export const MCHAT_REVERSE_SCORED_ITEMS = new Set([10, 17, 19, 21]);

// Check if an answer indicates risk for M-CHAT
export function isMCHATRiskAnswer(questionIndex: number, answer: string): boolean {
    const isReverseScored = MCHAT_REVERSE_SCORED_ITEMS.has(questionIndex);
    
    if (isReverseScored) {
        // For reverse scored items, "Sí" (YES) indicates risk
        return answer === "Sí";
    } else {
        // For standard items, "No" indicates risk
        return answer === "No";
    }
}

// Calculate M-CHAT result
export type MCHATResult = {
    totalFailures: number;
    criticalFailures: number;
    result: "PASS" | "FAIL";
    interpretation: string;
};

export function calculateMCHATResult(
    phaseId: string,
    testId: string,
    answers: Record<string, string>
): MCHATResult | null {
    const test = getTest(phaseId, testId);
    if (!test || testId !== "mchat") return null;

    let totalFailures = 0;
    let criticalFailures = 0;

    test.questions.forEach((question, index) => {
        const key = `${phaseId}-${testId}-${index}`;
        const answer = answers[key];
        
        if (!answer) return; // Skip unanswered questions

        const isRisk = isMCHATRiskAnswer(index, answer);
        
        if (isRisk) {
            totalFailures++;
            if (MCHAT_CRITICAL_ITEMS.has(index)) {
                criticalFailures++;
            }
        }
    });

    // Determine result
    let result: "PASS" | "FAIL";
    let interpretation: string;

    if (criticalFailures >= 2) {
        result = "FAIL";
        interpretation = "Riesgo de TEA - Se requiere evaluación adicional. El niño ha fallado 2 o más ítems críticos.";
    } else if (totalFailures >= 3) {
        result = "FAIL";
        interpretation = "Riesgo de TEA - Se requiere evaluación adicional. El niño ha fallado 3 o más ítems en total.";
    } else {
        result = "PASS";
        interpretation = "Bajo riesgo. El desarrollo del niño parece estar dentro de los parámetros esperados. Sin embargo, si tiene preocupaciones, consulte con un especialista.";
    }

    return {
        totalFailures,
        criticalFailures,
        result,
        interpretation,
    };
}

