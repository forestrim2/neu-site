import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{Eye,EyeOff,LogOut,Plus,Trash2,Upload,Link as LinkIcon}from'lucide-react';
import'./style.css';

const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const INSTAGRAM_URL=import.meta.env.VITE_INSTAGRAM_URL||'https://instagram.com/by_neu';
const supabase=createClient(SUPABASE_URL||'',SUPABASE_ANON_KEY||'');

function money(value){
  if(!value)return'';
  const onlyNumber=String(value).replace(/[^0-9]/g,'');
  if(!onlyNumber)return value;
  return Number(onlyNumber).toLocaleString('ko-KR')+'원';
}

function formatPriceInput(value){
  const onlyNumber=String(value).replace(/[^0-9]/g,'');
  if(!onlyNumber)return'';
  return Number(onlyNumber).toLocaleString('ko-KR');
}

function App(){
  const path=window.location.pathname;
  if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return<SetupNotice/>;
  if(path==='/admin')return<Admin/>;
if(path==='/product')return<ProductDetail/>;
if(path==='/order')return<OrderForm/>;
return<Home/>;
}

function SetupNotice(){
  return(
    <main className="setup">
      <h1>DINE</h1>
      <p>Supabase 환경변수가 아직 연결되지 않았습니다.</p>
      <code>VITE_SUPABASE_URL</code>
      <code>VITE_SUPABASE_ANON_KEY</code>
    </main>
  );
}

function Header(){
  return(
    <header className="site-header">
      <a href="/" className="brand">NEU</a>
      <nav>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">DM 문의</a>
      </nav>
    </header>
  );
}

function Home(){
  const[products,setProducts]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase
      .from('products')
      .select('*')
      .eq('is_public',true)
      .order('display_order',{ascending:true})
      .order('created_at',{ascending:false})
      .then(({data})=>{
        setProducts(data||[]);
        setLoading(false);
      });
  },[]);

  return(
    <>
      <Header/>
      <main className="container">
        <section className="hero">
          <p className="eyebrow">floral & objet</p>
          <h1>For weddings and meaningful moments</h1>
          <p>상세 이미지를 확인하신 뒤 주문은 Instagram DM으로 문의해주세요.</p>
        </section>

        {loading?<p className="muted">상품을 불러오는 중입니다.</p>:null}
        {!loading&&products.length===0?<p className="muted">공개된 상품이 아직 없습니다.</p>:null}

        <section className="grid">
          {products.map(item=>(
            <a className="card" href={`/product?id=${item.id}`} key={item.id}>
              <div className="thumb">
                {item.cover_image?<img src={item.cover_image} alt={item.name}/>:<span>No image</span>}
              </div>
              <div className="card-body">
                <h2>{item.name}</h2>
              {item.price_options?.length ? (  <p>    {money(      Math
                                                             .min(        ...item.price_options          
                                                              .map(option=>Number(option.price))         
                                                              .filter(price=>price>0)      )    )}~  </p>) : item.price ? (  <p>{money(item.price)}</p>) : null}
              </div>
            </a>
          ))}
        </section>
      </main>
      <footer className="site-footer">
        <a href="/admin">admin</a>
      </footer>
    </>
  );
}

