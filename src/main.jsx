import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, LogOut, Plus, Trash2, Upload } from 'lucide-react';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/by_neu';
const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

function money(value) {
  if (!value) return '';
  const onlyNumber = String(value).replace(/[^0-9]/g, '');
  if (!onlyNumber) return value;
  return Number(onlyNumber).toLocaleString('ko-KR') + '원';
}

function formatPriceInput(value) {
  const onlyNumber = String(value).replace(/[^0-9]/g, '');
  if (!onlyNumber) return '';
  return Number(onlyNumber).toLocaleString('ko-KR');
}

function App() {
  const path = window.location.pathname;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return <SetupNotice />;
  if (path === '/admin') return <Admin />;
  if (path === '/product') return <ProductDetail />;
  return <Home />;
}

function SetupNotice() {
  return (
    <main className="setup">
      <h1>NEU</h1>
      <p>Supabase 환경변수가 아직 연결되지 않았습니다.</p>
      <code>VITE_SUPABASE_URL</code>
      <code>VITE_SUPABASE_ANON_KEY</code>
    </main>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a href="/" className="brand">NEU</a>
      <nav>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">DM 문의</a>
        <a href="/admin">Admin</a>
      </nav>
    </header>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <section className="hero">
          <p className="eyebrow">floral & object</p>
          <h1>새로운 형태와 분위기를 제안합니다.</h1>
          <p>상세 이미지를 확인하신 뒤 주문은 Instagram DM으로 문의해주세요.</p>
        </section>

        {loading ? <p className="muted">상품을 불러오는 중입니다.</p> : null}
        {!loading && products.length === 0 ? <p className="muted">공개된 상품이 아직 없습니다.</p> : null}

        <section className="grid">
          {products.map((item) => (
            <a className="card" href={`/product?id=${item.id}`} key={item.id}>
              <div className="thumb">
                {item.cover_image ? <img src={item.cover_image} alt={item.name} /> : <span>No image</span>}
              </div>
              <div className="card-body">
                <h2>{item.name}</h2>
                {item.price ? <p>{money(item.price)}</p> : null}
              </div>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}

function ProductDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return setLoading(false);
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <><Header /><main className="container"><p className="muted">불러오는 중입니다.</p></main></>;
  if (!product) return <><Header /><main className="container"><p className="muted">상품을 찾을 수 없습니다.</p></main></>;

  const images = [product.cover_image, ...(product.detail_images || [])].filter(Boolean);
return (
  <>
    <Header />

    <main className="detail-container">

      <section className="image-stack">
        {(product.detail_images || []).map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`${product.name} 상세 이미지 ${index + 1}`}
          />
        ))}
      </section>

      <section className="product-head">
        <p className="eyebrow"> @by_NEU</p>

        <h1>{product.name}</h1>

        {product.price ? (
          <p className="price">{money(product.price)}</p>
        ) : null}

        {product.description ? (
          <p className="desc">{product.description}</p>
        ) : null}

        <a
          className="dm-button"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
        >
          주문 문의(DM)
        </a>

        {product.cover_image ? (
          <img
            className="detail-cover"
            src={product.cover_image}
            alt={`${product.name} 대표 이미지`}
          />
        ) : null}
      </section>

    </main>
  </>
); }

function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="admin-wrap"><p>확인 중입니다.</p></main>;
  if (!session) return <Login />;
  return <Dashboard user={session.user} />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('로그인 정보를 확인해주세요.');
  }

  return (
    <main className="admin-wrap login-wrap">
      <form className="panel login" onSubmit={submit}>
        <p className="eyebrow">NEU admin</p>
        <h1>관리자 로그인</h1>
        <label>이메일<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label>비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        <button className="primary">로그인</button>
        {message ? <p className="error">{message}</p> : null}
      </form>
    </main>
  );
}

