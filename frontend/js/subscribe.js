const API_BASE = 'http://localhost:3000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('session_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

let selectedPlan = '';
let selectedAmount = 0;

document.querySelectorAll('.subscribe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedPlan = btn.dataset.plan;
        selectedAmount = btn.dataset.amount;

        document.getElementById('selectedPlan').textContent = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
        document.getElementById('selectedAmount').textContent = `$${selectedAmount}`;

        document.getElementById('paymentModal').style.display = 'flex';
    });
});

document.getElementById('modalClose')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
});

document.getElementById('modalOverlay')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
});

document.getElementById('mockPaymentBtn')?.addEventListener('click', async () => {
    try {
        const createResponse = await fetch(`${API_BASE}/subscription/create-payment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                plan: selectedPlan,
                amount: selectedAmount,
                currency: 'USD'
            })
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
            throw new Error(createData.error || 'Payment creation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        const verifyResponse = await fetch(`${API_BASE}/subscription/verify-payment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                paymentId: createData.paymentId,
                transactionId: `TXN_${Date.now()}`
            })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
            throw new Error(verifyData.error || 'Payment verification failed');
        }

        alert('Subscription activated successfully!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message);
    }
});
