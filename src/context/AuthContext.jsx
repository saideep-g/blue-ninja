// NEW FILE: src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Fetch user profile from Firestore
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const profile = userDoc.data();
                        setUserProfile(profile);
                        setUserRole(profile.role || 'STUDENT');
                    } else {
                        // Default to STUDENT if profile doesn't exist
                        setUserRole('STUDENT');
                        setUserProfile({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: 'STUDENT',
                            name: currentUser.displayName || 'Student',
                            createdAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUserRole('STUDENT');
                }
            } else {
                setUser(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userRole, userProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