const emptyForm = { name: '', price: '', cover_image: '', detail_images: [], description: '', is_public: false };

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const sortedProducts = useMemo(() => products, [products]);

  async function load() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  useEffect(() => { load(); }, []);

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  async function uploadFiles(files, type) {
    const urls = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${type}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function onCoverChange(e) {
    try {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const [url] = await uploadFiles(files.slice(0, 1), 'cover');
      setForm((prev) => ({ ...prev, cover_image: url }));
    } catch (error) {
      setMessage('대표이미지 업로드에 실패했습니다. Supabase Storage 설정을 확인해주세요.');
    }
  }

  async function onDetailChange(e) {
    try {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const urls = await uploadFiles(files, 'detail');
      setForm((prev) => ({ ...prev, detail_images: [...(prev.detail_images || []), ...urls] }));
    } catch (error) {
      setMessage('상세이미지 업로드에 실패했습니다. Supabase Storage 설정을 확인해주세요.');
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      name: form.name,
      price: form.price,
      cover_image: form.cover_image,
      detail_images: form.detail_images || [],
      description: form.description,
      is_public: form.is_public,
    };
    const result = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload);
    setSaving(false);
    if (result.error) {
      setMessage('저장에 실패했습니다. 입력값과 Supabase 정책을 확인해주세요.');
      return;
    }
    reset();
    await load();
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      price: item.price || '',
      cover_image: item.cover_image || '',
      detail_images: item.detail_images || [],
      description: item.description || '',
      is_public: !!item.is_public,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!confirm('이 상품을 삭제할까요?')) return;
    await supabase.from('products').delete().eq('id', id);
    await load();
  }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <main className="admin-wrap">
      <header className="admin-top">
        <div><p className="eyebrow">NEU admin</p><h1>상품 관리</h1></div>
        <button className="ghost" onClick={signOut}><LogOut size={16} /> 로그아웃</button>
      </header>

      <form className="panel form" onSubmit={save}>
        <div className="form-title">
          <h2>{editingId ? '상품 수정' : '상품 등록'}</h2>
          {editingId ? <button type="button" className="ghost" onClick={reset}>새 상품 등록</button> : null}
        </div>
        <label>상품명<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
       <label>가격
  <input
    value={formatPriceInput(form.price)}
    onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, '') })}
    placeholder="예: 45,000"
    inputMode="numeric"
  />
</label>
        <label>상품설명<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="5" /></label>

        <div className="upload-row">
          <label className="upload-box"><Upload size={18} /> 대표이미지 선택<input hidden type="file" accept="image/*" onChange={onCoverChange} /></label>
{form.cover_image ? (  <div className="cover-preview">    <img className="preview" src={form.cover_image} alt="대표이미지 미리보기" />
    <button      type="button"      className="ghost"      onClick={() => setForm((prev) => ({ ...prev, cover_image: '' }))}    >
      대표이미지 삭제    </button>  </div>) : null}
        </div>

        <div className="upload-row column">
          <label className="upload-box"><Upload size={18} /> 상세이미지 여러장 선택<input hidden type="file" accept="image/*" multiple onChange={onDetailChange} /></label>
          <div className="detail-previews">
            {(form.detail_images || []).map((src, index) => (
              <div className="mini" key={`${src}-${index}`}>
                <img src={src} alt={`상세이미지 ${index + 1}`} />
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, detail_images: prev.detail_images.filter((_, i) => i !== index) }))}>삭제</button>
              </div>
            ))}
          </div>
        </div>

        <label className="check"><input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} /> 공개 상태로 등록</label>

        <button className="primary" disabled={saving}><Plus size={16} /> {saving ? '저장 중' : editingId ? '수정 저장' : '상품 등록'}</button>
        {message ? <p className="error">{message}</p> : null}
      </form>

      <section className="panel list">
        <h2>등록된 상품</h2>
        {sortedProducts.map((item) => (
          <article className="admin-item" key={item.id}>
            <img src={item.cover_image || ''} alt="" />
            <div>
              <h3>{item.name}</h3>
              <p>{moneyitem.price}</p>
              <span>{item.is_public ? <><Eye size={14} /> 공개</> : <><EyeOff size={14} /> 비공개</>}</span>
            </div>
            <div className="actions">
              <a className="ghost" href={`/product?id=${item.id}`} target="_blank">보기</a>
              <button className="ghost" onClick={() => edit(item)}>수정</button>
              <button className="danger" onClick={() => remove(item.id)}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
