import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LogIn, UserPlus, User, Menu, X } from 'lucide-react';
import Cookies from 'js-cookie';


export default function Nav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
              
                const userID = localStorage.getItem("userId");
                const token = Cookies.get("token");

                // console.log('token', token)

                if (!token || !userID) {
                    setIsLoggedIn(false);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:3000/api/auth/${userID}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                // console.log("response in nav =", response);

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData.user);
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setIsLoggedIn(false);
            setUser(null);
            setShowDropdown(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const logo = Cookies.get("logo");

    return (
        <nav className="backdrop-blur-md bg-black/30 border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
                {/* Brand */}
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">PT</span>
                        </div>
                        <h1 className="text-white font-bold text-lg md:text-xl hidden sm:block">Personal Tracker</h1>
                    </div>

                    {/* Navigation Links - Desktop */}
                    {isLoggedIn && user && (
                        <div className="hidden md:flex gap-6">
                            <button
                                onClick={() => navigate('/finance')}
                                className="text-white hover:text-blue-400 transition-colors text-sm"
                            >
                                Finance
                            </button>
                            <button
                                onClick={() => navigate('/food')}
                                className="text-white hover:text-blue-400 transition-colors text-sm"
                            >
                                Food
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 md:gap-4">
                    {loading ? (
                        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                    ) : isLoggedIn && user ? (
                        <>
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="md:hidden text-white hover:text-blue-400 transition-colors"
                            >
                                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            {/* User Profile */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all overflow-hidden"
                                >
                                    {logo ? (
                                        <img src={logo} alt="User Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-white" />
                                    )}
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg backdrop-blur-md bg-black/40 border border-white/10 shadow-xl overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <p className="text-white text-sm font-semibold">{user.name || user.email}</p>
                                            <p className="text-gray-400 text-xs">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2 md:gap-3">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2 text-sm md:text-base">
                                <LogIn size={18} />
                                <span className="hidden sm:inline">Login</span>
                            </button>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm bg-gradient-to-r from-blue-500 to-purple-600 border border-white/20 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 text-sm md:text-base">
                                <UserPlus size={18} />
                                <span className="hidden sm:inline">Sign Up</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isLoggedIn && user && showMobileMenu && (
                <div className="md:hidden backdrop-blur-md bg-black/40 border-t border-white/10">
                    <div className="flex flex-col gap-2 px-4 py-3">
                        <button
                            onClick={() => {
                                navigate('/finance');
                                setShowMobileMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Finance
                        </button>
                        <button
                            onClick={() => {
                                navigate('/food');
                                setShowMobileMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Food
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}