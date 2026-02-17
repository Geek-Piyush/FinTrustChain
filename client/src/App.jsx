import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LenderDashboard from "./pages/LenderDashboard";
import Verify from "./pages/Verify";
import Profile from "./pages/Profile";
import UpdateProfile from "./pages/UpdateProfile";
import LoanRequestForm from "./pages/LoanRequestForm";
import LoanBrochures from "./pages/LoanBrochures";
import CreateBrochure from "./pages/CreateBrochure";
import ContractViewer from "./pages/ContractViewer";
import ContractDetail from "./pages/ContractDetail";
import Payments from "./pages/Payments";
import PaymentStatus from "./pages/PaymentStatus";
import Notifications from "./pages/Notifications";
import Debts from "./pages/Debts";
import Support from "./pages/Support";
import AdminDashboard from "./pages/AdminDashboard";
import PremiumPlans from "./pages/PremiumPlans";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <Router>
      <Header />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/services" element={<Services />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Protected Routes grouped for brevity */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lender-dashboard" element={<LenderDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/create-loan" element={<LoanRequestForm />} />
          <Route path="/create-brochure" element={<CreateBrochure />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/contract-viewer/:id" element={<ContractViewer />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/premium" element={<PremiumPlans />} />
        </Route>

        {/* Public routes */}
        <Route path="/brochures" element={<LoanBrochures />} />
        <Route path="/payment-status" element={<PaymentStatus />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
