import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { View, Text, TouchableOpacity, Image, StatusBar, Animated, Dimensions, FlatList, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useFocusEffect } from '@react-navigation/native';
import AudioPlayer from './components/AudioPlayer';

const GameScreen = ({ user, setIsLoading, setShowBottomNav }) => {
  const { width: screenWidth } = Dimensions.get('window');

  const [musicSelected, setMusicSelected] = useState(false);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [choirName, setChoirName] = useState('');
  const [player, setPlayer] = useState(null);
  const [chatScreen, setChatScreen] = useState(false);
  const [choirId, setChoirId] = useState(null);
  const [lastOpened, setLastOpened] = useState({});
  const [currentPage, setCurrentPage] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const scrollToNextPage = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({ offset: screenWidth * (currentPage + 1), animated: true });
    }
  }, [screenWidth, currentPage]);

  const scrollToPrevPage = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({ offset: screenWidth * (currentPage - 1), animated: true });
    }
  }, [screenWidth, currentPage]);

  const handleSelectSong = useCallback((song) => {
    setSelectedSong(song);
    setMusicSelected(true);
    setShowBottomNav(false);
    if (player) {
      player.pause();
    }
    updateLastOpenedDate(song.songId);
  }, [player, setShowBottomNav]);

  const updateLastOpenedDate = useCallback((songId) => {
    const currentDate = new Date().toISOString();
    firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        [`lastOpened.${songId}`]: currentDate
      })
      .then(() => {
        setLastOpened(prevState => ({ ...prevState, [songId]: currentDate }));
      })
      .catch(error => {
        console.error('Error updating last opened date:', error);
      });
  }, [user.uid]);

  const formatDate = useCallback((dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  useEffect(() => {
    let userSubscriberUnsubscribe = () => {};
    let choirSubscriberUnsubscribe = () => {};
    
    setIsLoading(true);

    const userSubscriber = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(userDocumentSnapshot => {
        const userData = userDocumentSnapshot.data();
        const selectedChoir = userData?.choir_selected;
        setChoirId(selectedChoir);
        setLastOpened(userData?.lastOpened || {});

        if (selectedChoir) {
          firestore().collection('choirs').doc(selectedChoir).get().then(choirDoc => {
            if (choirDoc.exists) {
              const choirData = choirDoc.data();
              setChoirName(choirData.name);

              const choirSubscriber = firestore()
                .collection('choirs')
                .doc(selectedChoir)
                .collection('songs')
                .onSnapshot(snapshot => {
                  const songsData = snapshot.docs.map(doc => ({
                    songId: doc.id,
                    name: doc.data().name,
                    files: doc.data().files || []
                  }));
                  setSongs(songsData);
                  setIsLoading(false);
                });
              
              choirSubscriberUnsubscribe = choirSubscriber;
              setIsLoading(false);
            } else {
              setChoirName('No choir found');
              setIsLoading(false);
            }
          }).catch(error => {
            console.error("Error fetching choir details:", error);
            setChoirName('Error fetching choir');
            setIsLoading(false);
          });
        } else {
          setChoirName('No choir selected');
          setIsLoading(false);
        }
      });

    userSubscriberUnsubscribe = userSubscriber;

    return () => {
      userSubscriberUnsubscribe();
      choirSubscriberUnsubscribe();
    };
  }, [user.uid, setIsLoading]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start();
  }, [spinValue]);

  const spin = useMemo(() => spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '7000deg'],
  }), [spinValue]);

  const fetchDownloadURLs = useCallback(async () => {
    if (selectedSong && selectedSong.files) {
      const downloadURLs = await Promise.all(
        selectedSong.files.map(async (file) => {
          try {
            const downloadURL = await storage().ref(file.url).getDownloadURL();
            return { ...file, downloadURL };
          } catch (error) {
            console.error('Error getting download URL:', error);
            return file;
          }
        })
      );
      setSelectedSong({ ...selectedSong, files: downloadURLs });
    }
  }, [selectedSong]);

  useEffect(() => {
    fetchDownloadURLs();
  }, [fetchDownloadURLs]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50
  }), []);

  const renderItem = useCallback(({ item: song }) => (
    <View key={song.songId} className="w-screen h-screen flex items-center justify-center bg-white -mt-36">
      <TouchableOpacity onPress={() => handleSelectSong(song)}>
        <Text className='bg-white font-thin'>Last Opened: {lastOpened[song.songId] ? formatDate(lastOpened[song.songId]) : 'NEVER...'}</Text>
        <View className='relative flex items-center justify-center'>
          <Image
            source={require('../../public/cherryblossom.png')}
            className='absolute w-screen h-16 -z-10'
          />
          <Animated.Image
            source={require('../../public/musicdisk.png')}
            style={{ width: 120, height: 120, transform: [{ rotate: spin }] }}
          />
        </View>
        <Text className="text-center font-bold mt-5 text-5xl">{song.name.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  ), [handleSelectSong, lastOpened, formatDate, spin]);

  const paginationDots = useMemo(() => (
    songs.map((_, index) => {
      const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];
      const dotOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View
          key={index}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#7d7d7d',
            marginHorizontal: 4,
            opacity: dotOpacity,
          }}
        />
      );
    })
  ), [scrollX, songs]);

  const handleBackPress = useCallback(() => {
    if (musicSelected) {
      setMusicSelected(false);
      setSelectedSong(null);
      setShowBottomNav(true);
      return true;
    }
    return false;
  }, [musicSelected, setShowBottomNav]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (handleBackPress()) {
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleBackPress])
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <View style={{ paddingTop: 30 }}>
        <StatusBar barStyle="light-content" backgroundColor="#FFCE00" />
      </View>


          {!musicSelected && selectedSong ? (
            <>
                <View className="flex-row justify-between px-4 py-3 items-center bg-[#FFCE00]">
                  <View className="flex-row items-center">
                    <Image source={require('../../public/honeycomb.png')} className="h-10 w-10" />
                    <Text className="text-white ml-2">1</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-white mx-2">2356</Text>
                    <Image source={require('../../public/honeycomb.png')} className="h-6 w-6" />
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-white mr-2">5</Text>
                    <Image source={require('../../public/honeycomb.png')} className="h-6 w-6" />
                  </View>
                </View>
            </>
          ) : null}


      <View className="flex-1">
        {chatScreen ? (
          <View></View>
        ) : (
          <>



            {musicSelected && selectedSong ? (
              <View style={{ flex: 1 }} className='bg-white'>
                {selectedSong && selectedSong.files && (
                  <>
                    <TouchableOpacity onPress={handleBackPress} style={{ position: 'absolute', top: 20, left: 10, zIndex: 1 }}>
                      <Image source={require('../../public/grayarrow.png')} style={{ width: 20, height: 20, opacity: 0.5}} />
                    </TouchableOpacity>
                    <View className='-mt-16'>
                    <FlatList
                      ref={scrollViewRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      data={[...Array(17).keys()]} // Dummy data array to render 17 items
                      renderItem={({ index }) => {
                        const images = [
                          require('../../public/Is He Worthy-01.png'),
                          require('../../public/Is He Worthy-02.png'),
                          require('../../public/Is He Worthy-03.png'),
                          require('../../public/Is He Worthy-04.png'),
                          require('../../public/Is He Worthy-05.png'),
                          require('../../public/Is He Worthy-06.png'),
                          require('../../public/Is He Worthy-07.png'),
                          require('../../public/Is He Worthy-08.png'),
                          require('../../public/Is He Worthy-09.png'),
                          require('../../public/Is He Worthy-10.png'),
                          require('../../public/Is He Worthy-11.png'),
                          require('../../public/Is He Worthy-12.png'),
                          require('../../public/Is He Worthy-13.png'),
                          require('../../public/Is He Worthy-14.png'),
                          require('../../public/Is He Worthy-15.png'),
                          require('../../public/Is He Worthy-16.png'),
                          require('../../public/Is He Worthy-17.png'),
                          require('../../public/Is He Worthy-18.png'),
                          require('../../public/Is He Worthy-19.png'),
                        ];
                        return (
                          <View style={{ width: screenWidth, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Image
                              source={images[index]}
                              style={{ width: screenWidth, height: '100%' }}
                              resizeMode="contain"
                            />
                          </View>
                        );
                      }}
                      keyExtractor={(item, index) => index.toString()}
                      onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                      )}
                    />
                    </View>
                      
                    <View className='w-full h-20 flex justify-center bg-[#FFCE00] absolute b-0 bottom-0'>
                      <AudioPlayer
                        // key={`${file.name}-${index}_audioplayer`}
                        url="https://firebasestorage.googleapis.com/v0/b/harmonyhive-b4705.appspot.com/o/TUnrM8z359eWvkV6xnFY%2Fsongs%2F1rmeWWmcyiVwo0j4q399%2Faudio.mp3?alt=media&token=e9c82cee-2f73-4732-8eac-254737b0f16b" // Pass the download URL directly
                      />
                    </View>

                  </>
                )}
              </View>
            ) : (
              <>
                <Text className='bg-white font-thin'>{choirName}</Text>
                <FlatList
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  data={songs}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.songId}
                  contentContainerStyle={{ flexGrow: 1 }}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                  )}
                />

                <View className="flex-row justify-center p-4 bg-white">
                  {paginationDots}
                </View>
              </>
            )}
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default GameScreen;