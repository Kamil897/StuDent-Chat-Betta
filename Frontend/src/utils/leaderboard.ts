export interface LeaderboardUser {
  id: string;
  username: string;
  name: string;
  email: string;
  points: number;
  avatarSeed?: string;
  createdAt: string;
}

const STORAGE_KEY_LEADERBOARD = "leaderboard_users";

/**
 * Get all users from leaderboard
 */
export function getLeaderboardUsers(): LeaderboardUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading leaderboard users:", e);
  }
  return [];
}

/**
 * Save users to leaderboard
 */
export function saveLeaderboardUsers(users: LeaderboardUser[]): void {
  localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(users));
}

/**
 * Get or create user in leaderboard
 */
export function getOrCreateLeaderboardUser(userId: string, username: string, name: string, email: string, avatarSeed?: string): LeaderboardUser {
  const users = getLeaderboardUsers();
  let user = users.find(u => u.id === userId);

  if (!user) {
    user = {
      id: userId,
      username,
      name,
      email,
      points: 0,
      avatarSeed,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveLeaderboardUsers(users);
  } else {
    // Update user info if needed
    user.username = username;
    user.name = name;
    user.email = email;
    if (avatarSeed) user.avatarSeed = avatarSeed;
    saveLeaderboardUsers(users);
  }

  return user;
}

/**
 * Update user points in leaderboard
 */
export function updateUserPoints(userId: string, points: number): void {
  const users = getLeaderboardUsers();
  const user = users.find(u => u.id === userId);
  
  if (user) {
    user.points = points;
    // Sort by points descending
    users.sort((a, b) => b.points - a.points);
    saveLeaderboardUsers(users);
  }
}

/**
 * Get leaderboard sorted by points
 */
export function getLeaderboard(): LeaderboardUser[] {
  const users = getLeaderboardUsers();
  return users.sort((a, b) => b.points - a.points);
}

/**
 * Get user rank in leaderboard
 */
export function getUserRank(userId: string): number {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(u => u.id === userId);
  return index >= 0 ? index + 1 : 0;
}

/**
 * Sync current user's points with leaderboard
 */
export function syncCurrentUserPoints(): void {
  try {
    const savedUser = localStorage.getItem("user");
    const points = parseInt(localStorage.getItem("user_points") || "0", 10);
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Use email as unique identifier, or username, or generate stable ID
      let userId = user.id;
      
      // If no ID, try to find by email or username first
      if (!userId) {
        const users = getLeaderboardUsers();
        const existingUser = users.find(u => 
          u.email === user.email || 
          u.username === user.username ||
          u.name === user.name
        );
        
        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Generate stable ID based on email or username
          userId = user.email 
            ? `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`
            : user.username 
            ? `user_${user.username.replace(/[^a-zA-Z0-9]/g, '_')}`
            : `user_${Date.now()}`;
        }
      }
      
      // Update or create user
      getOrCreateLeaderboardUser(
        userId,
        user.username || user.name || "User",
        user.name || `${user.name || ''} ${user.surname || ''}`.trim() || user.username || "User",
        user.email || "",
        user.avatarSeed
      );
      
      // Update points for existing user
      updateUserPoints(userId, points);
      
      // Update user ID in saved user if it was missing
      if (!user.id) {
        user.id = userId;
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
  } catch (e) {
    console.error("Error syncing user points:", e);
  }
}

/**
 * Remove duplicate users from leaderboard (keep the one with highest points)
 */
export function removeDuplicates(): void {
  const users = getLeaderboardUsers();
  const uniqueUsers = new Map<string, LeaderboardUser>();
  
  // Group by email, username, or name
  users.forEach(user => {
    const key = user.email || user.username || user.name || user.id;
    const existing = uniqueUsers.get(key);
    
    if (!existing || user.points > existing.points) {
      uniqueUsers.set(key, user);
    }
  });
  
  // Convert back to array and sort
  const cleaned = Array.from(uniqueUsers.values()).sort((a, b) => b.points - a.points);
  saveLeaderboardUsers(cleaned);
}

