import { useState } from 'react';

export function useCustomFetch() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function startLoading() {
        setIsLoading(true);
        setError(null);
    }

    function stopLoading() {
        setIsLoading(false);
    }

    function setFetchError(message: string) {
        setError(message);
    }

    function ErrorView() {
        if (!error) return null;
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    function LoadingView() {
        if (!isLoading) return null;
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
            </div>
        );
    }

    return {
        startLoading,
        stopLoading,
        setFetchError,
        LoadingView,
        ErrorView,
    };
}