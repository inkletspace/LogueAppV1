import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useIdeas } from '../context/IdeasContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { ideas, categories, loading, refreshData } = useIdeas();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); 
  const [viewType, setViewType] = useState('grid'); // grid, list, swipe

  // Content type colors for top banners
  const contentTypeColors = {
    text: '#6366F1', // Indigo
    voice: '#EC4899', // Pink  
    photo: '#10B981', // Green
    video: '#8B5CF6', // Purple
    todo: '#F59E0B', // Orange
    default: '#A855F7'
  };

  // Filter ideas
 const filteredIdeas = ideas.filter(idea => {
  const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       idea.description?.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = selectedCategory === 'all' || idea.category === selectedCategory;
  const matchesType = !selectedType || selectedType === 'all' || idea.type === selectedType;
  
  return matchesSearch && matchesCategory && matchesType;
});

  const renderIdea = ({ item }) => {
    const topBannerColor = contentTypeColors[item.type] || contentTypeColors.default;
    
    return (
      <TouchableOpacity
        style={styles.ideaCard}
        onPress={() => navigation.navigate('IdeaDetail', { ideaId: item.id })}
        activeOpacity={0.7}
      >
        {/* Colored top banner */}
        <View style={[styles.topBanner, { backgroundColor: topBannerColor }]} />
        
        <View style={styles.cardContent}>
          {/* Content type indicator */}
          <View style={styles.contentTypeHeader}>
            <Ionicons 
              name={getCategoryIcon(item.type)} 
              size={16} 
              color="#6B7280" 
            />
            <Text style={styles.contentTypeText}>{item.type || 'Text'}</Text>
          </View>
          
          {/* Show media preview for photo in grid view */}
          {item.type === 'photo' && item.mediaFiles && item.mediaFiles.length > 0 && (
            <Image 
              source={{ uri: item.mediaFiles[0] }} 
              style={styles.mediaPreview}
              resizeMode="cover"
            />
          )}
          
          {/* Show audio indicator for voice notes */}
          {item.type === 'voice' && item.audioUri && (
            <View style={styles.audioIndicator}>
              <Ionicons name="mic" size={20} color="#EC4899" />
              <Text style={styles.audioText}>Voice Recording</Text>
            </View>
          )}
          
          {/* Show todo items for todo notes */}
          {item.type === 'todo' && item.todoItems && item.todoItems.length > 0 && (
            <View style={styles.todoPreview}>
              {item.todoItems.slice(0, 3).map((todo, index) => (
                <View key={index} style={styles.todoItem}>
                  <Ionicons 
                    name={todo.completed ? 'checkbox' : 'square-outline'} 
                    size={16} 
                    color={todo.completed ? '#10B981' : '#6B7280'} 
                  />
                  <Text 
                    style={[
                      styles.todoText,
                      todo.completed && styles.todoTextCompleted
                    ]}
                  >
                    {todo.text}
                  </Text>
                </View>
              ))}
              {item.todoItems.length > 3 && (
                <Text style={styles.moreTodos}>+{item.todoItems.length - 3} more tasks</Text>
              )}
            </View>
          )}
          
          <Text style={styles.ideaTitle} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>
          
          {item.description && (
            <Text style={styles.ideaDescription} numberOfLines={3}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.ideaFooter}>
            <Text style={[styles.ideaCategory, { color: topBannerColor }]}>
              {item.category}
            </Text>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 2).map((tag, index) => (
                  <Text key={index} style={styles.ideaTag}>#{tag}</Text>
                ))}
                {item.tags.length > 2 && (
                  <Text style={styles.moreTag}>+{item.tags.length - 2}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = (type) => {
    const iconMap = {
      text: 'document-text',
      voice: 'mic',
      photo: 'image',
      video: 'videocam',
      todo: 'checkbox-outline',
    };
    return iconMap[type] || 'document';
  };

  const getViewIcon = () => {
    switch (viewType) {
      case 'list': return 'list';
      case 'swipe': return 'refresh';
      default: return 'grid';
    }
  };

  const cycleViewType = () => {
    const modes = ['grid', 'list', 'swipe'];
    const currentIndex = modes.indexOf(viewType);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewType(modes[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#A855F7', '#EC4899']}
            style={styles.logoContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.logo}>LOGUE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="trending-up" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your louges..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Bar - All icons in one row */}
      <View style={styles.typeFilterContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          style={styles.typeFilterBar}
        >
          {/* All Louges Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'all' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('all')}
          >
            {selectedType === 'all' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="apps" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="apps" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Text Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'text' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('text')}
          >
            {selectedType === 'text' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="document-text" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Voice Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'voice' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('voice')}
          >
            {selectedType === 'voice' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="mic" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Photo Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'photo' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('photo')}
          >
            {selectedType === 'photo' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="image" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="image" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'video' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('video')}
          >
            {selectedType === 'video' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="videocam" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Todo Button */}
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === 'todo' && styles.selectedTypeFilter
            ]}
            onPress={() => setSelectedType('todo')}
          >
            {selectedType === 'todo' ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.typeFilterGradient}
              >
                <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <Ionicons name="checkbox-outline" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Layers/Stacks Button */}
          <TouchableOpacity style={styles.typeFilterButton}>
            <Ionicons name="layers" size={20} color="#6B7280" />
          </TouchableOpacity>
        </LinearGradient>

        {/* View Toggle Button - Separate */}
        <TouchableOpacity 
          style={styles.viewToggleButton}
          onPress={cycleViewType}
        >
          <Ionicons name={getViewIcon()} size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryTab,
            selectedCategory === 'all' && styles.selectedCategoryTab
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <LinearGradient
            colors={selectedCategory === 'all' ? ['#A855F7', '#EC4899'] : ['transparent', 'transparent']}
            style={styles.categoryTabGradient}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === 'all' && styles.selectedCategoryTabText
              ]}
            >
              All Louges
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {categories.slice(0, 10).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.selectedCategoryTab
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <LinearGradient
              colors={selectedCategory === category ? ['#A855F7', '#EC4899'] : ['transparent', 'transparent']}
              style={styles.categoryTabGradient}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.selectedCategoryTabText
                ]}
              >
                {category}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ideas List */}
      <FlatList
        data={filteredIdeas}
        renderItem={renderIdea}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ideasContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            colors={['#A855F7']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="create-outline" size={48} color="#A855F7" />
            </View>
            <Text style={styles.emptyText}>No logues yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first logue</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#A855F7',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 20,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  typeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  typeFilterBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 4,
  },
  typeFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeFilterGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTypeFilter: {
    // Additional styling if needed
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryTabsContent: {
    paddingRight: 16,
  },
  categoryTab: {
    marginRight: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  categoryTabGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  categoryTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedCategoryTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ideasContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Reduced from 100 to move content up
  },
  ideaCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  topBanner: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  contentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  mediaPreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  audioText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#EC4899',
    fontWeight: '500',
  },
  todoPreview: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  todoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  moreTodos: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 4,
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ideaCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ideaTag: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  moreTag: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default HomeScreen;