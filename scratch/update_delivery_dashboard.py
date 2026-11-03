with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

marker = 'No tasks in this category.'
if marker in c:
    pos = c.find(marker)
    start = c.rfind(') : (', 0, pos)
    end = c.find(')}', pos) + 2

    replacement = """) : (
                                /* When there is no card in the delivery panel, only show the orders list page */
                                <DeliveryOrdersListFeed
                                    orders={orders}
                                    searchQuery={searchQuery}
                                    paddingBottomClass="pb-12"
                                    onSelectOrder={(order) => {
                                        const oId = order._id || order.id;
                                        localStorage.setItem('active_delivery_order_id', oId);
                                        localStorage.setItem('active_delivery_stay', 'true');
                                        navigate(`/admin/delivery-order/${oId}`);
                                    }}
                                />
                            )}"""

    c = c[:start] + replacement + c[end:]

    with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Replaced successfully!")
else:
    print("Marker not found, already replaced or different text.")
