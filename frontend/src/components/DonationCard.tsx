// In frontend/src/components/DonationCard.tsx

"use client";

import { useState, useEffect } from 'react';

// This is our frontend "dataset" for shelf life in hours
const shelfLifeHours: { [key: string]: number, _default: number } = {
    "chapathi": 8,
    "roti": 8,
    "dal": 4,
    "vegetable curry": 3,
    "rice": 4,
    "_default": 3
};

// Helper function to format the time remaining
const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Expired";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
};

export default function DonationCard({ donation }: { donation: any }) {
    const [isAccepted, setIsAccepted] = useState(false);
    const [expiryTime, setExpiryTime] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [status, setStatus] = useState({
        text: 'Fresh',
        color: 'bg-gray-400' // Default color
    });

    // This effect runs the countdown timer
    useEffect(() => {
        if (!isAccepted || !expiryTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const remainingSeconds = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
            setTimeRemaining(remainingSeconds);

            if (remainingSeconds <= 0) {
                setStatus({ text: 'Expired', color: 'bg-red-500' });
            } else if (remainingSeconds < 3600) { // Less than 1 hour
                setStatus({ text: 'Expiring Soon', color: 'bg-yellow-500' });
            } else {
                setStatus({ text: 'Fresh', color: 'bg-green-500' });
            }

        }, 1000);

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [isAccepted, expiryTime]);


    const handleAccept = () => {
        const preparedAt = new Date(donation.prepared_time);
        const foodKey = donation.food_type.toLowerCase();
        const lifeHours = shelfLifeHours[foodKey] || shelfLifeHours._default;
        
        const expiry = new Date(preparedAt.getTime() + lifeHours * 60 * 60 * 1000);
        setExpiryTime(expiry);
        setIsAccepted(true);
    };

    return (
        <div className="bg-white shadow-md p-6 rounded-lg hover:shadow-lg transition-all">
            <h3 className="text-xl font-bold text-green-700">
                {donation.food_type}
            </h3>
            <p className="text-gray-600 mt-1">
                📍 {donation.area}, {donation.state}
            </p>
            <p className="text-gray-600 mt-1">
                ⏰ Prepared at: {new Date(donation.prepared_time).toLocaleString()}
            </p>
            <p className="text-gray-600 mt-1">
                📦 Quantity: {donation.quantity}
            </p>

            {!isAccepted ? (
                 <button
                    onClick={handleAccept}
                    className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Accept Donation
                </button>
            ) : (
                <div className="mt-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Status:</span>
                        <span className={`px-3 py-1 text-sm text-white font-bold rounded-full ${status.color}`}>
                            {status.text}
                        </span>
                    </div>
                    <div className="mt-2 text-center text-2xl font-mono text-gray-800">
                        {timeRemaining !== null ? formatTime(timeRemaining) : 'Calculating...'}
                    </div>
                </div>
            )}
        </div>
    );
}