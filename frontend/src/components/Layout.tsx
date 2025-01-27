import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AppShell, Button, Group, Title } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Title order={1}>Vinyl Collection</Title>
          <Group>
            {user && (
              <>
                <Button variant="subtle" component={Link} to="/collection">
                  Collection
                </Button>
                <Button variant="subtle" component={Link} to="/scanner">
                  Scanner
                </Button>
                <Button variant="light" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main p="md">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout; 
