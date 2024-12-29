import { View, Text, Image, Pressable} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar';
import { useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import React, { useCallback } from 'react'
import { LinearGradient } from 'expo-linear-gradient';



export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()




export default function LoginScreen() {
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })


  const onPress = useCallback(async () => {

    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)/home', { scheme: 'myapp' }),
      })


      if (createdSessionId) {
        console.log('Activating session...');
        await setActive({ session: createdSessionId });
        console.log('Session activated:', createdSessionId);
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [])


  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#4C87B8', '#629CCB', '#7FB1DE']}
        className="flex-1"
      >
        <View className="flex-1 justify-between px-6">
          {/* Top Section */}
          <View className="flex-1 justify-center items-center">
            {/* Image Container with Shadow */}
            <View className="w-full shadow-lg bg-white/10 rounded-3xl p-4 mb-8">
              <Image 
                source={require('./../../assets/images/login.png')}
                resizeMode='contain' 
                className="w-full h-[30vh]"
              />
            </View>

            {/* App Name with Text Shadow */}
            <View className="items-center">
              <Text className="text-6xl font-bold text-white mb-3"
                    style={{
                      textShadowColor: 'rgba(0, 0, 0, 0.15)',
                      textShadowOffset: { width: 0, height: 4 },
                      textShadowRadius: 4,
                    }}>
                TIDALLY
              </Text>
              <Text className="text-white/80 text-lg text-center px-4">
                Discover and Share Amazing Fitness Journeys
              </Text>
            </View>
          </View>

          {/* Bottom Section */}
          <View className="mb-8">
            {/* Google Sign In Button */}
            <Pressable 
              onPress={onPress} 
              className="bg-white p-4 rounded-xl shadow-lg active:opacity-90"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <View className="flex-row justify-center items-center space-x-2">
                <Image 
                  source={require('./../../assets/images/google.png')} 
                  className="w-10 h-10"
                />
                <Text className="font-outfit-medium text-lg text-[#4C87B8]">
                  Continue with Google
                </Text>
              </View>
            </Pressable>

            {/* Terms Text */}
            <Text className="text-white/70 text-center mt-4 text-sm px-10">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>

        <StatusBar style='light'/>
      </LinearGradient>
    </SafeAreaView>
  );
}







