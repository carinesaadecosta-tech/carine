export enum Gender {
    GARCON = "un garçon",
    FILLE = "une fille"
}

export enum CommentLength {
    COURT = "2-3",
    MOYEN = "3-4",
    LONG = "4-5"
}

export const COMMENT_SECTIONS = {
    COMPORTEMENT: "Comportement",
    TRAVAIL: "Travail / Investissement",
    NIVEAU: "Niveau / Compétences",
    CONSEILS: "Conseils / Progression",
} as const;

export type CommentSection = keyof typeof COMMENT_SECTIONS;

export enum PerformanceLevel {
    EXCELLENT = "Excellent : Très bons résultats, élève moteur et investi.",
    BON = "Bon : Des résultats solides et une participation régulière.",
    SATISFAISANT = "Satisfaisant : Niveau correct, mais peut mieux faire en s'investissant davantage.",
    FRAGILE = "Fragile : Des difficultés persistent, un travail plus régulier est nécessaire."
}

export enum CommentTone {
    ENCOURAGEANT = "Encourageant et bienveillant",
    FORMEL = "Formel et neutre",
    DIRECT = "Direct et factuel"
}

export interface FormData {
    studentName: string;
    subject: string;
    gender: Gender;
    performanceLevel: PerformanceLevel;
    comportement: string;
    travail: string;
    strengths: string;
    areasForImprovement: string;
    tone: CommentTone;
    commentSections: CommentSection[];
    commentLength: CommentLength;
}