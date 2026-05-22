import { Activity } from 'lucide-react';

interface Props {
    onLogin: (token: string, user: any) => void;
}

export default function AuthScreen({ onLogin }: Props) {
    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            background: 'linear-gradient(135deg, #e6f2ff 0%, #dbeafe 50%, #f6f7fb 100%)'
        }}>
            <div style={{ textAlign: 'center', maxWidth: 380, width: '100%' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: 'var(--color-primary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0,115,234,.3)'
                }}>
                    <Activity size={36} color="#fff" strokeWidth={2.5} />
                </div>

                <h1 style={{ marginBottom: 6 }}>HealthWise</h1>
                <p style={{ color: 'var(--color-text-2)', marginBottom: 40, fontSize: '1rem' }}>
                    Track. Train. Transform.
                </p>

                <div className="card" style={{ textAlign: 'left' }}>
                    <h3 style={{ marginBottom: 8 }}>Sign in via SysWise</h3>
                    <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', marginBottom: 24 }}>
                        HealthWise uses SysWise for authentication. Please open HealthWise from your SysWise apps page.
                    </p>

                    <a
                        href={
                            window.location.hostname === 'localhost'
                                ? 'http://localhost:3100/apps'
                                : '/apps'
                        }
                        className="btn btn-primary w-full"
                        style={{ justifyContent: 'center' }}
                    >
                        Go to SysWise
                    </a>
                </div>

                <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
                    Your health data is private and encrypted.
                </p>
            </div>
        </div>
    );
}
