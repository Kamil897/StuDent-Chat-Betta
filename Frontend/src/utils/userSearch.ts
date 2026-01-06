/**
 * User Search System
 * Search users by name/username for friend requests
 */

import { getLeaderboardUsers } from "./leaderboard";

export interface SearchableUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatarSeed?: string;
}

const STORAGE_KEY_ALL_USERS = "all_registered_users";

/**
 * Get all registered users (from localStorage)
 */
export function getAllRegisteredUsers(): SearchableUser[] {
  try {
    // Get from leaderboard (all users who have played games)
    const leaderboardUsers = getLeaderboardUsers();
    
    // Get from localStorage user data
    const userData = localStorage.getItem("user");
    const currentUser = userData ? JSON.parse(userData) : null;
    
    // Combine and deduplicate
    const allUsers: SearchableUser[] = [];
    const seenIds = new Set<string>();
    
    // Add leaderboard users
    leaderboardUsers.forEach(user => {
      if (!seenIds.has(user.id)) {
        allUsers.push({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatarSeed: user.avatarSeed,
        });
        seenIds.add(user.id);
      }
    });
    
    // Add current user if exists
    if (currentUser && !seenIds.has(currentUser.id)) {
      allUsers.push({
        id: currentUser.id,
        username: currentUser.username || currentUser.name,
        name: `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || currentUser.username,
        email: currentUser.email,
        avatarSeed: currentUser.avatarSeed,
      });
    }
    
    // Get from all_registered_users storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALL_USERS);
      if (stored) {
        const storedUsers: SearchableUser[] = JSON.parse(stored);
        storedUsers.forEach(user => {
          if (!seenIds.has(user.id)) {
            allUsers.push(user);
            seenIds.add(user.id);
          }
        });
      }
    } catch (e) {
      console.error("Error loading stored users:", e);
    }
    
    return allUsers;
  } catch (e) {
    console.error("Error getting all users:", e);
    return [];
  }
}

/**
 * Register a new user in the searchable users list
 */
export function registerUser(user: SearchableUser): void {
  try {
    const allUsers = getAllRegisteredUsers();
    const exists = allUsers.find(u => u.id === user.id);
    
    if (!exists) {
      allUsers.push(user);
      localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(allUsers));
    } else {
      // Update existing user
      const index = allUsers.findIndex(u => u.id === user.id);
      if (index !== -1) {
        allUsers[index] = { ...allUsers[index], ...user };
        localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(allUsers));
      }
    }
  } catch (e) {
    console.error("Error registering user:", e);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Search users by name or username
 * Использует backend API для поиска, с fallback на локальный поиск
 */
export async function searchUsers(query: string): Promise<SearchableUser[]> {
  if (!query.trim()) return [];
  
  // Пытаемся найти через backend API
  try {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=20`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.users && data.users.length > 0) {
        return data.users.map((user: any) => ({
          id: user.id,
          username: user.username,
          name: `${user.name} ${user.surname || ""}`.trim() || user.username,
          email: user.email,
          avatarSeed: user.avatarSeed,
        }));
      }
    }
  } catch (error) {
    console.error("Error searching users via API:", error);
  }
  
  // Fallback: локальный поиск
  const allUsers = getAllRegisteredUsers();
  const lowerQuery = query.toLowerCase().trim();
  
  return allUsers.filter(user => {
    const nameMatch = user.name.toLowerCase().includes(lowerQuery);
    const usernameMatch = user.username.toLowerCase().includes(lowerQuery);
    const emailMatch = user.email?.toLowerCase().includes(lowerQuery);
    
    return nameMatch || usernameMatch || emailMatch;
  });
}

/**
 * Find user by exact name or username
 */
export function findUserByNameOrUsername(nameOrUsername: string): SearchableUser | null {
  const allUsers = getAllRegisteredUsers();
  const lowerQuery = nameOrUsername.toLowerCase().trim();
  
  // First try exact match
  let user = allUsers.find(u => 
    u.name.toLowerCase() === lowerQuery || 
    u.username.toLowerCase() === lowerQuery
  );
  
  // If not found, try partial match
  if (!user) {
    user = allUsers.find(u => 
      u.name.toLowerCase().includes(lowerQuery) || 
      u.username.toLowerCase().includes(lowerQuery)
    );
  }
  
  return user || null;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): SearchableUser | null {
  const allUsers = getAllRegisteredUsers();
  return allUsers.find(u => u.id === userId) || null;
}

