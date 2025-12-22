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
import Don from './Components/Don/Don'
import PongNeon from './Components/PingPong/PingPong'
import Games from './pages/GamePage/Games'
import Minesweeper from './Components/MineSwiper/MineSwiper'
import Shop from './pages/Shop/Shop'
import AdminPanel from './pages/Admin/Admin'
import Doom from './Components/Asteroids/Asteroids'
import PrivilageCard from './Components/PrivilageCard/PrivilageCard'
import ChatComponent from './Components/ChatBox/Chat'
import Leaderboard from './pages/LeaderBoard/LeaderBoard'
import Wallet from './pages/Wallet/Wallet'
import PointsNotification from './Components/PointsNotification/PointsNotification'
import News from './pages/News/News'
import Achievements from './pages/Achievements/Achievements'

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
        <Route path='/News' element={<News/>}/>
        <Route path="/profile" element={<Profile />} />
        <Route path='/games' element={<Games/>}/>
        <Route path='/games/meteors' element={<Doom/>}/>
        <Route path='/games/Don'element={<Don/>}/>
        <Route path='/games/pingpong' element={<PongNeon/>}/>
        <Route path='/games/minesweeper' element={<Minesweeper/>}/>
        <Route path='/Shop' element={<Shop/>}/>
        <Route path='/shop/admin' element={<AdminPanel/>}/>
        <Route path='/PrivilageCard' element={<PrivilageCard title={''} description={''} limit={''} price={0}/>}/>
        <Route path='/Chat' element={<ChatComponent/>}/>
        <Route path='/Leaderboard' element={<Leaderboard/>}/>
        <Route path='/Friends' element={<ChatComponent/>}/>
        <Route path='/Wallet' element={<Wallet/>}/>
        <Route path='/Achievements' element={<Achievements/>}/>
      </Routes>
      <PointsNotification />
      <Footer />
    </BrowserRouter>
  )
}

export default App
