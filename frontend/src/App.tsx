import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import { CustomersPage } from './app/routes/CustomersPage.js'
import { CustomerDetailsPage } from './app/routes/CustomerDetailsPage.js'
import { AdminPage } from './app/routes/AdminPage.js'
import { Toaster } from './components/ui/toaster.js'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </Provider>
  )
}

export default App
