import React from 'react';


const AuthLayout = ({ 
  children, 
  leftPanelContent, 
  showLeftPanel = true,
  className = '' 
}) => {
  return (
    <div className={`min-h-screen w-full ${className}`}>
      {/* Desktop and Tablet: Grid layout */}
      <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Hidden on mobile, 2/5 on tablet, 1/2 on desktop */}
        {showLeftPanel && leftPanelContent && (
          <div className="md:col-span-2 lg:col-span-1 bg-ifpb-gradient">
            {leftPanelContent}
          </div>
        )}
        
        {/* Right Panel - 3/5 on tablet, 1/2 on desktop */}
        <div className={`${showLeftPanel && leftPanelContent ? 'md:col-span-3 lg:col-span-1' : 'md:col-span-5 lg:col-span-2'} bg-white flex items-center justify-center`}>
            <div className="w-full max-w-2xl px-6 py-8">
                {children}
            </div>
        </div>

      {/* Mobile: Single column layout */}
      <div className="md:hidden min-h-screen bg-white flex flex-col">
        {/* Compact header with logo for mobile */}
        {showLeftPanel && (
          <div className="bg-ifpb-gradient-light px-6 py-4 flex items-center justify-center">
            <div className="text-white text-center">
              <h1 className="text-xl font-bold">IFPB</h1>
              <p className="text-sm opacity-90">IFMeetup</p>
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AuthLayout;