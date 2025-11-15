import { GoogleGenAI } from "@google/genai";

// --- CONSTANTS ---
const SUGGESTION_KEYWORDS = {
    comportement: ['attentif', 'sérieux', 'calme', 'respectueux', 'bavard', 'agité', 'dispersé', 'participe', 'discret', 'moteur', 'agréable'],
    travail: ['régulier', 'investi', 'autonome', 'volontaire', 'approfondi', 'superficiel', 'irrégulier', 'manque de méthode', 'soigné', 'brouillon', 'pertinent'],
    strengths: ['curiosité', 'rigueur', 'analyse', 'logique', 'créativité', 'participation active', 'esprit de synthèse', 'aisance à l\'oral', 'bonnes bases', 'solides compétences'],
    areasForImprovement: ['concentration', 'apprendre les leçons', 'soigner le travail', 'participer davantage', 'oser poser des questions', 'gagner en autonomie', 'approfondir la réflexion', 'être plus régulier'],
};
const API_KEY_SESSION_STORAGE = 'gemini-api-key';

// --- STATE ---
let allGeneratedComments = [];
let userApiKey = null;
const isAiStudio = !!window.aistudio;

// --- DOM ELEMENTS ---
const form = document.getElementById('comment-form');
const generateButton = document.getElementById('generate-button');
const resetButton = document.getElementById('reset-button');
const copyButton = document.getElementById('copy-button');
const downloadButton = document.getElementById('download-button');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultLoader = document.getElementById('result-loader');
const generatedCommentEl = document.getElementById('generated-comment');
const apiErrorContainer = document.getElementById('api-error-container');
const resultActions = document.getElementById('result-actions');
const savedCountContainer = document.getElementById('saved-count-container');
const savedCountEl = document.getElementById('saved-count');
const downloadCountEl = document.getElementById('download-count');
const mainContent = document.querySelector('main');

// API Key Modal Elements
const apiKeyOverlay = document.getElementById('api-key-overlay');
const aistudioPrompt = document.getElementById('aistudio-key-prompt');
const selectApiKeyButton = document.getElementById('select-api-key-button');
const manualPrompt = document.getElementById('manual-key-prompt');
const manualKeyForm = document.getElementById('manual-key-form');
const apiKeyInput = document.getElementById('apiKeyInput');
const manualKeyError = document.getElementById('manual-key-error');


// --- GEMINI SERVICE ---
async function generateComment(formData, apiKey) {
    const {
        studentName, subject, gender, performanceLevel, comportement,
        travail, strengths, areasForImprovement, tone,
        commentSections, commentLength
    } = formData;

    const buildSection = (sections, details, detailsLabel, sectionName) => {
        if (sections.includes(sectionName.toUpperCase())) {
            if (details.trim()) return { withDetails: `- ${detailsLabel} (détails fournis) : "${details}"`, toGenerate: null };
            return { withDetails: null, toGenerate: detailsLabel };
        }
        return { withDetails: null, toGenerate: null };
    };

    const sections = [
        buildSection(commentSections, comportement, 'Comportement en classe', 'COMPORTEMENT'),
        buildSection(commentSections, travail, 'Investissement et méthode de travail', 'TRAVAIL'),
        buildSection(commentSections, strengths, 'Points forts et compétences', 'NIVEAU'),
        buildSection(commentSections, areasForImprovement, 'Axes d\'amélioration et conseils', 'CONSEILS')
    ];

    const sectionsWithDetails = sections.map(s => s.withDetails).filter(Boolean);
    const sectionsToGenerate = sections.map(s => s.toGenerate).filter(Boolean);
    
    let detailsPromptSection = '';
    if (sectionsWithDetails.length > 0) {
        detailsPromptSection += `
        Voici les détails fournis par l'enseignant à intégrer impérativement :
        ${sectionsWithDetails.join('\n        ')}
        `;
    }
    if (sectionsToGenerate.length > 0) {
        detailsPromptSection += `
        En te basant sur le niveau général de l'élève ("${performanceLevel}"), rédige également des commentaires pour les volets suivants, pour lesquels aucun détail n'a été fourni :
        - ${sectionsToGenerate.join('\n        - ')}
        `;
    }

    const prompt = `
        Agis en tant que professeur principal expérimenté et pédagogue. Rédige une appréciation personnalisée, constructive et nuancée pour le bulletin scolaire d'un élève.

        Informations sur l'élève :
        - Prénom : ${studentName}
        - Genre : ${gender}. Tu dois impérativement faire les accords en genre (masculin/féminin) nécessaires dans toute l'appréciation.
        - Matière : ${subject}
        - Description du niveau général : "${performanceLevel}"
        ${detailsPromptSection}

        Consignes pour la rédaction :
        1.  Le ton de l'appréciation doit être impérativement : **${tone}**.
        2.  L'appréciation doit faire environ **${commentLength} lignes**.
        3.  Structure l'appréciation en abordant TOUS les volets demandés (ceux avec détails et ceux à générer) dans un ordre logique et fluide. Ne mentionne pas explicitement le nom des volets (ex: "Concernant son comportement..."). L'ensemble doit être un paragraphe unique et cohérent.
        4.  Commence directement par l'appréciation, sans formule d'introduction comme "Voici une proposition :".
        5.  Personnalise le commentaire en utilisant le prénom de l'élève au moins une fois de manière naturelle.
        6.  Assure-toi que le commentaire est cohérent avec toutes les informations fournies.
        7.  Transforme les "axes d'amélioration" en conseils positifs et réalisables plutôt qu'en reproches.

        Ne retourne que le texte de l'appréciation finale.
    `;
    
    try {
        const effectiveApiKey = isAiStudio ? process.env.API_KEY : apiKey;
        if (!effectiveApiKey) {
            throw new Error("API Key is missing.");
        }
        const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating comment:", error);
        if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission') || error.message.includes('not found') || error.message.includes('API Key is missing') || error.message.includes("API key and token authentication are disabled"))) {
             throw new Error("Invalid API Key");
        }
        throw new Error("Une erreur est survenue lors de la génération. Veuillez réessayer.");
    }
}


