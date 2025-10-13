import LandingPage from '../../Landing/LandingPage';
import GuestRoute from './GuestRoute';

const LandingProtection = () => {
    return (
        <GuestRoute>
            <LandingPage />
        </GuestRoute>
    );
};

export default LandingProtection;