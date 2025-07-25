export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}