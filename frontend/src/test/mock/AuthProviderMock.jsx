import React from "react";
import { vi } from "vitest";
import { AuthContext } from "../../../src/context/AuthContext"; // use root context to match Settings.jsx

export const AuthProviderMock = ({ children, mockAuth = null }) => {
  const defaultMockAuth = {
    user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com" },
    isAuthenticated: true,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    userProfile: { firstName: "Test", lastName: "User" },
    setUserProfile: vi.fn(),
  };

  const authValue = mockAuth || defaultMockAuth;

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
