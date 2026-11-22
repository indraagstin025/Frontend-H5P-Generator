import { useContext } from 'react';
import { LocalAuthContext } from './LocalAuthContext';

export function useAuth() {
  const context = useContext(LocalAuthContext);
  if (!context) throw new Error('useAuth membutuhkan LocalAuthProvider.');
  return context;
}
