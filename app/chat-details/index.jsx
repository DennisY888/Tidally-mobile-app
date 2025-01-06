import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { addDoc, collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useUser } from '@clerk/clerk-expo';
import { GiftedChat } from 'react-native-gifted-chat'
import moment from 'moment'



export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation=useNavigation();
  const {user}=useUser();
  const [messages, setMessages] = useState([])


  useEffect(()=>{
    GetUserDetails();
    // one-way communication from firestore to user, diff. than websocket which is two-way communication
    // creates a listener on Messages subcollection that triggers whenever data changes
    const unsubscribe=onSnapshot(collection(db,'Chat',params?.id,'Messages'),(snapshot)=>{
      const messageData=snapshot.docs.map((doc)=>({    // snapshot.docs provides latest documents references when change detected
        _id:doc.id,
        ...doc.data()    // change structure from references to objects so that GiftedChat recognizes
      }))
      setMessages(messageData)
    });
    return ()=>unsubscribe();    // clean up listener when component unmounts
  },[])   // activated once during initial render




  // Get user info
  const GetUserDetails=async()=>{
    const docRef=doc(db,'Chat',params?.id);    // 
    const docSnap=await getDoc(docRef);   // contains actual document data and meta data

    const result=docSnap.data();
    console.log(result);
    // the other users data (map)
    const otherUser=result?.users.filter(item=>item.email!=user?.primaryEmailAddress?.emailAddress);
    console.log(otherUser);
    navigation.setOptions({
      headerTitle:otherUser[0].name   // change the nav bar to other user's name
    })
  }


  const onSend=async(newMessage)=>{
    setMessages((previousMessage)=>GiftedChat.append(previousMessage,newMessage));
    newMessage[0].createdAt=moment().format('MM-DD-YYYY HH:mm:ss')   // gives us current date
    await addDoc(collection(db,'Chat',params.id,'Messages'),newMessage[0])  // creates a document with auto-generated id
                                                                            // "Messages" subcollection is auto-created the first time we add document to it
  }



  return (
    // pasted from https://github.com/FaridSafi/react-native-gifted-chat
    <GiftedChat
    messages={messages}
    // activated when send button is pressed
    onSend={messages => onSend(messages)}
    showUserAvatar={true}
    // identifies the current user sending messages
    user={{
      _id: user?.primaryEmailAddress?.emailAddress,
      // display name
      name:user?.fullName,    
      // profile picture
      avatar:user?.imageUrl
    }}
  />
  )
}