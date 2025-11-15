import { PerformanceLevel, CommentTone, Gender, CommentLength, COMMENT_SECTIONS, CommentSection } from './types';

export const PERFORMANCE_LEVEL_OPTIONS = [
    { value: PerformanceLevel.EXCELLENT, label: 'Excellent' },
    { value: PerformanceLevel.BON, label: 'Bon' },
    { value: PerformanceLevel.SATISFAISANT, label: 'Satisfaisant' },
    { value: PerformanceLevel.FRAGILE, label: 'Fragile / À améliorer' },
];

export const TONE_OPTIONS = [
    { value: CommentTone.ENCOURAGEANT, label: 'Encourageant' },
    { value: CommentTone.FORMEL, label: 'Formel' },
    { value: CommentTone.DIRECT, label: 'Direct' },
];

export const GENDER_OPTIONS = [
    { value: Gender.GARCON, label: 'Garçon' },
    { value: Gender.FILLE, label: 'Fille' },
];

export const COMMENT_SECTIONS_OPTIONS: { value: CommentSection, label: string }[] = Object.entries(COMMENT_SECTIONS).map(([key, label]) => ({
    value: key as CommentSection,
    label,
}));


export const COMMENT_LENGTH_OPTIONS = [
    { value: CommentLength.COURT, label: 'Courte (2-3 lignes)' },
    { value: CommentLength.MOYEN, label: 'Moyenne (3-4 lignes)' },
    { value: CommentLength.LONG, label: 'Détaillée (4-5 lignes)' },
];