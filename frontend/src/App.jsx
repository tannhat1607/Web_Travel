import { Navigate, Route, Routes } from "react-router-dom";
import { ClientLayout } from "./components/layout/ClientLayout.jsx";
import { AdminLayout } from "./components/layout/AdminLayout.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { HomePage } from "./pages/client/HomePage.jsx";
import { AboutPage } from "./pages/client/AboutPage.jsx";
import { ContactPage } from "./pages/client/ContactPage.jsx";
import { DestinationsPage } from "./pages/client/DestinationsPage.jsx";
import { TravelGuidesPage } from "./pages/client/TravelGuidesPage.jsx";
import { TourListPage } from "./pages/client/TourListPage.jsx";
import { TourDetailPage } from "./pages/client/TourDetailPage.jsx";
import { BookingPage } from "./pages/client/BookingPage.jsx";
import { MyBookingsPage } from "./pages/client/MyBookingsPage.jsx";
import { BookingDetailPage } from "./pages/client/BookingDetailPage.jsx";
import { NotificationsPage } from "./pages/client/NotificationsPage.jsx";
import { ProfilePage } from "./pages/client/ProfilePage.jsx";
import { LoginPage } from "./pages/client/LoginPage.jsx";
import { RegisterPage } from "./pages/client/RegisterPage.jsx";
import { DashboardPage } from "./pages/admin/DashboardPage.jsx";
import { TourManagePage } from "./pages/admin/TourManagePage.jsx";
import { BookingManagePage } from "./pages/admin/BookingManagePage.jsx";
import { UserManagePage } from "./pages/admin/UserManagePage.jsx";
import { PromotionManagePage } from "./pages/admin/PromotionManagePage.jsx";
import { KnowledgeManagePage } from "./pages/admin/KnowledgeManagePage.jsx";
import { ContactManagePage } from "./pages/admin/ContactManagePage.jsx";
import { ReviewManagePage } from "./pages/admin/ReviewManagePage.jsx";
import { ChatHistoryPage } from "./pages/admin/ChatHistoryPage.jsx";
import { ContentManagePage } from "./pages/admin/ContentManagePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/travel-guides" element={<TravelGuidesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tours" element={<TourListPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route
          path="/tours/:id/book"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/my-bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tours" element={<TourManagePage mode="manage" />} />
        <Route path="tours/new" element={<TourManagePage mode="create" />} />
        <Route path="bookings" element={<BookingManagePage />} />
        <Route path="promotions" element={<PromotionManagePage />} />
        <Route path="users" element={<UserManagePage />} />
        <Route path="reviews" element={<ReviewManagePage />} />
        <Route path="knowledge" element={<KnowledgeManagePage />} />
        <Route path="chats" element={<ChatHistoryPage />} />
        <Route path="contacts" element={<ContactManagePage />} />
        <Route path="content" element={<ContentManagePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
