import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function Profile({ user }) {
  const [userData, setUserData] = useState(null);
  const [choirNames, setChoirNames] = useState([]);
  const [selectedChoir, setSelectedChoir] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          setUserData(data);
          setSelectedChoir(data.choir_selected);
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user.uid]);

  useEffect(() => {
    const fetchChoirNames = async () => {
      if (userData && userData.choirs_joined) {
        const choirPromises = userData.choirs_joined.map(async (choirId) => {
          const choirDoc = await firestore().collection('choirs').doc(choirId).get();
          if (choirDoc.exists) {
            return {
              id: choirDoc.id,
              name: choirDoc.data().name,
            };
          }
          return null;
        });

        const choirs = await Promise.all(choirPromises);
        setChoirNames(choirs.filter((choir) => choir !== null));
      }
    };

    fetchChoirNames();
  }, [userData]);

  async function signOut() {
    try {
      await auth().signOut();
    } catch (error) {
      console.log(error);
    }
  }

  const handleChoirSelect = async (choirId) => {
    try {
      await firestore().collection('users').doc(user.uid).update({
        choir_selected: choirId,
      });
      setSelectedChoir(choirId);
    } catch (error) {
      console.log('Error updating selected choir:', error);
    }
  };

  const renderChoirItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleChoirSelect(item.id)}
      className={`px-4 py-2 border-b border-gray-200 ${
        item.id === selectedChoir ? 'bg-blue-100' : ''
      }`}
    >
      <Text className="text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white mt-10">
      {/* Profile info */}
      <View className="items-center mt-8">
        <Image source={{ uri: user.photoURL }} className="w-24 h-24 rounded-full" />
        <Text className="text-2xl font-bold mt-4">{user.displayName}</Text>
        <Text className="text-gray-500">{user.email}</Text>
      </View>

      {/* Choirs section */}
      <View className="mt-8">
        <Text className="text-xl font-bold px-4 mb-2">Choirs</Text>
        {choirNames.length > 0 ? (
          <FlatList
            data={choirNames}
            renderItem={renderChoirItem}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text className="px-4 py-2 text-gray-500">No choirs joined</Text>
        )}
      </View>

      {/* Sign out button */}
      <TouchableOpacity
        className="bg-blue-500 py-3 px-6 rounded-full mt-8 mx-4"
        onPress={signOut}
      >
        <Text className="text-white text-center font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Profile;