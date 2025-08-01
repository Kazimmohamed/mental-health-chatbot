import React from 'react';

const Button = ({ 
  variant = 'primary',
  isLoading = false,
  children,
  ...props 
}) => {
  const baseClasses = "rounded-lg px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-70";
  
  const variantClasses = {
    primary: "bg-indigo-500 hover:bg-indigo-600 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : children}
    </button>
  );
};

export default Button;