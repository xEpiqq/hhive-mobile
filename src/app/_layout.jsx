import "../global.css";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import UserProvider from "@/components/UserContext";

// Keep the splash screen visible while we fetch resources
export default function Layout() {
  SplashScreen.preventAutoHideAsync();

  return (
    <>
      <UserProvider>
        <Slot />
      </UserProvider>
    </>
  );
}
