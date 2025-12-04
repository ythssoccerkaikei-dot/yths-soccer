import React, { useState, useEffect } from 'react';
import { Calendar, LogOut, Settings, FileText, ChevronDown, ChevronUp, Check, Edit2, Trash2, Plus, Minus, X, Users } from 'lucide-react';

// 初期ユーザー設定（会計担当とデフォルトコーチ）
const INITIAL_USERS = {
  'accounting': { password: 'password123', name: '会計担当', role: 'accounting' },
  'sugisawa': { password: 'password123', name: '杉澤コーチ', role: 'coach', rates: { practice: 3000, game: 4000 } },
  'tsuchiya': { password: 'password123', name: '土屋コーチ', role: 'coach', rates: { practice: 3000, game: 4000 } },
  'saito': { password: 'password123', name: '斉藤トレーナー', role: 'trainer', rates: { practice: 6000, game: 6000 } }
};

// 初期年度設定（メンバー情報付き）
const INITIAL_FISCAL_YEAR = {
  '2026': {
    name: '2026年度',
    startYear: 2025,
    startMonth: 10,
    endYear: 2026,
    endMonth: 4,
    members: ['sugisawa', 'tsuchiya', 'saito']
  }
};

// 初期会場リスト
const INITIAL_VENUES = [
  '学校', '時之栖船久保', 'うさぎ島G', '裾野G', '吉原', '富士見', '沼津商業', '沼津工業',
  '二日町', '富士宮北', '富士総合', '愛鷹', '星陵', '日大三島', 'エスパ', '時之栖富士宮',
  '浜名平口', '田方農業', '富士', '科学技術', '富岳館', 'フジスパーク', '御殿場南',
  '飛龍', '富士川', '緑地', '静岡中央', '富士市立', '山宮ふじざくらパレット', '御殿場',
  '磐田南', '浜北西', '沼津城北', '藤枝北'
];

// 初期支出カテゴリー
const INITIAL_CATEGORIES = [
  { id: 'coach', name: 'コーチ代', color: 'blue' },
  { id: 'bus', name: 'バス代', color: 'green' },
  { id: 'registration', name: '登録費', color: 'yellow' },
  { id: 'activity', name: '活動費（グラウンド等）', color: 'purple' },
  { id: 'supplies', name: '消耗品費（洗剤・紙コップ等）', color: 'pink' },
  { id: 'mental', name: 'メンタルトレーニング講座費', color: 'indigo' },
  { id: 'event', name: '行事代', color: 'orange' },
  { id: 'fee', name: '振込手数料', color: 'gray' }
];

