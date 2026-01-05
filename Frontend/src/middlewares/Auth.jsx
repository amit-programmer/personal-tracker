import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Read a cookie by name
 */
function getCookie(name) {
    if (typeof document === "undefined") return null;
    const matches = document.cookie.match(
        new RegExp(
            "(?:^|; )" +
                name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") +
                "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Try common places for an auth token:
 * - cookies (token, auth_token, access_token)
 * - localStorage (token, auth_token, access_token)
 * Returns token string or null
 */
export function getAuthToken() {
    if (typeof window === "undefined") return null;

    const cookieKeys = ["token", "auth_token", "access_token"];
    for (const k of cookieKeys) {
        const t = getCookie(k);
        if (t) return t;
    }

    const lsKeys = ["token", "auth_token", "access_token"];
    for (const k of lsKeys) {
        const t = window.localStorage.getItem(k);
        if (t) return t;
    }

    return null;
}

/**
 * Attach token to an axios instance (if available).
 * Example usage:
 *   import axios from "axios";
 *   attachAuthToAxios(axios);
 */
export function attachAuthToAxios(axiosInstance) {
    if (!axiosInstance) return;
    const token = getAuthToken();
    if (token) {
        axiosInstance.defaults.headers.common["Authorization"] =
            token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    } else {
        delete axiosInstance.defaults.headers.common["Authorization"];
    }

    // optional: refresh header on each request in case token changes
    axiosInstance.interceptors.request.use((config) => {
        const t = getAuthToken();
        if (t) config.headers = { ...config.headers, Authorization: t.startsWith("Bearer ") ? t : `Bearer ${t}` };
        return config;
    });
}

/**
 * ProtectedRoute component for react-router (v6).
 * Wrap routes that require auth:
 * <Route path="/dash" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, redirectTo = "/login" }) {
    const location = useLocation();
    const token = getAuthToken();

    if (!token) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    return children;
}


