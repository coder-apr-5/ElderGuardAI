import React from 'react';
import { useSearchParams } from 'react-router-dom';
import FamilySignupPage from './FamilySignupPage';
import ElderSignupPage from './ElderSignupPage';

const SignupPage = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role');

    if (role === 'elder') {
        return <ElderSignupPage />;
    }

    return <FamilySignupPage />;
};

export default SignupPage;
