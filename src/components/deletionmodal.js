/**
 * Custom confirmation modal instead of browser alerts.
 */
export function showConfirm(title, message, onOk) {
    const modal = document.querySelector('#confirm-modal');
    if (!modal) return;

    modal.querySelector('#confirm-title').textContent = title;
    modal.querySelector('#confirm-message').textContent = message;
    
    const okBtn = modal.querySelector('#confirm-ok-btn');
    const cancelBtn = modal.querySelector('#confirm-cancel-btn');
    
    const close = () => modal.classList.remove('open');
    
    okBtn.onclick = (e) => {
        e.stopPropagation();
        onOk();
        close();
    };
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        close();
    };
    
    modal.classList.add('open');
}
