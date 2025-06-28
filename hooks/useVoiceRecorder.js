import { useState, useRef } from 'react';
import { Audio } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export const useVoiceRecorder = () => {
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const recordingTimer = useRef(null);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Haptic feedback
      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      return recording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;
    
    clearInterval(recordingTimer.current);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      
      // Haptic feedback
      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  };

  const playRecording = async (uri = audioUri) => {
    if (!uri) return;
    
    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!sound || sound._uri !== uri) {
          // Create new sound instance
          if (sound) {
            await sound.unloadAsync();
          }
          
          const { sound: newSound } = await Audio.Sound.createAsync({ uri });
          setSound(newSound);
          
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          });
          
          await newSound.playAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw error;
    }
  };

  const deleteRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setAudioUri(null);
      setRecordingDuration(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup function
  const cleanup = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      if (sound) {
        await sound.unloadAsync();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  return {
    // State
    recording,
    recordingDuration,
    audioUri,
    isPlaying,
    sound,
    
    // Actions
    startRecording,
    stopRecording,
    playRecording,
    deleteRecording,
    cleanup,
    
    // Utilities
    formatDuration,
    isRecording: !!recording,
  };
};