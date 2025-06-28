import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useIdeas = () => {
  const [ideas, setIdeas] = useState([]);
  const [categories, setCategories] = useState([
    'YouTube', 'TikTok', 'Instagram', 'Fashion', 'Content', 
    'Personal', 'Brain Dumps', 'Food', 'Travel', 'Tech', 
    'Art', 'Music', 'Photography', 'Other'
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on initialization
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ideasData, categoriesData] = await Promise.all([
        AsyncStorage.getItem('ideas'),
        AsyncStorage.getItem('categories'),
      ]);

      if (ideasData) {
        const parsedIdeas = JSON.parse(ideasData);
        setIdeas(Array.isArray(parsedIdeas) ? parsedIdeas : []);
      }

      if (categoriesData) {
        const parsedCategories = JSON.parse(categoriesData);
        setCategories(Array.isArray(parsedCategories) ? parsedCategories : [
          'YouTube', 'TikTok', 'Instagram', 'Fashion', 'Content', 
          'Personal', 'Brain Dumps', 'Food', 'Travel', 'Tech', 
          'Art', 'Music', 'Photography', 'Other'
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
      // Set defaults on error
      setIdeas([]);
      setCategories([
        'YouTube', 'TikTok', 'Instagram', 'Fashion', 'Content', 
        'Personal', 'Brain Dumps', 'Food', 'Travel', 'Tech', 
        'Art', 'Music', 'Photography', 'Other'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveIdeas = async (newIdeas) => {
    try {
      await AsyncStorage.setItem('ideas', JSON.stringify(newIdeas));
      setIdeas(newIdeas);
    } catch (error) {
      console.error('Error saving ideas:', error);
      setError(error.message);
      throw error;
    }
  };

  const addIdea = async (ideaData) => {
    try {
      const newIdea = {
        id: generateUUID(),
        ...ideaData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        isPublic: ideaData.isPublic || false,
      };

      const updatedIdeas = [newIdea, ...ideas];
      await saveIdeas(updatedIdeas);
      return newIdea;
    } catch (error) {
      console.error('Error adding idea:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateIdea = async (ideaId, updates) => {
    try {
      const updatedIdeas = ideas.map(idea =>
        idea.id === ideaId 
          ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
          : idea
      );
      await saveIdeas(updatedIdeas);
      return updatedIdeas.find(idea => idea.id === ideaId);
    } catch (error) {
      console.error('Error updating idea:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteIdea = async (ideaId) => {
    try {
      const updatedIdeas = ideas.filter(idea => idea.id !== ideaId);
      await saveIdeas(updatedIdeas);
      return true;
    } catch (error) {
      console.error('Error deleting idea:', error);
      setError(error.message);
      throw error;
    }
  };

  const addCategory = async (categoryName) => {
    try {
      if (!categories.includes(categoryName)) {
        const updatedCategories = [...categories, categoryName];
        await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
        setCategories(updatedCategories);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.message);
      throw error;
    }
  };

  const removeCategory = async (categoryName) => {
    try {
      const updatedCategories = categories.filter(cat => cat !== categoryName);
      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
      return true;
    } catch (error) {
      console.error('Error removing category:', error);
      setError(error.message);
      throw error;
    }
  };

  const getIdeasByCategory = (categoryName) => {
    return ideas.filter(idea => idea.category === categoryName);
  };

  const getIdeasByType = (type) => {
    return ideas.filter(idea => idea.type === type);
  };

  const searchIdeas = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return ideas.filter(idea => 
      idea.title.toLowerCase().includes(lowercaseQuery) ||
      idea.description?.toLowerCase().includes(lowercaseQuery) ||
      idea.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getPublicIdeas = () => {
    return ideas.filter(idea => idea.isPublic);
  };

  const getPrivateIdeas = () => {
    return ideas.filter(idea => !idea.isPublic);
  };

  const getRecentIdeas = (limit = 10) => {
    return ideas
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(['ideas', 'categories']);
      setIdeas([]);
      setCategories([
        'YouTube', 'TikTok', 'Instagram', 'Fashion', 'Content', 
        'Personal', 'Brain Dumps', 'Food', 'Travel', 'Tech', 
        'Art', 'Music', 'Photography', 'Other'
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    // State
    ideas,
    categories,
    loading,
    error,
    
    // Basic CRUD
    addIdea,
    updateIdea,
    deleteIdea,
    
    // Category management
    addCategory,
    removeCategory,
    
    // Query methods
    getIdeasByCategory,
    getIdeasByType,
    searchIdeas,
    getPublicIdeas,
    getPrivateIdeas,
    getRecentIdeas,
    
    // Utility methods
    refreshData,
    clearAllData,
    
    // Stats
    totalIdeas: ideas.length,
    publicIdeasCount: ideas.filter(i => i.isPublic).length,
    privateIdeasCount: ideas.filter(i => !i.isPublic).length,
  };
};