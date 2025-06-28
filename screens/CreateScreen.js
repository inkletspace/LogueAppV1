{selectedType === 'todo' && (
            <View style={styles.section}>
              <Text style={styles.label}>Todo List</Text>
              <View style={styles.todoContainer}>
                <View style={styles.todoInputContainer}>
                  <TextInput
                    style={styles.todoInput}
                    placeholder="Add a new task..."
                    placeholderTextColor="#9CA3AF"
                    value={todoInput}
                    onChangeText={setTodoInput}
                    onSubmitEditing={addTodoItem}
                  />
                  <TouchableOpacity style={styles.todoAddButton} onPress={addTodoItem}>
                    <Ionicons name="add" size={20} color="#A855F7" />
                  </TouchableOpacity>
                </View>
                
                {todoItems.map((todo) => (
                  <View key={todo.id} style={styles.todoItemContainer}>
                    <TouchableOpacity onPress={() => toggleTodoCompletion(todo.id)}>
                      <Ionicons 
                        name={todo.completed ? 'checkbox' : 'square-outline'} 
                        size={20} 
                        color={todo.completed ? '#10B981' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.todoTextInput,
                        todo.completed && styles.todoTextCompleted
                      ]}
                      value={todo.text}
                      onChangeText={(newText) => updateTodoText(todo.id, newText)}
                      multiline
                    />
                    <TouchableOpacity onPress={() => deleteTodoItem(todo.id)}>
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {todoItems.length === 0 && (
                  <Text style={styles.todoEmptyText}>Add tasks to get started</Text>
                )}
              </View>
            </View>
          )}import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
// Remove LinearGradient import for now
// import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useIdeas } from '../context/IdeasContext';

const { width } = Dimensions.get('window');

const CreateScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addIdea, categories, addCategory } = useIdeas();
  
  // Quick capture detection
  const isQuickCapture = route.params?.quickCapture;
  const captureType = route.params?.captureType;
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState(captureType || 'text');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#F8FAFC');
  const [selectedStack, setSelectedStack] = useState('');
  
  // Voice recording state
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  
  // Media state
  const [mediaFiles, setMediaFiles] = useState([]);
  
  // Todo state
  const [todoItems, setTodoItems] = useState([]);
  const [todoInput, setTodoInput] = useState('');
  
  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Text formatting
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    highlight: false,
  });
  
  const recordingTimer = useRef(null);

  const noteTypes = [
    { id: 'text', name: 'Text', icon: 'document-text' },
    { id: 'voice', name: 'Voice', icon: 'mic' },
    { id: 'photo', name: 'Photo', icon: 'image' },
    { id: 'video', name: 'Video', icon: 'videocam' },
    { id: 'todo', name: 'To-Do', icon: 'checkbox-outline' },
  ];

  const cardColors = [
    '#FEF2F2', '#FEF3C7', '#F0FDF4', '#EFF6FF', '#F5F3FF',
    '#FDF2F8', '#ECFDF5', '#FEF9C3', '#E0F2FE', '#F3E8FF',
    '#FCE7F3', '#DBEAFE', '#D1FAE5', '#FED7AA', '#E0E7FF',
    '#F8FAFC', '#F1F5F9', '#F9FAFB', '#F3F4F6', '#E5E7EB',
  ];

  useEffect(() => {
    // Request permissions
    (async () => {
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (audioStatus !== 'granted') {
        Alert.alert('Permission needed', 'Please enable microphone access in your device settings to record voice notes.');
      }
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission needed', 'Please enable camera access in your device settings to take photos/videos.');
      }
    })();
    
    // Reset form when navigating to create screen (not edit mode)
    const unsubscribe = navigation.addListener('focus', () => {
      if (!route.params?.editMode) {
        // Reset all form fields
        setTitle('');
        setDescription('');
        setSelectedType(route.params?.captureType || 'text');
        setSelectedCategory('');
        setTags([]);
        setTagInput('');
        setIsPrivate(true);
        setSelectedColor('#F8FAFC');
        setSelectedStack('');
        setRecording(null);
        setRecordingDuration(0);
        setAudioUri(null);
        setIsPlaying(false);
        setMediaFiles([]);
        if (sound) {
          sound.unloadAsync();
          setSound(null);
        }
      }
    });
    
    // Start recording immediately for quick voice capture
    if (isQuickCapture && captureType === 'voice') {
      startRecording();
    }
    
    return () => {
      unsubscribe();
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [navigation, route.params]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setRecordingDuration(0);
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      Alert.alert('Recording Error', 'Unable to start recording. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    clearInterval(recordingTimer.current);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;
    
    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!sound) {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
          setSound(newSound);
          await newSound.playAsync();
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        } else {
          await sound.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (err) {
      Alert.alert('Playback Error', 'Unable to play recording.');
    }
  };

  // Media functions
  const pickMedia = async (mediaType) => {
    const options = {
      mediaTypes: mediaType === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: mediaType === 'photo',
      quality: 0.8,
    };
    
    const result = await ImagePicker.launchImageLibraryAsync(options);
    
    if (!result.canceled) {
      if (result.assets) {
        setMediaFiles([...mediaFiles, ...result.assets]);
      }
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets) {
      setMediaFiles([...mediaFiles, result.assets[0]]);
    }
  };

  const takeVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60,
    });
    
    if (!result.canceled && result.assets) {
      setMediaFiles([...mediaFiles, result.assets[0]]);
    }
  };

  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add todo item
  const addTodoItem = () => {
    if (todoInput.trim()) {
      const newTodo = {
        id: Date.now().toString(),
        text: todoInput.trim(),
        completed: false
      };
      setTodoItems([...todoItems, newTodo]);
      setTodoInput('');
    }
  };

  // Toggle todo completion
  const toggleTodoCompletion = (id) => {
    setTodoItems(todoItems.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // Update todo text
  const updateTodoText = (id, newText) => {
    setTodoItems(todoItems.map(todo => 
      todo.id === id ? { ...todo, text: newText } : todo
    ));
  };

  // Delete todo item
  const deleteTodoItem = (id) => {
    setTodoItems(todoItems.filter(todo => todo.id !== id));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Category Modal
  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Categories</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addCategoryContainer}>
            <Text style={styles.modalSubtitle}>Add New Category</Text>
            <View style={styles.addCategoryInput}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Enter category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TouchableOpacity 
                style={styles.addCategoryButton}
                onPress={() => {
                  if (newCategoryName.trim()) {
                    addCategory(newCategoryName.trim());
                    setNewCategoryName('');
                  }
                }}
              >
                <Ionicons name="add" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.categoryCount}>Existing Categories ({categories.length})</Text>
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <View style={styles.categoryItemLeft}>
                  <Ionicons name="menu" size={20} color="#9CA3AF" />
                  <Text style={styles.categoryItemText}>{item}</Text>
                </View>
                <View style={styles.categoryItemRight}>
                  <Text style={styles.visibleText}>Visible</Text>
                  <Ionicons name="eye" size={20} color="#9CA3AF" />
                  <TouchableOpacity>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Save logue
  const saveLogue = async () => {
    if (!title.trim() && !description.trim() && !audioUri && mediaFiles.length === 0 && todoItems.length === 0) {
      Alert.alert('Add Content', 'Please add a title, description, recording, media, or todo items.');
      return;
    }
    
    try {
      const logueData = {
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        category: selectedCategory || 'Uncategorized',
        tags,
        isPublic: !isPrivate,
        color: selectedColor,
        audioUri,
        mediaFiles: mediaFiles.map(file => file.uri),
        recordingDuration,
        stack: selectedStack,
        todoItems: selectedType === 'todo' ? todoItems : undefined,
      };
      
      await addIdea(logueData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save logue. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Louge</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>What's your Louge about?</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Title your Louge..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Privacy */}
          <View style={styles.privacySection}>
            <View style={styles.privacyLeft}>
              <Ionicons name="lock-closed" size={20} color="#6B7280" />
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>Private</Text>
                <Text style={styles.privacySubtitle}>Only you can see this Louge</Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#E5E7EB', true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Note Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Note Type</Text>
            <View style={styles.typeButtons}>
              {noteTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && styles.selectedTypeButton,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={selectedType === type.id ? '#A855F7' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.id && styles.selectedTypeButtonText,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type-specific content */}
          {selectedType === 'voice' && (
            <View style={styles.section}>
              <Text style={styles.label}>Voice Recording</Text>
              <View style={styles.voiceContainer}>
                {!audioUri ? (
                  <>
                    <TouchableOpacity
                      style={[styles.recordButton, recording && styles.recordingButton]}
                      onPress={recording ? stopRecording : startRecording}
                    >
                      <Ionicons
                        name={recording ? 'stop' : 'mic'}
                        size={32}
                        color="white"
                      />
                    </TouchableOpacity>
                    {recording && (
                      <Text style={styles.recordingText}>
                        Recording... {formatDuration(recordingDuration)}
                      </Text>
                    )}
                    {!recording && !audioUri && (
                      <Text style={styles.tapToRecord}>Tap the microphone to start recording</Text>
                    )}
                  </>
                ) : (
                  <View style={styles.audioPlayback}>
                    <TouchableOpacity onPress={playRecording} style={styles.playButton}>
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color="#A855F7"
                      />
                    </TouchableOpacity>
                    <View style={styles.audioDuration}>
                      <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                      setAudioUri(null);
                      setRecordingDuration(0);
                      if (sound) {
                        sound.unloadAsync();
                        setSound(null);
                      }
                    }}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {selectedType === 'photo' && (
            <View style={styles.section}>
              <Text style={styles.label}>Media Upload</Text>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#6B7280" />
                  <Text style={styles.mediaButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={() => pickMedia('photo')}>
                  <Ionicons name="images" size={24} color="#6B7280" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              {mediaFiles.length > 0 && (
                <ScrollView horizontal style={styles.mediaPreview}>
                  {mediaFiles.map((file, index) => (
                    <View key={index} style={styles.mediaPreviewItem}>
                      <Image source={{ uri: file.uri }} style={styles.mediaPreviewImage} />
                      <TouchableOpacity
                        style={styles.removeMedia}
                        onPress={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {selectedType === 'video' && (
            <View style={styles.section}>
              <Text style={styles.label}>Video Upload</Text>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={takeVideo}>
                  <Ionicons name="videocam" size={24} color="#6B7280" />
                  <Text style={styles.mediaButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={() => pickMedia('video')}>
                  <Ionicons name="film" size={24} color="#6B7280" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              {mediaFiles.length > 0 && (
                <ScrollView horizontal style={styles.mediaPreview}>
                  {mediaFiles.map((file, index) => (
                    <View key={index} style={styles.mediaPreviewItem}>
                      <View style={styles.videoPreview}>
                        <Ionicons name="play-circle" size={40} color="#FFFFFF" />
                      </View>
                      <TouchableOpacity
                        style={styles.removeMedia}
                        onPress={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Note/Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Note</Text>
            <View style={styles.textEditor}>
              <View style={styles.textToolbar}>
                <TouchableOpacity
                  style={[styles.textTool, textStyles.bold && styles.textToolActive]}
                  onPress={() => setTextStyles({ ...textStyles, bold: !textStyles.bold })}
                >
                  <Text style={[styles.textToolText, { fontWeight: 'bold' }]}>B</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.textTool, textStyles.italic && styles.textToolActive]}
                  onPress={() => setTextStyles({ ...textStyles, italic: !textStyles.italic })}
                >
                  <Text style={[styles.textToolText, { fontStyle: 'italic' }]}>I</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.textTool, textStyles.underline && styles.textToolActive]}
                  onPress={() => setTextStyles({ ...textStyles, underline: !textStyles.underline })}
                >
                  <Text style={[styles.textToolText, { textDecorationLine: 'underline' }]}>U</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.textTool, textStyles.highlight && styles.textToolActive]}
                  onPress={() => setTextStyles({ ...textStyles, highlight: !textStyles.highlight })}
                >
                  <Text style={[styles.textToolText, { backgroundColor: textStyles.highlight ? '#FEF3C7' : 'transparent' }]}>H</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.textTool}>
                  <Ionicons name="list" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.descriptionInput,
                  textStyles.bold && { fontWeight: 'bold' },
                  textStyles.italic && { fontStyle: 'italic' },
                  textStyles.underline && { textDecorationLine: 'underline' },
                  textStyles.highlight && { backgroundColor: '#FEF3C7' },
                ]}
                placeholder="Type your note, idea, thought..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <View style={styles.categoryHeader}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {categories.slice(0, 14).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.selectedCategoryChip,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.selectedCategoryChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.newCategoryChip}
                onPress={() => setShowCategoryModal(true)}
              >
                <Ionicons name="add" size={16} color="#10B981" />
                <Text style={styles.newCategoryText}>New</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag..."
                placeholderTextColor="#9CA3AF"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addButton} onPress={addTag}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => setTags(tags.filter((_, i) => i !== index))}>
                      <Ionicons name="close" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Add to Stack */}
          <View style={styles.section}>
            <View style={styles.stackHeader}>
              <Text style={styles.label}>Add to Stack (Optional)</Text>
              <TouchableOpacity>
                <Text style={styles.newStackButton}>+ New Stack</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.stackSelector}>
              <Text style={styles.stackSelectorText}>
                {selectedStack || 'Choose a stack or leave empty'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Card Color */}
          <View style={styles.section}>
            <Text style={styles.label}>Card Color</Text>
            <View style={styles.colorGrid}>
              {cardColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#A855F7" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.customColorButton}>
              <Ionicons name="color-palette" size={20} color="#6B7280" />
              <Text style={styles.customColorText}>Show Custom Colors</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button - Simple version without gradient */}
          <TouchableOpacity style={styles.submitButton} onPress={saveLogue}>
            <Text style={styles.submitButtonText}>Create Louge</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CategoryModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A855F7',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  privacySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyText: {
    marginLeft: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  privacySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedTypeButton: {
    borderColor: '#A855F7',
    backgroundColor: '#F3E8FF',
  },
  typeButtonText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#A855F7',
  },
  voiceContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingButton: {
    backgroundColor: '#1F2937',
  },
  recordingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
  },
  tapToRecord: {
    marginTop: 20,
    fontSize: 14,
    color: '#9CA3AF',
  },
  audioPlayback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioDuration: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  mediaPreview: {
    marginTop: 12,
  },
  mediaPreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  textEditor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  textToolbar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
  },
  textTool: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  textToolActive: {
    backgroundColor: '#FEF3C7',
  },
  textToolText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  descriptionInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    color: '#1F2937',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryChip: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  newCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 4,
  },
  newCategoryText: {
    fontSize: 14,
    color: '#10B981',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#7C3AED',
  },
  stackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newStackButton: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '500',
  },
  stackSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stackSelectorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#A855F7',
  },
  customColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  customColorText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  todoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  todoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  todoInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  todoAddButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  todoTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 4,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  todoEmptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: '#A855F7',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  addCategoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addCategoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  categoryInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  addCategoryButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  categoryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  visibleText: {
    fontSize: 13,
    color: '#A855F7',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default CreateScreen;