function ProductDetail(){
  const id=new URLSearchParams(window.location.search).get('id');
  const[product,setProduct]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!id){
      setLoading(false);
      return;
    }

    supabase
      .from('products')
      .select('*')
      .eq('id',id)
      .or('is_public.eq.true,link_public.eq.true')
      .single()
      .then(({data})=>{
        setProduct(data||null);
        setLoading(false);
      });
  },[id]);

  if(loading){
    return(
      <>
        <Header/>
        <main className="container">
          <p className="muted">불러오는 중입니다.</p>
          </main>

      <footer className="site-footer">
        <a href="/admin">admin</a>
      </footer>
    </>
  );
}

  if(!product){
    return(
      <>
        <Header/>
        <main className="container">
          <p className="muted">상품을 찾을 수 없습니다.</p>
        </main>
      </>
    );
  }

  return(
    <>
      <Header/>
      <main className="detail-container">
        <section className="image-stack">
          {(product.detail_images||[]).map((src,index)=>(
            <img key={`${src}-${index}`} src={src} alt={`${product.name} 상세 이미지 ${index+1}`}/>
          ))}
        </section>

        <section className="product-head">
          <p className="eyebrow">@by_NEU</p>
          <h1>{product.name}</h1>
         {product.price_options?.length ? (  <div className="price-options-view">   
           {product.price_options.map((option,index)=>(      <div key={index} className="option-line">
        <span>{option.name}</span>        <span>{money(option.price)}</span>
      </div>
    ))}
  </div>
) : product.price ? (
  <p className="price">{money(product.price)}</p>
) : null}
          {product.description?<p className="desc">{product.description}</p>:null}

        <div className="product-actions">
  <a className="dm-button" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
    주문 문의(DM)
  </a>

  {product.order_form_type === 'common' ? (
    <a className="dm-button" href={`/order?type=common&product=${product.id}`}>
      문의서 작성
    </a>
  ) : null}

  {product.order_form_type === 'invitation' ? (
    <a className="dm-button" href={`/order?type=invitation&product=${product.id}`}>
      청첩장 주문서 작성
    </a>
  ) : null}

  {product.order_form_url ? (
    <a className="dm-button" href={product.order_form_url} target="_blank" rel="noreferrer">
      주문서 작성하기
    </a>
  ) : null}
</div>
          
          {product.cover_image?(
            <img className="detail-cover" src={product.cover_image} alt={`${product.name} 대표 이미지`}/>
          ):null}
        </section>
      </main>
    </>
  );
}
function OrderForm(){
  const params=new URLSearchParams(window.location.search);
  const type=params.get('type');
  const productId=params.get('product');

  const[product,setProduct]=useState(null);
  const[saving,setSaving]=useState(false);
  const[done,setDone]=useState(false);
  const[message,setMessage]=useState('');

  const[form,setForm]=useState({
    customer_name:'',
    phone:'',
    groom_name:'',
    groom_name_en:'',
    bride_name:'',
    bride_name_en:'',
    wedding_date:'',
    wedding_time_period:'AM',
    wedding_place:'',
    wedding_address:'',
    wedding_phone:'',
    route_option:'오시는 길 안내',
    route_text:'',
    mobile_qr_link:'',
    groom_father_name:'',
    groom_father_deceased:false,
    groom_mother_name:'',
    groom_mother_deceased:false,
    bride_father_name:'',
    bride_father_deceased:false,
    bride_mother_name:'',
    bride_mother_deceased:false,
    flower_notice:'',
    account_1_bank:'',
    account_1_name:'',
    account_1_number:'',
    account_2_bank:'',
    account_2_name:'',
    account_2_number:''
  });

  const [welcomeForm, setWelcomeForm] = useState({
  customer_name: '',
  phone: '',
  address: '',
  groom_name_en: '',
  bride_name_en: '',
  wedding_date: '',
  lace_type: '',
  font_type: '',
  letter_case: '',
  request_note: ''
});
  
  useEffect(()=>{
    if(!productId)return;
    supabase
      .from('products')
      .select('*')
      .eq('id',productId)
      .single()
      .then(({data})=>setProduct(data||null));
  },[productId]);

  function update(key,value){
    setForm(prev=>({...prev,[key]:value}));
  }
  
function updateWelcome(key,value){
  setWelcomeForm(prev=>({...prev,[key]:value}));
}
  
  async function submit(e){
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const payload={
  product_id:productId,
  product_name:product?.name||'',
  order_type:'welcome_fabric',
  ...welcomeForm,
  status:'접수'
};

    const{error}=await supabase.from('orders').insert(payload);
    setSaving(false);

   if(error){
  setMessage('제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
  return;
}
    setDone(true);
  }

  async function submitWelcome(e){
  e.preventDefault();
  setSaving(true);
  setMessage('');

const payload={
  product_id:productId,
  product_name:product?.name||'',
  order_type:'invitation',
  ...form,
  status:'접수'
};

  const{error}=await supabase.from('orders').insert(payload);
  setSaving(false);

  if(error){
    setMessage('제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  setDone(true);
}


if(type !== 'invitation' && type !== 'welcome_fabric'){
  return(
    <>
      <Header/>
      <main className="container">
        <p className="muted">준비 중인 주문서입니다.</p>
      </main>
    </>
  );
}
  
  if(done){
    return(
      <>
        <Header/>
        <main className="order-container">
          <section className="panel order-form">
            <p className="eyebrow">NEU order</p>
            <h1>주문서가 제출되었습니다.</h1>
            <p className="muted">DM으로 "주문서 작성 완료"라고 보내주세요.</p>
          </section>
        </main>
      </>
    );
  }

   if(type === 'welcome_fabric'){
    return(
      <>
        <Header/>
        <main className="order-container">
          <form className="panel form order-form" onSubmit={submitWelcome}>
            <p className="eyebrow">NEU welcome fabric order</p>
            <h1>웰컴 패브릭 주문서</h1>

            <p className="order-guide">
              ■ 하단의 항목을 빠짐 없이 기재해주세요.
            </p>

            <div className="form-grid two">
              <label>주문자명
                <input value={welcomeForm.customer_name} onChange={e=>updateWelcome('customer_name',e.target.value)} required/>
              </label>

              <label>연락처
                <input value={welcomeForm.phone} onChange={e=>updateWelcome('phone',e.target.value)} required/>
              </label>
            </div>

            <div className="order-divider"></div>

            <div className="form-grid two">
              <label>신랑 영문 이름 (작성해 주신 대로 출력)
                <input value={welcomeForm.groom_name_en} onChange={e=>updateWelcome('groom_name_en',e.target.value)} required/>
              </label>

              <label>신부 영문 이름 (작성해 주신 대로 출력)
                <input value={welcomeForm.bride_name_en} onChange={e=>updateWelcome('bride_name_en',e.target.value)} required/>
              </label>
            </div>

            <label>결혼 날짜 (월│일│년도순)
              <input value={welcomeForm.wedding_date} onChange={e=>updateWelcome('wedding_date',e.target.value)} placeholder="11.07.2026" required/>
            </label>

            <div className="order-divider"></div>

            <label>레이스 (택1)
              <select value={welcomeForm.lace_type} onChange={e=>updateWelcome('lace_type',e.target.value)} required>
                <option value="">선택</option>
                <option value="앤틱">앤틱</option>
                <option value="플라워">플라워</option>
              </select>
            </label>

            <label>폰트 (택1)
              <select value={welcomeForm.font_type} onChange={e=>updateWelcome('font_type',e.target.value)} required>
                <option value="">선택</option>
                <option value="필기체">필기체</option>
                <option value="손글씨체">손글씨체</option>
                <option value="개성체">개성체</option>
              </select>
            </label>

            <label>대소문자 구분 (택1)
              <select value={welcomeForm.letter_case} onChange={e=>updateWelcome('letter_case',e.target.value)} required>
                <option value="">선택</option>
                <option value="대문자">대문자</option>
                <option value="소문자">소문자</option>
              </select>
            </label>

            <label>추가 요청사항 (선택)
              <textarea
                value={welcomeForm.request_note}
                onChange={e=>updateWelcome('request_note',e.target.value)}
                rows="4"
                placeholder="레이아웃 변경을 희망하실 경우 이곳에 기재해주세요."
              />
            </label>

            <button className="primary" disabled={saving}>
              {saving?'제출 중':'제출하기'}
            </button>

            {message?<p className="error">{message}</p>:null}
          </form>
        </main>
      </>
    );
  }

  return(
    <>
      <Header/>
      <main className="order-container">
        <form className="panel form order-form" onSubmit={submit}>
          <p className="eyebrow">NEU invitation order</p>
          <h1>청첩장 주문서</h1>

          <p className="order-guide">
            ■ 하단의 항목을 빠짐 없이 기재해주세요.
          </p>

          <div className="form-grid two">
            <label>주문자명
              <input value={form.customer_name} onChange={e=>update('customer_name',e.target.value)} required/>
            </label>
            <label>연락처
              <input value={form.phone} onChange={e=>update('phone',e.target.value)} required/>
            </label>
          </div>

         <div className="order-divider"></div>

          <div className="form-grid two">
            <label>신랑 한글명
              <input value={form.groom_name} onChange={e=>update('groom_name',e.target.value)} required/>
            </label>
            <label>신랑 영문명
              <input value={form.groom_name_en} onChange={e=>update('groom_name_en',e.target.value)} placeholder="앞면 하단에 기재됩니다." required/>
            </label>
          </div>

          <div className="form-grid two">
            <label>신부 한글명
              <input value={form.bride_name} onChange={e=>update('bride_name',e.target.value)} required/>
            </label>
            <label>신부 영문명
              <input value={form.bride_name_en} onChange={e=>update('bride_name_en',e.target.value)} placeholder="앞면 하단에 기재됩니다." required/>
            </label>
          </div>

          <div className="form-grid two">
            <label>예식 일시
              <input value={form.wedding_date} onChange={e=>update('wedding_date',e.target.value)} placeholder="예: 2026년 11월 7일 토요일 12시" required/>
            </label>
            <label>AM / PM
              <select value={form.wedding_time_period} onChange={e=>update('wedding_time_period',e.target.value)} required>
                <option value="AM">AM 오전</option>
                <option value="PM">PM 오후</option>
              </select>
            </label>
          </div>

          <div className="form-grid two">
            <label>식장명
              <input value={form.wedding_place} onChange={e=>update('wedding_place',e.target.value)} placeholder="뒷면 메인에 기재됩니다." required/>
            </label>
            <label>(선택)식장 연락처
              <input value={form.wedding_phone} onChange={e=>update('wedding_phone',e.target.value)} placeholder="뒷면 오시는 길 안내에 기재됩니다." />
            </label>
          </div>

          <label>식장 주소
            <input value={form.wedding_address} onChange={e=>update('wedding_address',e.target.value)} placeholder="뒷면 메인에 기재됩니다." required/>
          </label>

          <label>오시는 길 안내 or 글귀 (택1)
            <select value={form.route_option} onChange={e=>update('route_option',e.target.value)} required>
              <option value="오시는 길 안내">오시는 길 안내</option>
              <option value="글귀">글귀</option>
            </select>
          </label>

          <label>{form.route_option} 내용
            <textarea value={form.route_text} onChange={e=>update('route_text',e.target.value)} rows="4" required/>
          </label>

          <label>(선택)모바일 청첩장 QR 코드 링크
            <input value={form.mobile_qr_link} onChange={e=>update('mobile_qr_link',e.target.value)} placeholder="QR이 없을 경우 공란 혹은 하트 이미지로 대체됩니다." />
          </label>

          <label>(선택)화환 및 ATM 여부
            <textarea value={form.flower_notice} onChange={e=>update('flower_notice',e.target.value)} rows="3" placeholder="예: 화환은 정중히 사양합니다 / 식장 내 ATM이 없으니 참고 부탁드립니다." />
          </label>

          <div className="honju-section">
            <h2 className="honju-title">혼주 정보</h2>

            <div className="honju-row">
              <div className="honju-side">신랑측 :</div>

              <label className="honju-check">
                <input type="checkbox" checked={form.groom_father_deceased} onChange={e=>update('groom_father_deceased',e.target.checked)}/>
                고인표기
              </label>

              <label>부 성함
                <input value={form.groom_father_name} onChange={e=>update('groom_father_name',e.target.value)} />
              </label>

              <label className="honju-check">
                <input type="checkbox" checked={form.groom_mother_deceased} onChange={e=>update('groom_mother_deceased',e.target.checked)}/>
                고인표기
              </label>

              <label>모 성함
                <input value={form.groom_mother_name} onChange={e=>update('groom_mother_name',e.target.value)} />
              </label>
            </div>

            <div className="honju-row">
              <div className="honju-side">신부측 :</div>

              <label className="honju-check">
                <input type="checkbox" checked={form.bride_father_deceased} onChange={e=>update('bride_father_deceased',e.target.checked)}/>
                고인표기
              </label>

              <label>부 성함
                <input value={form.bride_father_name} onChange={e=>update('bride_father_name',e.target.value)} />
              </label>

              <label className="honju-check">
                <input type="checkbox" checked={form.bride_mother_deceased} onChange={e=>update('bride_mother_deceased',e.target.checked)}/>
                고인표기
              </label>

              <label>모 성함
                <input value={form.bride_mother_name} onChange={e=>update('bride_mother_name',e.target.value)} />
              </label>
            </div>

                    </div>
          
          <h2>(선택)계좌 정보 (최대 2개)</h2>

          <div className="form-grid three">
            <label>은행
              <input value={form.account_1_bank} onChange={e=>update('account_1_bank',e.target.value)}/>
            </label>
            <label>성함
              <input value={form.account_1_name} onChange={e=>update('account_1_name',e.target.value)}/>
            </label>
            <label>계좌번호
              <input value={form.account_1_number} onChange={e=>update('account_1_number',e.target.value)}/>
            </label>
          </div>

          <div className="form-grid three">
            <label>은행
              <input value={form.account_2_bank} onChange={e=>update('account_2_bank',e.target.value)}/>
            </label>
            <label>성함
              <input value={form.account_2_name} onChange={e=>update('account_2_name',e.target.value)}/>
            </label>
            <label>계좌번호
              <input value={form.account_2_number} onChange={e=>update('account_2_number',e.target.value)}/>
            </label>
          </div>

          <button className="primary" disabled={saving}>
            {saving?'제출 중':'제출하기'}
          </button>

          {message?<p className="error">{message}</p>:null}
        </form>
      </main>
    </>
  );
}

function Admin(){
  const[session,setSession]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);
      setLoading(false);
    });
    const{data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setSession(session));
    return()=>listener.subscription.unsubscribe();
  },[]);

  if(loading)return<main className="admin-wrap"><p>확인 중입니다.</p></main>;
  if(!session)return<Login/>;
  return<Dashboard/>;
}

