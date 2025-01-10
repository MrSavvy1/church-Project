import React, { useState, useEffect } from 'react';
import { requestFCMToken } from './firebaseUtils';

const App = () => {
  const [fcmToken, setfcmToken] = useState(null);

  useEffect(() => {
    const fetchFCMToken = async () => {
      try {
        const token = await requestFCMToken();
        setToken(token);
        console.log(token)
      } catch (error) {
        console.error('Error fetching FCM token:', error);
      }
    };

    fetchFCMToken();
  }, []);

  return (
    <div>
      <h1>FCM Registration Token</h1>
      {token ? <p>{token}</p> : <p>Loading...</p>}
    </div>
  );
};

export default App;