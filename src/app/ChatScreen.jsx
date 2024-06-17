import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import { format } from "date-fns";
import DocumentPicker from "react-native-document-picker";
import storage from "@react-native-firebase/storage";
import { SvgXml } from "react-native-svg";
import Tts from "react-native-tts";
import EmojiPicker from "rn-emoji-keyboard";
// import RNFS from 'react-native-fs';
import auth from "@react-native-firebase/auth";
import { VirtualizedList } from "react-native";
import { UserContext } from "@/components/UserContext";


// TODO: organize this better
const microphoneSvg = `
<svg fill="#585858" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g>
    <g>
      <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"/>
      <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"/>
    </g>
  </g>
</svg>
`;

const sendSvgGray = `
<svg viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
    <title>ic_fluent_send_28_filled</title>
    <desc>Created with Sketch.</desc>
    <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill-rule="evenodd">
        <g id="ic_fluent_send_28_filled" fill="#e1e1e1" fill-rule="nonzero">
            <path d="M3.78963301,2.77233335 L24.8609339,12.8499121 C25.4837277,13.1477699 25.7471402,13.8941055 25.4492823,14.5168992 C25.326107,14.7744476 25.1184823,14.9820723 24.8609339,15.1052476 L3.78963301,25.1828263 C3.16683929,25.4806842 2.42050372,25.2172716 2.12264586,24.5944779 C1.99321184,24.3238431 1.96542524,24.015685 2.04435886,23.7262618 L4.15190935,15.9983421 C4.204709,15.8047375 4.36814355,15.6614577 4.56699265,15.634447 L14.7775879,14.2474874 C14.8655834,14.2349166 14.938494,14.177091 14.9721837,14.0981464 L14.9897199,14.0353553 C15.0064567,13.9181981 14.9390703,13.8084248 14.8334007,13.7671556 L14.7775879,13.7525126 L4.57894108,12.3655968 C4.38011873,12.3385589 4.21671819,12.1952832 4.16392965,12.0016992 L2.04435886,4.22889788 C1.8627142,3.56286745 2.25538645,2.87569101 2.92141688,2.69404635 C3.21084015,2.61511273 3.51899823,2.64289932 3.78963301,2.77233335 Z" id="🎨-Color"/>
        </g>
    </g>
</svg>`;

const sendSvgWhite = `
<svg viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
    <title>ic_fluent_send_28_filled</title>
    <desc>Created with Sketch.</desc>
    <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill-rule="evenodd">
        <g id="ic_fluent_send_28_filled" fill="white" fill-rule="nonzero">
            <path d="M3.78963301,2.77233335 L24.8609339,12.8499121 C25.4837277,13.1477699 25.7471402,13.8941055 25.4492823,14.5168992 C25.326107,14.7744476 25.1184823,14.9820723 24.8609339,15.1052476 L3.78963301,25.1828263 C3.16683929,25.4806842 2.42050372,25.2172716 2.12264586,24.5944779 C1.99321184,24.3238431 1.96542524,24.015685 2.04435886,23.7262618 L4.15190935,15.9983421 C4.204709,15.8047375 4.36814355,15.6614577 4.56699265,15.634447 L14.7775879,14.2474874 C14.8655834,14.2349166 14.938494,14.177091 14.9721837,14.0981464 L14.9897199,14.0353553 C15.0064567,13.9181981 14.9390703,13.8084248 14.8334007,13.7671556 L14.7775879,13.7525126 L4.57894108,12.3655968 C4.38011873,12.3385589 4.21671819,12.1952832 4.16392965,12.0016992 L2.04435886,4.22889788 C1.8627142,3.56286745 2.25538645,2.87569101 2.92141688,2.69404635 C3.21084015,2.61511273 3.51899823,2.64289932 3.78963301,2.77233335 Z" id="🎨-Color"/>
        </g>
    </g>
</svg>`;

