import "../global.css";
import { Slot } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Keep the splash screen visible while we fetch resources
export default function Layout() {

SplashScreen.preventAutoHideAsync();


  return (
    <Slot />
  );
}
