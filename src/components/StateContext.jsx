"use client";

import { createContext, useEffect, useState } from "react";

export const StateContext = createContext({ songs: [] });

export default function StateContextProvider({ children }) {
  const [choirId, setChoirId] = useState();
  const [songId, setSongId] = useState();
  const [messagingChannel, setMessagingChannel] = useState();

  useEffect(() => {
    setSongId(undefined);
    setMessagingChannel(undefined);
  }, [choirId]);

  useEffect(() => {
    // Store state in local storage
    if (choirId) {
      console.log("choirId", choirId);
      localStorage.setItem("choirId", choirId);
    }
  }, [choirId]);

  useEffect(() => {
    if (songId) {
      localStorage.setItem("songId", songId);
    }
  }, [songId]);

  useEffect(() => {
    if (messagingChannel) {
      localStorage.setItem("messagingChannel", messagingChannel);
    }
  }, [messagingChannel]);

  useEffect(() => {
    // Retrieve state from local storage
    setChoirId(localStorage.getItem("choirId"));
    setSongId(localStorage.getItem("songId"));
    setMessagingChannel(localStorage.getItem("messagingChannel"));
  }, []);

  return (
    <StateContext.Provider
      value={{
        choirId,
        setChoirId,
        songId,
        setSongId,
        messagingChannel,
        setMessagingChannel,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}
