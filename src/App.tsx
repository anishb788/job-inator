import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { OptimizerPage } from './components/optimizer/OptimizerPage'
import { LatexEditorPage } from './components/editor/LatexEditorPage'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<OptimizerPage />} />
            <Route path="/editor" element={<LatexEditorPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
