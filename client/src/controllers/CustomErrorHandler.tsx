import React, { createContext, useState, ReactNode } from "react";

// Define the type for the error state
interface ErrorState {
    error: Error | null;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
    clearError: () => void;
}

// Create the context with the defined type
export const ErrorContext = createContext<ErrorState | undefined>(undefined);

// Define the props for the provider component
interface CustomErrorHandlerProps {
    children: ReactNode;
}

// Capitalized component name
export const CustomErrorHandler = ({ children }: CustomErrorHandlerProps) => {
    const [error, setError] = useState<Error | null>(null);

    const clearError = () => setError(null);

    return (
        <ErrorContext.Provider value={{ error, setError, clearError }}>
            {error && (
                <div className="error-container">
                    <h2 className="error-title">Oops! Something went wrong.</h2>
                    <p className="error-message">{error.message || error.toString()}</p>
                    <button className="error-retry-button" onClick={clearError}>
                        Retry
                    </button>
                </div>
            )}
            {children}
        </ErrorContext.Provider>
    );
};
