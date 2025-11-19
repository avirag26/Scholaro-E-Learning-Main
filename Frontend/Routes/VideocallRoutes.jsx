import { Routes, Route } from 'react-router-dom';
import VideoInput from '../src/components/Chat/VideoInput';
import VideoScreen from '../src/components/Chat/VideoScreen';

const VideoRoute = () => {
    return (
        <Routes>
            <Route path="videoinput" element={
            
                    <VideoInput />
                
            } />
            <Route path="room/:roomId" element={
                
                    <VideoScreen />
                
            } />
        </Routes>



    )
}
export default VideoRoute