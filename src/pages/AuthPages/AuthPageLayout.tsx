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
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 items-center justify-center relative overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <GridShape />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-8">
            {/* Logo */}
            <Link to="/" className="block mb-12">
              <div className="flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mb-6 shadow-lg">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">X</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                XeTiic Dashboard
              </h2>
              <p className="text-white/80 text-lg font-medium">
                Hệ thống quản lý bán vé xe khách
              </p>
            </Link>
            
            {/* Description */}
            <div className="text-white/90 space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold leading-tight">
                  Quản lý vận tải thông minh
                </h3>
                <p className="text-white/70 leading-relaxed text-lg">
                  Hệ thống quản lý toàn diện cho hoạt động vận tải hành khách với công nghệ hiện đại và giao diện thân thiện.
                </p>
              </div>
              
              {/* Features */}
              <div className="text-left space-y-4 mt-8">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-white/90 text-lg">Quản lý tuyến xe & trạm dừng</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-white/90 text-lg">Hệ thống phân quyền thông minh</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-white/90 text-lg">Báo cáo & thống kê real-time</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-white/90 text-lg">Giao diện responsive & hiện đại</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-16 right-16 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-16 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 right-24 w-20 h-20 bg-white/10 rounded-lg transform rotate-45 blur-sm"></div>
          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-white/8 rounded-full blur-md"></div>
        </div>
        
        {/* Theme Toggle */}
        <div className="fixed z-50 bottom-6 right-6">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
