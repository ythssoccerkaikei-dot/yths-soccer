import React, { useState } from 'react';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (username === 'accounting' && password === 'password123') {
      setCurrentUser({ username: 'accounting' });
    } else {
      alert('ユーザー名またはパスワードが違います');
    }
  };

  if (!currentUser) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
        <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem', width: '100%', maxWidth: '28rem'}}>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem'}}>吉原工業サッカー部父母会</h1>
            <h2 style={{fontSize: '1.25rem', color: '#4b5563'}}>父母会費管理システム</h2>
          </div>
          
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem'}}>ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}}
              placeholder="ユーザー名を入力"
            />
          </div>
          
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem'}}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}}
              placeholder="パスワードを入力"
            />
          </div>
          
          <button
            onClick={handleLogin}
            style={{width: '100%', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer'}}
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f9fafb', padding: '2rem'}}>
      <div style={{maxWidth: '80rem', margin: '0 auto'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem'}}>✅ ビルド成功！</h1>
        <p>Viteでのビルドが正常に完了しました。</p>
      </div>
    </div>
  );
};

export default App;