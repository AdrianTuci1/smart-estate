import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifică dacă există un user salvat la încărcarea aplicației
    const initializeAuth = async () => {
      try {
        // Try to get saved user from localStorage
        const savedUser = localStorage.getItem('user');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Verify token with backend
          try {
            const response = await apiService.getProfile();
            if (response.success && response.data) {
              // Token is valid, update user with fresh data
              const updatedUser = {
                ...userData,
                ...response.data
              };
              setUser(updatedUser);
              // Update localStorage with fresh data
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('authToken');
              localStorage.removeItem('companyAlias');
              localStorage.removeItem('username');
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            // Token is invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            localStorage.removeItem('companyAlias');
            localStorage.removeItem('username');
          }
        } else {
          // Fallback: check for legacy storage format
          const token = localStorage.getItem('authToken');
          const companyAlias = localStorage.getItem('companyAlias');
          const username = localStorage.getItem('username');

          if (token && companyAlias && username) {
            try {
              const response = await apiService.getProfile();
              if (response.success && response.data) {
                const userData = {
                  token,
                  companyAlias,
                  username,
                  ...response.data
                };
                setUser(userData);
                // Save in new format
                localStorage.setItem('user', JSON.stringify(userData));
                // Clean up legacy storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('companyAlias');
                localStorage.removeItem('username');
              } else {
                // Clear legacy storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('companyAlias');
                localStorage.removeItem('username');
              }
            } catch (error) {
              console.error('Legacy token verification failed:', error);
              // Clear legacy storage
              localStorage.removeItem('authToken');
              localStorage.removeItem('companyAlias');
              localStorage.removeItem('username');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear all storage on error
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('companyAlias');
        localStorage.removeItem('username');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Save complete user object to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    // Keep legacy format for backward compatibility
    localStorage.setItem('authToken', userData.token);
    localStorage.setItem('companyAlias', userData.companyAlias);
    localStorage.setItem('username', userData.username);
  };

  const logout = () => {
    setUser(null);
    // Clear all storage formats
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('companyAlias');
    localStorage.removeItem('username');
  };

  const updateUser = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      // Update localStorage with new data
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
