import { Tab } from '@headlessui/react';
import { UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const LoginToggle = ({ loginType, onToggle, disabled = false }) => {
  const tabs = [
    {
      id: 'traditional',
      label: 'Login Tradicional',
      icon: UserIcon,
      description: 'Entre com email e senha'
    },
    {
      id: 'suap',
      label: 'Login SUAP',
      icon: AcademicCapIcon,
      description: 'Entre com sua matrícula institucional'
    }
  ];

  const selectedIndex = loginType === 'traditional' ? 0 : 1;

  return (
    <div className="w-full max-w-md mx-auto">
      <Tab.Group 
        selectedIndex={selectedIndex} 
        onChange={(index) => {
          if (!disabled) {
            onToggle(index === 0 ? 'traditional' : 'suap');
          }
        }}
      >
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              disabled={disabled}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 px-3 text-sm font-medium leading-5 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-100 hover-lift ${
                  selected
                    ? 'bg-white text-ifpb-primary shadow-md ring-1 ring-primary-200 hover-glow'
                    : disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-white/80 hover:text-ifpb-secondary hover:shadow-sm'
                }`
              }
              aria-label={`Alternar para ${tab.label}`}
              aria-describedby={`${tab.id}-description`}
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === 'traditional' ? 'Email' : 'SUAP'}
                </span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        
        {/* Screen reader descriptions */}
        <div className="sr-only">
          {tabs.map((tab) => (
            <div key={`${tab.id}-description`} id={`${tab.id}-description`}>
              {tab.description}
            </div>
          ))}
        </div>
        
        {/* Visual indicator for current selection */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {tabs[selectedIndex].description}
          </p>
        </div>
      </Tab.Group>
    </div>
  );
};

export default LoginToggle;