// 初期収入カテゴリー
const INITIAL_INCOME_CATEGORIES = [
  { id: 'membership_fee', name: '会費', color: 'green' },
  { id: 'subsidy', name: '助成金', color: 'blue' },
  { id: 'donation', name: '寄付金', color: 'purple' },
  { id: 'fundraising', name: '収益事業', color: 'orange' },
  { id: 'other', name: 'その他', color: 'gray' }
];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2026');
  const [fiscalYears, setFiscalYears] = useState(INITIAL_FISCAL_YEAR);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [attendances, setAttendances] = useState({});
  const [distances, setDistances] = useState({});
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INITIAL_INCOME_CATEGORIES);
  const [statements, setStatements] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateActivities, setDateActivities] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [accountingMonth, setAccountingMonth] = useState(10);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showInputCompleteDialog, setShowInputCompleteDialog] = useState(false);
  const [showConfirmStatementDialog, setShowConfirmStatementDialog] = useState(false);
  const [confirmTargetMonth, setConfirmTargetMonth] = useState(null);
  const [showFiscalYearDialog, setShowFiscalYearDialog] = useState(false);
  const [editingFiscalYear, setEditingFiscalYear] = useState(null);
  const [fiscalYearForm, setFiscalYearForm] = useState({
    id: '',
    name: '',
    startYear: new Date().getFullYear(),
    startMonth: 10,
    endYear: new Date().getFullYear() + 1,
    endMonth: 4,
    members: []
  });
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'coach',
    rates: { practice: 3000, game: 4000 }
  });

  // データの読み込み
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // ビュー変更時にデータ再読み込み
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentView]);

  // コーチ選択変更時にデータ再読み込み
  useEffect(() => {
    if (currentUser && currentUser.role === 'accounting' && !selectedCoach) {
      loadData();
    }
  }, [selectedCoach]);

  const loadData = async () => {
    if (!currentUser) return;
    
    console.log('=== データ読み込み開始 ===', currentUser.username);
    
    try {
      // ユーザーデータ（エラーが出てもデフォルトを使用）
      try {
        const usersResult = await window.storage.get('users');
        if (usersResult?.value) {
          const loadedUsers = JSON.parse(usersResult.value);
          // stateと統合（stateを優先）
          setUsers(prevUsers => ({ ...loadedUsers, ...prevUsers }));
          console.log('ユーザーデータ読み込み成功');
        }
      } catch (error) {
        console.warn('ユーザーデータ読み込み失敗（現在のstateを使用）:', error.message);
        // stateをそのまま使用
      }
      
      // 出席データ（全コーチ分を読み込む）
      if (currentUser.role === 'accounting') {
        const allAttendances = {};
        for (const username of Object.keys(users)) {
          if (users[username].role !== 'accounting') {
            try {
              const result = await window.storage.get(`attendances:${username}`);
              if (result?.value) {
                allAttendances[username] = JSON.parse(result.value);
              }
            } catch (error) {
              console.warn(`${username}の出席データ読み込み失敗:`, error.message);
            }
          }
        }
        setAttendances(allAttendances);
      } else {
        try {
          const attResult = await window.storage.get(`attendances:${currentUser.username}`);
          if (attResult?.value) {
            setAttendances(JSON.parse(attResult.value));
          }
        } catch (error) {
          console.warn('出席データ読み込み失敗:', error.message);
        }
      }
      
      // 距離設定
      try {
        const distResult = await window.storage.get('distances_all');
        if (distResult?.value) setDistances(JSON.parse(distResult.value));
      } catch (error) {
        console.warn('距離データ読み込み失敗:', error.message);
      }
      
      // 明細データ
      try {
        const stmtResult = await window.storage.get('statements_all');
        if (stmtResult?.value) {
          setStatements(JSON.parse(stmtResult.value));
        }
      } catch (error) {
        console.warn('明細データ読み込み失敗:', error.message);
      }
      
      // 会場リスト
      try {
        const venueResult = await window.storage.get('venues');
        if (venueResult?.value) setVenues(JSON.parse(venueResult.value));
      } catch (error) {
        console.warn('会場データ読み込み失敗:', error.message);
      }
      
      // カテゴリーリスト
      try {
        const categoryResult = await window.storage.get('categories');
        if (categoryResult?.value) {
          setCategories(JSON.parse(categoryResult.value));
        }
      } catch (error) {
        console.warn('カテゴリーデータ読み込み失敗:', error.message);
      }
      
      // 収入カテゴリーリスト
      try {
        const incomeCategoryResult = await window.storage.get('income_categories');
        if (incomeCategoryResult?.value) {
          setIncomeCategories(JSON.parse(incomeCategoryResult.value));
        }
      } catch (error) {
        console.warn('収入カテゴリーデータ読み込み失敗:', error.message);
      }
      
      // 支出データ
      try {
        const expensesResult = await window.storage.get('expenses');
        if (expensesResult?.value) {
          setExpenses(JSON.parse(expensesResult.value));
        }
      } catch (error) {
        console.warn('支出データ読み込み失敗:', error.message);
      }
      
      // 収入データ
      try {
        const incomesResult = await window.storage.get('incomes');
        if (incomesResult?.value) {
          setIncomes(JSON.parse(incomesResult.value));
        }
      } catch (error) {
        console.warn('収入データ読み込み失敗:', error.message);
      }
      
      // 年度設定
      try {
        const fyResult = await window.storage.get('fiscal_years');
        if (fyResult?.value) {
          const loadedFiscalYears = JSON.parse(fyResult.value);
          // stateと統合（stateを優先）
          setFiscalYears(prevFY => ({ ...loadedFiscalYears, ...prevFY }));
        }
      } catch (error) {
        console.warn('年度データ読み込み失敗（現在のstateを使用）:', error.message);
      }
      
      console.log('=== データ読み込み完了 ===');
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  const saveAttendances = async (data) => {
    try {
      if (currentUser.role === 'accounting') {
        return;
      }
      console.log('出席データを保存中...', `attendances:${currentUser.username}`, data);
      await window.storage.set(`attendances:${currentUser.username}`, JSON.stringify(data));
      console.log('出席データ保存完了');
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const saveDistances = async (data) => {
    try {
      await window.storage.set('distances_all', JSON.stringify(data));
      setDistances(data);
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const saveStatements = async (data) => {
    try {
      await window.storage.set('statements_all', JSON.stringify(data));
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const saveVenues = async (data) => {
    try {
      console.log('会場データ保存:', data.length, '件');
      const venuesJson = JSON.stringify(data);
      
      // まずstateを更新
      setVenues(data);
      
      // その後storageに保存（shared: trueを削除）
      await window.storage.set('venues', venuesJson);
      console.log('会場データ保存完了');
    } catch (error) {
      console.error('会場保存エラー:', error);
      // stateは更新済みなので現在のセッションでは使える
    }
  };

  const saveCategories = async (data) => {
    try {
      console.log('カテゴリーデータ保存:', data.length, '件');
      const categoriesJson = JSON.stringify(data);
      
      // まずstateを更新
      setCategories(data);
      
      // その後storageに保存
      await window.storage.set('categories', categoriesJson);
      console.log('カテゴリーデータ保存完了');
    } catch (error) {
      console.error('カテゴリー保存エラー:', error);
      // stateは更新済みなので現在のセッションでは使える
    }
  };

  const saveIncomeCategories = async (data) => {
    try {
      console.log('収入カテゴリーデータ保存:', data.length, '件');
      const incomeCategoriesJson = JSON.stringify(data);
      
      // まずstateを更新
      setIncomeCategories(data);
      
      // その後storageに保存
      await window.storage.set('income_categories', incomeCategoriesJson);
      console.log('収入カテゴリーデータ保存完了');
    } catch (error) {
      console.error('収入カテゴリー保存エラー:', error);
      // stateは更新済みなので現在のセッションでは使える
    }
  };

  const saveExpenses = async (data) => {
    try {
      console.log('支出データ保存:', data.length, '件');
      const expensesJson = JSON.stringify(data);
      
      // まずstateを更新
      setExpenses(data);
      
      // その後storageに保存
      await window.storage.set('expenses', expensesJson);
      console.log('支出データ保存完了');
    } catch (error) {
      console.error('支出保存エラー:', error);
      // stateは更新済みなので現在のセッションでは使える
    }
  };

  const saveIncomes = async (data) => {
    try {
      console.log('収入データ保存:', data.length, '件');
      const incomesJson = JSON.stringify(data);
      
      // まずstateを更新
      setIncomes(data);
      
      // その後storageに保存
      await window.storage.set('incomes', incomesJson);
      console.log('収入データ保存完了');
    } catch (error) {
      console.error('収入保存エラー:', error);
      // stateは更新済みなので現在のセッションでは使える
    }
  };

  const saveFiscalYears = async (data) => {
    console.log('=== 年度データ保存開始 ===');
    console.log('保存する年度データ:', data);
    
    // まずstateを更新（これが最重要）
    setFiscalYears(data);
    console.log('state更新完了');
    
    // storageへの保存は試みるが、失敗しても続行
    try {
      const fiscalYearsJson = JSON.stringify(data);
      console.log('JSON文字列化成功, 長さ:', fiscalYearsJson.length);
      
      await window.storage.set('fiscal_years', fiscalYearsJson);
      console.log('storage保存成功');
    } catch (error) {
      console.warn('storageへの保存失敗（メモリには保存済み）:', error.message);
      // エラーを無視して続行
    }
    
    setForceUpdate(prev => prev + 1);
  };

  // ログイン
  const handleLogin = async () => {
    console.log('=== ログイン処理開始 ===');
    console.log('入力されたユーザー名:', username);
    
    // まず現在のstateから取得（追加したユーザーがここに含まれている）
    let allUsers = { ...users };
    console.log('現在のstateのユーザー一覧:', Object.keys(allUsers));
    
    // storageからの読み込みは試みるが、エラーでも続行
    try {
      const usersResult = await window.storage.get('users');
      console.log('storageからの取得結果:', usersResult);
      
      if (usersResult?.value) {
        const storageUsers = JSON.parse(usersResult.value);
        console.log('storageから読み込んだユーザー一覧:', Object.keys(storageUsers));
        // storageとstateをマージ（stateを優先）
        allUsers = { ...storageUsers, ...allUsers };
      }
    } catch (error) {
      console.warn('storageからの読み込みに失敗（stateのデータを使用）:', error.message);
      // エラーが発生してもstateのデータで続行
    }
    
    console.log('最終的なログインチェック対象のユーザー一覧:', Object.keys(allUsers));
    
    const user = allUsers[username];
    console.log('入力されたユーザー名に対応するユーザー:', user);
    
    if (user && user.password === password) {
      console.log('ログイン成功');
      setCurrentUser({ username, ...user });
      
      // 役割に応じてデフォルトビューを設定
      if (user.role === 'accounting') {
        setCurrentView('accounting'); // 会計担当は明細管理画面へ
      } else {
        setCurrentView('calendar'); // コーチ・トレーナーはカレンダー画面へ
      }
      
      setLoginError('');
      setUsername('');
      setPassword('');
    } else {
      console.log('ログイン失敗');
      if (!user) {
        console.log('理由: ユーザーが見つかりません');
        console.log('利用可能なユーザー:', Object.keys(allUsers).join(', '));
      } else {
        console.log('理由: パスワードが一致しません');
        console.log('入力されたパスワード:', password);
        console.log('保存されているパスワード:', user.password);
      }
      setLoginError('ユーザー名またはパスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('calendar');
  };

  // 年度の月リスト取得
  const getFiscalYearMonths = () => {
    const fy = fiscalYears[selectedFiscalYear];
    if (!fy) return [];
    
    const months = [];
    let currentYear = fy.startYear;
    let currentMonth = fy.startMonth;
    
    while (currentYear < fy.endYear || (currentYear === fy.endYear && currentMonth <= fy.endMonth)) {
      months.push({
        year: currentYear,
        month: currentMonth,
        label: `${currentYear}年${currentMonth + 1}月`
      });
      
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    
    return months;
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

  // 日付の出席データ取得
  const getDateActivities = (username, year, month, day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (currentUser.role === 'accounting') {
      return attendances[username]?.[dateKey] || [];
    }
    return attendances[dateKey] || [];
  };

  // 日付クリック
  const handleDateClick = (day) => {
    if (!day) return;
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    const currentAttendances = currentUser.role === 'accounting' ? attendances : attendances;
    setDateActivities(currentAttendances[dateKey] || []);
  };

  // 活動追加
  const addActivity = () => {
    setDateActivities([...dateActivities, {
      id: Date.now(),
      type: 'practice',
      venue: '学校',
      etc: 0
    }]);
  };

  // 活動更新
  const updateActivity = (id, field, value) => {
    setDateActivities(dateActivities.map(act => 
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  // 活動削除
  const deleteActivity = (id) => {
    setDateActivities(dateActivities.filter(act => act.id !== id));
  };

  // 日付の活動保存
  const saveDateActivities = () => {
    if (currentUser.role === 'accounting') return;
    
    console.log('=== 日付の活動を保存 ===');
    console.log('保存対象日:', selectedDate);
    console.log('活動データ:', dateActivities);
    
    const newAttendances = { ...attendances, [selectedDate]: dateActivities };
    console.log('更新後の出席データ:', newAttendances);
    
    setAttendances(newAttendances);
    saveAttendances(newAttendances);
    setSelectedDate(null);
  };

  // 月の入力完了（準備）
  const prepareCompleteMonthInput = () => {
    console.log('=== 入力完了ボタンが押されました ===');
    
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    console.log('対象月:', monthKey);
    
    const userAttendances = currentUser.role === 'accounting' 
      ? (attendances[currentUser.username] || {})
      : attendances;
      
    console.log('チェック対象の出席データ:', userAttendances);
    
    const hasData = Object.keys(userAttendances).some(dateKey => {
      return dateKey.startsWith(monthKey);
    });
    
    console.log('出席データあり?:', hasData);
    
    if (!hasData) {
      alert('出席記録が入力されていません');
      return;
    }
    
    setShowInputCompleteDialog(true);
  };

  // 月の入力完了（実行）
  const executeCompleteMonthInput = async () => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const statementKey = `${currentUser.username}:${monthKey}`;
    const newStatements = {
      ...statements,
      [statementKey]: { 
        status: 'input_completed',
        completedAt: new Date().toISOString()
      }
    };
    
    console.log('入力完了保存:', statementKey, newStatements[statementKey]);
    
    try {
      setStatements(newStatements);
      await window.storage.set('statements_all', JSON.stringify(newStatements));
      console.log('保存完了');
      setForceUpdate(prev => prev + 1);
      setShowInputCompleteDialog(false);
      alert('入力完了しました。会計担当の確認をお待ちください。');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 明細計算
  const calculateStatement = (username, year, month) => {
    const user = users[username];
    if (!user) return null;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const details = [];
    let totalRate = 0;
    let totalTransport = 0;
    let totalETC = 0;

    const userAttendances = attendances[username] || {};
    const userDistances = distances[username] || {};

    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activities = userAttendances[dateKey] || [];

      activities.forEach(activity => {
        const rate = activity.type === 'practice' ? user.rates.practice : user.rates.game;
        const distance = userDistances[activity.venue] || 0;
        const transportCost = distance * 2 * 20;
        const etc = activity.etc || 0;
        const total = rate + transportCost + etc;

        details.push({
          date: dateKey,
          type: activity.type,
          venue: activity.venue,
          rate: rate,
          distance: distance,
          transportCost: transportCost,
          etc: etc,
          total: total
        });

        totalRate += rate;
        totalTransport += transportCost;
        totalETC += etc;
      });
    }

    return {
      details,
      summary: {
        totalRate,
        totalTransport,
        totalETC,
        grandTotal: totalRate + totalTransport + totalETC
      }
    };
  };

  // 明細作成完了
  const completeStatement = async (username) => {
    const monthKey = `${selectedYear}-${String(accountingMonth + 1).padStart(2, '0')}`;
    const statement = calculateStatement(username, selectedYear, accountingMonth);
    
    const statementKey = `${username}:${monthKey}`;
    const newStatements = {
      ...statements,
      [statementKey]: {
        status: 'completed',
        data: statement,
        createdAt: new Date().toISOString()
      }
    };
    
    console.log('明細作成完了保存:', statementKey, newStatements[statementKey]);
    
    try {
      setStatements(newStatements);
      await window.storage.set('statements_all', JSON.stringify(newStatements));
      setForceUpdate(prev => prev + 1);
      alert(`${users[username]?.name || ''}の${accountingMonth + 1}月分明細を作成完了しました`);
      setSelectedCoach(null);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 明細確認（準備）
  const prepareConfirmStatement = (monthKey) => {
    setConfirmTargetMonth(monthKey);
    setShowConfirmStatementDialog(true);
  };

  // 明細確認（実行）
  const executeConfirmStatement = async () => {
    const monthKey = confirmTargetMonth;
    const statementKey = `${currentUser.username}:${monthKey}`;
    const newStatements = {
      ...statements,
      [statementKey]: { 
        ...statements[statementKey], 
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      }
    };
    
    console.log('明細確認保存:', statementKey, newStatements[statementKey]);
    
    try {
      setStatements(newStatements);
      await window.storage.set('statements_all', JSON.stringify(newStatements));
      setForceUpdate(prev => prev + 1);
      setShowConfirmStatementDialog(false);
      setConfirmTargetMonth(null);
      alert('明細を確認しました。');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 支払済みにする
  const markAsPaid = async (username, monthKey) => {
    const statementKey = `${username}:${monthKey}`;
    const statement = statements[statementKey];
    
    if (!statement || statement.status !== 'confirmed') {
      alert('この明細は支払処理できません');
      return;
    }

    const newStatements = {
      ...statements,
      [statementKey]: {
        ...statement,
        status: 'paid',
        paidAt: new Date().toISOString()
      }
    };

    console.log('支払処理:', statementKey, newStatements[statementKey]);

    try {
      setStatements(newStatements);
      await window.storage.set('statements_all', JSON.stringify(newStatements));
      setForceUpdate(prev => prev + 1);
      console.log('支払処理完了');
    } catch (error) {
      console.warn('支払処理のstorage保存失敗:', error.message);
      setForceUpdate(prev => prev + 1);
    }
  };

  // 月の状態取得
  const getMonthStatus = (username, year, month) => {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const statementKey = `${username}:${monthKey}`;
    
    console.log('状態確認:', statementKey, statements[statementKey]);
    
    if (statements[statementKey]) {
      return statements[statementKey].status;
    }
    
    const userAttendances = attendances[username] || {};
    const hasData = Object.keys(userAttendances).some(dateKey => {
      return dateKey.startsWith(monthKey);
    });
    
    return hasData ? 'has_data' : 'empty';
  };

  // 状態の表示情報
  const getStatusInfo = (status) => {
    switch(status) {
      case 'input_completed':
        return { label: '入力完了', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'completed':
        return { label: '作成完了', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'confirmed':
        return { label: '確認済み', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'paid':
        return { label: '支払済み', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'has_data':
        return { label: '入力中', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      default:
        return { label: '未入力', color: 'bg-gray-100 text-gray-600 border-gray-300' };
    }
  };

  // 年度のメンバーを取得
  const getFiscalYearMembers = (fyId = null) => {
    const targetFyId = fyId || selectedFiscalYear;
    const fy = fiscalYears[targetFyId];
    return fy?.members || [];
  };

  // 年度追加・編集ダイアログを開く
  const openFiscalYearDialog = (fiscalYearId = null) => {
    if (fiscalYearId) {
      const fy = fiscalYears[fiscalYearId];
      setEditingFiscalYear(fiscalYearId);
      setFiscalYearForm({
        id: fiscalYearId,
        name: fy.name,
        startYear: fy.startYear,
        startMonth: fy.startMonth,
        endYear: fy.endYear,
        endMonth: fy.endMonth,
        members: fy.members || []
      });
    } else {
      setEditingFiscalYear(null);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      setFiscalYearForm({
        id: nextYear.toString(),
        name: `${nextYear}年度`,
        startYear: currentYear,
        startMonth: 10,
        endYear: nextYear,
        endMonth: 4,
        members: []
      });
    }
    setShowFiscalYearDialog(true);
  };

  // 年度保存（メンバー情報含む）
  const saveFiscalYear = async () => {
    console.log('=== 年度保存開始 ===');
    console.log('fiscalYearForm:', fiscalYearForm);
    
    if (!fiscalYearForm.name || !fiscalYearForm.id) {
      alert('年度IDと年度名を入力してください');
      return;
    }

    const newFiscalYears = {
      ...fiscalYears,
      [fiscalYearForm.id]: {
        name: fiscalYearForm.name,
        startYear: parseInt(fiscalYearForm.startYear),
        startMonth: parseInt(fiscalYearForm.startMonth),
        endYear: parseInt(fiscalYearForm.endYear),
        endMonth: parseInt(fiscalYearForm.endMonth),
        members: fiscalYearForm.members || []
      }
    };

    console.log('更新後の年度データ:', newFiscalYears);

    try {
      await saveFiscalYears(newFiscalYears);
      console.log('年度保存完了');
      
      setShowFiscalYearDialog(false);
      setForceUpdate(prev => prev + 1);
      
      alert(editingFiscalYear ? '年度を更新しました' : '年度を追加しました');
    } catch (error) {
      console.error('年度保存エラー:', error);
      
      // エラーが発生してもダイアログを閉じて画面に反映
      setShowFiscalYearDialog(false);
      setForceUpdate(prev => prev + 1);
      
      alert('ストレージへの保存に失敗しましたが、現在のセッションでは使用できます。\n再ログイン後は消える可能性があります。\n\nエラー: ' + error.message);
    }
  };

  // 年度削除
  const deleteFiscalYear = async (fiscalYearId) => {
    if (Object.keys(fiscalYears).length <= 1) {
      alert('最後の年度は削除できません');
      return;
    }

    const newFiscalYears = { ...fiscalYears };
    delete newFiscalYears[fiscalYearId];
    
    await saveFiscalYears(newFiscalYears);
    
    if (selectedFiscalYear === fiscalYearId) {
      const remainingKeys = Object.keys(newFiscalYears);
      if (remainingKeys.length > 0) {
        setSelectedFiscalYear(remainingKeys[0]);
      }
    }
    
    alert('年度を削除しました');
  };

  // ユーザー追加・編集ダイアログを開く
  const openUserDialog = (username = null) => {
    console.log('=== ユーザーダイアログを開く ===');
    console.log('編集対象ユーザー:', username);
    
    if (username) {
      const user = users[username];
      console.log('編集するユーザー情報:', user);
      setEditingUser(username);
      setUserForm({
        username: username,
        password: user.password,
        name: user.name,
        role: user.role,
        rates: user.rates || { practice: 3000, game: 4000 }
      });
    } else {
      console.log('新規ユーザー追加モード');
      setEditingUser(null);
      setUserForm({
        username: '',
        password: 'password123',
        name: '',
        role: 'coach',
        rates: { practice: 3000, game: 4000 }
      });
    }
    setShowUserDialog(true);
    console.log('ダイアログ表示フラグ設定完了');
  };

  // ユーザー保存
  const saveUser = async () => {
    console.log('=== ユーザー保存開始 ===');
    console.log('userForm:', userForm);
    
    if (!userForm.username || !userForm.name) {
      alert('ユーザー名と表示名を入力してください');
      return;
    }

    // 新しいユーザーオブジェクトを作成
    const newUserData = {
      password: userForm.password || 'password123',
      name: userForm.name,
      role: userForm.role
    };

    // 会計担当以外の場合のみratesを追加
    if (userForm.role !== 'accounting') {
      if (userForm.role === 'trainer') {
        newUserData.rates = { 
          practice: parseInt(userForm.rates?.practice) || 3000, 
          game: parseInt(userForm.rates?.practice) || 3000
        };
      } else {
        newUserData.rates = {
          practice: parseInt(userForm.rates?.practice) || 3000,
          game: parseInt(userForm.rates?.game) || 4000
        };
      }
    }

    console.log('保存するユーザーデータ:', newUserData);

    // 新しいユーザーリストを作成
    const newUsers = {
      ...users,
      [userForm.username]: newUserData
    };

    console.log('更新後の全ユーザー:', Object.keys(newUsers));

    // まずstateを更新（これが最重要）
    setUsers(newUsers);
    console.log('state更新完了');
    
    // storageへの保存は試みるが、失敗しても続行
    try {
      const usersJson = JSON.stringify(newUsers);
      console.log('JSON文字列化成功, 長さ:', usersJson.length);
      
      await window.storage.set('users', usersJson);
      console.log('storage保存成功');
    } catch (error) {
      console.warn('storageへの保存失敗（メモリには保存済み）:', error.message);
      // エラーを無視して続行
    }
    
    // ダイアログを閉じる
    setShowUserDialog(false);
    setForceUpdate(prev => prev + 1);
    
    alert(editingUser ? 'ユーザーを更新しました' : 'ユーザーを追加しました\n（※ページをリロードするまで有効です）');
  };

  // ユーザー削除
  const deleteUser = async (username) => {
    if (username === 'accounting') {
      alert('デフォルトの会計担当は削除できません');
      return;
    }

    const newUsers = { ...users };
    delete newUsers[username];
    
    const newFiscalYears = { ...fiscalYears };
    Object.keys(newFiscalYears).forEach(fyId => {
      if (newFiscalYears[fyId].members) {
        newFiscalYears[fyId].members = newFiscalYears[fyId].members.filter(m => m !== username);
      }
    });

    try {
      // ユーザーデータを保存
      const usersJson = JSON.stringify(newUsers);
      setUsers(newUsers);
      await window.storage.set('users', usersJson);
      
      // 年度データを保存
      const fiscalYearsJson = JSON.stringify(newFiscalYears);
      setFiscalYears(newFiscalYears);
      await window.storage.set('fiscal_years', fiscalYearsJson);
      
      setForceUpdate(prev => prev + 1);
      alert('ユーザーを削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      
      // stateは更新済みなので画面には反映される
      setForceUpdate(prev => prev + 1);
      alert('ユーザーを削除しました（ストレージ保存は失敗しましたが、現在のセッションでは反映されています）');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">部活父母会</h1>
            <h2 className="text-xl text-gray-600">コーチ出席管理システム</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="sugisawa"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="パスワード"
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-2">テストアカウント</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>コーチ: sugisawa / tsuchiya / saito</p>
              <p>会計: accounting</p>
              <p>パスワード: password123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calendar = generateCalendar(selectedYear, selectedMonth);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-800">コーチ出席管理システム</h1>
              <p className="text-sm text-gray-500">{currentUser.name}</p>
            </div>
            <div className="flex items-center gap-4">
              {currentUser.role !== 'accounting' && (
                <>
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar size={18} />
                    <span>出席入力</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={18} />
                    <span>明細確認</span>
                  </button>
                </>
              )}
              {currentUser.role === 'accounting' && (
                <>
                  <button
                    onClick={() => {
                      setCurrentView('accounting');
                      loadData();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'accounting' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={18} />
                    <span>明細管理</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('incomes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'incomes' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={18} />
                    <span>収入記録</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('expenses')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'expenses' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Minus size={18} />
                    <span>支出記録</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('payment')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'payment' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Check size={18} />
                    <span>支払処理</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView.startsWith('settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Settings size={18} />
                    <span>設定</span>
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>ログアウト</span>
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
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-800">出席入力カレンダー</h2>
                  {(() => {
                    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
                    const statementKey = `${currentUser.username}:${monthKey}`;
                    const status = statements[statementKey]?.status;
                    
                    console.log('カレンダー状態表示:', monthKey, 'status:', status, 'statements:', statements);
                    
                    if (status) {
                      const statusInfo = getStatusInfo(status);
                      return (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => {
                      setSelectedFiscalYear(e.target.value);
                      const fy = fiscalYears[e.target.value];
                      if (fy) {
                        setSelectedYear(fy.startYear);
                        setSelectedMonth(fy.startMonth);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(fiscalYears).map(key => (
                      <option key={key} value={key}>{fiscalYears[key].name}</option>
                    ))}
                  </select>
                  <select
                    value={`${selectedYear}-${selectedMonth}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      setSelectedYear(parseInt(year));
                      setSelectedMonth(parseInt(month));
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {getFiscalYearMonths().map(m => (
                      <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={prepareCompleteMonthInput}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    入力完了
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
                ))}
                {calendar.map((week, weekIdx) => (
                  week.map((day, dayIdx) => {
                    const activities = day ? getDateActivities(currentUser.username, selectedYear, selectedMonth, day) : [];
                    return (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        onClick={() => handleDateClick(day)}
                        className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                          day ? 'bg-white hover:bg-blue-50 border-gray-200' : 'bg-gray-50 border-transparent'
                        }`}
                      >
                        {day && (
                          <>
                            <div className="font-semibold text-gray-800 mb-1">{day}</div>
                            <div className="space-y-1">
                              {activities.map((act, idx) => (
                                <div key={idx} className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800 truncate">
                                  {act.type === 'practice' ? '練習' : '試合'} {act.venue}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 日付詳細入力モーダル */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedDate} の活動</h3>
                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {dateActivities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
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
                          {venues.map(v => <option key={v} value={v}>{v}</option>)}
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

        {/* ダッシュボード（明細確認）画面 */}
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
                <div className="space-y-4">
                  {getFiscalYearMonths().map(m => {
                    const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                    const statementKey = `${currentUser.username}:${monthKey}`;
                    const statement = statements[statementKey];
                    const status = statement?.status || 'empty';
                    
                    console.log('ダッシュボード月表示:', monthKey, 'status:', status, 'statement:', statement);
                    
                    const statusInfo = getStatusInfo(status);
                    
                    if (status !== 'completed' && status !== 'confirmed') {
                      return null;
                    }

                    const statementData = statement?.data || calculateStatement(currentUser.username, m.year, m.month);

                    return (
                      <div key={`${monthKey}-${forceUpdate}`} className="border-2 border-gray-200 rounded-lg overflow-hidden">
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
                              ¥{statementData?.summary?.grandTotal?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {status === 'completed' && (
                              <span className="text-sm text-gray-600 mr-2">クリックして確認</span>
                            )}
                            {expandedMonths[monthKey] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                          </div>
                        </button>

                        {expandedMonths[monthKey] && statementData && (
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
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                              {(() => {
                                const currentStatement = statements[`${currentUser.username}:${monthKey}`];
                                const currentStatus = currentStatement?.status || 'empty';
                                
                                if (currentStatus === 'completed') {
                                  return (
                                    <button
                                      onClick={() => prepareConfirmStatement(monthKey)}
                                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg flex items-center justify-center gap-2"
                                    >
                                      <Check size={24} />
                                      <span>明細を確認する</span>
                                    </button>
                                  );
                                } else if (currentStatus === 'confirmed') {
                                  return (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                                      <div className="flex items-center justify-center gap-2 text-green-800">
                                        <Check size={24} />
                                        <span className="font-medium">この明細は確認済みです</span>
                                      </div>
                                      <p className="text-sm text-green-700 mt-2">
                                        確認日時: {new Date(currentStatement.confirmedAt).toLocaleString('ja-JP')}
                                      </p>
                                    </div>
                                  );
                                } else {
                                  return null;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {getFiscalYearMonths().every(m => {
                  const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                  const statementKey = `${currentUser.username}:${monthKey}`;
                  const status = statements[statementKey]?.status;
                  return status !== 'completed' && status !== 'confirmed';
                }) && (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">確認できる明細がまだありません</p>
                    <p className="text-sm text-gray-500 mt-2">会計担当が明細を作成するとここに表示されます</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 会計担当画面 */}
        {currentView === 'accounting' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            {(() => {
              console.log('=== 明細管理画面デバッグ ===');
              console.log('selectedFiscalYear:', selectedFiscalYear);
              console.log('fiscalYears:', fiscalYears);
              console.log('getFiscalYearMembers():', getFiscalYearMembers());
              console.log('users:', users);
              return null;
            })()}
            {!selectedCoach ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">明細管理 - 状態確認</h2>
                      <p className="text-sm text-gray-600 mt-1">各コーチの月別状態を確認し、明細を作成してください</p>
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
                  {getFiscalYearMembers().length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">この年度にメンバーが登録されていません</p>
                      <p className="text-sm text-gray-500 mb-4">
                        設定画面の「年度管理」タブから、年度にメンバー（コーチ・トレーナー）を追加してください
                      </p>
                      <button
                        onClick={() => setCurrentView('settings')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        年度管理へ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                    {getFiscalYearMembers().map(username => {
                      const user = users[username];
                      if (!user) return null;
                      
                      const months = getFiscalYearMonths();
                      
                      return (
                        <div key={username} className="border-2 border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                              <p className="text-sm text-gray-600">
                                {user.role === 'coach' ? 'コーチ' : user.role === 'trainer' ? 'トレーナー' : '会計担当'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCoach(username);
                                const firstMonth = months[0];
                                setSelectedYear(firstMonth.year);
                                setAccountingMonth(firstMonth.month);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              明細作成
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            {months.map(m => {
                              const status = getMonthStatus(username, m.year, m.month);
                              const statusInfo = getStatusInfo(status);
                              
                              return (
                                <button
                                  key={`${m.year}-${m.month}`}
                                  onClick={() => {
                                    setSelectedCoach(username);
                                    setSelectedYear(m.year);
                                    setAccountingMonth(m.month);
                                  }}
                                  className={`p-3 border-2 rounded-lg text-center transition-all hover:shadow-md ${statusInfo.color}`}
                                >
                                  <div className="text-xs font-medium mb-1">{m.month + 1}月</div>
                                  <div className="text-xs">{statusInfo.label}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">状態の説明</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
                        <span className="text-sm text-gray-600">未入力</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
                        <span className="text-sm text-gray-600">入力中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                        <span className="text-sm text-gray-600">入力完了</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
                        <span className="text-sm text-gray-600">作成完了</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                        <span className="text-sm text-gray-600">確認済み</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-300"></div>
                        <span className="text-sm text-gray-600">支払済み</span>
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {getFiscalYearMembers().length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">状態の説明</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
                        <span className="text-sm text-gray-600">未入力</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
                        <span className="text-sm text-gray-600">入力中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                        <span className="text-sm text-gray-600">入力完了</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
                        <span className="text-sm text-gray-600">作成完了</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                        <span className="text-sm text-gray-600">確認済み</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-300"></div>
                        <span className="text-sm text-gray-600">支払済み</span>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {users[selectedCoach]?.name || ''} - 明細作成
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">出席記録から明細を自動計算します</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const status = getMonthStatus(selectedCoach, selectedYear, accountingMonth);
                        const statusInfo = getStatusInfo(status);
                        return (
                          <div className={`px-4 py-2 rounded-lg border-2 ${statusInfo.color}`}>
                            <span className="text-sm font-medium">{statusInfo.label}</span>
                          </div>
                        );
                      })()}
                      <select
                        value={`${selectedYear}-${accountingMonth}`}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split('-');
                          setSelectedYear(parseInt(year));
                          setAccountingMonth(parseInt(month));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        {getFiscalYearMonths().map(m => (
                          <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedCoach(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        戻る
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {(() => {
                    const statement = calculateStatement(selectedCoach, selectedYear, accountingMonth);
                    
                    if (!statement || statement.details.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500">
                          この月の出席記録がありません
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="overflow-x-auto mb-6">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種類</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会場</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">報酬</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">距離(km)</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">交通費</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ETC</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合計</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {statement.details.map((detail, idx) => (
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600 mb-1">報酬合計</div>
                              <div className="text-2xl font-bold text-blue-600">
                                ¥{statement.summary.totalRate.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600 mb-1">交通費合計</div>
                              <div className="text-2xl font-bold text-green-600">
                                ¥{statement.summary.totalTransport.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600 mb-1">ETC合計</div>
                              <div className="text-2xl font-bold text-yellow-600">
                                ¥{statement.summary.totalETC.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600 mb-1">総支給額</div>
                              <div className="text-2xl font-bold text-purple-600">
                                ¥{statement.summary.grandTotal.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {(() => {
                            const status = getMonthStatus(selectedCoach, selectedYear, accountingMonth);
                            if (status === 'completed') {
                              return (
                                <div className="space-y-3">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <p className="text-sm text-blue-800">この明細は作成完了済みです。コーチの確認待ちです。</p>
                                  </div>
                                  <button
                                    onClick={() => completeStatement(selectedCoach)}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
                                  >
                                    明細を更新
                                  </button>
                                </div>
                              );
                            } else if (status === 'confirmed') {
                              return (
                                <div className="space-y-3">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <p className="text-sm text-green-800">この明細は確認済みです。支給手続きを進めてください。</p>
                                  </div>
                                  <button
                                    onClick={() => completeStatement(selectedCoach)}
                                    className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium text-lg"
                                  >
                                    明細を再作成（確認済みをリセット）
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => completeStatement(selectedCoach)}
                                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
                                >
                                  作成完了
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
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

                          const newIncomes = [...incomes, newIncome];
                          setIncomes(newIncomes);
                          saveIncomes(newIncomes);

                          // フォームをリセット
                          document.getElementById('income-amount').value = '';
                          document.getElementById('income-description').value = '';
                          
                          alert('収入を記録しました');
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        記録
                      </button>
                    </div>
                  </div>
                </div>

                {/* カテゴリー別集計サマリー */}
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
                            total: 0,
                            count: 0
                          };
                        }
                        categoryTotals[income.categoryId].total += income.amount;
                        categoryTotals[income.categoryId].count += 1;
                      });

                      const grandTotal = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

                      return (
                        <>
                          {Object.entries(categoryTotals).map(([catId, data]) => {
                            const colorClasses = {
                              blue: 'bg-blue-50 border-blue-200 text-blue-700',
                              green: 'bg-green-50 border-green-200 text-green-700',
                              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                              red: 'bg-red-50 border-red-200 text-red-700',
                              purple: 'bg-purple-50 border-purple-200 text-purple-700',
                              pink: 'bg-pink-50 border-pink-200 text-pink-700',
                              indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                              orange: 'bg-orange-50 border-orange-200 text-orange-700',
                              gray: 'bg-gray-50 border-gray-300 text-gray-700'
                            };
                            
                            return (
                              <div key={catId} className={`rounded-lg p-4 border-2 ${colorClasses[data.color] || colorClasses.green}`}>
                                <div className="text-sm font-medium mb-1">{data.name}</div>
                                <div className="text-2xl font-bold">¥{data.total.toLocaleString()}</div>
                                <div className="text-xs mt-1">{data.count}件</div>
                              </div>
                            );
                          })}
                          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                            <div className="text-sm font-medium text-green-800 mb-1">合計</div>
                            <div className="text-2xl font-bold text-green-900">¥{grandTotal.toLocaleString()}</div>
                            <div className="text-xs text-green-700 mt-1">{fiscalIncomes.length}件</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 収入一覧 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">収入一覧</h3>
                  </div>

                  {(() => {
                    const fiscalIncomes = incomes
                      .filter(i => i.fiscalYear === selectedFiscalYear)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (fiscalIncomes.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Plus size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">まだ収入が記録されていません</p>
                          <p className="text-sm text-gray-500 mt-2">上のフォームから収入を記録してください</p>
                        </div>
                      );
                    }

                    return (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリー</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">摘要</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fiscalIncomes.map(income => {
                              const colorClasses = {
                                blue: 'bg-blue-100 text-blue-800',
                                green: 'bg-green-100 text-green-800',
                                yellow: 'bg-yellow-100 text-yellow-800',
                                red: 'bg-red-100 text-red-800',
                                purple: 'bg-purple-100 text-purple-800',
                                pink: 'bg-pink-100 text-pink-800',
                                indigo: 'bg-indigo-100 text-indigo-800',
                                orange: 'bg-orange-100 text-orange-800',
                                gray: 'bg-gray-100 text-gray-800'
                              };

                              return (
                                <tr key={income.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {new Date(income.date).toLocaleDateString('ja-JP')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[income.categoryColor] || colorClasses.green}`}>
                                      {income.categoryName}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {income.description || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                                    ¥{income.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => {
                                        if (confirm('この収入を削除しますか？')) {
                                          const newIncomes = incomes.filter(i => i.id !== income.id);
                                          setIncomes(newIncomes);
                                          saveIncomes(newIncomes);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
                    <p className="text-sm text-gray-600 mt-1">コーチ代以外の支出を記録します</p>
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
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
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
                        {categories.map(cat => (
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

                          const category = categories.find(c => c.id === categoryId);
                          const newExpense = {
                            id: Date.now(),
                            date: date,
                            categoryId: categoryId,
                            categoryName: category?.name || '',
                            categoryColor: category?.color || 'blue',
                            amount: amount,
                            description: description,
                            fiscalYear: selectedFiscalYear,
                            createdAt: new Date().toISOString()
                          };

                          const newExpenses = [...expenses, newExpense];
                          setExpenses(newExpenses);
                          saveExpenses(newExpenses);

                          // フォームをリセット
                          document.getElementById('expense-amount').value = '';
                          document.getElementById('expense-description').value = '';
                          
                          alert('支出を記録しました');
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        記録
                      </button>
                    </div>
                  </div>
                </div>

                {/* カテゴリー別集計サマリー */}
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
                            total: 0,
                            count: 0
                          };
                        }
                        categoryTotals[expense.categoryId].total += expense.amount;
                        categoryTotals[expense.categoryId].count += 1;
                      });

                      const grandTotal = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

                      return (
                        <>
                          {Object.entries(categoryTotals).map(([catId, data]) => {
                            const colorClasses = {
                              blue: 'bg-blue-50 border-blue-200 text-blue-700',
                              green: 'bg-green-50 border-green-200 text-green-700',
                              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                              red: 'bg-red-50 border-red-200 text-red-700',
                              purple: 'bg-purple-50 border-purple-200 text-purple-700',
                              pink: 'bg-pink-50 border-pink-200 text-pink-700',
                              indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                              orange: 'bg-orange-50 border-orange-200 text-orange-700',
                              gray: 'bg-gray-50 border-gray-300 text-gray-700'
                            };
                            
                            return (
                              <div key={catId} className={`rounded-lg p-4 border-2 ${colorClasses[data.color] || colorClasses.blue}`}>
                                <div className="text-sm font-medium mb-1">{data.name}</div>
                                <div className="text-2xl font-bold">¥{data.total.toLocaleString()}</div>
                                <div className="text-xs mt-1">{data.count}件</div>
                              </div>
                            );
                          })}
                          <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
                            <div className="text-sm font-medium text-purple-800 mb-1">合計</div>
                            <div className="text-2xl font-bold text-purple-900">¥{grandTotal.toLocaleString()}</div>
                            <div className="text-xs text-purple-700 mt-1">{fiscalExpenses.length}件</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 支出一覧 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">支出一覧</h3>
                  </div>

                  {(() => {
                    const fiscalExpenses = expenses
                      .filter(e => e.fiscalYear === selectedFiscalYear)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (fiscalExpenses.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Plus size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">まだ支出が記録されていません</p>
                          <p className="text-sm text-gray-500 mt-2">上のフォームから支出を記録してください</p>
                        </div>
                      );
                    }

                    return (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリー</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">摘要</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fiscalExpenses.map(expense => {
                              const colorClasses = {
                                blue: 'bg-blue-100 text-blue-800',
                                green: 'bg-green-100 text-green-800',
                                yellow: 'bg-yellow-100 text-yellow-800',
                                red: 'bg-red-100 text-red-800',
                                purple: 'bg-purple-100 text-purple-800',
                                pink: 'bg-pink-100 text-pink-800',
                                indigo: 'bg-indigo-100 text-indigo-800',
                                orange: 'bg-orange-100 text-orange-800',
                                gray: 'bg-gray-100 text-gray-800'
                              };

                              return (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {new Date(expense.date).toLocaleDateString('ja-JP')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[expense.categoryColor] || colorClasses.blue}`}>
                                      {expense.categoryName}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {expense.description || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                    ¥{expense.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => {
                                        if (confirm('この支出を削除しますか？')) {
                                          const newExpenses = expenses.filter(e => e.id !== expense.id);
                                          setExpenses(newExpenses);
                                          saveExpenses(newExpenses);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 支払処理画面 */}
        {currentView === 'payment' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">支払処理</h2>
                    <p className="text-sm text-gray-600 mt-1">確認済みの明細を支払処理します</p>
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
                {/* 年度サマリー */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {fiscalYears[selectedFiscalYear]?.name} 支払サマリー
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const months = getFiscalYearMonths();
                      const members = getFiscalYearMembers();
                      let totalConfirmed = 0;
                      let totalPaid = 0;
                      let confirmedCount = 0;
                      let paidCount = 0;

                      members.forEach(username => {
                        months.forEach(m => {
                          const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                          const statementKey = `${username}:${monthKey}`;
                          const statement = statements[statementKey];
                          
                          if (statement?.status === 'confirmed') {
                            totalConfirmed += statement.data?.summary?.grandTotal || 0;
                            confirmedCount++;
                          } else if (statement?.status === 'paid') {
                            totalPaid += statement.data?.summary?.grandTotal || 0;
                            paidCount++;
                          }
                        });
                      });

                      return (
                        <>
                          <div className="bg-white rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 mb-1">確認済み</div>
                            <div className="text-2xl font-bold text-blue-600">{confirmedCount}件</div>
                            <div className="text-sm text-gray-500 mt-1">¥{totalConfirmed.toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 mb-1">支払済み</div>
                            <div className="text-2xl font-bold text-green-600">{paidCount}件</div>
                            <div className="text-sm text-gray-500 mt-1">¥{totalPaid.toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 mb-1">未払い合計</div>
                            <div className="text-2xl font-bold text-orange-600">
                              ¥{totalConfirmed.toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 mb-1">年度合計</div>
                            <div className="text-2xl font-bold text-purple-600">
                              ¥{(totalConfirmed + totalPaid).toLocaleString()}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* メンバー別の支払処理リスト */}
                <div className="space-y-6">
                  {getFiscalYearMembers().map(username => {
                    const user = users[username];
                    if (!user) return null;

                    const months = getFiscalYearMonths();
                    const confirmedMonths = months.filter(m => {
                      const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                      const statementKey = `${username}:${monthKey}`;
                      return statements[statementKey]?.status === 'confirmed';
                    });

                    const paidMonths = months.filter(m => {
                      const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                      const statementKey = `${username}:${monthKey}`;
                      return statements[statementKey]?.status === 'paid';
                    });

                    if (confirmedMonths.length === 0 && paidMonths.length === 0) {
                      return null;
                    }

                    return (
                      <div key={username} className="border-2 border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                              <p className="text-sm text-gray-600">
                                確認済み: {confirmedMonths.length}件 / 支払済み: {paidMonths.length}件
                              </p>
                            </div>
                            {confirmedMonths.length > 0 && (
                              <button
                                onClick={() => {
                                  if (confirm(`${user.name}の確認済み明細${confirmedMonths.length}件すべてを支払済みにしますか？`)) {
                                    confirmedMonths.forEach(m => {
                                      const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                      markAsPaid(username, monthKey);
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                一括支払処理
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-6">
                          {/* 確認済み明細 */}
                          {confirmedMonths.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                確認済み（未払い）
                              </h4>
                              <div className="space-y-2">
                                {confirmedMonths.map(m => {
                                  const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                  const statementKey = `${username}:${monthKey}`;
                                  const statement = statements[statementKey];
                                  const amount = statement?.data?.summary?.grandTotal || 0;

                                  return (
                                    <div key={monthKey} className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">{m.label}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          確認日: {new Date(statement.confirmedAt).toLocaleDateString('ja-JP')}
                                        </div>
                                      </div>
                                      <div className="text-right mr-4">
                                        <div className="text-xl font-bold text-blue-600">
                                          ¥{amount.toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => markAsPaid(username, monthKey)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                      >
                                        <Check size={18} />
                                        <span>支払済みにする</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 支払済み明細 */}
                          {paidMonths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                支払済み
                              </h4>
                              <div className="space-y-2">
                                {paidMonths.map(m => {
                                  const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                                  const statementKey = `${username}:${monthKey}`;
                                  const statement = statements[statementKey];
                                  const amount = statement?.data?.summary?.grandTotal || 0;

                                  return (
                                    <div key={monthKey} className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">{m.label}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          支払日: {new Date(statement.paidAt).toLocaleDateString('ja-JP')}
                                        </div>
                                      </div>
                                      <div className="text-right mr-4">
                                        <div className="text-xl font-bold text-green-600">
                                          ¥{amount.toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-green-700 font-medium">
                                        <Check size={18} />
                                        <span>支払済み</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {getFiscalYearMembers().every(username => {
                  const months = getFiscalYearMonths();
                  return months.every(m => {
                    const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                    const statementKey = `${username}:${monthKey}`;
                    const status = statements[statementKey]?.status;
                    return status !== 'confirmed' && status !== 'paid';
                  });
                }) && (
                  <div className="text-center py-12">
                    <Check size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">処理可能な明細がありません</p>
                    <p className="text-sm text-gray-500 mt-2">
                      コーチが確認した明細がここに表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 設定画面タブ - 年度管理 */}
        {currentView === 'settings' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-income-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    収入カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">年度設定</h3>
                    <p className="text-sm text-gray-600 mt-1">年度の期間と所属メンバーを管理します</p>
                  </div>
                  <button
                    onClick={() => openFiscalYearDialog()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} />
                    <span>年度を追加</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(fiscalYears).map(([fyId, fy]) => (
                    <div key={fyId} className="border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{fy.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {fy.startYear}年{fy.startMonth + 1}月 〜 {fy.endYear}年{fy.endMonth + 1}月
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openFiscalYearDialog(fyId)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${fy.name}を削除しますか？`)) {
                                deleteFiscalYear(fyId);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">所属メンバー</h5>
                        <div className="flex flex-wrap gap-2">
                          {fy.members && fy.members.length > 0 ? (
                            fy.members.map(username => (
                              <span key={username} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {users[username]?.name || username}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">メンバーが設定されていません</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー管理タブ */}
        {currentView === 'settings-users' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">ユーザー管理</h3>
                    <p className="text-sm text-gray-600 mt-1">コーチ・トレーナーのアカウントと報酬設定を管理します</p>
                  </div>
                  <button
                    onClick={() => openUserDialog()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} />
                    <span>ユーザーを追加</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(users).map(([username, user]) => (
                    <div key={username} className="border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{user.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              user.role === 'accounting' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'accounting' ? '会計担当' : 
                               user.role === 'coach' ? 'コーチ' : 'トレーナー'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            ユーザー名: {username}
                          </p>
                          {user.role !== 'accounting' && user.rates && (
                            <div className="flex gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">練習: </span>
                                <span className="font-semibold text-gray-800">¥{user.rates.practice.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">試合: </span>
                                <span className="font-semibold text-gray-800">¥{user.rates.game.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openUserDialog(username)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={20} />
                          </button>
                          {username !== 'accounting' && (
                            <button
                              onClick={() => {
                                if (confirm(`${user.name}を削除しますか？`)) {
                                  deleteUser(username);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 支出支出カテゴリータブ */}
        {currentView === 'settings-expense-categories' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-income-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    収入カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">支出支出カテゴリー</h3>
                  <p className="text-sm text-gray-600">支出の分類カテゴリーを管理します</p>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="カテゴリー名（例：交通費）"
                      id="category-name-input"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      id="category-color-select"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                      defaultValue="blue"
                    >
                      <option value="blue">青</option>
                      <option value="green">緑</option>
                      <option value="yellow">黄</option>
                      <option value="red">赤</option>
                      <option value="purple">紫</option>
                      <option value="pink">ピンク</option>
                      <option value="indigo">藍</option>
                      <option value="orange">オレンジ</option>
                      <option value="gray">グレー</option>
                    </select>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('category-name-input');
                        const colorSelect = document.getElementById('category-color-select');
                        const newName = nameInput.value.trim();
                        const newColor = colorSelect.value;
                        
                        if (newName) {
                          const newId = `custom_${Date.now()}`;
                          const newCategories = [...categories, { id: newId, name: newName, color: newColor }];
                          setCategories(newCategories);
                          saveCategories(newCategories);
                          nameInput.value = '';
                          colorSelect.value = 'blue';
                        } else {
                          alert('カテゴリー名を入力してください');
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">登録済みカテゴリー ({categories.length})</h4>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const colorClasses = {
                        blue: 'bg-blue-100 border-blue-300 text-blue-800',
                        green: 'bg-green-100 border-green-300 text-green-800',
                        yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                        red: 'bg-red-100 border-red-300 text-red-800',
                        purple: 'bg-purple-100 border-purple-300 text-purple-800',
                        pink: 'bg-pink-100 border-pink-300 text-pink-800',
                        indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                        orange: 'bg-orange-100 border-orange-300 text-orange-800',
                        gray: 'bg-gray-100 border-gray-300 text-gray-800'
                      };
                      
                      return (
                        <div key={category.id} className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 ${colorClasses[category.color] || colorClasses.blue}`}>
                          <span className="font-medium">{category.name}</span>
                          <button
                            onClick={() => {
                              if (confirm(`「${category.name}」を削除しますか？`)) {
                                const newCategories = categories.filter(c => c.id !== category.id);
                                setCategories(newCategories);
                                saveCategories(newCategories);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">💡 カテゴリーの使い方</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• コーチ代やバス代など、支出の種類を分類できます</li>
                    <li>• 色分けすることで、視覚的に分かりやすくなります</li>
                    <li>• カテゴリーは後から追加・削除できます</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 収入支出カテゴリータブ */}
        {currentView === 'settings-income-categories' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-income-categories')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    収入カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">収入支出カテゴリー</h3>
                  <p className="text-sm text-gray-600">収入の分類カテゴリーを管理します</p>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="カテゴリー名（例：大会参加費）"
                      id="income-category-name-input"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      id="income-category-color-select"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                      defaultValue="green"
                    >
                      <option value="blue">青</option>
                      <option value="green">緑</option>
                      <option value="yellow">黄</option>
                      <option value="red">赤</option>
                      <option value="purple">紫</option>
                      <option value="pink">ピンク</option>
                      <option value="indigo">藍</option>
                      <option value="orange">オレンジ</option>
                      <option value="gray">グレー</option>
                    </select>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('income-category-name-input');
                        const colorSelect = document.getElementById('income-category-color-select');
                        const newName = nameInput.value.trim();
                        const newColor = colorSelect.value;
                        
                        if (newName) {
                          const newId = `custom_${Date.now()}`;
                          const newCategories = [...incomeCategories, { id: newId, name: newName, color: newColor }];
                          setIncomeCategories(newCategories);
                          saveIncomeCategories(newCategories);
                          nameInput.value = '';
                          colorSelect.value = 'green';
                        } else {
                          alert('カテゴリー名を入力してください');
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">登録済みカテゴリー ({incomeCategories.length})</h4>
                  <div className="space-y-2">
                    {incomeCategories.map((category) => {
                      const colorClasses = {
                        blue: 'bg-blue-100 border-blue-300 text-blue-800',
                        green: 'bg-green-100 border-green-300 text-green-800',
                        yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                        red: 'bg-red-100 border-red-300 text-red-800',
                        purple: 'bg-purple-100 border-purple-300 text-purple-800',
                        pink: 'bg-pink-100 border-pink-300 text-pink-800',
                        indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                        orange: 'bg-orange-100 border-orange-300 text-orange-800',
                        gray: 'bg-gray-100 border-gray-300 text-gray-800'
                      };
                      
                      return (
                        <div key={category.id} className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 ${colorClasses[category.color] || colorClasses.green}`}>
                          <span className="font-medium">{category.name}</span>
                          <button
                            onClick={() => {
                              if (confirm(`「${category.name}」を削除しますか？`)) {
                                const newCategories = incomeCategories.filter(c => c.id !== category.id);
                                setIncomeCategories(newCategories);
                                saveIncomeCategories(newCategories);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-green-900 mb-2">💡 カテゴリーの使い方</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• 会費や助成金など、収入の種類を分類できます</li>
                    <li>• 色分けすることで、視覚的に分かりやすくなります</li>
                    <li>• カテゴリーは後から追加・削除できます</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 会場管理タブ */}
        {currentView === 'settings-venues' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-income-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    収入カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">会場管理</h3>
                  <p className="text-sm text-gray-600">練習・試合会場のリストを管理します</p>
                </div>

                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="新しい会場名を入力"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const newVenue = e.target.value.trim();
                          if (!venues.includes(newVenue)) {
                            const newVenues = [...venues, newVenue].sort();
                            setVenues(newVenues);
                            saveVenues(newVenues);
                            e.target.value = '';
                          } else {
                            alert('この会場は既に登録されています');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        const newVenue = input.value.trim();
                        if (newVenue) {
                          if (!venues.includes(newVenue)) {
                            const newVenues = [...venues, newVenue].sort();
                            setVenues(newVenues);
                            saveVenues(newVenues);
                            input.value = '';
                          } else {
                            alert('この会場は既に登録されています');
                          }
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">登録済み会場 ({venues.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {venues.map((venue, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg group">
                        <span className="text-sm text-gray-800">{venue}</span>
                        <button
                          onClick={() => {
                            if (confirm(`「${venue}」を削除しますか？`)) {
                              const newVenues = venues.filter(v => v !== venue);
                              setVenues(newVenues);
                              saveVenues(newVenues);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 距離設定タブ */}
        {currentView === 'settings-distances' && currentUser.role === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    年度管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-users')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-expense-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    支出カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-income-categories')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    収入カテゴリー
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-venues')}
                    className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
                  >
                    会場管理
                  </button>
                  <button
                    onClick={() => setCurrentView('settings-distances')}
                    className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium"
                  >
                    距離設定
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">距離設定</h3>
                  <p className="text-sm text-gray-600">各コーチ・トレーナーの自宅から各会場までの距離を設定します（交通費計算用）</p>
                </div>

                <div className="space-y-6">
                  {Object.entries(users)
                    .filter(([_, user]) => user.role !== 'accounting')
                    .map(([username, user]) => (
                      <div key={username} className="border-2 border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{user.name}の距離設定</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {venues.map(venue => {
                            const currentDistance = distances[username]?.[venue] || 0;
                            return (
                              <div key={venue} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                <span className="text-sm text-gray-700 flex-1">{venue}</span>
                                <input
                                  type="number"
                                  value={currentDistance}
                                  onChange={(e) => {
                                    const newDistances = {
                                      ...distances,
                                      [username]: {
                                        ...distances[username],
                                        [venue]: parseInt(e.target.value) || 0
                                      }
                                    };
                                    saveDistances(newDistances);
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  min="0"
                                />
                                <span className="text-sm text-gray-600">km</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 各種ダイアログ */}
      {showInputCompleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">入力完了の確認</h3>
            <p className="text-gray-600 mb-6">
              {selectedYear}年{selectedMonth + 1}月の入力を完了しますか?<br/>
              完了後は会計担当が明細を作成できるようになります。
            </p>
            <div className="flex gap-3">
              <button
                onClick={executeCompleteMonthInput}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                確認
              </button>
              <button
                onClick={() => setShowInputCompleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmStatementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">明細確認</h3>
            <p className="text-gray-600 mb-6">
              この明細を確認しますか?<br/>
              確認後は支給手続きが進められます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={executeConfirmStatement}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                確認
              </button>
              <button
                onClick={() => {
                  setShowConfirmStatementDialog(false);
                  setConfirmTargetMonth(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 年度編集ダイアログ */}
      {showFiscalYearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingFiscalYear ? '年度を編集' : '年度を追加'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年度ID</label>
                <input
                  type="text"
                  value={fiscalYearForm.id}
                  onChange={(e) => setFiscalYearForm({...fiscalYearForm, id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="2026"
                  disabled={!!editingFiscalYear}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年度名</label>
                <input
                  type="text"
                  value={fiscalYearForm.name}
                  onChange={(e) => setFiscalYearForm({...fiscalYearForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="2026年度"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始年</label>
                  <input
                    type="number"
                    value={fiscalYearForm.startYear}
                    onChange={(e) => setFiscalYearForm({...fiscalYearForm, startYear: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始月</label>
                  <select
                    value={fiscalYearForm.startMonth}
                    onChange={(e) => setFiscalYearForm({...fiscalYearForm, startMonth: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">終了年</label>
                  <input
                    type="number"
                    value={fiscalYearForm.endYear}
                    onChange={(e) => setFiscalYearForm({...fiscalYearForm, endYear: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">終了月</label>
                  <select
                    value={fiscalYearForm.endMonth}
                    onChange={(e) => setFiscalYearForm({...fiscalYearForm, endMonth: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所属メンバー</label>
                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  {Object.entries(users)
                    .filter(([_, user]) => user.role !== 'accounting')
                    .map(([username, user]) => (
                      <label key={username} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={fiscalYearForm.members.includes(username)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFiscalYearForm({
                                ...fiscalYearForm,
                                members: [...fiscalYearForm.members, username]
                              });
                            } else {
                              setFiscalYearForm({
                                ...fiscalYearForm,
                                members: fiscalYearForm.members.filter(m => m !== username)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{user.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={saveFiscalYear}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setShowFiscalYearDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー編集ダイアログ */}
      {showUserDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ユーザー名（ID）</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => {
                    console.log('ユーザー名入力:', e.target.value);
                    setUserForm({...userForm, username: e.target.value});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="yamada"
                  disabled={!!editingUser}
                />
                <p className="text-xs text-gray-500 mt-1">ログインに使用するIDです（英数字推奨）</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => {
                    console.log('表示名入力:', e.target.value);
                    setUserForm({...userForm, name: e.target.value});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => {
                    console.log('パスワード入力');
                    setUserForm({...userForm, password: e.target.value});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="password123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">役割</label>
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    console.log('役割選択:', e.target.value);
                    setUserForm({...userForm, role: e.target.value});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="coach">コーチ</option>
                  <option value="trainer">トレーナー</option>
                  <option value="accounting">会計担当</option>
                </select>
              </div>
              {userForm.role !== 'accounting' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">練習報酬（円）</label>
                    <input
                      type="number"
                      value={userForm.rates.practice}
                      onChange={(e) => {
                        console.log('練習報酬入力:', e.target.value);
                        setUserForm({
                          ...userForm,
                          rates: {...userForm.rates, practice: parseInt(e.target.value) || 0}
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  {userForm.role === 'coach' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">試合報酬（円）</label>
                      <input
                        type="number"
                        value={userForm.rates.game}
                        onChange={(e) => {
                          console.log('試合報酬入力:', e.target.value);
                          setUserForm({
                            ...userForm,
                            rates: {...userForm.rates, game: parseInt(e.target.value) || 0}
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  console.log('保存ボタンがクリックされました');
                  saveUser();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => {
                  console.log('キャンセルボタンがクリックされました');
                  setShowUserDialog(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;