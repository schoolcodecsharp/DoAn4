import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/ImmersiveHeader';
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import { AuthProvider, RequireLogin } from './context/AuthContext';
import CatalogPage from './pages/User/CatalogPage';
import DetailPage from './pages/User/DetailPage';
import BookingPage from './pages/User/BookingPage';
import AccountPage from './pages/User/AccountPage';
import RoomDetailPage from './pages/User/RoomDetailPage';
import ItineraryPage from './pages/User/ItineraryPage';
import ImageCreditsPage from './pages/User/ImageCreditsPage';
import './index.css';
import './pages/User/user.css';
import './experience.css';
import PageTransition from './components/PageTransition';
import AdminPage from './pages/Admin/AdminPage';

export default function App() {
  return <BrowserRouter><AuthProvider><Header /><PageTransition><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/admin/*" element={<RequireLogin><AdminPage /></RequireLogin>} />
    <Route path="/image-credits" element={<ImageCreditsPage />} />
    {(['tours', 'hotels', 'destinations', 'restaurants'] as const).map(kind => <Route key={kind} path={`/${kind}`} element={<CatalogPage key={kind} kind={kind} />} />)}
    {(['tours', 'hotels', 'destinations', 'restaurants'] as const).map(kind => <Route key={kind} path={`/${kind}/:id`} element={<DetailPage key={kind} kind={kind} />} />)}
    {(['tours', 'hotels'] as const).map(kind => <Route key={kind} path={`/${kind}/:id/book`} element={<RequireLogin><BookingPage key={kind} kind={kind} /></RequireLogin>} />)}
    <Route path="/planner" element={<RequireLogin><ItineraryPage /></RequireLogin>} />
    <Route path="/account" element={<RequireLogin><AccountPage /></RequireLogin>} />
    <Route path="/account/trips/:tripId" element={<RequireLogin><AccountPage /></RequireLogin>} />
    <Route path="/hotels/:id/rooms/:roomId" element={<RoomDetailPage />} />
    <Route path="/my-trips" element={<RequireLogin><AccountPage /></RequireLogin>} />
    <Route path="/saved" element={<Navigate to="/account" replace />} />
    <Route path="/favorites" element={<Navigate to="/account" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></PageTransition></AuthProvider></BrowserRouter>;
}
