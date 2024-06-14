// data={selectedSong.files}
// renderItem={({ item }) => (
//     <View className="w-screen h-screen">
//       {/* <Image
//         source={{ uri: item.downloadURL }}
//         className="w-full h-full"
//       /> */}
//     <Image
//       source={require('../../public/Is He Worthy-02.png')}
//       className="w-full h-full"
//     />
//     </View>
//   )}
//   keyExtractor={(item, index) => index.toString()}
//   onScroll={Animated.event(
//     [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//     { useNativeDriver: false }
//   )}









// import React from 'react';
// import { useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
// import Video from 'react-native-video';
// import Slider from '@react-native-community/slider'
// import { ActivityIndicator, LayoutAnimation, UIManager } from "react-native";
// import { Platform } from "react-native";
// import { Images } from '../../../public/index'

// const volumeControlTime = 3000;

// const AudioPlayer = (props) => {
//     const { url, style, repeatOnComponent, repeatOffComponent } = props;
//     const [paused, setPaused] = useState(true);
  
//     const videoRef = useRef(null);
//     const controlTimer = useRef(0);
  
//     const [totalLength, setTotalLength] = useState(0);
//     const [currentPosition, setCurrentPosition] = useState(0);
//     const [loading, setLoading] = useState(false);
//     const [volume, setVolume] = useState(0.7);
//     const [volumeControl, setVolumeControl] = useState(false);
//     const [repeat, setRepeat] = useState(false);
  
//     const onSeek = (time) => {
//       time = Math.round(time);
//       videoRef && videoRef.current.seek(time);
//       setCurrentPosition(time);
//       setPaused(false);
//     };
  
//     const fixDuration = (data) => {
//       setLoading(false);
//       setTotalLength(Math.floor(data.duration));
//     };
  
//     const setTime = (data) => {
//       setCurrentPosition(Math.floor(data.currentTime));
//     };
  
//     const togglePlay = () => {
//       setPaused(!paused);
//     };
  
//     const toggleRepeat = () => {
//       setRepeat(!repeat);
//     };
  
//     const toggleVolumeControl = () => {
//       setVolumeTimer(!volumeControl);
//       LayoutAnimation.easeInEaseOut();
//       setVolumeControl(!volumeControl);
//     };
  
//     const setVolumeTimer = (setTimer = true) => {
//       clearTimeout(controlTimer.current);
//       controlTimer.current = 0;
//       if (setTimer) {
//         controlTimer.current = setTimeout(() => {
//           LayoutAnimation.easeInEaseOut();
//           setVolumeControl(false);
//         }, volumeControlTime);
//       }
//     };
  
//     const onVolumeChange = (vol) => {
//       setVolumeTimer();
//       setVolume(vol);
//     };
  
//     const resetAudio = () => {
//       if (!repeat) {
//         setPaused(true);
//       }
//       setCurrentPosition(0);
//     };
  
//     function toHHMMSS(secs) {
//       const sec_num = parseInt(secs, 10);
//       const hours = Math.floor(sec_num / 3600);
//       const minutes = Math.floor(sec_num / 60) % 60;
//       const seconds = sec_num % 60;
    
//       return [hours, minutes, seconds]
//         .map((v) => (v < 10 ? "0" + v : v))
//         .filter((v, i) => v !== "00" || i > 0)
//         .join(":");
//     }
  
//     return (
//       <View style={[style && style, {}]}>
//         <Video
//           source={{ uri: url }}
//           ref={videoRef}
//           playInBackground={false}
//           audioOnly={true}
//           playWhenInactive={false}
//           paused={paused}
//           onEnd={resetAudio}
//           onLoad={fixDuration}
//           onLoadStart={() => setLoading(true)}
//           onProgress={setTime}
//           volume={volume}
//           repeat={repeat}
//           style={{ height: 0, width: 0 }}
//         />
  
//         <View>
//           <View className="justify-end items-center">
//             {loading && (
//               <View className="m-16">
//                 <ActivityIndicator size="large" color="#FFF"/>
//               </View>
//             ) || (
//               <View className="flex flex-row justify-around items-center w-11/12 mb-10"
//               >
//                 <TouchableOpacity
//                   hitSlop={{ top: 10, bottom: 10, right: 10, left: 10 }}
//                   className="align-middle relative"
//                   onPress={toggleRepeat}
//                 >
                  
  
//                   <Image source={Images.repeatIcon} className="h-[30px] w-[30px] object-contain"/>
//                   {!repeat && <View
//                   className="absolute transform -rotate-[60deg] top-15 left--1 w-30 h-1 border-b-2 border-white"
//                   />}
//                 </TouchableOpacity>
//                 <TouchableOpacity className="align-middle relative justify-center items-center" onPress={togglePlay}>
//                   <Image
//                     source={paused ? Images.playIcon :  Images.pauseIcon}
//                     className="h-[30px] w-[30px] object-contain"
//                   />
//                 </TouchableOpacity>
//                 <View
//                   style={[
//                     styles.volumeControlContainer,
//                     volumeControl ? { paddingHorizontal: 12 } : { backgroundColor: "transparent" }
//                   ]}
//                 >
//                   <TouchableOpacity
//                     hitSlop={{ top: 10, bottom: 10, right: 10, left: 10 }}
//                     className="align-middle relative"
  
//                     onPress={toggleVolumeControl}
//                   >
//                     <Image
//                       source={volume === 0 ?  Images.muteIcon : Images.soundIcon}
//                       className="h-[30px] w-[30px] object-contain"
//                     />
//                   </TouchableOpacity>
//                   {volumeControl && (
//                     <Slider
//                       className="w-1/2"
//                       minimumValue={0}
//                       maximumValue={1}
//                       minimumTrackTintColor={'#fff'}
//                       maximumTrackTintColor={'grey'}
//                       thumbTintColor={'#fff'}
//                       onSlidingComplete={onVolumeChange}
//                       value={volume}
//                     />
//                   )}
//                 </View>
//               </View>
//             )}
  
//             <View className="px-16 pb-12 w-full"
//             >
  
//               <Slider
//                 className="h-28 w-full mb-3"
//                 minimumValue={0}
//                 maximumValue={Math.max(totalLength, 1, currentPosition + 1)}
//                 minimumTrackTintColor={'#fff'}
//                 maximumTrackTintColor={'grey'}
//                 onSlidingComplete={onSeek}
//                 value={currentPosition}
//               />
//               <View className="flex flex-row justify-between">
  
  
//                 <Text className="text-white text-lg">
//                   {toHHMMSS(currentPosition)}
//                 </Text>
//                 <Text className="text-white text-lg">
//                   {toHHMMSS(totalLength)}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>
//       </View>
//     );
//   };
  
  
//   const styles = StyleSheet.create({
  
//     volumeControlContainer: {
//       display: "flex",
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-evenly",
//       backgroundColor: "#00000099",
//       paddingHorizontal: 16,
//       borderRadius: 50,
//       ...Platform.select({
//         ios: {
//           height: 44
//         },
//         android: {
//           height: 40
//         },
//       }),
//     },
//   }); 

// export default AudioPlayer;