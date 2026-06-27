import React from 'react';
import { Modal, Text, View } from 'react-native';
import { SecondaryButton } from '../SecondaryButton';
import { AudioVisualizer } from '../AudioVisualizer';
import { styles } from './styles';

interface VoiceOverlayProps {
  visible: boolean;
  transcript: string;
  onCancel: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ visible, transcript, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Listening...</Text>
          <AudioVisualizer active={visible} />
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>{transcript || 'Speak now...'}</Text>
          </View>
          <SecondaryButton label="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
};
