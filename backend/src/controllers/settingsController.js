import Settings from '../models/Settings.js';
import { getIO } from '../socket.js';

// Get all settings or a specific setting by key
export const getSettings = async (req, res) => {
    try {
        const { key } = req.params;

        if (key) {
            const setting = await Settings.findOne({ key });
            if (!setting) {
                // If requesting a specific key that doesn't exist, return default structure or 404
                // For delivery_times, if it doesn't exist, we might want to return a default
                if (key === 'delivery_times' || key === 'cities') {
                    return res.json({ success: true, data: { value: [] } }); // Return empty array implies no restriction or need to handle on frontend
                }
                return res.status(404).json({ success: false, message: 'Setting not found' });
            }
            return res.json({ success: true, data: setting });
        }

        const settings = await Settings.find({});
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Server error fetching settings' });
    }
};

import User from '../models/User.js';

// Update or create a setting
export const updateSettings = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        console.log(`🔧 Update Settings: Key=${key}, Value=`, value);

        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: 'Key and value are required' });
        }

        // --- SPECIAL LOGIC FOR CITIES ---
        // If updating cities, check for deletions and sync with User profiles
        if (key === 'cities' && Array.isArray(value)) {
            const currentSettings = await Settings.findOne({ key: 'cities' });
            const currentCities = Array.isArray(currentSettings?.value) ? currentSettings.value : [];

            // Find cities that were present but are now missing in the new value
            const deletedCities = currentCities.filter(city => !value.includes(city));

            if (deletedCities.length > 0) {
                console.log(`🗑️ Deleted Cities detected: ${deletedCities.join(', ')}. removing from users...`);

                // Update users who have these cities selected
                // 1. Clear root 'city' field
                // 2. Clear 'address.city' field if it exists
                await User.updateMany(
                    {
                        $or: [
                            { city: { $in: deletedCities } },
                            { 'address.city': { $in: deletedCities } }
                        ]
                    },
                    {
                        $set: {
                            city: "",
                            'address.city': ""
                        }
                    }
                );
                console.log(`✅ Synced deleted cities with user profiles.`);
            }
        }
        // --------------------------------

        // When admin starts a NEW signup bonus round, reset hasReceivedSignupBonus for all users
        // so they can qualify again in the new round
        if (key === 'signup_bonus' && value?.isEnabled === true) {
            await User.updateMany({}, { $set: { hasReceivedSignupBonus: false } });
            console.log('🔄 Reset hasReceivedSignupBonus for all users (new signup bonus round started)');
        }

        const setting = await Settings.findOneAndUpdate(
            { key },
            {
                value,
                description,
                updatedAt: Date.now()
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Emit real-time event
        getIO().emit('settings:updated', setting);
        
        // Specifically for maintenance mode & message
        if (key === 'maintenance_mode') {
            getIO().emit('system:maintenance', value);
        }
        if (key === 'maintenance_message') {
            getIO().emit('system:maintenance_message', value);
        }

        res.json({ success: true, data: setting });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error updating settings' });
    }
};
