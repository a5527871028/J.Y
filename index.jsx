import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Calendar, 
  Clock, 
  Info, 
  DollarSign, 
  HelpCircle, 
  Gift, 
  Clipboard, 
  Lock, 
  X, 
  CheckCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  LogOut
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyCUA8l-vWhPEmhJRFvvsVw-D9SswS02Cws",
  authDomain: "jy-beauty-booking.firebaseapp.com",
  projectId: "jy-beauty-booking",
  storageBucket: "jy-beauty-booking.firebasestorage.app",
  messagingSenderId: "1002086733528",
  appId: "1:1002086733528:web:be630f3eddc7b91acea9ad",
  measurementId: "G-KTT19KK0NY"
};

// Initialize Firebase (Outside Component)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use environment app ID if available, otherwise fallback
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : "jy-beauty-studio-v1";

// --- Default Content (Fallback) ---
const DEFAULT_RULES = `店內規則
1. 限生理女、男賓止步
2. 日間半預約制
3. 日間時段：10～17點；夜間時段：18～3點
4. 預約日間不用訂金，但有未到紀錄，下次預約須先匯款訂金（為預約項目總價1/2之金額）
5. 預約夜間皆需先付款訂金（為預約項目總價1/2之金額）
6. 遲到15分鐘以上，未先訊息告知即視為未到，並取消預約
7. 取消預約至少提前三天，如有匯款訂金方可全額退還
8. 因合作空間，施作空間為布簾隔斷隔音，雖除毛師人都會在，但介意勿約
9. 美容空間無法攜帶食物及寵物

施作前注意
1. 施作日前請停用酸類產品、停止去角質至少一週，避免肌膚過敏或刺激
2. 毛髮長度需至少 0.5 至 1 公分，請勿自行修剪，以免影響除毛效果
3. 避開生理期前 5 天到後 3 天
4. 若有規劃出遊，建議提前3～5天安排除毛時間，讓肌膚有足夠的時間恢復，避免在出遊前一兩天才除毛
5. 除毛前後請勤勞密集保濕，除毛時有脫皮、泛紅、紅點屬正常現象，請注意產品不能含酸、也沒有美白功能`;

const DEFAULT_PROMO = `*整個月都享有開幕價
*學生價活動過後不會消失
*分享LINE官方給好友，一起加好友兩人都能拿到優惠劵，一人最高可拿五張，每次可使用1張
*追蹤IG、加LINE官方、Google評論五顆星並留言，經定額折扣完，消費總額再打九折`;

// --- Icons ---
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.174-.51.432-.595.064-.023.133-.031.199-.031.211 0 .391.09.51.25l2.443 3.317V8.108c0-.345.279-.63.631-.63.346 0 .626.285.626.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.348 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.628-.285-.628-.629V8.108c0-.345.283-.63.632-.63.345 0 .624.285.624.63v3.96h2.386c.346 0 .626.285.626.63 0 .349-.28.63-.63.63zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.026c-.045.303-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.432-6.975 1.608-1.858 2.552-3.731 2.552-5.974z"/>
  </svg>
);

