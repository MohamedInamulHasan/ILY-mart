import ServiceRequest from '../models/ServiceRequest.js';
import Service from '../models/Service.js';
import { sendServiceRequestNotification } from '../services/emailService.js';
import { sendServiceRequestTelegramNotification } from '../services/telegramService.js';
import { sendServiceRequestVoiceAlert } from '../services/voiceService.js';
import { sendServiceRequestNtfyAlert } from '../services/ntfyService.js';
import { sendServiceRequestWhatsAppNotification } from '../services/whatsappService.js';
import { sendN8nServiceRequestEvent } from '../services/n8nService.js';


// @desc    Create a new service request
// @route   POST /api/service-requests
// @access  Private
export const createServiceRequest = async (req, res) => {
    try {
        console.log('Received service request payload:', req.body);
        const { serviceId, location, coordinates, items } = req.body;


        if (!serviceId) {
            console.error('Service ID missing in payload');
            return res.status(400).json({ message: 'Service ID is required' });
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            console.error(`Service not found for ID: ${serviceId}`);
            return res.status(404).json({ message: 'Service not found' });
        }

        if (!req.user || !req.user._id) {
            console.error('User not authenticated or missing from request object');
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const serviceRequest = new ServiceRequest({
            user: req.user._id,
            service: serviceId,
            location: location || '',
            coordinates: coordinates || '',
            items: items || [],
            status: 'Pending' // Explicitly set default
        });

        const createdRequest = await serviceRequest.save();

        console.log('Service Request created successfully:', createdRequest._id);

        // Populate service details for the response
        await createdRequest.populate('service');
        await createdRequest.populate('user', 'name email mobile address location');

        // Send notification email
        try {
            await sendServiceRequestNotification(createdRequest);
            console.log('📧 Service request notification sent');
        } catch (emailError) {
            console.error('❌ Failed to send service request notification:', emailError);
            // Don't fail the request if email fails
        }

        // Send Telegram notification
        try {
            await sendServiceRequestTelegramNotification(createdRequest);
            console.log('📱 Service request Telegram notification sent');
        } catch (telegramError) {
            console.error('❌ Failed to send service request Telegram notification:', telegramError);
            // Don't fail the request if Telegram fails
        }

        // Send Voice alert via IFTTT (non-blocking)
        try {
            sendServiceRequestVoiceAlert(createdRequest)
                .then(result => console.log('📞 Voice alert service result:', result))
                .catch(err => console.error('❌ Failed to send Voice alert:', err));
        } catch (voiceError) {
            console.error('❌ Voice alert trigger error:', voiceError);
        }

        // Send ntfy push notification alert to admin phone (non-blocking)
        try {
            sendServiceRequestNtfyAlert(createdRequest)
                .then(result => console.log('🔔 ntfy service request alert result:', result))
                .catch(err => console.error('❌ Failed to send ntfy service request alert:', err));
        } catch (ntfyError) {
            console.error('❌ ntfy service request trigger error:', ntfyError);
        }

        // Send n8n webhook notification (non-blocking)
        try {
            sendN8nServiceRequestEvent(createdRequest, 'service.created')
                .catch(err => console.error('❌ Failed to send n8n service request webhook:', err));
        } catch (n8nError) {
            console.error('❌ n8n service request trigger error:', n8nError);
        }

        // Send Green-API WhatsApp service request notification (non-blocking)
        try {
            sendServiceRequestWhatsAppNotification(createdRequest)
                .catch(err => console.error('❌ Failed to send WhatsApp service request notification:', err));
        } catch (waError) {
            console.error('❌ WhatsApp service request trigger error:', waError);
        }

        res.status(201).json(createdRequest);
    } catch (error) {
        console.error('Error creating service request:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all service requests (Admin)
// @route   GET /api/service-requests
// @access  Private/Admin
export const getServiceRequests = async (req, res) => {
    try {
        let query = {};

        // If user is service_admin, filter by their serviceId
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role];
        const isAdmin = roles.includes('admin');
        const isServiceAdmin = roles.includes('service_admin');

        if (isServiceAdmin && !isAdmin && req.user.serviceId) {
            query.service = req.user.serviceId;
        }

        const requests = await ServiceRequest.find(query)
            .populate('user', 'name email mobile address location')
            .populate('service', 'name image mobile')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update service request status
// @route   PUT /api/service-requests/:id
// @access  Private/Admin
export const updateServiceRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await ServiceRequest.findById(req.params.id);

        if (request) {
            // Ownership check for service_admin
            const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role];
            const isAdmin = roles.includes('admin');
            const isServiceAdmin = roles.includes('service_admin');

            if (isServiceAdmin && !isAdmin && String(request.service) !== String(req.user.serviceId)) {
                return res.status(403).json({ message: 'Not authorized to manage this request' });
            }

            request.status = status;
            const updatedRequest = await request.save();
            await updatedRequest.populate('user', 'name email mobile');
            await updatedRequest.populate('service', 'name image mobile');

            // Send n8n webhook notification for service status update (non-blocking)
            sendN8nServiceRequestEvent(updatedRequest, 'service.status_updated')
                .catch(err => console.error('❌ Failed to send n8n service request status webhook:', err));

            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Service Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete service request
// @route   DELETE /api/service-requests/:id
// @access  Private/Admin
export const deleteServiceRequest = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);

        if (request) {
            await request.deleteOne();
            res.json({ message: 'Service Request removed' });
        } else {
            res.status(404).json({ message: 'Service Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
