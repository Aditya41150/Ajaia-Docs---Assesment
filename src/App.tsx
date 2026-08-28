import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="doc/:id" element={<Editor />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  )
}

export default App
