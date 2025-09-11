import React, { useState } from 'react';
import { UserProfileSidebar } from "@/components/settings/UserProfileSidebar";
import { ProfileSection } from "@/components/settings/sections/ProfileSection";
import { AdvancedSettingsManager } from "@/components/settings/AdvancedSettingsManager";

import { AboutSection } from "@/components/settings/sections/AboutSection";
import { LicenseActivation } from "@/components/ui/license-activation";

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'settings':
        return <AdvancedSettingsManager />;
      case 'about':
        return <AboutSection />;
      case 'activation':
        return <LicenseActivation />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-6">
        <UserProfileSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="flex-1">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}