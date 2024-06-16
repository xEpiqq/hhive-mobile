import { useState, useEffect } from "react";
import { firestore, storage } from "@/components/Firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function useChoir(choirId) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState(null);
  const [members, setMembers] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [choirCode, setChoirCode] = useState(null);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    let unsubscribeList = [];

    if (!choirId) return;

    const choirRef = doc(firestore, "choirs", choirId);
    const unsubscribe = onSnapshot(choirRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setName(data.name);
        const calendarCollection = collection(choirRef, "calendar");
        const calendarQuery = query(calendarCollection, orderBy("date", "asc"));
        const calendarUnsubscribe = onSnapshot(calendarQuery, (snapshot) => {
          const events = [];
          snapshot.forEach((doc) => {
            events.push({ ...doc.data(), eventId: doc.id });
          });
          setCalendar(events);
        });
        unsubscribeList.push(calendarUnsubscribe);

        const songsCollection = collection(choirRef, "songs");
        const songsQuery = query(
          songsCollection,
          orderBy("lastOpened", "desc")
        );
        const songsUnsubscribe = onSnapshot(songsQuery, (snapshot) => {
          const songs = [];
          snapshot.forEach((doc) => {
            songs.push({ ...doc.data(), songId: doc.id });
          });
          setSongs(songs);
        });
        unsubscribeList.push(songsUnsubscribe);

        const channelsCollection = collection(choirRef, "channels");
        const channelsQuery = query(channelsCollection);
        const channelsUnsubscribe = onSnapshot(channelsQuery, (snapshot) => {
          const channels = [];
          snapshot.forEach((doc) => {
            channels.push({ ...doc.data(), channelId: doc.id });
          });
          setChannels(channels);
        });
        unsubscribeList.push(channelsUnsubscribe);

        const membersCollection = collection(choirRef, "members");
        const membersQuery = query(membersCollection);
        const membersUnsubscribe = onSnapshot(membersQuery, (snapshot) => {
          const members = [];
          snapshot.forEach((doc) => {
            members.push({ ...doc.data(), memberId: doc.id });
          });
          setMembers(members);
        });
        unsubscribeList.push(membersUnsubscribe);

        setChoirCode(data.code);
      } else {
        console.error("Choir not found");
        setError("Choir not found");
      }
    });

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe();
      });
      unsubscribe();
    };
  }, [choirId]);

  // const addFile = async (songId, formData) => {
  //   const songRef = doc(firestore, "choirs", choirId, "songs", songId);

  //   // Upload the file to storage
  //   const file = formData.get("file");
  //   const fileName = formData.get("fileName");
  //   const storageRef = ref(storage, `${choirId}/songs/${songId}/${fileName}`);
  //   await uploadBytes(storageRef, file);

  //   // Get the file URL
  //   const fileURL = await getDownloadURL(storageRef);

  //   // Update the song document with the file
  //   await updateDoc(songRef, {
  //     files: arrayUnion({
  //       name: fileName,
  //       url: fileURL,
  //     }),
  //   });

  //   // Update the last opened date
  //   await updateDoc(songRef, {
  //     lastOpened: serverTimestamp(),
  //   });

  //   // Return the file URL
  //   return fileURL;
  // };

  const addFile = async (songId, formData) => {
    const fileType = formData.get("fileType"); // Get the fileType from the formData
    const songRef = doc(firestore, "choirs", choirId, "songs", songId);
  
    // Upload the file to storage
    const file = formData.get("file");
    const fileName = file.name; // Use the file name directly from the file object
    const storageRef = ref(storage, `${choirId}/songs/${songId}/${fileName}`);
    await uploadBytes(storageRef, file);
  
    // Get the file URL
    const fileURL = await getDownloadURL(storageRef);
  
    // Prepare the update object
    let updateData = {
      lastOpened: serverTimestamp(),
    };
  
    // Update specific field based on fileType
    if (fileType === 'soprano_audio') {
      updateData.soprano_audio = fileURL;
    } else if (fileType === 'alto_audio') {
      updateData.alto_audio = fileURL;
    } else if (fileType === 'tenor_audio') {
      updateData.tenor_audio = fileURL;
    } else if (fileType === 'bass_audio') {
      updateData.bass_audio = fileURL;
    } else if (fileType === 'satb_sheets') {
      // Add each image URL to an array for satb_sheets
      const songDoc = await getDoc(songRef);
      const existingUrls = songDoc.data().satb_sheets || [];
      updateData.satb_sheets = [...existingUrls, fileURL];
    } else if (fileType === 'satb_audio') {
      updateData.satb_audio = fileURL;
    } else if (fileType === 'satb_pdf') {
      updateData.satb_pdf = fileURL;
    } else {
      throw new Error("Invalid file type");
    }
  
    // Update the song document with the file
    await updateDoc(songRef, updateData);
  
    // Return the file URL
    return fileURL;
  };
  
  // New function to update song with image URLs
  const updateSongWithImages = async (songId, imageUrls) => {
    const songRef = doc(firestore, "choirs", choirId, "songs", songId);
    const updateData = {
      satb_sheets: imageUrls,
    };
    await updateDoc(songRef, updateData);
  };
  
  
  
  
  

  const renameSong = async (songId, newName) => {
    const songRef = doc(firestore, "choirs", choirId, "songs", songId);
    await updateDoc(songRef, {
      name: newName,
    });
  };

  const deleteSong = async (songId) => {
    const songRef = doc(firestore, "choirs", choirId, "songs", songId);
    await deleteDoc(songRef);
  };

  const updateLastOpened = async (songId) => {
    const songRef = doc(firestore, "choirs", choirId, "songs", songId);
    await updateDoc(songRef, {
      lastOpened: serverTimestamp(),
    });
  };

  const addCalendarEvent = async (event) => {
    const calendarRef = collection(firestore, "choirs", choirId, "calendar");
    const newEvent = await addDoc(calendarRef, event);
    return newEvent.id;
  };

  const editCalendarEvent = async (eventId, updatedEvent) => {
    const eventRef = doc(firestore, "choirs", choirId, "calendar", eventId);
    await updateDoc(eventRef, updatedEvent);
  };

  const deleteCalendarEvent = async (eventId) => {
    const eventRef = doc(firestore, "choirs", choirId, "calendar", eventId);
    await deleteDoc(eventRef);
  };

  const addSong = async (songName) => {
    const songsCollection = collection(firestore, "choirs", choirId, "songs");
    const newSong = await addDoc(songsCollection, {
      name: songName,
      lastOpened: serverTimestamp(),
    });
    return { id: newSong.id };
  };

  const convertPdfToPng = async (pdfUrl, newSongId) => {
    const response = await fetch("/api/pdfconvert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdfUrl: pdfUrl,
        choirId: choirId,
        songId: newSongId,
      }),
    });

    const result = await response.json();
    console.log(result);
    return result;
  };

  const addChannel = async (channelName) => {
    const channelsCollection = collection(
      firestore,
      "choirs",
      choirId,
      "channels"
    );
    const newChannel = await addDoc(channelsCollection, {
      name: channelName,
    });
    // Add a message to the new channel
    await addDoc(
      collection(
        firestore,
        "choirs",
        choirId,
        "channels",
        newChannel.id,
        "messages"
      ),
      {
        message: "Hello, welcome to the channel!",
        createdAt: serverTimestamp(),
        user: {
          id: "system",
          name: "System",
        },
      }
    );
    return { id: newChannel.id };
  };

  const removeMember = async (member) => {
    console.log("removing member", member);
    const memberRef = doc(firestore, "choirs", choirId, "members", member.memberId);
    await deleteDoc(memberRef);
  };

  const updateMember = async (member) => {
    const memberRef = doc(firestore, "choirs", choirId, "members", member.memberIdid);
    await updateDoc(memberRef, member);
  };

  return {
    choirId,
    songs,
    loading,
    error,
    name,
    members,
    calendar,
    choirCode,
    channels,
    addChannel,
    renameSong,
    addSong,
    deleteSong,
    addFile,
    addCalendarEvent,
    updateLastOpened,
    editCalendarEvent,
    deleteCalendarEvent,
    convertPdfToPng,
    updateSongWithImages,
    removeMember,
    updateMember
  };
}
