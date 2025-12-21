export interface Friend {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
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

export function sendFriendRequest(toUserId: string, _toUserName: string): FriendRequest {
  const user = { id: "user_1", username: "User" }; // In real app, get from auth
  const request: FriendRequest = {
    id: `req_${Date.now()}`,
    fromUserId: user.id,
    fromUserName: user.username,
    toUserId,
    createdAt: new Date().toISOString(),
  };

  const requests = getFriendRequests();
  requests.push(request);
  saveFriendRequests(requests);
  return request;
}

export function acceptFriendRequest(requestId: string): Friend | null {
  const requests = getFriendRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request) return null;

  const friend: Friend = {
    id: request.fromUserId,
    name: request.fromUserName,
  };

  addFriend(friend);

  const filtered = requests.filter((r) => r.id !== requestId);
  saveFriendRequests(filtered);

  return friend;
}

export function rejectFriendRequest(requestId: string): void {
  const requests = getFriendRequests();
  const filtered = requests.filter((r) => r.id !== requestId);
  saveFriendRequests(filtered);
}

