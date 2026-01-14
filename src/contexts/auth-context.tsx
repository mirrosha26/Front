'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback
} from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  date_joined: string;
  avatar?: string;
  group?: {
    id: number;
    name: string;
    slug: string;
    logo?: string;
    created_at?: string;
    updated_at?: string;
  };
  // Add new fields here if they appear in the user model
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login?: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register?: (
    userData: RegisterData
  ) => Promise<{ success: boolean; message?: string }>;
  logout?: () => Promise<void>;
  isLoading?: boolean;
  fetchWithAuth?: (url: string, options?: RequestInit) => Promise<Response>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (profileData: FormData | Record<string, any>) => Promise<boolean>;
  updateAvatar: (avatarData: string) => Promise<boolean>;
  updateGroup: (groupData: FormData | Record<string, any>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  changePassword: async () => ({ success: false }),
  updateProfile: async () => false,
  updateAvatar: async () => false,
  updateGroup: async () => false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user on initialization
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        // Check if we're on the client
        if (typeof window !== 'undefined') {
          // Get user information
          const success = await fetchUserInfo();
          if (!success) {
            // If failed to get info, try to refresh token
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              // Try to get user info again after successful refresh
              await fetchUserInfo();
            } else {
              // If failed to refresh token, clear state
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Execute only on client
    if (typeof window !== 'undefined') {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Get user information
  const fetchUserInfo = async (
    retryCount = 0,
    maxRetries = 2
  ): Promise<boolean> => {
    try {
      console.log('AUTH CONTEXT: Starting fetchUserInfo, attempt:', retryCount);

      if (retryCount > maxRetries) {
        console.log(
          'AUTH CONTEXT: Maximum number of profile retrieval attempts exceeded'
        );
        return false;
      }

      const response = await fetch('/api/user/profile', {
        credentials: 'include', // Important for sending cookies
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'X-Retry-Count': retryCount.toString()
        }
      });

      console.log(
        'AUTH CONTEXT: Response status when getting profile:',
        response.status
      );
      console.log('AUTH CONTEXT: Status text:', response.statusText);

      // Log response headers
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log('AUTH CONTEXT: Response headers:', responseHeaders);

      if (response.ok) {
        const result = await response.json();
        console.log(
          'AUTH CONTEXT: Response received:',
          JSON.stringify(result).substring(0, 200) + '...'
        );

        if (result.success && result.data?.user) {
          console.log('AUTH CONTEXT: Setting user in state');
          // Include is_superuser from data level if available
          setUser({
            ...result.data.user,
            is_superuser: result.data.is_superuser ?? result.data.user.is_superuser
          });
          return true;
        } else {
          console.log('AUTH CONTEXT: Response does not contain user data');
        }
        return false;
      } else if (response.status === 401 && retryCount < maxRetries) {
        // Explicitly handle 401 error with retry limit
        console.log(
          'AUTH CONTEXT: Authorization required to get profile, trying to refresh token'
        );

        const refreshSuccess = await refreshToken();
        console.log('AUTH CONTEXT: Token refresh result:', refreshSuccess);

        if (refreshSuccess) {
          // Add delay before retrying
          console.log('AUTH CONTEXT: Waiting 500ms before retrying...');
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Retry request after token refresh with increased counter
          console.log('AUTH CONTEXT: Retrying request after token refresh');
          return await fetchUserInfo(retryCount + 1, maxRetries);
        }
        console.log('AUTH CONTEXT: Failed to refresh token');
        return false;
      } else {
        // Handle other errors (500, 404, etc.)
        const errorText = await response.text();
        let errorMessage = response.statusText;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use statusText
        }
        
        console.error(
          'AUTH CONTEXT: Failed to get user profile:',
          response.status,
          errorMessage
        );
        
        // For 500 errors, don't retry - it's a server issue
        if (response.status === 500) {
          console.error('AUTH CONTEXT: Server error (500), not retrying');
          return false;
        }
      }
      console.log('AUTH CONTEXT: Finishing fetchUserInfo with false result');
      return false;
    } catch (error) {
      console.error('AUTH CONTEXT: Error getting user information:', error);
      // Don't throw, just return false to prevent app crash
      return false;
    }
  };

  // Refresh token - removed circular dependency by not calling fetchUserInfo
  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('AUTH CONTEXT: Starting refreshToken');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Important for sending cookies
      });

      console.log(
        'AUTH CONTEXT: Response status when refreshing token:',
        response.status
      );
      console.log('AUTH CONTEXT: Status text:', response.statusText);

      // Log response headers
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log(
        'AUTH CONTEXT: Response headers when refreshing token:',
        responseHeaders
      );

      if (response.ok) {
        const result = await response.json();
        console.log('AUTH CONTEXT: Token refresh result:', result.success);

        // Add small delay to ensure cookies are updated
        console.log('AUTH CONTEXT: Waiting for cookies to update...');
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Don't call fetchUserInfo here to avoid circular dependency
        // Let the caller handle getting user info after successful refresh
        console.log('AUTH CONTEXT: Token refreshed successfully');
        return true;
      }

      console.log(
        'AUTH CONTEXT: Failed to refresh token, status:',
        response.status
      );
      return false;
    } catch (error) {
      console.error('AUTH CONTEXT: Error refreshing token:', error);
      return false;
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for receiving cookies
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Get user information with limited retries to prevent infinite loops
        const userInfoSuccess = await fetchUserInfo(0, 1); // Only allow 1 retry for login

        if (userInfoSuccess) {
          return { success: true };
        } else {
          // Even if we can't get user info, login was successful
          // This prevents login failure due to temporary profile fetch issues
          console.warn(
            'AUTH CONTEXT: Login successful but failed to fetch user profile'
          );
          return {
            success: true,
            message:
              'Login successful. Profile information will be loaded shortly.'
          };
        }
      } else {
        return {
          success: false,
          message: result.message || 'Login failed. Check email and password.'
        };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  const register = async (
    userData: RegisterData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error during registration:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for sending cookies
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    // Clear onboarding localStorage on logout to avoid conflicts with next user
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('has_seen_welcome');
    }

    setUser(null);
    router.push('/auth/sign-in');
  };

  // Function for making authenticated requests
  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const authOptions = {
      ...options,
      credentials: 'include' as RequestCredentials
    };

    // Add retry logic with limited attempts to prevent infinite loops
    let retries = 2; // Reduced from 3 to 2
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        const response = await fetch(url, authOptions);

        // If we get 401, try to refresh token (only once per request)
        if (response.status === 401 && retries === 2) {
          const refreshSuccess = await refreshToken();

          if (refreshSuccess) {
            // Important: create new request after token refresh
            // Don't decrement retries here as this is our one refresh attempt
            return await fetch(url, authOptions);
          } else {
            await logout();
            throw new Error('Session expired. Please login again.');
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Check if error is network-related
        if (error instanceof TypeError && error.message.includes('fetch')) {
          retries--;
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, (2 - retries) * 1000)
            );
            continue;
          }
        } else {
          // If not a network error, don't retry
          break;
        }
      }
    }

    throw lastError || new Error('Failed to execute request');
  };

  // Update user profile
  const updateProfile = async (profileData: FormData | Record<string, any>): Promise<boolean> => {
    try {
      console.log('AUTH CONTEXT: Starting profile update');

      // Determine if it's FormData or JSON object
      const isFormData = profileData instanceof FormData;
      
      const response = await fetchWithAuth('/api/user/profile/update', {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? profileData : JSON.stringify(profileData)
      });

      console.log(
        'AUTH CONTEXT: Response status when updating profile:',
        response.status
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          'AUTH CONTEXT: Profile update result:',
          JSON.stringify(result).substring(0, 200) + '...'
        );

        if (result.success && result.data?.user) {
          console.log('AUTH CONTEXT: Updating user in state');
          console.log(
            'AUTH CONTEXT: New user data:',
            JSON.stringify(result.data.user).substring(0, 200) + '...'
          );
          setUser(result.data.user);
          return true;
        } else {
          console.error(
            'AUTH CONTEXT: Response does not contain user data or success status'
          );
        }
      } else {
        console.error(
          'AUTH CONTEXT: Error updating profile:',
          await response.text()
        );
      }
      return false;
    } catch (error) {
      console.error('AUTH CONTEXT: Error updating profile:', error);
      return false;
    }
  };

  // Update user avatar
  const updateAvatar = async (avatarData: string): Promise<boolean> => {
    try {
      const response = await fetchWithAuth('/api/user/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: avatarData })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.user) {
          // Include is_superuser from data level if available
          setUser({
            ...result.data.user,
            is_superuser: result.data.is_superuser ?? result.data.user.is_superuser
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  };

  // Update group (name and/or logo)
  const updateGroup = async (groupData: FormData | Record<string, any>): Promise<boolean> => {
    try {
      console.log('AUTH CONTEXT: Starting group update');

      // Determine if it's FormData or JSON object
      const isFormData = groupData instanceof FormData;

      const response = await fetchWithAuth('/api/user/group/update', {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? groupData : JSON.stringify(groupData)
      });

      console.log(
        'AUTH CONTEXT: Response status when updating group:',
        response.status
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          'AUTH CONTEXT: Group update result:',
          JSON.stringify(result).substring(0, 200) + '...'
        );

        if (result.success && result.data?.group) {
          console.log('AUTH CONTEXT: Updating group in user state');
          // Update user's group data
          setUser((prevUser) => {
            if (!prevUser) return prevUser;
            return {
              ...prevUser,
              group: result.data.group
            };
          });
          return true;
        } else {
          console.error(
            'AUTH CONTEXT: Response does not contain group data or success status'
          );
        }
      } else {
        const errorText = await response.text();
        console.error('AUTH CONTEXT: Error updating group:', errorText);
      }
      return false;
    } catch (error) {
      console.error('AUTH CONTEXT: Error updating group:', error);
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetchWithAuth('/api/user/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const result = await response.json();

      return {
        success: response.ok,
        message:
          result.message ||
          (response.ok
            ? 'Password changed successfully'
            : 'Failed to change password')
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  // Add function to check token expiration
  const checkTokenExpiration = useCallback(async () => {
    // Check if we have a user (i.e. we're authenticated)
    if (user) {
      try {
        // Check token validity
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        const data = await response.json();

        // If token is invalid or about to expire, refresh it
        if (!data.isValid) {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Try to get user info after successful refresh
            await fetchUserInfo(0, 1);
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    }
  }, [user]);

  // Add effect for periodic token checking
  useEffect(() => {
    if (user) {
      // Check token every 10 minutes
      const interval = setInterval(checkTokenExpiration, 10 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user, checkTokenExpiration]);

  // Add function to check auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });

      const data = await response.json();

      if (!data.isValid) {
        // If token is invalid, try to refresh
        const refreshSuccess = await refreshToken();

        if (refreshSuccess) {
          // Try to get user info after successful refresh
          await fetchUserInfo(0, 1);
        } else {
          // If refresh failed, log out
          setUser(null);
          if (
            window.location.pathname.startsWith('/app') ||
            window.location.pathname.startsWith('/app') ||
            window.location.pathname.startsWith('/profile')
          ) {
            router.push('/auth/sign-in');
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }, [router]);

  // Add effect to check auth status on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        register,
        logout,
        isLoading,
        fetchWithAuth,
        changePassword,
        updateProfile,
        updateAvatar,
        updateGroup
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
