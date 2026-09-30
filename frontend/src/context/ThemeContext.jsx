import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'ks_portal_theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
