import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
// import Dock from '../Dock/Dock';
import s from './MainPage.module.scss';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  avatarBorders?: string;
}

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // 🔹 Фронт-логика (мок вместо бэка)
    const mockUser: UserData = {
      firstName: 'Anton',
      lastName: 'GG',
      email: 'anton@example.com',
      avatar: '',
      avatarBorders: ''
    };

    setTimeout(() => {
      setUserData(mockUser);
    }, 500); // имитация загрузки
  }, [navigate]);

  if (!userData) {
    return <p>Загрузка...</p>;
  }

  return (
    <div className={s.sects}>
      <div className={s.section_2}>
        <div className={s.main}>
          <img
            className={`${userData.avatar ? s.pfp : s.defoltpfp} ${
              userData.avatarBorders ? s[userData.avatarBorders] : ''
            }`}
            src={userData.avatar || '/profileimg.png'}
            alt="profile"
          />

          <div className={s.info}>
            <h2 className={s.username}>
              <b>{userData.firstName} {userData.lastName}</b>
            </h2>

            <p>
              <b>Имя:</b> {userData.firstName || '—'}
            </p>

            <p>
              <b>Email:</b> {userData.email || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* <Dock /> */}
    </div>
  );
};

export default Profile;