// --- Component: Login Modal ---
const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "a5527871028" && password === "apple5512") {
      onLogin();
      onClose();
      setUsername("");
      setPassword("");
      setError("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError("請確定帳密或與管理員聯繫");
      if (newAttempts >= 3) {
        onClose();
        setAttempts(0);
        setUsername("");
        setPassword("");
        setError("");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-red-800 mb-4 text-center">管理員登入</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">帳號</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密碼</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-red-800 text-white py-2 rounded-md hover:bg-red-900 transition-colors">
              登入
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function JyBeautyApp() {
  const [activeTab, setActiveTab] = useState('info');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Data States
  const [rulesContent, setRulesContent] = useState(DEFAULT_RULES);
  const [promoContent, setPromoContent] = useState(DEFAULT_PROMO);
  const [bookings, setBookings] = useState([]);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    service: '私密處-比基尼除毛',
    date: '',
    timeSlot: '',
    isStudent: false,
    noShowRecord: false,
    isModel: false
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Constants
  const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];
  const services = [
    "私密處-比基尼除毛", "私密處-巴西式全除",
    "手部-腋下", "手部-上/下手臂", "手部-全手臂", "手部-手指",
    "腿部-小腿", "腿部-大腿", "腿部-全腿", "腿部-膝蓋",
    "其他-肚子", "其他-上/下背", "其他-全背"
  ];

  // --- Firebase Effects ---

  // 1. Auth Init (Robust Pattern)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error", error);
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/admin-restricted-operation') {
            alert("Firebase 設定提醒：\n您的專案尚未啟用「匿名登入」功能。\n請至 Firebase Console > Authentication > Sign-in method 開啟「Anonymous (匿名)」登入功能。");
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Content (Rules & Promo) - Guard with user
  useEffect(() => {
    if (!user) return;
    // FIX: Path must have even segments. Added 'main' as docId inside 'site_content' collection.
    const contentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'site_content', 'main');
    
    const unsubscribe = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // FIX: Ensure content is string to prevent "Objects are not valid as React child" error
        if (data.rules) setRulesContent(String(data.rules));
        if (data.promo) setPromoContent(String(data.promo));
      }
    }, (error) => {
        console.error("Content Fetch Error", error);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Fetch Bookings (For availability check & Admin view) - Guard with user
  useEffect(() => {
    if (!user) return;
    const bookingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings');
    
    const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
      const loadedBookings = [];
      snapshot.forEach(doc => {
        loadedBookings.push({ id: doc.id, ...doc.data() });
      });
      setBookings(loadedBookings);
    }, (error) => {
        console.error("Booking Fetch Error", error);
    });
    return () => unsubscribe();
  }, [user]);


  // --- Handlers ---
  const handleContentSave = async () => {
    if (!user || !isAdmin) return;
    try {
      // FIX: Path must have even segments.
      const contentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'site_content', 'main');
      await setDoc(contentRef, {
        rules: rulesContent,
        promo: promoContent
      }, { merge: true });
      alert("內容已更新！");
    } catch (e) {
      console.error(e);
      alert("儲存失敗，請檢查網路或權限");
    }
  };

  const isSlotTaken = (date, time) => {
    return bookings.some(b => b.date === date && b.timeSlot === time);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        alert("系統連線中，請稍後再試（若持續失敗請檢查 Firebase 設定）");
        return;
    }
    if (!formData.date || !formData.timeSlot || !formData.name) {
      alert("請填寫完整資訊");
      return;
    }
    
    setFormSubmitting(true);
    try {
      const bookingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings');
      await addDoc(bookingsRef, {
        ...formData,
        userId: user.uid, // Record who made the booking
        createdAt: serverTimestamp()
      });
      setFormSuccess(true);
      setFormData({
        name: '',
        service: '私密處-比基尼除毛',
        date: '',
        timeSlot: '',
        isStudent: false,
        noShowRecord: false,
        isModel: false
      });
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (error) {
      alert("預約失敗：" + error.message);
      console.error(error);
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- Tab Rendering ---
  const renderContent = () => {
    switch(activeTab) {
      case 'info':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
              <Info className="w-6 h-6" /> 預約須知
            </h2>
            {isAdmin ? (
              <div className="space-y-4">
                <textarea 
                  className="w-full h-96 p-4 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans leading-relaxed"
                  value={rulesContent}
                  onChange={(e) => setRulesContent(e.target.value)}
                />
                <button 
                  onClick={handleContentSave}
                  className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800 transition shadow-md"
                >
                  儲存修改
                </button>
              </div>
            ) : (
              <div className="prose prose-red max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-white/50 p-6 rounded-xl shadow-sm border border-red-100">
                {rulesContent}
              </div>
            )}
          </div>
        );

      case 'price':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
              <DollarSign className="w-6 h-6" /> 價目表
            </h2>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm text-center">
                <h3 className="text-xl font-serif font-bold text-red-800 mb-1">熱蠟除毛</h3>
                <p className="text-sm text-red-600 font-medium">italwax義朵熱蠟</p>
            </div>

            {/* Price Tables */}
            {[
                { title: "私密處", items: [
                    { name: "比基尼除毛", orig: 1000, open: 899, stu: 799 },
                    { name: "巴西式全除", orig: 1500, open: 1299, stu: 999 }
                ]},
                { title: "手部", items: [
                    { name: "腋下", orig: 600, open: 499, stu: 399 },
                    { name: "上/下手臂", orig: 800, open: 699, stu: 499 },
                    { name: "全手臂", orig: 1200, open: 1099, stu: 899 },
                    { name: "手指", orig: 400, open: 299, stu: 199 }
                ]},
                { title: "腿部", items: [
                    { name: "小腿", orig: 1000, open: 899, stu: 699 },
                    { name: "大腿", orig: 1200, open: 1099, stu: 799 },
                    { name: "全腿", orig: 1600, open: 1399, stu: 1099 },
                    { name: "膝蓋", orig: 400, open: 199, stu: 150 }
                ]},
                { title: "其他部位", items: [
                    { name: "肚子", orig: 1300, open: 1099, stu: 799 },
                    { name: "上/下背", orig: 900, open: 699, stu: 599 },
                    { name: "全背", orig: 1400, open: 1099, stu: 899 }
                ]}
            ].map((category, idx) => (
                <div key={idx} className="bg-white/80 rounded-xl overflow-hidden shadow-sm border border-red-100">
                    <div className="bg-red-800 text-white py-2 px-4 font-bold text-lg">{category.title}</div>
                    <div className="grid grid-cols-4 gap-2 p-3 bg-red-100 text-xs font-bold text-red-900 text-center">
                        <div className="text-left pl-2">項目</div>
                        <div>原價</div>
                        <div>開幕價</div>
                        <div>學生價</div>
                    </div>
                    {category.items.map((item, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 p-3 border-b border-red-50 text-sm hover:bg-red-50/50 transition items-center text-center">
                            <div className="text-left pl-2 font-medium text-gray-800">{item.name}</div>
                            <div className="text-gray-400 line-through decoration-red-300 decoration-2">${item.orig}</div>
                            <div className="text-red-600 font-bold">${item.open}</div>
                            <div className="text-green-700 font-bold">${item.stu}</div>
                        </div>
                    ))}
                </div>
            ))}
            
            <div className="bg-amber-50 p-4 rounded-lg text-xs text-amber-800 space-y-1 border border-amber-200">
                <p>• 上述開幕價只限開幕體驗月有而已，活動結束恢復原價</p>
                <p>• 開幕價及學生價都符合資格擇一參加</p>
                <p>• 學生出示實體卡並加入官方LINE方可享學生價優惠，可參加開幕月折上折活動</p>
            </div>
          </div>
        );

      case 'qa':
        const qaData = [
          { cat: "活動", q: "開幕月期間為何時？", a: "整個12月都是喔！" },
          { cat: "活動", q: "折上折活動是什麼意思？", a: "開幕月只要你有優惠卷或符合任一資格折扣，且單筆消費金額滿五百以上，都可以併行使用。" },
          { cat: "活動", q: "活動好多我有點混亂。", a: "可以參考右上方「本月活動」頁面資訊，有這個月活動詳述。" },
          { cat: "預約", q: "半預約制什麼意思？你們營業24小時嗎？", a: "希望你們提前約，但在日間時段(10~17點)可以致電詢問當天還有沒有時間段，如果有還是可以前來施作；夜間時段(18~3點)至少三天前就需要約。" },
          { cat: "預約", q: "我想預約，應該怎麼做？", a: "日間時段(10~17點)LINE都可以預約喔。" },
          { cat: "預約", q: "請問如果我來不及在預約日三天前取消怎麼辦？", a: "下次預約可以先私訊，完成訂金匯款就會幫你預約。" },
          { cat: "預約", q: "我未到一次，再次預約又是三天內取消，是不是訂金就被吃掉了？", a: "是的，這樣表示未到兩次，兩個時間段都已經為您安排" },
          { cat: "臨托", q: "我想除毛時，預約臨時托育服務，可以嗎？有沒有什麼限制？", a: "暫時不開放，之後僅開放夜間時段臨托，年齡限制5歲以下，且也需要看保母安排，如果可以接受請先加我們LINE，私訊「我想加購托育」，服務人員會回覆妳價格及時段。" },
          { cat: "臨托", q: "臨時托育服務是專業人員嗎？", a: "是，有永康區居家托育證照，加入準公托而且是相關科系。" },
          { cat: "臨托", q: "我加購臨時托育服務看得到小孩嗎？", a: "通常看不到，但小孩就在二樓而已，而妳在一樓施作。如果要看到可以另外事先提出。" },
          { cat: "臨托", q: "沒加購臨托可以帶小孩去嗎？", a: "沒辦法喔，因施作時環境需要安靜、也比較不能被動彈。" },
          { cat: "熱蠟", q: "熱蠟除毛好處？", a: "除毛效果依個人體質約維持三~七週，並且連根拔除過程中因破壞毛囊，長期固定回除能使毛髮變細、變少，生長速度也會變慢。" },
          { cat: "熱蠟", q: "為什麼除毛完會變白？", a: "因為熱蠟附帶去除老廢角質，也有體驗客因為這樣除全身熱蠟喔！(全身熱蠟需預約整天喔)" },
          { cat: "熱蠟", q: "會不會很燙或很痛？", a: "本店使用italwax義朵熱蠟，不會很燙，之於一般熱蠟減痛非常多，但依據個人毛囊狀況會有不同痛感。" },
          { cat: "熱蠟", q: "什麼情況不能做熱蠟？", a: "禁忌症（不可預約）：曬傷｜換膚｜嚴重靜脈曲張｜性病及其他傳染性疾病｜痘痘藥物中｜12週內或35週以上之孕婦。\n須醫生同意：糖尿病｜抗生素中｜免疫力失調｜避孕藥/荷爾蒙治療" },
          { cat: "熱蠟", q: "術後需要特別做什麼保養嗎？", a: "除毛前後請勤勞密集保濕，除毛一週後去角質，有助於新毛髮及避免內崁毛狀況，請注意產品不能含酸、也沒有美白功能" },
        ];
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
              <HelpCircle className="w-6 h-6" /> Q&A
            </h2>
            <div className="space-y-4">
              {qaData.map((item, index) => (
                <div key={index} className="bg-white/70 border border-red-100 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                   <div className="text-xs font-bold text-white bg-red-400 inline-block px-2 py-0.5 rounded mb-2">{item.cat}</div>
                   <h3 className="font-bold text-red-900 mb-2 flex items-start gap-2">
                     <span className="text-red-500">Q:</span> {item.q}
                   </h3>
                   <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-6 border-l-2 border-red-200">
                     {item.a}
                   </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'promo':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
              <Gift className="w-6 h-6" /> 本月活動
            </h2>
            {isAdmin ? (
               <div className="space-y-4">
                <textarea 
                  className="w-full h-64 p-4 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans leading-relaxed"
                  value={promoContent}
                  onChange={(e) => setPromoContent(e.target.value)}
                />
                <button 
                  onClick={handleContentSave}
                  className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800 transition shadow-md"
                >
                  儲存修改
                </button>
              </div>
            ) : (
              <div className="bg-red-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed font-medium">
                  {promoContent}
                </div>
              </div>
            )}
          </div>
        );

      case 'booking':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
              <Clipboard className="w-6 h-6" /> 預約表單
            </h2>
            
            {formSuccess ? (
              <div className="bg-green-100 text-green-800 p-8 rounded-xl text-center flex flex-col items-center gap-4 border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-600" />
                <h3 className="text-xl font-bold">預約請求已送出！</h3>
                <p>我們會盡快與您聯繫確認。</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5 bg-white/50 p-6 rounded-xl shadow-sm border border-red-100">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">姓名</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">預約項目</label>
                  <select 
                    value={formData.service}
                    onChange={e => setFormData({...formData, service: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">預約日期</label>
                  <input 
                    required
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={e => {
                        setFormData({...formData, date: e.target.value, timeSlot: ''});
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">預約時段 (請先選擇日期)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => {
                      const disabled = !formData.date || isSlotTaken(formData.date, time);
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={disabled}
                          onClick={() => setFormData({...formData, timeSlot: time})}
                          className={`
                            py-2 px-1 rounded text-sm font-bold transition-all
                            ${formData.timeSlot === time 
                                ? 'bg-red-700 text-white shadow-md transform scale-105' 
                                : disabled 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:border-red-300'}
                          `}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="student"
                      checked={formData.isStudent}
                      onChange={e => setFormData({...formData, isStudent: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="student" className="flex-1 text-sm text-gray-700">是否為學生身份</label>
                  </div>
                  {formData.isStudent && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 animate-fadeIn">
                       ⚠️ 當天請幫我帶學生證喔！
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="noshow"
                      checked={formData.noShowRecord}
                      onChange={e => setFormData({...formData, noShowRecord: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="noshow" className="flex-1 text-sm text-gray-700">是否曾經預約未到</label>
                  </div>
                  {formData.noShowRecord && (
                    <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200 animate-fadeIn">
                       ⚠️ 需要聯絡LINE官方匯款訂金喔！
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="model"
                      checked={formData.isModel}
                      onChange={e => setFormData({...formData, isModel: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="model" className="flex-1 text-sm text-gray-700">是否願意成為模特兒</label>
                  </div>
                  {formData.isModel && (
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 animate-fadeIn">
                       ✨ 模特兒另有超優惠價格，需配合現場拍作品集並上傳到社群喔！(不會看出是本人)
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={formSubmitting}
                  className="w-full bg-red-800 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-red-900 transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? '送出中...' : '送出預約'}
                </button>
              </form>
            )}
          </div>
        );

      case 'admin_schedule':
        return isAdmin ? (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2 border-b-2 border-red-200 pb-2">
               預約時刻表 (管理員)
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {bookings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">尚無預約資料</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold">
                                <tr>
                                    <th className="p-3">日期</th>
                                    <th className="p-3">時間</th>
                                    <th className="p-3">姓名</th>
                                    <th className="p-3">項目</th>
                                    <th className="p-3">學生</th>
                                    <th className="p-3">未到紀錄</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...bookings]
                                  .sort((a,b) => {
                                      // FIX: Guard against missing dates
                                      if (!a.date || !b.date) return 0;
                                      return new Date(a.date + 'T' + a.timeSlot) - new Date(b.date + 'T' + b.timeSlot);
                                  })
                                  .map((b) => (
                                    <tr key={b.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{b.date}</td>
                                        <td className="p-3 font-bold text-red-700">{b.timeSlot}</td>
                                        <td className="p-3">{b.name}</td>
                                        <td className="p-3 text-gray-600">{b.service}</td>
                                        <td className="p-3">{b.isStudent ? '是' : '-'}</td>
                                        <td className="p-3">{b.noShowRecord ? <span className="text-red-600 font-bold">是</span> : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-gray-800 font-sans relative overflow-x-hidden">
        {/* Christmas Background Decoration */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-10" 
             style={{
                backgroundImage: `radial-gradient(#AA2B2B 1px, transparent 1px), radial-gradient(#2E6B34 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
             }}>
        </div>

        <LoginModal 
            isOpen={isLoginOpen} 
            onClose={() => setIsLoginOpen(false)} 
            onLogin={() => setIsAdmin(true)} 
        />

        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative z-10 flex flex-col">
            
            {/* Header */}
            <header className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6 pb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 z-20">
                    {isAdmin ? (
                        <button onClick={() => setIsAdmin(false)} className="text-white/80 hover:text-white flex items-center gap-1 text-xs bg-black/20 px-2 py-1 rounded">
                            <LogOut size={14} /> 登出
                        </button>
                    ) : (
                        <button onClick={() => setIsLoginOpen(true)} className="text-white/30 hover:text-white/80 transition">
                            <Lock size={16} />
                        </button>
                    )}
                </div>

                <div className="relative z-10 text-center space-y-3">
                    <h1 className="text-2xl font-serif font-bold tracking-widest text-amber-100">
                        九翊美學
                        <span className="block text-sm font-sans font-light tracking-wide mt-1 text-white/80">
                            × J.Y Beauty Studio
                        </span>
                    </h1>
                    
                    {/* Social Buttons */}
                    <div className="flex justify-center gap-3 pt-2">
                        <a href="https://www.instagram.com/jystudio_1210?igsh=MWQ3czM4bHRqd2FmZw==" target="_blank" rel="noopener noreferrer" 
                           className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/20 transition flex items-center justify-center w-10 h-10 text-white">
                            <InstagramIcon />
                        </a>
                        <a href="https://lin.ee/gRA18AK" target="_blank" rel="noopener noreferrer" 
                           className="bg-[#06C755] hover:bg-[#05b64d] text-white p-2 rounded-full shadow-lg transition flex items-center justify-center w-10 h-10">
                            <LineIcon />
                        </a>
                    </div>

                    <div className="flex items-center justify-center text-xs text-red-200 mt-2 gap-1">
                        <MapPin size={12} />
                        <span>台南 永康區</span>
                    </div>
                </div>

                {/* Decorative Bottom Curve */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#FFFBF0] rounded-t-[2rem]"></div>
            </header>

            {/* Navigation Tabs (Scrollable) */}
            <nav className="sticky top-0 z-40 bg-[#FFFBF0]/95 backdrop-blur shadow-sm">
                <div className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-2">
                    {[
                        { id: 'info', label: '預約須知', icon: Info },
                        { id: 'price', label: '價目表', icon: DollarSign },
                        { id: 'qa', label: 'Q&A', icon: HelpCircle },
                        { id: 'promo', label: '本月活動', icon: Gift },
                        { id: 'booking', label: '預約表單', icon: Calendar },
                        ...(isAdmin ? [{ id: 'admin_schedule', label: '時刻表', icon: Clock }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all
                                ${activeTab === tab.id 
                                    ? 'bg-red-800 text-amber-50 shadow-md' 
                                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-red-50'}
                            `}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-5 pb-20">
                {renderContent()}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 py-6 px-4 text-center text-xs">
                <p className="mb-2">本店擁有店內規則及活動之最終解釋權</p>
                <p className="opacity-50">© 2024 J.Y Beauty Studio</p>
            </footer>

        </div>
    </div>
  );
}

