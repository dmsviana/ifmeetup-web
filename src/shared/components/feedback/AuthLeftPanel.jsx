import React from 'react';
import LoginIllustration from './LoginIllustration';

const AuthLeftPanel = ({ className = '' }) => {
    return (
        <div className={`relative flex flex-col justify-center items-center p-8 text-white ${className}`}>
            {/* Gradiente no background */}

            {/* IFPB Logo */}
            <div className="text-center mb-8">
                <div className="mb-4">
                    {/* IFMeetup Logo */}
                    <div className="w-48 h-48 mx-auto flex items-center justify-center mb-4">
                        <img 
                            src="/src/assets/ifmeetup-logo.svg" 
                            alt="IFMeetup Logo" 
                            className="w-full h-full filter brightness-0 invert"
                        />
                    </div>
                </div>
            </div>

            {/* Ilustração de Login */}
            <div className="mb-8 flex-1 flex items-center justify-center max-w-sm">
                <LoginIllustration className="w-full max-w-xs" />
            </div>

            {/* Conteúdo Motivacional */}
            <div className="text-center max-w-sm mb-8">
                <h2 className="text-lg font-semibold mb-3 text-green-100">
                    Bem-vindo ao IFMeetup
                </h2>

                <div className="flex items-center justify-center space-x-4 text-xs text-green-100 opacity-75">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Seguro
                    </div>
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Rápido
                    </div>
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confiável
                    </div>
                </div>
            </div>

            {/* Rodaé */}
            <div className="mt-auto text-center">
                <p className="text-xs text-green-100 opacity-60">
                    © 2025 Instituto Federal da Paraíba - Campus Monteiro
                </p>
            </div>
        </div>
    );
};

export default AuthLeftPanel;