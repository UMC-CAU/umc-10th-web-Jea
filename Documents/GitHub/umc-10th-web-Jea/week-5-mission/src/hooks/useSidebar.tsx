import { useState } from "react";

interface UseSidebarReturn {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

function useSidebar(): UseSidebarReturn {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);

    return { isOpen, open, close, toggle };
}

export default useSidebar;