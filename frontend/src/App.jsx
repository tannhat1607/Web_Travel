import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ClientLayout } from "./components/layout/ClientLayout.jsx";
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
import { ForgotPasswordPage } from "./pages/client/ForgotPasswordPage.jsx";
import { RegisterPage } from "./pages/client/RegisterPage.jsx";

const lazyNamed = (loader, exportName) => lazy(() =>
  loader().then((module) => ({ default: module[exportName] })),
);

const AdminLayout = lazyNamed(() => import("./components/layout/AdminLayout.jsx"), "AdminLayout");
const DashboardPage = lazyNamed(() => import("./pages/admin/DashboardPage.jsx"), "DashboardPage");
const TourManagePage = lazyNamed(() => import("./pages/admin/TourManagePage.jsx"), "TourManagePage");
const BookingManagePage = lazyNamed(() => import("./pages/admin/BookingManagePage.jsx"), "BookingManagePage");
const UserManagePage = lazyNamed(() => import("./pages/admin/UserManagePage.jsx"), "UserManagePage");
const PromotionManagePage = lazyNamed(() => import("./pages/admin/PromotionManagePage.jsx"), "PromotionManagePage");
const KnowledgeManagePage = lazyNamed(() => import("./pages/admin/KnowledgeManagePage.jsx"), "KnowledgeManagePage");
const ContactManagePage = lazyNamed(() => import("./pages/admin/ContactManagePage.jsx"), "ContactManagePage");
const ReviewManagePage = lazyNamed(() => import("./pages/admin/ReviewManagePage.jsx"), "ReviewManagePage");
const ChatHistoryPage = lazyNamed(() => import("./pages/admin/ChatHistoryPage.jsx"), "ChatHistoryPage");
const ContentManagePage = lazyNamed(() => import("./pages/admin/ContentManagePage.jsx"), "ContentManagePage");

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
    </Suspense>
  );
}

function RouteFallback() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <span />
      <p>Đang tải trang...</p>
    </main>
  );
}
