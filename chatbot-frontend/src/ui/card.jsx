import React from 'react';

const Card = ({ children, className, ...props }) => (
  <div 
    className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className, ...props }) => (
  <div 
    className={`px-6 py-4 border-b border-gray-100 ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-medium text-indigo-700 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className }) => (
  <p className={`mt-1 text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className }) => (
  <div className={`px-6 py-4 bg-gray-50 ${className}`}>
    {children}
  </div>
);

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
};