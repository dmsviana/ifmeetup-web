import React from 'react';

/**
 * LoginIllustration - Educational/events themed SVG illustration for login page
 * Features responsive sizing, subtle animations, and IFPB institutional elements
 */
const LoginIllustration = ({ className = '' }) => {
    return (
        <div className={`relative w-full max-w-sm mx-auto ${className}`}>
            <svg
                viewBox="0 0 400 300"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Background elements */}
                <defs>
                    {/* Gradient definitions */}
                    <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                    </linearGradient>
                    
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.8)" />
                        <stop offset="100%" stopColor="rgba(21,128,61,0.8)" />
                    </linearGradient>

                    <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                        <stop offset="100%" stopColor="rgba(243,244,246,0.95)" />
                    </linearGradient>

                    {/* Animation definitions */}
                    <style>
                        {`
                            .float-animation {
                                animation: float 3s ease-in-out infinite;
                            }
                            .float-animation-delayed {
                                animation: float 3s ease-in-out infinite;
                                animation-delay: 1s;
                            }
                            .pulse-animation {
                                animation: pulse 2s ease-in-out infinite;
                            }
                            .slide-animation {
                                animation: slideIn 4s ease-in-out infinite;
                            }
                            
                            @keyframes float {
                                0%, 100% { transform: translateY(0px); }
                                50% { transform: translateY(-8px); }
                            }
                            
                            @keyframes pulse {
                                0%, 100% { opacity: 0.7; }
                                50% { opacity: 1; }
                            }
                            
                            @keyframes slideIn {
                                0%, 100% { transform: translateX(0px); }
                                50% { transform: translateX(5px); }
                            }
                        `}
                    </style>
                </defs>

                {/* Background building/campus */}
                <g className="float-animation-delayed">
                    {/* Main building */}
                    <rect
                        x="50"
                        y="120"
                        width="120"
                        height="100"
                        fill="url(#buildingGradient)"
                        rx="4"
                        opacity="0.8"
                    />
                    
                    {/* Building windows */}
                    <rect x="65" y="135" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="90" y="135" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="115" y="135" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="140" y="135" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    
                    <rect x="65" y="160" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="90" y="160" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="115" y="160" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    <rect x="140" y="160" width="15" height="15" fill="rgba(34,197,94,0.6)" rx="2" />
                    
                    {/* Building entrance */}
                    <rect x="100" y="185" width="20" height="35" fill="rgba(21,128,61,0.8)" rx="10" />
                </g>

                {/* Event/meeting room scene */}
                <g className="float-animation">
                    {/* Conference table */}
                    <ellipse
                        cx="280"
                        cy="180"
                        rx="60"
                        ry="25"
                        fill="rgba(255,255,255,0.9)"
                        opacity="0.8"
                    />
                    
                    {/* Chairs around table */}
                    <circle cx="240" cy="165" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="260" cy="155" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="300" cy="155" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="320" cy="165" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="320" cy="195" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="300" cy="205" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="260" cy="205" r="8" fill="rgba(255,255,255,0.8)" />
                    <circle cx="240" cy="195" r="8" fill="rgba(255,255,255,0.8)" />
                </g>

                {/* Presentation screen/board */}
                <g className="slide-animation">
                    <rect
                        x="200"
                        y="80"
                        width="80"
                        height="50"
                        fill="url(#screenGradient)"
                        rx="4"
                        opacity="0.9"
                    />
                    
                    {/* Screen content - simplified IFMeetup interface */}
                    <rect x="210" y="90" width="60" height="8" fill="rgba(255,255,255,0.8)" rx="2" />
                    <rect x="210" y="105" width="40" height="6" fill="rgba(255,255,255,0.6)" rx="1" />
                    <rect x="210" y="115" width="50" height="6" fill="rgba(255,255,255,0.6)" rx="1" />
                    
                    {/* Screen stand */}
                    <rect x="235" y="130" width="10" height="20" fill="rgba(255,255,255,0.7)" />
                    <rect x="225" y="150" width="30" height="8" fill="rgba(255,255,255,0.7)" rx="4" />
                </g>

                {/* Books/educational elements */}
                <g className="float-animation-delayed">
                    {/* Stack of books */}
                    <rect x="80" y="200" width="40" height="8" fill="url(#bookGradient)" rx="2" />
                    <rect x="85" y="192" width="35" height="8" fill="rgba(34,197,94,0.8)" rx="2" />
                    <rect x="90" y="184" width="30" height="8" fill="rgba(21,128,61,0.8)" rx="2" />
                </g>

                {/* Floating elements - documents/papers */}
                <g className="pulse-animation">
                    <rect x="320" y="100" width="20" height="25" fill="rgba(255,255,255,0.8)" rx="2" />
                    <rect x="325" y="105" width="10" height="2" fill="rgba(34,197,94,0.6)" rx="1" />
                    <rect x="325" y="110" width="12" height="2" fill="rgba(34,197,94,0.6)" rx="1" />
                    <rect x="325" y="115" width="8" height="2" fill="rgba(34,197,94,0.6)" rx="1" />
                </g>

                {/* Calendar/schedule element */}
                <g className="float-animation">
                    <rect x="60" y="80" width="30" height="35" fill="rgba(255,255,255,0.9)" rx="3" />
                    
                    {/* Calendar header */}
                    <rect x="60" y="80" width="30" height="8" fill="rgba(34,197,94,0.8)" rx="3" />
                    
                    {/* Calendar grid */}
                    <circle cx="68" cy="95" r="2" fill="rgba(34,197,94,0.6)" />
                    <circle cx="75" cy="95" r="2" fill="rgba(34,197,94,0.6)" />
                    <circle cx="82" cy="95" r="2" fill="rgba(34,197,94,0.6)" />
                    
                    <circle cx="68" cy="102" r="2" fill="rgba(34,197,94,0.6)" />
                    <circle cx="75" cy="102" r="2" fill="rgba(21,128,61,0.8)" />
                    <circle cx="82" cy="102" r="2" fill="rgba(34,197,94,0.6)" />
                    
                    <circle cx="68" y="109" r="2" fill="rgba(34,197,94,0.6)" />
                    <circle cx="75" cy="109" r="2" fill="rgba(34,197,94,0.6)" />
                    <circle cx="82" cy="109" r="2" fill="rgba(34,197,94,0.6)" />
                </g>

                {/* Connecting lines/network effect */}
                <g className="pulse-animation" opacity="0.4">
                    <line x1="170" y1="140" x2="200" y2="120" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="120" y1="160" x2="200" y2="180" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="90" y1="100" x2="200" y2="105" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="3,3" />
                </g>

                {/* Subtle IFPB logo integration */}
                <g className="pulse-animation" opacity="0.6">
                    <circle cx="350" cy="50" r="20" fill="rgba(255,255,255,0.2)" />
                    <text x="350" y="55" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontWeight="bold">
                        IFPB
                    </text>
                </g>
            </svg>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white bg-opacity-0 hover:bg-opacity-5 transition-all duration-300 rounded-lg" />
        </div>
    );
};

export default LoginIllustration;