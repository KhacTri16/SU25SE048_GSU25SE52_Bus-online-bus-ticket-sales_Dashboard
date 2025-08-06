import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Auth Form Section */}
        <div className="flex-1 flex items-center justify-center p-6 lg:w-1/2">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
        
        {/* Right Side Image Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 items-center justify-center relative overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0">
            <GridShape />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8">
            {/* Logo */}
            <Link to="/" className="block mb-8">
              <div className="flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mb-4">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">XeTiic Dashboard</h2>
            </Link>
            
            {/* Description */}
            <div className="text-white/90 space-y-4">
              <h3 className="text-xl font-semibold">
                Hệ thống quản lý bán vé xe khách
              </h3>
              <p className="text-white/70 leading-relaxed">
                Quản lý stations, routes, bookings và toàn bộ hoạt động kinh doanh vận tải một cách hiệu quả và chuyên nghiệp.
              </p>
              
              {/* Features */}
              <div className="text-left space-y-2 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white/80">Quản lý stations & routes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white/80">Hệ thống roles & permissions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white/80">Dashboard analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white/80">Modern & responsive UI</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 rounded-lg transform rotate-45"></div>
        </div>
        
        {/* Theme Toggle */}
        <div className="fixed z-50 bottom-6 right-6">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
