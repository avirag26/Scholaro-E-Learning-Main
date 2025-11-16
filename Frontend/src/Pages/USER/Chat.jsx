
import UnifiedChat from '../../components/Chat/UnifiedChat';
import Header from './Common/Header';
const UserChat = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-shrink-0">
        <Header />
      </div>
      
      <div className="flex-1 overflow-hidden min-h-0">
        <UnifiedChat />
      </div>
    </div>
  );
};

export default UserChat;