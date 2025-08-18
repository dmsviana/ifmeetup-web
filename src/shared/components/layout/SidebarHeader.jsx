import { Link } from 'react-router-dom';

const SidebarHeader = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      {/* logo e branding */}
      <Link 
        to="/home" 
        className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-green-600 transition-colors"
      >
        {/* logo IFPB */}
        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">IF</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">IFMeetup</span>
        </div>
      </Link>
      
      {/* botão fechar para mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Fechar menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;