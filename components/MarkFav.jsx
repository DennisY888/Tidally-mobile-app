// components/MarkFav.jsx

import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import Shared from './../Shared/Shared'
import { useUser } from '@clerk/clerk-expo';



export default function MarkFav({workout}) {


    const { user } = useUser();  
    const [favList, setFavList] = useState(); // save the favorties field from the fetched document (array of strings)


    useEffect(() => {
        user && GetFav();   // GetFav() only runs if user exists
    }, [user])  // when the user data becomes available


    const GetFav = async () => {
        const result = await Shared.GetFavList(user);
        setFavList(result?.favorites ? result?.favorites : [])
    }


    const AddToFav = async()=>{
        const favResult=favList;
        favResult.push(workout?.id)  // append the current workout id
        await Shared.UpdateFav(user,favResult);
        GetFav();  // update our state
    }

    const removeFromFav = async()=>{
        const favResult=favList.filter(item=>item!=workout.id); // filters out the 
        await Shared.UpdateFav(user,favResult);
        GetFav();  // update our state
    }



    return (
        <View>
            {favList?.includes(workout.id)?  
            <Pressable onPress={removeFromFav}>
                <AntDesign name="heart" size={24} color="red" />
            </Pressable> :

            <Pressable onPress={()=>AddToFav()}>
                <AntDesign name="hearto" size={24} color="black" />
            </Pressable>}
        </View>
        
    )
}

