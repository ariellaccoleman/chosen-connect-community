
import { useState, useCallback } from 'react';

export function useToggle(initialState = false): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = useState(initialState);
  
  const toggle = useCallback(() => {
    setState(state => !state);
  }, []);
  
  const setValue = useCallback((value: boolean) => {
    setState(value);
  }, []);
  
  return [state, toggle, setValue];
}