// --- UI & EVENT HANDLERS ---

function setLoadingState(isLoading) {
    generateButton.disabled = isLoading;
    generateButton.querySelector('.btn-text').classList.toggle('hidden', isLoading);
    generateButton.querySelector('.btn-loader').classList.toggle('hidden', !isLoading);
    resultLoader.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        generatedCommentEl.textContent = '';
        apiErrorContainer.classList.add('hidden');
        resultPlaceholder.classList.add('hidden');
    }
}

function validateForm() {
    let isValid = true;
    document.querySelectorAll('[id$="-error"]').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
    document.querySelectorAll('input[required], select[required]').forEach(el => {
        el.classList.remove('border-red-500');
    });

    const studentName = document.getElementById('studentName');
    if (!studentName.value.trim()) {
        document.getElementById('studentName-error').textContent = "Le prénom de l'élève est requis.";
        document.getElementById('studentName-error').classList.remove('hidden');
        studentName.classList.add('border-red-500');
        isValid = false;
    }

    const subject = document.getElementById('subject');
    if (!subject.value.trim()) {
        document.getElementById('subject-error').textContent = "La matière est requise.";
        document.getElementById('subject-error').classList.remove('hidden');
        subject.classList.add('border-red-500');
        isValid = false;
    }

    if (form.querySelectorAll('input[name="commentSections"]:checked').length === 0) {
        document.getElementById('commentSections-error').textContent = "Veuillez sélectionner au moins un volet.";
        document.getElementById('commentSections-error').classList.remove('hidden');
        isValid = false;
    }

    return isValid;
}

function handleInvalidApiKey() {
    mainContent.classList.add('hidden');
    apiKeyOverlay.classList.remove('hidden');

    if (isAiStudio) {
        aistudioPrompt.classList.remove('hidden');
        manualPrompt.classList.add('hidden');
        apiErrorContainer.textContent = "La clé API sélectionnée n'est pas valide. Veuillez en sélectionner une nouvelle.";
    } else {
        sessionStorage.removeItem(API_KEY_SESSION_STORAGE);
        userApiKey = null;
        manualPrompt.classList.remove('hidden');
        aistudioPrompt.classList.add('hidden');
        manualKeyError.textContent = "La clé API fournie n'est pas valide. Veuillez réessayer.";
        manualKeyError.classList.remove('hidden');
        apiKeyInput.value = '';
    }
}


async function handleGenerate(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoadingState(true);

    const formData = {
        studentName: document.getElementById('studentName').value,
        subject: document.getElementById('subject').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        performanceLevel: document.getElementById('performanceLevel').value,
        comportement: document.getElementById('comportement').value,
        travail: document.getElementById('travail').value,
        strengths: document.getElementById('strengths').value,
        areasForImprovement: document.getElementById('areasForImprovement').value,
        tone: document.getElementById('tone').value,
        commentSections: Array.from(form.querySelectorAll('input[name="commentSections"]:checked')).map(el => el.value),
        commentLength: document.getElementById('commentLength').value,
    };

    try {
        const comment = await generateComment(formData, userApiKey);
        generatedCommentEl.textContent = comment;
        resultActions.classList.remove('hidden');
        copyButton.classList.remove('hidden');

        allGeneratedComments.push({
            studentName: formData.studentName,
            subject: formData.subject,
            comment: comment
        });
        updateSavedCount();

    } catch (err) {
        if (err.message && err.message.includes('Invalid API Key')) {
            handleInvalidApiKey();
        } else {
            apiErrorContainer.textContent = err.message;
            apiErrorContainer.classList.remove('hidden');
        }
        resultPlaceholder.classList.remove('hidden');
    } finally {
        setLoadingState(false);
    }
}

