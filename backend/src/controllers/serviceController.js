import Service from '../models/Service.js';
import ServiceItem from '../models/ServiceItem.js';
import { getIO } from '../socket.js';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true }).lean().sort({ order: 1, name: 1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
export const getService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).lean();
        if (service) {
            res.json(service);
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req, res) => {
    try {
        const { name, description, image, address, mobile, category, timingType, openingTime, closingTime, isManuallyClosed } = req.body;
        const service = await Service.create({
            name,
            description,
            image,
            address,
            mobile,
            category,
            timingType,
            openingTime,
            closingTime,
            isManuallyClosed
        });
        res.status(201).json(service);
        getIO().emit('service:updated', service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).lean();
        if (service) {
            // Ownership check for service_admin
            const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
            if (roles.includes('service_admin') && String(service._id) !== String(req.user.serviceId)) {
                return res.status(403).json({ message: 'Not authorized to manage this service' });
            }

            service.name = req.body.name || service.name;
            service.description = req.body.description || service.description;
            service.image = req.body.image || service.image;
            service.address = req.body.address || service.address;
            service.mobile = req.body.mobile || service.mobile;
            service.category = req.body.category || service.category;
            
            // New fields
            if (req.body.timingType !== undefined) service.timingType = req.body.timingType;
            if (req.body.openingTime !== undefined) service.openingTime = req.body.openingTime;
            if (req.body.closingTime !== undefined) service.closingTime = req.body.closingTime;
            if (req.body.isManuallyClosed !== undefined) service.isManuallyClosed = req.body.isManuallyClosed;

            const updatedService = await service.save();
            res.json(updatedService);
            getIO().emit('service:updated', updatedService);
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update services order
// @route   PUT /api/services/reorder
// @access  Private/Admin
export const updateServicesOrder = async (req, res) => {
    try {
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const updates = orderedIds.map((id, index) => {
            return Service.findByIdAndUpdate(id, { order: index });
        });

        await Promise.all(updates);

        res.json({ message: 'Services reordered successfully' });
        getIO().emit('service:updated');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).lean();
        if (service) {
            if (service.image) await deleteFromCloudinary(service.image);
            
            // Delete service items and their images
            const items = await ServiceItem.find({ serviceId: service._id });
            for (const item of items) {
                if (item.image) await deleteFromCloudinary(item.image);
            }
            await ServiceItem.deleteMany({ serviceId: service._id });
            await service.deleteOne();
            res.json({ message: 'Service removed' });
            getIO().emit('service:updated');
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Service Items ---

// @desc    Get service items
// @route   GET /api/services/:id/items
// @access  Public
export const getServiceItems = async (req, res) => {
    try {
        const { all } = req.query;
        let query = { serviceId: req.params.id };

        // If not requesting 'all' (admin view), filter by active and available status
        if (all !== 'true') {
            query.isActive = true;
            query.isAvailable = { $ne: false };
        }

        const items = await ServiceItem.find(query).sort({ order: 1, name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create service item
// @route   POST /api/services/:id/items
// @access  Private/Admin
export const createServiceItem = async (req, res) => {
    try {
        // Ownership check for service_admin
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('service_admin') && String(req.params.id) !== String(req.user.serviceId)) {
            return res.status(403).json({ message: 'Not authorized to add items to this service' });
        }

        const { name, description, price, image, isAvailable } = req.body;
        const item = await ServiceItem.create({
            serviceId: req.params.id,
            name,
            description,
            price,
            image,
            isAvailable: isAvailable !== undefined ? isAvailable : true
        });
        res.status(201).json(item);
        getIO().emit('service:updated'); // Items belong to services, invalidate service items
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update service item
// @route   PUT /api/services/items/:itemId
// @access  Private/Admin
export const updateServiceItem = async (req, res) => {
    try {
        const item = await ServiceItem.findById(req.params.itemId);
        if (item) {
            // Ownership check for service_admin
            const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
            if (roles.includes('service_admin') && String(item.serviceId) !== String(req.user.serviceId)) {
                return res.status(403).json({ message: 'Not authorized to manage this item' });
            }

            item.name = req.body.name || item.name;
            item.description = req.body.description || item.description;
            item.price = req.body.price !== undefined ? req.body.price : item.price;
            item.image = req.body.image || item.image;
            item.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : item.isAvailable;

            const updatedItem = await item.save();
            res.json(updatedItem);
            getIO().emit('service:updated');
        } else {
            res.status(404).json({ message: 'Service Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update service items order
// @route   PUT /api/services/:id/items/reorder
// @access  Private/Admin
export const updateServiceItemsOrder = async (req, res) => {
    try {
        // Ownership check for service_admin
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('service_admin') && String(req.params.id) !== String(req.user.serviceId)) {
            return res.status(403).json({ message: 'Not authorized to reorder items for this service' });
        }

        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const updates = orderedIds.map((id, index) => {
            return ServiceItem.findByIdAndUpdate(id, { order: index });
        });

        await Promise.all(updates);

        res.json({ message: 'Service items reordered successfully' });
        getIO().emit('service:updated');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete service item
// @route   DELETE /api/services/items/:itemId
// @access  Private/Admin
export const deleteServiceItem = async (req, res) => {
    try {
        const item = await ServiceItem.findById(req.params.itemId);
        if (item) {
            // Ownership check for service_admin
            const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
            if (roles.includes('service_admin') && String(item.serviceId) !== String(req.user.serviceId)) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            await item.deleteOne();
            res.json({ message: 'Service Item removed' });
            getIO().emit('service:updated');
        } else {
            res.status(404).json({ message: 'Service Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
