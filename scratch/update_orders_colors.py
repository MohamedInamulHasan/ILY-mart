with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restore getStatusColor
old_status_color = '''    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return 'bg-emerald-600 text-white';
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return 'bg-sky-600 text-white';
            case 'Processing':
            case 'Pending':
                return 'bg-amber-500 text-white';
            case 'Cancelled':
                return 'bg-rose-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };'''

new_status_color = '''    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return 'bg-emerald-100 dark:bg-emerald-950/60 text-[#2E5A2E] dark:text-[#CBF9B2]';
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return 'bg-sky-100 dark:bg-sky-950/60 text-[#0284c7] dark:text-[#38bdf8]';
            case 'Processing':
            case 'Pending':
                return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
            case 'Cancelled':
                return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
        }
    };'''

content = content.replace(old_status_color, new_status_color)

# 2. Restore getStatusIcon
old_status_icon = '''    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return <CheckCircle size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return <Truck size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Processing':
            case 'Pending':
                return <Clock size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Cancelled':
                return <RotateCcw size={13} className="mr-1 stroke-[2.5] text-white" />;
            default:
                return null;
        }
    };'''

new_status_icon = '''    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return <CheckCircle size={14} className="mr-1 stroke-[2.5]" />;
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return <Truck size={14} className="mr-1 stroke-[2.5]" />;
            case 'Processing':
            case 'Pending':
                return <Clock size={14} className="mr-1 stroke-[2.5]" />;
            case 'Cancelled':
                return <RotateCcw size={14} className="mr-1 stroke-[2.5]" />;
            default:
                return null;
        }
    };'''

content = content.replace(old_status_icon, new_status_icon)

# 3. Restore status tag JSX element (keep rectangular rounded-md, restore text color to inherit)
old_tag_jsx = '''                                                <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] md:text-xs font-bold text-white shadow-xs select-none ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="font-bold text-white">{getStatusText(order.status)}</span>
                                                </div>'''

new_tag_jsx = '''                                                <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold border-0 shadow-none select-none ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="font-bold">{getStatusText(order.status)}</span>
                                                </div>'''

content = content.replace(old_tag_jsx, new_tag_jsx)

with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Orders.jsx colors successfully")

