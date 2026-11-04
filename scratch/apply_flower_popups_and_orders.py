import re

# 1. Update Orders.jsx: white text and icons, rectangular solid tags
with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    orders_code = f.read()

orders_status_color = '''    const getStatusColor = (status) => {
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

orders_status_icon = '''    const getStatusIcon = (status) => {
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

# Replace whatever getStatusColor currently is
orders_code = re.sub(
    r'const getStatusColor = \(status\) => \{[\s\S]*?\n    \};',
    orders_status_color.strip(),
    orders_code
)

orders_code = re.sub(
    r'const getStatusIcon = \(status\) => \{[\s\S]*?\n    \};',
    orders_status_icon.strip(),
    orders_code
)

# Ensure the tag span has text-white
orders_code = re.sub(
    r'<span className="font-bold[^"]*">\{getStatusText\(order\.status\)\}<\/span>',
    '<span className="font-bold text-white">{getStatusText(order.status)}</span>',
    orders_code
)

orders_code = re.sub(
    r'<div className=\{`inline-flex items-center px-2(?:\.5)? py-(?:0\.5|1) rounded-(?:full|md)[^`]*`\}>',
    '<div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] md:text-xs font-bold text-white shadow-xs select-none ${getStatusColor(order.status)}`}>',
    orders_code
)

with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(orders_code)
print("Updated Orders.jsx with pure white text and icons on solid rectangular status tags")

