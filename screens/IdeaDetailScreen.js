import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIdeas } from '../context/IdeasContext';
import { Audio } from 'expo-audio';

const IdeaDetailScreen = ({ navigation, route }) => {
  const { ideaId } = route.params;
  const { ideas, deleteIdea } = useIdeas();
  const idea = ideas.find(i => i.id === ideaId);
  
  if (!idea) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text>Logue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    deleteIdea(ideaId);
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate('Create', { editMode: true, idea });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logue Detail</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: idea.color || '#F3E8FF' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name={idea.type === 'voice' ? 'mic' : 'document-text'} size={20} color="#6B7280" />
            <Text style={styles.typeText}>{idea.type}</Text>
          </View>
          
          <Text style={styles.title}>{idea.title || 'Untitled'}</Text>
          
          {idea.description && (
            <Text style={styles.description}>{idea.description}</Text>
          )}
          
          {idea.audioUri && (
            <TouchableOpacity style={styles.audioPlayer}>
              <Ionicons name="play-circle" size={48} color="#A855F7" />
              <Text style={styles.audioText}>Play Recording</Text>
            </TouchableOpacity>
          )}
          
          {idea.mediaFiles && idea.mediaFiles.length > 0 && (
            <ScrollView horizontal style={styles.mediaContainer}>
              {idea.mediaFiles.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.mediaImage} />
              ))}
            </ScrollView>
          )}
          
          <View style={styles.metadata}>
            <Text style={styles.category}>{idea.category}</Text>
            <Text style={styles.date}>{new Date(idea.createdAt).toLocaleDateString()}</Text>
          </View>
          
          {idea.tags && idea.tags.length > 0 && (
            <View style={styles.tags}>
              {idea.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 20,
  },
  audioPlayer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  audioText: {
    marginTop: 8,
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '500',
  },
  mediaContainer: {
    marginBottom: 20,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#7C3AED',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IdeaDetailScreen;