const happyFaceSvg = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.301 14.001C8.07344 15.7578 9.98814 17 11.9996 17C14.0025 17 15.9135 15.7546 16.6925 14.0055" stroke="#585858" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="9" r="1.5" fill="#585858"/>   <!-- Left Eye -->
    <circle cx="15" cy="9" r="1.5" fill="#585858"/>  <!-- Right Eye -->
    <circle cx="12" cy="12" r="11" stroke="#585858" stroke-width="2"/>
  </svg>
  `;

function ChatScreen({ onBack, prefetchMessages }) {
  const [messages, setMessages] = useState(prefetchMessages);
  const [inputText, setInputText] = useState("");
  const [showIcons, setShowIcons] = useState("");
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const [emojiKeyboard, setEmojiKeyboard] = useState(false);
  const [emojiKeyboardNumberTwo, setEmojiKeyboardNumberTwo] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});

  const user = useContext(UserContext);

  const [choirId, setChoirId] = useState(null);

  // TODO: WTF is this?
  // Grabs selected choir from database
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const unsubscribe = firestore()
        .collection("users")
        .doc(currentUser.uid)
        .onSnapshot((snapshot) => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            setChoirId(userData.choir_selected);
          }
        });

      return () => unsubscribe();
    }
  }, []);

  // TODO: Literally is not used
  const handleImageLoad = (messageId) => {
    setLoadingImages((prevState) => ({
      ...prevState,
      [messageId]: false,
    }));
  };

  // Loads messages from database
  useEffect(() => {
    if (choirId) {
      const unsubscribe = firestore()
        .collection("choirs")
        .doc(choirId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
          const fetchedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchedMessages);
        });

      return () => unsubscribe();
    }
  }, [choirId]);

  const handleSendMessage = async () => {
    if (inputText.trim() !== "" || selectedFile) {
      // Create a temporary message ID
      const tempMessageId = Date.now().toString();

      // Create the message object
      const messageData = {
        id: tempMessageId, // Use the temporary ID
        message: inputText.trim(),
        createdAt: new Date(), // Use the current date and time
        user: {
          id: user.uid,
          name: user.displayName || user.email,
          avatar: user.photoURL || "https://via.placeholder.com/150",
        },
        temp: true, // Mark this message as temporary
      };

      // Update the state with the new message immediately
      setMessages((prevMessages) => [messageData, ...prevMessages]);
      setInputText("");
      setSelectedFile(null);

      try {
        // Send the message to Firestore
        const messageRef = await firestore()
          .collection("choirs")
          .doc(choirId)
          .collection("messages")
          .add({
            message: inputText.trim(),
            createdAt: firestore.FieldValue.serverTimestamp(),
            user: {
              id: user.uid,
              name: user.displayName || user.email,
              avatar: user.photoURL || "https://via.placeholder.com/150",
            },
          });

        // Update the temporary message ID with the Firestore ID
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempMessageId
              ? { ...msg, id: messageRef.id, temp: false }
              : msg
          )
        );

        // Upload the file if any
        if (selectedFile) {
          uploadFile(selectedFile, messageRef.id);
        }
      } catch (error) {
        console.log("Error sending message:", error);
        // Remove the temporary message if sending fails
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== tempMessageId)
        );
      }
    }
  };

  const handleFileUpload = async () => {
    try {
      const pickedFile = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      if (!pickedFile || !pickedFile.uri) {
        console.log("No file selected");
        return;
      }

      setSelectedFile(pickedFile);
    } catch (error) {
      console.log("Error selecting file:", error);
      throw error;
    }
  };

  const handleTextToSpeech = () => {
    Tts.speak(inputText);
  };

  function handleNewReaction(messageId) {
    console.log("Is this the function?");
    setEmojiKeyboard(true);
    console.log(messageId);
    setReactionMessageId(messageId);
  }

  async function handleEmojiReactionTwo(emojiObject) {
    console.log(emojiObject.emoji);
    console.log(choirId);

    try {
      const messageRef = firestore()
        .collection("choirs")
        .doc(choirId)
        .collection("messages")
        .doc(reactionMessageId);

      const messageDoc = await messageRef.get();

      if (messageDoc.exists) {
        const reactions = messageDoc.data().reactions || {};
        const userReactions = reactions[user.uid] || [];

        const updatedUserReactions = userReactions.includes(emojiObject.emoji)
          ? userReactions
          : [...userReactions, emojiObject.emoji];

        await messageRef.update({
          [`reactions.${user.uid}`]: updatedUserReactions,
        });
      } else {
        await messageRef.update({
          reactions: {
            [user.uid]: [emojiObject.emoji],
          },
        });
      }
    } catch (error) {
      console.log("Error adding reaction:", error);
    }
  }

  // E
  async function handleEmojiReaction(emojiObject, messageId) {
    console.log(emojiObject.emoji);
    console.log(choirId);

    try {
      const messageRef = firestore()
        .collection("choirs")
        .doc(choirId)
        .collection("messages")
        .doc(messageId);

      const messageDoc = await messageRef.get();

      if (messageDoc.exists) {
        const reactions = messageDoc.data().reactions || {};
        const userReactions = reactions[user.uid] || [];

        const updatedUserReactions = userReactions.includes(emojiObject.emoji)
          ? userReactions
          : [...userReactions, emojiObject.emoji];

        await messageRef.update({
          [`reactions.${user.uid}`]: updatedUserReactions,
        });
      } else {
        await messageRef.update({
          reactions: {
            [user.uid]: [emojiObject.emoji],
          },
        });
      }
    } catch (error) {
      console.log("Error adding reaction:", error);
    }
  }

  function handleNormalEmoji(emojiObject) {
    setEmojiKeyboard(false);
    setInputText(inputText + emojiObject.emoji);
  }

  async function handleRemoveReaction(messageId, emoji) {
    try {
      const messageRef = firestore()
        .collection("choirs")
        .doc(choirId)
        .collection("messages")
        .doc(messageId);

      const messageDoc = await messageRef.get();
      const reactions = messageDoc.data().reactions || {};
      const userReaction = reactions[user.uid] || [];

      const updatedReactions = userReaction.filter((e) => e !== emoji);

      await messageRef.update({
        [`reactions.${user.uid}`]: updatedReactions,
      });
    } catch (error) {
      console.log("Error removing reaction:", error);
    }
  }

  const uploadFile = async (file, messageId) => {
    try {
      setLoadingImages((prevState) => ({
        ...prevState,
        [messageId]: true,
      }));

      const { uri, name, type } = file;
      //   const fileData = await RNFS.readFile(uri, 'base64');
      const reference = storage().ref(`choirs/${choirId}/files/${name}`);
      await reference.putString(fileData, "base64", { contentType: type });
      const downloadURL = await reference.getDownloadURL();

      // Update the message document with the file details
      await firestore()
        .collection("choirs")
        .doc(choirId)
        .collection("messages")
        .doc(messageId)
        .update({
          file: {
            name,
            type,
            url: downloadURL,
          },
        });

      setLoadingImages((prevState) => ({
        ...prevState,
        [messageId]: false,
      }));
    } catch (error) {
      console.log("Error uploading file:", error);
      throw error;
    }
  };

  const renderItem = ({ item, index }) => {
    const previousItem =
      index < messages.length - 1 ? messages[index + 1] : null;
    const isSameUser = previousItem && item.user.id === previousItem.user.id;
    const showProfilePicture =
      !isSameUser ||
      (previousItem &&
        item.createdAt &&
        previousItem.createdAt &&
        (item.createdAt.toDate
          ? item.createdAt.toDate()
          : item.createdAt
        ).getTime() -
          (previousItem.createdAt.toDate
            ? previousItem.createdAt.toDate()
            : previousItem.createdAt
          ).getTime() >
          10 * 60 * 1000);

    const handleReactionPress = (emoji, messageId) => {
      const userReactions = item.reactions
        ? item.reactions[user.uid] || []
        : [];
      if (userReactions.includes(emoji)) {
        // User already reacted with this emoji, so remove the reaction
        handleRemoveReaction(messageId, emoji);
      } else {
        // User hasn't reacted with this emoji, so add the reaction
        setReactionMessageId(messageId); // Set the reactionMessageId state variable
        handleEmojiReaction({ emoji }, messageId);
      }
    };

    const createdAtDate = item.createdAt
      ? item.createdAt.toDate
        ? item.createdAt.toDate()
        : item.createdAt
      : new Date();

    return (
      <View className="flex-row items-start px-4">
        {showProfilePicture && (
          <View className="relative">
            <Image
              source={{ uri: item.user.avatar }}
              className="w-9 h-9 rounded-xl"
            />
          </View>
        )}
        <View
          className={`rounded-xl w-full ${showProfilePicture ? "" : "ml-9"}`}
        >
          {showProfilePicture && (
            <View className="flex-row items-center gap-2 pl-4">
              <Text className="text-sm font-semibold">{item.user.name}</Text>
              <Text className="text-xs text-gray-400">
                {format(createdAtDate, "hh:mm a")}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onLongPress={() => handleNewReaction(item.id)}
            className="w-full"
          >
            <Text
              className={`text-base text-gray-800 px-4 pb-2 ${
                item.temp ? "opacity-50" : ""
              }`}
            >
              {item.message}
            </Text>
          </TouchableOpacity>
          {item.file && (
            <>
              {item.file.type.startsWith("image/") ? (
                <>
                  {loadingImages[item.id] ? (
                    <View className="w-48 h-48 bg-gray-200 rounded-lg mt-2" />
                  ) : (
                    <Image
                      source={{ uri: item.file.url }}
                      className="w-48 h-48 rounded-lg mt-2"
                      resizeMode="cover"
                    />
                  )}
                </>
              ) : (
                <Text className="text-gray-600 px-4 pb-2">
                  {item.file.name}
                </Text>
              )}
            </>
          )}
          <View className="flex-row items-center px-4 pb-2">
            {Object.entries(
              Object.entries(item.reactions || {}).reduce(
                (acc, [userId, reaction]) => {
                  const emojis = Array.isArray(reaction)
                    ? reaction
                    : [reaction];
                  emojis.forEach((emoji) => {
                    acc[emoji] = acc[emoji] || { count: 0, userIds: [] };
                    acc[emoji].count++;
                    if (!acc[emoji].userIds.includes(userId)) {
                      acc[emoji].userIds.push(userId);
                    }
                  });
                  return acc;
                },
                {}
              )
            )
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([emoji, { userIds, count }]) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReactionPress(emoji, item.id)}
                  className={`flex-row items-center space-x-1 rounded-full px-2 py-1 ${
                    userIds.includes(user.uid) ? "bg-blue-100" : ""
                  }`}
                >
                  <Text>{emoji}</Text>
                  {count > 1 && <Text className="text-xs">{count}</Text>}
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 mt-8">
      <View className="flex-row items-center justify-between p-6 border-b border-gray-300">
        <TouchableOpacity onPress={onBack}>
          <Text className="text-lg text-blue-600">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold">Chat</Text>
        <View className="w-8" />
      </View>
      {/* <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        inverted
      /> */}

      <VirtualizedList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        inverted
        getItemCount={(data) => (data ? data.length : 0)}
        getItem={(data, index) => (data ? data[index] : null)}
      />

      <View
        className={`flex w-full h-14 justify-center ${
          showIcons ? "flex-col h-12" : "flex-row items-center px-2"
        } rounded-t-xl border-t-[0.5px] border-r-[0.5px] border-l-[0.5px] border-t-[#d6d6d6] border-r-[#d6d6d6] border-l-[#d6d6d6]`}
      >
        {!showIcons && (
          <TouchableOpacity onPress={handleFileUpload}>
            <View className="w-9 h-9 flex items-center justify-center bg-[#eeeeee] rounded-full">
              <SvgXml
                className="h-4 w-4 text-[#585858]"
                xml='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.402 45.402" fill="currentColor"><path fill-rule="evenodd" d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z" clip-rule="evenodd" /></svg>'
              />
            </View>
          </TouchableOpacity>
        )}

        {showIcons && (
          <View className="flex-row justify-center flex w-full mt-1">
            <View className="bg-[#d3d3d3] h-[2px] w-10 rounded-xl" />
          </View>
        )}

        <TextInput
          className="flex-1 rounded-xl px-4 placeholder:opacity-[0.8] text-[#1c1c1c] font-medium"
          placeholder="Message #general"
          value={inputText}
          onChangeText={(text) => setInputText(text)}
          onFocus={() => setShowIcons(true)}
          onBlur={() => setShowIcons(false)}
        />

        {!showIcons && (
          <TouchableOpacity onPress={handleTextToSpeech}>
            <View className="w-7 h-7 flex items-center justify-center rounded-full">
              <SvgXml className="w-5 h-5" xml={microphoneSvg} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {showIcons && (
        <View className="flex-row items-center flex w-full h-9 justify-between px-2">
          <View className="flex flex-row gap-2">
            <TouchableOpacity onPress={handleFileUpload}>
              <View className="w-8 h-8 flex items-center justify-center bg-[#eeeeee] rounded-full">
                <SvgXml
                  className="h-4 w-4 text-[#585858]"
                  xml='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.402 45.402" fill="currentColor"><path fill-rule="evenodd" d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z" clip-rule="evenodd" /></svg>'
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEmojiKeyboardNumberTwo(true)}>
              <View className="w-8 h-8 flex justify-center items-center rounded-full">
                <SvgXml className="w-5 h-5" xml={happyFaceSvg} />
              </View>
            </TouchableOpacity>

            <EmojiPicker
              onEmojiSelected={handleNormalEmoji}
              open={emojiKeyboardNumberTwo}
              onClose={() => setEmojiKeyboardNumberTwo(false)}
            />
          </View>
          <TouchableOpacity onPress={handleSendMessage}>
            <View
              className="w-8 h-8 flex justify-center items-center rounded-full"
              style={{ backgroundColor: inputText ? "#ffcc04" : "transparent" }}
            >
              <SvgXml
                className="w-5 h-5"
                xml={inputText ? sendSvgWhite : sendSvgGray}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <EmojiPicker
        onEmojiSelected={handleEmojiReactionTwo}
        open={emojiKeyboard}
        onClose={() => setEmojiKeyboard(false)}
      />
    </View>
  );
}

export default ChatScreen;
