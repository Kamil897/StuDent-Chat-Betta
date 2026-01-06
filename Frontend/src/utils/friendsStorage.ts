export interface Friend {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  avatarSeed?: string; // Added: avatar seed for generating consistent avatar
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string; // Added: name of user receiving request
  createdAt: string;
}

const STORAGE_KEY_FRIENDS = "friends";
const STORAGE_KEY_FRIEND_REQUESTS = "friendRequests";

export function getFriends(): Friend[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FRIENDS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading friends:", e);
  }
  return [];
}

export function saveFriends(friends: Friend[]): void {
  localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
}

export function addFriend(friend: Friend): void {
  const friends = getFriends();
  if (!friends.find((f) => f.id === friend.id)) {
    friends.push(friend);
    saveFriends(friends);
  }
}

export function removeFriend(friendId: string): void {
  const friends = getFriends();
  const filtered = friends.filter((f) => f.id !== friendId);
  saveFriends(filtered);
}

export function getFriendRequests(): FriendRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FRIEND_REQUESTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading friend requests:", e);
  }
  return [];
}

export function saveFriendRequests(requests: FriendRequest[]): void {
  localStorage.setItem(STORAGE_KEY_FRIEND_REQUESTS, JSON.stringify(requests));
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Send friend request by username/name (not ID)
 * Использует backend API для поиска пользователя и отправки заявки
 */
export async function sendFriendRequestByName(toUserName: string): Promise<FriendRequest | null> {
  // Get auth token
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (!token) {
    console.error("User not logged in");
    // Fallback to local storage
    return sendFriendRequestByNameLocal(toUserName);
  }

  try {
    // Отправляем заявку через backend API
    const response = await fetch(`${API_BASE_URL}/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ username: toUserName }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send friend request";
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || errorMessage;
      } catch {
        // Если не удалось распарсить JSON, используем статус
        if (response.status === 401) {
          errorMessage = "Unauthorized - please login";
        } else if (response.status === 404) {
          errorMessage = "User not found";
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Синхронизируем с локальным хранилищем
    const userData = localStorage.getItem("user");
    const currentUser = userData ? JSON.parse(userData) : { id: "user_1", username: "User" };
    
    const request: FriendRequest = {
      id: data.request.id,
      fromUserId: currentUser.id,
      fromUserName: currentUser.username || `${currentUser.name} ${currentUser.surname}`.trim(),
      toUserId: data.request.toUserId,
      toUserName: toUserName,
      createdAt: data.request.createdAt,
    };

    const requests = getFriendRequests();
    requests.push(request);
    saveFriendRequests(requests);
    
    // Add notification for the recipient (will be shown when they check)
    // Note: In real app, this would be sent via backend/WebSocket
    
    return request;
  } catch (error: any) {
    console.error("Error sending friend request:", error);
    // Fallback to local storage
    return sendFriendRequestByNameLocal(toUserName);
  }
}

/**
 * Fallback: локальная отправка заявки (для офлайн режима)
 */
async function sendFriendRequestByNameLocal(toUserName: string): Promise<FriendRequest | null> {
  const userData = localStorage.getItem("user");
  if (!userData) {
    console.error("User not logged in");
    return null;
  }
  
  const currentUser = JSON.parse(userData);
  const fromUserId = currentUser.id;
  const fromUserName = currentUser.username || `${currentUser.name} ${currentUser.surname}`.trim();
  
  // Find user by name/username
  const { findUserByNameOrUsername } = await import("./userSearch");
  const targetUser = findUserByNameOrUsername(toUserName);
  
  if (!targetUser) {
    console.error(`User "${toUserName}" not found`);
    return null;
  }
  
  // Check if already friends
  const friends = getFriends();
  if (friends.find(f => f.id === targetUser.id)) {
    console.error("Already friends");
    return null;
  }
  
  // Check if request already exists
  const existingRequests = getFriendRequests();
  if (existingRequests.find(r => 
    (r.fromUserId === fromUserId && r.toUserId === targetUser.id) ||
    (r.fromUserId === targetUser.id && r.toUserId === fromUserId)
  )) {
    console.error("Friend request already exists");
    return null;
  }
  
  const request: FriendRequest = {
    id: `req_${Date.now()}`,
    fromUserId,
    fromUserName,
    toUserId: targetUser.id,
    toUserName: targetUser.name || targetUser.username,
    createdAt: new Date().toISOString(),
  };

  const requests = getFriendRequests();
  requests.push(request);
  saveFriendRequests(requests);
  return request;
}

/**
 * @deprecated Use sendFriendRequestByName instead
 */
export function sendFriendRequest(toUserId: string, toUserName: string): FriendRequest {
  const userData = localStorage.getItem("user");
  const currentUser = userData ? JSON.parse(userData) : { id: "user_1", username: "User" };
  
  const request: FriendRequest = {
    id: `req_${Date.now()}`,
    fromUserId: currentUser.id,
    fromUserName: currentUser.username || "User",
    toUserId,
    toUserName,
    createdAt: new Date().toISOString(),
  };

  const requests = getFriendRequests();
  requests.push(request);
  saveFriendRequests(requests);
  return request;
}

export async function acceptFriendRequest(requestId: string): Promise<Friend | null> {
  // Get auth token
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  
  if (token) {
    try {
      // Принимаем заявку через backend API
      const response = await fetch(`${API_BASE_URL}/friends/accept/${requestId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }

      const data = await response.json();
      const friend: Friend = {
        id: data.friend.id,
        name: data.friend.name,
        email: data.friend.email,
        avatarSeed: data.friend.avatarSeed,
        avatar: data.friend.avatar || (data.friend.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.friend.avatarSeed}` : undefined),
      };

      addFriend(friend);

      const requests = getFriendRequests();
      const filtered = requests.filter((r) => r.id !== requestId);
      saveFriendRequests(filtered);
      
      // Add notification
      const { notifyFriendAccepted } = await import("./notifications");
      notifyFriendAccepted(friend.name || friend.username);

      return friend;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      // Fallback to local storage
    }
  }

  // Fallback: локальное принятие заявки
  const requests = getFriendRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request) return null;

  // Get full user info from userSearch
  const { getUserById } = await import("./userSearch");
  const userInfo = getUserById(request.fromUserId);

  const friend: Friend = {
    id: request.fromUserId,
    name: request.fromUserName,
    email: userInfo?.email,
    avatarSeed: userInfo?.avatarSeed,
    avatar: userInfo?.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.avatarSeed}` : undefined,
  };

  addFriend(friend);

  const filtered = requests.filter((r) => r.id !== requestId);
  saveFriendRequests(filtered);
  
  // Add notification
  const { notifyFriendAccepted } = await import("./notifications");
  notifyFriendAccepted(friend.name || friend.username);

  return friend;
}

/**
 * Get friend requests for current user
 */
export function getMyFriendRequests(): FriendRequest[] {
  const userData = localStorage.getItem("user");
  if (!userData) return [];
  
  const currentUser = JSON.parse(userData);
  const currentUserId = currentUser.id;
  
  // Get requests where current user is the recipient
  const allRequests = getFriendRequests();
  return allRequests.filter(r => r.toUserId === currentUserId);
}

export function rejectFriendRequest(requestId: string): void {
  const requests = getFriendRequests();
  const filtered = requests.filter((r) => r.id !== requestId);
  saveFriendRequests(filtered);
}

