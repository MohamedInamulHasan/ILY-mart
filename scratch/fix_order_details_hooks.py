order_details_path = 'src/pages/OrderDetails.jsx'
with open(order_details_path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add isCancelling state at top next to cancelConfirmation
old_top = """    const { user, refreshUser } = useAuth();
    const [cancelConfirmation, setCancelConfirmation] = useState(false);"""

new_top = """    const { user, refreshUser } = useAuth();
    const [cancelConfirmation, setCancelConfirmation] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);"""

# 2. Remove the late useState on line 168
old_late = """    const [isCancelling, setIsCancelling] = useState(false);

    const confirmCancelOrder = async () => {"""

new_late = """    const confirmCancelOrder = async () => {"""

if old_top in c and old_late in c:
    c = c.replace(old_top, new_top)
    c = c.replace(old_late, new_late)
    with open(order_details_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Fixed React Hook Error in OrderDetails.jsx successfully!")
else:
    print("ERROR: Targets not found in OrderDetails.jsx")

