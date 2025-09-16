import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Auth actions
      login: (userData) => set({
        user: userData,
        isAuthenticated: true,
        isLoading: false
      }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Initialize auth state from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('authToken');
        const companyAlias = localStorage.getItem('companyAlias');
        const username = localStorage.getItem('username');

        if (token && companyAlias && username) {
          set({
            user: { token, companyAlias, username },
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
