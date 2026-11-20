// Optional shared storage for sign-ups + engagement (Upstash Redis via Vercel Marketplace).
// Env: KV_REST_API_URL, KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*), ADMIN_KEY (dashboard password).
const U=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL,T=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
const r=(...c)=>fetch(U,{method:'POST',headers:{Authorization:'Bearer '+T},body:JSON.stringify(c)}).then(x=>x.json());
const c=(v,n)=>String(v||'').slice(0,n);
module.exports=async(q,res)=>{
  if(!U)return res.status(503).json({error:'storage not configured'});
  if(q.method==='POST'){
    const b=typeof q.body==='string'?JSON.parse(q.body||'{}'):q.body||{};
    await r('LPUSH','nuru:ev',JSON.stringify({t:Date.now(),type:c(b.type,20),job:c(b.job,80),q:c(b.q,80),uid:c(b.uid,40)}));
    await r('LTRIM','nuru:ev',0,4999);
    if(b.type==='signup'&&b.user)await r('HSET','nuru:users',c(b.user.id,40),JSON.stringify({id:c(b.user.id,40),name:c(b.user.name,80),email:c(b.user.email,120),role:c(b.user.role,20),t:Date.now()}));
    return res.json({ok:true});
  }
  if(!process.env.ADMIN_KEY||q.query.key!==process.env.ADMIN_KEY)return res.status(401).json({error:'bad key'});
  const ev=((await r('LRANGE','nuru:ev',0,4999)).result||[]).map(JSON.parse),f=(await r('HGETALL','nuru:users')).result||[],users=[];
  for(let i=1;i<f.length;i+=2)users.push(JSON.parse(f[i]));
  res.json({ev,users});
};
