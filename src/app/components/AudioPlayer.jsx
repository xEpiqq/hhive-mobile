import React from 'react';
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import { ActivityIndicator } from "react-native";
import { Images } from '../../../public/index';

const AudioPlayer = (props) => {
  const { url, style } = props;
  const [paused, setPaused] = useState(true);

  const videoRef = useRef(null);
  
  const [totalLength, setTotalLength] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const onSeek = (time) => {
    time = Math.round(time);
    videoRef.current.seek(time);
    setCurrentPosition(time);
    setPaused(false);
  };

  const fixDuration = (data) => {
    setLoading(false);
    setTotalLength(Math.floor(data.duration));
  };

  const setTime = (data) => {
    setCurrentPosition(Math.floor(data.currentTime));
  };

  const togglePlay = () => {
    setPaused(!paused);
  };

  function toHHMMSS(secs) {
    const sec_num = parseInt(secs, 10);
    const hours = Math.floor(sec_num / 3600);
    const minutes = Math.floor(sec_num / 60) % 60;
    const seconds = sec_num % 60;

    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  }

  return (
    <View style={[style && style, {}]}>
      <Video
        source={{ uri: url }}
        ref={videoRef}
        playInBackground={false}
        audioOnly={true}
        playWhenInactive={false}
        paused={paused}
        onEnd={() => videoRef.current.seek(0)}
        onLoad={fixDuration}
        onLoadStart={() => setLoading(true)}
        onProgress={setTime}
        volume={1.0}
        repeat={true}
        style={{ height: 0, width: 0 }}
      />

      <View>
        <View style={styles.controlsContainer}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#FFF"/>
            </View>
          ) : (
            <View style={styles.controlRow}>
              <TouchableOpacity onPress={togglePlay}>
                <Image
                  source={paused ? Images.playIcon : Images.pauseIcon}
                  style={styles.playPauseIcon}
                />
              </TouchableOpacity>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(totalLength, 1, currentPosition + 1)}
                minimumTrackTintColor={'#fff'}
                maximumTrackTintColor={'grey'}
                onSlidingComplete={onSeek}
                value={currentPosition}
              />
              <Text style={styles.timeText}>
                {toHHMMSS(currentPosition)} / {toHHMMSS(totalLength)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    margin: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  playPauseIcon: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  slider: {
    flex: 1,
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default AudioPlayer;
