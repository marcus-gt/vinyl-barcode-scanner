import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Collection from './pages/Collection';
import Scanner from './pages/Scanner';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/collection" replace />} />
              <Route
                path="collection"
                element={
                  <PrivateRoute>
                    <Collection />
                  </PrivateRoute>
                }
              />
              <Route
                path="scanner"
                element={
                  <PrivateRoute>
                    <Scanner />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
