import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  VSCodeDropdown, 
  VSCodeOption, 
  VSCodeButton 
} from '@vscode/webview-ui-toolkit/react';
import { 
  getAllProfiles, 
  getActiveProfile, 
  switchProfile, 
  type PromptProfile 
} from '../../data/contextPromptManager';

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
`;

const DropdownContainer = styled.div`
  flex: 1;
`;

const ProfileDescription = styled.div`
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--vscode-descriptionForeground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.25rem 0;
`;

const ProfileOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DefaultBadge = styled.span`
  background-color: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

interface ProfileSelectorProps {
  onManageClick?: () => void;
  onProfileChange?: (profile: PromptProfile) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  onManageClick,
  onProfileChange
}) => {
  const [profiles, setProfiles] = useState<PromptProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = getAllProfiles();
      const activeProfile = getActiveProfile();
      
      setProfiles(allProfiles);
      setActiveProfileId(activeProfile.id);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei profili:', error);
      setLoading(false);
    }
  };

  const handleProfileChange = async (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const profileId = select.value;
    
    try {
      const profile = await switchProfile(profileId);
      setActiveProfileId(profileId);
      
      if (onProfileChange) {
        onProfileChange(profile);
      }
    } catch (error) {
      console.error('Errore nel cambio di profilo:', error);
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <Container>
      <DropdownContainer>
        <VSCodeDropdown
          onChange={handleProfileChange}
          value={activeProfileId}
          disabled={loading || profiles.length === 0}
        >
          {profiles.map(profile => (
            <VSCodeOption key={profile.id} value={profile.id}>
              {profile.name} {profile.isDefault && '⭐'}
            </VSCodeOption>
          ))}
        </VSCodeDropdown>
        
        {activeProfile && activeProfile.description && (
          <ProfileDescription>
            {activeProfile.description}
            {activeProfile.isDefault && <DefaultBadge>Predefinito</DefaultBadge>}
          </ProfileDescription>
        )}
      </DropdownContainer>
      
      <VSCodeButton 
        appearance="secondary"
        onClick={onManageClick}
        disabled={loading}
      >
        Gestisci profili
      </VSCodeButton>
    </Container>
  );
}; 