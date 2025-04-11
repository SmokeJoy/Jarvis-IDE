import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeTextField,
  VSCodeTextArea,
  VSCodeCheckbox,
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView
} from '@vscode/webview-ui-toolkit/react';
import { 
  getAllProfiles,
  getActiveProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  setProfileAsDefault,
  type PromptProfile
} from '../../data/contextPromptManager';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContainer = styled.div`
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vscode-widget-border);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: var(--vscode-editor-foreground);
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--vscode-widget-border);
`;

const ProfileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ProfileItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.isActive 
    ? 'var(--vscode-list-activeSelectionBackground)'
    : 'var(--vscode-list-hoverBackground)'};
  color: ${props => props.isActive 
    ? 'var(--vscode-list-activeSelectionForeground)'
    : 'var(--vscode-editor-foreground)'};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.isActive 
      ? 'var(--vscode-list-activeSelectionBackground)'
      : 'var(--vscode-list-hoverBackground)'};
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ProfileName = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const ProfileDescription = styled.div`
  font-size: 0.85rem;
  color: var(--vscode-descriptionForeground);
`;

const ProfileActions = styled.div`
  display: flex;
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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  font-size: 0.9rem;
  color: var(--vscode-editor-foreground);
`;

const ProfileDetails = styled.div`
  padding: 1rem;
  border: 1px solid var(--vscode-widget-border);
  border-radius: 4px;
  background-color: var(--vscode-input-background);
`;

const NoProfileSelected = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--vscode-descriptionForeground);
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border);
  border-radius: 4px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 150;
  width: 400px;
  max-width: 90%;
`;

const ConfirmMessage = styled.p`
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--vscode-editor-foreground);
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

