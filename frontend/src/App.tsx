import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Collection from './pages/Collection';
import Scanner from './pages/Scanner';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Create custom theme
const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 6,
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  colors: {
    // Custom blue shades similar to Cursor
    blue: [
      '#E6F7FF',
      '#BAE7FF',
      '#91D5FF',
      '#69C0FF',
      '#40A9FF',
      '#1890FF',
      '#096DD9',
      '#0050B3',
      '#003A8C',
      '#002766',
    ],
    // Dark theme colors
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          backgroundColor: '#1A1B1E',
          border: '1px solid #25262B',
        },
      },
    },
    Table: {
      styles: {
        root: {
          '& thead tr th': {
            backgroundColor: '#1A1B1E',
            borderBottom: '1px solid #25262B',
          },
          '& tbody tr td': {
            borderBottom: '1px solid #25262B',
          },
          '& tbody tr:hover': {
            backgroundColor: '#25262B',
          },
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

function App() {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
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