function handleReset() {
    form.reset();
    generatedCommentEl.textContent = '';
    apiErrorContainer.classList.add('hidden');
    resultPlaceholder.classList.remove('hidden');
    resultActions.classList.add('hidden');
    validateForm();
}

function handleCopy() {
    if (!generatedCommentEl.textContent) return;
    navigator.clipboard.writeText(generatedCommentEl.textContent);
    
    copyButton.querySelector('.copy-text').classList.add('hidden');
    copyButton.querySelector('.copied-text').classList.remove('hidden');
    setTimeout(() => {
        copyButton.querySelector('.copy-text').classList.remove('hidden');
        copyButton.querySelector('.copied-text').classList.add('hidden');
    }, 2000);
}

function handleDownloadAll() {
    if (allGeneratedComments.length === 0) return;

    const escapeCsvField = (field) => {
        let stringField = String(field).replace(/"/g, '""');
        if (stringField.search(/("|,|\n)/g) >= 0) return `"${stringField}"`;
        return stringField;
    };

    const header = ['Élève', 'Matière', 'Appréciation'];
    const rows = allGeneratedComments.map(entry => [
        escapeCsvField(entry.studentName),
        escapeCsvField(entry.subject),
        escapeCsvField(entry.comment)
    ].join(','));

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appreciations.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateSavedCount() {
    const count = allGeneratedComments.length;
    if (count > 0) {
        savedCountEl.textContent = count;
        downloadCountEl.textContent = count;
        savedCountContainer.classList.remove('hidden');
        resultActions.classList.remove('hidden');
        downloadButton.classList.remove('hidden');
    } else {
        savedCountContainer.classList.add('hidden');
        if(!generatedCommentEl.textContent) {
           resultActions.classList.add('hidden');
        }
    }
}

function renderSuggestionKeywords() {
    Object.entries(SUGGESTION_KEYWORDS).forEach(([field, keywords]) => {
        const container = document.getElementById(`suggestions-${field}`);
        if (container) {
            container.innerHTML = '';
            keywords.forEach(keyword => {
                const span = document.createElement('span');
                span.dataset.field = field;
                span.dataset.keyword = keyword;
                span.textContent = keyword;
                span.className = "suggestion-btn cursor-pointer px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500";
                container.appendChild(span);
            });
        }
    });
}

function handleSuggestionClick(e) {
    if (!e.target.classList.contains('suggestion-btn')) return;
    
    const { field, keyword } = e.target.dataset;
    const textarea = document.getElementById(field);
    textarea.value = textarea.value.trim() ? `${textarea.value.trim()}, ${keyword}` : keyword;
    textarea.focus();
}

async function handleSelectApiKey() {
    try {
        await window.aistudio.openSelectKey();
        apiKeyOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } catch(e) {
        console.error("Could not open API key selection:", e);
    }
}

function handleManualKeySubmit(e) {
    e.preventDefault();
    const key = apiKeyInput.value.trim();
    if (key) {
        userApiKey = key;
        sessionStorage.setItem(API_KEY_SESSION_STORAGE, key);
        apiKeyOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        manualKeyError.classList.add('hidden');
    } else {
        manualKeyError.textContent = "Veuillez entrer une clé API.";
        manualKeyError.classList.remove('hidden');
    }
}

// --- INITIALIZATION ---
async function initializeApp() {
    form.addEventListener('submit', handleGenerate);
    resetButton.addEventListener('click', handleReset);
    copyButton.addEventListener('click', handleCopy);
    downloadButton.addEventListener('click', handleDownloadAll);
    document.body.addEventListener('click', handleSuggestionClick);

    if (isAiStudio) {
        aistudioPrompt.classList.remove('hidden');
        selectApiKeyButton.addEventListener('click', handleSelectApiKey);
        
        if (await window.aistudio.hasSelectedApiKey()) {
            mainContent.classList.remove('hidden');
        } else {
            apiKeyOverlay.classList.remove('hidden');
        }
    } else {
        manualPrompt.classList.remove('hidden');
        manualKeyForm.addEventListener('submit', handleManualKeySubmit);
        const savedKey = sessionStorage.getItem(API_KEY_SESSION_STORAGE);
        if (savedKey) {
            userApiKey = savedKey;
            mainContent.classList.remove('hidden');
        } else {
            apiKeyOverlay.classList.remove('hidden');
        }
    }

    renderSuggestionKeywords();
    if (allGeneratedComments.length === 0) downloadButton.classList.add('hidden');
    if(!generatedCommentEl.textContent) copyButton.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initializeApp);
