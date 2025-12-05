const React = window.React;
const { useState, useEffect } = React;

// アイコンを絵文字で定義
const Calendar = () => <span style={{fontSize: '18px'}}>📅</span>;
const LogOut = () => <span style={{fontSize: '18px'}}>🚪</span>;
const Settings = () => <span style={{fontSize: '18px'}}>⚙️</span>;
const FileText = () => <span style={{fontSize: '18px'}}>📄</span>;
const ChevronDown = () => <span style={{fontSize: '16px'}}>▼</span>;
const ChevronUp = () => <span style={{fontSize: '16px'}}>▲</span>;
const Check = () => <span style={{fontSize: '18px'}}>✓</span>;
const Edit2 = () => <span style={{fontSize: '16px'}}>✏️</span>;
const Trash2 = () => <span style={{fontSize: '16px'}}>🗑️</span>;
const Plus = () => <span style={{fontSize: '18px'}}>➕</span>;
const Minus = () => <span style={{fontSize: '18px'}}>➖</span>;
const X = () => <span style={{fontSize: '16px'}}>✕</span>;
const Users = () => <span style={{fontSize: '18px'}}>👥</span>;

// 初期ユーザー設定
const INITIAL_USERS = {
  'accounting': { password: 'password123', name: '会計担当', role: 'accounting' }
};

