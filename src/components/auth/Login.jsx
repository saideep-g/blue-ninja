import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Login: The Dojo Entrance
 * Styled for the Blue Ninja theme. 
 * Allows students to enter their personal "Summer Sky" dashboard.
 */
function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 px-4">
            <div className="ninja-card">
                <div className="text-center mb-8">
                    <span className="text-4xl mb-4 block">🌊</span>
                    <h2 className="text-3xl font-black text-blue-800 italic uppercase tracking-tighter">
                        Blue Ninja
                    </h2>
                    <p className="text-blue-500 font-medium mt-1">
                        {isSignUp ? 'Begin your journey' : 'Welcome back, Ninja!'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Guardian's Email"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Ninja Secret Code"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <p className="text-red-500 text-sm font-bold px-2">⚠️ {error}</p>}

                    <button type="submit" className="btn-primary w-full">
                        {isSignUp ? 'Create My Dojo ➤' : 'Enter Dojo ➤'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-blue-600 font-bold text-sm hover:underline"
                    >
                        {isSignUp ? 'Already a Ninja? Sign In' : 'New here? Start your Quest'}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-center text-xs text-blue-400 font-bold uppercase tracking-widest leading-loose">
                "When I fly towards you, <br /> the whole world turns Blue."
            </p>
        </div>
    );
}

export default Login;