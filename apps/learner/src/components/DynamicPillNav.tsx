import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Headphones, Sword, Lightbulb, User, Menu, X, Home } from 'lucide-react';

const DynamicPillNav: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsExpanded(false);
    }, [location.pathname]);

    // Determine current mode name and icon based on path
    const getCurrentMode = () => {
        const path = location.pathname;
        if (path === '/' || path === '') return { name: 'Home', icon: <Home size={18} /> };
        if (path.includes('flow')) return { name: 'Flow', icon: <Headphones size={18} /> };
        if (path.includes('battle')) return { name: 'Battle', icon: <Sword size={18} /> };
        if (path.includes('think')) return { name: 'Think', icon: <Lightbulb size={18} /> };
        if (path.includes('chunks')) return { name: 'My Chunks', icon: <User size={18} /> };
        if (path.includes('profile')) return { name: 'Profile', icon: <User size={18} /> };
        return { name: 'EchoSpeak', icon: <Menu size={18} /> };
    };

    const currentMode = getCurrentMode();

    const menuItems = [
        { name: 'Home', path: '/', icon: <Home size={20} />, color: 'text-slate-600' },
        { name: 'Flow', path: '/flow', icon: <Headphones size={20} />, color: 'text-teal-500' },
        { name: 'Battle', path: '/battle', icon: <Sword size={20} />, color: 'text-rose-500' },
        { name: 'Think', path: '/think', icon: <Lightbulb size={20} />, color: 'text-indigo-500' },
        { name: 'My Chunks', path: '/chunks', icon: <User size={20} />, color: 'text-purple-500' },
        { name: 'Profile', path: '/profile', icon: <User size={20} />, color: 'text-gray-500' },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center items-end z-50 pointer-events-none">

            {/* Overlay background when expanded */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            {/* The Dynamic Pill Container */}
            <motion.div
                layout
                className={`bg-white shadow-2xl border border-gray-100/50 backdrop-blur-md rounded-[32px] overflow-hidden pointer-events-auto ${isExpanded ? 'p-4 w-64' : 'px-4 py-2 w-auto'}`}
                initial={false}
                animate={{
                    width: isExpanded ? 260 : 'auto',
                    height: isExpanded ? 'auto' : 50,
                    borderRadius: 32
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        /* EXPANDED MENU STATE */
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-col space-y-2"
                        >
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Switch Mode</span>
                                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="p-1 rounded-full hover:bg-gray-100">
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>

                            {menuItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-colors hover:bg-gray-50 ${location.pathname === item.path ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`}
                                >
                                    <div className={`p-2 rounded-full bg-white shadow-sm ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className="font-semibold text-gray-700">{item.name}</span>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        /* COLLAPSED PILL STATE */
                        <motion.button
                            key="collapsed"
                            onClick={() => setIsExpanded(true)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2"
                        >
                            <div className="flex items-center justify-center text-gray-800">
                                {currentMode.icon}
                            </div>
                            <span className="font-bold text-gray-800 text-sm whitespace-nowrap">
                                {currentMode.name}
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default DynamicPillNav;
