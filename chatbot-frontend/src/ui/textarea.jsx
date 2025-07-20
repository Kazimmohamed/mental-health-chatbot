import React from 'react';

const Textarea = ({ 
  className = '',
  rows = 4,
  minHeight = '60px',
  ...props 
}) => (
  <textarea
    style={{ minHeight }}
    rows={rows}
    className={`w-full rounded-md border border-gray-300 bg-transparent px-4 py-3 text-gray-700 placeholder-gray-400 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 ${className}`}
    placeholder="Write how you're feeling..."
    {...props}
  />
);

export default Textarea;