function Login(){
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[message,setMessage]=useState('');

  async function submit(e){
    e.preventDefault();
    setMessage('');
    const{error}=await supabase.auth.signInWithPassword({email,password});
    if(error)setMessage('로그인 정보를 확인해주세요.');
  }

  return(
    <main className="admin-wrap login-wrap">
      <form className="panel login" onSubmit={submit}>
        <p className="eyebrow">NEU admin</p>
        <h1>관리자 로그인</h1>
        <label>이메일<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
        <label>비밀번호<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
        <button className="primary">로그인</button>
        {message?<p className="error">{message}</p>:null}
      </form>
    </main>
  );
}

const emptyForm={
  name:'',
  price:'',
  price_options:[],
  display_order:999,
  cover_image:'',
  detail_images:[],
  description:'',
  order_form_url:'',
  use_order_form:false,
  order_form_type:'none',
  is_public:false,
  link_public:false
};

function Dashboard(){
  const[products,setProducts]=useState([]);
  const[orders,setOrders]=useState([]);
  const[activeTab,setActiveTab]=useState('products');
  const[selectedOrder,setSelectedOrder]=useState(null);
  const[orderSearch,setOrderSearch]=useState('');
  const[form,setForm]=useState(emptyForm);
  const[editingId,setEditingId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[message,setMessage]=useState('');

  const sortedProducts=useMemo(()=>products,[products]);

  async function load(){
    const{data:productData}=await supabase
      .from('products')
      .select('*')
      .order('display_order',{ascending:true})
      .order('created_at',{ascending:false});

    setProducts(productData||[]);

    const{data:orderData,error:orderError}=await supabase
      .from('orders')
      .select('*')
      .order('created_at',{ascending:false});

    if(orderError){
      console.log(orderError);
      setMessage('주문서를 불러오지 못했습니다. Supabase orders 정책을 확인해주세요.');
      return;
    }

    setOrders(orderData||[]);
  }

  useEffect(()=>{load();},[]);

  function reset(){
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  async function uploadFiles(files,type){
    const urls=[];

    for(const file of files){
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
      const path=`${type}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

      const{error}=await supabase.storage
        .from('product-images')
        .upload(path,file,{upsert:false});

      if(error) throw error;

      const{data}=supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function onCoverChange(e){
    try{
      const files=Array.from(e.target.files||[]);
      if(!files.length)return;
      const[url]=await uploadFiles(files.slice(0,1),'cover');
      setForm(prev=>({...prev,cover_image:url}));
    }catch(error){
      setMessage('대표이미지 업로드에 실패했습니다. Supabase Storage 설정을 확인해주세요.');
    }
  }

  async function onDetailChange(e){
    try{
      const files=Array.from(e.target.files||[]);
      if(!files.length)return;
      const urls=await uploadFiles(files,'detail');
      setForm(prev=>({...prev,detail_images:[...(prev.detail_images||[]),...urls]}));
    }catch(error){
      setMessage('상세이미지 업로드에 실패했습니다. Supabase Storage 설정을 확인해주세요.');
    }
  }

  async function save(e){
    e.preventDefault();
    setSaving(true);
    setMessage('');

const payload={
  name:form.name,
  price:form.price,
  price_options:form.price_options||[],
  display_order:form.display_order,
  cover_image:form.cover_image,
  detail_images:form.detail_images||[],
  description:form.description,
  order_form_url:form.order_form_url,
  use_order_form:form.use_order_form,
  order_form_type:form.order_form_type,
  is_public:form.is_public,
  link_public:form.link_public
};

    const result=editingId
      ?await supabase.from('products').update(payload).eq('id',editingId)
      :await supabase.from('products').insert(payload);

    setSaving(false);

    if(result.error){
      setMessage('저장에 실패했습니다. 입력값과 Supabase 정책을 확인해주세요.');
      return;
    }

    reset();
    await load();
  }

  function edit(item){
    setEditingId(item.id);
setForm({
  name:item.name||'',
  price:item.price||'',
  price_options:item.price_options||[],
  display_order:item.display_order||999,
  cover_image:item.cover_image||'',
  detail_images:item.detail_images||[],
  description:item.description||'',
  order_form_url:item.order_form_url||'',
  use_order_form:!!item.use_order_form,
  order_form_type:item.order_form_type||'none',
  is_public:!!item.is_public,
  link_public:!!item.link_public
});
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function remove(id){
    if(!confirm('이 상품을 삭제할까요?'))return;
    await supabase.from('products').delete().eq('id',id);
    await load();
  }

  async function signOut(){
    await supabase.auth.signOut();
  }

  return(
    <main className="admin-wrap">
  <header className="admin-top">
  <div>
    <p className="eyebrow">NEU admin</p>
    <h1>{activeTab === 'products' ? '상품 관리' : '청첩장 상세'}</h1>
  </div>
  <button className="ghost" onClick={signOut}><LogOut size={16}/> 로그아웃</button>
</header>

<div className="admin-tabs">
  <button
    type="button"
    className={activeTab === 'products' ? 'active' : ''}
    onClick={()=>setActiveTab('products')}
  >
    상품 관리
  </button>

  <button
    type="button"
    className={activeTab === 'orders' ? 'active' : ''}
    onClick={()=>setActiveTab('orders')}
  >
    청첩장 상세
  </button>
</div>

      {activeTab === 'products' ? (
  <>
    
      <form className="panel form" onSubmit={save}>
        <div className="form-title">
          <h2>{editingId?'상품 수정':'상품 등록'}</h2>
          {editingId?<button type="button" className="ghost" onClick={reset}>새 상품 등록</button>:null}
        </div>

        <label>상품명
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        </label>

        <label>가격
          <input
            value={formatPriceInput(form.price)}
            onChange={e=>setForm({...form,price:e.target.value.replace(/[^0-9]/g,'')})}
            placeholder="예:45,000"
            inputMode="numeric"
          />
        </label>
        <div className="price-options">
  <h3>옵션 가격</h3>

  {(form.price_options||[]).map((option,index)=>(
    <div className="price-option-row" key={index}>
      <input
        value={option.name||''}
        onChange={e=>{
          const next=[...(form.price_options||[])];
          next[index]={...next[index],name:e.target.value};
          setForm({...form,price_options:next});
        }}
        placeholder="옵션명"
      />

      <input
        value={formatPriceInput(option.price||'')}
        onChange={e=>{
          const next=[...(form.price_options||[])];
          next[index]={...next[index],price:e.target.value.replace(/[^0-9]/g,'')};
          setForm({...form,price_options:next});
        }}
        placeholder="가격"
        inputMode="numeric"
      />

      <button
        type="button"
        className="ghost"
        onClick={()=>{
          const next=(form.price_options||[]).filter((_,i)=>i!==index);
          setForm({...form,price_options:next});
        }}
      >
        삭제
      </button>
    </div>
  ))}

  <button
    type="button"
    className="ghost"
    onClick={()=>setForm({
      ...form,
      price_options:[...(form.price_options||[]),{name:'',price:''}]
    })}
  >
    옵션 추가
  </button>
</div>

        <label>노출순서
          <input
            type="number"
            value={form.display_order}
            onChange={e=>setForm({...form,display_order:Number(e.target.value)})}
            placeholder="1"
          />
        </label>

        <label>상품설명
          <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows="5"/>
        </label>
        <label>주문서 링크(지금사용안함)
  <input
    value={form.order_form_url || ''}
    onChange={e=>setForm({...form,order_form_url:e.target.value})}
    placeholder="https://forms.gle/..."
  />
</label>

        <div className="upload-row">
          <label className="upload-box"><Upload size={18}/> 대표이미지 선택
            <input hidden type="file" accept="image/*" onChange={onCoverChange}/>
          </label>

          {form.cover_image?(
            <div className="cover-preview">
              <img className="preview" src={form.cover_image} alt="대표이미지 미리보기"/>
              <button type="button" className="ghost" onClick={()=>setForm(prev=>({...prev,cover_image:''}))}>
                대표이미지 삭제
              </button>
            </div>
          ):null}
        </div>

        <div className="upload-row column">
          <label className="upload-box"><Upload size={18}/> 상세이미지 여러장 선택
            <input hidden type="file" accept="image/*" multiple onChange={onDetailChange}/>
          </label>

          <div className="detail-previews">
            {(form.detail_images||[]).map((src,index)=>(
              <div className="mini" key={`${src}-${index}`}>
                <img src={src} alt={`상세이미지 ${index+1}`}/>
                <button
                  type="button"
                  onClick={()=>setForm(prev=>({...prev,detail_images:prev.detail_images.filter((_,i)=>i!==index)}))}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={e=>setForm({...form,is_public:e.target.checked})}
          />
          메인에 공개
        </label>
        
       <label>
  주문서 종류
  <select
    value={form.order_form_type}
    onChange={e=>setForm({...form,order_form_type:e.target.value})}
  >
    <option value="none">없음</option>
    <option value="common">공통 주문서</option>
    <option value="invitation">청첩장 주문서</option>
    <option value="welcome_fabric">웰컴 패브릭 주문서</option>
  </select>
</label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.link_public}
            onChange={e=>setForm({...form,link_public:e.target.checked})}
          />
          링크로 접근 허용
        </label>

        <button className="primary" disabled={saving}>
          <Plus size={16}/> {saving?'저장 중':editingId?'수정 저장':'상품 등록'}
        </button>

        {message?<p className="error">{message}</p>:null}
      </form>

      <section className="panel list">
        <h2>등록된 상품</h2>

        {sortedProducts.map(item=>(
          <article className="admin-item" key={item.id}>
            <img src={item.cover_image||''} alt=""/>

            <div>
              <h3>{item.name}</h3>
              <p>{money(item.price)}</p>
              <span>
                {item.is_public?<><Eye size={14}/> 메인 공개</>:item.link_public?<><LinkIcon size={14}/> 링크 공개</>:<><EyeOff size={14}/> 비공개</>}
              </span>
            </div>

            <div className="actions">
              {(item.is_public||item.link_public)?(
                <a className="ghost" href={`/product?id=${item.id}`} target="_blank">보기</a>
              ):null}
              <button className="ghost" onClick={()=>edit(item)}>수정</button>
              <button className="danger" onClick={()=>remove(item.id)}><Trash2 size={15}/></button>
            </div>
          </article>
        ))}
      </section>

    </>
  ) : null}

      {activeTab === 'orders' ? (
  <section className="panel list">
<h2>접수된 주문서</h2>

<input
  className="order-search"
  placeholder="주문자명 검색"
  value={orderSearch}
  onChange={e=>setOrderSearch(e.target.value)}
/>

<div className="orders-layout">
  <div className="orders-list">
    {orders.length===0?<p className="muted">접수된 주문서가 없습니다.</p>:null}

    {orders
  .filter(order=>
    (order.customer_name || '')
      .toLowerCase()
      .includes(orderSearch.toLowerCase())
  )
  .map(order=>(
      <div
        key={order.id}
        className={`order-card ${selectedOrder?.id===order.id ? 'active' : ''}`}
        onClick={()=>setSelectedOrder(order)}
      >
        <h3>{order.customer_name || '이름 없음'}</h3>
        <p>{order.phone || '-'}</p>
      <p>
  {order.order_type === 'welcome_fabric'
    ? '웰컴 패브릭'
    : '청첩장'}
</p>

<p>
  {order.customer_name || '-'}
</p>
      </div>
    ))}
  </div>

<div className="orders-detail">
  {selectedOrder ? (
    <div className="order-detail-view">
      <h2>주문서 상세</h2>

      {selectedOrder.order_type === 'welcome_fabric' ? (
  <>
    <div className="detail-grid two">
      <div>
        <strong>주문자명</strong>
        <p>{selectedOrder.customer_name || '-'}</p>
      </div>
      <div>
        <strong>연락처</strong>
        <p>{selectedOrder.phone || '-'}</p>
      </div>
    </div>

    <div className="order-divider"></div>

    <div className="detail-grid two">
      <div>
        <strong>신랑 영문 이름</strong>
        <p>{selectedOrder.groom_name_en || '-'}</p>
      </div>
      <div>
        <strong>신부 영문 이름</strong>
        <p>{selectedOrder.bride_name_en || '-'}</p>
      </div>
    </div>

    <div className="detail-block">
      <strong>결혼 날짜</strong>
      <p>{selectedOrder.wedding_date || '-'}</p>
    </div>

    <div className="order-divider"></div>

    <div className="detail-grid three">
      <div>
        <strong>레이스</strong>
        <p>{selectedOrder.lace_type || '-'}</p>
      </div>
      <div>
        <strong>폰트</strong>
        <p>{selectedOrder.font_type || '-'}</p>
      </div>
      <div>
        <strong>대소문자 구분</strong>
        <p>{selectedOrder.letter_case || '-'}</p>
      </div>
    </div>

    <div className="detail-block">
      <strong>추가 요청사항</strong>
      <p>{selectedOrder.request_note || '-'}</p>
    </div>
  </>
) : (
      <>
      <div className="detail-grid two">
        <div>
          <strong>주문자명</strong>
          <p>{selectedOrder.customer_name || '-'}</p>
        </div>
        <div>
          <strong>연락처</strong>
          <p>{selectedOrder.phone || '-'}</p>
        </div>
      </div>

      <div className="order-divider"></div>

      <div className="detail-grid two">
        <div>
          <strong>신랑 한글명</strong>
          <p>{selectedOrder.groom_name || '-'}</p>
        </div>
        <div>
          <strong>신랑 영문명</strong>
          <p>{selectedOrder.groom_name_en || '-'}</p>
        </div>
      </div>

      <div className="detail-grid two">
        <div>
          <strong>신부 한글명</strong>
          <p>{selectedOrder.bride_name || '-'}</p>
        </div>
        <div>
          <strong>신부 영문명</strong>
          <p>{selectedOrder.bride_name_en || '-'}</p>
        </div>
      </div>

      <div className="detail-grid two">
        <div>
          <strong>예식 일시</strong>
          <p>{selectedOrder.wedding_date || '-'}</p>
        </div>
       <div>
  <strong>AM / PM</strong>
  <p>{selectedOrder.wedding_time_period || selectedOrder.wedding_time || '-'}</p>
</div>
      </div>

      <div className="detail-grid two">
        <div>
          <strong>식장명</strong>
          <p>{selectedOrder.wedding_place || '-'}</p>
        </div>
        <div>
          <strong>식장 연락처</strong>
          <p>{selectedOrder.wedding_phone || '-'}</p>
        </div>
      </div>

      <div className="detail-block">
  <strong>식장 주소</strong>
  <p>{selectedOrder.wedding_address || selectedOrder.wedding_addre || '-'}</p>
</div>

      <div className="detail-block">
        <strong>{selectedOrder.route_option || '오시는 길 안내'}</strong>
        <p>{selectedOrder.route_text || '-'}</p>
      </div>

      <div className="detail-block">
        <strong>모바일 청첩장 QR 코드 링크</strong>
      <p>{selectedOrder.mobile_qr_link || selectedOrder.mobile_qr_lir || '-'}</p>
      </div>

      <div className="detail-block">
        <strong>화환 및 ATM 여부</strong>
        <p>{selectedOrder.flower_notice || '-'}</p>
      </div>

      <div className="order-divider"></div>

      <h3>혼주 정보</h3>

      <div className="detail-grid two">
        <div>
          <strong>신랑측 부</strong>
          <p>{selectedOrder.groom_father_deceased ? '고 ' : ''}{selectedOrder.groom_father_name || '-'}</p>
        </div>
        <div>
          <strong>신랑측 모</strong>
          <p>{selectedOrder.groom_mother_deceased ? '고 ' : ''}{selectedOrder.groom_mother_name || '-'}</p>
        </div>
      </div>

      <div className="detail-grid two">
        <div>
          <strong>신부측 부</strong>
          <p>{selectedOrder.bride_father_deceased ? '고 ' : ''}{selectedOrder.bride_father_name || '-'}</p>
        </div>
        <div>
          <strong>신부측 모</strong>
          <p>{selectedOrder.bride_mother_deceased ? '고 ' : ''}{selectedOrder.bride_mother_name || '-'}</p>
        </div>
      </div>

      <div className="order-divider"></div>

      <h3>계좌 정보</h3>

      <div className="detail-grid three">
        <div>
          <strong>은행</strong>
          <p>{selectedOrder.account_1_bank || '-'}</p>
        </div>
        <div>
          <strong>성함</strong>
          <p>{selectedOrder.account_1_name || '-'}</p>
        </div>
        <div>
          <strong>계좌번호</strong>
          <p>{selectedOrder.account_1_number || '-'}</p>
        </div>
      </div>

      <div className="detail-grid three">
        <div>
          <strong>은행</strong>
          <p>{selectedOrder.account_2_bank || '-'}</p>
        </div>
        <div>
          <strong>성함</strong>
          <p>{selectedOrder.account_2_name || '-'}</p>
        </div>
        <div>
          <strong>계좌번호</strong>
          <p>{selectedOrder.account_2_number || '-'}</p>
        </div>
      </div>
          </>
)}
    </div>
  ) : (
    <p className="muted">주문서를 선택해주세요.</p>
  )}
</div>

</div>
    
</section>
  ) : null}

    </main>
  );
}
createRoot(document.getElementById('root')).render(<App/>);