interface ProfileManagerModalProps {
  onClose: () => void;
  onProfileChange?: (profile: PromptProfile) => void;
}

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  onClose,
  onProfileChange
}) => {
  const [profiles, setProfiles] = useState<PromptProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [profileForm, setProfileForm] = useState<{
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
  }>({
    id: '',
    name: '',
    description: '',
    isDefault: false
  });
  
  // Confirmation dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  
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
      
      // Select the active profile by default
      if (!selectedProfileId && activeProfile) {
        setSelectedProfileId(activeProfile.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei profili:', error);
      setLoading(false);
    }
  };
  
  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setIsEditing(false);
    setIsCreating(false);
  };
  
  const handleEditProfile = () => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (!profile) return;
    
    setProfileForm({
      id: profile.id,
      name: profile.name,
      description: profile.description || '',
      isDefault: !!profile.isDefault
    });
    
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleCreateProfile = () => {
    setProfileForm({
      id: uuidv4(),
      name: 'Nuovo Profilo',
      description: 'Descrizione del nuovo profilo',
      isDefault: false
    });
    
    setIsEditing(false);
    setIsCreating(true);
    setSelectedProfileId(null);
  };
  
  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Non permette l'eliminazione dell'unico profilo
    if (profiles.length <= 1) {
      alert('Non puoi eliminare l\'unico profilo disponibile.');
      return;
    }
    
    // Conferma prima di eliminare
    setConfirmMessage(`Sei sicuro di voler eliminare il profilo "${profile.name}"?`);
    setConfirmAction(() => async () => {
      try {
        await deleteProfile(profileId);
        
        // Aggiorna la lista dei profili
        const updatedProfiles = getAllProfiles();
        setProfiles(updatedProfiles);
        
        // Se è stato eliminato il profilo selezionato, seleziona il primo disponibile
        if (profileId === selectedProfileId) {
          setSelectedProfileId(updatedProfiles[0]?.id || null);
        }
        
        // Se è stato eliminato il profilo attivo, notifica il cambio
        if (profileId === activeProfileId && onProfileChange) {
          const activeProfile = getActiveProfile();
          onProfileChange(activeProfile);
        }
        
        setShowConfirm(false);
      } catch (error) {
        console.error('Errore nell\'eliminazione del profilo:', error);
      }
    });
    
    setShowConfirm(true);
  };
  
  const handleSetDefault = async (profileId: string) => {
    try {
      await setProfileAsDefault(profileId);
      
      // Aggiorna la lista dei profili
      const updatedProfiles = getAllProfiles();
      setProfiles(updatedProfiles);
      setActiveProfileId(profileId);
      
      // Notifica il cambio di profilo attivo
      if (onProfileChange) {
        const activeProfile = getActiveProfile();
        onProfileChange(activeProfile);
      }
    } catch (error) {
      console.error('Errore nell\'impostazione del profilo predefinito:', error);
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    setProfileForm(prev => ({ ...prev, isDefault: checkbox.checked }));
  };
  
  const handleSaveProfile = async () => {
    try {
      if (isCreating) {
        // Crea un nuovo profilo
        const newProfile = await createProfile({
          id: profileForm.id,
          name: profileForm.name,
          description: profileForm.description,
          isDefault: profileForm.isDefault,
        });
        
        // Aggiorna la lista e seleziona il nuovo profilo
        const updatedProfiles = getAllProfiles();
        setProfiles(updatedProfiles);
        setSelectedProfileId(newProfile.id);
        
        // Se è stato impostato come predefinito, notifica il cambio
        if (profileForm.isDefault && onProfileChange) {
          onProfileChange(newProfile);
          setActiveProfileId(newProfile.id);
        }
        
        setIsCreating(false);
      } else if (isEditing) {
        // Aggiorna il profilo esistente
        const updatedProfile = await updateProfile(profileForm.id, {
          name: profileForm.name,
          description: profileForm.description,
          isDefault: profileForm.isDefault
        });
        
        // Aggiorna la lista
        const updatedProfiles = getAllProfiles();
        setProfiles(updatedProfiles);
        
        // Se è stato impostato come predefinito, notifica il cambio
        if (profileForm.isDefault && onProfileChange) {
          onProfileChange(updatedProfile);
          setActiveProfileId(updatedProfile.id);
        }
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Errore nel salvataggio del profilo:', error);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
  };
  
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  
  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Gestione Profili Prompt</ModalTitle>
          <VSCodeButton appearance="icon" onClick={onClose}>✕</VSCodeButton>
        </ModalHeader>
        
        <ModalContent>
          <ProfileList>
            {profiles.map(profile => (
              <ProfileItem 
                key={profile.id} 
                isActive={selectedProfileId === profile.id}
                onClick={() => handleSelectProfile(profile.id)}
              >
                <ProfileInfo>
                  <ProfileName>
                    {profile.name}
                    {profile.isDefault && <DefaultBadge>Predefinito</DefaultBadge>}
                  </ProfileName>
                  {profile.description && (
                    <ProfileDescription>{profile.description}</ProfileDescription>
                  )}
                </ProfileInfo>
                
                <ProfileActions>
                  {!profile.isDefault && (
                    <VSCodeButton 
                      appearance="icon"
                      title="Imposta come predefinito"
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleSetDefault(profile.id);
                      }}
                    >
                      ⭐
                    </VSCodeButton>
                  )}
                  <VSCodeButton 
                    appearance="icon"
                    title="Modifica"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProfile(profile.id);
                      handleEditProfile();
                    }}
                  >
                    ✏️
                  </VSCodeButton>
                  {profiles.length > 1 && (
                    <VSCodeButton 
                      appearance="icon"
                      title="Elimina"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                    >
                      🗑️
                    </VSCodeButton>
                  )}
                </ProfileActions>
              </ProfileItem>
            ))}
          </ProfileList>
          
          <VSCodeButton 
            appearance="secondary"
            onClick={handleCreateProfile}
          >
            + Nuovo Profilo
          </VSCodeButton>
          
          <VSCodeDivider style={{ margin: '1rem 0' }} />
          
          {(isEditing || isCreating) && (
            <ProfileDetails>
              <FormGroup>
                <FormLabel>Nome</FormLabel>
                <VSCodeTextField
                  name="name"
                  value={profileForm.name}
                  onChange={handleFormChange}
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Descrizione</FormLabel>
                <VSCodeTextArea
                  name="description"
                  value={profileForm.description}
                  rows={3}
                  onChange={handleFormChange}
                />
              </FormGroup>
              
              <FormGroup>
                <VSCodeCheckbox
                  checked={profileForm.isDefault}
                  onChange={handleCheckboxChange}
                >
                  Imposta come profilo predefinito
                </VSCodeCheckbox>
              </FormGroup>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <VSCodeButton
                  appearance="secondary"
                  onClick={handleCancelEdit}
                >
                  Annulla
                </VSCodeButton>
                <VSCodeButton
                  onClick={handleSaveProfile}
                >
                  Salva
                </VSCodeButton>
              </div>
            </ProfileDetails>
          )}
          
          {!isEditing && !isCreating && selectedProfile && (
            <ProfileDetails>
              <h3 style={{ margin: '0 0 1rem 0' }}>{selectedProfile.name}</h3>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--vscode-descriptionForeground)' }}>
                {selectedProfile.description || 'Nessuna descrizione disponibile.'}
              </p>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--vscode-descriptionForeground)' }}>
                  Ultimo aggiornamento: {selectedProfile.updatedAt 
                    ? new Date(selectedProfile.updatedAt).toLocaleString() 
                    : 'Data non disponibile'}
                </span>
              </div>
            </ProfileDetails>
          )}
          
          {!isEditing && !isCreating && !selectedProfile && (
            <NoProfileSelected>
              Seleziona un profilo dalla lista per visualizzare o modificare i dettagli
            </NoProfileSelected>
          )}
        </ModalContent>
        
        <ModalFooter>
          <VSCodeButton appearance="secondary" onClick={onClose}>
            Chiudi
          </VSCodeButton>
        </ModalFooter>
      </ModalContainer>
      
      {showConfirm && (
        <ConfirmDialog>
          <ConfirmMessage>{confirmMessage}</ConfirmMessage>
          <ConfirmActions>
            <VSCodeButton 
              appearance="secondary"
              onClick={() => setShowConfirm(false)}
            >
              Annulla
            </VSCodeButton>
            <VSCodeButton 
              onClick={() => confirmAction()}
            >
              Conferma
            </VSCodeButton>
          </ConfirmActions>
        </ConfirmDialog>
      )}
    </ModalBackdrop>
  );
}; 