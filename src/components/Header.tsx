import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white relative">
      {children && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {children}
        </div>
      )}
      <div className="flex items-center gap-4 mb-2">
        <img src="/images/logo-v2.png" alt="US Aignan Logo" className="h-24" />
        <div>
          <h1 className="text-4xl font-bold">US AIGNAN</h1>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
      </div>
      <p className="text-red-100 pl-16">{subtitle}</p>
    </div>
  );
};
