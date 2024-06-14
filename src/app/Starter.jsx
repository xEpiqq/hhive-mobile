import React, {useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Animated } from 'react-native';
import { styled } from 'nativewind';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import auth from "@react-native-firebase/auth"
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import {NavigationContainer} from '@react-navigation/native';


GoogleSignin.configure({
  webClientId: '41274838584-680c8sgq16fojgeq7nla5j6foioqq46p.apps.googleusercontent.com',
});


const Stack = createNativeStackNavigator();

function Starter() {

  const [currentScreen, setCurrentScreen] = useState(0);
  const [satbChoice, setSatbChoice] = useState(0);
  const [onboardError, setOnboardError] = useState('');
  const [login, setLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordVisibleCreate, setPasswordVisibleCreate] = useState(false);
  const [onboardingCode, setOnboardingCode] = useState('');
  const [createAccountError, setCreateAccountError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signinError, setSigninError] = useState('');
  const [choirJoinName, setChoirJoinName] = useState('');
  const [choirJoinUid, setChoirJoinUid] = useState('');

   function nextScreen() {
    setCurrentScreen(currentScreen + 1);
  }

  const joinNewChoirScreen = () => {
    setCurrentScreen(6);
  };

  const goToFirstScreen = () => {
    setCurrentScreen(1);
  };

  // Function to go back to the previous screen
  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  function setTheLogin() {
    setLogin(!login);
  };

  function openOnboarding() {
    setCurrentScreen(1);    
  };

  function setTheLoginAndClearInputs() {
    setLogin(!login);
    setUsername('');
    setPassword('');
    setPasswordVisible(true);
  }

  async function codeEntered() {
    try {
      const choirsCollectionRef = firestore().collection('choirs');
      const querySnapshot = await choirsCollectionRef.where('code', '==', onboardingCode).get();
  
      if (querySnapshot.empty) {
        setOnboardError('Wrong code, sorry!');
      } else {
        const choirDoc = querySnapshot.docs[0];
        const choirName = querySnapshot.docs[0].data().name;
        const choirUid = choirDoc.id;
        setChoirJoinUid(choirUid);
        setChoirJoinName(choirName);
        console.log("Choir Name:", choirName);
        nextScreen();
        setOnboardError('');
      }
    } catch (error) {
      console.error('Error fetching choirs:', error);
      setOnboardError('An error occurred while checking the code.');
    }
  }
  
  // async function codeEntered() {
  //   if (onboardingCode === '123456') {
  //     nextScreen();
  //   } else {
  //     setOnboardError('Wrong code, sorry!');
  //   }
  // }

  function setTheSatb(memberspart) {
    console.log(memberspart)
    setSatbChoice(memberspart)
    nextScreen()
  }

  async function signinEmailPass() {

    try {
      await auth().signInWithEmailAndPassword(username, password);
      console.log('User signed in!');
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        setSigninError('Too many login attempts, try again later!');
      } else if (error.code === 'auth/invalid-credential') {
        setSigninError(`Email or password isn't quite right!`);
      }
      console.error(error.code);
    }

  }

  async function createUserEmailPass() {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(username, password);
      console.log('User account created & signed in!');
  
      const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          choir_selected: choirJoinUid,
          choirs_joined: [ choirJoinUid ],
          email: username,
          emailVerified: false,
          image: userCredential.user.photoURL,
          name: capitalizedFirstName + ' ' + capitalizedLastName,
          part: satbChoice,
          user_type: "student"
          });

      console.log('User added to Firestore!');

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setCreateAccountError('That email address is already in use!');
      } else if (error.code === 'auth/invalid-email') {
        setCreateAccountError('That email address is invalid!');
      }
      console.error(error);
    }
  }

  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
  
      // Check if the user document already exists in Firestore.
      const userDocRef = firestore().collection('users').doc(userCredential.user.uid);
      const docSnapshot = await userDocRef.get();
  
      if (!docSnapshot.exists) {
        const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  
        await userDocRef.set({
          choir_selected: choirJoinUid,
          choirs_joined: [ choirJoinUid ],
          email: userCredential.user.email,
          emailVerified: userCredential.user.emailVerified,
          image: userCredential.user.photoURL,
          name: capitalizedFirstName + ' ' + capitalizedLastName,
          part: satbChoice,
          user_type: "student"
        });
        console.log('New user added to Firestore!');
      } else {
        console.log('User already exists in Firestore.');
      }
  
      return userCredential;
    } catch (error) {
      console.error('Google Sign-In Error: ', error);
      throw new Error(error);
    }
  }

