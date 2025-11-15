import React, { useState, useCallback } from 'react';
import { PerformanceLevel, CommentTone, Gender, CommentLength, COMMENT_SECTIONS } from './types';
import type { FormData, CommentSection } from './types';
import { PERFORMANCE_LEVEL_OPTIONS, TONE_OPTIONS, GENDER_OPTIONS, COMMENT_SECTIONS_OPTIONS, COMMENT_LENGTH_OPTIONS } from './constants';
import { generateComment } from './services/geminiService';
import { SparklesIcon, ClipboardIcon, CheckIcon } from './components/icons';

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        studentName: '',
        subject: '',
        gender: Gender.GARCON,
        performanceLevel: PerformanceLevel.BON,
        comportement: '',
        travail: '',
        strengths: '',
        areasForImprovement: '',
        tone: CommentTone.ENCOURAGEANT,
        commentSections: Object.keys(COMMENT_SECTIONS) as CommentSection[],
        commentLength: CommentLength.MOYEN,
    });
    const [generatedComment, setGeneratedComment] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSectionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const section = value as CommentSection;
        setFormData(prev => {
            const currentSections = prev.commentSections;
            if (checked) {
                // Add section if not already present
                return { ...prev, commentSections: [...new Set([...currentSections, section])] };
            } else {
                // Remove section
                return { ...prev, commentSections: currentSections.filter(s => s !== section) };
            }
        });
    }, []);


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentName || !formData.subject) {
            setError("Le prénom de l'élève et la matière sont requis.");
            return;
        }
        if (formData.commentSections.length === 0) {
            setError("Veuillez sélectionner au moins un volet pour l'appréciation.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedComment('');
        try {
            const comment = await generateComment(formData);
            setGeneratedComment(comment);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = useCallback(() => {
        if (generatedComment) {
            navigator.clipboard.writeText(generatedComment);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [generatedComment]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Générateur d'Appréciations</h1>
                    <p className="mt-3 text-lg text-slate-600">Créez des commentaires de bulletin personnalisés et constructifs en quelques secondes.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Form Section */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            {/* Student Info */}
                            <fieldset>
                                <legend className="text-2xl font-semibold text-slate-800 border-b pb-3 mb-6 w-full">Informations de l'élève</legend>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 mb-1">Prénom de l'élève</label>
                                            <input type="text" id="studentName" name="studentName" value={formData.studentName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Lucas" required />
                                        </div>
                                        <div>
                                            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Matière</label>
                                            <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Mathématiques" required />
                                        </div>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Genre</label>
                                        <div className="flex items-center gap-x-4">
                                            {GENDER_OPTIONS.map(opt => (
                                                <div key={opt.value} className="flex items-center">
                                                    <input id={opt.value} name="gender" type="radio" value={opt.value} checked={formData.gender === opt.value} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                                    <label htmlFor={opt.value} className="ml-2 block text-sm text-slate-800">{opt.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            
                            {/* Evaluation Details */}
                             <fieldset>
                                <legend className="text-2xl font-semibold text-slate-800 border-b pb-3 mb-6 pt-4 w-full">Évaluation Pédagogique</legend>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="performanceLevel" className="block text-sm font-medium text-slate-700 mb-1">Niveau général</label>
                                        <select id="performanceLevel" name="performanceLevel" value={formData.performanceLevel} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                                            {PERFORMANCE_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="comportement" className="block text-sm font-medium text-slate-700 mb-1">Comportement en classe</label>
                                        <textarea id="comportement" name="comportement" value={formData.comportement} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Attentif, bavard, respectueux..."></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="travail" className="block text-sm font-medium text-slate-700 mb-1">Investissement et méthode de travail</label>
                                        <textarea id="travail" name="travail" value={formData.travail} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Volontaire, autonome, manque de régularité..."></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="strengths" className="block text-sm font-medium text-slate-700 mb-1">Points forts / Compétences acquises</label>
                                        <textarea id="strengths" name="strengths" value={formData.strengths} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Curiosité, participation active, rigueur..."></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="areasForImprovement" className="block text-sm font-medium text-slate-700 mb-1">Axes d'amélioration / Conseils</label>
                                        <textarea id="areasForImprovement" name="areasForImprovement" value={formData.areasForImprovement} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="ex: Manque de concentration, apprendre ses leçons..."></textarea>
                                    </div>
                                </div>
                             </fieldset>

                            {/* Customization */}
                            <fieldset>
                                <legend className="text-2xl font-semibold text-slate-800 border-b pb-3 mb-6 pt-4 w-full">Personnalisation</legend>
                                <div className="space-y-6">
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Volets à inclure dans l'appréciation</label>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {COMMENT_SECTIONS_OPTIONS.map(opt => (
                                                <div key={opt.value} className="relative flex items-start">
                                                    <div className="flex h-6 items-center">
                                                        <input id={opt.value} value={opt.value} name="commentSections" type="checkbox" checked={formData.commentSections.includes(opt.value)} onChange={handleSectionChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                    </div>
                                                    <div className="ml-3 text-sm leading-6">
                                                        <label htmlFor={opt.value} className="font-medium text-slate-800">{opt.label}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="commentLength" className="block text-sm font-medium text-slate-700 mb-1">Longueur de l'appréciation</label>
                                        <select id="commentLength" name="commentLength" value={formData.commentLength} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                                            {COMMENT_LENGTH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-1">Ton de l'appréciation</label>
                                        <select id="tone" name="tone" value={formData.tone} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                                            {TONE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </fieldset>

                            <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Génération en cours...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5 mr-2" />
                                        Générer l'appréciation
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Result Section */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 sticky top-8">
                        <h2 className="text-2xl font-semibold text-slate-800 border-b pb-3 mb-6">Appréciation générée</h2>
                        
                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}

                        <div className="min-h-[250px] bg-slate-50 rounded-md p-4 relative">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-md">
                                    <p className="text-slate-500">Rédaction en cours...</p>
                                </div>
                            )}
                            {!isLoading && !generatedComment && !error && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-slate-400 text-center">L'appréciation apparaîtra ici.</p>
                                </div>
                            )}
                            {generatedComment && (
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{generatedComment}</p>
                            )}
                        </div>

                        {generatedComment && (
                            <button onClick={handleCopy} className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                {isCopied ? (
                                    <>
                                        <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
                                        Copié !
                                    </>
                                ) : (
                                    <>
                                        <ClipboardIcon className="w-5 h-5 mr-2" />
                                        Copier le texte
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;