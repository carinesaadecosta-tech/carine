
import { GoogleGenAI } from "@google/genai";
import type { FormData } from '../types';

export async function generateComment(formData: FormData): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { 
        studentName, 
        subject, 
        gender,
        performanceLevel, 
        comportement,
        travail,
        strengths, 
        areasForImprovement, 
        tone,
        commentSections,
        commentLength
    } = formData;

    const sectionsToInclude = [];

    if (commentSections.includes('COMPORTEMENT') && comportement) {
        sectionsToInclude.push(`- Comportement en classe : "${comportement}"`);
    }
    if (commentSections.includes('TRAVAIL') && travail) {
        sectionsToInclude.push(`- Investissement et méthode de travail : "${travail}"`);
    }
    if (commentSections.includes('NIVEAU') && strengths) {
        sectionsToInclude.push(`- Points forts et compétences (Niveau) : "${strengths}"`);
    }
    if (commentSections.includes('CONSEILS') && areasForImprovement) {
        sectionsToInclude.push(`- Axes d'amélioration et conseils : "${areasForImprovement}"`);
    }

    const prompt = `
        Agis en tant que professeur principal expérimenté et pédagogue. Rédige une appréciation personnalisée, constructive et nuancée pour le bulletin scolaire d'un élève.

        Informations sur l'élève :
        - Prénom : ${studentName}
        - Genre : ${gender}. Tu dois impérativement faire les accords en genre (masculin/féminin) nécessaires dans toute l'appréciation.
        - Matière : ${subject}
        - Description du niveau général : "${performanceLevel}"

        Voici les détails à intégrer en fonction des volets sélectionnés (s'ils sont fournis) :
        ${sectionsToInclude.join('\n        ')}

        Consignes pour la rédaction :
        1.  Le ton de l'appréciation doit être impérativement : **${tone}**.
        2.  L'appréciation doit faire environ **${commentLength} lignes**.
        3.  Structure l'appréciation en abordant les volets demandés dans un ordre logique et fluide. Ne mentionne pas explicitement le nom des volets (ex: "Concernant son comportement..."). L'ensemble doit être un paragraphe unique et cohérent.
        4.  Commence directement par l'appréciation, sans formule d'introduction comme "Voici une proposition :".
        5.  Personnalise le commentaire en utilisant le prénom de l'élève au moins une fois de manière naturelle.
        6.  Assure-toi que le commentaire est cohérent avec toutes les informations fournies.
        7.  Transforme les "axes d'amélioration" en conseils positifs et réalisables plutôt qu'en reproches.

        Ne retourne que le texte de l'appréciation finale.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating comment:", error);
        throw new Error("Une erreur est survenue lors de la génération de l'appréciation. Veuillez réessayer.");
    }
}