// components/LogoutButton.js
import { View, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';


export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login'); 
  };
  
  return (
    <TouchableOpacity 
      onPress={handleLogout}
      className="bg-red-500 p-3 rounded-lg"
    >
      <Text className="text-white text-center">Sign Out</Text>
    </TouchableOpacity>
  );
}




  

