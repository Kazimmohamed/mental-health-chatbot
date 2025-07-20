// sessionTitle.jsx
import React from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';

const SessionTitle = ({ title, className = "" }) => {
  // If no title, show default with sparkle icon
  if (!title || title.trim() === "") {
    return (
      <div className={`flex items-center ${className}`}>
        <HiOutlineSparkles className="h-4 w-4 text-yellow-500 mr-1" />
        <span>New Conversation</span>
      </div>
    );
  }

  // If title is too long, truncate it
  const truncate = (text, maxLength = 35) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={className}>
      {truncate(title)}
    </div>
  );
};

export default SessionTitle;