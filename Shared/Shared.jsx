// Shared/Shared.jsx
// fetching the particular user's document with matching ID from Favorites collection in firestore

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import {db} from './../config/FirebaseConfig'



const GetFavList=async(user)=>{
    // hooray we are fetching by Document ID!!!
    const docSnap=await getDoc(doc(db,'Favorites',user?.primaryEmailAddress?.emailAddress));
    if(docSnap?.exists()) // if we got data back
    {
        return docSnap.data();
    }
    else{
        await setDoc(doc(db,'Favorites',user?.primaryEmailAddress?.emailAddress),{  // create a new document
            email:user?.primaryEmailAddress?.emailAddress,
            favorites:[]
        })
        // implictly returns undefined
    }
}


const UpdateFav=async(user,favorites)=>{
    // update user's existing document with the new favorites array
    // called everytime user clicks on the heart icon, whether selects or deselects
    const docRef=doc(db,'Favorites',user?.primaryEmailAddress?.emailAddress);   
    try{
        await updateDoc(docRef,{
            favorites:favorites
        })
    }catch(e){

    }
}


export default{
    GetFavList,
    UpdateFav
}