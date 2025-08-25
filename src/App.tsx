import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./context/AuthContext";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
// ...existing code...
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import XeTiicDashboard from "./pages/Dashboard/XeTiicDashboard";
import { CompanyPage, CompanyBusManagement } from "./pages/Company";
import RoutesManagement from "./pages/Routes/RoutesManagement";
import { CustomerList } from "./pages/Customer";
import UserManagement from "./pages/User/UserManagement";

import { LocationList } from "./pages/Location";
import { RoleManagement } from "./pages/Role";
import DarkModeDemo from "./components/demo/DarkModeDemo";
import AuthGuard from "./components/auth/AuthGuard";
import { Component, ReactNode } from "react";
import RevenueReport from "./pages/Reports/RevenueReport";
import TicketList from "./pages/Tickets/TicketList";
import DriverTrips from "./pages/Driver/DriverTrips";
import DriverTripPassengers from "./pages/Driver/DriverTripPassengers";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App: Rendering...');
  
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ScrollToTop />
              <Routes>
                {/* Public routes - Auth Pages */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Protected routes - Dashboard Layout */}
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
                      <Routes>
                        <Route path="/" element={<AppLayout />}>
                          <Route index element={<XeTiicDashboard />} />

                          {/* Company Pages */}
                          <Route path="company" element={<CompanyPage />} />
                          <Route path="company-buses" element={<CompanyBusManagement />} />

                          {/* Routes Management */}
                          <Route path="routes" element={<RoutesManagement />} />
                          <Route path="driver-trips" element={<DriverTrips />} />
                          <Route path="driver-trips/:tripId/passengers" element={<DriverTripPassengers />} />

                          {/* Bus Management moved under company; schedule route removed */}

                          {/* Customer Management */}
                          <Route path="customers" element={<CustomerList />} />

                          {/* Location Management */}
                          <Route path="locations" element={<LocationList />} />

                          {/* Dark Mode Demo */}
                          <Route path="dark-mode-demo" element={<DarkModeDemo />} />

                          {/* Role Management */}
                          <Route path="roles" element={<RoleManagement />} />

                          {/* User Management */}
                          <Route path="users" element={<UserManagement />} />
                          


                          {/* Others Page */}
                          <Route path="profile" element={<UserProfiles />} />
                          <Route path="calendar" element={<Calendar />} />
                          <Route path="blank" element={<Blank />} />

                          {/* Forms */}
                          <Route path="form-elements" element={<FormElements />} />

                          {/* Tables */}
                          <Route path="basic-tables" element={<BasicTables />} />

                          {/* Ui Elements */}
                          <Route path="alerts" element={<Alerts />} />
                          <Route path="avatars" element={<Avatars />} />
                          <Route path="badge" element={<Badges />} />
                          <Route path="buttons" element={<Buttons />} />
                          <Route path="images" element={<Images />} />
                          <Route path="videos" element={<Videos />} />

                          {/* Charts */}
                          <Route path="line-chart" element={<LineChart />} />
                          <Route path="bar-chart" element={<BarChart />} />

                          {/* Reports */}
                          <Route
                            path="reports/revenue"
                            element={
                              <AuthGuard requiredPermission="reports.read">
                                <RevenueReport />
                              </AuthGuard>
                            }
                          />

                          {/* Blocked Routes - Redirect to Dashboard */}
                          <Route path="book-ticket" element={<Navigate to="/" replace />} />
                          <Route
                            path="tickets"
                            element={
                              <AuthGuard requiredPermission="reports.read">
                                <TicketList />
                              </AuthGuard>
                            }
                          />
                          <Route path="cancel-ticket" element={<Navigate to="/" replace />} />
                          <Route path="schedule" element={<Navigate to="/" replace />} />
                          <Route path="booking-history" element={<Navigate to="/" replace />} />
                          <Route path="reports/tickets" element={<Navigate to="/" replace />} />
                          <Route path="settings" element={<Navigate to="/" replace />} />
                          <Route path="notifications" element={<Navigate to="/" replace />} />
                          <Route path="news" element={<Navigate to="/" replace />} />
                          <Route path="support" element={<Navigate to="/" replace />} />


                        </Route>
                      </Routes>
                    </AuthGuard>
                  }
                />
              </Routes>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
