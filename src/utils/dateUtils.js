/**
 * Format a date string or Date object to a readable date format
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date (e.g., "Dec 18, 2024")
 */
export const formatOrderDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};

/**
 * Format a date string or Date object to include both date and time
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date and time (e.g., "Dec 18, 2024 at 10:30 AM")
 */
export const formatOrderDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

        return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
        console.error('Error formatting date time:', error);
        return 'Invalid Date';
    }
};

/**
 * Format a date string or Date object to a banner format (e.g. "Nov 6, 8.00 PM")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted banner date and time
 */
export const formatOrderBannerTime = (dateString) => {
    if (!dateString) return '';

    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';

        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

        return `${month} ${day}, ${hours}.${minStr} ${ampm}`;
    } catch (error) {
        return '';
    }
};

/**
 * Format scheduled delivery time to a range (e.g., "Dec 20, 2024 • 2pm - 3pm")
 * @param {string|Date} dateString - The scheduled delivery date
 * @returns {string} Formatted delivery time
 */
export const formatDeliveryTime = (dateString) => {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);

        const dateOptions = { month: 'short', day: 'numeric' };
        const hStart = date.getHours();
        const mStart = date.getMinutes().toString().padStart(2, '0');
        const hEnd = (hStart + 1) % 24;

        const formatShortTime = (h, m) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m) === 0 ? '' : `:${m}`;
            return `${h12}${mStr}${ampm}`;
        };

        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        const range = `${formatShortTime(hStart, mStart)} - ${formatShortTime(hEnd, mStart)}`;

        return `${formattedDate} (${range})`;
    } catch (error) {
        console.error('Error formatting delivery time:', error);
        return String(dateString);
    }
};

/**
 * Get relative time (e.g., "2 days ago", "Just now")
 * @param {string|Date} dateString - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return formatOrderDate(dateString);
    } catch (error) {
        console.error('Error getting relative time:', error);
        return 'Invalid Date';
    }
};
