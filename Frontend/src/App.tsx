import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Main from "./pages/Main/Main"
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Header from './Components/Header/Header'
import Footer from './Components/Footer/Footer'
import AiChat from './Components/Cognia/AiChat'
import AISimulation from './Components/Trai/AISimulation'
// import NewsHero from './Components/NewsHero/NewsHero'
import Profile from "./pages/Profile/Profile";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/AiChat' element={<AiChat/>}/>
        <Route path='/AISimulation' element={<AISimulation/>}/>
        {/* <Route path='/NewsHero' element={<NewsHero/>}/> */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
