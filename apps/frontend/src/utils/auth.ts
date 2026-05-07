const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:6969";

export interface User {
  id: string;
  email: string;
  name?: string;
  qid?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

// Check if user is authenticated by trying to fetch user info
export const checkAuth = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
};

// Get user info
export const getUserInfo = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("Failed to get user info:", error);
    return null;
  }
};

// Update ERP credentials
export const updateERPCredentials = async (
  qid: string,
  password: string,
): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/update`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ qid, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update credentials");
    }
  } catch (error) {
    console.error("Failed to update credentials:", error);
    throw error;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
