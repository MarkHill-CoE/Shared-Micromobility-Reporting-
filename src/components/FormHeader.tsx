import React from 'react';

interface FormHeaderProps {
  isEmbedded: boolean;
  viewMode: 'wizard' | 'single';
  onToggleViewMode: (mode: 'wizard' | 'single') => void;
  onOpenEmbedModal?: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = () => {
  return (
    <header className="mb-6 border-b border-[#D0D7DE] pb-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#193A5A] text-balance">
          Rental E-Scooter or E-Bike Issue Reporting
        </h1>
        <p className="mt-2 text-sm text-[#444444] leading-relaxed max-w-3xl">
          By completing this form you help ensure that rental e-bikes and e-scooters are safely managed and properly maintained.
        </p>
      </div>
    </header>
  );
};