async function justGoogleSignin() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Check if the user document already exists in Firestore.
    const userDocRef = firestore().collection('users').doc(userCredential.user.uid);
    const docSnapshot = await userDocRef.get();

    if (!docSnapshot.exists) {
      await auth().signOut();
      console.log('Signed out user because they havent created an account yet!');
    }

    console.log(userCredential.user.uid);
    return userCredential;
  } catch (error) {
    console.error('Google Sign-In Error: ', error);
    throw new Error(error);
  }
}

function signInWithGoogle() {
  console.log("bruh")
}

function joinNewChoir() {
  console.log('Joining new choir');
}
  
  const screens = [

    <View>

    </View>,

    // FIRST SCREEN

    <View className="flex h-full bg-white items-center justify-between px-4">
        
        <TouchableOpacity onPress={prevScreen} className="flex items-center absolute left-2 top-3">
          <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
        </TouchableOpacity>

      <View className='flex justify-center items-center'>
        <Image className='w-44 h-44 mt-44' source={require('../../public/1.png')}/>
        <Image className='w-52 h-8 mt-2' source={require('../../public/logo.png')}/>
        <Text className='text-slate-400 px-20 text-center text-md mt-2 text-md'>Choose your own adventure.</Text>
      </View>
      <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>

          <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFCE00] border border-b-4 border-[#FFA700] rounded-xl' onPress={nextScreen}>
            <Text className='text-white text-center text-md font-bold'>NEW ACCOUNT</Text>
          </TouchableOpacity>

          <TouchableOpacity className='h-10 w-full flex justify-center border rounded-xl border-b-4 border-slate-400' onPress={setTheLogin}>
            <Text className='text-[#FFA700] text-center text-md font-bold' onPress={joinNewChoirScreen}>JOIN ANOTHER CHOIR</Text>
          </TouchableOpacity>

        </View>
    </View>,

    // SECOND SCREEN

        <View className="flex h-full bg-white items-center px-4">
        
        <TouchableOpacity onPress={prevScreen} className="flex items-center absolute left-2 top-3">
          <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
        </TouchableOpacity>

      <View className='flex justify-center items-center'>
        <Image className='w-44 h-44 mt-20' source={require('../../public/3.png')}/>
        <Image className='w-52 h-8 mt-2' source={require('../../public/logo.png')}/>
        <Text className='text-slate-400 px-20 text-center text-md mt-2 text-md'>Let's get started. Which part do you sing?</Text>
      </View>
      
      <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3 mt-20'>

      <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'>
          <Text className='text-white text-center text-md font-bold' onPress={() => setTheSatb("soprano")}>SOPRANO</Text>
        </TouchableOpacity>

        <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'>
          <Text className='text-white text-center text-md font-bold' onPress={() => setTheSatb("alto")}>ALTO</Text>
        </TouchableOpacity>

        <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'>
          <Text className='text-white text-center text-md font-bold' onPress={() => setTheSatb("tenor")}>TENOR</Text>
        </TouchableOpacity>

        <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'>
          <Text className='text-white text-center text-md font-bold' onPress={() => setTheSatb("bass")}>BASS</Text>
        </TouchableOpacity>
      </View>
    </View>,

    // THIRD SCREEN

    <View className="flex h-full bg-white items-center justify-between px-4">
        
        <TouchableOpacity onPress={prevScreen} className="flex items-center absolute left-2 top-3">
          <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
        </TouchableOpacity>

      <View className='flex justify-center items-center'>
        <Image className='w-44 h-44 mt-16' source={require('../../public/3.png')}/>
        <Image className='w-52 h-8 mt-2' source={require('../../public/logo.png')}/>
        <Text className='text-slate-400 px-20 text-center text-md mt-2 text-md'>Now, lets get your name...</Text>

        <TextInput
                  className="border border-gray-300 pl-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700 mt-2 px-20"
                  placeholder="First Name"
                  onChangeText={setFirstName}
                  value={firstName}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                />
                
        <TextInput
                  className="border border-gray-300 pl-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700 mt-2 px-20"
                  placeholder="Last Name"
                  onChangeText={setLastName}
                  value={lastName}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                />
      
      </View>

        {firstName.length === 0 || lastName.length === 0 ? (
        <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
          <TouchableOpacity
            className='h-10 w-full flex justify-center bg-gray-300 rounded-xl'
            disabled={true}
          >
            <Text className='text-white text-center text-md font-bold'>CONTINUE</Text>
          </TouchableOpacity>
          </View>
        ) : (
          <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
            <TouchableOpacity
              className='h-10 w-full flex justify-center bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'
              onPress={nextScreen}
            >
              <Text className='text-white text-center text-md font-bold' onPress={nextScreen}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        )}

    </View>,

    // FOURTH SCREEN

        <View className="flex h-full bg-white items-center justify-between px-4">
        
        <TouchableOpacity onPress={prevScreen} className="flex items-center absolute left-2 top-3">
          <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
        </TouchableOpacity>

      <View className='flex justify-center items-center'>
        <Image className='w-44 h-44 mt-16' source={require('../../public/2.png')}/>
        <Image className='w-52 h-8 mt-2' source={require('../../public/logo.png')}/>
        <Text className='text-slate-400 px-20 text-center text-md mt-2 text-md'>Enter your choir code below to join as an official member!</Text>

        <TextInput
                  className="border border-gray-300 pl-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700 mt-6"
                  placeholder="Choir Membership Code"
                  onChangeText={setOnboardingCode}
                  value={onboardingCode}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                  maxLength={6}
                />

      <Text className='text-red-400 px-20 text-center text-md mt-2 text-md'>{onboardError}</Text>
      </View>

        {onboardingCode.length === 0 ? (
        <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
          <TouchableOpacity
            className='h-10 w-full flex justify-center bg-gray-300 rounded-xl'
            disabled={true}
          >
            <Text className='text-white text-center text-md font-bold'>CONTINUE</Text>
          </TouchableOpacity>
          </View>
        ) : (
          <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
            <TouchableOpacity
              className='h-10 w-full flex justify-center bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'
              onPress={codeEntered}
            >
              <Text className='text-white text-center text-md font-bold' onPress={codeEntered}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        )}

    </View>,

    // FIFTH SCREEN

        <View className="h-full w-full bg-white flex items-center">
          <View className="w-full px-4 flex justify-between flex-col h-full">

          <TouchableOpacity onPress={prevScreen} className="flex items-center absolute left-2 top-3">
                  <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
                </TouchableOpacity>

            <View className='flex gap-2 mt-12'>

              <View className="flex flex-row items-center justify-center relative mb-4 mt-16">
                <Text className="text-lg font-bold flex items-center justify-center text-gray-400">Create an account and join {choirJoinName}</Text>
              </View>

              <TextInput
                  className="border-gray-300 pl-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700"
                  placeholder="Email Address"
                  onChangeText={setUsername}
                  value={username}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                />

              <View className="bg-[#F7F7F7] flex flex-row items-center justify-between rounded-b-xl border-gray-300 rounded-xl">
                  <TextInput
                    className="p-2 pl-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700"
                    placeholder="Password"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={passwordVisibleCreate}
                    placeholderTextColor="rgba(0, 0, 0, 0.3)"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity onPress={() => setPasswordVisibleCreate(!passwordVisibleCreate)}>
                    <Image
                      className="w-6 h-6 mr-3 opacity-40"
                      source={passwordVisibleCreate ? require('../../public/password_eye.png') : require('../../public/password_eye_strike.png')}
                    />
                  </TouchableOpacity>
                </View>
              
              {createAccountError && (
                <Text className="mt-4">
                  {createAccountError}
                </Text>
              )}

              {username.length > 0 && password.length > 0 ? (

                <TouchableOpacity className='mt-4 h-10 w-full flex justify-center border rounded-xl border-b-4 bg-[#FFCE00] border-[#FFA700]' onPress={() => createUserEmailPass()}>
                  <Text className='text-white text-center font-bold text-lg'>CREATE ACCOUNT</Text>
                </TouchableOpacity>

              ) : (

                <TouchableOpacity className="mb-2 bg-gray-200 p-2 rounded-xl mt-4">
                <Text className="text-center font-semibold text-lg text-gray-400">CREATE ACCOUNT</Text>
                </TouchableOpacity>

              )
            }

              <Text className="font-bold text-center mb-4 text-[#FFCE00] mt-4 text-lg">FORGOT PASSWORD</Text>

            </View>

            <View className="">
              <View className="flex flex-row justify-between mb-4 gap-x-4">

                <TouchableOpacity className='mt-4 gap-x-1 h-12 flex flex-row justify-center items-center border flex-1 rounded-xl border-b-4 bg-white border-slate-300'>
                    <Image className='h-6 w-6' source={require('../../public/fb.png')}/>
                    <Text className='text-[#0266FF] text-center font-bold text-lg flex items-center justify-center'>FACEBOOK</Text>
                </TouchableOpacity>

                <TouchableOpacity className='mt-4 gap-x-1 h-12 flex flex-row justify-center items-center border flex-1 rounded-xl border-b-4 bg-white border-slate-300' onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}>
                    <Image className='h-6 w-6' source={require('../../public/google.png')}/>
                    <Text className='text-gray-500 text-center font-bold text-lg flex items-center justify-center'>GOOGLE</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-center text-sm text-gray-500 mb-4">
                By signing in to Harmony Hive, you agree to our Terms and Privacy Policy.
              </Text>
            </View>

          </View>
        </View>,

        // SIXTH SCREEN

        <View className="flex h-full bg-white items-center justify-between px-4">
        
        <TouchableOpacity onPress={goToFirstScreen} className="flex items-center absolute left-2 top-3">
          <Image className='h-[15px] w-[18px]' source={require('../../public/grayarrow.png')}/>
        </TouchableOpacity>

      <View className='flex justify-center items-center'>
        <Image className='w-44 h-44 mt-16' source={require('../../public/2.png')}/>
        <Image className='w-52 h-8 mt-2' source={require('../../public/logo.png')}/>
        <Text className='text-slate-400 px-20 text-center text-md mt-2 text-md'>Enter your choir code and email address to join.</Text>

        <TextInput
                  className="border border-gray-300 pl-4 pr-4 bg-[#F7F7F7] rounded-xl text-lg text-gray-700 mt-6"
                  placeholder="Choir Membership Code"
                  onChangeText={setOnboardingCode}
                  value={onboardingCode}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                  maxLength={6}
                />

        <TextInput
                  className="border border-gray-300 pl-4 pr-24 bg-[#F7F7F7] rounded-xl text-lg text-gray-700 mt-2"
                  placeholder="Email Address"
                  onChangeText={setUsername}
                  value={username}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                />

      <Text className='text-red-400 px-20 text-center text-md mt-2 text-md'>{onboardError}</Text>
      </View>

        {onboardingCode.length === 0 || username.length === 0 ? (
        <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
          <TouchableOpacity
            className='h-10 w-full flex justify-center bg-gray-300 rounded-xl'
            disabled={true}
          >
            <Text className='text-white text-center text-md font-bold'>JOIN CHOIR</Text>
          </TouchableOpacity>
          </View>
        ) : (
          <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
            <TouchableOpacity
              className='h-10 w-full flex justify-center bg-[#FFDE1A] border border-b-4 border-[#FFCE00] rounded-xl'
              onPress={codeEntered}
            >
              <Text className='text-white text-center text-md font-bold' onPress={joinNewChoir}>JOIN CHOIR</Text>
            </TouchableOpacity>
          </View>
        )}

    </View>,
  ];


    if (currentScreen > 0) {

      return (
        <View>
  
        {screens[currentScreen]}
  
        </View>

      );
    }


