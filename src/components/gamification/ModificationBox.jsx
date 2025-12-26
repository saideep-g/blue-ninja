import React, { useState, useEffect } from 'react';
import { motivationalMessages } from '../../data/motivations';

export default function MotivationBox({ stage = 'start' }) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        const messages = motivationalMessages[stage] || motivationalMessages.start;
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, [stage]);

    return (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 text-center border-2 border-purple-200">
            <p className="text-2xl font-black text-gray-900 italic">{message}</p>
        </div>
    );
}
