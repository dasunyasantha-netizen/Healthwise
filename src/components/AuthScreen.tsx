import { useEffect } from 'react';
import { sharedIdentityUrl } from '../services/sharedAuth';
export default function AuthScreen(_props: { onLogin: (token: string, user: any) => void }) {
    useEffect(() => { window.location.replace(sharedIdentityUrl()); }, []);
    return <p role="status">Opening shared sign-in...</p>;
}
