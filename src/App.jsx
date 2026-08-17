import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Characters from './pages/Characters'
import Weapons from './pages/Weapons'
import Materials from './pages/Materials'

// 详情页与计算器较重,按需加载
const CharacterDetail = lazy(() => import('./pages/CharacterDetail'))
const Calculator = lazy(() => import('./pages/Calculator'))

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Suspense fallback={<div className="page-loading">加载中…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/character/:id" element={<CharacterDetail />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/weapons" element={<Weapons />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </HashRouter>
  )
}
