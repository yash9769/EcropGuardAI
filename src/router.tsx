import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