// 初期会場リスト
const INITIAL_VENUES = [];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [attendances, setAttendances] = useState({});
  const [allAttendances, setAllAttendances] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateActivities, setDateActivities] = useState([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);
  const [fiscalYears, setFiscalYears] = useState({});
  const [statements, setStatements] = useState({});
  const [distances, setDistances] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [settingsTab, setSettingsTab] = useState('fiscal-years');
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([
    { id: 'membership-fee', name: '会費', color: 'blue' },
    { id: 'subsidy', name: '助成金', color: 'green' },
    { id: 'donation', name: '寄付', color: 'purple' },
    { id: 'other', name: 'その他収入', color: 'gray' }
  ]);
  const [expenseCategories, setExpenseCategories] = useState([
    { id: 'equipment', name: '用具費', color: 'orange' },
    { id: 'transportation', name: '交通費', color: 'blue' },
    { id: 'facility', name: '施設使用料', color: 'green' },
    { id: 'consumables', name: '消耗品', color: 'yellow' },
    { id: 'other', name: 'その他支出', color: 'gray' }
  ]);
  const [members, setMembers] = useState([]);
  const [membershipFees, setMembershipFees] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  // データ読み込み
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    
    // まずクリア
    setAttendances({});
    setAllAttendances({});
    
    if (currentUser.role === 'accounting') {
      // 会計担当の場合、全コーチのデータを読み込み
      console.log('会計担当として全コーチのデータを読み込み開始');
      const allData = {};
      const usernames = Object.keys(users);
      console.log('ユーザー一覧:', usernames);
      
      for (const username of usernames) {
        const user = users[username];
        console.log(`${username}をチェック: role=${user.role}`);
        if (user.role !== 'accounting') {
          const storageKey = `attendances:${username}`;
          let loadedData = null;
          
          // まずwindow.storageから試す
          try {
            console.log(`window.storageから読み込み: ${storageKey}`);
            const attResult = await window.storage.get(storageKey);
            if (attResult?.value) {
              loadedData = JSON.parse(attResult.value);
              console.log(`✓ window.storageから${username}のデータを読み込み:`, Object.keys(loadedData).length, '日分');
            }
          } catch (error) {
            console.log(`window.storage読み込みエラー:`, error);
          }
          
          // window.storageにない場合、localStorageから読み込み
          if (!loadedData) {
            try {
              console.log(`localStorageから読み込み: ${storageKey}`);
              const localData = localStorage.getItem(storageKey);
              if (localData) {
                loadedData = JSON.parse(localData);
                console.log(`✓ localStorageから${username}のデータを読み込み:`, Object.keys(loadedData).length, '日分');
              }
            } catch (error) {
              console.log(`localStorage読み込みエラー:`, error);
            }
          }
          
          if (loadedData) {
            allData[username] = loadedData;
          } else {
            console.log(`✗ ${username}の出席データはありません`);
          }
        }
      }
      console.log('読み込んだデータ:', allData);
      console.log('読み込んだユーザー数:', Object.keys(allData).length);
      setAllAttendances(allData);
      console.log('全コーチのデータを読み込み完了');
    } else {
      // コーチ・トレーナーの場合、自分のデータのみ
      const storageKey = `attendances:${currentUser.username}`;
      let loadedData = null;
      
      // まずwindow.storageから試す
      try {
        const attResult = await window.storage.get(storageKey);
        if (attResult?.value) {
          loadedData = JSON.parse(attResult.value);
          console.log(`window.storageから${currentUser.username}のデータを読み込み:`, Object.keys(loadedData).length, '日分');
        }
      } catch (error) {
        console.log('window.storage読み込みエラー:', error);
      }
      
      // window.storageにない場合、localStorageから読み込み
      if (!loadedData) {
        try {
          const localData = localStorage.getItem(storageKey);
          if (localData) {
            loadedData = JSON.parse(localData);
            console.log(`localStorageから${currentUser.username}のデータを読み込み:`, Object.keys(loadedData).length, '日分');
          }
        } catch (error) {
          console.log('localStorage読み込みエラー:', error);
        }
      }
      
      if (loadedData) {
        setAttendances(loadedData);
      } else {
        console.log(`${currentUser.username}の出席データはありません`);
      }
    }
  };

  const saveAttendances = async (data) => {
    try {
      if (currentUser.role === 'accounting') {
        return;
      }
      console.log(`${currentUser.username}の出席データを保存:`, Object.keys(data).length, '日分');
      
      // window.storageとlocalStorageの両方に保存
      try {
        await window.storage.set(`attendances:${currentUser.username}`, JSON.stringify(data));
      } catch (e) {
        console.log('window.storage保存失敗:', e.message);
      }
      
      // localStorageにも保存（フォールバック）
      localStorage.setItem(`attendances:${currentUser.username}`, JSON.stringify(data));
      console.log('localStorageに保存完了');
    } catch (error) {
      console.warn('ストレージへの保存に失敗:', error.message);
    }
  };

  // 会員データを保存
  const saveMembers = (data) => {
    try {
      localStorage.setItem('members', JSON.stringify(data));
    } catch (error) {
      console.warn('会員データの保存に失敗:', error);
    }
  };

  // 会費データを保存
  const saveMembershipFees = (data) => {
    try {
      localStorage.setItem('membershipFees', JSON.stringify(data));
    } catch (error) {
      console.warn('会費データの保存に失敗:', error);
    }
  };

  // 収入データを保存
  const saveIncomes = (data) => {
    try {
      localStorage.setItem('incomes', JSON.stringify(data));
    } catch (error) {
      console.warn('収入データの保存に失敗:', error);
    }
  };

  // 支出データを保存
  const saveExpenses = (data) => {
    try {
      localStorage.setItem('expenses', JSON.stringify(data));
    } catch (error) {
      console.warn('支出データの保存に失敗:', error);
    }
  };

  // ユーザーデータを保存
  const saveUsers = (data) => {
    try {
      localStorage.setItem('users', JSON.stringify(data));
    } catch (error) {
      console.warn('ユーザーデータの保存に失敗:', error);
    }
  };

  // 会場データを保存
  const saveVenues = (data) => {
    try {
      localStorage.setItem('venues', JSON.stringify(data));
    } catch (error) {
      console.warn('会場データの保存に失敗:', error);
    }
  };

  // 年度データを保存
  const saveFiscalYears = (data) => {
    try {
      localStorage.setItem('fiscalYears', JSON.stringify(data));
    } catch (error) {
      console.warn('年度データの保存に失敗:', error);
    }
  };

  // 距離データを保存
  const saveDistances = (data) => {
    try {
      localStorage.setItem('distances', JSON.stringify(data));
    } catch (error) {
      console.warn('距離データの保存に失敗:', error);
    }
  };

  // カテゴリーデータを保存
  const saveCategories = () => {
    try {
      localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
      localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    } catch (error) {
      console.warn('カテゴリーデータの保存に失敗:', error);
    }
  };


  // カレンダー生成
  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    let week = new Array(7).fill(null);
    
    for (let i = 0; i < startDayOfWeek; i++) {
      week[i] = null;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (startDayOfWeek + day - 1) % 7;
      week[dayOfWeek] = day;
      
      if (dayOfWeek === 6 || day === daysInMonth) {
        calendar.push([...week]);
        week = new Array(7).fill(null);
      }
    }
    
    return calendar;
  };

  // 日付をクリックして詳細入力
  const openDateDialog = (dateStr) => {
    setSelectedDate(dateStr);
    const activities = attendances[dateStr] || [];
    setDateActivities(activities.length > 0 ? activities : [{ id: Date.now(), type: 'practice', venue: '学校', etc: 0 }]);
  };

  // 活動を追加
  const addActivity = () => {
    setDateActivities([...dateActivities, { id: Date.now(), type: 'practice', venue: '学校', etc: 0 }]);
  };

  // 活動を更新
  const updateActivity = (id, field, value) => {
    setDateActivities(dateActivities.map(act => 
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  // 活動を削除
  const deleteActivity = (id) => {
    setDateActivities(dateActivities.filter(act => act.id !== id));
  };

  // 日付の活動を保存
  const saveDateActivities = () => {
    if (currentUser.role === 'accounting') return;
    
    const newAttendances = { ...attendances, [selectedDate]: dateActivities };
    setAttendances(newAttendances);
    saveAttendances(newAttendances);
    setSelectedDate(null);
  };

  // 年度の月リストを取得
  const getFiscalYearMonths = () => {
    const year = fiscalYears[selectedFiscalYear];
    if (!year) return [];
    
    const months = [];
    let currentYear = year.startYear;
    let currentMonth = year.startMonth;
    
    while (true) {
      months.push({
        year: currentYear,
        month: currentMonth,
        label: `${currentYear}年${currentMonth + 1}月`
      });
      
      if (currentYear === year.endYear && currentMonth === year.endMonth) {
        break;
      }
      
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    
    return months;
  };

  // 明細を計算
  const calculateStatement = (username, year, month) => {
    const user = users[username];
    if (!user) {
      console.log(`calculateStatement: ユーザー ${username} が見つかりません`);
      return null;
    }

    // 会計担当の場合はallAttendances、コーチ本人の場合はattendancesを使用
    const userAttendances = currentUser?.role === 'accounting' 
      ? (allAttendances[username] || {})
      : attendances;

    console.log(`calculateStatement: ${username}の${year}年${month+1}月を計算`, {
      isAccounting: currentUser?.role === 'accounting',
      hasAllAttendances: Object.keys(allAttendances).length > 0,
      userAttendancesKeys: Object.keys(userAttendances).length
    });

    const details = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayActivities = userAttendances[dateStr] || [];

      dayActivities.forEach(activity => {
        const rate = user.rates[activity.type] || 0;
        // コーチ別の距離を取得
        const distanceKey = `${username}:${activity.venue}`;
        const distance = distances[distanceKey] || 0;
        const transportCost = distance * 20;
        const etc = activity.etc || 0;
        const total = rate + transportCost + etc;

        details.push({
          date: dateStr,
          type: activity.type,
          venue: activity.venue,
          rate,
          distance,
          transportCost,
          etc,
          total
        });
      });
    }

    const summary = {
      totalRate: details.reduce((sum, d) => sum + d.rate, 0),
      totalTransport: details.reduce((sum, d) => sum + d.transportCost, 0),
      totalETC: details.reduce((sum, d) => sum + d.etc, 0),
      grandTotal: details.reduce((sum, d) => sum + d.total, 0)
    };

    return { details, summary };
  };

  // ステータス情報を取得
  const getStatusInfo = (status) => {
    const statusMap = {
      'empty': { label: '未入力', color: 'bg-gray-100 text-gray-800' },
      'in_progress': { label: '入力中', color: 'bg-orange-100 text-orange-800' },
      'input_completed': { label: '入力完了', color: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: '作成完了', color: 'bg-blue-100 text-blue-800' },
      'confirmed': { label: '確認済み', color: 'bg-green-100 text-green-800' },
      'paid': { label: '支払済み', color: 'bg-purple-100 text-purple-800' }
    };
    return statusMap[status] || statusMap['empty'];
  };

  // 年度のメンバーを取得
  const getFiscalYearMembers = () => {
    const year = fiscalYears[selectedFiscalYear];
    return year?.members || [];
  };

  // 明細を作成完了にする
  const completeStatement = (username, monthKey) => {
    const statementKey = `${username}:${monthKey}`;
    const [year, month] = monthKey.split('-');
    const statementData = calculateStatement(username, parseInt(year), parseInt(month) - 1);
    
    const newStatements = {
      ...statements,
      [statementKey]: {
        status: 'completed',
        data: statementData,
        completedAt: new Date().toISOString()
      }
    };
    setStatements(newStatements);
  };

  // 明細を確認済みにする
  const confirmStatement = (username, monthKey) => {
    const statementKey = `${username}:${monthKey}`;
    const newStatements = {
      ...statements,
      [statementKey]: {
        ...statements[statementKey],
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      }
    };
    setStatements(newStatements);
  };

  // 明細を支払済みにする
  const markAsPaid = (username, monthKey) => {
    const statementKey = `${username}:${monthKey}`;
    const newStatements = {
      ...statements,
      [statementKey]: {
        ...statements[statementKey],
        status: 'paid',
        paidAt: new Date().toISOString()
      }
    };
    setStatements(newStatements);
  };

  const handleLogin = () => {
    const user = users[username];
    if (user && user.password === password) {
      setCurrentUser({ username, ...user });
      if (user.role === 'accounting') {
        setCurrentView('accounting');
      } else {
        setCurrentView('calendar');
      }
      setLoginError('');
      setUsername('');
      setPassword('');
    } else {
      setLoginError('ユーザー名またはパスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAttendances({});
    setCurrentView('calendar');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">吉原工業サッカー部父母会</h1>
            <h2 className="text-lg sm:text-xl text-gray-600">父母会費管理システム</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calendar = generateCalendar(selectedYear, selectedMonth);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 whitespace-nowrap">吉原工業サッカー部父母会</h1>
              {currentUser.role !== 'accounting' ? (
                <>
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">出席入力</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">明細確認</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView('accounting')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-base ${
                      currentView === 'accounting' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">明細管理</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('membership-fees')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-base ${
                      currentView === 'membership-fees' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">会費</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('incomes')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-base ${
                      currentView === 'incomes' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">収入</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('expenses')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-base ${
                      currentView === 'expenses' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">支出</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('settings')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-base ${
                      currentView === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">設定</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{currentUser.name}</span>
              <button
                onClick={() => {
                  console.log('パスワード変更ボタンがクリックされました');
                  setShowPasswordModal(true);
                  setPasswordForm({ current: '', new: '', confirm: '' });
                }}
                className="flex items-center gap-1 px-2 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm hidden lg:inline">パスワード変更</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm hidden lg:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* カレンダー入力画面 */}
        {currentView === 'calendar' && currentUser.role !== 'accounting' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">出席入力カレンダー</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedYear(selectedYear - 1);
                        setSelectedMonth(11);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    前月
                  </button>
                  <span className="text-lg font-medium">
                    {selectedYear}年{selectedMonth + 1}月
                  </span>
                  <button
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedYear(selectedYear + 1);
                        setSelectedMonth(0);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    次月
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
                const statementKey = `${currentUser.username}:${monthKey}`;
                const statement = statements[statementKey];
                const status = statement?.status || 'empty';
                const isCompleted = status === 'input_completed' || status === 'completed' || status === 'confirmed' || status === 'paid';
                
                return (
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {isCompleted ? (
                        <span className="text-green-600 font-medium">✓ この月の入力は完了しています</span>
                      ) : (
                        <span>今月の入力が完了したら「入力完了」ボタンを押してください</span>
                      )}
                    </div>
                    {isCompleted ? (
                      <div className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-medium border-2 border-green-300">
                        入力完了済み
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const newStatements = {
                            ...statements,
                            [statementKey]: {
                              ...statements[statementKey],
                              status: 'input_completed',
                              inputCompletedAt: new Date().toISOString()
                            }
                          };
                          setStatements(newStatements);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        入力完了
                      </button>
                    )}
                  </div>
                );
              })()}
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendar.map((week, weekIdx) => (
                  <React.Fragment key={weekIdx}>
                    {week.map((day, dayIdx) => {
                      if (!day) {
                        return <div key={`${weekIdx}-${dayIdx}`} className="h-24 bg-gray-50 rounded-lg"></div>;
                      }

                      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayActivities = attendances[dateStr] || [];
                      const isWeekend = dayIdx === 0 || dayIdx === 6;

                      return (
                        <div
                          key={`${weekIdx}-${dayIdx}`}
                          onClick={() => openDateDialog(dateStr)}
                          className={`h-24 border-2 rounded-lg p-2 cursor-pointer hover:border-blue-400 transition-colors ${
                            isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="font-semibold text-sm mb-1">{day}</div>
                          <div className="space-y-1">
                            {dayActivities.map((act, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded truncate ${
                                  act.type === 'practice' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {act.type === 'practice' ? '練' : '試'} {act.venue}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* その他の画面（仮） */}
        {currentView === 'dashboard' && currentUser.role !== 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">明細確認</h2>
                    <p className="text-sm text-gray-600 mt-1">会計担当が作成した明細を確認してください</p>
                  </div>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">使い方</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>カレンダーで出席を入力</li>
                    <li>入力が完了したら「入力完了」ボタンを押す</li>
                    <li>会計担当が明細を作成すると、ここに表示されます</li>
                    <li>明細を確認してください</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  {getFiscalYearMonths().map(m => {
                    const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                    const statementKey = `${currentUser.username}:${monthKey}`;
                    const statement = statements[statementKey];
                    const status = statement?.status || 'empty';
                    const statusInfo = getStatusInfo(status);
                    
                    // 作成完了または確認済みの明細のみ表示
                    if (status !== 'completed' && status !== 'confirmed') {
                      return null;
                    }

                    const statementData = statement?.data || calculateStatement(currentUser.username, m.year, m.month);
                    if (!statementData || statementData.details.length === 0) {
                      return null;
                    }

                    return (
                      <div key={monthKey} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedMonths({
                            ...expandedMonths,
                            [monthKey]: !expandedMonths[monthKey]
                          })}
                          className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                        >
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-800">{m.label}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-2xl font-bold text-purple-600">
                              ¥{statementData.summary.grandTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {status === 'completed' && (
                              <span className="text-sm text-gray-600 mr-2">クリックして確認</span>
                            )}
                            {expandedMonths[monthKey] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                          </div>
                        </button>

                        {expandedMonths[monthKey] && (
                          <div className="p-6 bg-white">
                            <div className="overflow-x-auto mb-6">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種類</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会場</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">報酬</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">距離</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">交通費</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ETC</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合計</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {statementData.details.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {new Date(detail.date).toLocaleDateString('ja-JP', {month: 'numeric', day: 'numeric'})}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          detail.type === 'practice' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-orange-100 text-orange-800'
                                        }`}>
                                          {detail.type === 'practice' ? '練習' : '試合'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">{detail.venue}</td>
                                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                                        ¥{detail.rate.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                                        {detail.distance}km
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                                        ¥{detail.transportCost.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                                        {detail.etc > 0 ? `¥${detail.etc.toLocaleString()}` : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        ¥{detail.total.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="border-t-2 border-gray-300 pt-6">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <div className="text-sm text-gray-600 mb-1">報酬合計</div>
                                  <div className="text-2xl font-bold text-blue-600">
                                    ¥{statementData.summary.totalRate.toLocaleString()}
                                  </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                  <div className="text-sm text-gray-600 mb-1">交通費合計</div>
                                  <div className="text-2xl font-bold text-green-600">
                                    ¥{statementData.summary.totalTransport.toLocaleString()}
                                  </div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4">
                                  <div className="text-sm text-gray-600 mb-1">ETC合計</div>
                                  <div className="text-2xl font-bold text-yellow-600">
                                    ¥{statementData.summary.totalETC.toLocaleString()}
                                  </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                  <div className="text-sm text-gray-600 mb-1">総支給額</div>
                                  <div className="text-2xl font-bold text-purple-600">
                                    ¥{statementData.summary.grandTotal.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {status === 'completed' && (
                              <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-600">
                                    明細の内容を確認したら「確認しました」ボタンを押してください
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newStatements = {
                                        ...statements,
                                        [statementKey]: {
                                          ...statements[statementKey],
                                          status: 'confirmed',
                                          confirmedAt: new Date().toISOString()
                                        }
                                      };
                                      setStatements(newStatements);
                                    }}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                  >
                                    確認しました
                                  </button>
                                </div>
                              </div>
                            )}

                            {status === 'confirmed' && (
                              <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-green-600 font-medium">
                                  <Check size={24} />
                                  <span>確認済み - 支払い待ち</span>
                                </div>
                              </div>
                            )}

                            {status === 'paid' && (
                              <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-purple-600 font-medium">
                                  <Check size={24} />
                                  <span>支払済み</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 text-center text-gray-500 text-sm">
                  会計担当が明細を作成すると、ここに表示されます
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 会費記録画面 */}
        {currentView === 'membership-fees' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">会費記録</h2>
                    <p className="text-sm text-gray-600 mt-1">会員の月別会費入金状況を管理します</p>
                  </div>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {members.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">会員が登録されていません</p>
                    <p className="text-sm">設定 → 会員管理 から会員を登録してください</p>
                  </div>
                ) : (
                  <>
                    {/* 月別会費表 */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left sticky left-0 bg-gray-100 z-10">氏名</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">学年</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">月額</th>
                            {getFiscalYearMonths().map(m => (
                              <th key={`${m.year}-${m.month}`} className="border border-gray-300 px-3 py-2 text-center text-sm whitespace-nowrap">
                                {m.month + 1}月
                              </th>
                            ))}
                            <th className="border border-gray-300 px-4 py-2 text-right">合計</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members
                            .filter(m => m.active && m.fiscalYear === selectedFiscalYear)
                            .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name))
                            .map(member => {
                              const months = getFiscalYearMonths();
                              let totalPaid = 0;
                              
                              return (
                                <tr key={member.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 font-medium sticky left-0 bg-white">
                                    {member.name}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {member.grade}年
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-right">
                                    ¥{member.monthlyFee.toLocaleString()}
                                  </td>
                                  {months.map(m => {
                                    const monthKey = `${member.id}:${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                    const isPaid = membershipFees[monthKey] || false;
                                    if (isPaid) totalPaid += member.monthlyFee;
                                    
                                    return (
                                      <td key={`${m.year}-${m.month}`} className="border border-gray-300 px-3 py-2 text-center">
                                        <button
                                          onClick={() => {
                                            const newFees = { ...membershipFees };
                                            newFees[monthKey] = !isPaid;
                                            setMembershipFees(newFees);
                                          }}
                                          className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                                            isPaid
                                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                          }`}
                                        >
                                          {isPaid ? '✓' : ''}
                                        </button>
                                      </td>
                                    );
                                  })}
                                  <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">
                                    ¥{totalPaid.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          
                          {/* 合計行 */}
                          <tr className="bg-blue-50 font-bold">
                            <td className="border border-gray-300 px-4 py-2 sticky left-0 bg-blue-50" colSpan="3">
                              月別合計
                            </td>
                            {getFiscalYearMonths().map(m => {
                              const monthTotal = members
                                .filter(member => member.active)
                                .reduce((sum, member) => {
                                  const monthKey = `${member.id}:${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                  return sum + (membershipFees[monthKey] ? member.monthlyFee : 0);
                                }, 0);
                              
                              return (
                                <td key={`${m.year}-${m.month}`} className="border border-gray-300 px-3 py-2 text-center text-sm text-blue-700">
                                  ¥{monthTotal.toLocaleString()}
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 px-4 py-2 text-right text-blue-700">
                              ¥{members
                                .filter(member => member.active)
                                .reduce((sum, member) => {
                                  return sum + getFiscalYearMonths().reduce((monthSum, m) => {
                                    const monthKey = `${member.id}:${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                    return monthSum + (membershipFees[monthKey] ? member.monthlyFee : 0);
                                  }, 0);
                                }, 0)
                                .toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 各月のボタンをクリックして入金済み/未入金を切り替えます</li>
                        <li>• 緑色のチェックマークが入金済みを示します</li>
                        <li>• 最下行に月別の合計金額が表示されます</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 収入記録画面 */}
        {currentView === 'incomes' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">収入記録</h2>
                    <p className="text-sm text-gray-600 mt-1">会費や助成金などの収入を記録します</p>
                  </div>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {/* 収入入力フォーム */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">新規収入を記録</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                      <input
                        type="date"
                        id="income-date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                      <select
                        id="income-category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {incomeCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">金額（円）</label>
                      <input
                        type="number"
                        id="income-amount"
                        placeholder="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">摘要</label>
                      <input
                        type="text"
                        id="income-description"
                        placeholder="詳細を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const date = document.getElementById('income-date').value;
                          const categoryId = document.getElementById('income-category').value;
                          const amount = parseInt(document.getElementById('income-amount').value);
                          const description = document.getElementById('income-description').value.trim();

                          if (!date) {
                            alert('日付を入力してください');
                            return;
                          }
                          if (!amount || amount <= 0) {
                            alert('金額を入力してください');
                            return;
                          }

                          const category = incomeCategories.find(c => c.id === categoryId);
                          const newIncome = {
                            id: Date.now(),
                            date: date,
                            categoryId: categoryId,
                            categoryName: category?.name || '',
                            categoryColor: category?.color || 'green',
                            amount: amount,
                            description: description,
                            fiscalYear: selectedFiscalYear,
                            createdAt: new Date().toISOString()
                          };

                          setIncomes([...incomes, newIncome]);
                          
                          // フォームをリセット
                          document.getElementById('income-amount').value = '';
                          document.getElementById('income-description').value = '';
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        記録
                      </button>
                    </div>
                  </div>
                </div>

                {/* カテゴリー別集計 */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {fiscalYears[selectedFiscalYear]?.name} カテゴリー別集計
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const fiscalIncomes = incomes.filter(i => i.fiscalYear === selectedFiscalYear);
                      const categoryTotals = {};
                      
                      fiscalIncomes.forEach(income => {
                        if (!categoryTotals[income.categoryId]) {
                          categoryTotals[income.categoryId] = {
                            name: income.categoryName,
                            color: income.categoryColor,
                            total: 0
                          };
                        }
                        categoryTotals[income.categoryId].total += income.amount;
                      });

                      const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

                      return (
                        <>
                          {Object.values(categoryTotals).map(cat => (
                            <div key={cat.name} className={`bg-${cat.color}-50 rounded-lg p-4`}>
                              <div className="text-sm text-gray-600 mb-1">{cat.name}</div>
                              <div className={`text-2xl font-bold text-${cat.color}-600`}>
                                ¥{cat.total.toLocaleString()}
                              </div>
                            </div>
                          ))}
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">合計</div>
                            <div className="text-2xl font-bold text-purple-600">
                              ¥{total.toLocaleString()}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 収入一覧 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">収入一覧</h3>
                  {(() => {
                    const fiscalIncomes = incomes
                      .filter(i => i.fiscalYear === selectedFiscalYear)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (fiscalIncomes.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          収入が記録されていません
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {fiscalIncomes.map(income => (
                          <div key={income.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {new Date(income.date).toLocaleDateString('ja-JP')}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${income.categoryColor}-100 text-${income.categoryColor}-800`}>
                                  {income.categoryName}
                                </span>
                                {income.description && (
                                  <span className="text-sm text-gray-600">{income.description}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-green-600">
                                ¥{income.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm('この収入記録を削除してもよろしいですか？')) {
                                    setIncomes(incomes.filter(i => i.id !== income.id));
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 支出記録画面 */}
        {currentView === 'expenses' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">支出記録</h2>
                    <p className="text-sm text-gray-600 mt-1">用具費や施設使用料などの支出を記録します</p>
                  </div>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {/* 支出入力フォーム */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">新規支出を記録</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                      <input
                        type="date"
                        id="expense-date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                      <select
                        id="expense-category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">金額（円）</label>
                      <input
                        type="number"
                        id="expense-amount"
                        placeholder="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">摘要</label>
                      <input
                        type="text"
                        id="expense-description"
                        placeholder="詳細を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const date = document.getElementById('expense-date').value;
                          const categoryId = document.getElementById('expense-category').value;
                          const amount = parseInt(document.getElementById('expense-amount').value);
                          const description = document.getElementById('expense-description').value.trim();

                          if (!date) {
                            alert('日付を入力してください');
                            return;
                          }
                          if (!amount || amount <= 0) {
                            alert('金額を入力してください');
                            return;
                          }

                          const category = expenseCategories.find(c => c.id === categoryId);
                          const newExpense = {
                            id: Date.now(),
                            date: date,
                            categoryId: categoryId,
                            categoryName: category?.name || '',
                            categoryColor: category?.color || 'orange',
                            amount: amount,
                            description: description,
                            fiscalYear: selectedFiscalYear,
                            createdAt: new Date().toISOString()
                          };

                          setExpenses([...expenses, newExpense]);
                          
                          // フォームをリセット
                          document.getElementById('expense-amount').value = '';
                          document.getElementById('expense-description').value = '';
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        記録
                      </button>
                    </div>
                  </div>
                </div>

                {/* カテゴリー別集計 */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {fiscalYears[selectedFiscalYear]?.name} カテゴリー別集計
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const fiscalExpenses = expenses.filter(e => e.fiscalYear === selectedFiscalYear);
                      const categoryTotals = {};
                      
                      fiscalExpenses.forEach(expense => {
                        if (!categoryTotals[expense.categoryId]) {
                          categoryTotals[expense.categoryId] = {
                            name: expense.categoryName,
                            color: expense.categoryColor,
                            total: 0
                          };
                        }
                        categoryTotals[expense.categoryId].total += expense.amount;
                      });

                      const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

                      return (
                        <>
                          {Object.values(categoryTotals).map(cat => (
                            <div key={cat.name} className={`bg-${cat.color}-50 rounded-lg p-4`}>
                              <div className="text-sm text-gray-600 mb-1">{cat.name}</div>
                              <div className={`text-2xl font-bold text-${cat.color}-600`}>
                                ¥{cat.total.toLocaleString()}
                              </div>
                            </div>
                          ))}
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">合計</div>
                            <div className="text-2xl font-bold text-purple-600">
                              ¥{total.toLocaleString()}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 支出一覧 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">支出一覧</h3>
                  {(() => {
                    const fiscalExpenses = expenses
                      .filter(e => e.fiscalYear === selectedFiscalYear)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (fiscalExpenses.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          支出が記録されていません
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {fiscalExpenses.map(expense => (
                          <div key={expense.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {new Date(expense.date).toLocaleDateString('ja-JP')}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${expense.categoryColor}-100 text-${expense.categoryColor}-800`}>
                                  {expense.categoryName}
                                </span>
                                {expense.description && (
                                  <span className="text-sm text-gray-600">{expense.description}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-red-600">
                                ¥{expense.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm('この支出記録を削除してもよろしいですか？')) {
                                    setExpenses(expenses.filter(e => e.id !== expense.id));
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 支払処理画面 */}

        {currentView !== 'calendar' && currentView !== 'dashboard' && currentView !== 'incomes' && currentView !== 'expenses' && currentView !== 'membership-fees' && (
        <div className="bg-white rounded-lg shadow">
          {currentUser.role === 'accounting' && currentView === 'settings' ? (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">設定</h2>
                <p className="text-sm text-gray-600 mt-1">システムの各種設定を管理します</p>
              </div>

              {/* タブナビゲーション */}
              <div className="border-b border-gray-200">
                <div className="flex gap-2 px-6">
                  <button
                    onClick={() => setSettingsTab('fiscal-years')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'fiscal-years'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setSettingsTab('users')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setSettingsTab('venues')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'venues'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setSettingsTab('distances')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'distances'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    距離設定
                  </button>
                  <button
                    onClick={() => setSettingsTab('categories')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'categories'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    カテゴリー管理
                  </button>
                  <button
                    onClick={() => setSettingsTab('members')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      settingsTab === 'members'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    会員管理
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* 年度管理タブ */}
                {settingsTab === 'fiscal-years' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">年度管理</h3>
                    
                    {/* 年度追加フォーム */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">年度を追加</h4>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <input
                          type="text"
                          placeholder="年度名（例：2024年度）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-fiscal-year-name"
                        />
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-fiscal-year-start-year"
                        >
                          <option value="">開始年</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                            <option key={year} value={year}>{year}年</option>
                          ))}
                        </select>
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-fiscal-year-start-month"
                        >
                          <option value="">開始月</option>
                          {Array.from({ length: 12 }, (_, i) => i).map(month => (
                            <option key={month} value={month}>{month + 1}月</option>
                          ))}
                        </select>
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-fiscal-year-end-year"
                        >
                          <option value="">終了年</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                            <option key={year} value={year}>{year}年</option>
                          ))}
                        </select>
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-fiscal-year-end-month"
                        >
                          <option value="">終了月</option>
                          {Array.from({ length: 12 }, (_, i) => i).map(month => (
                            <option key={month} value={month}>{month + 1}月</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const name = document.getElementById('new-fiscal-year-name').value;
                            const startYear = document.getElementById('new-fiscal-year-start-year').value;
                            const startMonth = document.getElementById('new-fiscal-year-start-month').value;
                            const endYear = document.getElementById('new-fiscal-year-end-year').value;
                            const endMonth = document.getElementById('new-fiscal-year-end-month').value;
                            
                            if (name && startYear && startMonth !== '' && endYear && endMonth !== '') {
                              const id = Date.now().toString();
                              
                              const newFiscalYears = {
                                ...fiscalYears,
                                [id]: {
                                  id,
                                  name,
                                  startYear: parseInt(startYear),
                                  startMonth: parseInt(startMonth),
                                  endYear: parseInt(endYear),
                                  endMonth: parseInt(endMonth),
                                  members: []
                                }
                              };
                              setFiscalYears(newFiscalYears);
                              saveFiscalYears(newFiscalYears);
                              
                              // フォームをクリア
                              document.getElementById('new-fiscal-year-name').value = '';
                              document.getElementById('new-fiscal-year-start-year').value = '';
                              document.getElementById('new-fiscal-year-start-month').value = '';
                              document.getElementById('new-fiscal-year-end-year').value = '';
                              document.getElementById('new-fiscal-year-end-month').value = '';
                            } else {
                              alert('すべての項目を入力してください');
                            }
                          }}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.values(fiscalYears).map(year => (
                        <div key={year.id} className="border-2 border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-800">{year.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {year.startYear}年{year.startMonth + 1}月 〜 {year.endYear}年{year.endMonth + 1}月
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`${year.name}を削除してもよろしいですか？\nこの年度に関連する収入・支出データも削除されます。`)) {
                                  const newFiscalYears = { ...fiscalYears };
                                  delete newFiscalYears[year.id];
                                  setFiscalYears(newFiscalYears);
                                  saveFiscalYears(newFiscalYears);
                                  
                                  // 関連データも削除
                                  const newIncomes = incomes.filter(i => i.fiscalYear !== year.id);
                                  setIncomes(newIncomes);
                                  saveIncomes(newIncomes);
                                  
                                  const newExpenses = expenses.filter(e => e.fiscalYear !== year.id);
                                  setExpenses(newExpenses);
                                  saveExpenses(newExpenses);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">メンバー管理</h5>
                            
                            {/* 現在のメンバー */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {year.members.map(username => (
                                <div key={username} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                  <span>{users[username]?.name || username}</span>
                                  <button
                                    onClick={() => {
                                      const newFiscalYears = { ...fiscalYears };
                                      newFiscalYears[year.id].members = newFiscalYears[year.id].members.filter(m => m !== username);
                                      setFiscalYears(newFiscalYears);
                                      saveFiscalYears(newFiscalYears);
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              {year.members.length === 0 && (
                                <span className="text-sm text-gray-500">メンバーが登録されていません</span>
                              )}
                            </div>
                            
                            {/* メンバー追加 */}
                            <div className="flex gap-2">
                              <select
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                id={`add-member-${year.id}`}
                              >
                                <option value="">メンバーを選択</option>
                                {Object.entries(users)
                                  .filter(([username, user]) => 
                                    user.role !== 'accounting' && !year.members.includes(username)
                                  )
                                  .map(([username, user]) => (
                                    <option key={username} value={username}>
                                      {user.name}
                                    </option>
                                  ))
                                }
                              </select>
                              <button
                                onClick={() => {
                                  const select = document.getElementById(`add-member-${year.id}`);
                                  const username = select.value;
                                  if (username) {
                                    const newFiscalYears = { ...fiscalYears };
                                    if (!newFiscalYears[year.id].members.includes(username)) {
                                      newFiscalYears[year.id].members = [...newFiscalYears[year.id].members, username];
                                      setFiscalYears(newFiscalYears);
                                      saveFiscalYears(newFiscalYears);
                                      select.value = '';
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                追加
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 年度にメンバー（コーチ・トレーナー）を追加してください</li>
                        <li>• メンバーに登録されたユーザーが、明細管理や距離設定に表示されます</li>
                        <li>• メンバーを削除すると、その年度の明細管理から非表示になります</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ユーザー管理タブ */}
                {settingsTab === 'users' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザー管理</h3>
                    
                    {/* ユーザー追加フォーム */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">ユーザーを追加</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="ユーザー名（例: yamada）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-username"
                        />
                        <input
                          type="text"
                          placeholder="表示名（例: 山田コーチ）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-name"
                        />
                        <input
                          type="password"
                          placeholder="パスワード"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-password"
                        />
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-role"
                        >
                          <option value="coach">コーチ</option>
                          <option value="trainer">トレーナー</option>
                          <option value="accounting">会計担当</option>
                        </select>
                        <input
                          type="number"
                          placeholder="練習報酬（円）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-practice-rate"
                          defaultValue="3000"
                        />
                        <input
                          type="number"
                          placeholder="試合報酬（円）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-user-game-rate"
                          defaultValue="4000"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const username = document.getElementById('new-user-username').value.trim();
                          const name = document.getElementById('new-user-name').value.trim();
                          const password = document.getElementById('new-user-password').value;
                          const role = document.getElementById('new-user-role').value;
                          const practiceRate = parseInt(document.getElementById('new-user-practice-rate').value) || 3000;
                          const gameRate = parseInt(document.getElementById('new-user-game-rate').value) || 4000;
                          
                          if (!username || !name || !password) {
                            alert('すべての項目を入力してください');
                            return;
                          }
                          
                          if (users[username]) {
                            alert('このユーザー名は既に使用されています');
                            return;
                          }
                          
                          const newUser = {
                            name,
                            password,
                            role,
                            rates: { practice: practiceRate, game: gameRate }
                          };
                          
                          setUsers({ ...users, [username]: newUser });
                          
                          // フォームをクリア
                          document.getElementById('new-user-username').value = '';
                          document.getElementById('new-user-name').value = '';
                          document.getElementById('new-user-password').value = '';
                          document.getElementById('new-user-practice-rate').value = '3000';
                          document.getElementById('new-user-game-rate').value = '4000';
                          
                          alert(`${name}を追加しました`);
                        }}
                        className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        ユーザーを追加
                      </button>
                    </div>

                    {/* ユーザー一覧 */}
                    <div className="space-y-3">
                      {Object.entries(users).map(([username, user]) => (
                        <div key={username} className="border-2 border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{user.name}</h4>
                              <p className="text-sm text-gray-600">
                                ID: {username} - {user.role === 'accounting' ? '会計担当' : user.role === 'coach' ? 'コーチ' : 'トレーナー'}
                              </p>
                              {user.rates && (
                                <div className="mt-2 flex gap-4 text-sm">
                                  <span className="text-gray-600">
                                    練習: <span className="font-medium text-gray-800">¥{user.rates.practice.toLocaleString()}</span>
                                  </span>
                                  <span className="text-gray-600">
                                    試合: <span className="font-medium text-gray-800">¥{user.rates.game.toLocaleString()}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                            {username !== 'accounting' && (
                              <button
                                onClick={() => {
                                  setUserToDelete({ username, user });
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 新しいコーチ・トレーナーを追加できます</li>
                        <li>• 報酬額はユーザーごとに設定できます</li>
                        <li>• 会計担当は削除できません</li>
                        <li>• ユーザーを削除すると、年度メンバーからも削除されます</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 会場管理タブ */}
                {settingsTab === 'venues' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">会場管理</h3>
                    
                    {/* 会場追加フォーム */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">会場を追加</h4>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="会場名を入力"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-venue-input"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target;
                              const venueName = input.value.trim();
                              if (venueName && !venues.includes(venueName)) {
                                setVenues([...venues, venueName]);
                                input.value = '';
                              } else if (venues.includes(venueName)) {
                                alert('この会場は既に登録されています');
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('new-venue-input');
                            const venueName = input.value.trim();
                            if (venueName && !venues.includes(venueName)) {
                              setVenues([...venues, venueName]);
                              input.value = '';
                            } else if (venues.includes(venueName)) {
                              alert('この会場は既に登録されています');
                            } else {
                              alert('会場名を入力してください');
                            }
                          }}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          追加
                        </button>
                      </div>
                    </div>

                    {/* 会場一覧 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {venues.map((venue, index) => (
                        <div key={venue} className="border-2 border-gray-200 rounded-lg p-3 flex justify-between items-center hover:border-gray-300 transition-colors">
                          <span className="font-medium text-gray-700">{venue}</span>
                          <button
                            onClick={() => {
                              console.log('削除ボタンがクリックされました:', venue);
                              setVenueToDelete(venue);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {venues.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        会場が登録されていません。上のフォームから追加してください。
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 会場を追加すると、出席入力時の選択肢に表示されます</li>
                        <li>• 会場を削除すると、その会場の距離設定も削除されます</li>
                        <li>• 既に使用されている会場は削除しないことをおすすめします</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 距離設定タブ */}
                {settingsTab === 'distances' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">距離設定</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      各コーチの自宅から各会場までの片道距離を設定してください（往復で計算されます）
                    </p>

                    {getFiscalYearMembers().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        年度にメンバーが登録されていません。年度管理からメンバーを追加してください。
                      </div>
                    ) : (
                      <>
                        {getFiscalYearMembers().map(username => {
                          const user = users[username];
                          if (!user) return null;

                          return (
                            <div key={username} className="mb-8">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                                {user.name}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {venues.map(venue => {
                                  const distanceKey = `${username}:${venue}`;
                                  return (
                                    <div key={venue} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                      <div className="flex-1 font-medium text-gray-700">{venue}</div>
                                      <input
                                        type="number"
                                        value={distances[distanceKey] || 0}
                                        onChange={(e) => {
                                          setDistances({
                                            ...distances,
                                            [distanceKey]: parseInt(e.target.value) || 0
                                          });
                                        }}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-right"
                                        placeholder="0"
                                      />
                                      <span className="text-gray-600 text-sm">km</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => {
                              alert('距離設定を保存しました');
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            保存
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            ※ 交通費は「片道距離 × 2（往復）× ¥20/km」で計算されます
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* カテゴリー管理タブ */}
                {settingsTab === 'categories' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">カテゴリー管理</h3>
                    
                    {/* 収入カテゴリー */}
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-green-200">
                        収入カテゴリー
                      </h4>
                      
                      {/* 追加フォーム */}
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="カテゴリー名"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                            id="new-income-category-name"
                          />
                          <select
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            id="new-income-category-color"
                          >
                            <option value="blue">青</option>
                            <option value="green">緑</option>
                            <option value="purple">紫</option>
                            <option value="yellow">黄</option>
                            <option value="orange">橙</option>
                            <option value="red">赤</option>
                            <option value="gray">灰</option>
                          </select>
                          <button
                            onClick={() => {
                              const name = document.getElementById('new-income-category-name').value.trim();
                              const color = document.getElementById('new-income-category-color').value;
                              
                              if (!name) {
                                alert('カテゴリー名を入力してください');
                                return;
                              }
                              
                              const newCategory = {
                                id: `income-${Date.now()}`,
                                name,
                                color
                              };
                              
                              setIncomeCategories([...incomeCategories, newCategory]);
                              document.getElementById('new-income-category-name').value = '';
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            追加
                          </button>
                        </div>
                      </div>
                      
                      {/* カテゴリー一覧 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {incomeCategories.map(cat => (
                          <div key={cat.id} className={`border-2 border-${cat.color}-200 bg-${cat.color}-50 rounded-lg p-3 flex justify-between items-center`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
                              <span className="font-medium text-gray-800">{cat.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                // 使用中かチェック
                                const isUsed = incomes.some(i => i.categoryId === cat.id);
                                if (isUsed) {
                                  alert('このカテゴリーは使用中のため削除できません');
                                  return;
                                }
                                
                                if (confirm(`「${cat.name}」を削除してもよろしいですか？`)) {
                                  setIncomeCategories(incomeCategories.filter(c => c.id !== cat.id));
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 支出カテゴリー */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-red-200">
                        支出カテゴリー
                      </h4>
                      
                      {/* 追加フォーム */}
                      <div className="mb-4 p-4 bg-red-50 rounded-lg">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="カテゴリー名"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                            id="new-expense-category-name"
                          />
                          <select
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            id="new-expense-category-color"
                          >
                            <option value="orange">橙</option>
                            <option value="red">赤</option>
                            <option value="blue">青</option>
                            <option value="green">緑</option>
                            <option value="purple">紫</option>
                            <option value="yellow">黄</option>
                            <option value="gray">灰</option>
                          </select>
                          <button
                            onClick={() => {
                              const name = document.getElementById('new-expense-category-name').value.trim();
                              const color = document.getElementById('new-expense-category-color').value;
                              
                              if (!name) {
                                alert('カテゴリー名を入力してください');
                                return;
                              }
                              
                              const newCategory = {
                                id: `expense-${Date.now()}`,
                                name,
                                color
                              };
                              
                              setExpenseCategories([...expenseCategories, newCategory]);
                              document.getElementById('new-expense-category-name').value = '';
                            }}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            追加
                          </button>
                        </div>
                      </div>
                      
                      {/* カテゴリー一覧 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {expenseCategories.map(cat => (
                          <div key={cat.id} className={`border-2 border-${cat.color}-200 bg-${cat.color}-50 rounded-lg p-3 flex justify-between items-center`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
                              <span className="font-medium text-gray-800">{cat.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                // 使用中かチェック
                                const isUsed = expenses.some(e => e.categoryId === cat.id);
                                if (isUsed) {
                                  alert('このカテゴリーは使用中のため削除できません');
                                  return;
                                }
                                
                                if (confirm(`「${cat.name}」を削除してもよろしいですか？`)) {
                                  setExpenseCategories(expenseCategories.filter(c => c.id !== cat.id));
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 収入・支出のカテゴリーを追加できます</li>
                        <li>• カテゴリーごとに色を設定できます</li>
                        <li>• 使用中のカテゴリーは削除できません</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 会員管理タブ */}
                {settingsTab === 'members' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">会員管理</h3>
                      <select
                        value={selectedFiscalYear}
                        onChange={(e) => setSelectedFiscalYear(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        {Object.keys(fiscalYears).map(key => (
                          <option key={key} value={key}>{fiscalYears[key].name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* 前年度から引き継ぎボタン */}
                    {(() => {
                      const currentFiscalYear = fiscalYears[selectedFiscalYear];
                      if (!currentFiscalYear) return null;
                      
                      // 前年度を探す
                      const prevFiscalYear = Object.values(fiscalYears).find(fy => 
                        fy.endYear === currentFiscalYear.startYear && fy.endMonth === currentFiscalYear.startMonth - 1
                      );
                      
                      const currentMembers = members.filter(m => m.fiscalYear === selectedFiscalYear);
                      const prevMembers = prevFiscalYear ? members.filter(m => 
                        m.fiscalYear === prevFiscalYear.id && m.active && m.grade <= 2
                      ) : [];
                      
                      if (prevMembers.length > 0 && currentMembers.length === 0) {
                        return (
                          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">前年度から引き継ぎ</h4>
                            <p className="text-sm text-blue-800 mb-3">
                              前年度の1年生・2年生（{prevMembers.length}名）を学年を上げて引き継ぎますか？
                            </p>
                            <button
                              onClick={() => {
                                const newMembers = prevMembers.map(m => ({
                                  ...m,
                                  id: Date.now() + Math.random(),
                                  fiscalYear: selectedFiscalYear,
                                  grade: m.grade + 1,
                                  createdAt: new Date().toISOString()
                                }));
                                const updatedMembers = [...members, ...newMembers];
                                setMembers(updatedMembers);
                                saveMembers(updatedMembers);
                                alert(`${newMembers.length}名を引き継ぎました`);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              引き継ぐ
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* 会員追加フォーム */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">会員を追加</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="氏名"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-member-name"
                        />
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-member-grade"
                        >
                          <option value="">学年を選択</option>
                          <option value="1">1年</option>
                          <option value="2">2年</option>
                          <option value="3">3年</option>
                        </select>
                        <input
                          type="number"
                          placeholder="月額会費（円）"
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          id="new-member-monthly-fee"
                          defaultValue="3000"
                        />
                        <button
                          onClick={() => {
                            const name = document.getElementById('new-member-name').value.trim();
                            const grade = document.getElementById('new-member-grade').value;
                            const monthlyFee = parseInt(document.getElementById('new-member-monthly-fee').value) || 3000;
                            
                            if (!name) {
                              alert('氏名を入力してください');
                              return;
                            }
                            if (!grade) {
                              alert('学年を選択してください');
                              return;
                            }
                            
                            const newMember = {
                              id: Date.now(),
                              name,
                              grade: parseInt(grade),
                              monthlyFee,
                              fiscalYear: selectedFiscalYear,
                              active: true,
                              createdAt: new Date().toISOString()
                            };
                            
                            setMembers([...members, newMember]);
                            saveMembers([...members, newMember]);
                            
                            // フォームをクリア
                            document.getElementById('new-member-name').value = '';
                            document.getElementById('new-member-grade').value = '';
                            document.getElementById('new-member-monthly-fee').value = '3000';
                          }}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          追加
                        </button>
                      </div>
                    </div>

                    {/* 会員一覧 */}
                    <div className="space-y-2">
                      {(() => {
                        const currentMembers = members.filter(m => m.fiscalYear === selectedFiscalYear);
                        
                        if (currentMembers.length === 0) {
                          return (
                            <>
                              <div className="text-center py-8 text-gray-500">
                                この年度に会員が登録されていません
                              </div>
                              
                              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                  <li>• 会員は年度ごとに管理されます</li>
                                  <li>• 前年度の1・2年生を自動的に学年を上げて引き継ぐことができます</li>
                                  <li>• 学年と月額会費は会員カード内で直接編集できます</li>
                                  <li>• 退部した会員は「退部にする」ボタンで管理できます</li>
                                  <li>• 会費記録画面で入金状況を管理します</li>
                                </ul>
                              </div>
                            </>
                          );
                        }
                        
                        return (
                          <>
                            {currentMembers
                              .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name))
                              .map(member => (
                            <div key={member.id} className="border-2 border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-2">{member.name}</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <label className="text-gray-600 block mb-1">学年</label>
                                        <select
                                          value={member.grade}
                                          onChange={(e) => {
                                            const newMembers = members.map(m => 
                                              m.id === member.id 
                                                ? { ...m, grade: parseInt(e.target.value) }
                                                : m
                                            );
                                            setMembers(newMembers);
                                            saveMembers(newMembers);
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded"
                                        >
                                          <option value="1">1年</option>
                                          <option value="2">2年</option>
                                          <option value="3">3年</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-gray-600 block mb-1">月額会費（円）</label>
                                        <input
                                          type="number"
                                          value={member.monthlyFee}
                                          onChange={(e) => {
                                            const newMembers = members.map(m => 
                                              m.id === member.id 
                                                ? { ...m, monthlyFee: parseInt(e.target.value) || 0 }
                                                : m
                                            );
                                            setMembers(newMembers);
                                            saveMembers(newMembers);
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded"
                                        />
                                      </div>
                                    </div>
                                    {!member.active && (
                                      <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                        退部
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => {
                                    const newMembers = members.map(m => 
                                      m.id === member.id 
                                        ? { ...m, active: !m.active }
                                        : m
                                    );
                                    setMembers(newMembers);
                                    saveMembers(newMembers);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm ${
                                    member.active
                                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {member.active ? '退部にする' : '在籍に戻す'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`${member.name}を削除してもよろしいですか？`)) {
                                      const newMembers = members.filter(m => m.id !== member.id);
                                      setMembers(newMembers);
                                      saveMembers(newMembers);
                                      
                                      // 関連する会費記録も削除
                                      const newFees = { ...membershipFees };
                                      Object.keys(newFees).forEach(key => {
                                        if (key.startsWith(`${member.id}:`)) {
                                          delete newFees[key];
                                        }
                                      });
                                      setMembershipFees(newFees);
                                      saveMembershipFees(newFees);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            </div>
                          ))}
                            
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-2">使い方</h4>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• 会員は年度ごとに管理されます</li>
                                <li>• 前年度の1・2年生を自動的に学年を上げて引き継ぐことができます</li>
                                <li>• 学年と月額会費は会員カード内で直接編集できます</li>
                                <li>• 退部した会員は「退部にする」ボタンで管理できます</li>
                                <li>• 会費記録画面で入金状況を管理します</li>
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : currentUser.role === 'accounting' ? (
            <div>
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">明細管理</h2>
                    <p className="text-sm text-gray-600 mt-1">コーチ・トレーナーの明細を管理します</p>
                  </div>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">コーチ・トレーナー選択</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getFiscalYearMembers().map(username => {
                      const user = users[username];
                      if (!user) return null;
                      return (
                        <button
                          key={username}
                          onClick={() => setSelectedCoach(username)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            selectedCoach === username
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {user.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCoach && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {users[selectedCoach]?.name}の明細
                    </h3>
                    
                    {getFiscalYearMonths().map(m => {
                      const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                      const statementKey = `${selectedCoach}:${monthKey}`;
                      const statement = statements[statementKey];
                      const status = statement?.status || 'empty';
                      const statusInfo = getStatusInfo(status);
                      const statementData = statement?.data || calculateStatement(selectedCoach, m.year, m.month);

                      const hasData = statementData && statementData.details.length > 0;

                      return (
                        <div key={monthKey} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => {
                              if (hasData) {
                                setExpandedMonths({
                                  ...expandedMonths,
                                  [statementKey]: !expandedMonths[statementKey]
                                });
                              }
                            }}
                            className={`w-full p-4 bg-gray-50 transition-colors flex justify-between items-center ${
                              hasData ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <h4 className="text-lg font-semibold text-gray-800">{m.label}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {hasData && (
                                <span className="text-2xl font-bold text-purple-600">
                                  ¥{statementData.summary.grandTotal.toLocaleString()}
                                </span>
                              )}
                              {!hasData && (
                                <span className="text-sm text-gray-500">出席データなし</span>
                              )}
                            </div>
                            {hasData && (expandedMonths[statementKey] ? <ChevronUp size={24} /> : <ChevronDown size={24} />)}
                          </button>

                          {expandedMonths[statementKey] && hasData && (
                            <div className="p-6 bg-white">
                              <div className="overflow-x-auto mb-6">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種類</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会場</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">報酬</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">距離</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">交通費</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ETC</th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合計</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {statementData.details.map((detail, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {new Date(detail.date).toLocaleDateString('ja-JP', {month: 'numeric', day: 'numeric'})}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            detail.type === 'practice' 
                                              ? 'bg-blue-100 text-blue-800' 
                                              : 'bg-orange-100 text-orange-800'
                                          }`}>
                                            {detail.type === 'practice' ? '練習' : '試合'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{detail.venue}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                          ¥{detail.rate.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                          {detail.distance}km
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                          ¥{detail.transportCost.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                          {detail.etc > 0 ? `¥${detail.etc.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                          ¥{detail.total.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="border-t-2 border-gray-300 pt-6 mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">報酬合計</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                      ¥{statementData.summary.totalRate.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">交通費合計</div>
                                    <div className="text-2xl font-bold text-green-600">
                                      ¥{statementData.summary.totalTransport.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="bg-yellow-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">ETC合計</div>
                                    <div className="text-2xl font-bold text-yellow-600">
                                      ¥{statementData.summary.totalETC.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">総支給額</div>
                                    <div className="text-2xl font-bold text-purple-600">
                                      ¥{statementData.summary.grandTotal.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                {status === 'empty' || status === 'in_progress' || status === 'input_completed' ? (
                                  <button
                                    onClick={() => completeStatement(selectedCoach, monthKey)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                  >
                                    明細を作成完了にする
                                  </button>
                                ) : status === 'completed' ? (
                                  <button
                                    onClick={() => confirmStatement(selectedCoach, monthKey)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  >
                                    確認済みにする
                                  </button>
                                ) : status === 'confirmed' ? (
                                  <button
                                    onClick={() => markAsPaid(selectedCoach, monthKey)}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                  >
                                    支払済みにする
                                  </button>
                                ) : (
                                  <div className="text-green-600 font-medium">✓ 処理完了</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">ログイン成功！</h2>
              <p>ようこそ、{currentUser.name}さん</p>
              <p className="text-sm text-gray-600 mt-2">役割: {currentUser.role}</p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 日付詳細入力ダイアログ */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の出席記録
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {dateActivities.map((activity, idx) => (
                <div key={activity.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
                      <select
                        value={activity.type}
                        onChange={(e) => updateActivity(activity.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="practice">練習</option>
                        <option value="game">試合</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">会場</label>
                      <select
                        value={activity.venue}
                        onChange={(e) => updateActivity(activity.id, 'venue', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {INITIAL_VENUES.map(venue => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ETC料金(円)</label>
                      <input
                        type="number"
                        value={activity.etc}
                        onChange={(e) => updateActivity(activity.id, 'etc', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addActivity}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600"
              >
                + 活動を追加
              </button>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={saveDateActivities}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会場削除確認ダイアログ */}
      {venueToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">会場の削除</h3>
            <p className="text-gray-600 mb-2">
              「<span className="font-bold text-gray-800">{venueToDelete}</span>」を削除してもよろしいですか？
            </p>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ この会場に設定された距離データも削除されます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('削除をキャンセル');
                  setVenueToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  console.log('削除確認OK:', venueToDelete);
                  // 会場を削除
                  const newVenues = venues.filter(v => v !== venueToDelete);
                  console.log('新しい会場リスト:', newVenues);
                  setVenues(newVenues);
                  
                  // この会場に関連する距離データも削除
                  const newDistances = { ...distances };
                  Object.keys(newDistances).forEach(key => {
                    if (key.endsWith(`:${venueToDelete}`)) {
                      console.log('距離データを削除:', key);
                      delete newDistances[key];
                    }
                  });
                  setDistances(newDistances);
                  console.log('削除完了');
                  setVenueToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー削除確認ダイアログ */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザーの削除</h3>
            <p className="text-gray-600 mb-2">
              「<span className="font-bold text-gray-800">{userToDelete.user.name}</span>」（{userToDelete.username}）を削除してもよろしいですか？
            </p>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ このユーザーは年度メンバーからも削除されます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const { username } = userToDelete;
                  
                  // ユーザーを削除
                  const newUsers = { ...users };
                  delete newUsers[username];
                  setUsers(newUsers);
                  
                  // 年度のメンバーからも削除
                  const newFiscalYears = { ...fiscalYears };
                  Object.keys(newFiscalYears).forEach(yearId => {
                    newFiscalYears[yearId].members = newFiscalYears[yearId].members.filter(m => m !== username);
                  });
                  setFiscalYears(newFiscalYears);
                  
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* パスワード変更モーダル */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">パスワード変更</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    現在のパスワード
                  </label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="現在のパスワードを入力"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しいパスワード <span className="text-xs text-gray-500">(4文字以上)</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="新しいパスワードを入力"
                    minLength="4"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しいパスワード（確認） <span className="text-xs text-gray-500">(4文字以上)</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="もう一度入力"
                    minLength="4"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ current: '', new: '', confirm: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    console.log('パスワード変更処理開始');
                    console.log('入力値:', passwordForm);
                    
                    // バリデーション
                    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
                      alert('すべての項目を入力してください');
                      return;
                    }
                    
                    console.log('現在のユーザー:', currentUser);
                    console.log('保存されているパスワード:', users[currentUser.username].password);
                    
                    // 現在のパスワードを確認
                    if (users[currentUser.username].password !== passwordForm.current) {
                      alert('現在のパスワードが正しくありません');
                      return;
                    }
                    
                    // 新しいパスワードの確認
                    if (passwordForm.new !== passwordForm.confirm) {
                      console.log('エラー: 新しいパスワードが一致しません');
                      alert('新しいパスワードが一致しません');
                      return;
                    }
                    
                    if (passwordForm.new.length < 4) {
                      console.log('エラー: パスワードが短すぎます');
                      alert('パスワードは4文字以上にしてください');
                      return;
                    }
                    
                    // パスワードを更新
                    console.log('パスワードを更新します');
                    const newUsers = {
                      ...users,
                      [currentUser.username]: {
                        ...users[currentUser.username],
                        password: passwordForm.new
                      }
                    };
                    setUsers(newUsers);
                    
                    // 現在のユーザー情報も更新
                    setCurrentUser({
                      ...currentUser,
                      password: passwordForm.new
                    });
                    
                    console.log('パスワード変更完了');
                    setShowPasswordModal(false);
                    setPasswordForm({ current: '', new: '', confirm: '' });
                    alert('パスワードを変更しました');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  変更
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
