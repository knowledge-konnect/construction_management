const fs = require('fs');
const path = 'server/src/index.ts';
const src = fs.readFileSync(path, 'utf8');
const routeRe = /app\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]/g;
const routes = [];
let m;
while ((m = routeRe.exec(src)) !== null) {
  routes.push({ method: m[1].toUpperCase(), path: m[2], idx: m.index });
}
for (let i=0;i<routes.length;i++) {
  const start = routes[i].idx;
  const end = i+1<routes.length ? routes[i+1].idx : src.length;
  const block = src.slice(start,end);
  routes[i].requireAuth = /requireAuth\(/.test(block);
  routes[i].authorizeCompany = /authorizeCompany\(/.test(block);
  routes[i].authorizeOwnedResource = /authorizeOwnedResource\(/.test(block);
  routes[i].hasCompanyInput = /requestedCompanyId|body\.companyId|body\.company_id|params as \{ companyId/.test(block);
  routes[i].hasRpcDirect = /\.rpc\(/.test(block);
}
const summary = {
  total: routes.length,
  requireAuthOnly: routes.filter(r=>r.requireAuth && !r.authorizeCompany && !r.authorizeOwnedResource).map(r=>`${r.method} ${r.path}`),
  authorizeCompany: routes.filter(r=>r.authorizeCompany).map(r=>`${r.method} ${r.path}`),
  authorizeOwnedResource: routes.filter(r=>r.authorizeOwnedResource).map(r=>`${r.method} ${r.path}`),
  hasCompanyInput: routes.filter(r=>r.hasCompanyInput).map(r=>`${r.method} ${r.path}`),
  hasRpcDirect: routes.filter(r=>r.hasRpcDirect).map(r=>`${r.method} ${r.path}`),
};
console.log(JSON.stringify(summary,null,2));
