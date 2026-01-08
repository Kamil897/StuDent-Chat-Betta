/**
 * News Admin Utilities
 * Functions for managing news items (for future admin panel integration)
 */

import type { NewsItem } from '../pages/News/data';

const STORAGE_KEY_NEWS = "admin_news_items";

/**
 * Get all news items (from localStorage for now, will be replaced with API)
 */
export function getAllNewsItems(): NewsItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NEWS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading news items:", e);
  }
  return [];
}

/**
 * Save news items
 */
export function saveNewsItems(items: NewsItem[]): void {
  localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(items));
}

/**
 * Add a new news item
 */
export function addNewsItem(item: Omit<NewsItem, 'id' | 'publishedAt' | 'views'>): NewsItem {
  const items = getAllNewsItems();
  const newItem: NewsItem = {
    ...item,
    id: `news_${Date.now()}`,
    publishedAt: new Date().toISOString(),
    views: 0,
  };
  items.push(newItem);
  saveNewsItems(items);
  return newItem;
}

/**
 * Update a news item
 */
export function updateNewsItem(id: string, updates: Partial<NewsItem>): boolean {
  const items = getAllNewsItems();
  const index = items.findIndex(item => item.id === id);
  if (index >= 0) {
    items[index] = { ...items[index], ...updates };
    saveNewsItems(items);
    return true;
  }
  return false;
}

/**
 * Delete a news item
 */
export function deleteNewsItem(id: string): boolean {
  const items = getAllNewsItems();
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length < items.length) {
    saveNewsItems(filtered);
    return true;
  }
  return false;
}

/**
 * Get news items by category
 */
export function getNewsByCategory(category: NewsItem['category']): NewsItem[] {
  return getAllNewsItems().filter(item => item.category === category);
}

/**
 * Get featured news items
 */
export function getFeaturedNews(): NewsItem[] {
  return getAllNewsItems().filter(item => item.featured).sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Increment views for a news item
 */
export function incrementNewsViews(id: string): void {
  const items = getAllNewsItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.views = (item.views || 0) + 1;
    saveNewsItems(items);
  }
}
