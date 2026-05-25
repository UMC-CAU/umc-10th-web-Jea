import { useState, useEffect, useRef } from "react";

function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastUpdated = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const now = Date.now();

        if (lastUpdated.current === null || now - lastUpdated.current >= interval) {
            lastUpdated.current = now;
            setThrottledValue(value);
        } else {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            const remaining = interval - (now - lastUpdated.current);
            timerRef.current = setTimeout(() => {
                lastUpdated.current = Date.now();
                setThrottledValue(value);
            }, remaining);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, interval]);

    return throttledValue;
}

export default useThrottle;