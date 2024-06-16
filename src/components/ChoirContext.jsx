"use client";

import { createContext, useEffect, useState, useContext } from "react";
import { StateContext } from "./StateContext";
import useChoir from "@/lib/choir";

export const ChoirContext = createContext({songs: []});

export default function ChoirProvider({ children }) {
  const {choirId, setChoirId} = useContext(StateContext);

  const choir = useChoir(choirId);
  console.log("the choir id is: " + choirId);

  return (
    <ChoirContext.Provider value={choir}>{children}</ChoirContext.Provider>
  );
}
