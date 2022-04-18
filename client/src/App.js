import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Products from "./components/products/Products";
import ProductDetail from "./components/products/ProductDetail";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/UI/Navbar";
import Logout from "./components/auth/Logout";
import Cart from "./components/cart/Cart";
import { useSelector } from "react-redux";
import ModalLayout from "./components/UI/ModalLayout";
import Fetch from "./api/Fetch";
import Orders from "./components/orders/Orders";
import styles from "./App.module.css";
import Home from "./components/home/Home";
import About from "./components/home/About";
function App() {
  const modal = useSelector((state) => state.modal);
  const modalMessage = useSelector((state) => state.modalMessage);
  Fetch();

  return (
    <div className={styles.background}>
      <Router>
        <Navbar />
        {modal && <ModalLayout message={modalMessage} />}

        <Routes onChange={Fetch}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/shop" element={<Products />} />
          <Route path="/shop/filter/:category" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="logout" element={<Logout />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
