import React from 'react'
import { useParams } from 'react-router-dom' 
import {ZegoUIKitPrebuilt} from "@zegocloud/zego-uikit-prebuilt"

const VideoScreen = () => {
  const {roomId} = useParams()

  const myMeeting = async (element)=>{
    const appID = 1244235347;
    const serverSecret = "4574cda62f4821804223713fd964b7b8";
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID,serverSecret,roomId, Date.now().toString(),"Amarnath")
    const zp = ZegoUIKitPrebuilt.create(kitToken)
    zp.joinRoom({
      container:element,
      scenario : {
        mode:ZegoUIKitPrebuilt.VideoConference,
      },
    })
  }
  return (
    <div>
      <div ref={myMeeting}/>
    </div>
  )
}

export default VideoScreen