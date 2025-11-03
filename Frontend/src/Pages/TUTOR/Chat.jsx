import TutorLayout from './COMMON/TutorLayout';

import UnifiedChat from '../../components/Chat/UnifiedChat';
import Header from './COMMON/Header';
const TutorChat = () => {
  return (
    <TutorLayout>
      <div className="flex-shrink-0">
       <Header/>
      </div>
      
      <div className="flex-1 overflow-hidden min-h-0">
        <UnifiedChat />
      </div>
    </TutorLayout>
  );
};

export default TutorChat;