import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";
import RootLayout from "./pages/Rootlayout";
import UserLayout from "./components/UserLayout";
import AdminLayout from "./components/AdminLayout";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Rules from "./pages/Rules";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import Vote from "./pages/user/Vote";
import Profile from "./pages/user/Profile";
import Requests from "./pages/user/Requests";
import Results from "./pages/user/Results";
import Notifications from "./pages/user/Notifications";
import History from "./pages/user/History";
import Activity from "./pages/user/Activity";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminContests from "./pages/admin/Contests";
import AdminResults from "./pages/admin/Results";
import AdminSettings from "./pages/admin/Settings";
import AdminLogs from "./pages/admin/Logs";
import ContestantRequests from "./pages/admin/ContestantRequests";
import ContestantsView from "./pages/admin/ContestantsView";

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Public Routes - No auto-navigation, user controls navigation
      { index: true, element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "about", element: <About /> },
      { path: "rules", element: <Rules /> },

      // User Routes - Protected, require valid user session
      {
        path: "user",
        element: (
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />
          },
          {
            path: "dashboard",
            element: <UserDashboard />
          },
          {
            path: "vote/:id?",
            element: <Vote />
          },
          {
            path: "voting/:id?",
            element: <Vote />
          },
          {
            path: "profile",
            element: <Profile />
          },
          {
            path: "requests",
            element: <Requests />
          },
          {
            path: "results/:id?",
            element: <Results />
          },
          {
            path: "notifications",
            element: <Notifications />
          },
          {
            path: "history",
            element: <History />
          },
          {
            path: "activity",
            element: <Activity />
          },
        ]
      },

      // Admin Routes - Protected, require admin role
      {
        path: "admin",
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: <AdminDashboard />
          },
          {
            path: "users",
            element: <AdminUsers />
          },
          {
            path: "contests",
            element: <AdminContests />
          },
          {
            path: "contestants",
            element: <ContestantsView />
          },
          {
            path: "contestant-requests",
            element: <ContestantRequests />
          },
          {
            path: "results",
            element: <AdminResults />
          },
          {
            path: "settings",
            element: <AdminSettings />
          },
          {
            path: "logs",
            element: <AdminLogs />
          },
        ]
      },
    ]
  }
]);

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
