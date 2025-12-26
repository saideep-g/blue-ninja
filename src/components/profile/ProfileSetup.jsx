import React, { useState } from 'react';
import { db, auth, storage } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileSetup() {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [favoriteColor, setFavoriteColor] = useState('purple');
    const [grade, setGrade] = useState('8');
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    const avatarOptions = ['🧟‍♀️', '🥷', '🦸‍♀️', '💫', '🌙', '✨', '⚡'];
    const colorOptions = ['purple', 'pink', 'teal', 'blue', 'green', 'orange'];
    const interestOptions = ['Math', 'Science', 'Art', 'Music', 'Sports', 'Gaming', 'Reading'];

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const userId = auth.currentUser?.uid;
            await updateDoc(doc(db, 'users', userId), {
                name,
                avatar,
                favoriteColor,
                grade,
                interests,
                profileCompleted: true,
                updatedAt: new Date().toISOString()
            });
            alert('Profile updated!');
        } catch (error) {
            console.error('Error saving profile:', error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-black text-purple-900 mb-2">Create Your Profile 👩‍🎓</h1>
                <p className="text-purple-600 font-medium mb-8">Make Blue Ninja yours!</p>

                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Choose Your Avatar</label>
                        <div className="grid grid-cols-7 gap-3">
                            {avatarOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setAvatar(option)}
                                    className={`text-4xl p-3 rounded-xl border-2 transition-all ${avatar === option
                                            ? 'border-purple-500 bg-purple-50 scale-110'
                                            : 'border-gray-200 hover:border-purple-200'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Favorite Color */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Favorite Color</label>
                        <div className="grid grid-cols-6 gap-3">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setFavoriteColor(color)}
                                    className={`p-6 rounded-xl border-2 transition-all capitalize ${favoriteColor === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                                        }`}
                                    style={{
                                        backgroundColor: {
                                            purple: '#A855F7',
                                            pink: '#F43F5E',
                                            teal: '#06B6D4',
                                            blue: '#3B82F6',
                                            green: '#10B981',
                                            orange: '#F59E0B'
                                        }[color]
                                    }}
                                ></button>
                            ))}
                        </div>
                    </div>

                    {/* Grade */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Grade</label>
                        <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
                        >
                            <option>6</option>
                            <option>7</option>
                            <option>8</option>
                            <option>9</option>
                            <option>10</option>
                        </select>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Your Interests (Pick 3)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {interestOptions.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => {
                                        if (interests.includes(interest)) {
                                            setInterests(interests.filter(i => i !== interest));
                                        } else if (interests.length < 3) {
                                            setInterests([...interests, interest]);
                                        }
                                    }}
                                    className={`p-3 rounded-xl border-2 font-bold transition-all ${interests.includes(interest)
                                            ? 'border-purple-500 bg-purple-100 text-purple-900'
                                            : 'border-gray-200 text-gray-900 hover:border-purple-200'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveProfile}
                        disabled={loading || !name}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-wider transition-all ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                            }`}
                    >
                        {loading ? 'Saving...' : 'Complete Profile ✨'}
                    </button>
                </div>
            </div>
        </div>
    );
}
