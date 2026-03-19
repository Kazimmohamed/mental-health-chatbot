import React from 'react';

const Input = ({ 
  className = '',
  type = 'text',
  ...props 
}) => (
  <input
    type={type}
    className={`w-full rounded-md border border-gray-300 bg-transparent px-4 py-2 text-gray-700 placeholder-gray-400 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 ${className}`}
    {...props}
  />
);

export default Input;
