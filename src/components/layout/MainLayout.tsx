import { Outlet } from 'react-router-dom'
import { Header } from '../common/Header'
import { Footer } from '../common/Footer'

export const MainLayout = () => {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
