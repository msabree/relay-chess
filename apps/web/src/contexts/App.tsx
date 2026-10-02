import React, { createContext, useState } from 'react';

type MODAL_KEYS = '' | 'GAME_CONTROL_PANEL' | 'SIGN_IN' | 'UPDATE_PROFILE_INFO' | 'GAME_OVER' | 'START_NEW_GAME' | 'NOTIFICATIONS' | 'AI_GAME_REVIEW' | 'INVITE_TEAMMATES' | 'CREATING_PRIVATE_GAME' | 'SWITCH_SIDES' | 'CHAT' | 'GAME_FEEDBACK'
type MODAL_DATA = {
  teamId?: string
  userId?: string;
  roomId?: string;
  inviteCode?: string;
}
interface AppContextProps {
  modal: {
    name: MODAL_KEYS
    data?: MODAL_DATA
  }
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
  // eslint-disable-next-line no-unused-vars
  setModal: (props: { name: MODAL_KEYS, data?: MODAL_DATA }) => void
  setLeftDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setRightDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const AppContext = createContext<AppContextProps>({
  modal: {
    name: '',
    data: undefined
  },
  leftDrawerOpen: false,
  rightDrawerOpen: false,
  setModal: () => {},
  setLeftDrawerOpen: () => {},
  setRightDrawerOpen: () => {},
});

export const AppProvider = ({ children }: any) => {
  const [modal, setModal] = useState<{ name: MODAL_KEYS, data?: MODAL_DATA }>({ name: '', data: undefined });
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        modal,
        leftDrawerOpen,
        rightDrawerOpen,
        setModal,
        setLeftDrawerOpen,
        setRightDrawerOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