//     <NavigationContainer>
//     <Stack.Navigator>
//       <Stack.Screen
//         name="Home"
//         component={Starter}
//         options={{title: 'Harmony Hive'}}
//       />
//     </Stack.Navigator>
//   </NavigationContainer>

    if (!login) {

      return (
        <View className="h-full w-full bg-white flex items-center">
          <View className="w-full px-4 flex justify-between flex-col h-full">

            <View className="">
              
              <View className="flex flex-row items-center justify-center relative mb-4 mt-4">
                <TouchableOpacity onPress={setTheLoginAndClearInputs} className="w-5 h-auto flex items-center absolute left-0">
                  <Text className="text-4xl font-light">×</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold flex items-center justify-center text-gray-400">Enter your details</Text>
              </View>

              <View className="rounded-xl border border-gray-300">
                <TextInput
                  className="border-b border-gray-300 pl-4 bg-[#F7F7F7] rounded-t-xl text-lg text-gray-700"
                  placeholder="Username or email"
                  onChangeText={setUsername}
                  value={username}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  autoCapitalize="none"
                />
                
                
                <View className="bg-[#F7F7F7] flex flex-row items-center justify-between rounded-b-xl">

                  <TextInput
                    className="p-2 pl-4 bg-[#F7F7F7] rounded-b-xl text-lg text-gray-700"
                    placeholder="Password"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={passwordVisible}
                    placeholderTextColor="rgba(0, 0, 0, 0.3)"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                    <Image
                      className="w-6 h-6 mr-3 opacity-40"
                      source={passwordVisible ? require('../../public/password_eye.png') : require('../../public/password_eye_strike.png')}
                    />
                  </TouchableOpacity>
                </View>

              </View>

              {signinError && <Text className='mt-3'>{signinError}</Text>}

              {username.length > 0 && password.length > 0 ? (

                <TouchableOpacity className='mt-4 h-10 w-full flex justify-center border rounded-xl border-b-4 bg-[#19B1F4] border-[#1797D2]' onPress={signinEmailPass}>
                  <Text className='text-white text-center font-bold text-lg'>SIGN IN</Text>
                </TouchableOpacity>

              ) : (

                <TouchableOpacity className="mb-2 bg-gray-200 p-2 rounded-xl mt-4">
                <Text className="text-center font-semibold text-lg">SIGN IN</Text>
                </TouchableOpacity>

              )
            }

              <Text className="font-bold text-center mb-4 text-[#19B1F4] mt-4 text-lg">FORGOT PASSWORD</Text>

            </View>

            <View className="">
              <View className="flex flex-row justify-between mb-4 gap-x-4">

                <TouchableOpacity className='mt-4 gap-x-1 h-12 flex flex-row justify-center items-center border flex-1 rounded-xl border-b-4 bg-white border-slate-300'>
                    <Image className='h-6 w-6' source={require('../../public/fb.png')}/>
                    <Text className='text-[#0266FF] text-center font-bold text-lg flex items-center justify-center'>FACEBOOK</Text>
                </TouchableOpacity>

                <TouchableOpacity className='mt-4 gap-x-1 h-12 flex flex-row justify-center items-center border flex-1 rounded-xl border-b-4 bg-white border-slate-300' onPress={justGoogleSignin}>
                    <Image className='h-6 w-6' source={require('../../public/google.png')}/>
                    <Text className='text-gray-500 text-center font-bold text-lg flex items-center justify-center'>GOOGLE</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-center text-sm text-gray-500 mb-4">
                By signing in to Harmony Hive, you agree to our Terms and Privacy Policy.
              </Text>
            </View>

          </View>
        </View>

    );

    }

    return (
        <View className="flex h-full bg-white items-center justify-between px-4">
              <View className='flex justify-center items-center'>
                <Image className='w-28 h-28 mt-44' source={require('../../public/7.png')}/>
                <Image className='w-40 h-8 mt-2' source={require('../../public/logo.png')}/>
                <Text className='text-slate-400 px-20 text-center text-md mt-2'>The fun and effective way to learn choir music at home.</Text>
              </View>
              <View className='w-full flex flex-col gap-y-3.5 justify-end mb-3'>
                <TouchableOpacity className='h-10 w-full flex justify-center  bg-[#FFCE00] border border-b-4 border-[#FFA700] rounded-xl' onPress={openOnboarding}>
                  <Text className='text-white text-center text-md font-bold'>GET STARTED</Text>
                </TouchableOpacity>
                                
                <TouchableOpacity className='h-10 w-full flex justify-center border rounded-xl border-b-4 border-slate-400' onPress={setTheLogin}>
                  <Text className='text-[#FFA700] text-center text-md font-bold'>I ALREADY HAVE AN ACCOUNT</Text>
                </TouchableOpacity>
              </View>
        </View>
      );
  }

export default Starter;